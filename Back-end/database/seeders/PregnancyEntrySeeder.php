<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pregnancy;
use App\Models\PregnancyEntry;
use Carbon\Carbon;

class PregnancyEntrySeeder extends Seeder
{
    public function run()
    {
        $pregnancies = Pregnancy::with('patient.profile')->where('is_active', true)->get();

        foreach ($pregnancies as $pregnancy) {
            $currentWeek = $pregnancy->current_week;
            
            // Get base weight from profile or use default
            $baseWeight = $pregnancy->patient?->profile?->weight ?? 60;
            
            // Create entries for past weeks
            for ($week = max(1, $currentWeek - 4); $week <= $currentWeek; $week++) {
                PregnancyEntry::create([
                    'pregnancy_id' => $pregnancy->id,
                    'week_number' => $week,
                    'weight' => $baseWeight + ($week * 0.3),
                    'blood_pressure_systolic' => rand(110, 130),
                    'blood_pressure_diastolic' => rand(70, 85),
                    'symptoms' => $this->getRandomSymptoms($week),
                    'notes' => 'كل شيء على ما يرام',
                    'entry_date' => Carbon::now()->subWeeks($currentWeek - $week),
                ]);
            }
        }
    }

    private function getRandomSymptoms($week)
    {
        $earlySymptoms = ['nausea', 'fatigue', 'breast_tenderness'];
        $lateSymptoms = ['back_pain', 'swelling', 'shortness_of_breath'];
        
        return $week < 15 ? array_slice($earlySymptoms, 0, rand(1, 2)) : array_slice($lateSymptoms, 0, rand(1, 2));
    }
}

