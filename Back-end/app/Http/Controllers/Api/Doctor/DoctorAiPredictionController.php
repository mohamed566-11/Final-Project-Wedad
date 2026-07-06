<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\MlPredictionsHistory;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorAiPredictionController extends Controller
{
    use ApiResponse;

    /**
     * Get AI prediction stats across doctor's patients
     * GET /api/v1/doctor/ai-center/stats
     */
    public function predictionStats(Request $request): JsonResponse
    {
        $doctor = $request->user();

        // Get patient IDs this doctor has seen
        $patientIds = $doctor->patients()->pluck('users.id');

        $totalPredictions = MlPredictionsHistory::whereIn('user_id', $patientIds)->count();
        $highRiskCount = MlPredictionsHistory::whereIn('user_id', $patientIds)->highRisk()->count();
        $recentPredictions = MlPredictionsHistory::whereIn('user_id', $patientIds)
            ->recent(7)
            ->count();

        $byDisease = MlPredictionsHistory::whereIn('user_id', $patientIds)
            ->selectRaw('disease_type, COUNT(*) as count')
            ->groupBy('disease_type')
            ->pluck('count', 'disease_type')
            ->toArray();

        // High-risk patients requiring attention
        $highRiskPatients = MlPredictionsHistory::whereIn('user_id', $patientIds)
            ->highRisk()
            ->with('patient:id,name,email,image')
            ->latest()
            ->take(10)
            ->get()
            ->unique('user_id')
            ->values();

        return $this->successResponse([
            'total_predictions' => $totalPredictions,
            'high_risk_count' => $highRiskCount,
            'recent_7_days' => $recentPredictions,
            'by_disease' => $byDisease,
            'high_risk_patients' => $highRiskPatients,
        ], 'تم جلب إحصائيات مركز الذكاء الاصطناعي');
    }

    /**
     * Get all predictions across all doctor's patients
     * GET /api/v1/doctor/ai-center/predictions
     */
    public function index(Request $request): JsonResponse
    {
        $doctor = $request->user();
        $patientIds = $doctor->patients()->pluck('users.id');

        $query = MlPredictionsHistory::whereIn('user_id', $patientIds)->with('patient:id,name,email,image');

        if ($request->filled('model')) {
            $query->where('disease_type', $request->input('model'));
        }
        if ($request->filled('risk_level')) {
            $query->where('risk_level', $request->input('risk_level'));
        }

        $predictions = $query->orderByDesc('created_at')->paginate(15);
        
        return $this->successResponse($predictions, 'تم جلب التنبؤات');
    }

    /**
     * Get prediction details
     * GET /api/v1/doctor/ai-center/predictions/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $doctor = $request->user();
        $patientIds = $doctor->patients()->pluck('users.id');

        $prediction = MlPredictionsHistory::whereIn('user_id', $patientIds)
            ->with(['patient:id,name,email,image', 'predictable'])
            ->findOrFail($id);

        return $this->successResponse($prediction, 'تم جلب تفاصيل التنبؤ');
    }

    /**
     * View all AI predictions for a specific patient
     * GET /api/v1/doctor/ai-center/patients/{id}/predictions
     */
    public function patientPredictions(Request $request, int $id): JsonResponse
    {
        $doctor = $request->user();

        // Verify doctor-patient relationship
        $patient = $doctor->patients()->where('users.id', $id)->first();
        if (!$patient) {
            return $this->errorResponse('لا يوجد صلاحية للوصول لبيانات هذه المريضة', 403);
        }

        $predictions = MlPredictionsHistory::where('user_id', $id)
            ->with('predictable')
            ->orderByDesc('created_at')
            ->paginate(15);

        $latestByType = [
            'gdm' => $patient->gestationalDiabetesPredictions()->latest()->first(),
            'preeclampsia' => $patient->preeclampsiaPredictions()->latest()->first(),
            'preterm_birth' => $patient->pretermBirthPredictions()->latest()->first(),
        ];

        return $this->successResponse([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
            ],
            'predictions' => $predictions,
            'latest_by_type' => $latestByType,
        ], 'تم جلب تنبؤات المريضة');
    }

    /**
     * Add doctor comment on a prediction
     * POST /api/v1/doctor/ai-center/predictions/{id}/comment
     */
    public function addComment(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'comment' => 'required|string|max:1000',
        ], [
            'comment.required' => 'التعليق مطلوب',
        ]);

        $history = MlPredictionsHistory::with('predictable')->findOrFail($id);

        // Verify doctor-patient relationship
        $doctor = $request->user();
        $patientExists = $doctor->patients()->where('users.id', $history->user_id)->exists();
        if (!$patientExists) {
            return $this->errorResponse('لا يوجد صلاحية', 403);
        }

        // Update the prediction with doctor comment
        if ($history->predictable) {
            $history->predictable->update([
                'doctor_id' => $doctor->id,
                'doctor_comments' => $request->input('comment'),
            ]);
        }

        return $this->successResponse(null, 'تم إضافة التعليق بنجاح');
    }
}
