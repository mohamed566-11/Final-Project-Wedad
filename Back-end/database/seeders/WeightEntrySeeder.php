<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\WeightEntry;
use Carbon\Carbon;

class WeightEntrySeeder extends Seeder
{
    public function run()
    {
        $users = User::with('profile')->get();

        foreach ($users as $user) {
            $baseWeight = $user->profile?->weight ?? 65;
            $height = $user->profile?->height ?? 165;
            
            for ($i = 30; $i >= 0; $i -= 7) {
                WeightEntry::create([
                    'user_id' => $user->id,
                    'weight' => $baseWeight + ($i === 0 ? 0 : rand(-2, 2)),
                    'height' => $height,
                    'entry_date' => Carbon::now()->subDays($i),
                    'entry_time' => '08:00:00',
                    'notes' => $i === 0 ? 'قياس هذا الأسبوع' : null,
                ]);
            }
        }
    }
}

