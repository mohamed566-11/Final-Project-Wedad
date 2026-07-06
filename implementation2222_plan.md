# Widad-Tech — خطة الإصلاح الشاملة — الكود الكامل

---

## 🔍 ملخص المشاكل الجذرية

| المشكلة | الملف المتأثر | السبب الجذري |
|---|---|---|
| Life Stages تُظهر dummy data | [LifeStagePage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/public/LifeStagePage.tsx) | `available_doctors: []` لأنه لا يوجد doctors مربوطين بـ `pre-marriage` في pivot table `doctor_life_stages` |
| IoT heart_rate لا يُعبأ | [PatientDataCollectorService.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/PatientDataCollectorService.php) | السطر 85 يحتوي `'heart_rate' => null` hardcoded |
| OCR يُظهر كل التحاليل | [LabTestsPage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/patient/medical-file/LabTestsPage.tsx) + لا يوجد endpoint | لا يوجد فلترة بحقول الموديل ولا آلية auto-fill |

---

## 🟢 أولاً — إصلاح صفحات مراحل الحياة (Life Stages)

### المشكلة بالتفصيل

الـ Backend يعمل صح لكن:
1. مرحلة `pre-marriage` ليس عندها أطباء مربوطين عبر جدول `doctor_life_stages`
2. الـ Frontend يكتشف `available_doctors: []` فيعرض `DUMMY_DOCTORS`

---

### 1.1 — تعديل Backend: إضافة Fallback للأطباء

**الملف:** [Back-end/app/Http/Controllers/Api/PublicController.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/PublicController.php)

