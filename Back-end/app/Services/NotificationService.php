<?php

namespace App\Services;

use App\Mail\NotificationMail;
use App\Models\Admin;
use App\Models\Article;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Core method: persists a DB notification and optionally sends an email.
     */
    public function create(
        Model $notifiable,
        string $type,
        string $title,
        string $message,
        array $data = [],
        bool $sendEmail = true,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
    ): ?DatabaseNotification {
        try {
            $notification = $notifiable->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'type' => $type,
                'data' => [
                    'title' => $title,
                    'message' => $message,
                    ...$data,
                ],
            ]);

            // Send via Mailable class (async-queue friendly)
            if ($sendEmail && $notifiable->email) {
                $this->sendNotificationEmail(
                    $notifiable,
                    $title,
                    $message,
                    $type,
                    $actionUrl,
                    $actionLabel
                );
            }

            return $notification;
        } catch (\Exception $e) {
            Log::error('Notification creation failed: ' . $e->getMessage());
            return null;
        }
    }

    public function markAsRead(DatabaseNotification $notification): void
    {
        $notification->update(['read_at' => now()]);
    }

    public function markAllAsRead(Model $notifiable): void
    {
        $notifiable->notifications()->whereNull('read_at')->update(['read_at' => now()]);
    }

    public function getUnreadCount(Model $notifiable): int
    {
        return $notifiable->notifications()->whereNull('read_at')->count();
    }

    // =========================================================================
    //  PATIENT NOTIFICATIONS
    // =========================================================================

    public function notifyConsultationAccepted(User $patient, Consultation $consultation): void
    {
        $this->create(
            $patient,
            'consultation.accepted',
            'تم قبول الاستشارة',
            "تم قبول استشارتك مع د. {$consultation->doctor->name}",
            [
                'consultation_id' => $consultation->id,
                'doctor_name' => $consultation->doctor->name,
                'scheduled_at' => $consultation->scheduled_at,
            ]
        );
    }

    public function notifyPaymentSuccess(User $patient, Doctor $doctor, Consultation $consultation): void
    {
        // 1. Notify Patient
        $this->create(
            $patient,
            'payment.success',
            'تم الدفع بنجاح',
            "تم تأكيد حجز استشارتك مع د. {$doctor->name}",
            [
                'consultation_id' => $consultation->id,
                'doctor_name' => $doctor->name,
                'amount' => $consultation->price,
            ]
        );

        // 2. Notify Doctor
        $this->create(
            $doctor,
            'consultation.new_booking',
            'حجز جديد مدفوع',
            "تم حجز استشارة جديدة مؤكدة الدفع مع {$patient->name}",
            [
                'consultation_id' => $consultation->id,
                'patient_name' => $patient->name,
                'date' => $consultation->date,
                'time' => $consultation->time,
            ]
        );

        // 3. Notify all active Admins (new booking alert)
        $this->notifyAdminsNewBooking($consultation, $patient, $doctor);
    }

    public function notifyPatientDeactivated(User $patient, ?string $reason = null): void
    {
        $message = 'تم إيقاف حسابك من قبل الإدارة.';
        if ($reason)
            $message .= " السبب: {$reason}";

        $this->create($patient, 'patient.deactivated', 'تم إيقاف حسابك', $message, ['reason' => $reason]);
    }

    // =========================================================================
    //  DOCTOR NOTIFICATIONS
    // =========================================================================

    public function notifyConsultationBooked(Doctor $doctor, Consultation $consultation): void
    {
        $this->create(
            $doctor,
            'consultation.booked',
            'استشارة جديدة',
            "لديك استشارة جديدة مع {$consultation->patient->name}",
            [
                'consultation_id' => $consultation->id,
                'patient_name' => $consultation->patient->name,
                'scheduled_at' => $consultation->scheduled_at,
            ]
        );
    }

    public function notifyArticleApproved(Doctor $doctor, Article $article): void
    {
        $this->create(
            $doctor,
            'article.approved',
            'تم نشر مقالك',
            "تم الموافقة على مقالك: {$article->title}",
            ['article_id' => $article->id, 'article_title' => $article->title]
        );
    }

    public function notifyArticleSubmitted(Article $article): void
    {
        $this->create(
            $article->doctor,
            'article.submitted',
            'تم تقديم المقال للمراجعة',
            "تم تقديم مقالك \"{$article->title}\" للمراجعة بنجاح",
            ['article_id' => $article->id, 'article_title' => $article->title]
        );
    }

    public function notifyArticleRejected(Doctor $doctor, Article $article, string $reason): void
    {
        $this->create(
            $doctor,
            'article.rejected',
            'تم رفض مقالك',
            "تم رفض مقالك \"{$article->title}\". السبب: {$reason}",
            ['article_id' => $article->id, 'article_title' => $article->title, 'rejection_reason' => $reason]
        );
    }

    public function notifyDoctorVerified(Doctor $doctor): void
    {
        $this->create($doctor, 'doctor.verified', 'تم تفعيل حسابك', 'مبروك! تم تفعيل حسابك كطبيب على منصة وداد', []);
    }

    public function notifyDoctorVerificationApproved(Doctor $doctor): void
    {
        $this->create(
            $doctor,
            'doctor.verified',
            'تم تفعيل حسابك',
            'مبروك! تم التحقق من حسابك كطبيب على منصة وداد. يمكنك الآن استقبال الاستشارات.',
            []
        );
    }

    public function notifyDoctorVerificationRejected(Doctor $doctor, string $reason): void
    {
        $this->create(
            $doctor,
            'doctor.verification_rejected',
            'تم رفض التحقق',
            "تم رفض طلب التحقق من حسابك. السبب: {$reason}",
            ['rejection_reason' => $reason]
        );
    }

    public function notifyDoctorDeactivated(Doctor $doctor, ?string $reason = null): void
    {
        $message = 'تم إيقاف حسابك من قبل الإدارة.';
        if ($reason)
            $message .= " السبب: {$reason}";

        $this->create($doctor, 'doctor.deactivated', 'تم إيقاف حسابك', $message, ['reason' => $reason]);
    }

    public function notifyJoinRequestStatusChanged(Doctor $doctor, string $status): void
    {
        $statusMessages = [
            'contacted' => 'تم التواصل معك بخصوص طلب انضمامك.',
            'approved' => 'مبروك! تم قبول طلب انضمامك لمنصة وداد.',
            'rejected' => 'نأسف، تم رفض طلب انضمامك.',
        ];

        $message = $statusMessages[$status] ?? "تم تحديث حالة طلب انضمامك إلى: {$status}";

        $this->create($doctor, 'join_request.' . $status, 'تحديث طلب الانضمام', $message, ['status' => $status]);
    }

    public function notifyPayoutProcessed(Doctor $doctor, float $amount, string $method): void
    {
        $methodNames = ['bank_transfer' => 'تحويل بنكي', 'wallet' => 'محفظة إلكترونية', 'cash' => 'نقداً'];
        $methodName = $methodNames[$method] ?? $method;

        $this->create(
            $doctor,
            'payout.processed',
            'تم معالجة دفعتك',
            "تم معالجة دفعة بمبلغ {$amount} جنيه عبر {$methodName}.",
            ['amount' => $amount, 'method' => $method]
        );
    }

    // =========================================================================
    //  SHARED (Patient + Doctor)
    // =========================================================================

    public function notifyConsultationCancelledByAdmin(Consultation $consultation, string $reason): void
    {
        if ($consultation->doctor) {
            $this->create(
                $consultation->doctor,
                'consultation.cancelled_by_admin',
                'تم إلغاء استشارة',
                "تم إلغاء الاستشارة مع {$consultation->patient->name} من قبل الإدارة. السبب: {$reason}",
                ['consultation_id' => $consultation->id, 'patient_name' => $consultation->patient->name ?? '', 'reason' => $reason]
            );
        }

        if ($consultation->patient) {
            $this->create(
                $consultation->patient,
                'consultation.cancelled_by_admin',
                'تم إلغاء استشارتك',
                "تم إلغاء استشارتك مع د. {$consultation->doctor->name} من قبل الإدارة. السبب: {$reason}",
                ['consultation_id' => $consultation->id, 'doctor_name' => $consultation->doctor->name ?? '', 'reason' => $reason]
            );
        }
    }

    // =========================================================================
    //  ADMIN NOTIFICATIONS
    // =========================================================================

    /**
     * Notify all active admins when a new consultation is booked and paid.
     */
    public function notifyAdminsNewBooking(Consultation $consultation, User $patient, Doctor $doctor): void
    {
        Admin::where('is_active', true)->each(function (Admin $admin) use ($consultation, $patient, $doctor) {
            $this->create(
                $admin,
                'admin.new_booking',
                'حجز جديد مؤكد',
                "قامت {$patient->name} بحجز استشارة مع د. {$doctor->name}",
                [
                    'consultation_id' => $consultation->id,
                    'patient_name' => $patient->name,
                    'doctor_name' => $doctor->name,
                    'amount' => $consultation->price,
                ],
                sendEmail: false // Admin notifications are in-app only by default
            );
        });
    }

    // =========================================================================
    //  CHAT NOTIFICATIONS
    // =========================================================================

    public function notifyNewChatMessage(
        \Illuminate\Database\Eloquent\Model $recipient,
        \Illuminate\Database\Eloquent\Model $sender,
        \App\Models\Consultation $consultation,
        \App\Models\ConsultationMessage $message,
    ): void {
        $name    = $sender->name ?? 'مرسل';
        $preview = \Illuminate\Support\Str::limit($message->message ?? '📷 صورة', 50);
        $isDoc   = $recipient instanceof \App\Models\Doctor;
        $base    = $isDoc ? '/doctor' : '/patient';

        $this->create(
            $recipient, 'chat.new_message',
            "رسالة جديدة من {$name}", $preview,
            [
                'type'            => 'new_chat_message',
                'consultation_id' => $consultation->id,
                'sender_name'     => $name,
                'message_preview' => $preview,
                'redirect_url'    => "{$base}/consultations/{$consultation->id}",
            ],
            sendEmail: false
        );

        if (config('chat.notifications.new_message_push', true)) {
            try {
                $payload = WebPushService::createChatMessagePayload(
                    $name, $preview, $consultation->id, $isDoc ? 'doctor' : 'patient'
                );
                app(WebPushService::class)->sendToUser($recipient, $payload);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Chat push failed: ' . $e->getMessage());
            }
        }
    }


    // =========================================================================
    //  EMAIL — Mailable-based
    // =========================================================================

    protected function sendNotificationEmail(
        Model $notifiable,
        string $title,
        string $message,
        string $type,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
    ): void {
        try {
            Mail::to($notifiable->email, $notifiable->name ?? 'مستخدم')
                ->queue(new NotificationMail(
                    recipientName: $notifiable->name ?? 'مستخدم',
                    notificationTitle: $title,
                    notificationMessage: $message,
                    notificationType: $type,
                    actionUrl: $actionUrl,
                    actionLabel: $actionLabel,
                ));
        } catch (\Exception $e) {
            Log::warning("Failed to queue notification email for user [{$notifiable->id}]: {$e->getMessage()}");
        }
    }
}
