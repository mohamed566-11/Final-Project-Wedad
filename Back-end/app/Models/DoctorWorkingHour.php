<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorWorkingHour extends Model
{
    use HasFactory;
    protected $fillable = [
        'doctor_id',
        'day',
        'start_time',
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
