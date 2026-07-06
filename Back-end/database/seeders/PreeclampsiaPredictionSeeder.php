<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pregnancy;
use App\Models\PreeclampsiaPrediction;
use App\Models\Doctor;

class PreeclampsiaPredictionSeeder extends Seeder
{
    public function run()
    {
        $pregnancies = Pregnancy::with('patient.profile')->where('is_active', true)->take(2)->get();
        $doctor = Doctor::first();

        $riskLevels = ['low', 'medium'];

        foreach ($pregnancies as $pregnancy) {
            $age = $pregnancy->patient?->age ?? 28;
            $bmi = $pregnancy->patient?->calculateBMI() ?? 24;

            PreeclampsiaPrediction::create([
                'user_id' => $pregnancy->user_id,
                'pregnancy_id' => $pregnancy->id,
                'doctor_id' => $doctor?->id,
                'risk_level' => $riskLevels[array_rand($riskLevels)],
                'risk_score' => rand(10, 40) / 100,
                'pregnancy_week' => $pregnancy->current_week,

                // API Input Fields
                'maternal_age' => $age,
                'bmi' => $bmi,
                'gravida' => 1,
                'parity' => 0,
                'gest_age' => 24.5,
                'systolic_bp' => rand(115, 135),
                'diastolic_bp' => rand(75, 88),
                'hb' => 11.5,
                'proteinuria' => false,
                'diabetes' => false,
                'htn' => false,

                // Outputs
                'prediction_class' => 0,
                'probability' => 0.1500,
                'risk_status' => 'Low Risk',

                'first_pregnancy' => true,
                'model_version' => 'v1.0.0',
                'algorithm_used' => 'XGBoost',
                'feature_importance' => [
                    'age' => 0.15,
                    'bmi' => 0.20,
                    'bp_systolic' => 0.35,
                    'bp_diastolic' => 0.30,
                ],
                'ai_analysis' => 'المؤشرات الحيوية ضمن المعدل الطبيعي. يُنصح بالمتابعة الدورية.',
                'recommendations' => [
                    'متابعة ضغط الدم بانتظام',
                    'الحفاظ على نظام غذائي صحي',
                    'تجنب الملح الزائد',
                ],
                'doctor_notified' => false,
                'prediction_date' => now(),
            ]);
        }
    }
}

