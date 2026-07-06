<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\Patient\PeriodAnalyticsService as Analytics;

/**
 * TASK 12 — Unit tests for PeriodAnalyticsService
 *
 * Run: php artisan test --filter=PeriodAnalyticsTest
 */
class PeriodAnalyticsTest extends TestCase
{
    // ── TASK 1: Weighted Average ─────────────────────────────────────────────

    public function test_weighted_avg_returns_default_with_no_data(): void
    {
        $this->assertEquals(28.0, Analytics::weightedCycleLength([]));
    }

    public function test_weighted_avg_returns_single_value(): void
    {
        $this->assertEquals(30.0, Analytics::weightedCycleLength([30]));
    }

    public function test_weighted_avg_favors_recent_values(): void
    {
        // [20 (old), 30 (new)] — weighted avg should be closer to 30
        $result = Analytics::weightedCycleLength([20, 30]);
        $this->assertGreaterThan(25.0, $result); // closer to 30 than 25
    }

    public function test_weighted_avg_with_three_cycles(): void
    {
        // Weights: 1, 2, 4 → (25*1 + 28*2 + 32*4) / 7 = (25+56+128)/7 = 209/7 ≈ 29.86
        $result = Analytics::weightedCycleLength([25, 28, 32]);
        $this->assertEqualsWithDelta(29.9, $result, 0.5);
    }

    // ── Standard Deviation ───────────────────────────────────────────────────

    public function test_std_dev_with_uniform_data(): void
    {
        $this->assertEquals(0.0, Analytics::stdDev([28, 28, 28]));
    }

    public function test_std_dev_with_varied_data(): void
    {
        $result = Analytics::stdDev([25, 28, 31]);
        $this->assertEqualsWithDelta(2.449, $result, 0.1);
    }

    public function test_std_dev_returns_zero_for_single_value(): void
    {
        $this->assertEquals(0.0, Analytics::stdDev([28]));
    }

    // ── TASK 2: Prediction Confidence ───────────────────────────────────────

    public function test_confidence_none_with_no_cycles(): void
    {
        $result = Analytics::predictionConfidence(0, 0);
        $this->assertEquals('none', $result['level']);
        $this->assertEquals(0, $result['score']);
    }

    public function test_confidence_low_with_few_cycles(): void
    {
        $result = Analytics::predictionConfidence(1, 0);
        $this->assertEquals('low', $result['level']);
    }

    public function test_confidence_high_with_regular_cycles(): void
    {
        // 12 cycles, very regular (stdDev=1)
        $result = Analytics::predictionConfidence(12, 1.0);
        $this->assertEquals('high', $result['level']);
        $this->assertGreaterThanOrEqual(70, $result['score']);
    }

    public function test_confidence_medium(): void
    {
        // 5 cycles (count score≈20.8), stdDev=4 (reg score≈22) → total≈42.8 → medium
        $result = Analytics::predictionConfidence(5, 4.0);
        $this->assertEquals('medium', $result['level']);
    }

    // ── TASK 7: Cycle Health Score ───────────────────────────────────────────

    public function test_health_score_perfect(): void
    {
        $score = Analytics::cycleHealthScore(6, 28.0, 5.0, 1.5, []);
        $this->assertGreaterThanOrEqual(80, $score);
    }

    public function test_health_score_penalises_irregular(): void
    {
        $regular   = Analytics::cycleHealthScore(6, 28.0, 5.0, 1.0, []);
        $irregular = Analytics::cycleHealthScore(6, 28.0, 5.0, 12.0, []);
        $this->assertGreaterThan($irregular, $regular);
    }

    public function test_health_score_penalises_abnormal_length(): void
    {
        $normal   = Analytics::cycleHealthScore(6, 28.0, 5.0, 2.0, []);
        $abnormal = Analytics::cycleHealthScore(6, 50.0, 5.0, 2.0, []);
        $this->assertGreaterThan($abnormal, $normal);
    }

    public function test_health_score_stays_in_range(): void
    {
        // Worst case
        $score = Analytics::cycleHealthScore(1, 50.0, 14.0, 20.0, ['cramps', 'heavy_bleeding', 'severe_pain']);
        $this->assertGreaterThanOrEqual(0, $score);
        $this->assertLessThanOrEqual(100, $score);
    }

    // ── TASK 6: Fertility Score ──────────────────────────────────────────────

    public function test_fertility_score_with_positive_indicators(): void
    {
        $score = Analytics::fertilityScore(6, 2.0, 28.0, true, true, true);
        $this->assertGreaterThanOrEqual(75, $score);
    }

    public function test_fertility_score_is_clamped(): void
    {
        $score = Analytics::fertilityScore(24, 0.0, 28.0, true, true, true);
        $this->assertLessThanOrEqual(100, $score);
        $this->assertGreaterThanOrEqual(0, $score);
    }

    public function test_fertility_score_lower_without_indicators(): void
    {
        $withAll    = Analytics::fertilityScore(6, 2.0, 28.0, true, true, true);
        $withNone   = Analytics::fertilityScore(6, 2.0, 28.0, false, false, false);
        $this->assertGreaterThan($withNone, $withAll);
    }

    // ── TASK 14: Prediction Range ────────────────────────────────────────────

    public function test_prediction_range_wider_for_irregular(): void
    {
        $regular   = Analytics::predictionRange(28.0, 2.0);
        $irregular = Analytics::predictionRange(28.0, 10.0);
        $regularSpread   = $regular['late']   - $regular['early'];
        $irregularSpread = $irregular['late'] - $irregular['early'];
        $this->assertGreaterThan($regularSpread, $irregularSpread);
    }

    public function test_prediction_range_center_is_weighted_avg(): void
    {
        $range = Analytics::predictionRange(28.0, 0.0);
        $this->assertEquals(28, $range['early']);
        $this->assertEquals(28, $range['late']);
    }
}
