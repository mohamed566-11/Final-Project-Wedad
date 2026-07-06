<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Testimonial;
use Illuminate\Support\Facades\DB;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $testimonials = [
                [
                    'patient_name' => 'سارة أحمد',
                    'comment'      => 'منصة وداد غيّرت طريقة متابعة صحتي أثناء الحمل تماماً. الذكاء الاصطناعي ساعدني في الكشف المبكر عن خطر سكر الحمل.',
                    'rating'       => 5,
                    'life_stage'   => 'pregnancy',
                    'is_active'    => true,
                ],
                [
                    'patient_name' => 'فاطمة علي',
                    'comment'      => 'الأطباء على وداد محترفون جداً والردود سريعة. أنصح كل حامل باستخدام هذه المنصة الرائعة.',
                    'rating'       => 5,
                    'life_stage'   => 'pregnancy',
                    'is_active'    => true,
                ],
                [
                    'patient_name' => 'نور الهدى',
                    'comment'      => 'بعد الولادة وجدت الدعم الكامل على منصة وداد. شكراً لهذه التجربة الجميلة.',
                    'rating'       => 4,
                    'life_stage'   => 'motherhood',
                    'is_active'    => true,
                ],
                [
                    'patient_name' => 'أميرة خالد',
                    'comment'      => 'استشرت على وداد قبل زواجي وكانت التجربة ممتازة. أجوبة واضحة ومريحة من متخصصات.',
                    'rating'       => 5,
                    'life_stage'   => 'pre-marriage',
                    'is_active'    => true,
                ],
            ];

            foreach ($testimonials as $testimonial) {
                Testimonial::updateOrCreate(
                    [
                        'patient_name' => $testimonial['patient_name'],
                        'life_stage'   => $testimonial['life_stage'],
                    ],
                    $testimonial
                );
            }

            $this->command->info('✅ TestimonialSeeder: Done.');
        });
    }
}
