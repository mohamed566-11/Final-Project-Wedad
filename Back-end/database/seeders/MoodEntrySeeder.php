<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\MoodEntry;
use Carbon\Carbon;

class MoodEntrySeeder extends Seeder
{
    public function run()
    {
        $users = User::take(3)->get();
        $moods = ['very_bad', 'bad', 'neutral', 'good', 'very_good'];

        foreach ($users as $user) {
            for ($i = 14; $i >= 0; $i--) {
                MoodEntry::create([
                    'user_id' => $user->id,
                    'mood' => $moods[array_rand($moods)],
                    'notes' => rand(0, 1) ? 'شعرت بتحسن اليوم' : null,
                    'factors' => [
                        'sleep' => rand(4, 9),
                        'stress' => rand(1, 5),
                        'exercise' => rand(0, 1),
                    ],
                    'entry_date' => Carbon::now()->subDays($i),
                    'entry_time' => '20:00:00',
                ]);
            }
        }
    }
}
