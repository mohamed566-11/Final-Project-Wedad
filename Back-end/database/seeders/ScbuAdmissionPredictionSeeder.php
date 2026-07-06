<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pregnancy;
use App\Models\ScbuAdmissionPrediction;
use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

class ScbuAdmissionPredictionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $pregnancies = Pregnancy::with('patient.profile')
                ->where('is_active', true)
                ->take(2)
                ->get();

            $doctor = Doctor::where('specialization', 'pediatrics')->first()
                ?? Doctor::first();

            if ($pregnancies->isEmpty()) {
                $this->command->warn('ScbuAdmissionPredictionSeeder: No active pregnancies. Skipping.');
                return;
            }

            foreach ($pregnancies as $pregnancy) {
                $age = $pregnancy->patient?->age ?? 28;
                $bmi = $pregnancy->patient?->calculateBMI() ?? 24.0;

                ScbuAdmissionPrediction::updateOrCreate(
                    [
                        'user_id'     => $pregnancy->user_id,
                        'pregnancy_id'=> $pregnancy->id,
                    ],
                    [
                        'doctor_id' => $doctor?->id,

                        // Continuous Inputs
                        'maternal_age'            => $age,
                        'bmi_at_booking'          => (float) $bmi,
                        'hpg_2h'                  => 5.2,
                        'weeks_of_gestation'      => $pregnancy->current_week ?? 24,
                        'weight_measured'         => 65.0,
                        'height'                  => 165.0,
                        'parity'                  => 0,
                        'no_of_previous_csections'=> 0,
                        'contraction_freq'        => 0.0,
                        'imd_decile'              => 5.0,
                        'gravida'                 => 1,
                        'systolic_bp'             => 120.0,
                        'diastolic_bp'            => 80.0,
                        'fasting_glucose'         => 4.5,
                        'vitamin_d'               => 20.0,

                        // Binary Flags (JSON)
                        'binary_flags' => [
                            'gestational_diabetes' => 0,
                            'multiple_pregnancy'   => 0,
                            'hypertension'         => 0,
                            'obese'                => 0,
                            'obesity_bmi_ge_35'    => 0,
                            'twins_or_more'        => 0,
                            'previous_caesarean'   => 0,
                        ],

                        // Outputs — الأنواع الصحيحة
                        'risk_probability' => 0.05,
                        'prediction'       => 0,               // ← int (0 or 1) ✅
                        'label'            => 'Routine Postnatal Care', // ← string ✅
                        'risk_level'       => 'Low',
                        'risk_score'       => 0.05,
                        'threshold_used'   => 0.208,
                        'model_name'       => 'Random Forest SCBU',
                        'model_version'    => '3.0.0',
                        'disclaimer'       => 'This is a screening model. Clinical judgement required.',

                        'shap_top_features' => [
                            ['feature' => 'maternal_age', 'value' => $age, 'contribution' => -0.05],
                        ],
                        'explain_called'  => true,
                        'doctor_comments' => 'All looks good.',
                        'doctor_notified' => false,
                        'algorithm_used'  => 'Random Forest',
                        'prediction_date' => now(),
                    ]
                );
            }

            $this->command->info('✅ ScbuAdmissionPredictionSeeder: Done.');
        });
    }
}
