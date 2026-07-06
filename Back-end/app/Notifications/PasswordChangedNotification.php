<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChangedNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): \Illuminate\Notifications\Messages\MailMessage
    {
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('إشعار أمني - تم تغيير كلمة المرور')
            ->view('emails.notification', [
                'notificationTitle' => 'تغيير كلمة المرور',
                'recipientName' => $notifiable->name,
                'notificationMessage' => "نعلمك بأنه تم تغيير كلمة المرور الخاصة بحسابك بنجاح.\n\nإذا لم تقم بهذا التغيير، يُرجى التواصل مع فريق الدعم الفني فوراً لحماية حسابك.",
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . '/login',
                'actionLabel' => 'تسجيل الدخول'
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'تغيير كلمة المرور',
            'title_en' => 'Password Changed',
            'body' => 'تم تغيير كلمة المرور الخاصة بك بنجاح.',
            'body_en' => 'Your password was changed successfully.',
            'type' => 'security_alert',
            'action_url' => '/profile',
        ];
    }
}
