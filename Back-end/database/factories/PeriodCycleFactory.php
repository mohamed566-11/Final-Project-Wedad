<?php

namespace Database\Factories;

use App\Models\PeriodCycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class PeriodCycleFactory extends Factory
{
    protected $model = PeriodCycle::class;

    public function definition(): array
    {
        $startDate = Carbon::instance($this->faker->dateTimeBetween('-60 days', 'now'));
        $periodLength = $this->faker->numberBetween(3, 7);
        $endDate = clone $startDate;
        $endDate->addDays($periodLength - 1);

        return [
            'user_id'      => User::factory(),
            'start_date'   => $startDate->format('Y-m-d'),
            'end_date'     => $endDate->format('Y-m-d'),
            'cycle_length' => $this->faker->numberBetween(25, 32),
            'period_length'=> $periodLength,
            'flow'         => $this->faker->randomElement(['light', 'medium', 'heavy']),
            'symptoms'     => $this->faker->randomElements(['cramps', 'headache', 'bloating', 'fatigue', 'mood_swings'], rand(1, 3)),
            'notes'        => $this->faker->optional()->sentence(),
            'is_predicted' => false,
        ];
    }
}
