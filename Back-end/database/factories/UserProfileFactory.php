<?php

namespace Database\Factories;

use App\Models\UserProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserProfileFactory extends Factory
{
    protected $model = UserProfile::class;

    public function definition(): array
    {
        return [
            'user_id'                  => User::factory(),
            'height'                   => $this->faker->randomFloat(2, 150, 180),
            'weight'                   => $this->faker->randomFloat(2, 45, 95),
            'blood_type'               => $this->faker->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'date_of_birth'            => $this->faker->dateTimeBetween('-40 years', '-18 years')->format('Y-m-d'),
            'national_id'              => $this->faker->numerify('2##########'),
            'blood_pressure_systolic'  => $this->faker->numberBetween(100, 140),
            'blood_pressure_diastolic' => $this->faker->numberBetween(60, 90),
            'medical_history'          => $this->faker->optional()->sentence(),
            'chronic_diseases'         => [],
            'allergies'                => [],
            'current_medications'      => [],
            'emergency_contact_name'   => $this->faker->name(),
            'emergency_contact_phone'  => '01' . $this->faker->randomElement(['0','1','2','5']) . $this->faker->numerify('########'),
        ];
    }

    public function complete(): static
    {
        return $this->state([
            'national_id'     => $this->faker->numerify('2##########'),
            'medical_history' => $this->faker->paragraph(),
            'chronic_diseases'=> ['hypertension'],
            'allergies'       => ['penicillin'],
        ]);
    }

    public function minimal(): static
    {
        return $this->state([
            'national_id'   => null,
            'chronic_diseases' => [],
            'allergies'        => [],
        ]);
    }
}
