<?php

namespace App\Notifications;

use Ichtrojan\Otp\Otp;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendOtpVerifyUserEmail extends Notification
{

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        // لا نحتاج لإنشاء instance هنا، سننشئه وقت الإرسال فقط
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // توليد الكود هنا
        // العرف السائد هو 10-15 دقيقة
        $otp = (new Otp)->generate($notifiable->email, 'numeric', 5, 15);

        return (new MailMessage)
            ->subject('رمز التحقق من البريد الإلكتروني - وداد')
            ->view('emails.otp', [
                'otpToken' => $otp->token,
                'recipientName' => $notifiable->name
            ]);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}