<?php

namespace App\Services;

use App\Models\User;
use App\Models\Pregnancy;
use App\Models\GestationalDiabetesPrediction;
use App\Models\PreeclampsiaPrediction;
use App\Models\PretermBirthPrediction;
use App\Models\ScbuAdmissionPrediction;
use App\Models\MlPredictionsHistory;
use App\Notifications\HighRiskPredictionNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AiPredictionService
{
    private const GDM_API_URL = 'https://abdo16s-stage1gdm.hf.space';
    private const PE_API_URL = 'https://amrhassank-preeclampsia-prediction-api.hf.space';
    private const PTB_API_URL = 'https://amrhassank-preterm-birth-screen-api.hf.space';
    private const SCBU_API_URL = 'https://abdo16s-scbu-model.hf.space';

    private int $timeout;

    public function __construct()
    {
        $this->timeout = (int) env('AI_PREDICTION_TIMEOUT', 300);
    }

    // =========================================================================
    // GDM Prediction
    // =========================================================================

    public function predictGDM(User $user, array $input): array
    {
        $startTime = microtime(true);

        try {
            $pregnancy = $user->activePregnancy;

            // Prepare API payload
            $apiPayload = [
                'age' => (int) $input['age'],
                'height_cm' => (float) $input['height_cm'],
                'weight_kg' => (float) $input['weight_kg'],
                'no_of_pregnancy' => (int) $input['no_of_pregnancy'],
                'family_history' => (int) $input['family_history'],
                'pcos' => (int) $input['pcos'],
                'sedentary_lifestyle' => (int) $input['sedentary_lifestyle'],
                'prediabetes' => (int) $input['prediabetes'],
                'unexplained_prenatal_loss' => (int) $input['unexplained_prenatal_loss'],
                'large_child_or_birth_default' => (int) $input['large_child_or_birth_default'],
                'gestation_in_previous_pregnancy' => (int) $input['gestation_in_previous_pregnancy'],
            ];

            // Call HF Space API
            $response = $this->callHfApi(self::GDM_API_URL . '/predict', $apiPayload);

            if (!$response['success']) {
                return $response;
            }

            $apiResult = $response['data'];
            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            // Save prediction to DB
            $prediction = DB::transaction(function () use ($user, $pregnancy, $input, $apiResult, $processingTime) {
                $prediction = GestationalDiabetesPrediction::create([
                    'user_id' => $user->id,
                    'pregnancy_id' => $pregnancy?->id,
                    'pregnancy_week' => $pregnancy?->current_week ?? 0,
                    // Input fields
                    'maternal_age' => $input['age'],
                    'height_cm' => $input['height_cm'],
                    'weight_kg' => $input['weight_kg'],
                    'bmi_computed' => $apiResult['bmi_computed'] ?? null,
                    'no_of_pregnancy' => $input['no_of_pregnancy'],
                    'family_history_diabetes' => $input['family_history'],
                    'pcos' => $input['pcos'],
                    'sedentary_lifestyle' => $input['sedentary_lifestyle'],
                    'prediabetes' => $input['prediabetes'],
                    'unexplained_prenatal_loss' => $input['unexplained_prenatal_loss'],
                    'large_child_or_birth_default' => $input['large_child_or_birth_default'],
                    'gestation_in_previous_pregnancy' => $input['gestation_in_previous_pregnancy'],
                    // Output fields
                    'risk_probability' => $apiResult['risk_probability'] ?? null,
                    'risk_category' => $apiResult['risk_category'] ?? null,
                    'final_risk' => $apiResult['final_risk'] ?? $apiResult['risk_category'] ?? null,
                    'risk_level' => $this->normalizeRiskLevel($apiResult['final_risk'] ?? $apiResult['risk_category'] ?? 'unknown'),
                    'risk_score' => $apiResult['risk_probability'] ?? 0,
                    'guardrail_applied' => $apiResult['guardrail_applied'] ?? false,
                    'recommendation_en' => $apiResult['recommendation_en'] ?? null,
                    'recommendation_ar' => $apiResult['recommendation_ar'] ?? null,
                    'top_factors' => $apiResult['top_factors'] ?? null,
                    // Model info
                    'model_version' => '1.0.0',
                    'algorithm_used' => 'LightGBM (Calibrated Isotonic)',
                    'ai_analysis' => $apiResult['recommendation_ar'] ?? null,
                    'recommendations' => $apiResult['top_factors'] ?? null,
                    'ogtt_recommended' => $this->isHighRisk($apiResult['final_risk'] ?? ''),
                    'prediction_date' => now(),
                ]);

                // Save unified history entry
                MlPredictionsHistory::create([
                    'user_id' => $user->id,
                    'predictable_type' => GestationalDiabetesPrediction::class,
                    'predictable_id' => $prediction->id,
                    'disease_type' => 'gestational_diabetes',
                    'input_features' => $input,
                    'model_output' => $apiResult,
                    'model_version' => '1.0.0',
                    'algorithm_used' => 'LightGBM',
                    'confidence_score' => $apiResult['risk_probability'] ?? 0,
                    'risk_level' => $prediction->risk_level,
                    'recommendation_summary' => $apiResult['recommendation_ar'] ?? null,
                    'processing_time_ms' => $processingTime,
                ]);

                return $prediction;
            });

            // Handle high-risk notifications
            $this->handleHighRiskResult($user, $prediction, 'gestational_diabetes');

            return $this->successResponse($prediction, $apiResult);

        } catch (\Exception $e) {
            Log::error('GDM Prediction Error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return $this->errorResponse('حدث خطأ أثناء تحليل المخاطر. حاولي مرة أخرى.');
        }
    }

    // =========================================================================
    // Preeclampsia Prediction
    // =========================================================================

    public function predictPreeclampsia(User $user, array $input): array
    {
        $startTime = microtime(true);

        try {
            $pregnancy = $user->activePregnancy;

            $apiPayload = [
                'gravida' => (float) $input['gravida'],
                'parity' => (float) $input['parity'],
                'gest_age' => (float) $input['gest_age'],
                'age' => (float) $input['age'],
                'bmi' => (float) $input['bmi'],
                'diabetes' => (int) $input['diabetes'],
                'htn' => (int) $input['htn'],
                'sysbp' => (float) $input['sysbp'],
                'diabp' => (float) $input['diabp'],
                'hb' => (float) $input['hb'],
                'proteinuria' => (int) $input['proteinuria'],
            ];

            $response = $this->callHfApi(self::PE_API_URL . '/predict', $apiPayload);

            if (!$response['success']) {
                return $response;
            }

            $apiResult = $response['data'];
            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            $prediction = DB::transaction(function () use ($user, $pregnancy, $input, $apiResult, $processingTime) {
                $prediction = PreeclampsiaPrediction::create([
                    'user_id' => $user->id,
                    'pregnancy_id' => $pregnancy?->id,
                    'pregnancy_week' => $pregnancy?->current_week ?? 0,
                    // Input fields
                    'gravida' => $input['gravida'],
                    'parity' => $input['parity'],
                    'gest_age' => $input['gest_age'],
                    'maternal_age' => $input['age'],
                    'bmi' => $input['bmi'],
                    'diabetes' => $input['diabetes'],
                    'htn' => $input['htn'],
                    'systolic_bp' => $input['sysbp'],
                    'diastolic_bp' => $input['diabp'],
                    'hb' => $input['hb'],
                    'proteinuria' => $input['proteinuria'],
                    // Output fields
                    'prediction_class' => $apiResult['prediction'] ?? null,
                    'probability' => $apiResult['probability'] ?? null,
                    'risk_status' => $apiResult['risk_status'] ?? null,
                    'risk_level' => $this->normalizeRiskLevel($apiResult['risk_status'] ?? 'unknown'),
                    'risk_score' => $apiResult['probability'] ?? 0,
                    'input_echo' => $apiResult['features_used'] ?? null,
                    // Model info
                    'model_version' => 'v1.0',
                    'algorithm_used' => 'XGBoost (Tuned)',
                    'prediction_date' => now(),
                ]);

                MlPredictionsHistory::create([
                    'user_id' => $user->id,
                    'predictable_type' => PreeclampsiaPrediction::class,
                    'predictable_id' => $prediction->id,
                    'disease_type' => 'preeclampsia',
                    'input_features' => $input,
                    'model_output' => $apiResult,
                    'model_version' => 'v1.0',
                    'algorithm_used' => 'XGBoost',
                    'confidence_score' => $apiResult['probability'] ?? 0,
                    'risk_level' => $prediction->risk_level,
                    'processing_time_ms' => $processingTime,
                ]);

                return $prediction;
            });

            $this->handleHighRiskResult($user, $prediction, 'preeclampsia');

            return $this->successResponse($prediction, $apiResult);

        } catch (\Exception $e) {
            Log::error('Preeclampsia Prediction Error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return $this->errorResponse('حدث خطأ أثناء تحليل المخاطر. حاولي مرة أخرى.');
        }
    }

    // =========================================================================
    // Preterm Birth Prediction
    // =========================================================================

    public function predictPretermBirth(User $user, array $input): array
    {
        $startTime = microtime(true);

        try {
            $pregnancy = $user->activePregnancy;

            // PTB API uses aliases
            $apiPayload = [
                'Age' => (float) $input['age'],
                'Systolic BP' => (float) $input['systolic_bp'],
                'Diastolic' => (float) $input['diastolic'],
                'BS' => (float) $input['bs'],
                'BMI' => (float) $input['bmi'],
                'Previous Complications' => (float) $input['previous_complications'],
                'Preexisting Diabetes' => (float) $input['preexisting_diabetes'],
                'Gestational Diabetes' => (float) $input['gestational_diabetes'],
                'Mental Health' => (float) $input['mental_health'],
                'Heart Rate' => (float) $input['heart_rate'],
            ];

            $response = $this->callHfApi(self::PTB_API_URL . '/predict', $apiPayload);

            if (!$response['success']) {
                return $response;
            }

            $apiResult = $response['data'];
            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            $prediction = DB::transaction(function () use ($user, $pregnancy, $input, $apiResult, $processingTime) {
                $prediction = PretermBirthPrediction::create([
                    'user_id' => $user->id,
                    'pregnancy_id' => $pregnancy?->id,
                    'pregnancy_week' => $pregnancy?->current_week ?? 0,
                    'prediction_stage' => 'screening',
                    // Input fields
                    'maternal_age' => $input['age'],
                    'systolic_bp' => $input['systolic_bp'],
                    'diastolic_bp' => $input['diastolic'],
                    'bs' => $input['bs'],
                    'bmi' => $input['bmi'],
                    'previous_complications' => $input['previous_complications'],
                    'preexisting_diabetes' => $input['preexisting_diabetes'],
                    'gestational_diabetes_input' => $input['gestational_diabetes'],
                    'mental_health' => $input['mental_health'],
                    'heart_rate' => $input['heart_rate'],
                    // Output fields
                    'prediction_class' => $apiResult['prediction'] ?? null,
                    'risk_label' => $apiResult['risk_label'] ?? null,
                    'probability_high' => $apiResult['probability_high'] ?? null,
                    'risk_level' => $this->normalizeRiskLevel($apiResult['risk_label'] ?? 'unknown'),
                    'risk_score' => $apiResult['probability_high'] ?? 0,
                    'api_note' => $apiResult['note'] ?? null,
                    // Model info
                    'model_version' => 'v1.0.0',
                    'algorithm_used' => 'Screening Model (stage1_no_temp)',
                    'prediction_date' => now(),
                ]);

                MlPredictionsHistory::create([
                    'user_id' => $user->id,
                    'predictable_type' => PretermBirthPrediction::class,
                    'predictable_id' => $prediction->id,
                    'disease_type' => 'preterm_birth',
                    'input_features' => $input,
                    'model_output' => $apiResult,
                    'model_version' => 'v1.0.0',
                    'algorithm_used' => 'Screening Model',
                    'confidence_score' => $apiResult['probability_high'] ?? 0,
                    'risk_level' => $prediction->risk_level,
                    'recommendation_summary' => $apiResult['note'] ?? null,
                    'processing_time_ms' => $processingTime,
                ]);

                return $prediction;
            });

            $this->handleHighRiskResult($user, $prediction, 'preterm_birth');

            return $this->successResponse($prediction, $apiResult);

        } catch (\Exception $e) {
            Log::error('Preterm Birth Prediction Error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return $this->errorResponse('حدث خطأ أثناء تحليل المخاطر. حاولي مرة أخرى.');
        }
    }

    // =========================================================================
    // History & Statistics
    // =========================================================================

    public function getHistory(User $user, ?string $diseaseType = null, int $perPage = 15)
    {
        $query = MlPredictionsHistory::where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($diseaseType) {
            $query->forDisease($diseaseType);
        }

        return $query->paginate($perPage);
    }

    public function getLatestPredictions(User $user): array
    {
        return [
            'gdm' => $user->gestationalDiabetesPredictions()->latest()->first(),
            'preeclampsia' => $user->preeclampsiaPredictions()->latest()->first(),
            'preterm_birth' => $user->pretermBirthPredictions()->latest()->first(),
            'scbu' => $user->scbuAdmissionPredictions()->latest()->first(),
        ];
    }

    public function getStats(User $user): array
    {
        $totalPredictions = MlPredictionsHistory::where('user_id', $user->id)->count();
        $highRiskCount = MlPredictionsHistory::where('user_id', $user->id)->highRisk()->count();
        $latestPredictions = $this->getLatestPredictions($user);

        return [
            'total_predictions' => $totalPredictions,
            'high_risk_alerts' => $highRiskCount,
            'models_available' => 4,
            'latest' => $latestPredictions,
        ];
    }

    // =========================================================================
    // Admin Statistics
    // =========================================================================

    public function getAdminAnalytics(): array
    {
        $total = MlPredictionsHistory::count();
        $thisMonth = MlPredictionsHistory::where('created_at', '>=', now()->startOfMonth())->count();

        $byDisease = MlPredictionsHistory::selectRaw('disease_type, COUNT(*) as count')
            ->groupBy('disease_type')
            ->pluck('count', 'disease_type')
            ->toArray();

        $riskDistribution = MlPredictionsHistory::selectRaw('risk_level, COUNT(*) as count')
            ->whereNotNull('risk_level')
            ->groupBy('risk_level')
            ->pluck('count', 'risk_level')
            ->toArray();

        $recentTrend = MlPredictionsHistory::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();

        return [
            'total_predictions' => $total,
            'this_month' => $thisMonth,
            'by_disease' => $byDisease,
            'risk_distribution' => $riskDistribution,
            'trend_30_days' => $recentTrend,
            'high_risk_count' => MlPredictionsHistory::highRisk()->count(),
            'unique_patients' => MlPredictionsHistory::distinct('user_id')->count('user_id'),
        ];
    }

    // =========================================================================
    // SCBU Admission Prediction
    // =========================================================================

    public function predictSCBU(User $user, array $input): array
    {
        $startTime = microtime(true);

        try {
            $pregnancy = $user->activePregnancy;

            // Build API payload
            $apiPayload = $this->buildScbuPayload($input);

            // Call 1: /predict
            $response = $this->callHfApi(self::SCBU_API_URL . '/predict', $apiPayload);
            if (!$response['success']) {
                return $response;
            }
            $apiResult = $response['data'];

            // Call 2: /explain (SHAP — non-fatal if fails)
            $shapResult = null;
            try {
                $shapResponse = $this->callHfApi(self::SCBU_API_URL . '/explain', $apiPayload);
                if ($shapResponse['success']) {
                    $shapResult = $shapResponse['data'];
                }
            } catch (\Exception $e) {
                Log::warning('SCBU SHAP /explain failed (non-fatal)', ['error' => $e->getMessage()]);
            }

            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            // Persist to DB
            $prediction = DB::transaction(function () use ($user, $pregnancy, $input, $apiResult, $shapResult, $processingTime) {
                $riskLevel = $this->normalizeRiskLevel($apiResult['risk_level'] ?? 'unknown');

                $prediction = ScbuAdmissionPrediction::create([
                    'user_id' => $user->id,
                    'pregnancy_id' => $pregnancy?->id,
                    // Continuous inputs
                    'maternal_age' => $input['maternal_age'] ?? null,
                    'bmi_at_booking' => $input['bmi_at_booking'] ?? null,
                    'hpg_2h' => $input['hpg_2h'] ?? null,
                    'weeks_of_gestation' => $input['weeks_of_gestation'] ?? null,
                    'weight_measured' => $input['weight_measured'] ?? null,
                    'height' => $input['height'] ?? null,
                    'parity' => $input['parity'] ?? null,
                    'no_of_previous_csections' => $input['no_of_previous_csections'] ?? null,
                    'contraction_freq' => $input['contraction_freq'] ?? null,
                    'imd_decile' => $input['imd_decile'] ?? null,
                    'gravida' => $input['gravida'] ?? null,
                    'systolic_bp' => $input['systolic_bp'] ?? null,
                    'diastolic_bp' => $input['diastolic_bp'] ?? null,
                    'fasting_glucose' => $input['fasting_glucose'] ?? null,
                    'vitamin_d' => $input['vitamin_d'] ?? null,
                    'binary_flags' => $input['binary_flags'] ?? [],
                    // Outputs
                    'risk_probability' => $apiResult['risk_probability'] ?? null,
                    'prediction' => $apiResult['prediction'] ?? null,
                    'label' => $apiResult['label'] ?? null,
                    'risk_level' => $riskLevel,
                    'risk_score' => $apiResult['risk_probability'] ?? null,
                    'threshold_used' => $apiResult['threshold_used'] ?? null,
                    'model_name' => $apiResult['model_name'] ?? 'XGBoost (gbtree)',
                    'disclaimer' => $apiResult['disclaimer'] ?? null,
                    // SHAP
                    'shap_top_features' => $shapResult['top_features'] ?? null,
                    'explain_called' => $shapResult !== null,
                    // Metadata
                    'model_version' => '3.0.0',
                    'algorithm_used' => 'XGBoost (gbtree) + Optuna + Isotonic Calibration',
                    'prediction_date' => now(),
                ]);

                // Save unified history entry
                MlPredictionsHistory::create([
                    'user_id' => $user->id,
                    'predictable_type' => ScbuAdmissionPrediction::class,
                    'predictable_id' => $prediction->id,
                    'disease_type' => 'scbu_admission',
                    'input_features' => $input,
                    'model_output' => $apiResult,
                    'model_version' => '3.0.0',
                    'algorithm_used' => 'XGBoost (gbtree)',
                    'confidence_score' => $apiResult['risk_probability'] ?? 0,
                    'risk_level' => $riskLevel,
                    'recommendation_summary' => $apiResult['label'] ?? null,
                    'processing_time_ms' => $processingTime,
                ]);

                return $prediction;
            });

            $this->handleHighRiskResult($user, $prediction, 'scbu_admission');

            return $this->successResponse($prediction, $apiResult);

        } catch (\Exception $e) {
            Log::error('SCBU Prediction Error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return $this->errorResponse('حدث خطأ أثناء تحليل مخاطر قبول SCBU. حاولي مرة أخرى.');
        }
    }

    /**
     * Build API payload for SCBU: maps internal snake_case → API field names.
     */
    private function buildScbuPayload(array $input): array
    {
        $payload = [
            'Maternal_age' => isset($input['maternal_age']) ? (float) $input['maternal_age'] : null,
            'Body_Mass_Index_at_Booking' => isset($input['bmi_at_booking']) ? (float) $input['bmi_at_booking'] : null,
            '2hPG' => isset($input['hpg_2h']) ? (float) $input['hpg_2h'] : null,
            'Weeks_of_Gestation' => isset($input['weeks_of_gestation']) ? (float) $input['weeks_of_gestation'] : null,
            'WeightMeasured' => isset($input['weight_measured']) ? (float) $input['weight_measured'] : null,
            'Height' => isset($input['height']) ? (float) $input['height'] : null,
            'Parity' => isset($input['parity']) ? (float) $input['parity'] : null,
            'No_Of_previous_Csections' => isset($input['no_of_previous_csections']) ? (float) $input['no_of_previous_csections'] : null,
            'Contraction_freq' => isset($input['contraction_freq']) ? (float) $input['contraction_freq'] : null,
            'IMD_Decile' => isset($input['imd_decile']) ? (float) $input['imd_decile'] : null,
            'Gravida' => isset($input['gravida']) ? (float) $input['gravida'] : null,
            'Systolic_BP' => isset($input['systolic_bp']) ? (float) $input['systolic_bp'] : null,
            'Diastolic_BP' => isset($input['diastolic_bp']) ? (float) $input['diastolic_bp'] : null,
            'Fasting_Glucose' => isset($input['fasting_glucose']) ? (float) $input['fasting_glucose'] : null,
            'Vitamin_D' => isset($input['vitamin_d']) ? (float) $input['vitamin_d'] : null,
        ];

        // Binary flags
        $flags = $input['binary_flags'] ?? [];
        $binaryMap = [
            'Gestational_Diabetes' => 'gestational_diabetes',
            'Obese' => 'obese',
            'Severely_Premature' => 'severely_premature',
            'Previous_caesarean' => 'previous_caesarean',
            'Contractions' => 'contractions',
            'Fetal_compromise' => 'fetal_compromise',
            'Previous_uterine_surgery' => 'previous_uterine_surgery',
            'Multiple_pregnancy' => 'multiple_pregnancy',
            'Antepartum_haemorrhage' => 'antepartum_haemorrhage',
            'Preeclampsia' => 'preeclampsia',
            'Pre_eclampsia' => 'pre_eclampsia',
            'Chorioamnionitis' => 'chorioamnionitis',
            'Abnormal_lie' => 'abnormal_lie',
            'Maternal_medical_disease_sepsis' => 'maternal_medical_disease_sepsis',
            'Placenta_praevia' => 'placenta_praevia',
            'Placental_abruption' => 'placental_abruption',
            'Severe_IUGR' => 'severe_iugr',
            'Fetal_anomalies' => 'fetal_anomalies',
            'Previous_traumatic_vaginal_delivery' => 'previous_traumatic_vaginal_delivery',
            'Maternal_medical_disease_other' => 'maternal_medical_disease_other',
            'Hypertension' => 'hypertension',
            'Severe_pre_eclampsia' => 'severe_pre_eclampsia',
            'Diabetes_endocrine_disorder' => 'diabetes_endocrine_disorder',
            'Twins_or_more' => 'twins_or_more',
            'Obesity_BMI_ge_35' => 'obesity_bmi_ge_35',
            'Ethnicity_Asian' => 'ethnicity_asian',
            'Ethnicity_Black' => 'ethnicity_black',
            'Ethnicity_White' => 'ethnicity_white',
            'Ethnicity_Mixed' => 'ethnicity_mixed',
            'Thyroid_Abnormal' => 'thyroid_abnormal',
        ];

        foreach ($binaryMap as $apiKey => $internalKey) {
            $payload[$apiKey] = (int) ($flags[$internalKey] ?? 0);
        }

        return $payload;
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    private function callHfApi(string $url, array $payload): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->retry(2, 5000, null, false) // 4th param disables automatic throw on failure
                ->post($url, $payload);

            if (!$response->successful()) {
                Log::error('HF API call failed', [
                    'url' => $url,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [
                    'success' => false,
                    'error' => 'خدمة الذكاء الاصطناعي غير متاحة حالياً. حاولي مرة أخرى.',
                ];
            }

            return [
                'success' => true,
                'data' => $response->json(),
            ];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('HF API connection timeout', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => 'انتهت مهلة الاتصال بخدمة الذكاء الاصطناعي. حاولي مرة أخرى بعد قليل.',
            ];
        }
    }

    private function normalizeRiskLevel(string $risk): string
    {
        $risk = strtolower(trim($risk));
        return match (true) {
            str_contains($risk, 'high') => 'high',
            str_contains($risk, 'moderate'), str_contains($risk, 'medium') => 'moderate',
            str_contains($risk, 'low') => 'low',
            default => $risk,
        };
    }

    private function isHighRisk(string $risk): bool
    {
        return str_contains(strtolower($risk), 'high');
    }

    private function handleHighRiskResult(User $user, $prediction, string $diseaseType): void
    {
        if (!$this->isHighRisk($prediction->risk_level ?? '')) {
            return;
        }

        try {
            // Find assigned doctor (latest consultation doctor)
            $doctor = $user->doctors()->latest('pivot_last_appointment_date')->first();

            if ($doctor) {
                $prediction->update([
                    'doctor_id' => $doctor->id,
                    'doctor_notified' => true,
                    'doctor_notified_at' => now(),
                ]);

                $doctor->notify(new HighRiskPredictionNotification(
                    $user,
                    $prediction,
                    $diseaseType
                ));
            }

            Log::info('High risk prediction detected', [
                'user_id' => $user->id,
                'disease_type' => $diseaseType,
                'risk_level' => $prediction->risk_level,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to handle high-risk result', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function successResponse($prediction, array $apiResult): array
    {
        return [
            'success' => true,
            'prediction' => $prediction,
            'api_result' => $apiResult,
            'consultation_suggested' => $this->isHighRisk($prediction->risk_level ?? ''),
        ];
    }

    private function errorResponse(string $message): array
    {
        return [
            'success' => false,
            'error' => $message,
        ];
    }
}
