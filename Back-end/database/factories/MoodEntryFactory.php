<?php

namespace Database\Factories;

use App\Models\MoodEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class MoodEntryFactory extends Factory
{
    protected $model = MoodEntry::class;

    public function definition(): array
    {
        static $dayOffset = 0;
        $dayOffset++;
        return [
            'user_id'    => User::factory(),
            'mood'       => $this->faker->randomElement(['very_bad', 'bad', 'neutral', 'good', 'very_good']),
            'notes'      => $this->faker->optional()->sentence(),
            'factors'    => $this->faker->randomElements(['sleep', 'work', 'health', 'diet', 'exercise', 'stress'], rand(1, 3)),
            'entry_date' => Carbon::today()->subDays($dayOffset)->toDateString(),
            'entry_time' => $this->faker->time('H:i'),
        ];
    }
}

