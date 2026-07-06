<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Services\AiPredictionService;
use App\Services\PatientDataCollectorService;
use App\Services\Patient\PatientDataCollectorService as ChatbotDataCollector;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AiPredictionController extends Controller
{
    use ApiResponse;

    public function __construct(
        private AiPredictionService $predictionService,
        private PatientDataCollectorService $dataCollector,
    ) {
    }

    /**
     * AI Center Hub — summary + latest results
     * GET /api/v1/patient/ai-center
     */
    public function hub(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = $this->predictionService->getStats($user);

        return $this->successResponse([
            'stats' => $stats,
            'models' => [
                [
                    'id' => 'gdm',
                    'name_ar' => 'فحص سكري الحمل',
                    'name_en' => 'Gestational Diabetes Screening',
                    'description_ar' => 'فحص مبكر لمخاطر سكري الحمل بدون تحاليل مخبرية',
                    'icon' => 'activity',
                    'accuracy' => '95.84%',
                    'latest' => $stats['latest']['gdm'],
                ],
                [
                    'id' => 'preeclampsia',
                    'name_ar' => 'فحص تسمم الحمل',
                    'name_en' => 'Preeclampsia Screening',
                    'description_ar' => 'تقييم مخاطر تسمم الحمل باستخدام القياسات السريرية',
                    'icon' => 'heart-pulse',
                    'accuracy' => '97.9% AUC',
                    'latest' => $stats['latest']['preeclampsia'],
                ],
                [
                    'id' => 'preterm',
                    'name_ar' => 'فحص الولادة المبكرة',
                    'name_en' => 'Preterm Birth Screening',
                    'description_ar' => 'تقييم مخاطر الولادة المبكرة قبل الأسبوع 37',
                    'icon' => 'baby',
                    'accuracy' => 'N/A',
                    'latest' => $stats['latest']['preterm_birth'],
                ],
                [
                    'id' => 'scbu',
                    'name_ar' => 'فحص قبول وحدة SCBU',
                    'name_en' => 'SCBU Admission Prediction',
                    'description_ar' => 'تنبؤ بخطر دخول الرضيع لوحدة الرعاية الخاصة (SCBU) بعد الولادة',
                    'icon' => 'shield-baby',
                    'accuracy' => '81.03% AUC',
                    'latest' => $stats['latest']['scbu'] ?? null,
                ],
            ],
        ], 'تم جلب بيانات مركز الذكاء الاصطناعي');
    }

    /**
     * Get pre-filled form data from patient profile/trackers
     * GET /api/v1/patient/ai-center/{model}/prefill
     */
    public function getPreFillData(Request $request, string $model): JsonResponse
    {
        $user = $request->user();
        $user->load(['profile', 'activePregnancy']);

        $data = match ($model) {
            'gdm' => $this->dataCollector->collectForGDM($user),
            'preeclampsia' => $this->dataCollector->collectForPreeclampsia($user),
            'preterm' => $this->dataCollector->collectForPretermBirth($user),
            'scbu' => $this->dataCollector->collectForSCBU($user),
            default => null,
        };

        if (!$data) {
            return $this->errorResponse('نوع الفحص غير صالح', 404);
        }

        return $this->successResponse($data, 'تم جلب البيانات المسبقة');
    }

    /**
     * Run GDM prediction
     * POST /api/v1/patient/ai-center/gdm/predict
     */
    public function predictGDM(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'age' => 'required|integer|between:15,55',
            'height_cm' => 'required|numeric|between:130,210',
            'weight_kg' => 'required|numeric|between:35,200',
            'no_of_pregnancy' => 'required|integer|between:0,15',
            'family_history' => 'required|in:0,1',
            'pcos' => 'required|in:0,1',
            'sedentary_lifestyle' => 'required|in:0,1',
            'prediabetes' => 'required|in:0,1',
            'unexplained_prenatal_loss' => 'required|in:0,1',
            'large_child_or_birth_default' => 'required|in:0,1',
            'gestation_in_previous_pregnancy' => 'required|in:0,1',
        ], [
            'age.required' => 'العمر مطلوب',
            'age.between' => 'العمر يجب أن يكون بين 15 و 55 سنة',
            'age.integer' => 'العمر يجب أن يكون رقماً صحيحاً',
            'height_cm.required' => 'الطول مطلوب',
            'height_cm.between' => 'الطول يجب أن يكون بين 130 و 210 سم',
            'height_cm.numeric' => 'الطول يجب أن يكون رقماً',
            'weight_kg.required' => 'الوزن مطلوب',
            'weight_kg.between' => 'الوزن يجب أن يكون بين 35 و 200 كجم',
            'weight_kg.numeric' => 'الوزن يجب أن يكون رقماً',
            'no_of_pregnancy.required' => 'عدد مرات الحمل السابقة مطلوب',
            'no_of_pregnancy.between' => 'عدد مرات الحمل يجب أن يكون بين 0 و 15',
            'no_of_pregnancy.integer' => 'عدد مرات الحمل يجب أن يكون رقماً صحيحاً',
            'family_history.required' => 'التاريخ العائلي مطلوب',
            'pcos.required' => 'متلازمة تكيس المبايض مطلوبة',
            'sedentary_lifestyle.required' => 'نمط الحياة مطلوب',
            'prediabetes.required' => 'مرحلة ما قبل السكري مطلوبة',
            'unexplained_prenatal_loss.required' => 'فقدان الحمل غير المبرر مطلوب',
            'large_child_or_birth_default.required' => 'ولادة طفل كبير/تشوهات مطلوبة',
            'gestation_in_previous_pregnancy.required' => 'سكري حمل سابق مطلوب',
            '*.in' => 'قيمة هذا الحقل غير صالحة',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $result = $this->predictionService->predictGDM(
            $request->user(),
            $validator->validated()
        );

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        // إلغاء Cache سياق الشات بوت
        ChatbotDataCollector::invalidateCache($request->user()->id);

        return $this->successResponse($this->formatPredictionResponse($result), 'تم تحليل المخاطر بنجاح');
    }

    /**
     * Run Preeclampsia prediction
     * POST /api/v1/patient/ai-center/preeclampsia/predict
     */
    public function predictPreeclampsia(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'gravida' => 'required|integer|between:0,20',
            'parity' => 'required|integer|between:0,15',
            'gest_age' => 'required|numeric|between:0,42',
            'age' => 'required|integer|between:15,60',
            'bmi' => 'required|numeric|between:10,60',
            'diabetes' => 'required|in:0,1',
            'htn' => 'required|in:0,1',
            'sysbp' => 'required|numeric|between:80,250',
            'diabp' => 'required|numeric|between:40,160',
            'hb' => 'required|numeric|between:5,20',
            'proteinuria' => 'required|in:0,1',
        ], [
            'gravida.required' => 'عدد الأحمال السابقة (Gravida) مطلوب',
            'gravida.between' => 'عدد الأحمال السابقة يجب أن يكون بين 0 و 20',
            'parity.required' => 'عدد الولادات السابقة (Parity) مطلوب',
            'parity.between' => 'عدد الولادات السابقة يجب أن يكون بين 0 و 15',
            'gest_age.required' => 'عمر الحمل مطلوب',
            'gest_age.between' => 'عمر الحمل يجب أن يكون بين 0 و 42 أسبوعاً',
            'age.required' => 'عمر الأم مطلوب',
            'age.between' => 'عمر الأم يجب أن يكون بين 15 و 60 سنة',
            'bmi.required' => 'مؤشر كتلة الجسم مطلوب',
            'bmi.between' => 'مؤشر كتلة الجسم يجب أن يكون بين 10 و 60',
            'diabetes.required' => 'حالة السكري مطلوبة',
            'htn.required' => 'حالة ارتفاع ضغط الدم مطلوبة',
            'sysbp.required' => 'ضغط الدم الانقباضي مطلوب',
            'sysbp.between' => 'ضغط الدم الانقباضي يجب أن يكون بين 80 و 250',
            'diabp.required' => 'ضغط الدم الانبساطي مطلوب',
            'diabp.between' => 'ضغط الدم الانبساطي يجب أن يكون بين 40 و 160',
            'hb.required' => 'مستوى الهيموجلوبين مطلوب',
            'hb.between' => 'مستوى الهيموجلوبين يجب أن يكون بين 5 و 20',
            'proteinuria.required' => 'البروتين في البول مطلوب',
            '*.integer' => 'القيمة المدخلة يجب أن تكون رقماً صحيحاً',
            '*.numeric' => 'القيمة المدخلة يجب أن تكون رقماً',
            '*.in' => 'قيمة الاختيار غير صالحة',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $result = $this->predictionService->predictPreeclampsia(
            $request->user(),
            $validator->validated()
        );

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        // إلغاء Cache سياق الشات بوت
        ChatbotDataCollector::invalidateCache($request->user()->id);

        return $this->successResponse($this->formatPredictionResponse($result), 'تم تحليل المخاطر بنجاح');
    }

    /**
     * Run Preterm Birth prediction
     * POST /api/v1/patient/ai-center/preterm/predict
     */
    public function predictPretermBirth(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'age' => 'required|integer|between:15,60',
            'systolic_bp' => 'required|numeric|between:80,200',
            'diastolic' => 'required|numeric|between:50,130',
            'bs' => 'required|numeric|between:3,400',
            'bmi' => 'required|numeric|between:15,50',
            'previous_complications' => 'required|in:0,1',
            'preexisting_diabetes' => 'required|in:0,1',
            'gestational_diabetes' => 'required|in:0,1',
            'mental_health' => 'required|in:0,1',
            'heart_rate' => 'required|numeric|between:40,250',
        ], [
            'age.required' => 'عمر الأم مطلوب',
            'age.between' => 'عمر الأم يجب أن يكون بين 15 و 60 سنة',
            'systolic_bp.required' => 'ضغط الدم الانقباضي مطلوب',
            'systolic_bp.between' => 'ضغط الدم الانقباضي يجب أن يكون بين 80 و 200',
            'diastolic.required' => 'ضغط الدم الانبساطي مطلوب',
            'diastolic.between' => 'ضغط الدم الانبساطي يجب أن يكون بين 50 و 130',
            'bs.required' => 'مستوى السكر في الدم مطلوب',
            'bs.between' => 'مستوى السكر يجب أن يكون بين 3 و 400',
            'bmi.required' => 'مؤشر كتلة الجسم مطلوب',
            'bmi.between' => 'مؤشر كتلة الجسم يجب أن يكون بين 15 و 50',
            'previous_complications.required' => 'المضاعفات السابقة مطلوبة',
            'preexisting_diabetes.required' => 'مرض السكري المسبق مطلوب',
            'gestational_diabetes.required' => 'سكري الحمل مطلوب',
            'mental_health.required' => 'الصحة النفسية مطلوبة',
            'heart_rate.required' => 'معدل ضربات القلب مطلوب',
            'heart_rate.between' => 'معدل ضربات القلب يجب أن يكون بين 40 و 250',
            '*.integer' => 'القيمة المدخلة يجب أن تكون رقماً صحيحاً',
            '*.numeric' => 'القيمة المدخلة يجب أن تكون رقماً',
            '*.in' => 'قيمة الاختيار غير صالحة',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $result = $this->predictionService->predictPretermBirth(
            $request->user(),
            $validator->validated()
        );

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        // إلغاء Cache سياق الشات بوت
        ChatbotDataCollector::invalidateCache($request->user()->id);

        return $this->successResponse($this->formatPredictionResponse($result), 'تم تحليل المخاطر بنجاح');
    }

    /**
     * Run SCBU Admission prediction
     * POST /api/v1/patient/ai-center/scbu/predict
     */
    public function predictSCBU(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            // Continuous — all optional (API handles defaults)
            'maternal_age' => 'nullable|numeric|between:10,60',
            'bmi_at_booking' => 'nullable|numeric|between:10,80',
            'hpg_2h' => 'nullable|numeric|between:0,50',
            'weeks_of_gestation' => 'nullable|numeric|between:20,45',
            'weight_measured' => 'nullable|numeric|between:30,250',
            'height' => 'nullable|numeric|between:100,220',
            'parity' => 'nullable|numeric|between:0,20',
            'no_of_previous_csections' => 'nullable|numeric|between:0,10',
            'contraction_freq' => 'nullable|numeric|between:0,100',
            'imd_decile' => 'nullable|numeric|between:1,10',
            'gravida' => 'nullable|numeric|between:0,20',
            'systolic_bp' => 'nullable|numeric|between:50,250',
            'diastolic_bp' => 'nullable|numeric|between:30,150',
            'fasting_glucose' => 'nullable|numeric|between:0,50',
            'vitamin_d' => 'nullable|numeric|between:0,200',
            // Binary flags as nested object
            'binary_flags' => 'nullable|array',
            'binary_flags.*' => 'nullable|integer|in:0,1',
        ], [
            'maternal_age.between' => 'عمر الأم يجب أن يكون بين 10 و 60 سنة',
            'maternal_age.numeric' => 'عمر الأم يجب أن يكون رقماً',
            'bmi_at_booking.between' => 'كتلة الجسم يجب أن تكون بين 10 و 80',
            'hpg_2h.between' => 'قيمة تحليل السكر يجب أن تكون بين 0 و 50',
            'weeks_of_gestation.between' => 'أسابيع الحمل يجب أن تكون بين 20 و 45 أسبوعاً',
            'weight_measured.between' => 'الوزن يجب أن يكون بين 30 و 250 كجم',
            'height.between' => 'الطول يجب أن يكون بين 100 و 220 سم',
            'parity.between' => 'عدد الولادات السابقة يجب أن يكون بين 0 و 20',
            'no_of_previous_csections.between' => 'عدد القيصريات السابقة يجب أن يكون بين 0 و 10',
            'contraction_freq.between' => 'تردد الانقباضات يجب أن يكون بين 0 و 100',
            'gravida.between' => 'عدد الأحمال السابقة يجب أن يكون بين 0 و 20',
            'systolic_bp.between' => 'ضغط الدم الانقباضي يجب أن يكون بين 50 و 250',
            'diastolic_bp.between' => 'ضغط الدم الانبساطي يجب أن يكون بين 30 و 150',
            'fasting_glucose.between' => 'تحليل سكر الصائم يجب أن يكون بين 0 و 50',
            'vitamin_d.between' => 'مستوى فيتامين د يجب أن يكون بين 0 و 200',
            'binary_flags.array' => 'صيغة الأمراض المصاحبة غير صحيحة',
            'binary_flags.*.in' => 'قيمة الحقل غير صالحة',
            'binary_flags.*.integer' => 'قيمة الحقل يجب أن تكون رقماً',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $result = $this->predictionService->predictSCBU(
            $request->user(),
            $validator->validated()
        );

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        // إلغاء Cache سياق الشات بوت
        ChatbotDataCollector::invalidateCache($request->user()->id);

        return $this->successResponse($this->formatPredictionResponse($result), 'تم تحليل مخاطر قبول SCBU بنجاح');
    }

    /**
     * Get prediction history timeline
     * GET /api/v1/patient/ai-center/history
     */
    public function getHistory(Request $request): JsonResponse
    {
        $diseaseType = $request->query('disease_type');
        $perPage = (int) $request->query('per_page', 15);

        $history = $this->predictionService->getHistory(
            $request->user(),
            $diseaseType,
            $perPage
        );

        return $this->successResponse($history, 'تم جلب سجل التنبؤات');
    }

    /**
     * Get single prediction detail
     * GET /api/v1/patient/ai-center/predictions/{id}
     */
    public function getPredictionDetail(Request $request, int $id): JsonResponse
    {
        $historyEntry = \App\Models\MlPredictionsHistory::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->with('predictable.doctor')
            ->firstOrFail();

        $prediction = $historyEntry->predictable;
        $doctorInfo = null;

        if ($prediction && $prediction->doctor) {
            $doctorInfo = [
                'id' => $prediction->doctor->id,
                'name' => 'د. ' . $prediction->doctor->name,
                'specialization' => $prediction->doctor->specialization,
            ];
        }

        return $this->successResponse([
            'history' => $historyEntry,
            'prediction' => $prediction,
            'disease_name_ar' => $historyEntry->disease_name_ar,
            'doctor_info' => $doctorInfo,
        ], 'تم جلب تفاصيل التنبؤ');
    }

    // === Private Helpers ===

    private function formatPredictionResponse(array $result): array
    {
        $prediction = $result['prediction'];

        $base = [
            'prediction_id' => $prediction->id,
            'risk_level' => $prediction->risk_level,
            'risk_score' => $prediction->risk_score,
            'risk_color' => $prediction->risk_color,
            'risk_badge' => $prediction->risk_badge,
            'api_result' => $result['api_result'],
            'consultation_suggested' => $result['consultation_suggested'],
        ];

        // SCBU-specific fields
        if ($prediction instanceof \App\Models\ScbuAdmissionPrediction) {
            $base['label'] = $prediction->label;
            $base['shap_top_features'] = $prediction->shap_top_features;
            $base['threshold_used'] = $prediction->threshold_used;
            $base['explain_called'] = $prediction->explain_called;
            $base['disclaimer'] = $prediction->disclaimer;
        }

        return $base;
    }
}
