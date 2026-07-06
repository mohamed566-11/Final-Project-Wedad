<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\File;

class GenerateDefaultImages extends Command
{
    protected $signature = 'storage:generate-defaults';
    protected $description = 'Generate default placeholder images for profiles and articles';

    public function handle()
    {
        $this->info('🚀 جاري إنشاء الصور الافتراضية...');

        $imagesToGenerate = [
            [
                'path' => public_path('profiles/default-avatar.png'),
                'url' => 'https://ui-avatars.com/api/?name=User&background=9C27B0&color=fff&size=256&font-size=0.33',
                'name' => 'المريض الافتراضي (default-avatar.png)'
            ],
            [
                'path' => public_path('profiles/default-doctor.png'),
                'url' => 'https://ui-avatars.com/api/?name=Doctor&background=E91E8C&color=fff&size=256&font-size=0.33',
                'name' => 'الطبيب الافتراضي (default-doctor.png)'
            ],
            [
                'path' => public_path('profiles/default-admin.png'),
                'url' => 'https://ui-avatars.com/api/?name=Admin&background=3F51B5&color=fff&size=256&font-size=0.33',
                'name' => 'الأدمن الافتراضي (default-admin.png)'
            ],
            [
                'path' => public_path('articles/default-article.png'),
                'url' => 'https://placehold.co/800x400/FF9800/FFFFFF/png?text=Widad+Tech+Article',
                'name' => 'المقال الافتراضي (default-article.png)'
            ]
        ];

        // Ensure directories exist
        File::ensureDirectoryExists(public_path('profiles'));
        File::ensureDirectoryExists(public_path('articles'));

        foreach ($imagesToGenerate as $img) {
            if (File::exists($img['path'])) {
                $this->warn("⚠️  الصورة موجودة مسبقاً: {$img['name']}");
                continue;
            }

            try {
                $content = Http::timeout(10)->get($img['url'])->body();
                File::put($img['path'], $content);
                $this->info("✅ تم إنشاء: {$img['name']}");
            } catch (\Exception $e) {
                $this->error("❌ فشل تحميل: {$img['name']} - " . $e->getMessage());
            }
        }

        $this->info('🎉 تم الانتهاء!');
    }
}
