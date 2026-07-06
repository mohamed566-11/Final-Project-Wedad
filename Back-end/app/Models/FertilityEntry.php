<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class FertilityEntry extends Model
{
    protected $fillable = [
        'user_id',
        'entry_date',
        'bbt',
        'cervical_mucus',
        'ovulation_test_positive',
        'intercourse',
        'notes',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'ovulation_test_positive' => 'boolean',
        'intercourse' => 'boolean',
        'notes' => 'string',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
