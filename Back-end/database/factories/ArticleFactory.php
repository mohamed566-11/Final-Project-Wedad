<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Doctor;
use App\Models\LifeStage;
use Illuminate\Database\Eloquent\Factories\Factory;

class ArticleFactory extends Factory
{
    protected $model = Article::class;

    public function definition(): array
    {
        return [
            'title'         => $this->faker->sentence(6),
            'content'       => $this->faker->paragraphs(5, true),
            'status'        => 'approved',
            'doctor_id'     => Doctor::factory(),
            'life_stage_id' => LifeStage::factory(),
            'image'         => 'https://picsum.photos/seed/' . $this->faker->word() . '/800/400',
            'published_at'  => now()->subDays(rand(1, 60)),
            'views_count'   => $this->faker->numberBetween(10, 1000),
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => 'draft', 'published_at' => null]);
    }

    public function published(): static
    {
        return $this->state(['status' => 'approved', 'published_at' => now()]);
    }
}