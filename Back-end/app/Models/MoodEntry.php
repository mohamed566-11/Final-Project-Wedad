<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class MoodEntry extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'mood',
        'notes',
        'factors',
        'entry_date',
        'entry_time',
    ];

    protected $casts = [
        'factors' => 'array',
        'entry_date' => 'date',
        'entry_time' => 'datetime',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
