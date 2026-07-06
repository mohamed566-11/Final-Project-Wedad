<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SendAppointmentReminders;
use App\Jobs\CancelExpiredConsultations;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| Here you can define all of your scheduled tasks. These are automatically
| run by Laravel's scheduler when you add the following Cron entry to your server:
|
| * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Send appointment reminders every 5 minutes
Schedule::job(new SendAppointmentReminders())
    ->everyFiveMinutes()
    ->name('send-appointment-reminders')
    ->withoutOverlapping()
    ->onOneServer();

// Cancel expired consultations (unpaid after timeout, no-shows)
Schedule::job(new CancelExpiredConsultations())
    ->everyFifteenMinutes()
    ->name('cancel-expired-consultations')
    ->withoutOverlapping()
    ->onOneServer();

// Process pending payments - check with payment gateway
Schedule::command('payments:process-pending')
    ->everyThirtyMinutes()
    ->name('process-pending-payments')
    ->withoutOverlapping();

// Cleanup old notifications (older than 30 days)
Schedule::command('notifications:cleanup --days=30')
    ->daily()
    ->at('03:00')
    ->name('cleanup-notifications');

// Generate daily reports for admin
Schedule::command('reports:generate-daily')
    ->dailyAt('23:55')
    ->name('daily-reports')
    ->timezone('Africa/Cairo');

// Clear expired password reset tokens
Schedule::command('auth:clear-resets')
    ->daily()
    ->at('02:00');

// Clear old cache entries
Schedule::command('cache:prune-stale-tags')
    ->hourly();

// Backup database (if spatie/laravel-backup is installed)
// Schedule::command('backup:clean')->daily()->at('01:00');
// Schedule::command('backup:run')->daily()->at('01:30');

// Queue monitoring - log failed jobs instead of auto-retrying all
// Schedule::command('queue:retry all') removed — auto-retrying all failed jobs is dangerous
// Review and retry specific jobs manually via: php artisan queue:retry {id}

// Prune telescope entries (if telescope is installed)
// Schedule::command('telescope:prune --hours=48')->daily();

// Send weekly summary emails to doctors
Schedule::command('emails:send-weekly-doctor-summary')
    ->weekly()
    ->sundays()
    ->at('10:00')
    ->name('weekly-doctor-summary')
    ->timezone('Africa/Cairo');

// Send monthly analytics to admins
Schedule::command('emails:send-monthly-analytics')
    ->monthlyOn(1, '09:00')
    ->name('monthly-analytics')
    ->timezone('Africa/Cairo');

// Cleanup old chatbot messages (Data Retention: 90 days)
Schedule::job(new \App\Jobs\CleanupOldChatMessagesJob())
    ->daily()
    ->at('04:00')
    ->name('chatbot-messages-cleanup')
    ->withoutOverlapping()
    ->onOneServer()
    ->timezone('Africa/Cairo');

// Clear stale chatbot response cache weekly (keeps Redis lean)
Schedule::command('chatbot:clear-cache')
    ->weekly()
    ->sundays()
    ->at('05:00')
    ->name('chatbot-cache-weekly-clear')
    ->withoutOverlapping()
    ->onOneServer()
    ->timezone('Africa/Cairo');

// Sync Google Fit data for connected users
Schedule::job(new \App\Jobs\SyncGoogleFitData())
    ->everySixHours()
    ->name('sync-google-fit')
    ->withoutOverlapping()
    ->onOneServer();

// ─────────────────────────────────────────────────────────────────────────────
// Wakeup Hugging Face Spaces — منع وضع السبات (مهم للإنتاج)
// الـ Spaces المجانية تنام بعد 48 ساعة وتسبب بطء في أول استجابة
// ─────────────────────────────────────────────────────────────────────────────
Schedule::command('app:wakeup-hf-spaces')
    ->everyThirtyMinutes()
    ->name('wakeup-hf-spaces')
    ->withoutOverlapping()
    ->onOneServer()
    ->timezone('Africa/Cairo');
