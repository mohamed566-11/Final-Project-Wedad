<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Pregnancy;
use App\Models\LifeStage;
use Carbon\Carbon;

class PregnancySeeder extends Seeder
{
    public function run()
    {
        $pregnancyStage = LifeStage::where('name', 'motherhood')->first();
        $pregnantUsers = User::where('life_stage_id', $pregnancyStage->id)->get();

        foreach ($pregnantUsers as $user) {
            $lmp = Carbon::now()->subWeeks(rand(8, 32));
            $dueDate = $lmp->copy()->addDays(280);
            
            Pregnancy::create([
                'user_id' => $user->id,
                'last_menstrual_period' => $lmp,
                'due_date' => $dueDate,
                'current_week' => Carbon::now()->diffInWeeks($lmp),
                'is_active' => true,
                'pregnancy_status' => 'ongoing',
            ]);
        }
    }
}
