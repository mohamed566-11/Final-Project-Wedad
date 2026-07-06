<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ScbuAdmissionPrediction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'pregnancy_id',
        'doctor_id',
        // Continuous input features
        'maternal_age',
        'bmi_at_booking',
        'hpg_2h',
        'weeks_of_gestation',
        'weight_measured',
        'height',
        'parity',
        'no_of_previous_csections',
        'contraction_freq',
        'imd_decile',
        'gravida',
        'systolic_bp',
        'diastolic_bp',
        'fasting_glucose',
        'vitamin_d',
        // Binary flags (JSON)
        'binary_flags',
        // Prediction outputs
        'risk_probability',
        'prediction',
        'label',
        'risk_level',
        'risk_score',
        'threshold_used',
        'model_name',
        'disclaimer',
        // SHAP
        'shap_top_features',
        'explain_called',
        // Doctor feedback
        'doctor_comments',
        'doctor_notified',
        'doctor_notified_at',
        // Metadata
        'model_version',
        'algorithm_used',
        'prediction_date',
    ];

    protected $casts = [
        'binary_flags'       => 'array',
        'shap_top_features'  => 'array',
        'explain_called'     => 'boolean',
        'doctor_notified'    => 'boolean',
        'doctor_notified_at' => 'datetime',
        'prediction_date'    => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────

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

    // ── Scopes ───────────────────────────────────────────────

    public function scopeHighRisk($query)
    {
        return $query->whereIn('risk_level', ['High', 'high']);
    }

    public function scopeForPregnancy($query, $pregnancyId)
    {
        return $query->where('pregnancy_id', $pregnancyId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ── Accessors ────────────────────────────────────────────

    public function getRiskColorAttribute(): string
    {
        return match (strtolower($this->risk_level ?? '')) {
            'high'     => '#EF4444',
            'moderate' => '#F59E0B',
            'low'      => '#10B981',
            default    => '#6B7280',
        };
    }

    public function getRiskBadgeAttribute(): string
    {
        return match (strtolower($this->risk_level ?? '')) {
            'high'     => 'خطورة عالية — قبول SCBU',
            'moderate' => 'خطورة متوسطة',
            'low'      => 'خطورة منخفضة',
            default    => 'غير محدد',
        };
    }
}
