<?php

namespace App\Services;

use App\Models\User;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class WebPushService
{
    protected WebPush $webPush;

    public function __construct()
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ]);

        // Extended timeout
        $this->webPush->setDefaultOptions([
            'TTL' => 3600,
            'urgency' => 'high',
            'topic' => 'widad-health',
        ]);
    }

    /**
     * Send push notification to a user (Patient or Doctor)
     * Accepts any Eloquent Model that has a pushSubscriptions relation
     */
    public function sendToUser(\Illuminate\Database\Eloquent\Model $user, array $payload): array
    {
        $subscriptions = $user->pushSubscriptions ?? collect();
        $results = [];

        if ($subscriptions->isEmpty()) {
            Log::info("No push subscriptions for user #{$user->id}");
            return ['success' => false, 'message' => 'No subscriptions'];
        }

        foreach ($subscriptions as $pushSubscription) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $pushSubscription->endpoint,
                    'publicKey' => $pushSubscription->p256dh_key,
                    'authToken' => $pushSubscription->auth_key,
                ]);

                $this->webPush->queueNotification(
                    $subscription,
                    json_encode($payload)
                );

                $results[] = [
                    'subscription_id' => $pushSubscription->id, 
                    'queued' => true
                ];
            } catch (\Exception $e) {
                Log::error("Error queueing push notification: " . $e->getMessage());
                $results[] = [
                    'subscription_id' => $pushSubscription->id,
                    'queued' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        // Flush all queued notifications
        foreach ($this->webPush->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();
            
            if ($report->isSuccess()) {
                Log::info("Push notification sent to: {$endpoint}");
            } else {
                Log::warning("Push notification failed for: {$endpoint}. Reason: " . $report->getReason());
                
                // Remove expired subscriptions
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $endpoint)->delete();
                    Log::info("Removed expired subscription: {$endpoint}");
                }
            }
        }

        return ['success' => true, 'results' => $results];
    }

    /**
     * Send push notification to multiple users
     */
    public function sendToUsers(array $userIds, array $payload): array
    {
        $users = User::whereIn('id', $userIds)->get();
        $results = [];

        foreach ($users as $user) {
            $results[$user->id] = $this->sendToUser($user, $payload);
        }

        return $results;
    }

    /**
     * Send test notification to a user
     */
    public function sendTest(User $user): array
    {
        $payload = [
            'title' => 'إشعار تجريبي',
            'body' => 'تم تفعيل الإشعارات الفورية بنجاح! 🎉',
            'icon' => '/icons/icon-192x192.png',
            'badge' => '/icons/badge-72x72.png',
            'data' => [
                'type' => 'test',
                'url' => '/',
            ],
        ];

        return $this->sendToUser($user, $payload);
    }

    /**
     * Create consultation reminder payload
     */
    public static function createReminderPayload(
        string $title,
        string $body,
        int $consultationId,
        string $reminderType
    ): array {
        return [
            'title' => $title,
            'body' => $body,
            'icon' => '/icons/icon-192x192.png',
            'badge' => '/icons/badge-72x72.png',
            'tag' => "consultation-{$consultationId}",
            'data' => [
                'type' => 'consultation_reminder',
                'consultation_id' => $consultationId,
                'reminder_type' => $reminderType,
                'url' => "/patient/consultations/{$consultationId}",
                'video_url' => "/patient/consultations/{$consultationId}/video",
                'requireInteraction' => $reminderType === '15_minutes',
            ],
        ];
    }

    /**
     * Create new consultation notification payload
     */
    public static function createNewConsultationPayload(
        int $consultationId,
        string $date,
        string $time
    ): array {
        return [
            'title' => 'طلب استشارة جديد!',
            'body' => "لديك طلب استشارة جديد يوم {$date} الساعة {$time}",
            'icon' => '/icons/icon-192x192.png',
            'badge' => '/icons/badge-72x72.png',
            'tag' => "new-consultation-{$consultationId}",
            'vibrate' => [100, 50, 100],
            'data' => [
                'type' => 'new_consultation',
                'consultation_id' => $consultationId,
                'url' => '/doctor/consultations',
                'requireInteraction' => true,
            ],
        ];
    }

    /**
     * Create chat message push notification payload
     */
    public static function createChatMessagePayload(
        string $senderName, string $preview, int $consultationId, string $recipientType = 'patient'
    ): array {
        $base = $recipientType === 'doctor' ? '/doctor' : '/patient';
        return [
            'title'   => "رسالة جديدة من {$senderName}",
            'body'    => $preview,
            'icon'    => '/icons/icon-192x192.png',
            'badge'   => '/icons/badge-72x72.png',
            'tag'     => "chat-{$consultationId}",
            'vibrate' => [100, 50, 100],
            'data'    => [
                'type'            => 'new_chat_message',
                'consultation_id' => $consultationId,
                'url'             => "{$base}/consultations/{$consultationId}",
            ],
        ];
    }
}

