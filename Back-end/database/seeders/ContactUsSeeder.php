<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ContactUs;

class ContactUsSeeder extends Seeder
{
    public function run()
    {
        $messages = [
            [
                'name' => 'أميرة حسن',
                'email' => 'amira@example.com',
                'phone' => '+20 111 999 8888',
                'subject' => 'استفسار عن الاشتراك',
                'message' => 'أريد الاستفسار عن كيفية الاشتراك في الخدمات المميزة للمنصة',
                'is_read' => false,
                'ip_address' => '192.168.1.1',
            ],
            [
                'name' => 'سمير محمود',
                'email' => 'samir@example.com',
                'phone' => '+20 122 888 7777',
                'subject' => 'مشكلة في الدفع',
                'message' => 'واجهت مشكلة أثناء عملية الدفع لحجز استشارة، أرجو المساعدة',
                'is_read' => true,
                'read_at' => now()->subHours(2),
                'ip_address' => '192.168.1.2',
            ],
            [
                'name' => 'منى إبراهيم',
                'email' => 'mona@example.com',
                'phone' => '+20 100 777 6666',
                'subject' => 'اقتراح تحسين',
                'message' => 'أقترح إضافة ميزة تذكير بمواعيد الحمل عبر الواتساب',
                'is_read' => false,
                'ip_address' => '192.168.1.3',
            ],
            [
                'name' => 'خالد عمر',
                'email' => 'khaled@example.com',
                'phone' => '+20 111 666 5555',
                'subject' => 'شكوى',
                'message' => 'الاستشارة لم تبدأ في الوقت المحدد، أرجو التحقق من الموضوع',
                'is_read' => true,
                'read_at' => now()->subDays(1),
                'ip_address' => '192.168.1.4',
            ],
        ];

        foreach ($messages as $message) {
            ContactUs::create($message);
        }
    }
}
