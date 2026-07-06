<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ConsultationMessage extends Model
{
    protected $fillable = [
        'consultation_id',
        'sender_type',
        'sender_id',
        'message',
        'image_path',
        'message_type',
        'is_delivered',
        'delivered_at',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_delivered' => 'boolean',
        'delivered_at' => 'datetime',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // =========================================================================
    //  RELATIONSHIPS
    // =========================================================================

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    /**
     * Polymorphic sender — returns User (patient) or Doctor
     */
    public function sender()
    {
        if ($this->sender_type === 'patient') {
            return $this->belongsTo(User::class, 'sender_id');
        }
        return $this->belongsTo(Doctor::class, 'sender_id');
    }

    // =========================================================================
    //  SCOPES
    // =========================================================================

    public function scopeForConsultation($query, int $consultationId)
    {
        return $query->where('consultation_id', $consultationId);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeByPatient($query)
    {
        return $query->where('sender_type', 'patient');
    }

    public function scopeByDoctor($query)
    {
        return $query->where('sender_type', 'doctor');
    }

    public function scopeAfter($query, int $messageId)
    {
        return $query->where('id', '>', $messageId);
    }

    // =========================================================================
    //  HELPERS
    // =========================================================================

    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    public function getImageUrlAttribute(): ?string
    {
        // UI should use the dynamic URL from ChatMessageResource
        return null;
    }

    /**
     * Delete associated image from storage when message is deleted
     */
    protected static function booted(): void
    {
        static::deleted(function (ConsultationMessage $message) {
            if ($message->image_path) {
                Storage::disk(config('chat.storage.disk', 'public'))->delete($message->image_path);
            }
        });
    }
}
