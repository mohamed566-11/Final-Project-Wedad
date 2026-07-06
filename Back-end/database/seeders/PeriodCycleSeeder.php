<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PeriodCycle;
use App\Models\LifeStage;
use Carbon\Carbon;

class PeriodCycleSeeder extends Seeder
{
    public function run()
    {
        // Get non-pregnant life stages (pre_marriage and married-life from LifeStageSeeder)
        $nonPregnantStages = LifeStage::whereIn('name', ['pre-marriage', 'married-life'])->pluck('id');
        $users = User::whereIn('life_stage_id', $nonPregnantStages)->get();

        $flows = ['light', 'medium', 'heavy'];

        foreach ($users as $user) {
            // Last 3 cycles
            for ($i = 2; $i >= 0; $i--) {
                $startDate = Carbon::now()->subDays(28 * $i);
                $endDate = $startDate->copy()->addDays(5);

                PeriodCycle::create([
                    'user_id' => $user->id,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'cycle_length' => 28,
                    'period_length' => 5,
                    'flow' => $flows[array_rand($flows)],
                    'symptoms' => ['cramps', 'mood_swings', 'headache'],
                    'notes' => 'دورة منتظمة',
                    'is_predicted' => false,
                ]);
            }
        }
    }
}

