<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientHeartRate extends Model
{
    protected $fillable = [
        'user_id',
        'timestamp',
        'heart_rate_bpm',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'heart_rate_bpm' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
