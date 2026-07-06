<?php
namespace Database\Seeders;

use App\Models\Consultation;
use App\Models\ConsultationMessage;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ConsultationMessageSeeder extends Seeder
{
    public function run(): void
    {
        $consultations = Consultation::whereIn('status', ['confirmed', 'in_progress', 'completed'])
            ->with(['patient', 'doctor'])->limit(10)->get();

        $dialogues = [
            ['patient', 'السلام عليكم دكتورة، أشعر بألم في الجانب الأيمن منذ يومين', 0],
            ['doctor',  'وعليكم السلام، هل الألم مستمر أم متقطع؟', 5],
            ['patient', 'متقطع، يزداد بعد الأكل', 8],
            ['doctor',  'هل تأخذين أي أدوية حالياً؟', 12],
            ['patient', 'لا، لا أتناول أي دواء', 15],
            ['doctor',  'حسناً، سأصف لك بعض التعليمات الغذائية', 20],
        ];

        foreach ($consultations as $c) {
            foreach ($dialogues as [$type, $text, $offset]) {
                ConsultationMessage::create([
                    'consultation_id' => $c->id,
                    'sender_type'     => $type,
                    'sender_id'       => $type === 'patient' ? $c->user_id : $c->doctor_id,
                    'message'         => $text,
                    'message_type'    => 'text',
                    'is_read'         => true,
                    'read_at'         => Carbon::now()->subMinutes(60 - $offset),
                    'created_at'      => Carbon::now()->subMinutes(60 - $offset),
                    'updated_at'      => Carbon::now()->subMinutes(60 - $offset),
                ]);
            }
        }

        $this->command->info('✓ ConsultationMessageSeeder: رسائل تجريبية تم إنشاؤها');
    }
}
