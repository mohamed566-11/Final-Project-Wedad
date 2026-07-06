<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class AiChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'bot_type',
        'role',
        'message',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeForBot($query, string $botType)
    {
        return $query->where('bot_type', $botType);
    }

    public function scopeForSession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }
}
