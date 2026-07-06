<?php

namespace Database\Factories;

use App\Models\ScbuAdmissionPrediction;
use App\Models\Pregnancy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScbuAdmissionPredictionFactory extends Factory
{
    protected $model = ScbuAdmissionPrediction::class;

    public function definition(): array
    {
        $age = rand(20, 42);
        $bmi = $this->faker->randomFloat(1, 18, 38);

        return [
            'user_id'              => User::factory(),
            'pregnancy_id'         => Pregnancy::factory(),
            'maternal_age'         => $age,
            'bmi_at_booking'       => $bmi,
            'weeks_of_gestation'   => rand(24, 40),
            'systolic_bp'          => rand(100, 130),
            'diastolic_bp'         => rand(65, 85),
            'hpg_2h'               => $this->faker->randomFloat(1, 4, 7),
            'fasting_glucose'      => $this->faker->randomFloat(1, 3, 6),
            'vitamin_d'            => $this->faker->randomFloat(1, 10, 50),
            'parity'               => rand(0, 3),
            'gravida'              => rand(1, 4),
            'no_of_previous_csections' => rand(0, 2),
            'imd_decile'           => $this->faker->randomFloat(1, 1, 10),
            'binary_flags'         => [
                'gestational_diabetes' => 0,
                'multiple_pregnancy'   => 0,
                'hypertension'         => 0,
                'obese'                => 0,
                'obesity_bmi_ge_35'    => 0,
                'twins_or_more'        => 0,
                'previous_caesarean'   => 0,
            ],
            'risk_probability'     => $this->faker->randomFloat(4, 0.05, 0.20),
            'prediction'           => 0,
            'label'                => 'Routine Postnatal Care',
            'risk_level'           => 'Low',
            'threshold_used'       => 0.208,
            'model_name'           => 'Random Forest SCBU',
            'model_version'        => '3.0.0',
            'explain_called'       => false,
            'prediction_date'      => now()->subDays(rand(1, 30)),
        ];
    }

    public function highRisk(): static
    {
        return $this->state([
            'risk_probability'     => $this->faker->randomFloat(4, 0.60, 0.95),
            'prediction'           => 1,
            'label'                => 'SCBU Admission Likely',
            'risk_level'           => 'High',
            'binary_flags'         => [
                'gestational_diabetes' => 1,
                'multiple_pregnancy'   => 0,
                'hypertension'         => 1,
                'obese'                => 1,
                'obesity_bmi_ge_35'    => 1,
                'twins_or_more'        => 0,
                'previous_caesarean'   => 1,
            ],
            'shap_top_features' => [
                ['feature' => 'gestational_diabetes', 'value' => 1, 'contribution' => 0.35],
                ['feature' => 'bmi_at_booking', 'value' => 37.5, 'contribution' => 0.20],
                ['feature' => 'hypertension', 'value' => 1, 'contribution' => 0.18],
            ],
        ]);
    }

    public function lowRisk(): static
    {
        return $this->state([
            'risk_probability' => $this->faker->randomFloat(4, 0.02, 0.15),
            'prediction'       => 0,
            'label'            => 'Routine Postnatal Care',
            'risk_level'       => 'Low',
        ]);
    }
}
