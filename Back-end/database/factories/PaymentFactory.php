<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Consultation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $amount      = $this->faker->randomFloat(2, 150, 500);
        $platform    = $amount * 0.15;
        $doctorAmt   = $amount - $platform;

        return [
            'user_id'         => User::factory(),
            'consultation_id' => Consultation::factory()->completed(),
            'transaction_id'  => 'TXN-' . strtoupper(Str::random(12)),
            'amount'          => $amount,
            'platform_fee'    => $platform,
            'doctor_amount'   => $doctorAmt,
            'status'          => 'completed',
            'payment_method'  => $this->faker->randomElement(['paymob_card', 'paymob_wallet']),
            'paymob_response' => ['success' => true, 'transaction_id' => Str::random(8)],
            'paid_at'         => now()->subDays(rand(1, 30)),
            'failure_reason'  => null,
        ];
    }

    public function pending(): static
    {
        return $this->state([
            'status'  => 'pending',
            'paid_at' => null,
        ]);
    }

    public function success(): static
    {
        return $this->state([
            'status'  => 'completed',
            'paid_at' => now()->subDays(rand(1, 10)),
        ]);
    }

    public function failed(): static
    {
        return $this->state([
            'status'         => 'failed',
            'paid_at'        => null,
            'failure_reason' => 'رفض البنك العملية — بيانات البطاقة غير صحيحة.',
        ]);
    }
}
