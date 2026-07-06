<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayoutRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'amount',
        'status',
        'method',
        'details',
        'admin_note',
        'reference_no',
        'processed_at',
    ];

    protected $casts = [
        'details' => 'array',
        'processed_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
