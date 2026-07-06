<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class OptimizeForProduction extends Command
{
    protected $signature = 'app:optimize';
    protected $description = 'Optimize the application for production';

    public function handle()
    {
        $this->info('🚀 Starting optimization...');
        
        // Clear all caches first
        $this->info('Clearing existing caches...');
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        
        // Rebuild caches
        $this->info('Building optimized caches...');
        
        // Configuration cache
        $this->info('  → Caching configuration...');
        Artisan::call('config:cache');
        
        // Route cache
        $this->info('  → Caching routes...');
        Artisan::call('route:cache');
        
        // View cache
        $this->info('  → Caching views...');
        Artisan::call('view:cache');
        
        // Optimize autoloader
        $this->info('  → Optimizing class autoloader...');
        exec('composer dump-autoload --optimize --no-dev 2>&1', $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info('  ✓ Autoloader optimized');
        } else {
            $this->warn('  ⚠ Could not optimize autoloader');
        }
        
        $this->newLine();
        $this->info('✅ Application optimized for production!');
        
        $this->table(
            ['Optimization', 'Status'],
            [
                ['Config Cache', '✓'],
                ['Route Cache', '✓'],
                ['View Cache', '✓'],
                ['Autoloader', $returnCode === 0 ? '✓' : '⚠'],
            ]
        );
        
        return Command::SUCCESS;
    }
}
