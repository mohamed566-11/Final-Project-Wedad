<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class ClearChatbotCacheCommand extends Command
{
    protected $signature = 'chatbot:clear-cache {bot_type? : The bot type (public, pre_marriage, pregnancy, motherhood) or all}';

    protected $description = 'Clear chatbot response cache for a specific bot or all bots';

    public function handle(): void
    {
        $botType = $this->argument('bot_type') ?? '*';

        $store = config('cache.default');
        if ($store === 'redis') {
            $prefix  = config('cache.prefix', '') . ':';
            $pattern = "chatbot:{$botType}:*";
            $keys    = Redis::keys($prefix . $pattern);

            if (!empty($keys)) {
                Redis::del($keys);
                $this->info("Cleared " . count($keys) . " cached responses for bot: {$botType}");
            } else {
                $this->info("No cached responses found for bot: {$botType}");
            }
        } else {
            // For non-Redis cache stores, we can only flush all
            Cache::flush();
            $this->warn("Non-Redis cache store: flushed all cache.");
        }
    }
}
