<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GestationalDiabetesPrediction extends Model
{
    protected $fillable = [
        'user_id',
        'pregnancy_id',
        'doctor_id',
        'risk_level',
        'risk_score',
        'risk_probability',
        'risk_category',
        'final_risk',
        'guardrail_applied',
        'pregnancy_week',
        // API Input Fields (11 user fields → 10 model features)
        'height_cm',
        'weight_kg',
        'bmi_computed',
        'no_of_pregnancy',
        'maternal_age',
        'family_history_diabetes',
        'pcos',
        'sedentary_lifestyle',
        'prediabetes',
        'unexplained_prenatal_loss',
        'large_child_or_birth_default',
        'gestation_in_previous_pregnancy',
        // Legacy lab fields (nullable, for future use)
        'fasting_glucose',
        'random_glucose',
        'hba1c',
        'pre_pregnancy_bmi',
        'current_bmi',
        'weight_gain',
        'ethnicity',
        // AI Model Info
        'model_version',
        'algorithm_used',
        'feature_importance',
        'ai_analysis',
        'recommendations',
        'recommendation_en',
        'recommendation_ar',
        'top_factors',
        // Notification & Follow-up
        'doctor_notified',
        'doctor_notified_at',
        'prediction_date',
        'doctor_comments',
        'ogtt_recommended',
    ];

    protected $casts = [
        'family_history_diabetes' => 'boolean',
        'previous_gdm' => 'boolean',
        'previous_macrosomia' => 'boolean',
        'pcos' => 'boolean',
        'sedentary_lifestyle' => 'boolean',
        'prediabetes' => 'boolean',
        'unexplained_prenatal_loss' => 'boolean',
        'large_child_or_birth_default' => 'boolean',
        'gestation_in_previous_pregnancy' => 'boolean',
        'guardrail_applied' => 'boolean',
        'feature_importance' => 'array',
        'recommendations' => 'array',
        'top_factors' => 'array',
        'doctor_notified' => 'boolean',
        'doctor_notified_at' => 'datetime',
        'prediction_date' => 'datetime',
        'ogtt_recommended' => 'boolean',
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
        return $query->whereIn('risk_level', ['High Risk', 'high']);
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
        return match (strtolower($this->risk_level ?? '')) {
            'high risk', 'high' => '#EF4444',
            'moderate risk', 'moderate', 'medium' => '#F59E0B',
            'low risk', 'low' => '#10B981',
            default => '#6B7280',
        };
    }

    public function getRiskBadgeAttribute(): string
    {
        return match (strtolower($this->risk_level ?? '')) {
            'high risk', 'high' => 'خطورة عالية',
            'moderate risk', 'moderate', 'medium' => 'خطورة متوسطة',
            'low risk', 'low' => 'خطورة منخفضة',
            default => 'غير محدد',
        };
    }
}
