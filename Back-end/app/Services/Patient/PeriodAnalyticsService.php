<?php

namespace App\Services\Patient;

/**
 * PeriodAnalyticsService
 *
 * Centralises all calculation logic for the Period & Fertility trackers.
 * Keeps controllers thin and makes the maths easy to unit-test.
 */
class PeriodAnalyticsService
{
    // ──────────────────────────────────────────────────────────────────────────
    // TASK 1 — Weighted Average (recent cycles matter more)
    // Weights: oldest = 1, each step doubles → exponential recency bias
    // ──────────────────────────────────────────────────────────────────────────
    public static function weightedCycleLength(array $cycleLengths): float
    {
        $n = count($cycleLengths);
        if ($n === 0) return 28.0;
        if ($n === 1) return (float) $cycleLengths[0];

        $totalWeight = 0;
        $weightedSum = 0;

        // $cycleLengths[0] = oldest, $cycleLengths[n-1] = most recent
        foreach ($cycleLengths as $i => $len) {
            $weight       = 2 ** $i;        // 1, 2, 4, 8 …
            $weightedSum += $len * $weight;
            $totalWeight += $weight;
        }

        return round($weightedSum / $totalWeight, 1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Population Standard Deviation
    // ──────────────────────────────────────────────────────────────────────────
    public static function stdDev(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0.0;

        $mean     = array_sum($values) / $n;
        $variance = array_sum(array_map(fn($x) => ($x - $mean) ** 2, $values)) / $n;

        return sqrt($variance);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 2 — Prediction Confidence (composite score 0–100)
    // ──────────────────────────────────────────────────────────────────────────
    public static function predictionConfidence(int $cycleCount, float $stdDev): array
    {
        if ($cycleCount === 0) {
            return ['level' => 'none', 'score' => 0, 'label' => 'لا توجد بيانات'];
        }

        // Cycle-count contribution: 0–50 pts (saturates at 12 cycles)
        $countScore = min(50, ($cycleCount / 12) * 50);

        // Regularity contribution: 0–50 pts
        $regularityScore = $cycleCount >= 3
            ? max(0, 50 - ($stdDev * 7))
            : 0;

        $score = (int) round($countScore + $regularityScore);

        if ($score >= 70) return ['level' => 'high',   'score' => $score, 'label' => 'عالية'];
        if ($score >= 40) return ['level' => 'medium', 'score' => $score, 'label' => 'متوسطة'];
        return              ['level' => 'low',    'score' => $score, 'label' => 'منخفضة'];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 7 — Cycle Health Score (0–100)
    // ──────────────────────────────────────────────────────────────────────────
    public static function cycleHealthScore(
        int    $cycleCount,
        float  $avgCycleLength,
        float  $avgPeriodLength,
        float  $stdDev,
        array  $symptoms
    ): int {
        $score = 100;

        // Penalty: irregular cycles (up to –30)
        if ($cycleCount >= 3) {
            $score -= min(30, $stdDev * 4);
        }

        // Penalty: abnormal cycle length (normal 24–38 days per ACOG)
        if ($avgCycleLength < 24 || $avgCycleLength > 38) {
            $score -= min(20, abs($avgCycleLength - 28) * 1.5);
        }

        // Penalty: abnormal period length (normal 3–7 days)
        if ($avgPeriodLength < 3) $score -= 15;
        elseif ($avgPeriodLength > 7) $score -= 10;

        // Penalty: severely reported symptoms
        $severe    = ['cramps', 'heavy_bleeding', 'severe_pain'];
        $sevCount  = count(array_intersect($symptoms, $severe));
        $score    -= $sevCount * 5;

        // Insufficient data penalty
        if ($cycleCount < 3) $score -= 20;

        return max(0, min(100, (int) round($score)));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 6 — Fertility Score (0–100)
    // Combines cycle regularity with recent fertility entry indicators
    // ──────────────────────────────────────────────────────────────────────────
    public static function fertilityScore(
        int   $cycleCount,
        float $stdDev,
        float $avgCycleLength,
        bool  $recentPosTest,
        bool  $recentEggWhite,
        bool  $recentBBTRise
    ): int {
        $score = 50; // neutral baseline

        // Regularity bonus (up to +20)
        if ($cycleCount >= 3) {
            $score += max(0, 20 - ($stdDev * 3));
        }

        // Ideal cycle length bonus (24–35 days)
        if ($avgCycleLength >= 24 && $avgCycleLength <= 35) {
            $score += 10;
        }

        // Fertility indicator bonuses
        if ($recentPosTest)  $score += 12;
        if ($recentEggWhite) $score += 8;
        if ($recentBBTRise)  $score += 5;

        // Insufficient data penalty
        if ($cycleCount < 3) $score -= 10;

        return max(0, min(100, (int) round($score)));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 14 — Regularity Label
    // ──────────────────────────────────────────────────────────────────────────
    public static function regularityLabel(int $cycleCount, float $stdDev): string
    {
        if ($cycleCount < 1)  return 'no_data';
        if ($cycleCount < 3)  return 'insufficient_data';
        if ($stdDev <= 3)     return 'very_regular';
        if ($stdDev <= 7)     return 'regular';
        return 'irregular';
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 14 — Prediction spread for irregular cycles
    // Returns [lower_bound, upper_bound] for the next period start
    // ──────────────────────────────────────────────────────────────────────────
    public static function predictionRange(float $weightedAvg, float $stdDev, int $multiplier = 1): array
    {
        // 1 SD covers ~68% of cases; we use 1.5 SD for irregular cycles
        $spread = $stdDev > 7 ? $stdDev * 1.5 : $stdDev;

        return [
            'early' => (int) round(($weightedAvg - $spread) * $multiplier),
            'late'  => (int) round(($weightedAvg + $spread) * $multiplier),
        ];
    }
}
