<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
class Pregnancy extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'conception_date',
        'last_menstrual_period',
        'due_date',
        'current_week',
        'is_active',
        'pregnancy_status',
        'delivery_date',
        'delivery_type',
        'notes',
    ];

    protected $casts = [
        'conception_date' => 'date',
        'last_menstrual_period' => 'date',
        'due_date' => 'date',
        'delivery_date' => 'date',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function entries()
    {
        return $this->hasMany(PregnancyEntry::class);
    }

    public function medicalFiles()
    {
        return $this->hasMany(PatientMedicalFile::class);
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

    // Calculate current week
    public function updateCurrentWeek()
    {
        $weeks = now()->diffInWeeks($this->last_menstrual_period);
        $this->update(['current_week' => $weeks]);
    }
}
