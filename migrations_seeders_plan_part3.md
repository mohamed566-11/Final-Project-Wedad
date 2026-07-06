# خطة Migrations + Seeders — الجزء الثالث: الـ Seeders

---

## القسم 3.1 — الـ Seeders الموجودة: تقييم شامل

| Seeder | موجود | حالته | المشكلة |
|---|---|---|---|
| `RoleSeeder` | ✅ | جيد | بحاجة لـ `updateOrCreate` |
| `LifeStageSeeder` | ✅ | جيد | يجب مراجعة الأسماء (pregnancy vs motherhood) |
| `SettingsSiteSeeder` | ✅ | مقبول | — |
| [AdminSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/AdminSeeder.php#10-41) | ✅ | ضعيف | ليس Idempotent + كلمة مرور ضعيفة |
| [DoctorSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/DoctorSeeder.php#10-139) | ✅ | متوسط | 5 أطباء فقط + ليس Idempotent + بدون صور |
| [PatientSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/PatientSeeder.php#11-133) | ✅ | ضعيف | `life_stage` خاطئ + 5 مريضات فقط + ليس Idempotent |
| [ConsultationSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/ConsultationSeeder.php#11-104) | ✅ | متوسط | يستخدم حقول قديمة (لكن تعمل بعد migrate) |
| `PregnancySeeder` | ✅ | بسيط جداً | لا يربط صحيح بالمريضات |
| [GestationalDiabetesPredictionSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/GestationalDiabetesPredictionSeeder.php#10-70) | ✅ | متوسط | يأخذ أول pregnancyين فقط |
| [ScbuAdmissionPredictionSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/ScbuAdmissionPredictionSeeder.php#10-78) | ✅ | متوسط | `label` و `prediction` أنواع خاطئة |
| `ArticleSeeder` | ✅ | جيد | — |
| [DatabaseSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/DatabaseSeeder.php#7-58) | ✅ | ناقص | يفتقد لـ Seeders كثيرة |

---

## القسم 3.2 — هيكل الـ Seeders المطلوب (الكامل)

```
database/seeders/
├── DatabaseSeeder.php                    ← Orchestrator (يحتاج إعادة كتابة)
│
├── Core/
│   ├── RoleSeeder.php                   ✅ موجود — يحتاج updateOrCreate
│   ├── LifeStageSeeder.php              ✅ موجود — يحتاج مراجعة الأسماء
│   └── SettingsSiteSeeder.php           ✅ موجود — جيد
│
├── Users/
│   ├── AdminSeeder.php                  ✅ موجود — يحتاج إعادة كتابة
│   ├── DoctorSeeder.php                 ✅ موجود — يحتاج تحسين (10 أطباء + صور)
│   └── PatientSeeder.php                ✅ موجود — يحتاج إصلاح life_stage + Idempotent
│
├── Health/
│   ├── PregnancySeeder.php              ✅ موجود — يحتاج تحسين
│   ├── TrackerSeeder.php                ❌ مطلوب (weight + mood + period + fertility)
│   └── LabTestSeeder.php                ❌ مطلوب
│
├── Medical/
│   ├── ConsultationSeeder.php           ✅ موجود — يحتاج تحسين (50 استشارة)
│   ├── ConsultationMessageSeeder.php    ✅ موجود
│   ├── ConsultationReviewSeeder.php     ✅ موجود
│   ├── PrescriptionSeeder.php           ❌ مطلوب
│   └── PatientNoteSeeder.php            ❌ مطلوب
│
├── AI/
│   ├── GestationalDiabetesPredictionSeeder.php   ✅ موجود
│   ├── PreeclampsiaPredictionSeeder.php           ✅ موجود
│   ├── PretermBirthPredictionSeeder.php           ✅ موجود
│   ├── ScbuAdmissionPredictionSeeder.php          ✅ موجود
│   ├── ChatbotSeeder.php                          ❌ مطلوب
│   └── ChatbotDocumentSeeder.php                  ❌ مطلوب
│
├── Financial/
│   ├── PaymentSeeder.php               ✅ موجود — بسيط جداً
│   └── PayoutSeeder.php                ❌ مطلوب
│
└── CMS/
    ├── ArticleSeeder.php               ✅ موجود — جيد
    ├── MoreArticlesSeeder.php          ✅ موجود
    ├── FaqSeeder.php                   ✅ موجود
    ├── AboutUsSeeder.php               ✅ موجود
    ├── SuccessStorySeeder.php          ❌ مطلوب
    ├── TestimonialSeeder.php           ❌ مطلوب
    └── ContactUsSeeder.php             ✅ موجود
```

---

## القسم 3.3 — DatabaseSeeder المُعاد كتابته

```php
public function run(): void
{
    // 1. Core (لا FK dependencies)
    $this->call([
        RoleSeeder::class,
        LifeStageSeeder::class,
        SettingsSiteSeeder::class,
        AboutUsSeeder::class,
    ]);

    // 2. Users (تعتمد على roles + life_stages)
    $this->call([
        AdminSeeder::class,
        DoctorSeeder::class,
        PatientSeeder::class,
    ]);

    // 3. Doctor Schedule (تعتمد على doctors)
    $this->call([
        DoctorWorkingHourSeeder::class,
    ]);

    // 4. Health Data (تعتمد على patients)
    $this->call([
        PregnancySeeder::class,
        PregnancyEntrySeeder::class,
        WeightEntrySeeder::class,
        MoodEntrySeeder::class,
        PeriodCycleSeeder::class,
    ]);

    // 5. AI (تعتمد على patients + pregnancies)
    $this->call([
        GestationalDiabetesPredictionSeeder::class,
        PreeclampsiaPredictionSeeder::class,
        PretermBirthPredictionSeeder::class,
        ScbuAdmissionPredictionSeeder::class,
        ChatbotSeeder::class,         // ← جديد
        ChatbotDocumentSeeder::class, // ← جديد
    ]);

    // 6. Medical (تعتمد على patients + doctors)
    $this->call([
        ConsultationSeeder::class,
        ConsultationReviewSeeder::class,
        ConsultationMessageSeeder::class,
        PrescriptionSeeder::class,    // ← جديد
    ]);

    // 7. Financial (تعتمد على consultations)
    $this->call([
        PaymentSeeder::class,
        PayoutSeeder::class,          // ← جديد
        SyncDoctorPatientsSeeder::class,
    ]);

    // 8. CMS (مستقلة نسبياً)
    $this->call([
        FaqSeeder::class,
        ArticleSeeder::class,
        MoreArticlesSeeder::class,
        SuccessStorySeeder::class,    // ← جديد
        TestimonialSeeder::class,     // ← جديد
        JoinUsSeeder::class,
        ContactUsSeeder::class,
    ]);

    $this->command->info('✅ تم تهيئة قاعدة البيانات بنجاح!');
}
```

---

## القسم 3.4 — إصلاح الـ Seeders الموجودة (الكود الكامل)

### AdminSeeder المُصلَح

```php
public function run(): void
{
    DB::transaction(function () {
        $roles = [
            'super_admin' => Role::where('role', 'super_admin')->first(),
            'admin'       => Role::where('role', 'admin')->first(),
        ];

        $admins = [
            [
                'name'      => 'أحمد محمد',
                'email'     => 'admin@widad.health',
                'phone'     => '+20 100 000 0001',
                'role_id'   => $roles['super_admin']?->id,
                'is_active' => true,
            ],
            [
                'name'      => 'محمود علي',
                'email'     => 'finance@widad.health',
                'phone'     => '+20 100 000 0002',
                'role_id'   => $roles['admin']?->id,
                'is_active' => true,
            ],
            [
                'name'      => 'سارة أحمد',
                'email'     => 'content@widad.health',
                'phone'     => '+20 100 000 0003',
                'role_id'   => $roles['admin']?->id,
                'is_active' => true,
            ],
        ];

        foreach ($admins as $data) {
            Admin::updateOrCreate(
                ['email' => $data['email']],
                array_merge($data, ['password' => Hash::make('Admin@123456')])
            );
        }
    });
}
```

### PatientSeeder المُصلَح

```php
public function run(): void
{
    DB::transaction(function () {
        // ← إصلاح رئيسي: الأسماء الصحيحة للـ life stages
        $stages = [
            'pregnancy'    => LifeStage::where('name', 'pregnancy')->first(),
            'motherhood'   => LifeStage::where('name', 'motherhood')->first(),
            'pre_marriage' => LifeStage::where('name', 'pre-marriage')->first(),
            'married'      => LifeStage::where('name', 'married-life')->first(),
        ];

        $patients = [
            // مريضات حوامل (8)
            [
                'user' => [
                    'name' => 'سارة أحمد', 'email' => 'sara@example.com',
                    'life_stage_id' => $stages['pregnancy']?->id, 'age' => 28,
                    'phone' => '01111111111', 'password' => Hash::make('Patient@123456'),
                ],
                'profile' => [
                    'height' => 165, 'weight' => 75, 'blood_type' => 'O+',
                    'date_of_birth' => '1996-05-15',
                    'chronic_diseases' => [],
                    'allergies' => ['penicillin'],
                    'emergency_contact_name' => 'محمد أحمد',
                    'emergency_contact_phone' => '01002223333',
                ],
            ],
            [
                'user' => [
                    'name' => 'فاطمة علي', 'email' => 'fatma@example.com',
                    'life_stage_id' => $stages['pregnancy']?->id, 'age' => 26,
                    'phone' => '01122222222', 'password' => Hash::make('Patient@123456'),
                ],
                'profile' => [
                    'height' => 162, 'weight' => 60, 'blood_type' => 'A+',
                    'date_of_birth' => '1998-03-10',
                    'chronic_diseases' => [], 'allergies' => [],
                    'emergency_contact_name' => 'علي محمد',
                    'emergency_contact_phone' => '01003334444',
                ],
            ],
            [
                'user' => [
                    'name' => 'نور الهدى حسين', 'email' => 'nour@example.com',
                    'life_stage_id' => $stages['motherhood']?->id, 'age' => 30,
                    'phone' => '01133333333', 'password' => Hash::make('Patient@123456'),
                ],
                'profile' => [
                    'height' => 160, 'weight' => 62, 'blood_type' => 'B+',
                    'date_of_birth' => '1994-08-20',
                    'chronic_diseases' => [], 'allergies' => [],
                    'emergency_contact_name' => 'حسين علي',
                    'emergency_contact_phone' => '01004445555',
                ],
            ],
            [
                'user' => [
                    'name' => 'أميرة خالد', 'email' => 'amira@example.com',
                    'life_stage_id' => $stages['pre_marriage']?->id, 'age' => 24,
                    'phone' => '01144444444', 'password' => Hash::make('Patient@123456'),
                ],
                'profile' => [
                    'height' => 163, 'weight' => 56, 'blood_type' => 'AB+',
                    'date_of_birth' => '2000-12-05',
                    'chronic_diseases' => [], 'allergies' => [],
                    'emergency_contact_name' => 'خالد سعيد',
                    'emergency_contact_phone' => '01005556666',
                ],
            ],
            [
                'user' => [
                    'name' => 'هبة إبراهيم', 'email' => 'heba@example.com',
                    'life_stage_id' => $stages['pregnancy']?->id, 'age' => 32,
                    'phone' => '01155555555', 'password' => Hash::make('Patient@123456'),
                ],
                'profile' => [
                    'height' => 168, 'weight' => 80, 'blood_type' => 'O-',
                    'date_of_birth' => '1992-02-18',
                    'chronic_diseases' => ['hypertension'], 'allergies' => ['sulfa'],
                    'emergency_contact_name' => 'إبراهيم محمود',
                    'emergency_contact_phone' => '01006667777',
                ],
            ],
        ];

        foreach ($patients as $item) {
            $user = User::updateOrCreate(
                ['email' => $item['user']['email']],
                array_merge($item['user'], [
                    'is_active'          => true,
                    'email_verified_at'  => now(),
                ])
            );

            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                array_merge($item['profile'], ['user_id' => $user->id])
            );
        }
    });
}
```

---

## القسم 3.5 — Seeders الجديدة المطلوبة (Schema كامل)

### ChatbotSeeder

```php
public function run(): void
{
    DB::transaction(function () {
        $sara = User::where('email', 'sara@example.com')->first();
        $amira = User::where('email', 'amira@example.com')->first();

        if (!$sara) return;

        // جلسة سارة — بوت الحمل
        $sessionId = 'pregnancy_' . \Str::uuid();
        $messages = [
            ['role' => 'user',      'bot_type' => 'pregnancy', 'message' => 'أنا حامل في الأسبوع 24، عندي قلق من سكري الحمل'],
            ['role' => 'assistant', 'bot_type' => 'pregnancy', 'message' => 'بناءً على نتائج فحصك الأخير، مستوى الخطورة لديك مرتفع قليلاً. أنصحك بإجراء اختبار OGTT في أقرب وقت. هل تودين معرفة المزيد عن الغذاء المناسب؟'],
            ['role' => 'user',      'bot_type' => 'pregnancy', 'message' => 'ماذا يجب أن آكل؟'],
            ['role' => 'assistant', 'bot_type' => 'pregnancy', 'message' => 'أنصحك بتقليل السكريات البسيطة كالعصائر والحلويات، والتركيز على الخضروات والبروتين الخفيف. تناولي 5-6 وجبات صغيرة بدلاً من 3 كبيرة.'],
        ];

        foreach ($messages as $msg) {
            AiChatMessage::updateOrCreate(
                ['user_id' => $sara->id, 'session_id' => $sessionId, 'role' => $msg['role']],
                ['bot_type' => $msg['bot_type'], 'message' => $msg['message'], 'metadata' => ['status' => 'ready']]
            );
        }

        // جلسة أميرة — بوت ما قبل الزواج
        if ($amira) {
            $session2 = 'pre_marriage_' . \Str::uuid();
            $messages2 = [
                ['role' => 'user',      'bot_type' => 'pre_marriage', 'message' => 'أريد معرفة كيف أحسب أيام التبويض؟'],
                ['role' => 'assistant', 'bot_type' => 'pre_marriage', 'message' => 'أيام التبويض تكون عادةً في منتصف دورتك الشهرية. إذا كانت دورتك 28 يوماً، فالتبويض يحدث في اليوم 14 تقريباً.'],
            ];

            foreach ($messages2 as $msg) {
                AiChatMessage::updateOrCreate(
                    ['user_id' => $amira->id, 'session_id' => $session2, 'role' => $msg['role']],
                    ['bot_type' => $msg['bot_type'], 'message' => $msg['message'], 'metadata' => ['status' => 'ready']]
                );
            }
        }
    });
}
```

### PrescriptionSeeder

```php
public function run(): void
{
    DB::transaction(function () {
        $completedConsultations = Consultation::where('status', 'completed')
            ->with(['doctor', 'patient'])
            ->take(15)
            ->get();

        $medications = [
            [['name' => 'حمض الفوليك 5mg', 'dosage' => '5mg', 'frequency' => 'مرة يومياً', 'duration' => '90 يوم', 'notes' => 'تناولي مع الغداء']],
            [['name' => 'فيتامين د3', 'dosage' => '1000 IU', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم', 'notes' => null]],
            [
                ['name' => 'حديد', 'dosage' => '325mg', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم', 'notes' => 'تناولي على معدة فارغة'],
                ['name' => 'فيتامين ج', 'dosage' => '500mg', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم', 'notes' => 'مع الحديد لتحسين الامتصاص'],
            ],
        ];

        foreach ($completedConsultations as $consultation) {
            Prescription::updateOrCreate(
                ['consultation_id' => $consultation->id],
                [
                    'doctor_id'   => $consultation->doctor_id,
                    'user_id'     => $consultation->user_id,
                    'medications' => $medications[array_rand($medications)],
                    'diagnosis'   => 'متابعة حمل طبيعي - الأسبوع ' . rand(8, 36),
                    'notes'       => 'يُنصح بالمتابعة بعد أسبوعين.',
                ]
            );
        }
    });
}
```

### AiPredictionSeeder المُحسَّن (لـ sara@example.com)

```php
// المطلوب: إنشاء 4 predictions لـ sara@example.com (high risk للـ GDM)
public function run(): void
{
    DB::transaction(function () {
        $sara = User::where('email', 'sara@example.com')->first();
        if (!$sara) return;

        $pregnancy = $sara->activePregnancy ?? Pregnancy::where('user_id', $sara->id)->latest()->first();

        // GDM — خطورة عالية
        GestationalDiabetesPrediction::updateOrCreate(
            ['user_id' => $sara->id],
            [
                'pregnancy_id'           => $pregnancy?->id,
                'risk_level'             => 'high',
                'risk_probability'       => 0.8700,
                'risk_category'          => 'High Risk',
                'final_risk'             => 'High Risk',
                'guardrail_applied'      => true,
                'maternal_age'           => 28,
                'height_cm'              => 165,
                'weight_kg'              => 75,
                'bmi_computed'           => 27.5,
                'no_of_pregnancy'        => 1,
                'family_history_diabetes'=> true,
                'pcos'                   => true,
                'sedentary_lifestyle'    => false,
                'recommendation_ar'      => 'ننصح بمراجعة طبيبتك لإجراء اختبار OGTT في أقرب وقت.',
                'top_factors'            => ['BMI مرتفع', 'التاريخ العائلي', 'PCOS'],
                'ogtt_recommended'       => true,
                'model_version'          => 'v1.0.0',
                'algorithm_used'         => 'LightGBM',
                'prediction_date'        => now()->subDays(15),
            ]
        );

        // Preeclampsia — خطورة منخفضة
        PreeclampsiaPrediction::updateOrCreate(
            ['user_id' => $sara->id],
            [
                'pregnancy_id'     => $pregnancy?->id,
                'risk_level'       => 'low',
                'probability'      => 0.2300,
                'maternal_age'     => 28,
                'bmi'              => 27.5,
                'systolic_bp'      => 118,
                'diastolic_bp'     => 76,
                'htn'              => false,
                'diabetes'         => false,
                'proteinuria'      => false,
                'gravida'          => 1,
                'parity'           => 0,
                'model_version'    => 'v1.0',
                'algorithm_used'   => 'XGBoost',
                'prediction_date'  => now()->subDays(15),
            ]
        );

        // Preterm Birth — خطورة متوسطة
        PretermBirthPrediction::updateOrCreate(
            ['user_id' => $sara->id],
            [
                'pregnancy_id'          => $pregnancy?->id,
                'risk_level'            => 'moderate',
                'probability_high'      => 0.4500,
                'maternal_age'          => 28,
                'bmi'                   => 27.5,
                'systolic_bp'           => 118,
                'diastolic_bp'          => 76,
                'bs'                    => 5.8,
                'mental_health'         => false,
                'previous_complications'=> false,
                'model_version'         => 'v1.0.0',
                'prediction_date'       => now()->subDays(15),
            ]
        );

        // SCBU — خطورة منخفضة
        ScbuAdmissionPrediction::updateOrCreate(
            ['user_id' => $sara->id],
            [
                'pregnancy_id'      => $pregnancy?->id,
                'risk_level'        => 'Low',
                'risk_probability'  => 0.1200,
                'prediction'        => 0,
                'label'             => 'Routine Postnatal Care',
                'maternal_age'      => 28,
                'bmi_at_booking'    => 27.5,
                'weeks_of_gestation'=> 24,
                'systolic_bp'       => 118,
                'diastolic_bp'      => 76,
                'binary_flags'      => ['gestational_diabetes' => 0, 'hypertension' => 0],
                'model_name'        => 'Random Forest SCBU',
                'model_version'     => '3.0.0',
                'threshold_used'    => 0.208,
                'prediction_date'   => now()->subDays(15),
            ]
        );
    });
}
```

---

## القسم 3.6 — خطة الصور الافتراضية

### هيكل `storage/app/public/`

```
storage/app/public/
├── defaults/
│   ├── avatars/
│   │   ├── patient-default.png
│   │   ├── doctor-default.png
│   │   └── admin-default.png
│   └── articles/
│       └── article-placeholder.jpg
├── doctors/          ← صور مُحمَّلة من UI Avatars
└── patients/         ← صور مُحمَّلة من UI Avatars
```

### DefaultImageSeeder

```php
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

public function run(): void
{
    // للأطباء
    $doctors = Doctor::all();
    foreach ($doctors as $doctor) {
        if ($doctor->image && Storage::disk('public')->exists($doctor->image)) continue;
        $firstName = explode(' ', $doctor->name)[1] ?? $doctor->name;
        $url = "https://ui-avatars.com/api/?name=" . urlencode($firstName) . "&background=E91E8C&color=fff&size=200";
        try {
            $content = Http::timeout(10)->get($url)->body();
            $path = "doctors/doctor_{$doctor->id}.png";
            Storage::disk('public')->put($path, $content);
            $doctor->update(['image' => $path]);
        } catch (\Exception $e) {
            $this->command->warn("Failed to download image for {$doctor->name}");
        }
    }

    // للمريضات
    $patients = User::all();
    foreach ($patients as $patient) {
        if ($patient->image && !str_contains($patient->image, 'ui-avatars')) continue;
        $firstName = explode(' ', $patient->name)[0] ?? $patient->name;
        $url = "https://ui-avatars.com/api/?name=" . urlencode($firstName) . "&background=9C27B0&color=fff&size=200";
        try {
            $content = Http::timeout(10)->get($url)->body();
            $path = "patients/patient_{$patient->id}.png";
            Storage::disk('public')->put($path, $content);
            $patient->update(['image' => $path]);
        } catch (\Exception $e) {
            $this->command->warn("Skipped image for {$patient->name}");
        }
    }
}
```

---

## القسم 3.7 — أوامر التشغيل

```bash
# تشغيل كامل (من الصفر)
php artisan migrate:fresh --seed

# تشغيل seed فقط (بدون migrate)
php artisan db:seed

# seeder محدد
php artisan db:seed --class=PatientSeeder
php artisan db:seed --class=AdminSeeder
php artisan db:seed --class=GestationalDiabetesPredictionSeeder
php artisan db:seed --class=ChatbotSeeder

# التحقق من نجاح الـ migrations
php artisan migrate:status

# rollback آخر migration
php artisan migrate:rollback --step=1

# تشغيل في بيئة Testing
php artisan migrate:fresh --seed --env=testing
```

---

## Credentials التجريبية (بعد التنفيذ)

| النوع | الإيميل | كلمة المرور |
|---|---|---|
| Super Admin | admin@widad.health | Admin@123456 |
| Finance Admin | finance@widad.health | Admin@123456 |
| Content Admin | content@widad.health | Admin@123456 |
| مريضة (GDM High) | sara@example.com | Patient@123456 |
| مريضة حامل | fatma@example.com | Patient@123456 |
| مريضة بعد ولادة | nour@example.com | Patient@123456 |
| مريضة ما قبل زواج | amira@example.com | Patient@123456 |
| مريضة (Full AI) | heba@example.com | Patient@123456 |
| طبيبة (نساء) | dr.ahmed@widad.health | password123 |
| طبيبة (خصوبة) | dr.sara@widad.health | password123 |

---

## ✅ معيار نجاح التنفيذ

```bash
# بعد php artisan migrate:fresh --seed يجب أن:
php artisan tinker <<EOF
echo User::count();           # ≥ 5
echo Doctor::count();         # ≥ 5
echo Admin::count();          # = 3
echo Consultation::count();   # ≥ 10
echo GestationalDiabetesPrediction::count(); # ≥ 1

$sara = User::where('email', 'sara@example.com')->first();
echo $sara->gestationalDiabetesPredictions()->where('risk_level', 'high')->count(); # = 1
echo $sara->chatbotPreference ? 'preferences OK' : 'no preferences';
EOF
```
