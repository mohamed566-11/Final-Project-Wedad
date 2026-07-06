<?php

namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationFactory extends Factory
{
    protected $model = Consultation::class;

    public function definition(): array
    {
        return [
            'doctor_id'           => Doctor::factory(),
            'user_id'             => User::factory(),
            'date'                => Carbon::now()->addDays(rand(1, 30))->toDateString(),
            'time'                => $this->faker->randomElement(['09:00', '10:00', '11:00', '14:00', '15:00']) . ':00',
            'status'              => 'pending',
            'type'                => $this->faker->randomElement(['video', 'offline']),
            'price'               => $this->faker->randomFloat(2, 150, 500),
            'platform_commission' => fn(array $attr) => $attr['price'] * 0.15,
            'duration_minutes'    => 30,
            'patient_notes'       => $this->faker->optional()->sentence(),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn(array $attr) => [
            'status'     => 'completed',
            'date'       => Carbon::now()->subDays(rand(1, 30))->toDateString(),
            'started_at' => Carbon::now()->subDays(rand(1, 30))->setTime(10, 0),
            'ended_at'   => Carbon::now()->subDays(rand(1, 30))->setTime(10, 30),
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(['status' => 'confirmed']);
    }

    public function inProgress(): static
    {
        return $this->state([
            'status'     => 'in_progress',
            'started_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status'              => 'cancelled_by_patient',
            'cancellation_reason' => 'تم الإلغاء لأسباب شخصية',
        ]);
    }

    public function withGoogleMeet(): static
    {
        return $this->state([
            'type'            => 'video',
            'google_meet_link' => 'https://meet.google.com/' . $this->faker->regexify('[a-z]{3}-[a-z]{4}-[a-z]{3}'),
            'google_meet_id'  => $this->faker->regexify('[a-z]{3}-[a-z]{4}-[a-z]{3}'),
        ]);
    }
}
