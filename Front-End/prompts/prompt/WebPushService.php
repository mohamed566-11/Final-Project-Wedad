<?php
// ============================================================
// ملف: app/Services/WebPushService.php
// الموقع: widad-backend/app/Services/WebPushService.php
// الوصف: خدمة إرسال Push Notifications بـ VAPID
// ============================================================

namespace App\Services;

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    protected WebPush $webPush;

    public function __construct()
    {
        // إعداد WebPush بالـ VAPID Keys من الـ config
        $this->webPush = new WebPush([
            'vapid' => [
                'subject' => config('webpush.subject'),
                'publicKey' => config('webpush.public_key'),
                'privateKey' => config('webpush.private_key'),
            ],
        ]);
    }

    /**
     * إرسال إشعار لمستخدم واحد
     */
    public function sendToUser(int $userId, string $title, string $body, array $options = []): bool
    {
        // البحث عن كل اشتراكات المستخدم
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            Log::info("لا وجود لاشتراكات Push للمستخدم: {$userId}");
            return false;
        }

        foreach ($subscriptions as $sub) {
            $this->send($sub, $title, $body, $options);
        }

        return true;
    }

    /**
     * إرسال إشعار لعدة مستخدمين في نفس الوقت
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $options = []): void
    {
        foreach ($userIds as $userId) {
            $this->sendToUser($userId, $title, $body, $options);
        }
    }

    /**
     * إرسال الإشعار الفعلي
     */
    private function send(PushSubscription $subscription, string $title, string $body, array $options = []): void
    {
        try {
            // إنشاء الـ Subscription object من البيانات المخزنة
            $sub = Subscription::fromArray([
                'endpoint' => $subscription->endpoint,
                'keys' => [
                    'p256dh' => $subscription->p256dh,
                    'auth'   => $subscription->auth,
                ],
            ]);

            // تحضير بيانات الإشعار
            $payload = json_encode([
                'title'   => $title,
                'body'    => $body,
                'icon'    => $options['icon'] ?? '/icons/icon-192x192.png',
                'badge'   => $options['badge'] ?? '/icons/badge-72x72.png',
                'url'     => $options['url'] ?? '/',
                'tag'     => $options['tag'] ?? null,  // لمنع التكرار
                'data'    => $options['data'] ?? [],
            ]);

            // إرسال الإشعار
            $this->webPush->queueNotification($sub, $payload);
            $this->webPush->flush();

            Log::info("تم إرسال إشعار Push للمستخدم: {$subscription->user_id}");

        } catch (\Exception $e) {
            Log::error("خطأ في إرسال Push Notification: " . $e->getMessage(), [
                'user_id'      => $subscription->user_id,
                'subscription' => $subscription->id,
            ]);

            // إذا كان الاشتراك منتهي صلاحيته، حذفه
            if (str_contains($e->getMessage(), '410') || str_contains($e->getMessage(), 'Gone')) {
                $subscription->delete();
                Log::info("تم حذف اشتراك منتهي الصلاحية: {$subscription->id}");
            }
        }
    }
}
