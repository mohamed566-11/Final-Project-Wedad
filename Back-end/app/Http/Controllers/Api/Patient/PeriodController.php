<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\Period\StartPeriodRequest;
use App\Http\Requests\Patient\Period\EndPeriodRequest;
use App\Http\Resources\Patient\PeriodResource;
use App\Models\FertilityEntry;
use App\Models\PeriodCycle;
use App\Services\Patient\PeriodAnalyticsService as Analytics;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * PeriodController — Production-ready implementation.
 *
 * Tasks addressed:
 *  T1  Weighted average cycle length
 *  T2  Dynamic prediction confidence scoring
 *  T3  Overlap / duplicate-start prevention
 *  T4  Comprehensive validation (via Request classes + controller guards)
 *  T5  Fertility prediction via entry indicators
 *  T6  Fertility score (0-100)
 *  T7  Cycle health score (0-100)
 *  T8  GET /period/analytics endpoint
 *  T9  N+1 removal – single queries, select(); indexes in migration
 *  T11 Timezone-safe date comparisons (Carbon with app timezone)
 *  T13 Consistent API responses via ApiResponse trait
 *  T14 Irregular-cycle prediction ranges
 */
class PeriodController extends Controller
{
    use ApiResponse;

    // ──────────────────────────────────────────────────────────────────────────
    // GET /period  — list cycles + current cycle + stats
    // ──────────────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $limit  = (int) $request->input('limit', 12);
        $userId = $request->user()->id;

        // TASK 9 — one paginated query, one current-cycle query
        $cycles = PeriodCycle::where('user_id', $userId)
            ->where('is_predicted', false)
            ->orderBy('start_date', 'desc')
            ->paginate($limit);

        $currentCycle = PeriodCycle::where('user_id', $userId)
            ->whereNull('end_date')
            ->where('is_predicted', false)
            ->first();

        // Single query → pull all cycle lengths & period lengths at once
        $allCycles = PeriodCycle::where('user_id', $userId)
            ->where('is_predicted', false)
            ->orderBy('start_date', 'asc')           // oldest first for weighting
            ->select('cycle_length', 'period_length', 'symptoms')
            ->get();

        $cycleLengths  = $allCycles->whereNotNull('cycle_length')->pluck('cycle_length')->toArray();
        $periodLengths = $allCycles->whereNotNull('period_length')->pluck('period_length')->toArray();
        $cycleCount    = count($cycleLengths);

        // TASK 1, 2
        $stdDev        = Analytics::stdDev($cycleLengths);
        $weightedAvg   = Analytics::weightedCycleLength($cycleLengths);
        $confidence    = Analytics::predictionConfidence($cycleCount, $stdDev);
        $regularity    = Analytics::regularityLabel($cycleCount, $stdDev);

        $avgCycleLength  = $cycleCount  > 0 ? round(array_sum($cycleLengths)  / $cycleCount, 1)  : 28.0;
        $avgPeriodLength = count($periodLengths) > 0 ? round(array_sum($periodLengths) / count($periodLengths), 1) : 5.0;

        // TASK 9 — aggregate symptoms in PHP (avoid a second GROUP BY query)
        $allSymptoms = $allCycles
            ->pluck('symptoms')
            ->flatten()
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(3)
            ->toArray();

        // TASK 7
        $healthScore = Analytics::cycleHealthScore(
            $cycleCount, $avgCycleLength, $avgPeriodLength, $stdDev, $allSymptoms
        );

        $collection = PeriodResource::collection($cycles);
        $collection->additional([
            'current_cycle' => $currentCycle ? new PeriodResource($currentCycle) : null,
            'stats' => [
                'average_cycle_length'   => $avgCycleLength,
                'weighted_cycle_length'  => $weightedAvg,   // TASK 1
                'average_period_length'  => $avgPeriodLength,
                'cycle_count'            => $cycleCount,
                'cycle_regularity'       => $regularity,
                'std_dev'                => round($stdDev, 1),
                'most_common_symptoms'   => $allSymptoms,
                'health_score'           => $healthScore,   // TASK 7
                'confidence'             => $confidence,     // TASK 2
            ],
        ]);

