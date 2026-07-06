<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MlPredictionsHistory extends Model
{
    protected $table = 'ml_predictions_history';
    
    protected $appends = ['disease_name_ar'];

    protected $fillable = [
        'user_id',
        'predictable_type',
        'predictable_id',
        'disease_type',
        'input_features',
        'model_output',
        'model_version',
        'algorithm_used',
        'confidence_score',
        'risk_level',
        'recommendation_summary',
        'processing_time_ms',
    ];

    protected $casts = [
        'input_features' => 'array',
        'model_output' => 'array',
    ];

    // === Relationships ===

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function predictable()
    {
        return $this->morphTo();
    }

    // === Scopes ===

    public function scopeForDisease($query, string $type)
    {
        return $query->where('disease_type', $type);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeHighRisk($query)
    {
        return $query->whereIn('risk_level', ['high', 'High Risk', 'High']);
    }

    // === Accessors ===

    public function getDiseaseNameArAttribute(): string
    {
        return match ($this->disease_type) {
            'gestational_diabetes' => 'سكري الحمل',
            'preeclampsia' => 'تسمم الحمل',
            'preterm_birth' => 'الولادة المبكرة',
            default => $this->disease_type,
        };
    }

    public function getRiskColorAttribute(): string
    {
        return match (strtolower($this->risk_level ?? '')) {
            'high risk', 'high' => '#EF4444',
            'moderate risk', 'moderate', 'medium' => '#F59E0B',
            'low risk', 'low' => '#10B981',
            default => '#6B7280',
        };
    }
}
