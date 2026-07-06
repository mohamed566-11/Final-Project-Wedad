<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Pregnancy;
use App\Models\GestationalDiabetesPrediction;
use App\Models\PreeclampsiaPrediction;
use App\Models\PretermBirthPrediction;
use App\Models\ScbuAdmissionPrediction;
use Illuminate\Support\Facades\DB;

class AiPredictionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $sara = User::where('email', 'sara@example.com')->first();
            if (!$sara) {
                $this->command->warn('AiPredictionSeeder: sara@example.com not found. Skipping.');
                return;
            }

            $pregnancy = $sara->activePregnancy
                ?? Pregnancy::where('user_id', $sara->id)->latest()->first();

            // ── GDM — خطورة عالية ──────────────────────────────────────
            GestationalDiabetesPrediction::updateOrCreate(
                ['user_id' => $sara->id],
                [
                    'pregnancy_id'            => $pregnancy?->id,
                    'risk_level'              => 'high',
                    'risk_probability'        => 0.8700,
                    'risk_category'           => 'High Risk',
                    'final_risk'              => 'High Risk',
                    'guardrail_applied'       => true,
                    'maternal_age'            => 28,
                    'height_cm'               => 165,
                    'weight_kg'               => 75,
                    'bmi_computed'            => 27.5,
                    'no_of_pregnancy'         => 1,
                    'family_history_diabetes' => true,
                    'pcos'                    => true,
                    'sedentary_lifestyle'     => false,
                    'recommendation_ar'       => 'ننصح بمراجعة طبيبتك لإجراء اختبار OGTT في أقرب وقت.',
                    'top_factors'             => ['BMI مرتفع', 'التاريخ العائلي', 'PCOS'],
                    'ogtt_recommended'        => true,
                    'model_version'           => 'v1.0.0',
                    'algorithm_used'          => 'LightGBM',
                    'prediction_date'         => now()->subDays(15),
                ]
            );

            // ── Preeclampsia — خطورة منخفضة ────────────────────────────
            PreeclampsiaPrediction::updateOrCreate(
                ['user_id' => $sara->id],
                [
                    'pregnancy_id'    => $pregnancy?->id,
                    'risk_level'      => 'low',
                    'probability'     => 0.2300,
                    'maternal_age'    => 28,
                    'bmi'             => 27.5,
                    'systolic_bp'     => 118,
                    'diastolic_bp'    => 76,
                    'htn'             => false,
                    'diabetes'        => false,
                    'proteinuria'     => false,
                    'gravida'         => 1,
                    'parity'          => 0,
                    'model_version'   => 'v1.0',
                    'algorithm_used'  => 'XGBoost',
                    'prediction_date' => now()->subDays(15),
                ]
            );

            // ── Preterm Birth — خطورة متوسطة ───────────────────────────
            PretermBirthPrediction::updateOrCreate(
                ['user_id' => $sara->id],
                [
                    'pregnancy_id'           => $pregnancy?->id,
                    'risk_level'             => 'moderate',
                    'probability_high'       => 0.4500,
                    'maternal_age'           => 28,
                    'bmi'                    => 27.5,
                    'systolic_bp'            => 118,
                    'diastolic_bp'           => 76,
                    'bs'                     => 5.8,
                    'mental_health'          => false,
                    'previous_complications' => false,
                    'model_version'          => 'v1.0.0',
                    'prediction_date'        => now()->subDays(15),
                ]
            );

            // ── SCBU — خطورة منخفضة ────────────────────────────────────
            ScbuAdmissionPrediction::updateOrCreate(
                ['user_id' => $sara->id],
                [
                    'pregnancy_id'       => $pregnancy?->id,
                    'risk_level'         => 'Low',
                    'risk_probability'   => 0.1200,
                    'prediction'         => 0,
                    'label'              => 'Routine Postnatal Care',
                    'maternal_age'       => 28,
                    'bmi_at_booking'     => 27.5,
                    'weeks_of_gestation' => 24,
                    'systolic_bp'        => 118,
                    'diastolic_bp'       => 76,
                    'binary_flags'       => [
                        'gestational_diabetes' => 0,
                        'hypertension'         => 0,
                        'obese'                => 0,
                        'multiple_pregnancy'   => 0,
                        'obesity_bmi_ge_35'    => 0,
                        'twins_or_more'        => 0,
                        'previous_caesarean'   => 0,
                    ],
                    'model_name'      => 'Random Forest SCBU',
                    'model_version'   => '3.0.0',
                    'threshold_used'  => 0.208,
                    'prediction_date' => now()->subDays(15),
                ]
            );

            $this->command->info('✅ AiPredictionSeeder: 4 predictions created for sara@example.com');
        });
    }
}
