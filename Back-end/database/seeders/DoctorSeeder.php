<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Doctor;
use App\Models\LifeStage;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    public function run()
    {
        $pregnancyStage = LifeStage::where('name', 'motherhood')->first();
        $marriedStage = LifeStage::where('name', 'married-life')->first();

        $doctors = [
            [
                'name' => 'أحمد السيد',
                'email' => 'dr.ahmed@widad.health',
                'password' => Hash::make('password123'),
                'phone' => '+20 122 111 1111',
                'is_active' => true,
                'age' => 45,
                'specialization' => 'obstetrics',
                'license_number' => 'EG-OBS-12345',
                'bio' => 'استشاري أمراض النساء والتوليد مع خبرة 20 عامًا في متابعة الحمل والولادة',
                'consultation_price' => 300,
                'verification_status' => 'approved',
                'is_available' => true,
                'rating' => 4.8,
                'total_consultations' => 450,
                'session_type' => 'both',
                'years_of_experience' => 20,
                'languages' => ['ar', 'en'],
                'clinic_address' => 'مصر الجديدة، القاهرة',
                'verified_at' => now(),
                'life_stages' => [$pregnancyStage->id, $marriedStage->id],
            ],
            [
                'name' => 'فاطمة حسن',
                'email' => 'dr.fatma@widad.health',
                'password' => Hash::make('password123'),
                'phone' => '+20 122 222 2222',
                'is_active' => true,
                'age' => 38,
                'specialization' => 'gynecology',
                'license_number' => 'EG-GYN-67890',
                'bio' => 'استشارية أمراض النساء والصحة الإنجابية',
                'consultation_price' => 250,
                'verification_status' => 'approved',
                'is_available' => true,
                'rating' => 4.9,
                'total_consultations' => 320,
                'session_type' => 'video',
                'years_of_experience' => 15,
                'languages' => ['ar'],
                'clinic_address' => 'المعادي، القاهرة',
                'verified_at' => now(),
                'life_stages' => [$pregnancyStage->id, $marriedStage->id],
            ],
            [
                'name' => 'محمد عبدالله',
                'email' => 'dr.mohamed@widad.health',
                'password' => Hash::make('password123'),
                'phone' => '+20 122 333 3333',
                'is_active' => true,
                'age' => 42,
                'specialization' => 'endocrinology',
                'license_number' => 'EG-END-11223',
                'bio' => 'استشاري الغدد الصماء والسكري، متخصص في سكري الحمل',
                'consultation_price' => 280,
                'verification_status' => 'approved',
                'is_available' => true,
                'rating' => 4.7,
                'total_consultations' => 280,
                'session_type' => 'both',
                'years_of_experience' => 18,
                'languages' => ['ar', 'en'],
                'clinic_address' => 'الدقي، الجيزة',
                'verified_at' => now(),
                'life_stages' => [$pregnancyStage->id],
            ],
            [
                'name' => 'سارة إبراهيم',
                'email' => 'dr.sara@widad.health',
                'password' => Hash::make('password123'),
                'phone' => '+20 122 444 4444',
                'is_active' => true,
                'age' => 36,
                'specialization' => 'fertility',
                'license_number' => 'EG-FER-33445',
                'bio' => 'استشارية الخصوبة وعلاج العقم، متخصصة في التلقيح الصناعي',
                'consultation_price' => 350,
                'verification_status' => 'approved',
                'is_available' => true,
                'rating' => 4.9,
                'total_consultations' => 195,
                'session_type' => 'video',
                'years_of_experience' => 12,
                'languages' => ['ar', 'en', 'fr'],
                'clinic_address' => 'الشيخ زايد، الجيزة',
                'verified_at' => now(),
                'life_stages' => [$marriedStage->id],
            ],
            [
                'name' => 'خالد رمضان',
                'email' => 'dr.khaled@widad.health',
                'password' => Hash::make('password123'),
                'phone' => '+20 122 555 5555',
                'is_active' => true,
                'age' => 50,
                'specialization' => 'obstetrics',
                'license_number' => 'EG-OBS-55667',
                'bio' => 'استشاري التوليد والولادة عالية المخاطر، خبرة 25 عامًا',
                'consultation_price' => 400,
                'verification_status' => 'approved',
                'is_available' => true,
                'rating' => 4.95,
                'total_consultations' => 580,
                'session_type' => 'offline',
                'years_of_experience' => 25,
                'languages' => ['ar', 'en'],
                'clinic_address' => 'مدينة نصر، القاهرة',
                'verified_at' => now(),
                'life_stages' => [$pregnancyStage->id],
            ],
        ];

        foreach ($doctors as $doctorData) {
            $lifeStages = $doctorData['life_stages'];
            unset($doctorData['life_stages']);
            
            $doctor = Doctor::create($doctorData);
            $doctor->lifeStages()->attach($lifeStages);
        }
    }
}
