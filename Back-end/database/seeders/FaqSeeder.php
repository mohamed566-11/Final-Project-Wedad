<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Faq;
use App\Models\LifeStage;

class FaqSeeder extends Seeder
{
    public function run()
    {
        $pregnancyStage = LifeStage::where('name', 'motherhood')->first();
        
        $faqs = [
            [
                'question' => 'ما هي منصة وداد؟',
                'answer' => 'منصة وداد هي منصة صحية رقمية تستخدم الذكاء الاصطناعي لمساعدة النساء في مختلف مراحل حياتهن، من ما قبل الزواج حتى الأمومة.',
                'life_stage_id' => null,
                'order' => 1,
                'is_active' => true,
            ],
            [
                'question' => 'كيف يعمل نظام التنبؤ بمخاطر الحمل؟',
                'answer' => 'نستخدم نماذج ذكاء اصطناعي متقدمة تم تدريبها على آلاف الحالات لتحليل البيانات الصحية والتنبؤ بمخاطر تسمم الحمل، سكري الحمل، والولادة المبكرة.',
                'life_stage_id' => $pregnancyStage->id,
                'order' => 1,
                'is_active' => true,
            ],
            [
                'question' => 'هل الاستشارات مع الأطباء آمنة؟',
                'answer' => 'نعم، جميع الأطباء على المنصة معتمدون ومرخصون، كما أن جميع البيانات محمية بأعلى معايير الأمان والخصوصية.',
                'life_stage_id' => null,
                'order' => 2,
                'is_active' => true,
            ],
            [
                'question' => 'كيف يمكنني حجز استشارة مع طبيب؟',
                'answer' => 'يمكنك البحث عن الأطباء حسب التخصص، مراجعة التقييمات، واختيار الوقت المناسب لك. ثم إتمام الدفع وستتلقى رابط الاستشارة.',
                'life_stage_id' => null,
                'order' => 3,
                'is_active' => true,
            ],
            [
                'question' => 'ما هي تكلفة الاستشارات؟',
                'answer' => 'تختلف تكلفة الاستشارات حسب تخصص الطبيب وخبرته. يمكنك رؤية السعر قبل الحجز مباشرة.',
                'life_stage_id' => null,
                'order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::create($faq);
        }
    }
}
