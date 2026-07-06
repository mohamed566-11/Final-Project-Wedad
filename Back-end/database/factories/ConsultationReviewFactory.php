<?php

namespace Database\Factories;

use App\Models\ConsultationReview;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationReviewFactory extends Factory
{
    protected $model = ConsultationReview::class;

    public function definition(): array
    {
        return [
            'consultation_id' => Consultation::factory()->completed(),
            'doctor_id'       => Doctor::factory(),
            'user_id'         => User::factory(),
            'rating'          => $this->faker->numberBetween(3, 5),
            'comment'         => $this->faker->randomElement([
                'تجربة ممتازة مع الطبيبة، كانت محترفة ومتفهمة.',
                'الاستشارة كانت مفيدة جداً وأجابت على كل أسئلتي.',
                'سريعة في الرد ومعلوماتها دقيقة، أنصح بالتواصل معها.',
                'شرح ممتاز ومتابعة جيدة بعد الاستشارة.',
            ]),
            'is_anonymous' => false,
        ];
    }

    public function excellent(): static
    {
        return $this->state([
            'rating'  => 5,
            'comment' => 'تجربة ممتازة بكل المقاييس، الطبيبة محترفة ومتفهمة جداً!',
        ]);
    }

    public function average(): static
    {
        return $this->state([
            'rating'  => 3,
            'comment' => 'الاستشارة كانت مقبولة، لكن كانت هناك بعض الأسئلة لم تُجاب.',
        ]);
    }
}
