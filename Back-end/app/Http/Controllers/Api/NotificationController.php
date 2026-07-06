<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\PushSubscription;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = $user->notifications();

        // Filter by unread only
        if ($request->boolean('unread_only')) {
            $query = $user->unreadNotifications();
        }

        $perPage = $request->input('per_page', 20);
        $notifications = $query->paginate($perPage);

        // Transform notifications to match frontend expected format
        $transformed = collect($notifications->items())->map(function ($notification) {
            $data = $notification->data;

            // Resolve short type: prefer data.type, then derive from DB type column
            $type = $data['type'] ?? $notification->type;
            // Convert full class name to short snake_case key
            if (str_contains($type, '\\')) {
                $type = Str::snake(str_replace('Notification', '', class_basename($type)));
            }
            // Normalize dots to underscores for consistency
            $type = str_replace('.', '_', $type);

            return [
                'id' => $notification->id,
                'type' => $type,
                'title' => $data['title'] ?? '',
                'body' => $data['message'] ?? $data['body'] ?? '',
                'data' => $data,
                'read_at' => $notification->read_at?->toISOString(),
                'created_at' => $notification->created_at->toISOString(),
            ];
        });

        return response()->json([
            'status' => true,
            'data' => [
                'notifications' => $transformed,
                'total' => $notifications->total(),
                'unread_count' => $user->unreadNotifications()->count(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(string $notificationId): JsonResponse
    {
        $user = Auth::user();

        $notification = $user->notifications()->find($notificationId);

        if (!$notification) {
            return response()->json([
                'status' => false,
                'message' => 'الإشعار غير موجود',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'status' => true,
            'message' => 'تم تحديد الإشعار كمقروء',
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        $user->unreadNotifications->markAsRead();

        return response()->json([
            'status' => true,
            'message' => 'تم تحديد جميع الإشعارات كمقروءة',
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(string $notificationId): JsonResponse
    {
        $user = Auth::user();

        $notification = $user->notifications()->find($notificationId);

        if (!$notification) {
            return response()->json([
                'status' => false,
                'message' => 'الإشعار غير موجود',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'status' => true,
            'message' => 'تم حذف الإشعار',
        ]);
    }

    /**
     * Get VAPID public key for push notifications
     */
    public function getVapidPublicKey(): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data' => [
                'vapid_key' => config('webpush.vapid.public_key'),
            ],
        ]);
    }

    /**
     * Subscribe to push notifications
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = Auth::user();

        // Check if subscription already exists (polymorphic)
        $existingSubscription = PushSubscription::where('subscribable_type', get_class($user))
            ->where('subscribable_id', $user->id)
            ->where('endpoint', $request->endpoint)
            ->first();

        if ($existingSubscription) {
            return response()->json([
                'status' => true,
                'message' => 'الاشتراك موجود بالفعل',
            ]);
        }

        // Create new subscription
        PushSubscription::create([
            'subscribable_type' => get_class($user),
            'subscribable_id' => $user->id,
            'endpoint' => $request->endpoint,
            'p256dh_key' => $request->input('keys.p256dh'),
            'auth_key' => $request->input('keys.auth'),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'تم تفعيل الإشعارات الفورية بنجاح',
        ]);
    }

    /**
     * Unsubscribe from push notifications
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $user = Auth::user();

        PushSubscription::where('subscribable_type', get_class($user))
            ->where('subscribable_id', $user->id)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'تم إلغاء الإشعارات الفورية',
        ]);
    }

    /**
     * Get notification settings
     */
    public function getSettings(): JsonResponse
    {
        $user = Auth::user();

        $defaults = [
            'email_notifications' => true,
            'push_notifications' => true,
            'sms_notifications' => false,
            'consultation_reminders' => true,
            'marketing_emails' => false,
            'new_booking_alerts' => true,
            'article_status_updates' => true,
            'payment_notifications' => true,
        ];

        // Merge stored settings with defaults so new keys always appear
        $settings = array_merge($defaults, $user->notification_settings ?? []);

        return response()->json(['status' => true, 'data' => $settings]);
    }

    /**
     * Update notification settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_notifications' => 'sometimes|boolean',
            'push_notifications' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
            'consultation_reminders' => 'sometimes|boolean',
            'marketing_emails' => 'sometimes|boolean',
            'new_booking_alerts' => 'sometimes|boolean',
            'article_status_updates' => 'sometimes|boolean',
            'payment_notifications' => 'sometimes|boolean',
        ]);

        if (empty($validated)) {
            return response()->json([
                'status' => false,
                'message' => 'لا توجد بيانات للتحديث',
            ], 422);
        }

        $user = Auth::user();
        $currentSettings = $user->notification_settings ?? [];
        $newSettings = array_merge($currentSettings, $validated);

        $user->update(['notification_settings' => $newSettings]);

        return response()->json([
            'status' => true,
            'message' => 'تم حفظ الإعدادات بنجاح',
            'data' => $newSettings,
        ]);
    }

    /**
     * Get unread count
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        return response()->json([
            'status' => true,
            'data' => [
                'unread_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }
}
