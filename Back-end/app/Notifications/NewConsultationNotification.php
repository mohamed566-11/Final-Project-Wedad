<?php

namespace App\Notifications;

use App\Models\Consultation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class NewConsultationNotification extends Notification
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
        $patient = $this->consultation->patient;
        $consultationDate = Carbon::parse($this->consultation->date)->format('d/m/Y');
        $consultationTime = $this->consultation->time;

        $message = "لديك طلب استشارة جديد.\n\n" .
                   "الحالة: بانتظار التأكيد\n" .
                   "التاريخ: {$consultationDate}\n" .
                   "الوقت: {$consultationTime}\n" .
                   "نوع الاستشارة: " . ($this->consultation->type === 'video' ? 'عن بُعد (فيديو)' : 'حضور في العيادة');

        if ($this->consultation->patient_notes) {
            $message .= "\n\nملاحظات المريض:\n{$this->consultation->patient_notes}";
        }
        
        $message .= "\n\nيرجى تأكيد الموعد في أقرب وقت.";

        return (new MailMessage)
            ->subject('طلب استشارة جديد - منصة وداد')
            ->view('emails.notification', [
                'notificationTitle' => 'طلب استشارة جديد',
                'recipientName' => "د. {$notifiable->name}",
                'notificationMessage' => $message,
                'actionLabel' => 'عرض التفاصيل والتأكيد',
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . '/doctor/consultations',
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
            'type' => 'new_consultation',
            'consultation_id' => $this->consultation->id,
            'title' => 'طلب استشارة جديد',
            'body' => "لديك طلب استشارة جديد يوم " . 
                     Carbon::parse($this->consultation->date)->format('d/m') . 
                     " الساعة {$this->consultation->time}",
            'date' => $this->consultation->date,
            'time' => $this->consultation->time,
            'consultation_type' => $this->consultation->type,
            'patient_notes' => $this->consultation->patient_notes,
            'price' => $this->consultation->price,
            'requireInteraction' => true,
            'url' => '/doctor/consultations',
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
