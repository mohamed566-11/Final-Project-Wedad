<?php

namespace Database\Factories;

use App\Models\LabTestResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabTestResultFactory extends Factory
{
    protected $model = LabTestResult::class;

    public function definition(): array
    {
        return [
            'user_id'    => User::factory(),
            'image_path' => 'lab-tests/' . $this->faker->uuid() . '.jpg',
            'image_hash' => $this->faker->sha256(),
            'status'     => 'pending',
            'results_json' => null,
            'tests_count'  => 0,
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'status'       => 'completed',
            'results_json' => ['tests' => [['name' => 'Hemoglobin', 'value' => 13.5, 'unit' => 'g/dL', 'status' => 'normal']]],
            'tests_count'  => 1,
            'processed_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state([
            'status'        => 'failed',
            'error_message' => 'OCR service unavailable',
        ]);
    }
}
