<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Traits\OptimizedQueries;

class Consultation extends Model
{
    use HasFactory, SoftDeletes, OptimizedQueries;

    protected $fillable = [
        'doctor_id',
        'user_id',
        'date',
        'time',
        'status',
        'type',
        'price',
        'platform_commission',
        'zoom_meeting_id',
        'zoom_join_url',
        'zoom_password',
        'patient_notes',
        'doctor_notes',
        'duration_minutes',
        'started_at',
        'ended_at',
        'cancellation_reason',
        'google_meet_link',
        'google_meet_id',
        'google_event_id',
    ];

    protected $casts = [
        'date' => 'date',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function review()
    {
        return $this->hasOne(ConsultationReview::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function prescription()
    {
        return $this->hasOne(Prescription::class);
    }

    public function reminders()
    {
        return $this->hasMany(AppointmentReminder::class);
    }

    public function attachments()
    {
        return $this->hasMany(ConsultationAttachment::class);
    }

    public function messages()
    {
        return $this->hasMany(ConsultationMessage::class);
    }

    public function isChatActive(): bool
    {
        return in_array($this->status, ['confirmed', 'in_progress']);
    }

    // Helper methods
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function canBeCancelled()
    {
        return in_array($this->status, ['pending', 'confirmed']);
    }
}
