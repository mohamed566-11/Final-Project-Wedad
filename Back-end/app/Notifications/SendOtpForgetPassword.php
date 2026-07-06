<?php

namespace App\Notifications;

use Ichtrojan\Otp\Otp;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SendOtpForgetPassword extends Notification
{

    // لا نحتاج لتعريف $otp هنا أو في الكونستركتور
    // لأننا سنستخدمه مرة واحدة فقط لحظة الإرسال

    public function __construct()
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // 1. تقليل المدة إلى 15 دقيقة (أكثر أماناً)
        // 2. استخدام generate مباشرة
        $otp = (new Otp)->generate($notifiable->email, 'numeric', 5, 15);

        return (new MailMessage)
            ->subject('رمز التحقق - منصة وداد')
            ->view('emails.otp', [
                'otpToken' => $otp->token,
                'recipientName' => $notifiable->name
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}