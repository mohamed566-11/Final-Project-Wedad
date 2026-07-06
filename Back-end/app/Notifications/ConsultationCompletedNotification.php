<?php

namespace App\Notifications;

use App\Models\Consultation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ConsultationCompletedNotification extends Notification
{

    protected Consultation $consultation;

    public function __construct(Consultation $consultation)
    {
        $this->consultation = $consultation;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = "نود إعلامك بأن استشارتك مع د. {$this->consultation->doctor->name} قد اكتملت بنجاح.";
        
        if ($this->consultation->doctor_notes) {
            $message .= "\n\nملاحظات الطبيب:\n{$this->consultation->doctor_notes}";
        }

        if ($this->consultation->prescription) {
            $message .= "\n\nتم إصدار وصفة طبية لك. يمكنك الاطلاع عليها وتحميلها عبر الرابط أدناه.";
            $actionLabel = 'عرض الوصفة الطبية';
            $actionUrl = env('FRONTEND_URL', 'http://localhost:8080') . '/patient/consultations/' . $this->consultation->id . '/prescription';
        } else {
            $actionLabel = 'عرض تفاصيل الاستشارة';
            $actionUrl = env('FRONTEND_URL', 'http://localhost:8080') . '/patient/consultations/' . $this->consultation->id;
        }

        return (new MailMessage)
            ->subject('إكتمال الاستشارة - منصة وداد')
            ->view('emails.notification', [
                'notificationTitle' => 'إكتمال الاستشارة',
                'recipientName' => $notifiable->name,
                'notificationMessage' => $message,
                'actionLabel' => $actionLabel,
                'actionUrl' => $actionUrl,
                'icon' => null,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'اكتملت الاستشارة',
            'body' => 'تم إنهاء استشارتك مع د. ' . $this->consultation->doctor->name,
            'type' => 'consultation',
            'consultation_id' => $this->consultation->id,
            'doctor_name' => $this->consultation->doctor->name,
            'has_prescription' => (bool) $this->consultation->prescription,
        ];
    }
}
