<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PregnancyEntry extends Model
{
    use HasFactory;
    protected $fillable = [
        'pregnancy_id',
        'week_number',
        'weight',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'symptoms',
        'notes',
        'entry_date',
    ];

    protected $casts = [
        'symptoms' => 'array',
        'entry_date' => 'date',
    ];

    // Relationships
    public function pregnancy()
    {
        return $this->belongsTo(Pregnancy::class);
    }
}
