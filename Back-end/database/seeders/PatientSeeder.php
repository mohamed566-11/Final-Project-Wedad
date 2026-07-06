<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\LifeStage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // ← إصلاح رئيسي: الأسماء الصحيحة للـ life stages
            $stages = [
                'motherhood'   => LifeStage::where('name', 'motherhood')->first(),
                'pre_marriage' => LifeStage::where('name', 'pre-marriage')->first(),
                'married'      => LifeStage::where('name', 'married-life')->first(),
            ];

            $patients = [
                // مريضة حامل — عالية الخطورة للـ GDM
                [
                    'user' => [
                        'name'           => 'سارة أحمد',
                        'email'          => 'sara@example.com',
                        'life_stage_id'  => $stages['motherhood']?->id,
                        'age'            => 28,
                        'phone'          => '01111111111',
                        'password'       => Hash::make('Patient@123456'),
                    ],
                    'profile' => [
                        'height'                  => 165,
                        'weight'                  => 75,
                        'blood_type'              => 'O+',
                        'date_of_birth'           => '1996-05-15',
                        'chronic_diseases'        => [],
                        'allergies'               => ['penicillin'],
                        'emergency_contact_name'  => 'محمد أحمد',
                        'emergency_contact_phone' => '01002223333',
                    ],
                ],
                // مريضة حامل
                [
                    'user' => [
                        'name'           => 'فاطمة علي',
                        'email'          => 'fatma@example.com',
                        'life_stage_id'  => $stages['motherhood']?->id,
                        'age'            => 26,
                        'phone'          => '01122222222',
                        'password'       => Hash::make('Patient@123456'),
                    ],
                    'profile' => [
                        'height'                  => 162,
                        'weight'                  => 60,
                        'blood_type'              => 'A+',
                        'date_of_birth'           => '1998-03-10',
                        'chronic_diseases'        => [],
                        'allergies'               => [],
                        'emergency_contact_name'  => 'علي محمد',
                        'emergency_contact_phone' => '01003334444',
                    ],
                ],
                // مريضة بعد الولادة
                [
                    'user' => [
                        'name'           => 'نور الهدى حسين',
                        'email'          => 'nour@example.com',
                        'life_stage_id'  => $stages['motherhood']?->id,
                        'age'            => 30,
                        'phone'          => '01133333333',
                        'password'       => Hash::make('Patient@123456'),
                    ],
                    'profile' => [
                        'height'                  => 160,
                        'weight'                  => 62,
                        'blood_type'              => 'B+',
                        'date_of_birth'           => '1994-08-20',
                        'chronic_diseases'        => [],
                        'allergies'               => [],
                        'emergency_contact_name'  => 'حسين علي',
                        'emergency_contact_phone' => '01004445555',
                    ],
                ],
                // مريضة ما قبل الزواج
                [
                    'user' => [
                        'name'           => 'أميرة خالد',
                        'email'          => 'amira@example.com',
                        'life_stage_id'  => $stages['pre_marriage']?->id,
                        'age'            => 24,
                        'phone'          => '01144444444',
                        'password'       => Hash::make('Patient@123456'),
                    ],
                    'profile' => [
                        'height'                  => 163,
                        'weight'                  => 56,
                        'blood_type'              => 'AB+',
                        'date_of_birth'           => '2000-12-05',
                        'chronic_diseases'        => [],
                        'allergies'               => [],
                        'emergency_contact_name'  => 'خالد سعيد',
                        'emergency_contact_phone' => '01005556666',
                    ],
                ],
                // مريضة حامل — بضغط الدم
                [
                    'user' => [
                        'name'           => 'هبة إبراهيم',
                        'email'          => 'heba@example.com',
                        'life_stage_id'  => $stages['motherhood']?->id,
                        'age'            => 32,
                        'phone'          => '01155555555',
                        'password'       => Hash::make('Patient@123456'),
                    ],
                    'profile' => [
                        'height'                  => 168,
                        'weight'                  => 80,
                        'blood_type'              => 'O-',
                        'date_of_birth'           => '1992-02-18',
                        'chronic_diseases'        => ['hypertension'],
                        'allergies'               => ['sulfa'],
                        'emergency_contact_name'  => 'إبراهيم محمود',
                        'emergency_contact_phone' => '01006667777',
                    ],
                ],
                // مريضة حياة زوجية
                [
                    'user' => [
                        'name'           => 'ياسمين محمد',
                        'email'          => 'yasmin@example.com',
                        'life_stage_id'  => $stages['married']?->id,
                        'age'            => 29,
                        'phone'          => '01166666666',
                        'password'       => Hash::make('Patient@123456'),
                    ],
                    'profile' => [
                        'height'                  => 170,
                        'weight'                  => 65,
                        'blood_type'              => 'A-',
                        'date_of_birth'           => '1995-07-12',
                        'chronic_diseases'        => [],
                        'allergies'               => [],
                        'emergency_contact_name'  => 'محمد سعيد',
                        'emergency_contact_phone' => '01007778888',
                    ],
                ],
            ];

            foreach ($patients as $item) {
                $user = User::updateOrCreate(
                    ['email' => $item['user']['email']],
                    array_merge($item['user'], [
                        'is_active'         => true,
                        'email_verified_at' => now(),
                    ])
                );

                UserProfile::updateOrCreate(
                    ['user_id' => $user->id],
                    array_merge($item['profile'], ['user_id' => $user->id])
                );
            }
        });
    }
}
