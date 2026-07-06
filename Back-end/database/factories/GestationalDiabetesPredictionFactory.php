<?php

namespace Database\Factories;

use App\Models\GestationalDiabetesPrediction;
use App\Models\Pregnancy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GestationalDiabetesPredictionFactory extends Factory
{
    protected $model = GestationalDiabetesPrediction::class;

    public function definition(): array
    {
        return [
            'user_id'                   => User::factory(),
            'pregnancy_id'              => Pregnancy::factory(),
            'risk_level'                => 'low',
            'risk_probability'          => $this->faker->randomFloat(4, 0.05, 0.30),
            'risk_category'             => 'Low Risk',
            'final_risk'                => 'Low Risk',
            'maternal_age'              => rand(22, 40),
            'height_cm'                 => rand(155, 175),
            'weight_kg'                 => rand(55, 90),
            'bmi_computed'              => round(rand(20, 35) + 0.5, 1),
            'no_of_pregnancy'           => rand(1, 4),
            'family_history_diabetes'   => false,
            'pcos'                      => false,
            'sedentary_lifestyle'       => false,
            'guardrail_applied'         => false,
            'model_version'             => 'v1.0.0',
            'algorithm_used'            => 'LightGBM',
            'recommendation_ar'         => 'مستوى الخطر منخفض — استمري في نمط حياة صحي.',
            'prediction_date'           => now()->subDays(rand(1, 30)),
        ];
    }

    public function highRisk(): static
    {
        return $this->state([
            'risk_level'              => 'high',
            'risk_probability'        => $this->faker->randomFloat(4, 0.70, 0.95),
            'risk_category'           => 'High Risk',
            'final_risk'              => 'High Risk',
            'family_history_diabetes' => true,
            'pcos'                    => true,
            'sedentary_lifestyle'     => true,
            'guardrail_applied'       => true,
            'recommendation_ar'       => 'ننصح بمراجعة طبيبتك لإجراء اختبار OGTT في أقرب وقت.',
            'top_factors'             => ['السمنة', 'التاريخ العائلي', 'PCOS'],
            'ogtt_recommended'        => true,
        ]);
    }

    public function lowRisk(): static
    {
        return $this->state([
            'risk_level'       => 'low',
            'risk_probability' => $this->faker->randomFloat(4, 0.05, 0.25),
        ]);
    }
}
