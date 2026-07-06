<?php

namespace App\Console\Commands;

use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CleanupOldNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:cleanup {--days=30 : Number of days to keep notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete old notifications older than specified days';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("Cleaning up notifications older than {$days} days...");

        // Delete read notifications older than cutoff
        $deletedRead = Notification::whereNotNull('read_at')
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        $this->info("Deleted {$deletedRead} read notifications.");

        // Delete unread notifications older than double the cutoff (keep unread longer)
        $unreadCutoff = Carbon::now()->subDays($days * 2);
        $deletedUnread = Notification::whereNull('read_at')
            ->where('created_at', '<', $unreadCutoff)
            ->delete();

        $this->info("Deleted {$deletedUnread} unread notifications.");

        $totalDeleted = $deletedRead + $deletedUnread;
        $this->info("Total notifications deleted: {$totalDeleted}");

        return Command::SUCCESS;
    }
}
