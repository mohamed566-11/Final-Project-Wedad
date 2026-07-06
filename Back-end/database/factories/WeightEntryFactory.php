<?php

namespace Database\Factories;

use App\Models\WeightEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class WeightEntryFactory extends Factory
{
    protected $model = WeightEntry::class;

    public function definition(): array
    {
        $weight = $this->faker->randomFloat(2, 60, 90);
        $height = $this->faker->randomFloat(2, 155, 175);
        $heightInMeters = $height / 100;
        $bmi = round($weight / ($heightInMeters * $heightInMeters), 2);

        return [
            'user_id'    => User::factory(),
            'weight'     => $weight,
            'height'     => $height,
            'bmi'        => $bmi,
            'entry_date' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'entry_time' => $this->faker->time('H:i'),
            'notes'      => $this->faker->optional()->sentence(),
        ];
    }
}
