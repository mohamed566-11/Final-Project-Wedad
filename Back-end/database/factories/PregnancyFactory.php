<?php

namespace Database\Factories;

use App\Models\Pregnancy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

class PregnancyFactory extends Factory
{
    protected $model = Pregnancy::class;

    public function definition(): array
    {
        $lmp = Carbon::now()->subWeeks(rand(8, 36));
        return [
            'user_id'                 => User::factory(),
            'last_menstrual_period'   => $lmp->toDateString(),
            'due_date'                => $lmp->copy()->addWeeks(40)->toDateString(),
            'is_active'               => true,
            'current_week'            => (int) $lmp->diffInWeeks(now()),
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function completed(): static
    {
        $lmp = Carbon::now()->subWeeks(rand(41, 52));
        return $this->state([
            'is_active'               => false,
            'last_menstrual_period'   => $lmp->toDateString(),
            'due_date'                => $lmp->copy()->addWeeks(40)->toDateString(),
            'delivery_date'           => $lmp->copy()->addWeeks(rand(38, 41))->toDateString(),
        ]);
    }

    public function firstTrimester(): static
    {
        $lmp = Carbon::now()->subWeeks(rand(4, 12));
        return $this->state([
            'last_menstrual_period' => $lmp->toDateString(),
            'current_week'          => (int) $lmp->diffInWeeks(now()),
        ]);
    }

    public function thirdTrimester(): static
    {
        $lmp = Carbon::now()->subWeeks(rand(28, 36));
        return $this->state([
            'last_menstrual_period' => $lmp->toDateString(),
            'current_week'          => (int) $lmp->diffInWeeks(now()),
        ]);
    }
}
