<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PreeclampsiaPrediction extends Model
{
    protected $fillable = [
        'user_id',
        'pregnancy_id',
        'doctor_id',
        'risk_level',
        'risk_score',
        'prediction_class',
        'probability',
        'risk_status',
        'pregnancy_week',
        // API Input Fields (11 clinical features)
        'gravida',
        'parity',
        'gest_age',
        'maternal_age',
        'bmi',
        'diabetes',
        'htn',
        'systolic_bp',
        'diastolic_bp',
        'hb',
        'proteinuria',
        'proteinuria_level',
        // Legacy clinical fields
        'previous_preeclampsia',
        'chronic_hypertension',
        'kidney_disease',
        'first_pregnancy',
        // AI Model Info
        'model_version',
        'algorithm_used',
        'feature_importance',
        'ai_analysis',
        'recommendations',
        'input_echo',
        // Notification & Follow-up
        'doctor_notified',
        'doctor_notified_at',
        'prediction_date',
        'doctor_comments',
    ];

    protected $casts = [
        'previous_preeclampsia' => 'boolean',
        'chronic_hypertension' => 'boolean',
        'diabetes' => 'boolean',
        'htn' => 'boolean',
        'proteinuria' => 'boolean',
        'kidney_disease' => 'boolean',
        'first_pregnancy' => 'boolean',
        'feature_importance' => 'array',
        'recommendations' => 'array',
        'input_echo' => 'array',
        'doctor_notified' => 'boolean',
        'doctor_notified_at' => 'datetime',
        'prediction_date' => 'datetime',
    ];

    // === Relationships ===

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function pregnancy()
    {
        return $this->belongsTo(Pregnancy::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function historyEntry()
    {
        return $this->morphOne(MlPredictionsHistory::class, 'predictable');
    }

    // === Scopes ===

    public function scopeHighRisk($query)
    {
        return $query->where(function ($q) {
            $q->where('risk_status', 'High Risk')
                ->orWhere('risk_level', 'high')
                ->orWhere('prediction_class', 1);
        });
    }

    public function scopeForPregnancy($query, $pregnancyId)
    {
        return $query->where('pregnancy_id', $pregnancyId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // === Accessors ===

    public function getRiskColorAttribute(): string
    {
        return match (strtolower($this->risk_status ?? $this->risk_level ?? '')) {
            'high risk', 'high' => '#EF4444',
            'medium', 'moderate' => '#F59E0B',
            'low risk', 'low' => '#10B981',
            default => '#6B7280',
        };
    }

    public function getRiskBadgeAttribute(): string
    {
        return match (strtolower($this->risk_status ?? $this->risk_level ?? '')) {
            'high risk', 'high' => 'خطورة عالية',
            'medium', 'moderate' => 'خطورة متوسطة',
            'low risk', 'low' => 'خطورة منخفضة',
            default => 'غير محدد',
        };
    }
}
