<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'user_id',
        'note',
        'is_private',
    ];

    protected $casts = [
        'is_private' => 'boolean',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
