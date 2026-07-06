<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JoinUs;

class JoinUsSeeder extends Seeder
{
    public function run()
    {
        $requests = [
            [
                'name' => 'د. هالة محمود',
                'email' => 'hala@example.com',
                'phone' => '+20 122 111 0000',
                'specialty' => 'gynecology',
                'status' => 'pending',
                'ip_address' => '192.168.1.10',
            ],
            [
                'name' => 'د. أحمد سالم',
                'email' => 'ahmed.salem@example.com',
                'phone' => '+20 100 222 1111',
                'specialty' => 'obstetrics',
                'status' => 'pending',
                'ip_address' => '192.168.1.11',
            ],
            [
                'name' => 'د. سارة الشافعي',
                'email' => 'sara.shafei@example.com',
                'phone' => '+20 111 333 2222',
                'specialty' => 'fertility',
                'status' => 'contacted',
                'notes' => 'تم التواصل معها عبر الهاتف',
                'ip_address' => '192.168.1.12',
            ],
            [
                'name' => 'د. محمود فريد',
                'email' => 'mahmoud.farid@example.com',
                'phone' => '+20 122 444 3333',
                'specialty' => 'endocrinology',
                'status' => 'approved',
                'notes' => 'تم قبول الطلب وإرسال دعوة للتسجيل',
                'ip_address' => '192.168.1.13',
            ],
            [
                'name' => 'د. ليلى عبدالله',
                'email' => 'laila@example.com',
                'phone' => '+20 100 555 4444',
                'specialty' => 'other',
                'status' => 'rejected',
                'notes' => 'التخصص غير متوفر حالياً على المنصة',
                'ip_address' => '192.168.1.14',
            ],
        ];

        foreach ($requests as $request) {
            JoinUs::create($request);
        }
    }
}
