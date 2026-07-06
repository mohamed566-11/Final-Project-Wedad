<?php

namespace App\Jobs;

use App\Models\AiChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job يحذف رسائل الشات بوت القديمة تلقائياً
 * يُجدَّل يومياً لتطبيق سياسة Retention (90 يوم للمستخدمات المسجلات)
 *
 * الجدولة في routes/console.php:
 *   Schedule::job(new CleanupOldChatMessagesJob)->daily();
 */
class CleanupOldChatMessagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** عدد الأيام قبل حذف الرسائل */
    private int $retentionDays;

    public function __construct(int $retentionDays = 90)
    {
        $this->retentionDays = $retentionDays;
    }

    public function handle(): void
    {
        $cutoffDate = now()->subDays($this->retentionDays);

        $deleted = AiChatMessage::where('created_at', '<', $cutoffDate)->delete();

        Log::info('chatbot_cleanup_completed', [
            'deleted_count'  => $deleted,
            'retention_days' => $this->retentionDays,
            'cutoff_date'    => $cutoffDate->toDateString(),
            'ran_at'         => now()->toISOString(),
        ]);
    }
}
