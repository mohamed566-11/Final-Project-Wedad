<?php

namespace App\Utils;

/**
 * TranslationHelper - Single source of truth for Arabic translation maps.
 *
 * Eliminates duplication of translation arrays across controllers and resources.
 * When a new specialization, life stage, or status is added, update it here only.
 */
class TranslationHelper
{
    /**
     * Specialization translations (Arabic)
     */
    protected static array $specializations = [
        'gynecology' => 'أمراض نساء وتوليد',
        'obstetrics' => 'توليد',
        'fertility' => 'علاج العقم',
        'dermatology' => 'جلدية',
        'nutrition' => 'تغذية',
        'psychology' => 'نفسية',
        'pediatrics' => 'أطفال',
        'internal_medicine' => 'باطنية',
        'general_practitioner' => 'طب عام',
        'general' => 'طب عام',
        'endocrinology' => 'غدد صماء',
        'other' => 'أخرى',
    ];

    /**
     * Life stage translations (Arabic)
     */
    protected static array $lifeStages = [
        'pre-marriage' => 'ما قبل الزواج',
        'married-life' => 'الحياة الزوجية',
        'motherhood' => 'الأمومة والطفولة',
    ];

    /**
     * Life stage icons
     */
    protected static array $lifeStageIcons = [
        'pre-marriage' => '💍',
        'married-life' => '👰',
        'motherhood' => '🤰',
    ];

    /**
     * Consultation status translations (feminine form - for "استشارة")
     */
    protected static array $consultationStatuses = [
        'pending' => 'في الانتظار',
        'confirmed' => 'مؤكدة',
        'in_progress' => 'جارية',
        'completed' => 'مكتملة',
        'cancelled_by_patient' => 'ملغاة من المريض',
        'cancelled_by_doctor' => 'ملغاة من الطبيب',
        'cancelled_by_admin' => 'ملغاة من الإدارة',
        'no_show' => 'لم يحضر',
    ];

    /**
     * Consultation status translations (masculine form - for admin context)
     */
    protected static array $consultationStatusesAdmin = [
        'pending' => 'معلق',
        'confirmed' => 'مؤكد',
        'in_progress' => 'جارٍ',
        'completed' => 'مكتمل',
        'cancelled_by_patient' => 'ملغي من المريض',
        'cancelled_by_doctor' => 'ملغي من الطبيب',
        'cancelled_by_admin' => 'ملغي من الإدارة',
        'no_show' => 'لم يحضر',
    ];

    /**
     * Consultation type translations
     */
    protected static array $consultationTypes = [
        'video' => 'فيديو',
        'offline' => 'عيادة',
    ];

    /**
     * Day of week translations
     */
    protected static array $days = [
        'monday' => 'الإثنين',
        'tuesday' => 'الثلاثاء',
        'wednesday' => 'الأربعاء',
        'thursday' => 'الخميس',
        'friday' => 'الجمعة',
        'saturday' => 'السبت',
        'sunday' => 'الأحد',
    ];

    /**
     * Join request status translations
     */
    protected static array $joinRequestStatuses = [
        'pending' => 'معلق',
        'contacted' => 'تم التواصل',
        'approved' => 'مقبول',
        'rejected' => 'مرفوض',
    ];

    /**
     * Payment status translations (patient-facing)
     */
    protected static array $paymentStatuses = [
        'pending' => 'قيد الانتظار',
        'completed' => 'مكتمل',
        'failed' => 'فاشل',
        'refunded' => 'مسترجع',
    ];

    /**
     * Payment status translations (admin-facing)
     */
    protected static array $paymentStatusesAdmin = [
        'pending' => 'معلق',
        'completed' => 'مكتمل',
        'failed' => 'فشل',
        'refunded' => 'مسترد',
    ];

    /**
     * Life stage color codes
     */
    protected static array $stageColors = [
        'pre-marriage' => 'emerald',
        'married-life' => 'blue',
        'motherhood' => 'rose',
    ];

    // ─── Public API ─────────────────────────────────────────

    public static function specialization(?string $key): string
    {
        if (!$key)
            return '';
        return static::$specializations[$key] ?? $key;
    }

    public static function allSpecializations(): array
    {
        return static::$specializations;
    }

    public static function lifeStage(?string $key): string
    {
        if (!$key)
            return '';
        return static::$lifeStages[$key] ?? $key;
    }

    public static function allLifeStages(): array
    {
        return static::$lifeStages;
    }

    public static function lifeStageIcon(?string $key): string
    {
        if (!$key)
            return '🏥';
        return static::$lifeStageIcons[$key] ?? '🏥';
    }

    public static function consultationStatus(?string $key, bool $admin = false): string
    {
        if (!$key)
            return '';
        $map = $admin ? static::$consultationStatusesAdmin : static::$consultationStatuses;
        return $map[$key] ?? $key;
    }

    public static function allConsultationStatuses(bool $admin = false): array
    {
        return $admin ? static::$consultationStatusesAdmin : static::$consultationStatuses;
    }

    public static function consultationType(?string $key): string
    {
        if (!$key)
            return '';
        return static::$consultationTypes[$key] ?? $key;
    }

    public static function day(?string $key): string
    {
        if (!$key)
            return '';
        return static::$days[strtolower($key)] ?? $key;
    }

    public static function allDays(): array
    {
        return static::$days;
    }

    public static function joinRequestStatus(?string $key): string
    {
        if (!$key)
            return '';
        return static::$joinRequestStatuses[$key] ?? $key;
    }

    public static function paymentStatus(?string $key, bool $admin = false): string
    {
        if (!$key)
            return '';
        $map = $admin ? static::$paymentStatusesAdmin : static::$paymentStatuses;
        return $map[$key] ?? $key;
    }

    public static function stageColor(?string $key): string
    {
        if (!$key)
            return 'slate';
        return static::$stageColors[$key] ?? 'slate';
    }

    /**
     * Get human-readable time until a date (e.g., "بعد ساعتين", "بعد 3 أيام")
     */
    public static function timeUntil($dateTime): string
    {
        $now = now();
        $target = \Carbon\Carbon::parse($dateTime);

        if ($target->isPast()) {
            return 'انتهى';
        }

        $diffInMinutes = (int) $now->diffInMinutes($target);
        $diffInHours = (int) $now->diffInHours($target);
        $diffInDays = (int) $now->diffInDays($target);

        if ($diffInMinutes < 60) {
            if ($diffInMinutes == 1)
                return "بعد دقيقة";
            if ($diffInMinutes == 2)
                return "بعد دقيقتين";
            if ($diffInMinutes >= 3 && $diffInMinutes <= 10)
                return "بعد {$diffInMinutes} دقائق";
            return "بعد {$diffInMinutes} دقيقة";
        } elseif ($diffInHours < 48) {
            if ($diffInHours == 1)
                return "بعد ساعة";
            if ($diffInHours == 2)
                return "بعد ساعتين";
            if ($diffInHours >= 3 && $diffInHours <= 10)
                return "بعد {$diffInHours} ساعات";
            return "بعد {$diffInHours} ساعة";
        } else {
            if ($diffInDays == 2)
                return "بعد يومين";
            if ($diffInDays >= 3 && $diffInDays <= 10)
                return "بعد {$diffInDays} أيام";
            return "بعد {$diffInDays} يوماً";
        }
    }
}
