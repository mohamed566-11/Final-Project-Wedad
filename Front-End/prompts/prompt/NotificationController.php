<?php
// ============================================================
// ملف: app/Http/Controllers/Api/NotificationController.php
// الموقع: widad-backend/app/Http/Controllers/Api/
// الوصف: Controller إدارة الإشعارات والـ Push Subscriptions
// ============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * إعطاء المفتاح العام VAPID للـ Frontend
     * GET /patient/notifications/vapid-key
     */
    public function getVapidKey(): JsonResponse
    {
        return response()->json([
            'public_key' => config('webpush.public_key'),
        ]);
    }

    /**
     * اشتراك المستخدم في الإشعارات الفورية
     * POST /patient/notifications/subscribe
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string',
            'p256dh'   => 'required|string',
            'auth'     => 'required|string',
        ]);

        $user = Auth::user();

        // البحث عن اشتراك موجود بنفس الـ endpoint
        $subscription = PushSubscription::where('endpoint', $request->endpoint)
                                        ->where('user_id', $user->id)
                                        ->first();

        if ($subscription) {
            // تحديث الاشتراك الموجود
            $subscription->update([
                'p256dh' => $request->p256dh,
                'auth'   => $request->auth,
            ]);
        } else {
            // إنشاء اشتراك جديد
            PushSubscription::create([
                'user_id'     => $user->id,
                'endpoint'    => $request->endpoint,
                'p256dh'      => $request->p256dh,
                'auth'        => $request->auth,
                'device_type' => $this->detectDeviceType($request),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم الاشتراك في الإشعارات بنجاح',
        ]);
    }

    /**
     * إلغاء الاشتراك في الإشعارات
     * POST /patient/notifications/unsubscribe
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $user = Auth::user();

        PushSubscription::where('endpoint', $request->endpoint)
                        ->where('user_id', $user->id)
                        ->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الاشتراك بنجاح',
        ]);
    }

    /**
     * تحديد نوع الجهاز تلقائياً
     */
    private function detectDeviceType(Request $request): string
    {
        $userAgent = $request->header('User-Agent', '');

        if (preg_match('/Mobile|Android|iPhone|iPad/i', $userAgent)) {
            return 'mobile';
        }

        return 'desktop';
    }
}
