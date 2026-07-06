<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AiPredictionService;
use App\Models\MlPredictionsHistory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAiAnalyticsController extends Controller
{
    use ApiResponse;

    public function __construct(
        private AiPredictionService $predictionService,
    ) {
    }

    /**
     * Overall AI usage dashboard
     * GET /api/v1/admin/ai-center/analytics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $analytics = $this->predictionService->getAdminAnalytics();

        return $this->successResponse($analytics, 'تم جلب إحصائيات الذكاء الاصطناعي');
    }

    /**
     * Per-model statistics
     * GET /api/v1/admin/ai-center/models/{model}/stats
     */
    public function modelStats(Request $request, string $model): JsonResponse
    {
        $validModels = ['gestational_diabetes', 'preeclampsia', 'preterm_birth'];
        if (!in_array($model, $validModels)) {
            return $this->errorResponse('نوع النموذج غير صالح', 404);
        }

        $stats = MlPredictionsHistory::forDisease($model);

        $data = [
            'total' => (clone $stats)->count(),
            'this_month' => (clone $stats)->where('created_at', '>=', now()->startOfMonth())->count(),
            'high_risk' => (clone $stats)->highRisk()->count(),
            'avg_confidence' => (clone $stats)->avg('confidence_score'),
            'avg_processing_time_ms' => (clone $stats)->avg('processing_time_ms'),
            'risk_distribution' => (clone $stats)
                ->selectRaw('risk_level, COUNT(*) as count')
                ->whereNotNull('risk_level')
                ->groupBy('risk_level')
                ->pluck('count', 'risk_level'),
            'daily_trend' => (clone $stats)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ];

        return $this->successResponse($data, 'تم جلب إحصائيات النموذج');
    }

    /**
     * All models overview statistics
     * GET /api/v1/admin/ai-center/models-stats
     */
    public function allModelsStats(Request $request): JsonResponse
    {
        $names = [
             'gestational_diabetes' => 'سكري الحمل',
             'preeclampsia' => 'تسمم الحمل',
             'preterm_birth' => 'الولادة المبكرة',
        ];

        $desc = [
             'gestational_diabetes' => 'نموذج التنبؤ بخطر الإصابة بسكري الحمل',
             'preeclampsia' => 'نموذج التنبؤ باحتمالية تسمم الحمل',
             'preterm_birth' => 'نموذج التنبؤ بخطر الولادة المبكرة',
        ];

        $stats = [];
        foreach ($names as $model => $label) {
            $q = MlPredictionsHistory::where('disease_type', $model);
            $stats[] = [
                'disease_type' => $model,
                'model_name_ar' => $names[$model],
                'description' => $desc[$model],
                'usage_count' => (clone $q)->count(),
                'average_confidence' => (float) ((clone $q)->avg('confidence_score') ?? 0),
            ];
        }

        return $this->successResponse($stats, 'تم جلب إحصائيات كافة النماذج');
    }

    /**
     * Risk distribution chart data
     * GET /api/v1/admin/ai-center/risk-distribution
     */
    public function riskDistribution(Request $request): JsonResponse
    {
        $distribution = MlPredictionsHistory::selectRaw('
                risk_level,
                COUNT(*) as count
            ')
            ->whereNotNull('risk_level')
            ->groupBy('risk_level')
            ->pluck('count', 'risk_level');

        $data = [
             'low' => $distribution['low'] ?? 0,
             'moderate' => $distribution['moderate'] ?? 0,
             'high' => $distribution['high'] ?? 0,
        ];

        return $this->successResponse($data, 'تم جلب توزيع المخاطر');
    }
}
