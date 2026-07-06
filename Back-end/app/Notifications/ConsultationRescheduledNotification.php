<?php

namespace App\Notifications;

use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ConsultationRescheduledNotification extends Notification
{
    use Queueable;

    protected Consultation $consultation;
    protected string $oldDate;
    protected string $oldTime;

    /**
     * Create a new notification instance.
     */
    public function __construct(Consultation $consultation, string $oldDate, string $oldTime)
    {
        $this->consultation = $consultation;
        $this->oldDate = $oldDate;
        $this->oldTime = $oldTime;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $patientName = $this->consultation->patient?->name ?? 'مريض غير معروف';
        $newDate = Carbon::parse($this->consultation->date)->format('d/m/Y');
        $newTime = $this->consultation->time;
        $oldDate = Carbon::parse($this->oldDate)->format('d/m/Y');

        $message = "لقد قام/قامت ({$patientName}) بإعادة جدولة موعد الاستشارة.\n\n" .
                   "الموعد السابق: {$oldDate} الساعة {$this->oldTime}\n" .
                   "الموعد الجديد: {$newDate} الساعة {$newTime}";

        return (new MailMessage)
            ->subject('إعادة جدولة استشارة - منصة وداد')
            ->view('emails.notification', [
                'notificationTitle' => 'تغيير موعد استشارة',
                'recipientName' => "د. {$notifiable->name}",
                'notificationMessage' => $message,
                'actionLabel' => 'عرض تفاصيل الاستشارة',
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . "/doctor/consultations/{$this->consultation->id}",
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $patientName = $this->consultation->patient?->name ?? 'المريضة';

        return [
            'type' => 'consultation_rescheduled',
            'consultation_id' => $this->consultation->id,
            'title' => 'تم تغيير موعد استشارة 🔄',
            'body' => "قامت {$patientName} بتغيير الموعد إلى " .
                Carbon::parse($this->consultation->date)->format('d/m') .
                " الساعة {$this->consultation->time}",
            'patient_name' => $patientName,
            'old_date' => $this->oldDate,
            'old_time' => $this->oldTime,
            'new_date' => $this->consultation->date,
            'new_time' => $this->consultation->time,
            'url' => "/doctor/consultations/{$this->consultation->id}",
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
