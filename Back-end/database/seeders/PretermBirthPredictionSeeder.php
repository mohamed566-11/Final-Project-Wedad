<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pregnancy;
use App\Models\PretermBirthPrediction;
use App\Models\Doctor;

class PretermBirthPredictionSeeder extends Seeder
{
    public function run()
    {
        $pregnancies = Pregnancy::with('patient.profile')->where('is_active', true)->take(2)->get();
        $doctor = Doctor::where('specialization', 'obstetrics')->first() ?? Doctor::first();

        foreach ($pregnancies as $pregnancy) {
            $age = $pregnancy->patient?->age ?? 28;
            $bmi = $pregnancy->patient?->calculateBMI() ?? 24;

            PretermBirthPrediction::create([
                'user_id' => $pregnancy->user_id,
                'pregnancy_id' => $pregnancy->id,
                'doctor_id' => $doctor?->id,
                'risk_level' => 'low',
                'risk_score' => rand(8, 30) / 100,
                'pregnancy_week' => $pregnancy->current_week,
                'prediction_stage' => 'screening',

                // API Inputs
                'maternal_age' => $age,
                'bmi' => $bmi,
                'systolic_bp' => rand(115, 125),
                'diastolic_bp' => rand(75, 82),
                'bs' => 85,
                'heart_rate' => 80,
                'previous_complications' => false,
                'preexisting_diabetes' => false,
                'gestational_diabetes_input' => false,
                'mental_health' => false,

                // Outputs
                'prediction_class' => 0,
                'risk_label' => 'Low',
                'probability_high' => 0.1200,
                'api_note' => '',

                'previous_preterm_birth' => false,
                'smoking' => false,
                'number_of_previous_pregnancies' => 0,
                'multiple_pregnancy' => false,

                'model_version' => 'v1.0.0',
                'algorithm_used' => 'Random Forest',
                'feature_importance' => [
                    'age' => 0.18,
                    'bmi' => 0.22,
                    'bp' => 0.25,
                    'previous_ptb' => 0.35,
                ],
                'ai_analysis' => 'لا توجد عوامل خطر رئيسية. الحمل يسير بشكل طبيعي.',
                'recommendations' => [
                    'المتابعة المنتظمة مع الطبيب',
                    'الراحة الكافية',
                    'تجنب الإجهاد البدني الشديد',
                ],
                'doctor_notified' => false,
                'prediction_date' => now(),
                'cervical_length_scan_recommended' => false,
            ]);
        }
    }
}

