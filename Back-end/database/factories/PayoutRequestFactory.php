<?php

namespace Database\Factories;

use App\Models\PayoutRequest;
use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayoutRequestFactory extends Factory
{
    protected $model = PayoutRequest::class;

    public function definition(): array
    {
        return [
            'doctor_id' => Doctor::factory(),
            'amount'    => $this->faker->randomFloat(2, 100, 5000),
            'status'    => 'pending',
            'method'    => $this->faker->randomElement(['bank_transfer', 'instapay', 'vodafone_cash']),
            'details'   => ['account_number' => $this->faker->bankAccountNumber()],
        ];
    }

    public function approved(): static
    {
        return $this->state([
            'status'       => 'approved',
            'processed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state([
            'status'     => 'rejected',
            'admin_note' => 'Insufficient documentation',
        ]);
    }
}
