<?php 
namespace Database\Factories;

use App\Models\User;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class PatientFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name('female'), // أسماء إناث فقط
            'email' => $this->faker->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'phone' => $this->faker->phoneNumber(),
            'birth_date' => $this->faker->dateTimeBetween('-40 years', '-18 years'),
            'life_stage_id' => $this->faker->numberBetween(1, 3), // 1, 2, or 3
        ];
    }
}