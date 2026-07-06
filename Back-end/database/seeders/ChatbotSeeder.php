<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ChatbotSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $sara  = User::where('email', 'sara@example.com')->first();
            $amira = User::where('email', 'amira@example.com')->first();

            if (!$sara) {
                $this->command->warn('ChatbotSeeder: sara@example.com not found. Skipping.');
                return;
            }

            // جلسة سارة — بوت الحمل
            $sessionId = 'pregnancy_demo_sara';
            $messages  = [
                [
                    'role'     => 'user',
                    'bot_type' => 'pregnancy',
                    'message'  => 'أنا حامل في الأسبوع 24، عندي قلق من سكري الحمل',
                ],
                [
                    'role'     => 'assistant',
                    'bot_type' => 'pregnancy',
                    'message'  => 'بناءً على نتائج فحصك الأخير، مستوى الخطورة لديك مرتفع قليلاً. أنصحك بإجراء اختبار OGTT في أقرب وقت. هل تودين معرفة المزيد عن الغذاء المناسب؟',
                ],
                [
                    'role'     => 'user',
                    'bot_type' => 'pregnancy',
                    'message'  => 'ماذا يجب أن آكل؟',
                ],
                [
                    'role'     => 'assistant',
                    'bot_type' => 'pregnancy',
                    'message'  => 'أنصحك بتقليل السكريات البسيطة كالعصائر والحلويات، والتركيز على الخضروات والبروتين الخفيف. تناولي 5-6 وجبات صغيرة بدلاً من 3 كبيرة.',
                ],
            ];

            foreach ($messages as $index => $msg) {
                AiChatMessage::updateOrCreate(
                    [
                        'user_id'    => $sara->id,
                        'session_id' => $sessionId,
                        'role'       => $msg['role'],
                        'message'    => $msg['message'],
                    ],
                    [
                        'bot_type' => $msg['bot_type'],
                        'metadata' => ['status' => 'ready', 'order' => $index],
                    ]
                );
            }

            // جلسة أميرة — بوت ما قبل الزواج
            if ($amira) {
                $session2  = 'pre_marriage_demo_amira';
                $messages2 = [
                    [
                        'role'     => 'user',
                        'bot_type' => 'pre_marriage',
                        'message'  => 'أريد معرفة كيف أحسب أيام التبويض؟',
                    ],
                    [
                        'role'     => 'assistant',
                        'bot_type' => 'pre_marriage',
                        'message'  => 'أيام التبويض تكون عادةً في منتصف دورتك الشهرية. إذا كانت دورتك 28 يوماً، فالتبويض يحدث في اليوم 14 تقريباً.',
                    ],
                ];

                foreach ($messages2 as $index => $msg) {
                    AiChatMessage::updateOrCreate(
                        [
                            'user_id'    => $amira->id,
                            'session_id' => $session2,
                            'role'       => $msg['role'],
                            'message'    => $msg['message'],
                        ],
                        [
                            'bot_type' => $msg['bot_type'],
                            'metadata' => ['status' => 'ready', 'order' => $index],
                        ]
                    );
                }
            }

            $this->command->info('✅ ChatbotSeeder: Done.');
        });
    }
}
