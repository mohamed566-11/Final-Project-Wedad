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

/**
 * Dispatched by NotificationAdminController for immediate bulk sends.
 * Uses chunk(100) to avoid memory spikes.
 * Retries 3 times on failure.
 */
class SendBulkNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300; // 5 minutes

    public function __construct(
        protected string $target,   // 'all' | 'patients' | 'doctors'
        protected array $data,     // ['title', 'message', 'type']
        protected ?int $historyId = null
    ) {
    }

    public function handle(): void
    {
        $notificationData = [
            'type' => 'admin_' . $this->data['type'],
            'data' => json_encode([
                'title' => $this->data['title'],
                'message' => $this->data['message'],
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (in_array($this->target, ['all', 'patients'])) {
            User::where('is_active', true)->chunk(100, function ($users) use ($notificationData) {
                $rows = $users->map(fn($u) => array_merge($notificationData, [
                    'id' => (string) Str::uuid(),
                    'notifiable_type' => User::class,
                    'notifiable_id' => $u->id,
                ]))->toArray();
                DB::table('notifications')->insert($rows);
            });
        }

        if (in_array($this->target, ['all', 'doctors'])) {
            Doctor::where('is_active', true)->chunk(100, function ($doctors) use ($notificationData) {
                $rows = $doctors->map(fn($d) => array_merge($notificationData, [
                    'id' => (string) Str::uuid(),
                    'notifiable_type' => Doctor::class,
                    'notifiable_id' => $d->id,
                ]))->toArray();
                DB::table('notifications')->insert($rows);
            });
        }

        // Mark history record as sent
        if ($this->historyId) {
            DB::table('notification_history')
                ->where('id', $this->historyId)
                ->update(['status' => 'sent', 'sent_at' => now(), 'updated_at' => now()]);
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendBulkNotificationJob failed for history #{$this->historyId}: " . $e->getMessage());

        if ($this->historyId) {
            DB::table('notification_history')
                ->where('id', $this->historyId)
                ->update(['status' => 'failed', 'updated_at' => now()]);
        }
    }
}
