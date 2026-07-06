<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthSync extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'data_type',
        'value',
        'unit',
        'recorded_at',
        'additional_data',
    ];

    protected $casts = [
        'additional_data' => 'array',
        'recorded_at' => 'datetime',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class);
    }
}
