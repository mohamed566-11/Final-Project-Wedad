<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class HighRiskPredictionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private User $patient;
    private $prediction;
    private string $diseaseType;

    private array $diseaseNames = [
        'gestational_diabetes' => 'سكري الحمل',
        'preeclampsia' => 'تسمم الحمل',
        'preterm_birth' => 'الولادة المبكرة',
    ];

    public function __construct(User $patient, $prediction, string $diseaseType)
    {
        $this->patient = $patient;
        $this->prediction = $prediction;
        $this->diseaseType = $diseaseType;
    }

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $diseaseName = $this->diseaseNames[$this->diseaseType] ?? $this->diseaseType;

        return (new MailMessage)
            ->subject("⚠️ تنبيه: نتيجة فحص خطورة عالية - {$diseaseName}")
            ->greeting("مرحباً د. {$notifiable->name}")
            ->line("تم رصد نتيجة **خطورة عالية** لمريضتك **{$this->patient->name}** في فحص {$diseaseName}.")
            ->line("مستوى الخطورة: {$this->prediction->risk_badge}")
            ->line("نسبة الاحتمالية: " . round(($this->prediction->risk_score ?? 0) * 100, 1) . '%')
            ->action('عرض التفاصيل', url('/doctor/patients/' . $this->patient->id . '/ai-predictions'))
            ->line('يُنصح بالتواصل مع المريضة وتحديد موعد متابعة.')
            ->salutation('منصة وداد - نظام الذكاء الاصطناعي');
    }

    public function toArray($notifiable): array
    {
        $diseaseName = $this->diseaseNames[$this->diseaseType] ?? $this->diseaseType;

        return [
            'type' => 'high_risk_prediction',
            'title' => "⚠️ تنبيه خطورة عالية - {$diseaseName}",
            'message' => "المريضة {$this->patient->name} حصلت على نتيجة خطورة عالية في فحص {$diseaseName}",
            'patient_id' => $this->patient->id,
            'patient_name' => $this->patient->name,
            'prediction_id' => $this->prediction->id,
            'disease_type' => $this->diseaseType,
            'risk_level' => $this->prediction->risk_level,
            'risk_score' => $this->prediction->risk_score,
            'action_url' => '/doctor/patients/' . $this->patient->id . '/ai-predictions',
            'consultation_suggested' => true,
        ];
    }
}
