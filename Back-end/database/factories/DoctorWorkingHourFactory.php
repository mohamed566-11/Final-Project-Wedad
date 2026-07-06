<?php

namespace Database\Factories;

use App\Models\DoctorWorkingHour;
use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

class DoctorWorkingHourFactory extends Factory
{
    protected $model = DoctorWorkingHour::class;

    public function definition(): array
    {
        return [
            'doctor_id'  => Doctor::factory(),
            'day' => $this->faker->randomElement(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
            'start_time' => '09:00',
        ];
    }
}
