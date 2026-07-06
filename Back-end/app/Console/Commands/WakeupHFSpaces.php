<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * WakeupHFSpaces Command
 *
 * PURPOSE: منع Hugging Face Spaces المجانية من الدخول في وضع السبات (Sleep Mode)
 * USAGE  : php artisan app:wakeup-hf-spaces
 * SCHEDULE: كل 30 دقيقة في routes/console.php
 *
 * الـ Spaces المجانية تنام بعد 48 ساعة عدم استخدام وتسبب بطء في أول استجابة.
 * هذا الأمر يُرسل HTTP ping بسيط لكل Space لإبقائها مستيقظة.
 */
class WakeupHFSpaces extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:wakeup-hf-spaces';

    /**
     * The console command description.
     */
    protected $description = 'Ping Hugging Face Spaces to prevent sleep mode — runs every 30 minutes';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $spaces = [
            'Public Health Chatbot' => config('chatbot.public_url'),
            'Pre-Marriage Chatbot' => config('chatbot.premarriage_url'),
            'Pregnancy Chatbot' => config('chatbot.pregnancy_url'),
            'Postpartum Chatbot' => config('chatbot.motherhood_url'),
        ];

        $this->info('🚀 Pinging Hugging Face Spaces...');
        $this->newLine();

        $allSuccess = true;

        foreach ($spaces as $name => $url) {
            if (empty($url)) {
                $this->warn("  ⚠️  {$name}: URL not configured — skipping");
                continue;
            }

            try {
                $response = Http::timeout(15)
                    ->withOptions(['allow_redirects' => true])
                    ->get($url);

                $status = $response->status();

                if ($response->successful() || in_array($status, [200, 302, 303])) {
                    $this->line("  ✅ {$name}: HTTP {$status} — OK");
                    Log::info('hf_space_wakeup_success', [
                        'space' => $name,
                        'url' => $url,
                        'status' => $status,
                    ]);
                } else {
                    $this->warn("  ⚠️  {$name}: HTTP {$status} — Unexpected response");
                    $allSuccess = false;
                    Log::warning('hf_space_wakeup_unexpected', [
                        'space' => $name,
                        'url' => $url,
                        'status' => $status,
                    ]);
                }
            } catch (\Exception $e) {
                $this->error("  ❌ {$name}: {$e->getMessage()}");
                $allSuccess = false;
                Log::error('hf_space_wakeup_failed', [
                    'space' => $name,
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->newLine();

        if ($allSuccess) {
            $this->info('✅ All HF Spaces pinged successfully at ' . now()->format('Y-m-d H:i:s'));
        } else {
            $this->warn('⚠️  Some HF Spaces failed to respond — check logs');
        }

        return $allSuccess ? Command::SUCCESS : Command::FAILURE;
    }
}
