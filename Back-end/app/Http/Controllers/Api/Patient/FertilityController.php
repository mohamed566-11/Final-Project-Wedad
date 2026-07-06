<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\Fertility\StoreFertilityRequest;
use App\Http\Resources\Patient\FertilityResource;
use App\Models\FertilityEntry;
use App\Models\PeriodCycle;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FertilityController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = FertilityEntry::where('user_id', $request->user()->id);

        if ($request->has('month')) {
            $query->where('entry_date', 'like', $request->month . '%');
        }

        $entries = $query->orderBy('entry_date', 'desc')->get();

        return $this->successResponse(FertilityResource::collection($entries), 'Fertility entries retrieved successfully');
    }

    public function store(StoreFertilityRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $entry = FertilityEntry::updateOrCreate(
            [
                'user_id' => $data['user_id'],
                'entry_date' => $data['entry_date']
            ],
            $data
        );

        return $this->successResponse(new FertilityResource($entry), 'Fertility entry added successfully', 201);
    }

    public function fertileWindow(Request $request)
    {
        $user = $request->user();

        // ─── Always analyse recent fertility entries first ───────────────────
        $recentEntries = FertilityEntry::where('user_id', $user->id)
            ->orderBy('entry_date', 'desc')
            ->limit(7)
            ->get();

        $latestEntry = $recentEntries->first();

        // ── Current indicators: LATEST entry ONLY (reflects most recent recording) ──
        $currentPosTest   = $latestEntry && $latestEntry->ovulation_test_positive;
        $currentEggWhite  = $latestEntry && $latestEntry->cervical_mucus === 'egg_white';
        $currentBBTRise   = $latestEntry && $latestEntry->bbt && (float)$latestEntry->bbt >= 36.7;
        $isFertileNow     = $currentPosTest || $currentEggWhite || $currentBBTRise;

        // ── Historical (last 7 days) – used ONLY for context in recommendations ──
        $recentHasPosTest   = $recentEntries->contains('ovulation_test_positive', true);
        $recentHasEggWhite  = $recentEntries->contains('cervical_mucus', 'egg_white');
        $recentHasBBTRise   = $recentEntries->filter(fn($e) => $e->bbt && (float)$e->bbt >= 36.7)->count() > 0;

        // ─── Entry-based confidence (current) ────────────────────────────────
        $indicators = (int)$currentPosTest * 2 + (int)$currentEggWhite + (int)$currentBBTRise;
        $confidence = $indicators >= 3 ? 'high' : ($indicators >= 2 ? 'medium' : ($indicators >= 1 ? 'low' : 'none'));

        // ─── Dynamic recommendations based on LATEST entry ───────────────────
        $recommendations = [];
        $today = Carbon::today();

        if ($isFertileNow) {
            $recommendations[] = '🌟 المؤشرات الحالية تشير إلى خصوبة عالية — وقت مثالي للحمل';
        } else {
            $recommendations[] = '📉 مؤشرات الخصوبة اليوم منخفضة — تابعي يومياً';
        }

        if ($currentPosTest) {
            $recommendations[] = '✅ اختبار الإباضة إيجابي — تزايدت فرص الحمل بشكل كبير';
        } elseif ($recentHasPosTest) {
            $recommendations[] = '📅 كان اختبار الإباضة إيجابياً مؤخراً — تابعي يومياً';
        }

        if ($currentEggWhite) {
            $recommendations[] = '💧 إفرازات بياض البيض تشير إلى ذروة الخصوبة';
        } elseif ($latestEntry && $latestEntry->cervical_mucus) {
            $mucusLabels = ['dry' => 'جافة', 'sticky' => 'لزجة', 'creamy' => 'كريمية', 'watery' => 'مائية', 'egg_white' => 'بياض بيض'];
            $currentMucusLabel = $mucusLabels[$latestEntry->cervical_mucus] ?? $latestEntry->cervical_mucus;
            $recommendations[] = "🔵 الإفرازات الحالية: {$currentMucusLabel} — " . ($latestEntry->cervical_mucus === 'watery' ? 'بداية نافذة الخصوبة' : 'خارج الذروة');
        }

        if ($currentBBTRise) {
            $recommendations[] = '🌡️ ارتفاع درجة الحرارة الصباحية — مؤشر قوي على الإباضة';
        } else {
            $recommendations[] = '🌡️ استمري في قياس الحرارة الصباحية يومياً قبل النهوض من السرير';
        }

        if (!$latestEntry || $latestEntry->entry_date->toDateString() !== $today->toDateString()) {
            array_unshift($recommendations, '📋 لم تسجلي قياساتك اليوم — أضيفيها الآن للحصول على دقة أعلى');
        }

        // ─── Try cycle-based prediction ──────────────────────────────────────
        $lastCycle = PeriodCycle::where('user_id', $user->id)
            ->whereNotNull('start_date')
            ->orderBy('start_date', 'desc')
            ->first();

        if (!$lastCycle) {
            // ── No period data: return entry-based status ──────────────────
            $recommendations[] = '📅 سجلي دورتكِ الشهرية لتفعيل التنبؤ بنافذة الخصوبة';

            return $this->successResponse([
                'fertile_window' => $isFertileNow ? [
                    'start_date'       => null,
                    'end_date'         => null,
                    'peak_day'         => null,
                    'days_remaining'   => null,
                    'is_in_window'     => true,
                    'based_on_entries' => true,
                ] : null,
                'ovulation' => [
                    'predicted_date' => null,
                    'confidence'     => $confidence,
                    'indicators'     => [
                        'has_bbt_rise'        => $currentBBTRise,
                        'has_positive_test'   => $currentPosTest,
                        'has_egg_white_mucus' => $currentEggWhite,
                    ],
                ],
                'recommendations' => array_values(array_unique($recommendations)),
            ], 'Status based on fertility entries');
        }

        // ─── Full cycle-based calculation ────────────────────────────────────
        $avgCycleLength = PeriodCycle::where('user_id', $user->id)->avg('cycle_length');
        $cycleLength    = $avgCycleLength ? round($avgCycleLength) : 28;
        $cycleIsRegular = PeriodCycle::where('user_id', $user->id)->count() >= 3;

        $lastStart     = Carbon::parse($lastCycle->start_date);
        $ovulationDate = $lastStart->copy()->addDays($cycleLength - 14);
        $windowStart   = $ovulationDate->copy()->subDays(5);
        $windowEnd     = $ovulationDate->copy()->addDay();  // 6-day window
        $isInWindow    = $today->between($windowStart, $windowEnd);
        $daysRemaining = $today->diffInDays($ovulationDate, false);

        if ($isInWindow || $isFertileNow) {
            $recommendations[] = '🌟 أنتِ الآن في نافذة خصوبتكِ — وقت مثالي للحمل';
        } else {
            $daysToWindow = (int)$today->diffInDays($windowStart, false);
            if ($daysToWindow > 0) {
                $recommendations[] = "⏳ نافذة خصوبتكِ تبدأ بعد {$daysToWindow} " . ($daysToWindow === 1 ? 'يوم' : 'أيام');
            }
        }

        if (!$cycleIsRegular) {
            $recommendations[] = '📅 سجلي دورتكِ الشهرية بانتظام لتحسين دقة التوقعات';
        }

        $finalConfidence = ($cycleIsRegular && ($hasPosTest || $hasEggWhite)) ? 'high' : ($cycleIsRegular ? 'medium' : $confidence);

        return $this->successResponse([
            'fertile_window' => [
                'start_date'      => $windowStart->toDateString(),
                'end_date'        => $windowEnd->toDateString(),
                'peak_day'        => $ovulationDate->toDateString(),
                'days_remaining'  => (int)$daysRemaining,
                'is_in_window'    => $isInWindow,
                'based_on_entries' => false,
            ],
            'ovulation' => [
                'predicted_date' => $ovulationDate->toDateString(),
                'confidence'     => $finalConfidence,
                'indicators'     => [
                    'has_bbt_rise'        => $hasBBTRise,
                    'has_positive_test'   => $hasPosTest,
                    'has_egg_white_mucus' => $hasEggWhite,
                ],
            ],
            'recommendations' => array_unique(array_filter($recommendations)),
        ], 'Fertile window retrieved successfully');
    }


    public function destroy($id)
    {
        $userId = request()->user()->id;
        $entry = FertilityEntry::where('user_id', $userId)->find($id);

        if (!$entry) {
            return $this->errorResponse('Entry not found', 404);
        }

        $entry->delete();

        return $this->successResponse(null, 'Fertility entry deleted successfully');
    }
}
