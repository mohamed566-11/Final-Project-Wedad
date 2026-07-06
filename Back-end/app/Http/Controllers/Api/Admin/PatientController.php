<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LifeStage;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use App\Services\CacheService;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PatientController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected NotificationService $notificationService
    ) {
    }

    /**
     * Get all patients with filters
     * GET /api/v1/admin/patients
     */
    public function index(Request $request)
    {
        $query = User::with(['lifeStage', 'profile']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Active status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Email verification filter
        if ($request->has('is_verified')) {
            if ($request->boolean('is_verified')) {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        // Life stage filter
        if ($request->filled('life_stage_id')) {
            $query->where('life_stage_id', $request->life_stage_id);
        }

        // Sort options
        $sortBy = $request->input('sort_by', 'newest');
        switch ($sortBy) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'name':
                $query->orderBy('name', 'asc');
                break;
            case 'most_active':
                $query->orderByDesc('last_login_at');
                break;
            case 'newest':
            default:
                $query->orderByDesc('created_at');
                break;
        }

        $patients = $query->paginate(15);

        // Get statistics (Cached)
        $stats = Cache::remember('admin.patients.stats', CacheService::DURATION_SHORT, function () {
            return [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'inactive' => User::where('is_active', false)->count(),
                'verified' => User::whereNotNull('email_verified_at')->count(),
                'unverified' => User::whereNull('email_verified_at')->count(),
            ];
        });

        // Transform patients data
        $transformedPatients = $patients->getCollection()->map(function ($patient) {
            return $this->transformPatient($patient);
        });

        return $this->successResponse([
            'patients' => $transformedPatients,
            'stats' => $stats,
            'pagination' => [
                'total' => $patients->total(),
                'per_page' => $patients->perPage(),
                'current_page' => $patients->currentPage(),
                'last_page' => $patients->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific patient details
     * GET /api/v1/admin/patients/{id}
     */
    public function show($id)
    {
        $patient = User::with(['lifeStage', 'profile', 'consultations', 'moodEntries', 'weightEntries', 'pregnancies'])
            ->find($id);

        if (!$patient) {
            return $this->errorResponse('المريض غير موجود', 404);
        }

        $consultationStats = [
            'total' => $patient->consultations->count(),
            'completed' => $patient->consultations->where('status', 'completed')->count(),
            'cancelled' => $patient->consultations->whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor'])->count(),
            'upcoming' => $patient->consultations->where('status', 'confirmed')->where('date', '>=', Carbon::today())->count(),
        ];

        $activityStats = [
            'mood_entries' => $patient->moodEntries->count(),
            'weight_entries' => $patient->weightEntries->count(),
            'pregnancy_active' => $patient->pregnancies->where('is_active', true)->count() > 0,
        ];

        // Calculate profile completion
        $profileCompletion = $this->calculateProfileCompletion($patient);

        return $this->successResponse([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'age' => $patient->age,
                'life_stage' => $patient->lifeStage ? [
                    'id' => $patient->lifeStage->id,
                    'name' => $patient->lifeStage->name,
                    'display_name' => $this->getLifeStageDisplayName($patient->lifeStage->name),
                ] : null,
                'profile' => $patient->profile ? [
                    'height' => $patient->profile->height,
                    'weight' => $patient->profile->weight,
                    'blood_type' => $patient->profile->blood_type,
                    'chronic_diseases' => $patient->profile->chronic_diseases ?? [],
                    'allergies' => $patient->profile->allergies ?? [],
                    'emergency_contact' => $patient->profile->emergency_contact,
                    'emergency_phone' => $patient->profile->emergency_phone,
                ] : null,
                'is_active' => $patient->is_active,
                'is_verified' => $patient->email_verified_at !== null,
                'email_verified_at' => $patient->email_verified_at?->format('Y-m-d H:i:s'),
                'joined_at' => $patient->created_at->format('Y-m-d'),
                'last_login_at' => $patient->last_login_at?->format('Y-m-d H:i:s'),
                'image_url' => $patient->image
                    ? (str_starts_with($patient->image, 'http') ? $patient->image : url('profiles/' . $patient->image))
                    : url('profiles/default-avatar.png'),
                'profile_completion' => $profileCompletion,
            ],
            'consultations' => $consultationStats,
            'activity' => $activityStats,
        ]);
    }

    /**
     * Toggle patient account status
     * PUT /api/v1/admin/patients/{id}/toggle-status
     */
    public function toggleStatus(Request $request, $id)
    {
        $patient = User::find($id);

        if (!$patient) {
            return $this->errorResponse('المريض غير موجود', 404);
        }

        $request->validate([
            'is_active' => 'required|boolean',
            'reason' => 'required_if:is_active,false|nullable|string|max:500',
        ], [
            'is_active.required' => 'حالة الحساب مطلوبة',
            'reason.required_if' => 'سبب الإيقاف مطلوب عند إيقاف الحساب',
        ]);

        $patient->update([
            'is_active' => $request->is_active,
        ]);

        // If deactivating, revoke all tokens
        if (!$request->is_active) {
            $patient->tokens()->delete();
            Log::info("Patient #{$patient->id} deactivated. Reason: {$request->reason}");
            $this->notificationService->notifyPatientDeactivated($patient, $request->reason);
        }

        $message = $request->is_active
            ? 'تم تفعيل حساب المريض بنجاح'
            : 'تم إيقاف حساب المريض بنجاح';

        return $this->successResponse([
            'patient' => [
                'id' => $patient->id,
                'is_active' => $patient->is_active,
            ],
        ], $message);
    }

    /**
     * Delete patient account (soft delete)
     * DELETE /api/v1/admin/patients/{id}
     */
    public function destroy($id)
    {
        $patient = User::find($id);

        if (!$patient) {
            return $this->errorResponse('المريض غير موجود', 404);
        }

        // Revoke all tokens before deletion
        $patient->tokens()->delete();

        // Soft delete
        $patient->delete();

        return $this->successResponse(null, 'تم حذف حساب المريض بنجاح');
    }

    /**
     * Get life stages for filtering
     * GET /api/v1/admin/patients/life-stages
     */
    public function lifeStages()
    {
        $lifeStages = LifeStage::all()->map(function ($stage) {
            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'display_name' => $this->getLifeStageDisplayName($stage->name),
            ];
        });

        return $this->successResponse([
            'life_stages' => $lifeStages,
        ]);
    }

    /**
     * Transform patient data
     */
    private function transformPatient(User $patient): array
    {
        return [
            'id' => $patient->id,
            'name' => $patient->name,
            'email' => $patient->email,
            'phone' => $patient->phone,
            'age' => $patient->age,
            'life_stage' => $patient->lifeStage ? [
                'id' => $patient->lifeStage->id,
                'name' => $patient->lifeStage->name,
                'display_name' => $this->getLifeStageDisplayName($patient->lifeStage->name),
            ] : null,
            'is_active' => $patient->is_active,
            'is_verified' => $patient->email_verified_at !== null,
            'joined_at' => $patient->created_at->format('Y-m-d'),
            'last_login' => $patient->last_login_at
                ? $this->getHumanReadableTime($patient->last_login_at)
                : null,
            'total_consultations' => $patient->consultations_count ?? $patient->consultations()->count(),
            'profile_completion' => $this->calculateProfileCompletion($patient),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($patient->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
        ];
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateProfileCompletion(User $patient): int
    {
        $fields = [
            !empty($patient->name),
            !empty($patient->email),
            !empty($patient->phone),
            !empty($patient->age),
            !empty($patient->life_stage_id),
            !empty($patient->image),
            $patient->profile && !empty($patient->profile->height),
            $patient->profile && !empty($patient->profile->weight),
            $patient->profile && !empty($patient->profile->blood_type),
            $patient->profile && !empty($patient->profile->emergency_contact),
        ];

        $completed = count(array_filter($fields));
        return (int) round(($completed / count($fields)) * 100);
    }

    /**
     * Get human readable time
     */
    private function getHumanReadableTime(Carbon $date): string
    {
        $now = Carbon::now();
        $diff = $date->diffInMinutes($now);

        if ($diff < 1) {
            return 'الآن';
        } elseif ($diff < 60) {
            return 'منذ ' . $diff . ' دقيقة';
        } elseif ($diff < 1440) {
            $hours = floor($diff / 60);
            return 'منذ ' . $hours . ' ساعة';
        } elseif ($diff < 10080) {
            $days = floor($diff / 1440);
            return 'منذ ' . $days . ' يوم';
        } else {
            return $date->format('Y-m-d');
        }
    }

    /**
     * Get life stage display name
     */
    private function getLifeStageDisplayName(string $name): string
    {
        return TranslationHelper::lifeStage($name);
    }
}
