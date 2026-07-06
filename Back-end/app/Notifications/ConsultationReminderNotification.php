<?php

namespace App\Notifications;

use App\Models\Consultation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class ConsultationReminderNotification extends Notification
{

    protected Consultation $consultation;
    protected string $reminderType;

    /**
     * Create a new notification instance.
     */
    public function __construct(Consultation $consultation, string $reminderType)
    {
        $this->consultation = $consultation;
        $this->reminderType = $reminderType;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Add email for 24-hour and 1-hour reminders
        if (in_array($this->reminderType, ['24_hours', '1_hour'])) {
            $channels[] = 'mail';
        }

        // Add broadcast for real-time notification
        $channels[] = 'broadcast';

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $doctor = $this->consultation->doctor;
        $consultationDate = Carbon::parse($this->consultation->date)->format('d/m/Y');
        $consultationTime = $this->consultation->time;
        
        $subject = $this->getSubject();
        $greeting = tap($this->getGreeting(), fn($g) => $g);

        $message = "{$greeting}\n\n" .
                   "الطبيب: د. {$doctor->name}\n" .
                   "التخصص: " . ($doctor->specialization_ar ?? $doctor->specialization) . "\n" .
                   "التاريخ: {$consultationDate}\n" .
                   "الوقت: {$consultationTime}\n" .
                   "نوع الاستشارة: " . ($this->consultation->type === 'video' ? 'استشارة عن بُعد (فيديو)' : 'استشارة حضورية');

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.notification', [
                'notificationTitle' => 'تذكير بموعد الاستشارة',
                'recipientName' => $notifiable->name,
                'notificationMessage' => $message,
                'actionLabel' => 'عرض تفاصيل الاستشارة',
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . "/patient/consultations/{$this->consultation->id}",
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
            'type' => 'consultation_reminder',
            'consultation_id' => $this->consultation->id,
            'reminder_type' => $this->reminderType,
            'title' => $this->getTitle(),
            'body' => $this->getBody(),
            'doctor_name' => $this->consultation->doctor?->name,
            'date' => $this->consultation->date,
            'time' => $this->consultation->time,
            'consultation_type' => $this->consultation->type,
            'url' => "/patient/consultations/{$this->consultation->id}",
            'video_url' => $this->consultation->type === 'video' 
                ? "/patient/consultations/{$this->consultation->id}/video" 
                : null,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Get the email subject based on reminder type
     */
    private function getSubject(): string
    {
        return match($this->reminderType) {
            '24_hours' => 'تذكير: موعدك غداً مع د. ' . $this->consultation->doctor?->name,
            '1_hour' => 'تذكير: موعدك بعد ساعة واحدة!',
            '15_minutes' => 'استشارتك تبدأ خلال 15 دقيقة!',
            default => 'تذكير بموعد استشارتك',
        };
    }

    /**
     * Get the title for push notification
     */
    private function getTitle(): string
    {
        return match($this->reminderType) {
            '24_hours' => 'تذكير: موعدك غداً',
            '1_hour' => 'موعدك بعد ساعة!',
            '15_minutes' => 'استشارتك تبدأ قريباً!',
            default => 'تذكير بموعد استشارتك',
        };
    }

    /**
     * Get the body text for notification
     */
    private function getBody(): string
    {
        $doctorName = $this->consultation->doctor?->name ?? 'الطبيب';
        $time = $this->consultation->time;

        return match($this->reminderType) {
            '24_hours' => "لديك موعد استشارة غداً الساعة {$time} مع د. {$doctorName}",
            '1_hour' => "استشارتك مع د. {$doctorName} تبدأ بعد ساعة واحدة",
            '15_minutes' => "استشارتك مع د. {$doctorName} تبدأ خلال 15 دقيقة، استعد للانضمام!",
            default => "تذكير بموعد استشارتك مع د. {$doctorName}",
        };
    }

    /**
     * Get the greeting for email
     */
    private function getGreeting(): string
    {
        return match($this->reminderType) {
            '24_hours' => 'نود تذكيرك بموعد استشارتك غداً.',
            '1_hour' => 'موعد استشارتك قريب جداً!',
            '15_minutes' => 'استشارتك على وشك البدء!',
            default => 'تذكير مهم بموعد استشارتك.',
        };
    }
}
