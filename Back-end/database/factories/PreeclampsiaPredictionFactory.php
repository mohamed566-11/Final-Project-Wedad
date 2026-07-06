<?php

namespace Database\Factories;

use App\Models\PreeclampsiaPrediction;
use App\Models\Pregnancy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PreeclampsiaPredictionFactory extends Factory
{
    protected $model = PreeclampsiaPrediction::class;

    public function definition(): array
    {
        return [
            'user_id'          => User::factory(),
            'pregnancy_id'     => Pregnancy::factory(),
            'gravida'          => rand(1, 4),
            'parity'           => rand(0, 3),
            'maternal_age'     => rand(18, 45),
            'bmi'              => $this->faker->randomFloat(1, 18, 40),
            'diabetes'         => false,
            'htn'              => false,
            'systolic_bp'      => rand(90, 120),
            'diastolic_bp'     => rand(60, 80),
            'hb'               => $this->faker->randomFloat(1, 9, 14),
            'proteinuria'      => false,
            'risk_level'       => 'low',
            'probability'      => $this->faker->randomFloat(4, 0.05, 0.25),
            'model_version'    => 'v1.0',
            'algorithm_used'   => 'XGBoost',
            'prediction_date'  => now()->subDays(rand(1, 30)),
        ];
    }

    public function highRisk(): static
    {
        return $this->state([
            'risk_level'   => 'high',
            'probability'  => $this->faker->randomFloat(4, 0.70, 0.95),
            'htn'          => true,
            'diabetes'     => true,
            'proteinuria'  => true,
            'systolic_bp'  => rand(140, 180),
            'diastolic_bp' => rand(90, 110),
        ]);
    }

    public function lowRisk(): static
    {
        return $this->state([
            'risk_level'  => 'low',
            'probability' => $this->faker->randomFloat(4, 0.05, 0.25),
        ]);
    }

    public function moderate(): static
    {
        return $this->state([
            'risk_level'  => 'moderate',
            'probability' => $this->faker->randomFloat(4, 0.30, 0.60),
        ]);
    }
}
