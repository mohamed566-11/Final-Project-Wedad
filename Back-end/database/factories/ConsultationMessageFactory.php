<?php

namespace Database\Factories;

use App\Models\ConsultationMessage;
use App\Models\Consultation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationMessageFactory extends Factory
{
    protected $model = ConsultationMessage::class;

    public function definition(): array
    {
        return [
            'consultation_id' => Consultation::factory(),
            'sender_type'     => $this->faker->randomElement(['doctor', 'patient']),
            'sender_id'       => 1,
            'message'         => $this->faker->sentence(),
        ];
    }
}
