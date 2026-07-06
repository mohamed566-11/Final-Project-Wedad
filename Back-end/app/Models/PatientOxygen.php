<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientOxygen extends Model
{
    protected $table = 'patient_oxygens';

    protected $fillable = [
        'user_id',
        'timestamp',
        'oxygen_pct',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'oxygen_pct' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
