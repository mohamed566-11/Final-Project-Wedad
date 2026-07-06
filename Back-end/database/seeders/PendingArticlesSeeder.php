<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\Doctor;
use App\Models\LifeStage;

class PendingArticlesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if we have doctors and life stages
        $doctors = Doctor::where('verification_status', 'verified')->get();
        if ($doctors->isEmpty()) {
            $this->command->error("No verified doctors found. Please run DatabaseSeeder first.");
            return;
        }

        $lifeStages = LifeStage::all();
        if ($lifeStages->isEmpty()) {
            $this->command->error("No life stages found. Please run DatabaseSeeder first.");
            return;
        }

        $this->command->info("Creating pending articles...");

        foreach ($doctors as $doctor) {
            // Create 3-5 pending articles for each doctor
            $count = rand(3, 5);
            for ($i = 0; $i < $count; $i++) {
                Article::create([
                    'title' => 'مقال تجريبي قيد المراجعة: ' . fake()->sentence(3),
                    'slug' => fake()->slug(),
                    'excerpt' => fake()->paragraph(),
                    'content' => fake()->paragraphs(5, true),
                    'image' => null, // Or define a placeholder if needed
                    'status' => 'pending_review',
                    'life_stage_id' => $lifeStages->random()->id,
                    'doctor_id' => $doctor->id,
                    'views_count' => 0,
                    'reading_time' => rand(3, 10),
                    'tags' => ['صحة', 'نصائح', 'وقاية'], // JSON casted automatically if model attribute casts it
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }

        $this->command->info("Pending articles seeded successfully!");
    }
}
