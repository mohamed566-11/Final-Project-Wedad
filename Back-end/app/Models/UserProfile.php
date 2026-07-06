<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class UserProfile extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'height',
        'weight',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'blood_type',
        'date_of_birth',
        'national_id',
        'medical_history',
        'chronic_diseases',
        'allergies',
        'current_medications',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected $casts = [
        'chronic_diseases' => 'array',
        'allergies' => 'array',
        'current_medications' => 'array',
        'date_of_birth' => 'date',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Calculate BMI
    public function getBmiAttribute()
    {
        return $this->calculateBMI();
    }

    public function calculateBMI()
    {
        if ($this->height && $this->weight) {
            $heightInMeters = $this->height / 100;
            return round($this->weight / ($heightInMeters * $heightInMeters), 2);
        }
        return null;
    }

    public function getBmiCategoryAttribute()
    {
        $bmi = $this->calculateBMI();

        if (!$bmi) {
            return null;
        }

        if ($bmi < 18.5) {
            return 'Underweight';
        } elseif ($bmi >= 18.5 && $bmi < 24.9) {
            return 'Normal weight';
        } elseif ($bmi >= 25 && $bmi < 29.9) {
            return 'Overweight';
        } else {
            return 'Obesity';
        }
    }

    public function getAgeCalculatedAttribute()
    {
        if ($this->date_of_birth) {
            return $this->date_of_birth->age;
        }
        return null;
    }
}
