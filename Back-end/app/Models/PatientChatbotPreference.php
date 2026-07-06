<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientChatbotPreference extends Model
{
    protected $fillable = [
        'user_id',
        'data_access_enabled',
        'share_predictions',
        'share_trackers',
        'share_medical_file',
        'share_consultations',
    ];

    protected $casts = [
        'data_access_enabled' => 'boolean',
        'share_predictions' => 'boolean',
        'share_trackers' => 'boolean',
        'share_medical_file' => 'boolean',
        'share_consultations' => 'boolean',
    ];

    // =========================================================================
    //  RELATIONSHIPS
    // =========================================================================

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // =========================================================================
    //  HELPERS
    // =========================================================================

    /**
     * هل الميزة مفعّلة لهذه المريضة؟
     */
    public function isDataAccessEnabled(): bool
    {
        return $this->data_access_enabled === true;
    }

    /**
     * إرجاع القيم الافتراضية لمريضة جديدة
     */
    public static function getDefaultsFor(User $user): array
    {
        return [
            'user_id' => $user->id,
            'data_access_enabled' => true,   // opt-out: مفعّلة تلقائياً — يمكن إيقافها من إعدادات الخصوصية
            'share_predictions' => true,
            'share_trackers' => true,
            'share_medical_file' => false,
            'share_consultations' => false,
        ];
    }
}
