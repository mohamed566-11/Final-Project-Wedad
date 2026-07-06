<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pregnancy;
use App\Models\GestationalDiabetesPrediction;
use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

class GestationalDiabetesPredictionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $pregnancies = Pregnancy::with('patient.profile')
                ->where('is_active', true)
                ->get(); // ← جميع الحمل النشطة (ليس 2 فقط)

            $doctor = Doctor::where('specialization', 'endocrinology')->first()
                ?? Doctor::first();

            if ($pregnancies->isEmpty()) {
                $this->command->warn('GestationalDiabetesPredictionSeeder: No active pregnancies. Skipping.');
                return;
            }

            foreach ($pregnancies as $pregnancy) {
                $age = $pregnancy->patient?->age ?? 28;
                $bmi = $pregnancy->patient?->calculateBMI() ?? 24.0;

                GestationalDiabetesPrediction::updateOrCreate(
                    [
                        'user_id'     => $pregnancy->user_id,
                        'pregnancy_id'=> $pregnancy->id,
                    ],
                    [
                        'doctor_id'                        => $doctor?->id,
                        'risk_level'                       => 'low',
                        'risk_score'                       => rand(10, 35) / 100,
                        'pregnancy_week'                   => $pregnancy->current_week ?? 0,
                        'maternal_age'                     => $age,

                        // API Inputs
                        'height_cm'                        => 165,
                        'weight_kg'                        => 65,
                        'bmi_computed'                     => (float) $bmi,
                        'no_of_pregnancy'                  => 1,
                        'family_history_diabetes'          => false,
                        'pcos'                             => false,
                        'sedentary_lifestyle'              => false,
                        'prediabetes'                      => false,
                        'unexplained_prenatal_loss'        => false,
                        'large_child_or_birth_default'     => false,
                        'gestation_in_previous_pregnancy'  => false,

                        // API Outputs
                        'risk_probability' => 0.1500,
                        'risk_category'    => 'Low Risk',
                        'final_risk'       => 'Low Risk',
                        'guardrail_applied'=> false,

                        'model_version'  => 'v1.0.0',
                        'algorithm_used' => 'LightGBM',
                        'feature_importance' => [
                            'bmi'            => 0.25,
                            'age'            => 0.20,
                            'glucose'        => 0.35,
                            'family_history' => 0.20,
                        ],
                        'recommendation_ar' => 'مستوى الخطر منخفض بناءً على المؤشرات الحالية.',
                        'recommendations'   => [
                            'الحفاظ على وزن صحي',
                            'ممارسة الرياضة الخفيفة',
                            'تناول وجبات متوازنة',
                        ],
                        'doctor_notified' => false,
                        'prediction_date' => now(),
                        'ogtt_recommended'=> false,
                    ]
                );
            }

            $this->command->info('✅ GestationalDiabetesPredictionSeeder: Done (' . $pregnancies->count() . ' records).');
        });
    }
}
