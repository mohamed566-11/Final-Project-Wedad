<?php

namespace Database\Factories;

use App\Models\Prescription;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PrescriptionFactory extends Factory
{
    protected $model = Prescription::class;

    public function definition(): array
    {
        $medications = [
            ['name' => 'حمض الفوليك',   'dosage' => '5mg',    'frequency' => 'مرة يومياً',   'duration' => '90 يوم', 'notes' => 'تناولي مع الغداء'],
            ['name' => 'فيتامين د3',     'dosage' => '1000 IU','frequency' => 'مرة يومياً',   'duration' => '60 يوم', 'notes' => null],
            ['name' => 'كالسيوم',        'dosage' => '500mg',  'frequency' => 'مرتين يومياً', 'duration' => '30 يوم', 'notes' => 'بعد الأكل'],
            ['name' => 'حديد',           'dosage' => '325mg',  'frequency' => 'مرة يومياً',   'duration' => '60 يوم', 'notes' => 'تناولي على معدة فارغة'],
        ];

        return [
            'consultation_id' => Consultation::factory()->completed(),
            'doctor_id'       => Doctor::factory(),
            'user_id'         => User::factory(),
            'medications'     => [$this->faker->randomElement($medications)],
            'diagnosis'       => $this->faker->randomElement([
                'متابعة حمل طبيعي',
                'نقص فيتامين د',
                'حمل عالي الخطورة - متابعة',
                'فقر الدم أثناء الحمل',
            ]),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
