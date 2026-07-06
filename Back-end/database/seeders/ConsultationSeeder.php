<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use Carbon\Carbon;

class ConsultationSeeder extends Seeder
{
    public function run()
    {
        $users = User::all();
        $doctors = Doctor::where('is_active', true)->get();

        if ($doctors->isEmpty() || $users->isEmpty()) {
            return;
        }

        $patientNotes = [
            'أريد استشارة حول متابعة الحمل',
            'لدي أسئلة حول التغذية أثناء الحمل',
            'أحتاج متابعة الحالة الصحية',
            'استشارة بخصوص أعراض جديدة',
            'متابعة نتائج التحاليل',
        ];

        $doctorNotes = [
            'الحالة مستقرة، يُنصح بالمتابعة الدورية',
            'تم مراجعة التحاليل، جميعها في المعدل الطبيعي',
            'يُنصح بإجراء فحص إضافي في الزيارة القادمة',
            'الحالة جيدة، المتابعة بعد أسبوعين',
            'تم وصف المكملات الغذائية اللازمة',
        ];

        $types = ['video', 'offline'];

        foreach ($users as $user) {
            // اختيار طبيبين عشوائيين لكل مستخدم
            $selectedDoctors = $doctors->random(min(2, $doctors->count()));

            foreach ($selectedDoctors as $doctor) {
                // 1. استشارة مكتملة في الماضي
                $pastDate = Carbon::now()->subDays(rand(7, 30));
                Consultation::create([
                    'doctor_id' => $doctor->id,
                    'user_id' => $user->id,
                    'date' => $pastDate->toDateString(),
                    'time' => '10:00:00',
                    'status' => 'completed',
                    'type' => 'video',
                    'price' => $doctor->consultation_price ?? 200,
                    'platform_commission' => ($doctor->consultation_price ?? 200) * 0.15,
                    'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
                    'google_meet_id' => 'abc-defg-hij',
                    'google_event_id' => 'event_' . uniqid(),
                    'patient_notes' => $patientNotes[array_rand($patientNotes)],
                    'doctor_notes' => $doctorNotes[array_rand($doctorNotes)],
                    'duration_minutes' => 30,
                    'started_at' => $pastDate->copy()->setTime(10, 0),
                    'ended_at' => $pastDate->copy()->setTime(10, 30),
                ]);

                // 2. استشارة مؤكدة قادمة
                $futureDate = Carbon::now()->addDays(rand(1, 14));
                Consultation::create([
                    'doctor_id' => $doctor->id,
                    'user_id' => $user->id,
                    'date' => $futureDate->toDateString(),
                    'time' => '14:00:00',
                    'status' => 'confirmed',
                    'type' => 'video',
                    'price' => $doctor->consultation_price ?? 200,
                    'platform_commission' => ($doctor->consultation_price ?? 200) * 0.15,
                    'google_meet_link' => 'https://meet.google.com/xyz-uvwx-yz',
                    'google_meet_id' => 'xyz-uvwx-yz',
                    'google_event_id' => 'event_' . uniqid(),
                    'patient_notes' => $patientNotes[array_rand($patientNotes)],
                    'duration_minutes' => 30,
                ]);

                // 3. استشارة معلقة (50% احتمال)
                if (rand(0, 1)) {
                    $pendingDate = Carbon::now()->addDays(rand(3, 21));
                    Consultation::create([
                        'doctor_id' => $doctor->id,
                        'user_id' => $user->id,
                        'date' => $pendingDate->toDateString(),
                        'time' => '16:00:00',
                        'status' => 'pending',
                        'type' => $types[array_rand($types)],
                        'price' => $doctor->consultation_price ?? 200,
                        'platform_commission' => ($doctor->consultation_price ?? 200) * 0.15,
                        'patient_notes' => $patientNotes[array_rand($patientNotes)],
                        'duration_minutes' => 30,
                    ]);
                }
            }
        }
    }
}

