<?php

namespace Database\Factories;

use App\Models\PretermBirthPrediction;
use App\Models\Pregnancy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PretermBirthPredictionFactory extends Factory
{
    protected $model = PretermBirthPrediction::class;

    public function definition(): array
    {
        return [
            'user_id'                => User::factory(),
            'pregnancy_id'           => Pregnancy::factory(),
            'maternal_age'           => rand(18, 45),
            'bmi'                    => $this->faker->randomFloat(1, 18, 40),
            'systolic_bp'            => rand(90, 120),
            'diastolic_bp'           => rand(60, 80),
            'bs'                     => $this->faker->randomFloat(1, 4, 7),
            'mental_health'          => false,
            'previous_complications' => false,
            'risk_level'             => 'low',
            'probability_high'       => $this->faker->randomFloat(4, 0.05, 0.25),
            'model_version'          => 'v1.0.0',
            'prediction_date'        => now()->subDays(rand(1, 30)),
        ];
    }

    public function highRisk(): static
    {
        return $this->state([
            'risk_level'             => 'high',
            'probability_high'       => $this->faker->randomFloat(4, 0.70, 0.95),
            'mental_health'          => true,
            'previous_complications' => true,
            'systolic_bp'            => rand(135, 160),
            'diastolic_bp'           => rand(85, 100),
        ]);
    }

    public function lowRisk(): static
    {
        return $this->state([
            'risk_level'       => 'low',
            'probability_high' => $this->faker->randomFloat(4, 0.05, 0.20),
        ]);
    }
}
