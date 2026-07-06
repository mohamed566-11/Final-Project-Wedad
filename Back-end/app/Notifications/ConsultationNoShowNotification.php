<?php

namespace App\Notifications;

use App\Models\Consultation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class ConsultationNoShowNotification extends Notification
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

        if ($notifiable->user_type === 'patient') {
            $message = "للأسف، تم تسجيلك كعدم حضور لموعد استشارتك.\n\n" .
                       "الطبيب: د. {$doctor->name}\n" .
                       "التاريخ: {$consultationDate}\n" .
                       "الوقت: {$consultationTime}\n\n" .
                       "نذكرك بأهمية الحضور في الموعد المحدد. في حال تكرار عدم الحضور، قد يتم تطبيق سياسة الغياب المعتمدة لدينا.";

            return (new MailMessage)
                ->subject('تسجيل غياب عن الاستشارة - منصة وداد')
                ->view('emails.notification', [
                    'notificationTitle' => 'تسجيل عدم حضور',
                    'recipientName' => $notifiable->name,
                    'notificationMessage' => $message,
                    'actionLabel' => 'حجز موعد جديد',
                    'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . '/patient/consultations/doctors',
                ]);
        }

        $message = "لم يحضر المريض لموعد الاستشارة المجدول.\n\n" .
                   "التاريخ: {$consultationDate}\n" .
                   "الوقت: {$consultationTime}";

        return (new MailMessage)
            ->subject('عدم حضور مريض - منصة وداد')
            ->view('emails.notification', [
                'notificationTitle' => 'عدم حضور مريض',
                'recipientName' => "د. {$notifiable->name}",
                'notificationMessage' => $message,
                'actionLabel' => 'عرض استشاراتي',
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
        $isPatient = $notifiable->user_type === 'patient';

        return [
            'type' => 'consultation_no_show',
            'consultation_id' => $this->consultation->id,
            'title' => $isPatient ? 'تم تسجيلك كعدم حضور' : 'عدم حضور المريض',
            'body' => $isPatient 
                ? 'لم تحضر لموعد استشارتك المحدد'
                : 'لم يحضر المريض لموعد الاستشارة',
            'doctor_name' => $this->consultation->doctor?->name,
            'date' => $this->consultation->date,
            'time' => $this->consultation->time,
            'url' => $isPatient ? '/patient/consultations' : '/doctor/consultations',
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
