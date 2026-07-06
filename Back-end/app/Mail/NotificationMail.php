<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $notificationTitle,
        public readonly string $notificationMessage,
        public readonly string $notificationType,
        public readonly ?string $actionUrl = null,
        public readonly ?string $actionLabel = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->notificationTitle} - وداد",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.notification', with: [
            'recipientName' => $this->recipientName,
            'notificationTitle' => $this->notificationTitle,
            'notificationMessage' => $this->notificationMessage,
            'notificationType' => $this->notificationType,
            'icon' => $this->resolveIcon(),
            'actionUrl' => $this->actionUrl ?? config('app.frontend_url', config('app.url')),
            'actionLabel' => $this->actionLabel ?? 'فتح منصة وداد',
        ]);
    }

    private function resolveIcon(): string
    {
        return match (true) {
            str_contains($this->notificationType, 'consultation') => '🩺',
            str_contains($this->notificationType, 'payment') || str_contains($this->notificationType, 'payout') => '💰',
            str_contains($this->notificationType, 'article') => '📝',
            str_contains($this->notificationType, 'verified') || str_contains($this->notificationType, 'verification') => '✅',
            str_contains($this->notificationType, 'deactivated') || str_contains($this->notificationType, 'rejected') => '⚠️',
            str_contains($this->notificationType, 'reminder') || str_contains($this->notificationType, 'appointment') => '⏰',
            str_contains($this->notificationType, 'join_request') => '📋',
            default => '🔔',
        };
    }
}
