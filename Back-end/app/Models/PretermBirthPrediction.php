<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PretermBirthPrediction extends Model
{
    protected $fillable = [
        'user_id',
        'pregnancy_id',
        'doctor_id',
        'risk_level',
        'risk_score',
        'prediction_class',
        'risk_label',
        'probability_high',
        'pregnancy_week',
        'prediction_stage',
        // API Input Fields (10 clinical features)
        'maternal_age',
        'bmi',
        'systolic_bp',
        'diastolic_bp',
        'bs',
        'heart_rate',
        'previous_complications',
        'preexisting_diabetes',
        'gestational_diabetes_input',
        'mental_health',
        // Legacy stage-2 diagnostic fields (nullable)
        'previous_preterm_birth',
        'smoking',
        'number_of_previous_pregnancies',
        'cervical_length',
        'cervical_insufficiency',
        'uterine_abnormalities',
        'placental_issues',
        'infection',
        'multiple_pregnancy',
        'preeclampsia_present',
        'gestational_diabetes_present',
        // AI Model Info
        'model_version',
        'algorithm_used',
        'feature_importance',
        'ai_analysis',
        'recommendations',
        'api_note',
        // Notification & Follow-up
        'doctor_notified',
        'doctor_notified_at',
        'prediction_date',
        'doctor_comments',
        'cervical_length_scan_recommended',
    ];

    protected $casts = [
        'previous_complications' => 'boolean',
        'preexisting_diabetes' => 'boolean',
        'gestational_diabetes_input' => 'boolean',
        'mental_health' => 'boolean',
        'previous_preterm_birth' => 'boolean',
        'smoking' => 'boolean',
        'cervical_insufficiency' => 'boolean',
        'uterine_abnormalities' => 'boolean',
        'placental_issues' => 'boolean',
        'infection' => 'boolean',
        'multiple_pregnancy' => 'boolean',
        'preeclampsia_present' => 'boolean',
        'gestational_diabetes_present' => 'boolean',
        'feature_importance' => 'array',
        'recommendations' => 'array',
        'doctor_notified' => 'boolean',
        'doctor_notified_at' => 'datetime',
        'prediction_date' => 'datetime',
        'cervical_length_scan_recommended' => 'boolean',
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
            $q->where('risk_label', 'High')
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
        return match (strtolower($this->risk_label ?? $this->risk_level ?? '')) {
            'high' => '#EF4444',
            'medium', 'moderate' => '#F59E0B',
            'low' => '#10B981',
            default => '#6B7280',
        };
    }

    public function getRiskBadgeAttribute(): string
    {
        return match (strtolower($this->risk_label ?? $this->risk_level ?? '')) {
            'high' => 'خطورة عالية',
            'medium', 'moderate' => 'خطورة متوسطة',
            'low' => 'خطورة منخفضة',
            default => 'غير محدد',
        };
    }
}
