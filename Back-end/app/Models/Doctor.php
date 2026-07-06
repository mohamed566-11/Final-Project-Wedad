<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Traits\OptimizedQueries;

class Doctor extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes, Notifiable, OptimizedQueries;

    // protected $guard = 'doctor';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'is_active',
        'email_verified_at',
        'age',
        'image',
        'specialization',
        'license_number',
        'bio',
        'consultation_price',
        'verification_status',
        'rejection_reason',
        'is_available',
        'rating',
        'total_consultations',
        'session_type',
        'license_document',
        'id_document',
        'certificate',
        'years_of_experience',
        'languages',
        'clinic_address',
        'verified_at',
        'last_login_at',
        'notification_settings',
        'google_access_token',
        'google_refresh_token',
        'google_token_expires_at',
        'google_email',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_available' => 'boolean',
        'languages' => 'array',
        'verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'notification_settings' => 'array',
        'google_token_expires_at' => 'datetime',
    ];

    // Relationships
    public function lifeStages()
    {
        return $this->belongsToMany(LifeStage::class, 'doctor_life_stages')->withTimestamps();
    }

    public function patients()
    {
        return $this->belongsToMany(User::class, 'doctor_patients')
            ->withPivot('first_appointment_date', 'last_appointment_date', 'total_appointments')
            ->withTimestamps();
    }

    public function workingHours()
    {
        return $this->hasMany(DoctorWorkingHour::class);
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function reviews()
    {
        return $this->hasMany(ConsultationReview::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function preeclampsiaPredictions()
    {
        return $this->hasMany(PreeclampsiaPrediction::class);
    }

    public function gestationalDiabetesPredictions()
    {
        return $this->hasMany(GestationalDiabetesPrediction::class);
    }

    public function pretermBirthPredictions()
    {
        return $this->hasMany(PretermBirthPrediction::class);
    }

    // Helper methods
    public function isVerified()
    {
        return $this->verification_status === 'verified';
    }

    public function updateRating()
    {
        $avgRating = $this->reviews()->avg('rating');
        $this->update([
            'rating' => round($avgRating, 2),
        ]);
    }
}
