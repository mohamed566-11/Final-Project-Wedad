<?php

namespace App\Notifications;

use App\Models\Consultation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class ConsultationCancelledNotification extends Notification
{

    protected Consultation $consultation;
    protected string $reason;

    /**
     * Create a new notification instance.
     */
    public function __construct(Consultation $consultation, string $reason = '')
    {
        $this->consultation = $consultation;
        $this->reason = $reason;
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

        $message = "نأسف لإخبارك بأنه تم إلغاء موعد استشارتك.\n\n" .
                   "الطبيب: د. {$doctor->name}\n" .
                   "التاريخ: {$consultationDate}\n" .
                   "الوقت: {$consultationTime}";

        if ($this->reason) {
            $message .= "\n\nالسبب:\n{$this->reason}";
        }

        // Check if refund is applicable
        if ($this->consultation->payment && $this->consultation->payment->status === 'completed') {
            $message .= "\n\nسيتم معالجة استرداد المبلغ إلى حسابك خلال 5 إلى 7 أيام عمل.";
        }

        return (new MailMessage)
            ->subject('إلغاء موعد الاستشارة - منصة وداد')
            ->view('emails.notification', [
                'notificationTitle' => 'إلغاء الموعد',
                'recipientName' => $notifiable->name,
                'notificationMessage' => $message,
                'actionLabel' => 'البحث عن موعد آخر',
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . '/patient/consultations/doctors',
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
            'type' => 'consultation_cancelled',
            'consultation_id' => $this->consultation->id,
            'title' => 'تم إلغاء موعد الاستشارة',
            'body' => "تم إلغاء موعدك مع د. {$this->consultation->doctor?->name}" . 
                     ($this->reason ? " - السبب: {$this->reason}" : ''),
            'doctor_name' => $this->consultation->doctor?->name,
            'date' => $this->consultation->date,
            'time' => $this->consultation->time,
            'reason' => $this->reason,
            'refund_applicable' => $this->consultation->payment?->status === 'completed',
            'url' => '/patient/consultations',
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
