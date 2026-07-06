<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Doctor;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Support\Str;

class FakePatientsSeeder extends Seeder
{
    public function run()
    {
        // Get the doctor (assuming the first doctor or one named Ahmed)
        $doctor = Doctor::where('name', 'LIKE', '%أحمد%')->first();
        
        if (!$doctor) {
            $doctor = Doctor::first();
        }

        if (!$doctor) {
            $this->command->error('No doctor found!');
            return;
        }

        $this->command->info('Adding patients for Doctor: ' . $doctor->name);

        // Create 5 dummy patients
        $patientsData = [
            ['name' => 'سارة محمد', 'email' => 'sara@example.com'],
            ['name' => 'منى علي', 'email' => 'mona@example.com'],
            ['name' => 'ليلى أحمد', 'email' => 'laila@example.com'],
            ['name' => 'نور الهدى', 'email' => 'noor@example.com'],
            ['name' => 'فاطمة الزهراء', 'email' => 'fatima@example.com'],
        ];

        // Get a life stage
        $lifeStage = \App\Models\LifeStage::first();

        foreach ($patientsData as $data) {
            // Check if exists
            $user = User::where('email', $data['email'])->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => bcrypt('password'),
                    'phone' => '0123456789',
                    'email_verified_at' => now(),
                    'remember_token' => Str::random(10),
                    'life_stage_id' => $lifeStage ? $lifeStage->id : null,
                    'age' => 30,
                    'is_active' => true,
                ]);
            }
            
            // Create Profile
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'date_of_birth' => '1995-01-01',
                    'blood_type' => 'A+',
                    'height' => 165,
                    'weight' => 60,
                ]
            );

            // Create Consultation
            // 1. Upcoming (Confirmed)
            Consultation::create([
                'doctor_id' => $doctor->id,
                'user_id' => $user->id,
                'date' => Carbon::tomorrow()->toDateString(),
                'time' => '14:00:00',
                'status' => 'confirmed',
                'type' => 'video',
                'price' => 300,
                'patient_notes' => 'أريد استشارة حول متابعة الحمل',
                'google_meet_link' => 'https://meet.google.com/abc-defg-hij', // Fake link
            ]);

            // 2. Pending
            Consultation::create([
                'doctor_id' => $doctor->id,
                'user_id' => $user->id,
                'date' => Carbon::now()->addDays(2)->toDateString(),
                'time' => '10:00:00',
                'status' => 'pending',
                'type' => 'video',
                'price' => 300,
                'patient_notes' => 'استشارة عامة',
            ]);
            
            // Add to doctor_patients
            \Illuminate\Support\Facades\DB::table('doctor_patients')->updateOrInsert(
                ['doctor_id' => $doctor->id, 'user_id' => $user->id],
                [
                    'first_appointment_date' => Carbon::now(),
                    'last_appointment_date' => Carbon::now(),
                    'total_appointments' => 1,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]
            );

            $this->command->info('Created patient: ' . $user->name);
        }
    }
}
