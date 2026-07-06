<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SettingsSite;

class SettingsSiteSeeder extends Seeder
{
    public function run()
    {
        SettingsSite::create([
            'name' => 'منصة وداد الصحية',
            'email' => 'info@widad.health',
            'phone' => '+20 100 123 4567',
            'country' => 'مصر',
            'city' => 'القاهرة',
            'street' => 'شارع التحرير، وسط البلد',
            'small_description' => 'منصة رقمية متكاملة مصممة خصيصًا لدعم النساء المصريات عبر مراحل حياتية مختلفة بالذكاء الاصطناعي',
            'facebook_url' => 'https://facebook.com/widad.health',
            'twitter_url' => 'https://twitter.com/widad_health',
            'instagram_url' => 'https://instagram.com/widad.health',
            'youtube_url' => 'https://youtube.com/@widad.health',
        ]);
    }
}
