<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use App\Traits\ApiResponse;
use App\Jobs\SendBulkNotificationJob;
use App\Jobs\SendScheduledNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationAdminController extends Controller
{
    use ApiResponse;

    /**
     * Send notification to users
     * POST /api/v1/admin/notifications/send
     */
    public function send(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'required|in:announcement,update,maintenance,promotional',
            'target' => 'required|in:all,patients,doctors',
            'scheduled_at' => 'nullable|date|after:now',
        ], [
            'title.required' => 'العنوان مطلوب',
            'message.required' => 'الرسالة مطلوبة',
            'type.required' => 'نوع الإشعار مطلوب',
            'target.required' => 'الهدف مطلوب',
            'scheduled_at.after' => 'وقت الجدولة يجب أن يكون في المستقبل',
        ]);

        // Get recipients based on target
        $recipientsCount = 0;
        $channels = ['database']; // Default channel

        switch ($request->target) {
            case 'all':
                $patientCount = User::where('is_active', true)->count();
                $doctorCount = Doctor::where('is_active', true)->count();
                $recipientsCount = $patientCount + $doctorCount;
                break;
            case 'patients':
                $recipientsCount = User::where('is_active', true)->count();
                break;
            case 'doctors':
                $recipientsCount = Doctor::where('is_active', true)->count();
                break;
        }

        // If scheduled, queue the notification
        if ($request->filled('scheduled_at')) {
            // Record as scheduled in notification_history
            $scheduledId = DB::table('notification_history')->insertGetId([
                'admin_id' => $request->user()->id,
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->type,
                'target' => $request->target,
                'recipients_count' => $recipientsCount,
                'scheduled_at' => Carbon::parse($request->scheduled_at),
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Dispatch job to send at scheduled time
            SendScheduledNotification::dispatch($scheduledId)
                ->delay(Carbon::parse($request->scheduled_at));

            return $this->successResponse([
                'scheduled' => true,
                'scheduled_at' => $request->scheduled_at,
                'recipients_count' => $recipientsCount,
                'channels' => $channels,
            ], 'تم جدولة الإشعار بنجاح');
        }

        // Dispatch via Queue Job (non-blocking)
        $historyId = DB::table('notification_history')->insertGetId([
            'admin_id' => $request->user()->id,
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type,
            'target' => $request->target,
            'recipients_count' => $recipientsCount,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        SendBulkNotificationJob::dispatch(
            $request->target,
            ['title' => $request->title, 'message' => $request->message, 'type' => $request->type],
            $historyId
        );

        return $this->successResponse([
            'sent' => true,
            'queued' => true,
            'recipients_count' => $recipientsCount,
        ], 'تم إرسال الإشعار وجاري المعالجة في الخلفية');
    }

    /**
     * Get notification history
     * GET /api/v1/admin/notifications/history
     */
    public function history(Request $request)
    {
        $history = DB::table('notification_history')
            ->join('admins', 'notification_history.admin_id', '=', 'admins.id')
            ->select(
                'notification_history.*',
                'admins.name as admin_name'
            )
            ->orderByDesc('notification_history.created_at')
            ->paginate(20);

        $transformedHistory = collect($history->items())->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'message' => $item->message,
                'type' => $item->type,
                'type_ar' => $this->getTypeDisplayName($item->type),
                'target' => $item->target,
                'target_ar' => $this->getTargetDisplayName($item->target),
                'recipients_count' => $item->recipients_count,
                'admin' => [
                    'id' => $item->admin_id,
                    'name' => $item->admin_name,
                ],
                'sent_at' => $item->sent_at,
            ];
        });

        return $this->successResponse([
            'history' => $transformedHistory,
            'pagination' => [
                'total' => $history->total(),
                'per_page' => $history->perPage(),
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
            ],
        ]);
    }

    /**
     * Get scheduled notifications
     * GET /api/v1/admin/notifications/scheduled
     */
    public function scheduled()
    {
        $scheduled = DB::table('notification_history')
            ->join('admins', 'notification_history.admin_id', '=', 'admins.id')
            ->select(
                'notification_history.*',
                'admins.name as admin_name'
            )
            ->where('notification_history.status', 'scheduled')
            ->where('notification_history.scheduled_at', '>', now())
            ->orderBy('notification_history.scheduled_at')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'message' => $item->message,
                    'type' => $item->type,
                    'type_ar' => $this->getTypeDisplayName($item->type),
                    'target' => $item->target,
                    'target_ar' => $this->getTargetDisplayName($item->target),
                    'recipients_count' => $item->recipients_count,
                    'scheduled_at' => $item->scheduled_at,
                    'admin' => [
                        'id' => $item->admin_id,
                        'name' => $item->admin_name,
                    ],
                ];
            });

        return $this->successResponse([
            'scheduled' => $scheduled,
        ]);
    }

    /**
     * Cancel a scheduled notification
     * DELETE /api/v1/admin/notifications/scheduled/{id}
     */
    public function cancelScheduled($id)
    {
        $notification = DB::table('notification_history')->find($id);

        if (!$notification) {
            return $this->errorResponse('الإشعار غير موجود', 404);
        }

        if ($notification->status !== 'scheduled') {
            return $this->errorResponse('لا يمكن إلغاء هذا الإشعار', 400);
        }

        DB::table('notification_history')
            ->where('id', $id)
            ->update([
                'status' => 'cancelled',
                'updated_at' => now(),
            ]);

        return $this->successResponse(null, 'تم إلغاء الإشعار المجدول');
    }

    /**
     * Send notification to specific target
     */
    private function sendNotificationToTarget(string $target, array $data): void
    {
        // Create notification for database
        $notificationData = [
            'type' => 'admin_' . $data['type'],
            'data' => json_encode([
                'title' => $data['title'],
                'message' => $data['message'],
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        switch ($target) {
            case 'all':
                // Send to patients
                User::where('is_active', true)->chunk(100, function ($users) use ($notificationData) {
                    foreach ($users as $user) {
                        DB::table('notifications')->insert(array_merge($notificationData, [
                            'id' => \Illuminate\Support\Str::uuid(),
                            'notifiable_type' => User::class,
                            'notifiable_id' => $user->id,
                        ]));
                    }
                });

                // Send to doctors
                Doctor::where('is_active', true)->chunk(100, function ($doctors) use ($notificationData) {
                    foreach ($doctors as $doctor) {
                        DB::table('notifications')->insert(array_merge($notificationData, [
                            'id' => \Illuminate\Support\Str::uuid(),
                            'notifiable_type' => Doctor::class,
                            'notifiable_id' => $doctor->id,
                        ]));
                    }
                });
                break;

            case 'patients':
                User::where('is_active', true)->chunk(100, function ($users) use ($notificationData) {
                    foreach ($users as $user) {
                        DB::table('notifications')->insert(array_merge($notificationData, [
                            'id' => \Illuminate\Support\Str::uuid(),
                            'notifiable_type' => User::class,
                            'notifiable_id' => $user->id,
                        ]));
                    }
                });
                break;

            case 'doctors':
                Doctor::where('is_active', true)->chunk(100, function ($doctors) use ($notificationData) {
                    foreach ($doctors as $doctor) {
                        DB::table('notifications')->insert(array_merge($notificationData, [
                            'id' => \Illuminate\Support\Str::uuid(),
                            'notifiable_type' => Doctor::class,
                            'notifiable_id' => $doctor->id,
                        ]));
                    }
                });
                break;
        }
    }

    /**
     * Get type display name
     */
    private function getTypeDisplayName(string $type): string
    {
        $names = [
            'announcement' => 'إعلان',
            'update' => 'تحديث',
            'maintenance' => 'صيانة',
            'promotional' => 'ترويجي',
        ];

        return $names[$type] ?? $type;
    }

    /**
     * Get target display name
     */
    private function getTargetDisplayName(string $target): string
    {
        $names = [
            'all' => 'الجميع',
            'patients' => 'المرضى',
            'doctors' => 'الأطباء',
        ];

        return $names[$target] ?? $target;
    }
}
