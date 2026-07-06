<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ClearAppCache extends Command
{
    protected $signature = 'app:cache-clear {--stats : Clear only dashboard/stats cache}';
    protected $description = 'Clear application-specific caches';

    public function handle()
    {
        if ($this->option('stats')) {
            // Clear only stats cache
            Cache::forget('admin.dashboard.stats');
            Cache::forget('admin.financial.overview');
            $this->info('✓ Stats cache cleared');
            return Command::SUCCESS;
        }

        // Clear all app caches
        $cacheKeys = [
            'admin.dashboard.stats',
            'admin.financial.overview',
            'site.settings',
            'life.stages',
            'faqs.all',
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }

        $this->info('✓ Application cache cleared');
        return Command::SUCCESS;
    }
}
