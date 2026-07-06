<?php

namespace App\Notifications;

use App\Models\Consultation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class ConsultationConfirmedNotification extends Notification
{

    protected Consultation $consultation;

    /**
     * Create a new notification instance.
     */
    public function __construct(Consultation $consultation)
    {
        $this->consultation = $consultation;
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
        $doctor = $this->consultation->doctor;
        $consultationDate = Carbon::parse($this->consultation->date)->format('d/m/Y');
        $consultationTime = $this->consultation->time;

        $message = "يسعدنا إخبارك بأنه تم تأكيد موعد استشارتك.\n\n" .
                   "الطبيب: د. {$doctor->name}\n" .
                   "التخصص: {$doctor->specialization_ar}\n" .
                   "التاريخ: {$consultationDate}\n" .
                   "الوقت: {$consultationTime}\n" .
                   "نوع الاستشارة: " . ($this->consultation->type === 'video' ? 'استشارة عن بُعد (فيديو)' : 'استشارة حضورية');

        if ($this->consultation->type === 'video') {
            $message .= "\n\nستصلك رسالة تذكير قبل الموعد مع رابط الانضمام للمكالمة.";
        }

        return (new MailMessage)
            ->subject('تأكيد موعد الاستشارة - منصة وداد')
            ->view('emails.notification', [
                'notificationTitle' => 'تأكيد موعد الاستشارة',
                'recipientName' => $notifiable->name,
                'notificationMessage' => $message,
                'actionLabel' => 'عرض تفاصيل الاستشارة',
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . "/patient/consultations/{$this->consultation->id}",
                'icon' => null,
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
            'type' => 'consultation_confirmed',
            'consultation_id' => $this->consultation->id,
            'title' => 'تم تأكيد موعدك! ✅',
            'body' => "تم تأكيد موعدك مع د. {$this->consultation->doctor?->name} يوم " .
                     Carbon::parse($this->consultation->date)->format('d/m') .
                     " الساعة {$this->consultation->time}",
            'doctor_name' => $this->consultation->doctor?->name,
            'date' => $this->consultation->date,
            'time' => $this->consultation->time,
            'consultation_type' => $this->consultation->type,
            'url' => "/patient/consultations/{$this->consultation->id}",
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
