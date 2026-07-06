<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LifeStage;

class LifeStageSeeder extends Seeder
{
    public function run()
    {
        $stages = [
            [
                'id' => 1,
                'name' => 'pre-marriage',
                'slug' => 'pre-marriage',
                'description' => 'مرحلة ما قبل الزواج - معلومات وإرشادات للفتيات المقبلات على الزواج',
                'icon' => 'heart-circle.svg',
            ],
            [
                'id' => 2,
                'name' => 'married-life',
                'slug' => 'married-life',
                'description' => 'مرحلة الحياة الزوجية - نصائح للحياة الزوجية الصحية والتخطيط للحمل',
                'icon' => 'rings.svg',
            ],
            [
                'id' => 3,
                'name' => 'motherhood',
                'slug' => 'motherhood',
                'description' => 'مرحلة الأمومة - متابعة شاملة للحمل والتحضير للولادة',
                'icon' => 'pregnant.svg',
            ]
        ];

        foreach ($stages as $stage) {
            LifeStage::updateOrCreate(['id' => $stage['id']], $stage);
        }
        
        // Remove any other stages
        LifeStage::whereNotIn('id', [1, 2, 3])->delete();
    }
}
