# خطة Migrations + Seeders — الجزء الثاني: الـ Factories

---

## القسم 2.1 — الـ Factories الموجودة والمطلوبة

| Factory | موجود؟ | جودته | States الموجودة | ما ينقص |
|---|---|---|---|---|
| [UserFactory](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/UserFactory.php#12-45) | ✅ | ضعيف | [unverified](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/UserFactory.php#35-44) فقط | phone, life_stage_id, image, states |
| [DoctorFactory](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/DoctorFactory.php#8-40) | ✅ | متوسط | لا شيء | states للـ verification, life_stages |
| [AiChatMessageFactory](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/AiChatMessageFactory.php#10-46) | ✅ | جيد | [userMessage](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/AiChatMessageFactory.php#28-33), [botMessage](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/AiChatMessageFactory.php#34-39), [publicBot](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/AiChatMessageFactory.php#40-45) | states للـ bot types |
| `ArticleFactory` | ✅ | ضعيف جداً | لا شيء | كل الحقول تقريباً |
| `LifeStageFactory` | ✅ | بسيط | لا شيء | مقبول |
| `PatientFactory` | ✅ | ضعيف | لا شيء | يُعيد [UserFactory](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/UserFactory.php#12-45) فقط |

---

## القسم 2.2 — Factories المطلوب إنشاؤها (13 Factory)

### 1. `ConsultationFactory` ← أعلى أولوية

```php
namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationFactory extends Factory
{
    protected $model = Consultation::class;

    public function definition(): array
    {
        return [
            'doctor_id'           => Doctor::factory(),
            'user_id'             => User::factory(),
            'date'                => Carbon::now()->addDays(rand(1, 30))->toDateString(),
            'time'                => $this->faker->randomElement(['09:00', '10:00', '11:00', '14:00', '15:00']) . ':00',
            'status'              => 'pending',
            'type'                => $this->faker->randomElement(['video', 'offline']),
            'price'               => $this->faker->randomFloat(2, 150, 500),
            'platform_commission' => fn(array $attr) => $attr['price'] * 0.15,
            'duration_minutes'    => 30,
            'patient_notes'       => $this->faker->optional()->sentence(),
        ];
    }

    // === States ===
    public function completed(): static
    {
        return $this->state(fn(array $attr) => [
            'status'     => 'completed',
            'date'       => Carbon::now()->subDays(rand(1, 30))->toDateString(),
            'started_at' => Carbon::now()->subDays(rand(1, 30))->setTime(10, 0),
            'ended_at'   => Carbon::now()->subDays(rand(1, 30))->setTime(10, 30),
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(['status' => 'confirmed']);
    }

    public function inProgress(): static
    {
        return $this->state([
            'status'     => 'in_progress',
            'started_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status'             => 'cancelled_by_patient',
            'cancellation_reason'=> 'تم الإلغاء لأسباب شخصية',
        ]);
    }

    public function withGoogleMeet(): static
    {
        return $this->state([
            'type'           => 'video',
            'zoom_join_url'  => 'https://meet.google.com/' . $this->faker->regexify('[a-z]{3}-[a-z]{4}-[a-z]{3}'),
            'zoom_meeting_id'=> $this->faker->regexify('[a-z]{3}-[a-z]{4}-[a-z]{3}'),
        ]);
    }
}
```

---

### 2. [UserFactory](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/UserFactory.php#12-45) المُحسَّن (تحديث الموجود)

```php
public function definition(): array
{
    $arabicNames = ['سارة', 'نورا', 'فاطمة', 'مريم', 'هدى', 'أميرة', 'رانيا', 'دينا', 'هبة', 'ياسمين'];
    $arabicFamily = ['محمد', 'أحمد', 'علي', 'حسن', 'إبراهيم', 'عبدالله', 'خالد', 'عمر', 'مصطفى'];

    return [
        'name'              => $this->faker->randomElement($arabicNames) . ' ' . $this->faker->randomElement($arabicFamily),
        'email'             => $this->faker->unique()->safeEmail(),
        'email_verified_at' => now(),
        'password'          => static::$password ??= Hash::make('password'),
        'phone'             => '01' . $this->faker->randomElement(['0','1','2','5']) . $this->faker->numerify('########'),
        'is_active'         => true,
        'image'             => "https://ui-avatars.com/api/?name={$this->faker->firstName()}&background=E91E8C&color=fff",
        'remember_token'    => Str::random(10),
    ];
}

// === States ===
public function pregnant(): static
{
    return $this->state(fn(array $attr) => [
        'life_stage_id' => LifeStage::where('name', 'pregnancy')->first()?->id,
    ])->afterCreating(function (User $user) {
        Pregnancy::factory()->active()->create(['user_id' => $user->id]);
        UserProfile::factory()->create(['user_id' => $user->id]);
    });
}

public function postpartum(): static
{
    return $this->state(fn(array $attr) => [
        'life_stage_id' => LifeStage::where('name', 'motherhood')->first()?->id,
    ])->afterCreating(function (User $user) {
        Pregnancy::factory()->completed()->create(['user_id' => $user->id]);
        UserProfile::factory()->create(['user_id' => $user->id]);
    });
}

public function premarriage(): static
{
    return $this->state(fn(array $attr) => [
        'life_stage_id' => LifeStage::where('name', 'pre-marriage')->first()?->id,
    ])->afterCreating(function (User $user) {
        UserProfile::factory()->create(['user_id' => $user->id]);
    });
}

public function withPredictions(): static
{
    return $this->afterCreating(function (User $user) {
        $pregnancy = $user->activePregnancy;
        if ($pregnancy) {
            GestationalDiabetesPrediction::factory()->highRisk()->create([
                'user_id' => $user->id, 'pregnancy_id' => $pregnancy->id
            ]);
            PreeclampsiaPrediction::factory()->lowRisk()->create([
                'user_id' => $user->id, 'pregnancy_id' => $pregnancy->id
            ]);
        }
    });
}
```

---

### 3. `PregnancyFactory`

```php
class PregnancyFactory extends Factory
{
    protected $model = Pregnancy::class;

    public function definition(): array
    {
        $lmp = Carbon::now()->subWeeks(rand(8, 36));
        return [
            'user_id'       => User::factory(),
            'lmp_date'      => $lmp->toDateString(),
            'due_date'      => $lmp->copy()->addWeeks(40)->toDateString(),
            'is_active'     => true,
            'current_week'  => $lmp->diffInWeeks(now()),
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function completed(): static
    {
        $lmp = Carbon::now()->subWeeks(rand(41, 52));
        return $this->state([
            'is_active'  => false,
            'lmp_date'   => $lmp->toDateString(),
            'due_date'   => $lmp->copy()->addWeeks(40)->toDateString(),
            'birth_date' => $lmp->copy()->addWeeks(rand(38, 41))->toDateString(),
        ]);
    }

    public function firstTrimester(): static
    {
        $lmp = Carbon::now()->subWeeks(rand(4, 12));
        return $this->state([
            'lmp_date'     => $lmp->toDateString(),
            'current_week' => $lmp->diffInWeeks(now()),
        ]);
    }

    public function thirdTrimester(): static
    {
        $lmp = Carbon::now()->subWeeks(rand(28, 36));
        return $this->state([
            'lmp_date'     => $lmp->toDateString(),
            'current_week' => $lmp->diffInWeeks(now()),
        ]);
    }
}
```

---

### 4. `GestationalDiabetesPredictionFactory`

```php
class GestationalDiabetesPredictionFactory extends Factory
{
    protected $model = GestationalDiabetesPrediction::class;

    public function definition(): array
    {
        return [
            'user_id'                   => User::factory(),
            'pregnancy_id'              => Pregnancy::factory(),
            'risk_level'                => 'low',
            'risk_probability'          => $this->faker->randomFloat(4, 0.05, 0.30),
            'risk_category'             => 'Low Risk',
            'final_risk'                => 'Low Risk',
            'maternal_age'              => rand(22, 40),
            'height_cm'                 => rand(155, 175),
            'weight_kg'                 => rand(55, 90),
            'bmi_computed'              => round(rand(20, 35) + 0.5, 1),
            'no_of_pregnancy'           => rand(1, 4),
            'family_history_diabetes'   => false,
            'pcos'                      => false,
            'sedentary_lifestyle'       => false,
            'guardrail_applied'         => false,
            'model_version'             => 'v1.0.0',
            'algorithm_used'            => 'LightGBM',
            'recommendation_ar'         => 'مستوى الخطر منخفض — استمري في نمط حياة صحي.',
            'prediction_date'           => now()->subDays(rand(1, 30)),
        ];
    }

    public function highRisk(): static
    {
        return $this->state([
            'risk_level'         => 'high',
            'risk_probability'   => $this->faker->randomFloat(4, 0.70, 0.95),
            'risk_category'      => 'High Risk',
            'final_risk'         => 'High Risk',
            'family_history_diabetes' => true,
            'pcos'               => true,
            'sedentary_lifestyle'=> true,
            'guardrail_applied'  => true,
            'recommendation_ar'  => 'ننصح بمراجعة طبيبتك لإجراء اختبار OGTT في أقرب وقت.',
            'top_factors'        => ['السمنة', 'التاريخ العائلي', 'PCOS'],
            'ogtt_recommended'   => true,
        ]);
    }

    public function lowRisk(): static
    {
        return $this->state([
            'risk_level'       => 'low',
            'risk_probability' => $this->faker->randomFloat(4, 0.05, 0.25),
        ]);
    }
}
```

---

### 5. `PreeclampsiaPredictionFactory`

```php
// States: highRisk(), lowRisk(), moderate()
// الحقول الرئيسية: gravida, parity, maternal_age, bmi, diabetes, htn, systolic_bp,
//                  diastolic_bp, hb, proteinuria, risk_level, probability
```

### 6. `PretermBirthPredictionFactory`

```php
// States: highRisk(), lowRisk()
// الحقول: maternal_age, bmi, systolic_bp, diastolic_bp, bs, mental_health,
//         previous_complications, prediction_class, risk_label
```

### 7. `ScbuAdmissionPredictionFactory`

```php
// States: highRisk(), lowRisk()
// الحقول: binary_flags (JSON), continuous fields, risk_probability, risk_level,
//         shap_top_features, explain_called
```

### 8. `PrescriptionFactory`

```php
class PrescriptionFactory extends Factory
{
    protected $model = Prescription::class;

    public function definition(): array
    {
        $medications = [
            ['name' => 'حمض الفوليك', 'dosage' => '5mg', 'frequency' => 'مرة يومياً', 'duration' => '90 يوم'],
            ['name' => 'فيتامين د', 'dosage' => '1000 IU', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم'],
            ['name' => 'كالسيوم', 'dosage' => '500mg', 'frequency' => 'مرتين يومياً', 'duration' => '30 يوم'],
            ['name' => 'حديد', 'dosage' => '325mg', 'frequency' => 'مرة يومياً', 'duration' => '60 يوم'],
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
            ]),
            'notes'           => $this->faker->optional()->sentence(),
        ];
    }
}
```

---

### 9. القائمة الكاملة للـ Factories المطلوب إنشاؤها

| Factory | الأولوية | States |
|---|---|---|
| `ConsultationFactory` | 🔴 عالية | `completed`, `confirmed`, `inProgress`, `cancelled` |
| `PregnancyFactory` | 🔴 عالية | [active](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#126-130), `completed`, `firstTrimester`, `thirdTrimester` |
| `GestationalDiabetesPredictionFactory` | 🔴 عالية | `highRisk`, `lowRisk` |
| `PreeclampsiaPredictionFactory` | 🔴 عالية | `highRisk`, `lowRisk` |
| `PretermBirthPredictionFactory` | 🟡 متوسطة | `highRisk`, `lowRisk` |
| `ScbuAdmissionPredictionFactory` | 🟡 متوسطة | `highRisk`, `lowRisk` |
| `PrescriptionFactory` | 🟡 متوسطة | — |
| `ConsultationReviewFactory` | 🟡 متوسطة | `excellent`, `average` |
| `PaymentFactory` | 🟡 متوسطة | `pending`, `success`, `failed` |
| `WeightEntryFactory` | 🟢 منخفضة | — |
| `MoodEntryFactory` | 🟢 منخفضة | — |
| `PeriodCycleFactory` | 🟢 منخفضة | — |
| `UserProfileFactory` | 🔴 عالية | `complete`, `minimal` |

---

## القسم 2.3 — الـ Factories الموجودة التي تحتاج تحديث

### [DoctorFactory](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/factories/DoctorFactory.php#8-40) — المشاكل + الإصلاح

```php
// ❌ مشكلة: verification_status = 'verified' لكن المدعوم في migration هو:
// enum('pending', 'approved', 'rejected', 'verified') - 'verified' موجود ✅

// ❌ مشكلة: لا يُنشئ life_stages relationship
// الإصلاح: afterCreating لإضافة life_stages

public function approved(): static
{
    return $this->state([
        'verification_status' => 'approved',
        'verified_at'         => now(),
        'is_active'           => true,
    ]);
}

public function pending(): static
{
    return $this->state([
        'verification_status' => 'pending',
        'verified_at'         => null,
    ]);
}

public function rejected(): static
{
    return $this->state([
        'verification_status' => 'rejected',
        'rejection_reason'    => 'المستندات المرفوعة غير واضحة',
    ]);
}
```

### `ArticleFactory` — يحتاج إعادة بناء كاملة

```php
// الحالي: حقل واحد فقط (title)
// المطلوب:
public function definition(): array
{
    return [
        'title'         => $this->faker->sentence(6),
        'content'       => $this->faker->paragraphs(5, true),
        'status'        => 'published',
        'author_type'   => 'doctor',
        'author_id'     => Doctor::factory(),
        'life_stage_id' => LifeStage::inRandomOrder()->first()?->id,
        'image'         => "https://picsum.photos/seed/{$this->faker->word}/800/400",
        'published_at'  => now()->subDays(rand(1, 60)),
    ];
}

public function draft(): static { return $this->state(['status' => 'draft']); }
public function published(): static { return $this->state(['status' => 'published', 'published_at' => now()]); }
```
