<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientStep extends Model
{
    protected $fillable = [
        'user_id',
        'timestamp',
        'steps',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'steps' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
