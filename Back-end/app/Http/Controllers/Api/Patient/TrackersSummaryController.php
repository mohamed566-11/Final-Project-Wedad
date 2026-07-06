<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\MoodEntry;
use App\Models\WeightEntry;
use App\Models\PeriodCycle;
use App\Models\FertilityEntry;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TrackersSummaryController extends Controller
{
    use ApiResponse;

    public function summary(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;

        // Get user's life stage
        $lifeStageSlug = null;
        if ($user->life_stage_id) {
            $lifeStage = $user->lifeStage;
            $lifeStageSlug = $lifeStage ? $lifeStage->slug : null;
        }

        // Determine which trackers are available based on life stage
        // pre-marriage: only mood & weight
        // married-life & motherhood: all trackers
        $isPreMarriage = $lifeStageSlug === 'pre-marriage';

        // Mood (available for all stages)
        $latestMood = MoodEntry::where('user_id', $userId)->orderBy('entry_date', 'desc')->first();
        $moodCount = MoodEntry::where('user_id', $userId)->count();
        
        // Weight (available for all stages)
        $latestWeight = WeightEntry::where('user_id', $userId)->orderBy('entry_date', 'desc')->first();
        $weightCount = WeightEntry::where('user_id', $userId)->count();
        $weightChange = 0;
        if ($latestWeight) {
             $prevWeight = WeightEntry::where('user_id', $userId)
                ->where('id', '!=', $latestWeight->id)
                ->orderBy('entry_date', 'desc')
                ->first();
             if ($prevWeight) {
                 $weightChange = $latestWeight->weight - $prevWeight->weight;
             }
        }

        $responseData = [
            'life_stage_slug' => $lifeStageSlug,
            'available_trackers' => $isPreMarriage 
                ? ['mood', 'weight'] 
                : ['pregnancy', 'period', 'fertility', 'mood', 'weight'],
            'mood' => [
                'latest_entry' => $latestMood,
                'total_entries' => $moodCount
            ],
            'weight' => [
                'current' => $latestWeight ? $latestWeight->weight : null,
                'change' => round($weightChange, 1),
                'total_entries' => $weightCount
            ],
        ];

        // Only include period, fertility, pregnancy for non-pre-marriage stages
        if (!$isPreMarriage) {
            // Period
            $lastPeriod = PeriodCycle::where('user_id', $userId)->orderBy('start_date', 'desc')->first();
            $isActivePeriod = $lastPeriod && is_null($lastPeriod->end_date);
            
            $nextPredicted = null;
            $daysUntilNext = null;
            
            if ($lastPeriod) {
                 $avgCycle = (int)(PeriodCycle::where('user_id', $userId)->avg('cycle_length') ?? 28);
                 $start = Carbon::parse($lastPeriod->start_date);
                 $nextPredicted = $start->addDays($avgCycle);
                 $daysUntilNext = Carbon::now()->diffInDays($nextPredicted, false);
            }

            // Fertility
            $inFertileWindow = false; 

            $responseData['period'] = [
                'last_period_start' => $lastPeriod ? $lastPeriod->start_date : null,
                'next_predicted' => $nextPredicted ? $nextPredicted->toDateString() : null,
                'days_until_next' => is_null($daysUntilNext) ? null : (int)$daysUntilNext,
                'is_active' => $isActivePeriod
            ];
            $responseData['fertility'] = [
                'in_fertile_window' => $inFertileWindow,
            ];
        }

        return $this->successResponse($responseData, 'Trackers summary retrieved successfully');
    }
}
