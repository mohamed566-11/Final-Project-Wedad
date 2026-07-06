<?php

namespace App\Http\Resources\Shared;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Determine current user type and ID
        $guard = $this->detectGuard($request);
        $currentUserId = $request->user($guard)?->id;
        $currentUserType = match($guard) {
            'doctor' => 'doctor',
            'admin'  => 'admin',
            default  => 'patient',
        };

        // Get sender info
        $senderName = $this->getSenderName();
        $senderAvatar = $this->getSenderAvatar();

        return [
            'id'            => $this->id,
            'consultation_id' => $this->consultation_id,
            'sender_type'   => $this->sender_type,
            'sender_id'     => $this->sender_id,
            'sender_name'   => $senderName,
            'sender_avatar' => $senderAvatar,
            'message'       => $this->message,
            'image_url'     => $this->image_path ? rtrim(config('app.url'), '/') . "/api/v1/{$currentUserType}/consultations/{$this->consultation_id}/chat/messages/{$this->id}/download" : null,
            'message_type'  => $this->message_type,
            'is_delivered'  => $this->is_delivered,
            'delivered_at'  => $this->delivered_at?->toISOString(),
            'is_read'       => $this->is_read,
            'read_at'       => $this->read_at?->toISOString(),
            'created_at'    => $this->created_at->toISOString(),
            'is_mine'       => $currentUserType !== 'admin'
                               && $this->sender_type === $currentUserType
                               && $this->sender_id === $currentUserId,
        ];
    }

    private function detectGuard(Request $request): string
    {
        if ($request->user('admin')) return 'admin';
        if ($request->user('doctor')) return 'doctor';
        return 'patient';
    }

    private function getSenderName(): string
    {
        if ($this->relationLoaded('consultation')) {
            $consultation = $this->consultation;
            if ($this->sender_type === 'patient' && $consultation->relationLoaded('patient')) {
                return $consultation->patient->name ?? 'مريضة';
            }
            if ($this->sender_type === 'doctor' && $consultation->relationLoaded('doctor')) {
                return $consultation->doctor->name ?? 'دكتور';
            }
        }

        // Fallback: query sender
        $sender = $this->sender;
        return $sender->name ?? ($this->sender_type === 'patient' ? 'مريضة' : 'دكتور');
    }

    private function getSenderAvatar(): ?string
    {
        $sender = $this->sender;
        if (!$sender) return null;

        if ($this->sender_type === 'patient') {
            $path = $sender->profile?->image ?? $sender->image ?? null;
        } else {
            $path = $sender->image ?? null;
        }

        return $path
            ? rtrim(config('app.url'), '/') . '/storage/' . ltrim($path, '/')
            : null;
    }
}
