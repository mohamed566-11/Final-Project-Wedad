<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ConsultationReview extends Model
{
    use HasFactory;
    protected $fillable = [
        'consultation_id',
        'doctor_id',
        'user_id',
        'rating',
        'comment',
        'is_anonymous',
        'is_published',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'is_published' => 'boolean',
    ];

    // Relationships
    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    protected static function booted()
    {
        $clearCacheAndUpdateRating = function ($review) {
            if ($review->doctor) {
                $review->doctor->updateRating();
                \Illuminate\Support\Facades\Cache::forget("public_doctor_{$review->doctor_id}");
            }
        };

        static::created($clearCacheAndUpdateRating);
        static::updated($clearCacheAndUpdateRating);
        static::deleted($clearCacheAndUpdateRating);
    }
}
