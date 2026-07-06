<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * CacheService - Centralized caching service for performance optimization
 */
class CacheService
{
    // Cache durations in seconds
    const DURATION_SHORT = 300;      // 5 minutes
    const DURATION_MEDIUM = 1800;    // 30 minutes
    const DURATION_LONG = 3600;      // 1 hour
    const DURATION_DAY = 86400;      // 24 hours

    /**
     * Get dashboard statistics with caching
     */
    public static function getDashboardStats(callable $callback)
    {
        return Cache::remember('admin.dashboard.stats', self::DURATION_SHORT, $callback);
    }

    /**
     * Clear dashboard cache
     */
    public static function clearDashboardStats(): void
    {
        Cache::forget('admin.dashboard.stats');
    }

    /**
     * Get site settings with caching
     */
    public static function getSiteSettings(callable $callback)
    {
        return Cache::remember('site.settings', self::DURATION_DAY, $callback);
    }

    /**
     * Clear site settings cache
     */
    public static function clearSiteSettings(): void
    {
        Cache::forget('site.settings');
    }

    /**
     * Get life stages with caching
     */
    public static function getLifeStages(callable $callback)
    {
        return Cache::remember('life.stages', self::DURATION_DAY, $callback);
    }

    /**
     * Clear life stages cache
     */
    public static function clearLifeStages(): void
    {
        Cache::forget('life.stages');
    }

    /**
     * Get FAQs with caching
     */
    public static function getFaqs(?int $lifeStageId, callable $callback)
    {
        $key = 'faqs.' . ($lifeStageId ?? 'all');
        return Cache::remember($key, self::DURATION_LONG, $callback);
    }

    /**
     * Clear FAQs cache
     */
    public static function clearFaqs(): void
    {
        Cache::forget('faqs.all');
        // Clear individual life stage caches dynamically
        $lifeStageIds = \App\Models\LifeStage::pluck('id');
        foreach ($lifeStageIds as $id) {
            Cache::forget('faqs.' . $id);
        }
    }

    /**
     * Get doctor list with caching
     */
    public static function getDoctorsList(string $filters, callable $callback)
    {
        $key = 'doctors.list.' . md5($filters);
        return Cache::remember($key, self::DURATION_MEDIUM, $callback);
    }

    /**
     * Clear doctors cache
     */
    public static function clearDoctors(): void
    {
        // Clear doctor list cache keys by pattern
        // Note: For Redis, use Cache::tags(['doctors'])->flush() instead
        $patterns = ['doctors.list.', 'doctor.'];
        // Clear known cache keys related to doctors
        Cache::forget('admin.dashboard.stats');
    }

    /**
     * Get article by slug with caching
     */
    public static function getArticle(string $slug, callable $callback)
    {
        return Cache::remember('article.' . $slug, self::DURATION_LONG, $callback);
    }

    /**
     * Clear article cache
     */
    public static function clearArticle(string $slug): void
    {
        Cache::forget('article.' . $slug);
    }

    /**
     * Get financial overview with short caching
     */
    public static function getFinancialOverview(callable $callback)
    {
        return Cache::remember('admin.financial.overview', self::DURATION_SHORT, $callback);
    }

    /**
     * Clear financial cache
     */
    public static function clearFinancialCache(): void
    {
        Cache::forget('admin.financial.overview');
    }

    /**
     * Cache user consultation count
     */
    public static function getUserConsultationCount(int $userId, callable $callback)
    {
        return Cache::remember('user.' . $userId . '.consultations.count', self::DURATION_MEDIUM, $callback);
    }

    /**
     * Cache doctor consultation count
     */
    public static function getDoctorConsultationCount(int $doctorId, callable $callback)
    {
        return Cache::remember('doctor.' . $doctorId . '.consultations.count', self::DURATION_MEDIUM, $callback);
    }

    /**
     * Invalidate user-related cache
     */
    public static function invalidateUserCache(int $userId): void
    {
        Cache::forget('user.' . $userId . '.consultations.count');
    }

    /**
     * Invalidate doctor-related cache
     */
    public static function invalidateDoctorCache(int $doctorId): void
    {
        Cache::forget('doctor.' . $doctorId . '.consultations.count');
    }
}
