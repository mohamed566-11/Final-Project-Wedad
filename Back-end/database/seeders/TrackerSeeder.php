<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\WeightEntry;
use App\Models\MoodEntry;
use App\Models\PeriodCycle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TrackerSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // Get all patients
            $patients = User::whereNotNull('life_stage_id')->get();

            foreach ($patients as $patient) {
                // Determine if patient should get period cycles based on life stage
                $stageName = $patient->lifeStage?->name;
                $shouldHavePeriods = !in_array($stageName, ['pregnancy']);

                // Seed Weight Entries (1 to 5 entries per patient)
                for ($i = 0; $i < rand(1, 5); $i++) {
                    $height = $patient->profile?->height ?? 165;
                    $weight = rand(60, 90) + (rand(0, 99) / 100);
                    $heightInM = $height / 100;
                    
                    WeightEntry::updateOrCreate(
                        [
                            'user_id' => $patient->id,
                            'entry_date' => Carbon::now()->subDays(rand(1, 60))->format('Y-m-d')
                        ],
                        [
                            'weight' => $weight,
                            'height' => $height,
                            'bmi'    => round($weight / ($heightInM * $heightInM), 2),
                            'entry_time' => Carbon::now()->subHours(rand(1, 10))->format('H:i'),
                            'notes' => 'سجل تلقائي'
                        ]
                    );
                }

                // Seed Mood Entries (1 to 5 entries per patient)
                for ($i = 0; $i < rand(1, 5); $i++) {
                    MoodEntry::updateOrCreate(
                        [
                            'user_id' => $patient->id,
                            'entry_date' => Carbon::now()->subDays(rand(1, 30))->format('Y-m-d')
                        ],
                        [
                            'mood' => collect(['very_bad', 'bad', 'neutral', 'good', 'very_good'])->random(),
                            'factors' => collect(['sleep', 'work', 'health', 'diet', 'exercise', 'stress'])->random(2)->toArray(),
                            'entry_time' => Carbon::now()->subHours(rand(1, 10))->format('H:i'),
                        ]
                    );
                }

                // Seed Period Cycles for non-pregnant patients
                if ($shouldHavePeriods) {
                    $startDate = Carbon::now()->subDays(rand(10, 60));
                    $periodLength = rand(4, 7);
                    
                    PeriodCycle::updateOrCreate(
                        [
                            'user_id' => $patient->id,
                            'start_date' => $startDate->format('Y-m-d')
                        ],
                        [
                            'end_date' => $startDate->copy()->addDays($periodLength - 1)->format('Y-m-d'),
                            'cycle_length' => rand(26, 30),
                            'period_length' => $periodLength,
                            'flow' => collect(['light', 'medium', 'heavy'])->random(),
                            'symptoms' => collect(['cramps', 'headache', 'bloating'])->random(1)->toArray(),
                            'is_predicted' => false,
                        ]
                    );
                }
            }
        });
    }
}
