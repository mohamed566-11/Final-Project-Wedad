<?php

namespace App\Models;

use App\Models\User;
use App\Traits\OptimizedQueries;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, OptimizedQueries;
    protected $fillable = [
        'user_id',
        'consultation_id',
        'transaction_id',
        'amount',
        'platform_fee',
        'doctor_amount',
        'status',
        'payment_method',
        'paymob_response',
        'paid_at',
        'failure_reason',
    ];

    protected $casts = [
        'paymob_response' => 'array',
        'paid_at' => 'datetime',
    ];

    // Relationships
    public function patient()
{
    return $this->belongsTo(User::class, 'user_id');
}

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
