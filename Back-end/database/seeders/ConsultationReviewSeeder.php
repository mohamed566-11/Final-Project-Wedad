<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Consultation;
use App\Models\ConsultationReview;

class ConsultationReviewSeeder extends Seeder
{
    public function run()
    {
        $completedConsultations = Consultation::where('status', 'completed')->get();

        foreach ($completedConsultations as $consultation) {
            ConsultationReview::create([
                'consultation_id' => $consultation->id,
                'doctor_id' => $consultation->doctor_id,
                'user_id' => $consultation->user_id,
                'rating' => rand(4, 5),
                'comment' => $this->getRandomComment(),
                'is_anonymous' => rand(0, 1),
                'is_published' => true,
            ]);
        }
    }

    private function getRandomComment()
    {
        $comments = [
            'دكتور ممتاز ومتفهم، شرح كل شيء بوضوح',
            'استشارة مفيدة جدًا، أنصح الجميع بالتعامل مع هذا الطبيب',
            'محترف ومتمكن من تخصصه، شكرًا لك',
            'ممتازة في التعامل والشرح، جزاها الله خيرًا',
            'استشارة رائعة، حصلت على إجابات لكل أسئلتي',
        ];

        return $comments[array_rand($comments)];
    }
}
