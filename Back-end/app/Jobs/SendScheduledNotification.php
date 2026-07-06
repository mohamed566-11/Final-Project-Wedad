<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Doctor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendScheduledNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        protected int $notificationHistoryId
    ) {}

    public function handle(): void
    {
        $record = DB::table('notification_history')->find($this->notificationHistoryId);

        if (!$record || $record->status !== 'scheduled') {
            return; // Already sent or cancelled
        }

        // Send the notification
        $this->sendToTarget($record->target, [
            'title' => $record->title,
            'message' => $record->message,
            'type' => $record->type,
        ]);

        // Update status to sent
        DB::table('notification_history')
            ->where('id', $this->notificationHistoryId)
            ->update([
                'status' => 'sent',
                'sent_at' => now(),
                'updated_at' => now(),
            ]);
    }

    private function sendToTarget(string $target, array $data): void
    {
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

        if (in_array($target, ['all', 'patients'])) {
            User::where('is_active', true)->chunk(100, function ($users) use ($notificationData) {
                foreach ($users as $user) {
                    DB::table('notifications')->insert(array_merge($notificationData, [
                        'id' => Str::uuid(),
                        'notifiable_type' => User::class,
                        'notifiable_id' => $user->id,
                    ]));
                }
            });
        }

        if (in_array($target, ['all', 'doctors'])) {
            Doctor::where('is_active', true)->chunk(100, function ($doctors) use ($notificationData) {
                foreach ($doctors as $doctor) {
                    DB::table('notifications')->insert(array_merge($notificationData, [
                        'id' => Str::uuid(),
                        'notifiable_type' => Doctor::class,
                        'notifiable_id' => $doctor->id,
                    ]));
                }
            });
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SendScheduledNotification failed for ID ' . $this->notificationHistoryId . ': ' . $exception->getMessage());
    }
}
