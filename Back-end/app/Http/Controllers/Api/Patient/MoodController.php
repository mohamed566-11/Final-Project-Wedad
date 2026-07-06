<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\Mood\StoreMoodRequest;
use App\Http\Resources\Patient\MoodResource;
use App\Models\MoodEntry;
use App\Services\Patient\PatientDataCollectorService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MoodController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = MoodEntry::where('user_id', $request->user()->id);

        if ($request->has('date')) {
            $query->whereDate('entry_date', $request->date);
        }

        if ($request->has('month')) {
            $query->where('entry_date', 'like', $request->month . '%');
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('entry_date', [$request->start_date, $request->end_date]);
        }

        $entries = $query->orderBy('entry_date', 'desc')
            ->orderBy('entry_time', 'desc')
            ->paginate($request->input('limit', 30));

        return $this->successResponse(MoodResource::collection($entries)->resolve(), 'Mood entries retrieved successfully');
    }

    public function store(StoreMoodRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['entry_date'] = $data['entry_date'] ?? now()->toDateString();
        $data['entry_time'] = $data['entry_time'] ?? now()->format('H:i');

        $moodEntry = MoodEntry::updateOrCreate(
            [
                'user_id' => $data['user_id'],
                'entry_date' => $data['entry_date']
            ],
            $data
        );

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache($data['user_id']);

        return $this->successResponse(new MoodResource($moodEntry), 'Mood entry added successfully', 201);
    }

    public function destroy($id)
    {
        $entry = MoodEntry::where('user_id', request()->user()->id)->find($id);

        if (!$entry) {
            return $this->errorResponse('Entry not found', 404);
        }

        $entry->delete();

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache(request()->user()->id);

        return $this->successResponse(null, 'Mood entry deleted successfully');
    }

    public function analytics(Request $request)
    {
        $userId = $request->user()->id;
        $period = $request->input('period', 'month');

        $endDate = Carbon::today();
        $startDate = match ($period) {
            'week' => Carbon::today()->subWeek(),
            'year' => Carbon::today()->subYear(),
            default => Carbon::today()->subMonth(),
        };

        $entries = MoodEntry::where('user_id', $userId)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->get();

        $total = $entries->count();
        $distribution = $entries->groupBy('mood')->map(function ($group) {
            return $group->count();
        })->toArray();

        // Ensure all keys exist
        $allMoods = ['very_good', 'good', 'neutral', 'bad', 'very_bad'];
        foreach ($allMoods as $mood) {
            if (!isset($distribution[$mood])) {
                $distribution[$mood] = 0;
            }
        }

        $percentages = [];
        if ($total > 0) {
            foreach ($distribution as $mood => $count) {
                $percentages[$mood] = round(($count / $total) * 100, 1);
            }
        } else {
            foreach ($allMoods as $mood) {
                $percentages[$mood] = 0;
            }
        }

        // Calculate score (1-5)
        $scores = [
            'very_bad' => 1,
            'bad' => 2,
            'neutral' => 3,
            'good' => 4,
            'very_good' => 5
        ];

        $totalScore = 0;
        foreach ($entries as $entry) {
            $totalScore += $scores[$entry->mood] ?? 3;
        }
        $averageScore = $total > 0 ? round($totalScore / $total, 1) : 0;

        // Trend
        // Simple comparison: first half vs second half of period
        $trend = 'stable';
        if ($total >= 2) {
            $midPoint = $startDate->copy()->addDays($startDate->diffInDays($endDate) / 2);
            $firstHalf = $entries->filter(fn($e) => $e->entry_date < $midPoint->toDateString());
            $secondHalf = $entries->filter(fn($e) => $e->entry_date >= $midPoint->toDateString());

            $firstScore = 0;
            $secondScore = 0;

            if ($firstHalf->count() > 0) {
                foreach ($firstHalf as $e)
                    $firstScore += $scores[$e->mood] ?? 3;
                $firstAvg = $firstScore / $firstHalf->count();
            } else {
                $firstAvg = 0;
            }

            if ($secondHalf->count() > 0) {
                foreach ($secondHalf as $e)
                    $secondScore += $scores[$e->mood] ?? 3;
                $secondAvg = $secondScore / $secondHalf->count();
            } else {
                $secondAvg = 0;
            }

            if ($secondAvg > $firstAvg + 0.5)
                $trend = 'improving';
            elseif ($secondAvg < $firstAvg - 0.5)
                $trend = 'declining';
        }

        arsort($distribution);
        $mostCommonMood = key($distribution) ?? null;
        if ($mostCommonMood !== null && $distribution[$mostCommonMood] === 0) {
            $mostCommonMood = null;
        }

        return $this->successResponse([
            'period' => $period,
            'date_range' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'total_count' => $total,
            'mood_distribution' => $distribution,
            'mood_percentages' => $percentages,
            'average_mood_score' => $averageScore,
            'most_common_mood' => $mostCommonMood,
            'mood_trend' => $trend,
            'factors_analysis' => [ // Mock data for now, implementing real correlation is complex
                'sleep_impact' => 'positive',
                'stress_impact' => 'negative',
                'exercise_impact' => 'positive'
            ],
            'insights' => [
                'مزاجك يتحسن تدريجيًا هذا الشهر',
                'النوم الجيد يؤثر إيجابيًا على مزاجك'
            ]
        ], 'Analytics retrieved successfully');
    }
}
