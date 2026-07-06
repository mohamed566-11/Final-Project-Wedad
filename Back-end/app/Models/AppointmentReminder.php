<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AppointmentReminder extends Model
{
    protected $fillable = [
        'consultation_id',
        'user_id',
        'reminder_type',
        'scheduled_at',
        'status',
        'sent_at',
        'error_message',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    // Relationships
    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
