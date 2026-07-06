<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\Weight\StoreWeightRequest;
use App\Http\Resources\Patient\WeightResource;
use App\Models\WeightEntry;
use App\Services\Patient\PatientDataCollectorService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class WeightController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $period = $request->input('period', 'all');
        $limit = $request->input('limit', 50);

        $query = WeightEntry::where('user_id', $userId);

        if ($period !== 'all') {
            $startDate = match ($period) {
                'week' => Carbon::today()->subWeek(),
                'month' => Carbon::today()->subMonth(),
                '3months' => Carbon::today()->subMonths(3),
                '6months' => Carbon::today()->subMonths(6),
                'year' => Carbon::today()->subYear(),
                default => Carbon::today()->subMonth()
            };
            $query->where('entry_date', '>=', $startDate);
        }

        $entries = $query->orderBy('entry_date', 'desc')
            ->orderBy('entry_time', 'desc')
            ->paginate($limit);

        // Stats using aggregates
        $weightStats = WeightEntry::where('user_id', $userId)
            ->selectRaw('MIN(weight) as min_weight, MAX(weight) as max_weight, AVG(weight) as avg_weight, COUNT(*) as total_count')
            ->first();

        $startingEntry = WeightEntry::where('user_id', $userId)->orderBy('entry_date', 'asc')->first();
        $currentEntry = WeightEntry::where('user_id', $userId)->orderBy('entry_date', 'desc')->first();

        if ($currentEntry && $startingEntry) {
            $current = $currentEntry->weight;
            $starting = $startingEntry->weight;
            $change = $current - $starting;
            $trend = $change > 0 ? 'increasing' : ($change < 0 ? 'decreasing' : 'stable');
        } else {
            $current = $starting = $change = 0;
            $trend = 'stable';
        }

        $responseData = [
            'entries' => WeightResource::collection($entries)->resolve(),
            'stats' => [
                'current_weight' => round((float) $current, 2),
                'starting_weight' => round((float) $starting, 2),
                'total_change' => round((float) $change, 2),
                'average_weight' => round((float) ($weightStats->avg_weight ?? 0), 2),
                'min_weight' => round((float) ($weightStats->min_weight ?? 0), 2),
                'max_weight' => round((float) ($weightStats->max_weight ?? 0), 2),
                'total_entries' => (int) ($weightStats->total_count ?? 0),
                'trend' => $trend
            ]
        ];

        return $this->successResponse($responseData, 'Weight entries retrieved successfully');
    }

    public function store(StoreWeightRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['entry_date'] = $data['entry_date'] ?? now()->toDateString();
        $data['entry_time'] = $data['entry_time'] ?? now()->format('H:i');

        // Calculate BMI
        if (isset($data['height']) && $data['height'] > 0) {
            $heightM = $data['height'] / 100;
            $data['bmi'] = round($data['weight'] / ($heightM * $heightM), 2);
        } else {
            // Try to get height from profile or last entry
            $lastEntry = WeightEntry::where('user_id', $data['user_id'])->whereNotNull('height')->latest()->first();
            if ($lastEntry) {
                $data['height'] = $lastEntry->height;
                $heightM = $data['height'] / 100;
                $data['bmi'] = round($data['weight'] / ($heightM * $heightM), 2);
            }
        }

        $entry = WeightEntry::create($data);

        // Update UserProfile weight and bmi automatically Sync
        $userProfile = \App\Models\UserProfile::firstOrCreate(['user_id' => $data['user_id']]);
        $userProfile->weight = $data['weight'];
        if (isset($data['height'])) {
            $userProfile->height = $data['height'];
        }
        $userProfile->save();

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache($data['user_id']);

        return $this->successResponse(new WeightResource($entry), 'Weight entry added successfully', 201);
    }

    public function chart(Request $request)
    {
        $userId = $request->user()->id;
        $period = $request->input('period', 'month');

        $startDate = match ($period) {
            'week' => Carbon::today()->subWeek(),
            '3months' => Carbon::today()->subMonths(3),
            '6months' => Carbon::today()->subMonths(6),
            'year' => Carbon::today()->subYear(),
            default => Carbon::today()->subMonth()
        };

        $entries = WeightEntry::where('user_id', $userId)
            ->where('entry_date', '>=', $startDate)
            ->orderBy('entry_date')
            ->get(['entry_date', 'weight', 'bmi']);

        $chartData = $entries->map(function ($entry) {
            return [
                'date' => $entry->entry_date->format('Y-m-d'),
                'weight' => (float) $entry->weight,
                'bmi' => (float) $entry->bmi
            ];
        });

        return $this->successResponse([
            'chart_data' => $chartData,
            'goal' => 65.0, // Mock goal for now, ideally derived from a Goal model
            'progress_percentage' => 75 // Mock
        ], 'Chart data retrieved successfully');
    }

    public function destroy($id)
    {
        $userId = request()->user()->id;
        $entry = WeightEntry::where('user_id', $userId)->find($id);

        if (!$entry) {
            return $this->errorResponse('Entry not found', 404);
        }

        $entry->delete();

        // Update UserProfile weight with the latest available entry
        $latestEntry = WeightEntry::where('user_id', $userId)->orderBy('entry_date', 'desc')->orderBy('entry_time', 'desc')->first();
        $userProfile = \App\Models\UserProfile::where('user_id', $userId)->first();
        if ($userProfile) {
            if ($latestEntry) {
                $userProfile->weight = $latestEntry->weight;
                $userProfile->save();
            } else {
                $userProfile->weight = null;
                $userProfile->save();
            }
        }

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache($userId);

        return $this->successResponse(null, 'Weight entry deleted successfully');
    }
}