        return $this->successResponse($collection, 'Period cycles retrieved successfully');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /period/start  — begin a new cycle
    // ──────────────────────────────────────────────────────────────────────────
    public function store(StartPeriodRequest $request)
    {
        $data      = $request->validated();
        $user      = $request->user();
        $userId    = $user->id;

        // TASK 11 — parse in UTC, compare dates only
        $startDate = Carbon::parse($data['start_date'])->startOfDay();

        // TASK 3 — Block active cycle
        $activeCycle = PeriodCycle::where('user_id', $userId)
            ->whereNull('end_date')
            ->where('is_predicted', false)
            ->first();
        if ($activeCycle) {
            return $this->errorResponse('لديك دورة نشطة بالفعل. أنهي الدورة الحالية أولاً.', 400);
        }

        // TASK 3 — Block overlapping cycles
        $overlap = PeriodCycle::where('user_id', $userId)
            ->where('is_predicted', false)
            ->where(function ($q) use ($startDate) {
                $q->where('start_date', $startDate->toDateString())
                  ->orWhere(function ($q2) use ($startDate) {
                      // startDate falls inside an existing [start, end] range
                      $q2->whereNotNull('end_date')
                         ->where('start_date', '<=', $startDate->toDateString())
                         ->where('end_date',   '>=', $startDate->toDateString());
                  });
            })
            ->exists();

        if ($overlap) {
            return $this->errorResponse('يتداخل هذا التاريخ مع دورة موجودة مسبقاً.', 422);
        }

        // TASK 1 — Auto-calculate previous cycle's length
        $previousCycle = PeriodCycle::where('user_id', $userId)
            ->where('is_predicted', false)
            ->orderBy('start_date', 'desc')
            ->select('id', 'start_date')
            ->first();

        if ($previousCycle) {
            $prevStart   = Carbon::parse($previousCycle->start_date)->startOfDay();
            $cycleLength = (int) $prevStart->diffInDays($startDate);

            // TASK 4 — Guard impossible cycle lengths
            if ($cycleLength < 15 || $cycleLength > 90) {
                return $this->errorResponse(
                    "طول الدورة ({$cycleLength} يوم) غير طبيعي. الحد المقبول 15–90 يوماً.",
                    422
                );
            }

            $previousCycle->update(['cycle_length' => $cycleLength]);
        }

        $cycle = PeriodCycle::create([
            'user_id'      => $userId,
            'start_date'   => $startDate->toDateString(),
            'flow'         => $data['flow']     ?? null,
            'symptoms'     => $data['symptoms'] ?? [],
            'notes'        => $data['notes']    ?? null,
            'is_predicted' => false,
        ]);

        return $this->successResponse(new PeriodResource($cycle), 'تم تسجيل بداية الدورة بنجاح', 201);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /period/{id}/end  — end an active cycle
    // ──────────────────────────────────────────────────────────────────────────
    public function endCycle(EndPeriodRequest $request, int $id)
    {
        $cycle = PeriodCycle::where('user_id', $request->user()->id)
            ->where('is_predicted', false)
            ->find($id);

        if (!$cycle) {
            return $this->errorResponse('الدورة غير موجودة.', 404);
        }

        if ($cycle->end_date) {
            return $this->errorResponse('هذه الدورة منتهية مسبقاً.', 422);
        }

        // TASK 11 — timezone-safe
        $endDate   = Carbon::parse($request->end_date)->startOfDay();
        $startDate = Carbon::parse($cycle->start_date)->startOfDay();

        if ($endDate->lt($startDate)) {
            return $this->errorResponse('تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء.', 422);
        }

        $periodLength = (int) $startDate->diffInDays($endDate) + 1;

        // TASK 4 — Guard impossible period lengths
        if ($periodLength < 1 || $periodLength > 15) {
            return $this->errorResponse(
                "مدة الدورة ({$periodLength} يوم) خارج النطاق الطبيعي (1–15 يوماً).",
                422
            );
        }

        $cycle->update([
            'end_date'      => $endDate->toDateString(),
            'period_length' => $periodLength,
        ]);

        return $this->successResponse(new PeriodResource($cycle->fresh()), 'تم تسجيل انتهاء الدورة بنجاح');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /period/predictions
    // ──────────────────────────────────────────────────────────────────────────
    public function predictions(Request $request)
    {
        $userId = $request->user()->id;

        // TASK 9 — single query sorted oldest→newest for weighting
        $allCycles = PeriodCycle::where('user_id', $userId)
            ->where('is_predicted', false)
            ->orderBy('start_date', 'asc')
            ->select('start_date', 'cycle_length', 'period_length')
            ->get();

        $cycleLengths  = $allCycles->whereNotNull('cycle_length')->pluck('cycle_length')->toArray();
        $periodLengths = $allCycles->whereNotNull('period_length')->pluck('period_length')->toArray();
        $cycleCount    = count($cycleLengths);

        // TASK 1 — Weighted average
        $weightedAvg = Analytics::weightedCycleLength($cycleLengths);
        $stdDev      = Analytics::stdDev($cycleLengths);

        // TASK 2 — Confidence
        $confidence  = Analytics::predictionConfidence($cycleCount, $stdDev);

        $avgPeriod   = count($periodLengths) > 0
            ? (int) round(array_sum($periodLengths) / count($periodLengths))
            : 5;

        $lastCycle = $allCycles->last();

        $predictions = [];

        if ($lastCycle) {
            $lastStart = Carbon::parse($lastCycle->start_date)->startOfDay(); // TASK 11

            for ($i = 1; $i <= 3; $i++) {
                $nextStart = $lastStart->copy()->addDays((int) round($weightedAvg * $i));
                $nextEnd   = $nextStart->copy()->addDays($avgPeriod - 1);

                // Ovulation = cycleStart + (weightedAvg - 14)   [Ogino-Knaus rule]
                $ovulation    = $nextStart->copy()->addDays(max(0, (int) round($weightedAvg - 14)));
                $fertileStart = $ovulation->copy()->subDays(5);
                $fertileEnd   = $ovulation->copy()->addDay();

                // TASK 14 — Irregular cycle support: widen confidence range
                $range = Analytics::predictionRange($weightedAvg, $stdDev, $i);

                $predictions[] = [
                    'predicted_start'  => $nextStart->toDateString(),
                    'predicted_end'    => $nextEnd->toDateString(),
                    'confidence'       => $confidence['level'],
                    'early_estimate'   => $lastStart->copy()->addDays($range['early'])->toDateString(),
                    'late_estimate'    => $lastStart->copy()->addDays($range['late'])->toDateString(),
                    'ovulation_window' => [
                        'start'    => $fertileStart->toDateString(),
                        'end'      => $fertileEnd->toDateString(),
                        'peak_day' => $ovulation->toDateString(),
                    ],
                ];
            }
        }

        return $this->successResponse([
            'next_periods'         => $predictions,
            'cycle_count'          => $cycleCount,
            'weighted_avg_cycle'   => $weightedAvg,
            'avg_period_length'    => $avgPeriod,
            'confidence'           => $confidence,
        ], 'Predictions retrieved successfully');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 8 — GET /period/analytics
    // ──────────────────────────────────────────────────────────────────────────
    public function analytics(Request $request)
    {
        $userId = $request->user()->id;

        // TASK 9 — one master query
        $allCycles = PeriodCycle::where('user_id', $userId)
            ->where('is_predicted', false)
            ->orderBy('start_date', 'asc')
            ->select('cycle_length', 'period_length', 'symptoms', 'flow', 'start_date', 'end_date')
            ->get();

        $cycleLengths  = $allCycles->whereNotNull('cycle_length')->pluck('cycle_length')->toArray();
        $periodLengths = $allCycles->whereNotNull('period_length')->pluck('period_length')->toArray();
        $cycleCount    = count($cycleLengths);

        $stdDev      = Analytics::stdDev($cycleLengths);
        $weightedAvg = Analytics::weightedCycleLength($cycleLengths);
        $confidence  = Analytics::predictionConfidence($cycleCount, $stdDev);
        $regularity  = Analytics::regularityLabel($cycleCount, $stdDev);

        $avgCycleLength  = $cycleCount       > 0 ? array_sum($cycleLengths)  / $cycleCount           : 28.0;
        $avgPeriodLength = count($periodLengths) > 0 ? array_sum($periodLengths) / count($periodLengths) : 5.0;

        // Common symptoms
        $symptoms = $allCycles->pluck('symptoms')->flatten()->filter()->countBy()->sortDesc()->keys()->take(3)->toArray();

        // TASK 7
        $healthScore = Analytics::cycleHealthScore(
            $cycleCount, $avgCycleLength, $avgPeriodLength, $stdDev, $symptoms
        );

        // TASK 5 & 6 — Fertility score using cycle data + recent fertility entries
        $latestEntry = FertilityEntry::where('user_id', $userId)
            ->orderBy('entry_date', 'desc')
            ->select('bbt', 'cervical_mucus', 'ovulation_test_positive')
            ->first();

        $recentPosTest  = $latestEntry && $latestEntry->ovulation_test_positive;
        $recentEggWhite = $latestEntry && $latestEntry->cervical_mucus === 'egg_white';
        $recentBBTRise  = $latestEntry && $latestEntry->bbt && (float) $latestEntry->bbt >= 36.7;

        $fertilityScore = Analytics::fertilityScore(
            $cycleCount, $stdDev, $avgCycleLength,
            $recentPosTest, $recentEggWhite, $recentBBTRise
        );

        // Monthly breakdown (last 6 cycles)
        $monthlyData = $allCycles->sortByDesc('start_date')->take(6)->map(fn($c) => [
            'month'         => Carbon::parse($c->start_date)->format('Y-m'),
            'cycle_length'  => $c->cycle_length,
            'period_length' => $c->period_length,
            'flow'          => $c->flow,
        ])->values();

        return $this->successResponse([
            'summary' => [
                'average_cycle_length'  => round($avgCycleLength, 1),
                'weighted_cycle_length' => $weightedAvg,
                'average_period_length' => round($avgPeriodLength, 1),
                'std_dev'               => round($stdDev, 1),
                'cycle_count'           => $cycleCount,
                'regularity'            => $regularity,
            ],
            'scores' => [
                'health_score'       => $healthScore,       // TASK 7
                'fertility_score'    => $fertilityScore,    // TASK 6
                'confidence'         => $confidence,         // TASK 2
                'regularity_score'   => max(0, (int) round(100 - ($stdDev * 10))),
            ],
            'most_common_symptoms' => $symptoms,
            'monthly_data'         => $monthlyData,
        ], 'Analytics retrieved');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DELETE /period/{id}
    // ──────────────────────────────────────────────────────────────────────────
    public function destroy(Request $request, int $id)
    {
        $cycle = PeriodCycle::where('user_id', $request->user()->id)->find($id);

        if (!$cycle) {
            return $this->errorResponse('الدورة غير موجودة.', 404);
        }

        $cycle->delete();
        return $this->successResponse(null, 'تم حذف الدورة بنجاح');
    }
}
