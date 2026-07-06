<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\Doctor;
use App\Models\LifeStage;

class PendingArticleSeeder extends Seeder
{
    public function run()
    {
        $doctor = Doctor::first();
        $lifeStage = LifeStage::first();

        if (!$doctor || !$lifeStage) {
            $this->command->info('No doctor or life stage found.');
            return;
        }

        $title = 'الرياضة أثناء الحمل: ما هو مسموح وممنوع';
        
        // Check if exists
        if (Article::where('title', $title)->exists()) {
            $this->command->info('Pending article already exists.');
            return;
        }

        Article::create([
            'doctor_id' => $doctor->id,
            'title' => $title,
            'slug' => 'sports-during-pregnancy-pending',
            'excerpt' => 'دليلك الشامل للتمارين الآمنة خلال فترة الحمل',
            'content' => 'ممارسة الرياضة خلال الحمل مفيدة للأم والجنين. سنتعرف على التمارين الآمنة والأنشطة التي يجب تجنبها...',
            'life_stage_id' => $lifeStage->id,
            'status' => 'pending_review',
            'views_count' => 0,
            'reading_time' => 6,
            'tags' => ['رياضة', 'حمل', 'صحة'],
        ]);

        $this->command->info('Pending article created successfully.');
    }
}