**الكود الكامل للتعديل (دالة [getLifeStage](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/services/publicService.ts#179-181)):**

```php
public function getLifeStage($slug)
{
    $stage = LifeStage::where('slug', $slug)->first();

    if (!$stage) {
        return $this->errorResponse('المرحلة الحياتية غير موجودة', 404);
    }

    // ── المقالات ─────────────────────────────────────────────────────────
    $articles = Article::where('life_stage_id', $stage->id)
        ->where('status', 'approved')
        ->with(['doctor', 'lifeStage'])
        ->latest()
        ->take(6)
        ->get();

    // Fallback: لو مفيش مقالات مرتبطة بالمرحلة ده، جيب أي 3 مقالات approved
    if ($articles->isEmpty()) {
        $articles = Article::where('status', 'approved')
            ->with(['doctor', 'lifeStage'])
            ->latest()
            ->take(3)
            ->get();
    }

    $articlesResource = ArticleResource::collection($articles)->resolve();

    // ── الأطباء ───────────────────────────────────────────────────────────
    $doctorQuery = fn($q) => $q
        ->where('is_active', true)
        ->whereIn('verification_status', ['approved', 'verified']);

    $doctors = $stage->doctors()
        ->where('is_active', true)
        ->whereIn('verification_status', ['approved', 'verified'])
        ->take(6)
        ->get();

    // Fallback: لو مفيش أطباء مربوطين بهذه المرحلة، جيب 6 أطباء متاحين عشوائياً
    if ($doctors->isEmpty()) {
        $doctors = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->inRandomOrder()
            ->take(6)
            ->get();
    }

    $mappedDoctors = $doctors->map(fn($doctor) => [
        'id'                  => $doctor->id,
        'name'                => $doctor->name,
        'specialization_ar'   => TranslationHelper::specialization($doctor->specialization),
        'rating'              => (float) ($doctor->rating ?? 4.5),
        'image_url'           => $doctor->image
            ? app('App\Utils\ImageManager')->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png')
            : url('profiles/default-doctor.png'),
        'consultation_price'  => (float) $doctor->consultation_price,
        'years_of_experience' => $doctor->years_of_experience,
        'total_consultations' => $doctor->total_consultations ?? 0,
        'is_available'        => $doctor->is_available,
    ]);

    // ── FAQs ──────────────────────────────────────────────────────────────
    $faqs = Faq::where('life_stage_id', $stage->id)
        ->where('is_active', true)
        ->orderBy('order')
        ->take(5)
        ->get()
        ->map(fn($faq) => [
            'question' => $faq->question,
            'answer'   => $faq->answer,
        ]);

    return $this->successResponse([
        'life_stage' => [
            'id'               => $stage->id,
            'name'             => $stage->name,
            'name_ar'          => TranslationHelper::lifeStage($stage->name),
            'slug'             => $stage->slug,
            'description'      => $stage->description,
            'icon'             => $stage->icon,
            'features'         => $this->getStageFeatures($stage->name),
            'tools'            => $this->getStageTools($stage->name),
            'related_articles' => $articlesResource,
            'available_doctors'=> $mappedDoctors,
            'faqs'             => $faqs,
        ],
    ]);
}
```

---

### 1.2 — تعديل Frontend: حذف Dummy Data + Empty States

**الملف:** [Front-End/src/pages/public/LifeStagePage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/public/LifeStagePage.tsx)

**الكود الكامل للتعديل:**

**الخطوة 1:** احذف السطور 39-56 بالكامل (كل DUMMY constants):

```diff
- const DUMMY_ARTICLES = [ ... ]; // احذف هذا الكل
- const DUMMY_DOCTORS  = [ ... ]; // احذف هذا الكل
- const DUMMY_FEATURES = [ ... ]; // احذف هذا الكل
```

**الخطوة 2:** عدّل السطور 179-181 من:
```typescript
// ❌ الكود القديم
const displayFeatures = stage.features && stage.features.length > 0 ? stage.features : DUMMY_FEATURES;
const displayArticles = (stage.related_articles && stage.related_articles.length > 0 ? stage.related_articles : DUMMY_ARTICLES).slice(0, 3);
const displayDoctors  = stage.available_doctors && stage.available_doctors.length > 0 ? stage.available_doctors : DUMMY_DOCTORS;
```

إلى:
```typescript
// ✅ الكود الجديد — بدون dummy data
const displayFeatures = stage.features ?? [];
const displayArticles = (stage.related_articles ?? []).slice(0, 3);
const displayDoctors  = stage.available_doctors ?? [];
```

**الخطوة 3:** في قسم Articles (حوالي السطر 398)، أضف empty state قبل `.map()`:

```tsx
{/* Articles Section */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {displayArticles.length === 0 ? (
        // ✅ Empty State احترافي بدل dummy
        <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
            <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-4", theme.bg)}>
                <BookOpen className={cn("w-8 h-8", theme.color)} />
            </div>
            <h3 className="font-black text-foreground text-xl mb-2">لا توجد مقالات بعد</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                سيتم إضافة مقالات متخصصة لهذه المرحلة قريباً. يمكنك الاطلاع على جميع المقالات الآن.
            </p>
            <Link to="/articles"
                className={cn("px-6 py-3 rounded-xl text-white font-bold text-sm", theme.button)}>
                تصفحي كل المقالات
            </Link>
        </div>
    ) : (
        displayArticles.map((article, index) => (
            // ... نفس كود الـ article card الموجود
        ))
    )}
</div>
```

**الخطوة 4:** في قسم Doctors (حوالي السطر 472)، نفس المنطق:

```tsx
{/* Doctors Section */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {displayDoctors.length === 0 ? (
        <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
            <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-4", theme.bg)}>
                <Stethoscope className={cn("w-8 h-8", theme.color)} />
            </div>
            <h3 className="font-black text-foreground text-xl mb-2">جارٍ إضافة الاستشاريين</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                سيتوفر أطباء متخصصون في هذه المرحلة قريباً. يمكنك الاطلاع على قائمة أطبائنا الآن.
            </p>
            <Link to="/doctors"
                className={cn("px-6 py-3 rounded-xl text-white font-bold text-sm", theme.button)}>
                استعرضي كل الأطباء
            </Link>
        </div>
    ) : (
        displayDoctors.map((doctor, index) => (
            // ... نفس كود الـ doctor card الموجود
        ))
    )}
</div>
```

---

## 🟡 ثانياً — إصلاح IoT Heart Rate Auto-Fill

### المشكلة بالتفصيل

في [PatientDataCollectorService.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/PatientDataCollectorService.php) السطر 85:
```php
'heart_rate' => null, // ❌ hardcoded null رغم وجود بيانات في DB
```

بينما `IotController::syncData()` يخزّن القراءات في جدول `patient_heart_rates` ورموز `PatientHeartRate` model موجودة.

---

### 2.1 — تعديل Backend: PatientDataCollectorService

**الملف:** [Back-end/app/Services/PatientDataCollectorService.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/PatientDataCollectorService.php)

**الكود الكامل للتعديل:**

```php
// في أعلى الملف أضف import للـ Model
use App\Models\PatientHeartRate;

// ── دالة collectForPretermBirth ─────────────────────────────────────────
public function collectForPretermBirth(User $user): array
{
    $profile  = $user->profile;
    $pregnancy = $user->activePregnancy;

    $data = [
        'age'                    => $this->getAge($user, $profile),
        'systolic_bp'            => $profile?->blood_pressure_systolic,
        'diastolic'              => $profile?->blood_pressure_diastolic,
        'bs'                     => null,  // Lab test — user must input
        'bmi'                    => $profile?->calculateBMI(),
        'previous_complications' => $this->hasPreviousComplications($user) ? 1 : 0,
        'preexisting_diabetes'   => $this->hasCondition($profile, 'diabetes') ? 1 : 0,
        'gestational_diabetes'   => $this->hasCurrentGDM($user) ? 1 : 0,
        'mental_health'          => 0,
        // ✅ الآن يجلب آخر قراءة heart rate من Google Fit تلقائياً
        'heart_rate'             => $this->getLatestHeartRate($user),
    ];

    return $this->addMetadata($data, $user, $pregnancy);
}

// ── Private Helper جديد ─────────────────────────────────────────────────
/**
 * جلب آخر قراءة heart rate من جدول patient_heart_rates (مزامنة Google Fit)
 * يرجع null لو المريضة لم تربط Google Fit أو لا يوجد قراءات بعد
 */
private function getLatestHeartRate(User $user): ?float
{
    $latest = PatientHeartRate::where('user_id', $user->id)
        ->latest('timestamp')
        ->first();

    return $latest?->heart_rate_bpm;
}
```

**أين تضع `getLatestHeartRate`:** ضعها بعد دالة [getLatestWeight](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/PatientDataCollectorService.php#151-161) الموجودة (السطر ~151).

---

### 2.2 — تعديل Frontend: عرض مصدر heart_rate في الـ Form

**الملف:** [Front-End/src/pages/patient/ai-center/PretermScreeningPage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/patient/ai-center/PretermScreeningPage.tsx)

**التعديل:** في حقل heart_rate (السطر 211-218)، أضف badge يُظهر من أين جاءت القيمة:

```tsx
{/* ─── قبل التعديل (السطر 211-219) ─── */}
<div className="space-y-2 group">
    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
        <HeartPulse className="w-4 h-4 text-orange-500" /> نبض القلب (HR)
    </label>
    <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
        <input type="number" step="0.1" placeholder="مثال: 80 (بين 40 و 250)"
            {...register("heart_rate", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 40, message: "الحد الأدنى 40" }, max: { value: 250, message: "الحد الأقصى 250" } })}
            className={`w-full bg-slate-50 border ${errors.heart_rate ? 'border-red-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} />
        {errors.heart_rate && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.heart_rate.message}</p>}
    </div>
</div>

{/* ─── بعد التعديل ─── */}
<div className="space-y-2 group">
    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
        <HeartPulse className="w-4 h-4 text-orange-500" /> نبض القلب (HR)
        {/* ✅ Badge يظهر لو القيمة مجلوبة من Google Fit */}
        {prefillData?.fields?.heart_rate && (
            <span className="mr-auto flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Activity className="w-3 h-3" />
                من Google Fit
            </span>
        )}
    </label>
    <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
        <input type="number" step="0.1" placeholder="مثال: 80 (بين 40 و 250)"
            {...register("heart_rate", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 40, message: "الحد الأدنى 40" }, max: { value: 250, message: "الحد الأقصى 250" } })}
            className={`w-full bg-slate-50 border ${errors.heart_rate ? 'border-red-400' : prefillData?.fields?.heart_rate ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} />
        {errors.heart_rate && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.heart_rate.message}</p>}
    </div>
</div>
```

---

## 🟠 ثالثاً — إصلاح OCR (فلترة + Auto-fill في الموديلات)

### المشكلة بالتفصيل

- OCR يرجع **كل التحاليل** بدون فلترة
- لا يوجد **Endpoint** يعرف أي حقل OCR يناسب أي موديل
- لا يوجد **آلية auto-fill** للنتائج عند فتح نموذج الذكاء الاصطناعي

**خريطة الحقول المطلوبة لكل موديل:**

| اسم الحقل في الموديل | الموديل | الكلمات المفتاحية في OCR |
|---|---|---|
| [hb](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/hooks/useAiCenter.ts#109-118) (hemoglobin) | Preeclampsia | `hemoglobin`, [hb](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/hooks/useAiCenter.ts#109-118), `هيموجلوبين` |
| `bs` (blood sugar) | Preterm | `glucose`, `blood sugar`, `سكر`, `جلوكوز` |
| `hpg_2h` | SCBU | `2-hour glucose`, `ogtt`, `hpgt` |
| `fasting_glucose` | SCBU | `fasting glucose`, `سكر صايم`, `fbs` |
| `vitamin_d` | SCBU | `vitamin d`, `فيتامين د`, `25-oh` |

---

### 3.1 — Backend: Endpoint جديد للفلترة حسب الموديل

**الملف:** [Back-end/app/Http/Controllers/Api/Patient/LabTestController.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/LabTestController.php)

**أضف الدالة الجديدة:**

```php
// ─────────────────────────────────────────────────────────────────────────
// GET /patient/lab-tests/latest-for-model/{model}
// يرجع آخر OCR ناجح مفلتر بالحقول المطلوبة للموديل المحدد
// ─────────────────────────────────────────────────────────────────────────

public function latestForModel(string $model): JsonResponse
{
    // تعريف الكلمات المفتاحية لكل موديل
    $modelFieldsMap = [
        'preeclampsia' => [
            'hb' => ['hemoglobin', 'hb', 'هيموجلوبين', 'haemoglobin'],
        ],
        'preterm' => [
            'bs' => ['blood sugar', 'glucose', 'bsl', 'سكر', 'جلوكوز', 'random glucose'],
        ],
        'scbu' => [
            'hpg_2h'          => ['2-hour glucose', '2h glucose', 'ogtt 2h', 'بعد ساعتين'],
            'fasting_glucose'  => ['fasting glucose', 'fbs', 'fasting blood sugar', 'سكر صايم'],
            'vitamin_d'        => ['vitamin d', 'vit d', '25-oh', 'فيتامين د', 'cholecalciferol'],
        ],
    ];

    if (!isset($modelFieldsMap[$model])) {
        return $this->errorResponse('نوع الموديل غير صالح', 422);
    }

    // جلب آخر OCR ناجح للمريضة
    $latestLabTest = LabTestResult::forUser(auth('patient')->id())
        ->where('status', 'completed')
        ->whereNotNull('result_data')
        ->latest()
        ->first();

    if (!$latestLabTest) {
        return $this->successResponse([
            'has_data'   => false,
            'lab_test_id'=> null,
            'fields'     => [],
            'message'    => 'لا يوجد تحاليل مقروءة سابقة',
        ]);
    }

    $allTests  = $latestLabTest->result_data['tests'] ?? [];
    $keywords  = $modelFieldsMap[$model];
    $extracted = [];

    foreach ($keywords as $fieldName => $searchTerms) {
        foreach ($allTests as $test) {
            $testNameLower = strtolower($test['test_name'] ?? '');
            foreach ($searchTerms as $term) {
                if (str_contains($testNameLower, strtolower($term))) {
                    $value = is_numeric($test['value']) ? (float) $test['value'] : null;
                    if ($value !== null) {
                        $extracted[$fieldName] = [
                            'value'           => $value,
                            'unit'            => $test['unit'] ?? '',
                            'test_name'       => $test['test_name'],
                            'status'          => $test['status'] ?? 'unknown',
                            'reference_range' => $test['reference_range'] ?? '',
                        ];
                    }
                    break 2; // وجدنا الحقل، انتقل للتالي
                }
            }
        }
    }

    return $this->successResponse([
        'has_data'    => !empty($extracted),
        'lab_test_id' => $latestLabTest->id,
        'lab_test_date'=> $latestLabTest->created_at->format('Y-m-d'),
        'fields'      => $extracted,
        'message'     => !empty($extracted)
            ? 'تم العثور على ' . count($extracted) . ' قيم من تحليلك الأخير'
            : 'لم يتم العثور على قيم مناسبة في تحليلك الأخير',
    ]);
}
```

**أضف Route في [Back-end/routes/patient.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/routes/patient.php):**
```php
// في قسم Lab Tests الموجود
Route::get('lab-tests/latest-for-model/{model}', [LabTestController::class, 'latestForModel']);
Route::get('lab-tests',                [LabTestController::class, 'index']);
Route::post('lab-tests',               [LabTestController::class, 'upload']);
//... بقية الـ routes
```

> [!IMPORTANT]
> Route الجديد **يجب** أن يكون قبل `/{id}` routes لأن `latest-for-model` هيتطابق مع `{id}` لو جاء متأخر.

---

### 3.2 — Frontend: Service Function جديدة

**الملف:** `Front-End/src/services/aiCenterService.ts`

**أضف الدالة:**
```typescript
// في قسم AI Center Service — أضف هذه الدالة
getLatestOcrForModel: async (model: string) => {
    const res = await api.get<{
        data: {
            has_data: boolean;
            lab_test_id: number | null;
            lab_test_date: string;
            fields: Record<string, {
                value: number;
                unit: string;
                test_name: string;
                status: string;
                reference_range: string;
            }>;
            message: string;
        }
    }>(`/patient/lab-tests/latest-for-model/${model}`);
    return res.data.data;
},
```

**أضف Hook في [Front-End/src/hooks/useAiCenter.ts](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/hooks/useAiCenter.ts):**
```typescript
// أضف هذا الـ hook بعد useAiCenterPrefill
export const useOcrPrefillForModel = (model: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['ocr', 'prefill', model],
        queryFn: () => aiCenterService.getLatestOcrForModel(model),
        enabled: enabled && !!model,
        staleTime: 5 * 60 * 1000, // 5 دقائق
    });
};
```

---

### 3.3 — Frontend: دمج OCR في PretermScreeningPage

**الملف:** [Front-End/src/pages/patient/ai-center/PretermScreeningPage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/patient/ai-center/PretermScreeningPage.tsx)

**الكود الكامل للتعديل:**

```tsx
// ─── Imports: أضف
import { useAiCenterPrefill, usePredictPreterm } from "@/hooks/useAiCenter";
import { useOcrPrefillForModel } from "@/hooks/useAiCenter"; // ← جديد

export const PretermScreeningPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [skipGuard, setSkipGuard] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
    }, [isAuthenticated, navigate]);

    // ── Prefill من البروفيل ──────────────────────────────────────────────
    const { data: prefillData, isLoading: isLoadingPrefill } =
        useAiCenterPrefill('preterm', isAuthenticated);

    // ── Prefill من OCR ───────────────────────────────────────────────────
    const { data: ocrData, isLoading: isLoadingOcr } =
        useOcrPrefillForModel('preterm', isAuthenticated);

    const predictMutation = usePredictPreterm();
    const [result, setResult] = useState<any>(null);
    // ✅ تتبع أي حقول مُملوءة من OCR لإظهار بادج
    const [ocrFilledFields, setOcrFilledFields] = useState<string[]>([]);

    const { register, handleSubmit, reset, setValue, formState: { errors } } =
        useForm<PretermInput>({
            defaultValues: { age: 0, systolic_bp: 0, diastolic: 0, bs: 0, bmi: 0,
                previous_complications: 0, preexisting_diabetes: 0,
                gestational_diabetes: 0, mental_health: 0, heart_rate: 0 }
        });

    // ── Effect 1: تعبئة بيانات البروفيل + IoT ────────────────────────────
    useEffect(() => {
        if (prefillData?.fields) {
            reset(prefillData.fields);
        }
    }, [prefillData, reset]);

    // ── Effect 2: تعبئة بيانات OCR (bs) ─────────────────────────────────
    useEffect(() => {
        if (!ocrData?.has_data || !ocrData.fields) return;

        const filled: string[] = [];

        // ✅ تعبئة حقل bs (Blood Sugar) من OCR تلقائياً
        if (ocrData.fields.bs?.value) {
            setValue('bs', ocrData.fields.bs.value, { shouldDirty: false });
            filled.push('bs');
        }

        setOcrFilledFields(filled);
    }, [ocrData, setValue]);

    // ── Render ────────────────────────────────────────────────────────────
    const isLoading = isLoadingPrefill || isLoadingOcr;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-12">
                <div className="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto font-primary space-y-8">

                    {/* ─── Header (نفس الموجود) ─── */}

                    {/* ─── No Pregnancy Guard (نفس الموجود) ─── */}

                    {!result && (isLoading || prefillData?.pregnancy_id !== null || skipGuard) ? (
                        <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100">
                            {isLoading ? (
                                <div className="space-y-6">
                                    <Skeleton className="h-8 w-1/3" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : (
                                <form noValidate onSubmit={handleSubmit(onSubmit, () => {
                                    toast({ title: "بيانات ناقصة", description: "راجعي الحقول المحددة باللون الأحمر", variant: "destructive" });
                                })} className="space-y-10">

                                    {/* ✅ Banner: بيانات البروفيل */}
                                    {prefillData?.auto_filled && prefillData.auto_filled.length > 0 && (
                                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-orange-800">
                                            <ShieldCheck className="w-5 h-5 shrink-0 text-orange-600" />
                                            <div>
                                                <p className="text-sm font-bold">تعبئة تلقائية من ملفك الصحي</p>
                                                <p className="text-xs text-orange-700/80 leading-relaxed mt-1">
                                                    تم تجهيز {prefillData.auto_filled.length} مدخلات: {' '}
                                                    <span className="font-mono">{prefillData.auto_filled.join('، ')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ✅ Banner: بيانات OCR */}
                                    {ocrData?.has_data && ocrFilledFields.length > 0 && (
                                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex gap-3 text-purple-800">
                                            <Activity className="w-5 h-5 shrink-0 text-purple-600" />
                                            <div>
                                                <p className="text-sm font-bold">تعبئة تلقائية من تحليلك الأخير</p>
                                                <p className="text-xs text-purple-700/80 leading-relaxed mt-1">
                                                    تم جلب قيمة <strong>سكر الدم (BS)</strong> من تحليلك بتاريخ {ocrData.lab_test_date}.
                                                    يمكنك تعديلها إذا لزم.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── حقل bs مع تمييز OCR ─── */}
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Droplet className="w-4 h-4 text-orange-500" />
                                            سكر الدم (BS)
                                            {/* ✅ Badge لو القيمة من OCR */}
                                            {ocrFilledFields.includes('bs') && (
                                                <span className="mr-auto flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                                                    📄 من التحليل — {ocrData?.fields?.bs?.value} {ocrData?.fields?.bs?.unit}
                                                </span>
                                            )}
                                        </label>
                                        <input type="number" step="0.1" placeholder="مثال: 90 (بين 3 و 400)"
                                            {...register("bs", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 3, message: "الحد الأدنى 3" }, max: { value: 400, message: "الحد الأقصى 400" } })}
                                            className={`w-full border px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none
                                                ${errors.bs ? 'border-red-400 bg-red-50' :
                                                  ocrFilledFields.includes('bs') ? 'border-purple-300 bg-purple-50/30 focus:ring-purple-400' :
                                                  'border-slate-200 bg-slate-50 focus:ring-orange-500'}`} />
                                        {errors.bs && <p className="text-xs text-red-500 font-bold mt-1">{errors.bs.message}</p>}
                                    </div>

                                    {/* ─── حقل heart_rate مع تمييز IoT ─── */}
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <HeartPulse className="w-4 h-4 text-orange-500" />
                                            نبض القلب (HR)
                                            {/* ✅ Badge لو القيمة من Google Fit */}
                                            {prefillData?.auto_filled?.includes('heart_rate') && (
                                                <span className="mr-auto flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                    💓 من Google Fit
                                                </span>
                                            )}
                                        </label>
                                        <input type="number" step="0.1" placeholder="مثال: 80 (بين 40 و 250)"
                                            {...register("heart_rate", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 40 }, max: { value: 250 } })}
                                            className={`w-full border px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none
                                                ${errors.heart_rate ? 'border-red-400 bg-red-50' :
                                                  prefillData?.auto_filled?.includes('heart_rate') ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-400' :
                                                  'border-slate-200 bg-slate-50 focus:ring-orange-500'}`} />
                                        {errors.heart_rate && <p className="text-xs text-red-500 font-bold mt-1">{errors.heart_rate.message}</p>}
                                    </div>

                                    {/* ─── بقية الحقول (نفس الموجودة) ─── */}
                                    {/* ... */}

                                    <Button type="submit" className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-lg font-bold" disabled={predictMutation.isPending}>
                                        {predictMutation.isPending ? "جاري التقييم..." : "فحص مخاطر الولادة المبكرة"}
                                    </Button>
                                </form>
                            )}
                        </div>
                    ) : result ? (
                        // ─── Result Section (نفس الموجود بدون تعديل) ───
                        <div>...</div>
                    ) : null}
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};
```

---

### 3.4 — Frontend: Banner في LabTestsPage بعد OCR

**الملف:** [Front-End/src/pages/patient/medical-file/LabTestsPage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/patient/medical-file/LabTestsPage.tsx)

**أضف Banner بعد نجاح OCR:**

```tsx
export default function LabTestsPage() {
  const navigate = useNavigate();
  const { labTests, isLoading, upload, isUploading, isPolling, currentPollingId, deleteTest } = useLabTests();

  // ✅ تتبع آخر نتيجة ناجحة
  const latestSuccess = labTests?.find(t => t.status === 'completed');
  const pollingTest   = labTests?.find(t => t.id === currentPollingId);

  // ✅ الموديلات التي قد تستفيد من نتائج OCR
  const AI_MODELS_THAT_USE_OCR = [
    { id: 'preeclampsia', name: 'فحص تسمم الحمل', path: '/patient/ai-center/preeclampsia', fields: ['hb (الهيموجلوبين)'] },
    { id: 'preterm',      name: 'الولادة المبكرة',  path: '/patient/ai-center/preterm',       fields: ['bs (سكر الدم)'] },
    { id: 'scbu',         name: 'وحدة SCBU',        path: '/patient/ai-center/scbu',           fields: ['sكر الصائم', 'فيتامين D'] },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          {/* ... نفس الـ header */}
        </div>

        {/* Uploader */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <LabTestUploader onUpload={upload} isUploading={isUploading} />
          {isPolling && pollingTest && (
            <div className="mt-6"><ProcessingStatus status={pollingTest.status} /></div>
          )}
        </div>

        {/* ✅ Banner: ربط نتائج OCR بموديلات الذكاء الاصطناعي */}
        {latestSuccess && (
          <div className="bg-gradient-to-l from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <Beaker size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">نتائجك مستعدة للاستخدام في الفحوصات الذكية</h3>
                <p className="text-sm text-slate-500 mt-1">
                  سيتم تعبئة الحقول المناسبة تلقائياً عند فتح أيٍّ من هذه الفحوصات:
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AI_MODELS_THAT_USE_OCR.map(model => (
                <button key={model.id} onClick={() => navigate(model.path)}
                  className="flex flex-col items-start p-4 bg-white rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all text-right group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 mb-1">{model.name}</span>
                  <span className="text-xs text-slate-400">{model.fields.join(' • ')}</span>
                  <span className="text-xs font-bold text-purple-600 mt-2 flex items-center gap-1">
                    افتح الفحص ←
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div>
          <h2 className="font-bold text-xl text-gray-900 mb-4 px-2">📜 سجل التحاليل المقروءة</h2>
          {/* ... نفس الـ history */}
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 ملخص التغييرات الكاملة

| الملف | نوع التعديل | السبب |
|---|---|---|
| [PublicController.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/PublicController.php) | تعديل [getLifeStage()](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/services/publicService.ts#179-181) | Fallback للمقالات والأطباء |
| [PatientDataCollectorService.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/PatientDataCollectorService.php) | تعديل [collectForPretermBirth()](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/PatientDataCollectorService.php#66-90) + method جديد | جلب heart_rate من DB |
| [LabTestController.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/LabTestController.php) | دالة جديدة `latestForModel()` | Endpoint فلترة OCR |
| [routes/patient.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/routes/patient.php) | Route جديد | تعريف الـ endpoint |
| `aiCenterService.ts` | دالة `getLatestOcrForModel` | استدعاء الـ API |
| [useAiCenter.ts](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/hooks/useAiCenter.ts) | Hook جديد `useOcrPrefillForModel` | React Query wrapper |
| [LifeStagePage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/public/LifeStagePage.tsx) | حذف DUMMY + empty states | عرض احترافي بلا dummy |
| [PretermScreeningPage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/patient/ai-center/PretermScreeningPage.tsx) | دمج OCR + IoT badges | التجربة الكاملة |
| [LabTestsPage.tsx](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/pages/patient/medical-file/LabTestsPage.tsx) | OCR Banner | ربط النتائج بالموديلات |

## ✅ خطة التحقق السريع

```bash
# 1. Backend
GET /api/v1/life-stages/pre-marriage
# يجب أن يرجع related_articles و available_doctors (حتى لو fallback)

GET /api/v1/patient/ai-center/preterm/prefill
# يجب أن heart_rate في fields مش null لو عندها Google Fit

GET /api/v1/patient/lab-tests/latest-for-model/preterm
# يجب أن يرجع { has_data: true, fields: { bs: { value: ... } } }
```
