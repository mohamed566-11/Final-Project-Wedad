<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\Doctor;
use App\Models\LifeStage;
use App\Models\Admin;

class MoreArticlesSeeder extends Seeder
{
    public function run()
    {
        // Get Stages
        $preMarriage = LifeStage::where('slug', 'pre-marriage')->first();
        $marriedLife = LifeStage::where('slug', 'married-life')->first();
        $motherhood = LifeStage::where('slug', 'motherhood')->first();
        
        // Get Admin and Doctor for attribution
        $admin = Admin::first();
        $doctor = Doctor::first();
        
        // If stages don't exist, we can't seed.
        if (!$preMarriage || !$marriedLife || !$motherhood) {
            $this->command->info('Life Stages not found. Make sure LifeStageSeeder is run first.');
            return;
        }

        $articles = [
            // Pre-Marriage Articles
            [
                'title' => 'أهمية الفحص الطبي قبل الزواج',
                'excerpt' => 'لماذا يعتبر الفحص الطبي قبل الزواج خطوة ضرورية لبناء أسرة سليمة وكيف يجنبكم الأمراض الوراثية.',
                'content' => 'الفحص الطبي قبل الزواج هو إجراء وقائي يهدف إلى الكشف عن وجود بعض الأمراض الوراثية أو المعدية...',
                'life_stage_id' => $preMarriage->id,
                'reading_time' => 5,
                'image' => 'pre-marriage-checkup.jpg'
            ],
            [
                'title' => 'كيف تختارين شريك حياتك بوعي؟',
                'excerpt' => 'نصائح نفسية واجتماعية لمساعدتك في اتخاذ القرار الصحيح عند اختيار شريك الحياة.',
                'content' => 'اختيار شريك الحياة هو أحد أهم القرارات التي يتخذها الإنسان. يعتمد الاختيار السليم على التوافق الفكري والعاطفي...',
                'life_stage_id' => $preMarriage->id,
                'reading_time' => 7,
                'image' => 'choosing-partner.jpg'
            ],
            [
                'title' => 'التخطيط المالي للحياة الزوجية',
                'excerpt' => 'دليلك للبدء في حوار مالي صريح مع خطيبك وتأسيس ميزانية مشتركة ناجحة.',
                'content' => 'المال هو عصب الحياة، وكثير من المشاكل الزوجية تنشأ بسبب سوء الإدارة المالية. لذا من المهم الاتفاق على...',
                'life_stage_id' => $preMarriage->id,
                'reading_time' => 6,
                'image' => 'financial-planning.jpg'
            ],
            
            // Married Life Articles
            [
                'title' => 'التفاهم والحوار: أسرار الزواج الناجح',
                'excerpt' => 'كيف تبنين لغة حوار فعالة مع زوجك وتتجاوزين الخلافات اليومية بحكمة.',
                'content' => 'الحوار هو الجسر الذي يربط بين الزوجين. غياب الحوار يعني بناء جدران من العزلة...',
                'life_stage_id' => $marriedLife->id,
                'reading_time' => 8,
                'image' => 'communication.jpg'
            ],
            [
                'title' => 'الاستعداد للحمل: نصائح طبية',
                'excerpt' => 'خطوات طبية وغذائية يجب عليك اتباعها إذا كنت تخططين للحمل قريباً.',
                'content' => 'التخطيط للحمل يبدأ بزيارة الطبيب وإجراء الفحوصات اللازمة وتناول حمض الفوليك...',
                'life_stage_id' => $marriedLife->id,
                'reading_time' => 5,
                'image' => 'pregnancy-planning.jpg'
            ],
            [
                'title' => 'الموازنة بين العمل والمنزل',
                'excerpt' => 'استراتيجيات ذكية للمرأة العاملة للحفاظ على التوازن بين طموحها المهني وحياتها الأسرية.',
                'content' => 'تعاني الكثير من السيدات من ضغوط العمل ومتطلبات المنزل. الحل يكمن في تنظيم الوقت وتوزيع المهام...',
                'life_stage_id' => $marriedLife->id,
                'reading_time' => 6,
                'image' => 'work-life-balance.jpg'
            ],

            // Motherhood Articles
            [
                'title' => 'تغذية الحامل في الأشهر الأولى',
                'excerpt' => 'ماذا تأكلين وماذا تتجنبين في الثلث الأول من الحمل لضمان سلامة جنينك.',
                'content' => 'الأشهر الأولى من الحمل هي فترة حرجة يتكون فيها الجنين. التغذية السليمة هي خط الدفاع الأول...',
                'life_stage_id' => $motherhood->id,
                'reading_time' => 6,
                'image' => 'pregnancy-nutrition.jpg'
            ],
            [
                'title' => 'علامات الولادة المبكرة',
                'excerpt' => 'كيف تميزين بين آلام الولادة الحقيقية والإنذارات الكاذبة؟ ومتى يجب الذهاب للمستشفى؟',
                'content' => 'الولادة المبكرة قد تشكل خطراً على الجنين. من المهم معرفة العلامات التحذيرية مثل...',
                'life_stage_id' => $motherhood->id,
                'reading_time' => 7,
                'image' => 'labor-signs.jpg'
            ],
            [
                'title' => 'اكتئاب ما بعد الولادة',
                'excerpt' => 'لستِ وحدك: دليلك لفهم اكتئاب ما بعد الولادة وطرق التعامل معه وعلاجه.',
                'content' => 'تعاني العديد من الأمهات من تغيرات مزاجية حادة بعد الولادة. هذا الأمر طبيعي ولكن يجب...',
                'life_stage_id' => $motherhood->id,
                'reading_time' => 9,
                'image' => 'postpartum-depression.jpg'
            ],
        ];

        foreach ($articles as $data) {
             Article::create([
                'doctor_id' => $doctor ? $doctor->id : 1,
                'life_stage_id' => $data['life_stage_id'],
                'title' => $data['title'],
                'slug' => \Illuminate\Support\Str::slug($data['title']) . '-' . rand(1000,9999), 
                'excerpt' => $data['excerpt'],
                'content' => $data['content'],
                'status' => 'approved', // 'approved' is the correct status from migration enum
                'views_count' => rand(100, 5000),
                'reading_time' => $data['reading_time'],
                // 'image' => $data['image'], // We might need real images or leave null for placeholder
                'published_at' => now(),
                'reviewed_by' => $admin ? $admin->id : 1,
                'reviewed_at' => now(),
            ]);
        }
        
        $this->command->info('More articles seeded successfully!');
    }
}
