<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Doctor;
use App\Models\UserProfile;
use App\Traits\OptimizedQueries;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes, OptimizedQueries;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'is_active',
        'email_verified_at',
        'life_stage_id',
        'age',
        'image',
        'google_id',
        'last_login_at',
        'notification_settings',
    ];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'notification_settings' => 'array',
        ];
    }

    // Relationships
    public function lifeStage()
    {
        return $this->belongsTo(LifeStage::class);
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    // Use ->with('profile') explicitly where needed instead of global scope

    public function doctors()
    {
        return $this->belongsToMany(Doctor::class, 'doctor_patients')
            ->withPivot('first_appointment_date', 'last_appointment_date', 'total_appointments')
            ->withTimestamps();
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function reviews()
    {
        return $this->hasMany(ConsultationReview::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function moodEntries()
    {
        return $this->hasMany(MoodEntry::class, 'user_id');
    }

    public function weightEntries()
    {
        return $this->hasMany(WeightEntry::class, 'user_id');
    }

    public function periodCycles()
    {
        return $this->hasMany(PeriodCycle::class, 'user_id');
    }

    public function fertilityEntries()
    {
        return $this->hasMany(FertilityEntry::class, 'user_id');
    }

    public function pregnancies()
    {
        return $this->hasMany(Pregnancy::class);
    }

    public function activePregnancy()
    {
        return $this->hasOne(Pregnancy::class)->where('is_active', true)->latest();
    }

    public function medicalFiles()
    {
        return $this->hasMany(PatientMedicalFile::class);
    }

    public function aiChatMessages()
    {
        return $this->hasMany(AiChatMessage::class);
    }

    public function labTestResults()
    {
        return $this->hasMany(LabTestResult::class);
    }

    public function healthSyncs()
    {
        return $this->hasMany(HealthSync::class);
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

    public function scbuAdmissionPredictions()
    {
        return $this->hasMany(ScbuAdmissionPrediction::class);
    }

    public function appointmentReminders()
    {
        return $this->hasMany(AppointmentReminder::class);
    }

    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function googleFitToken()
    {
        return $this->hasOne(PatientGoogleFit::class);
    }

    public function heartRates()
    {
        return $this->hasMany(PatientHeartRate::class);
    }

    public function oxygens()
    {
        return $this->hasMany(PatientOxygen::class);
    }

    public function sleepSegments()
    {
        return $this->hasMany(PatientSleep::class);
    }

    public function stepRecords()
    {
        return $this->hasMany(PatientStep::class);
    }

    public function chatbotPreference()
    {
        return $this->hasOne(PatientChatbotPreference::class);
    }

    // Helper methods — delegates to profile's BMI calculation
    public function calculateBMI(): ?float
    {
        return $this->profile?->calculateBMI();
    }
}
