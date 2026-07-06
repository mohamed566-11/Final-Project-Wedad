<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class WeightEntry extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'weight',
        'height',
        'bmi',
        'entry_date',
        'entry_time',
        'notes',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'entry_time' => 'datetime',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Auto-calculate BMI using same formula as UserProfile
    protected static function booted()
    {
        static::creating(function ($entry) {
            if ($entry->height && $entry->weight) {
                $entry->bmi = self::computeBmi($entry->weight, $entry->height);
            }
        });
    }

    /**
     * Compute BMI from weight (kg) and height (cm)
     */
    public static function computeBmi(float $weight, float $height): float
    {
        $heightInMeters = $height / 100;
        return round($weight / ($heightInMeters * $heightInMeters), 2);
    }
}
