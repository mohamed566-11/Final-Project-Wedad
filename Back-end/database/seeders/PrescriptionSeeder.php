<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prescription;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;

class PrescriptionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $completedConsultations = Consultation::where('status', 'completed')
                ->with(['doctor', 'patient'])
                ->take(15)
                ->get();

            if ($completedConsultations->isEmpty()) {
                $this->command->warn('PrescriptionSeeder: No completed consultations found. Skipping.');
                return;
            }

            $medicationSets = [
                [
                    ['name' => 'حمض الفوليك 5mg', 'dosage' => '5mg', 'frequency' => 'مرة يومياً', 'duration' => '90 يوم', 'notes' => 'تناولي مع الغداء'],
                ],
                [
                    ['name' => 'فيتامين د3', 'dosage' => '1000 IU', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم', 'notes' => null],
                ],
                [
                    ['name' => 'حديد', 'dosage' => '325mg', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم', 'notes' => 'تناولي على معدة فارغة'],
                    ['name' => 'فيتامين ج', 'dosage' => '500mg', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم', 'notes' => 'مع الحديد لتحسين الامتصاص'],
                ],
                [
                    ['name' => 'كالسيوم 500mg', 'dosage' => '500mg', 'frequency' => 'مرتين يومياً', 'duration' => '30 يوم', 'notes' => 'بعد الأكل'],
                    ['name' => 'مغنيسيوم', 'dosage' => '250mg', 'frequency' => 'مرة يومياً', 'duration' => '30 يوم', 'notes' => null],
                ],
            ];

            $diagnoses = [
                'متابعة حمل طبيعي - الأسبوع ' . rand(8, 36),
                'نقص فيتامين د ونقص حديد',
                'متابعة حمل عالي الخطورة',
                'حمل مع ارتفاع ضغط الدم',
                'متابعة ما بعد الولادة',
            ];

            foreach ($completedConsultations as $consultation) {
                Prescription::updateOrCreate(
                    ['consultation_id' => $consultation->id],
                    [
                        'doctor_id'   => $consultation->doctor_id,
                        'user_id'     => $consultation->user_id,
                        'medications' => $medicationSets[array_rand($medicationSets)],
                        'diagnosis'   => $diagnoses[array_rand($diagnoses)],
                        'notes'       => 'يُنصح بالمتابعة بعد أسبوعين.',
                    ]
                );
            }

            $this->command->info('✅ PrescriptionSeeder: Done.');
        });
    }
}
