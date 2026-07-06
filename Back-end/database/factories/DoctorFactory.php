<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\LifeStage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        $specialties = [
            'gynecology',
            'obstetrics',
            'fertility',
            'endocrinology',
            'general_practitioner',
            'pediatrics',
            'nutrition',
            'other',
        ];

        $arabicNames = ['أمل حسن', 'منى إبراهيم', 'هالة محمود', 'نادية علي', 'سمر خالد'];

        return [
            'name'                => $this->faker->randomElement($arabicNames),
            'email'               => $this->faker->unique()->safeEmail(),
            'password'            => Hash::make('password'),
            'phone'               => '01' . $this->faker->randomElement(['0', '1', '2', '5']) . $this->faker->numerify('########'),
            'specialization'      => $this->faker->randomElement($specialties),
            'consultation_price'  => $this->faker->numberBetween(150, 500),
            'bio'                 => $this->faker->paragraph(),
            'verification_status' => 'approved',
            'is_active'           => true,
            'license_number'      => $this->faker->unique()->numerify('LIC-#####'),
        ];
    }

    public function approved(): static
    {
        return $this->state([
            'verification_status' => 'approved',
            'verified_at'         => now(),
            'is_active'           => true,
        ]);
    }

    public function pending(): static
    {
        return $this->state([
            'verification_status' => 'pending',
            'verified_at'         => null,
        ]);
    }

    public function rejected(): static
    {
        return $this->state([
            'verification_status' => 'rejected',
            'rejection_reason'    => 'المستندات المرفوعة غير واضحة',
        ]);
    }
}