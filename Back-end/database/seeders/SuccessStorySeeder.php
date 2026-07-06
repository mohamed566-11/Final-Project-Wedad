<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SuccessStory;
use Illuminate\Support\Facades\DB;

class SuccessStorySeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $stories = [
                [
                    'patient_name' => 'سارة م.',
                    'story'        => 'كانت تجربتي مع منصة وداد رائعة جداً. تمكنت من متابعة صحتي ومعرفة مخاطر سكر الحمل مبكراً، مما ساعدني على اتخاذ قرارات صحية أفضل. الأطباء كانوا متاحين دائماً للإجابة على أسئلتي!',
                    'short_story'  => 'رحلتي مع وداد خلال فترة الحمل غيّرت حياتي.',
                    'life_stage'   => 'pregnancy',
                    'rating'       => 5,
                    'is_featured'  => true,
                    'is_active'    => true,
                    'order'        => 1,
                ],
                [
                    'patient_name' => 'نور ح.',
                    'story'        => 'بعد الولادة، استمررت في استخدام تطبيق وداد لمتابعة صحتي وصحة طفلي. الأطباء المتخصصون أجابوا على كل استفساراتي وأنا في المنزل دون الحاجة للخروج.',
                    'short_story'  => 'متابعة ما بعد الولادة أصبحت أسهل مع وداد.',
                    'life_stage'   => 'motherhood',
                    'rating'       => 5,
                    'is_featured'  => true,
                    'is_active'    => true,
                    'order'        => 2,
                ],
                [
                    'patient_name' => 'أميرة خ.',
                    'story'        => 'قبل الزواج، كانت لدي مخاوف كثيرة. من خلال وداد تحدثت مع متخصصة أجابت على جميع أسئلتي بشكل احترافي ومريح. أشعر الآن بثقة أكبر.',
                    'short_story'  => 'استشارة ما قبل الزواج أعطتني راحة البال.',
                    'life_stage'   => 'pre-marriage',
                    'rating'       => 5,
                    'is_featured'  => false,
                    'is_active'    => true,
                    'order'        => 3,
                ],
            ];

            foreach ($stories as $story) {
                SuccessStory::updateOrCreate(
                    [
                        'patient_name' => $story['patient_name'],
                        'life_stage'   => $story['life_stage'],
                    ],
                    $story
                );
            }

            $this->command->info('✅ SuccessStorySeeder: Done.');
        });
    }
}
