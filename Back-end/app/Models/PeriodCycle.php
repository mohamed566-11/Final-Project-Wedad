<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PeriodCycle extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'cycle_length',
        'period_length',
        'flow',
        'symptoms',
        'notes',
        'is_predicted',
    ];

    protected $casts = [
        'symptoms' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_predicted' => 'boolean',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
