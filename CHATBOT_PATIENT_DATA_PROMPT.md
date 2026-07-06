# 🤖 برومبت الإيجنت — خطة دمج بيانات المريضة مع الشات بوت (Widad-Tech)

---

## 📌 السياق الكامل للمشروع

أنت خبير تقني متخصص في بناء أنظمة الذكاء الاصطناعي الصحية وتطوير تطبيقات الرعاية الصحية. مهمتك هي تحليل أربعة ملفات بالكامل ثم بناء خطة تفصيلية شاملة لميزة **دمج بيانات المريضة مع الشات بوت** في منصة **وداد-تك (Widad-Tech)**.

---

## 📂 الملفات المطلوب قراءتها (بالترتيب)

اقرأ الملفات التالية بعناية كاملة قبل أي خطوة:

```
[1] codebase_review.md         ← البنية الكاملة للمشروع (43 Model, 54 Controller, 11 Service)
[2] chatbot_system_report.md   ← نظام الشات بوت الحالي (4 بوتات, Queue, Polling, Redis)
[3] chatbot_integration_report.md ← آلية الربط مع Hugging Face Gradio SSE
[4] ai_models_report.md        ← تفاصيل نماذج ML الثلاثة (GDM, Preeclampsia, Preterm Birth)
```

> **تحذير:** لا تبدأ الكتابة قبل قراءة كل الملفات الأربعة. كل قرار في الخطة يجب أن يكون مبنياً على الكود الفعلي الموجود.

---

## 🎯 المهمة

بعد قراءة الملفات الأربعة، أنشئ خطة تفصيلية شاملة لميزة **`chatbot_patient_data_future_plan`** بنفس أسلوب ملف `chatbot_system_report.md` تماماً من حيث:
- مستوى التفصيل (Architecture + API + DB Schema + Code + Flows)
- رسومات Mermaid لتدفق البيانات
- الكود الكامل القابل للتنفيذ (Backend + Frontend)
- خطة تنفيذ مرحلية مع Checklist

---

## ⚙️ المواصفات التقنية الثابتة (قرارات محددة مسبقاً)

| القرار | الاختيار | السبب |
|---|---|---|
| **البيانات المُدمجة** | Profile + ML Predictions + Health Trackers + Medical File + Consultations History | كل بيانات المريضة المتاحة |
| **آلية الحقن** | System-level context message في أول history قبل الإرسال لـ HF | متوافق مع Gradio API الحالي |
| **طبقة الجمع** | `PatientDataCollectorService` جديد (Service منفصل) | فصل المسؤوليات |
| **التخزين المؤقت** | Redis Cache — السياق يُخزَّن 30 دقيقة لنفس المريضة | تقليل DB queries |
| **الخصوصية** | Opt-in فقط عبر toggle في إعدادات الشات | موافقة صريحة |
| **PII** | `ChatbotService::sanitizeForExternalAi()` الموجودة تُطبَّق بعد إضافة السياق | لا تعديل على الأمان الحالي |
| **قاعدة البيانات** | MySQL نفس `widad_project` + جدول `patient_chatbot_preferences` جديد | الحد الأدنى من التعديلات |
| **الباك إند** | Laravel 12 (PHP 8.2+) | نفس إطار العمل الموجود |
| **الفرونت إند** | React 19 + TypeScript | نفس إطار العمل الموجود |
| **Auth** | Sanctum guard: `patient` | نفس نظام المصادقة |
| **البوتات المستفيدة** | `pre_marriage`, `pregnancy`, `motherhood` فقط — `public` يبقى عاماً | منطق طبي صحيح |

---

## 🚫 القيود والمحاذير

### ما يجب **الالتزام به**:
1. **لا تتجاوز `ChatbotService::sanitizeForExternalAi()`** — السياق يمر بالـ sanitize قبل الإرسال لـ HF.
2. **لا ترسل أرقاماً خاماً للمريضة** — استخدم لغة وصفية مثل "خطورة عالية" بدلاً من "87.3%".
3. **البوت العام `public` لا يستقبل بيانات شخصية** — هذه الميزة للبوتات المتخصصة فقط.
4. **Opt-in إلزامي** — إذا لم تُفعّل المريضة الخيار، يعمل الشات بدون بيانات شخصية تماماً.
5. **التزم بـ ApiResponse Trait** الموجود في جميع ردود الـ API.
6. **استخدم نفس نمط Form Requests** للـ Validation.
7. **Audit Log إلزامي** — كل مرة ترسل فيها بيانات المريضة لـ HF يجب تسجيلها في `AuditLog`.
8. **Data Minimization** — كل بوت يرى البيانات ذات الصلة فقط (مثال: بوت الحمل لا يرى تاريخ دورة المريضة إذا كانت حاملاً).
9. **لا تعدّل `ProcessChatbotMessageJob`** الموجود — امتدّ عليه بـ trait أو parameter إضافي.
10. **اكتب migration بتاريخ `2026_06_21`** للتوافق مع ترتيب الـ migrations الموجودة.

---

## 📋 هيكل الخطة المطلوبة

اكتب الخطة بنفس تنسيق `chatbot_system_report.md` مع الأقسام التالية بالكامل:

---

### 1. نظرة عامة (Executive Summary)

اشرح:
- الفكرة الكاملة للميزة وقيمتها للمريضة
- مثال عملي حقيقي على رد مخصص (بالعربية) مقارنةً برد عام
- جدول يوضح ما يرى كل بوت من بيانات:

| البوت | البيانات المتاحة |
|---|---|
| `pre_marriage` | Profile (age, BMI, blood_type, chronic_diseases) |
| `pregnancy` | Profile + Pregnancy tracker + GDM prediction + Preeclampsia prediction + Preterm prediction + Weight trend |
| `motherhood` | Profile + Post-pregnancy data + Mood tracker + Medical file |

---

### 2. تحليل الكود الموجود والتكامل

افحص الكود الحالي وحدد بدقة:

**الموديلات ذات الصلة الموجودة:**
- `User` (patient) — الحقول المتاحة: `name`, `email`, `blood_pressure`، العلاقات مع TrackerModels
- `PatientMedicalFile` — ما الحقول الطبية الموجودة (الأمراض المزمنة، فصيلة الدم، إلخ)
- `Pregnancy` و `PregnancyEntry` — أسبوع الحمل الحالي، تاريخ الولادة المتوقع
- `MoodEntry`, `WeightEntry`, `PeriodCycle`, `FertilityEntry` — آخر إدخال لكل tracker
- `GestationalDiabetesPrediction`, `PreeclampsiaPrediction`, `PretermBirthPrediction` — آخر نتيجة لكل نموذج
- `MlPredictionsHistory` — السجل الموحد للتنبؤات
- `Consultation` — تاريخ الاستشارات + الأطباء المرتبطين
- `Prescription` — الوصفات الطبية الأخيرة

**الـ Services ذات الصلة:**
- `ChatbotService.php` (574 سطر) — نقاط التعديل المطلوبة بالضبط
- `CacheService.php` — كيف يُستدعى لتخزين السياق
- `AuditLogService.php` — كيف يُسجَّل إرسال البيانات

**الـ Controllers الموجودة:**
- `ChatbotController.php` — `sendMessage()` و `sendWidgetMessage()` — ما الذي يتغير فيهم
- ما الـ endpoints التي تحتاج parameter إضافي

**ملاحظات التكامل:**
- وضح بالضبط في أي سطر من `ChatbotService::sendMessage()` يُضاف السياق
- وضح كيف يتعامل `ProcessChatbotMessageJob` مع البيانات الجديدة
- وضح كيف يبقى `useWidgetChatbot` hook يعمل بدون تغيير في الـ Frontend

---

### 3. هيكل قاعدة البيانات

#### الجدول الجديد: `patient_chatbot_preferences`

```sql
patient_chatbot_preferences
├── id              (BigInt, PK, Auto Increment)
├── user_id         (FK → users.id, CASCADE DELETE, UNIQUE)
├── data_access_enabled  (Boolean, Default: false) ← الـ Opt-in الرئيسي
├── share_predictions    (Boolean, Default: true)  ← مشاركة نتائج ML
├── share_trackers       (Boolean, Default: true)  ← مشاركة Health Trackers
├── share_medical_file   (Boolean, Default: false) ← مشاركة الملف الطبي (حساس)
├── share_consultations  (Boolean, Default: false) ← مشاركة تاريخ الاستشارات
├── created_at      (Timestamp)
└── updated_at      (Timestamp)
Indexes: (user_id UNIQUE)
```

اكتب:
- Migration الكامل بتاريخ `2026_06_21`
- الموديل `PatientChatbotPreference` كامل مع:
  - الـ fillable والـ casts
  - الـ relationship `belongsTo User`
  - helper method `isDataAccessEnabled(): bool`
  - static method `getDefaultsFor(User $user): array`

---

### 4. الـ Service الجديد: `PatientDataCollectorService`

اكتب الكلاس كاملاً في `app/Services/Patient/PatientDataCollectorService.php`:

#### 4.1 الـ Method الرئيسية

```php
public function collectChatbotContext(User $user, string $botType): array
```

يجب أن تُرجع هيكل البيانات التالي (مع اختلاف البيانات حسب `$botType`):

```php
// للبوت pregnancy مثلاً:
[
    'context_version' => '1.0',
    'generated_at'    => now()->toISOString(),
    'profile' => [
        'age'              => 28,
        'bmi'              => 30.2,
        'blood_type'       => 'A+',
        'chronic_diseases' => ['PCOS', 'قصور الغدة الدرقية'],
        'allergies'        => ['بنسلين'],
    ],
    'pregnancy' => [
        'is_active'       => true,
        'current_week'    => 24,
        'due_date'        => '2026-09-15',
        'trimester'       => 2,
        'trimester_label' => 'الثلث الثاني',
    ],
    'latest_predictions' => [
        'gdm' => [
            'risk_level'   => 'high',
            'risk_label'   => 'خطورة عالية',
            'date'         => '2026-06-15',
            // لا probability خام هنا
        ],
        'preeclampsia' => [
            'risk_level'   => 'low',
            'risk_label'   => 'خطورة منخفضة',
            'date'         => '2026-06-10',
        ],
        'preterm_birth' => [
            'risk_level'   => 'moderate',
            'risk_label'   => 'خطورة متوسطة',
            'date'         => '2026-06-12',
        ],
    ],
    'trackers' => [
        'latest_mood'    => 'قلق',
        'weight_trend'   => 'increasing',
        'weight_current' => 72.5,
    ],
    'recent_medications' => ['حمض الفوليك', 'فيتامين د'],
]
```

#### 4.2 الـ Methods المساعدة

اكتب الكود الكامل لـ:
- `buildProfileData(User $user): array`
- `buildPregnancyData(User $user): ?array`
- `buildPredictionsData(User $user, string $botType): array`
- `buildTrackersData(User $user, string $botType): array`
- `buildMedicationsData(User $user): array`
- `filterByBotType(array $context, string $botType): array` ← Data Minimization
- `getCachedContext(User $user, string $botType): ?array`
- `cacheContext(User $user, string $botType, array $context): void`

#### 4.3 Cache Strategy

```php
// Cache key format:
"patient_chatbot_ctx:{$user->id}:{$botType}"
// TTL: 30 دقيقة
// Invalidation: عند تحديث أي tracker أو prediction → flush cache
```

وضح أين في Controllers الـ Trackers والـ Predictions تُضاف `Cache::forget()` لإلغاء السياق المخزن.

---

### 5. تعديلات `ChatbotService`

#### 5.1 الـ Method الجديدة: `buildContextualSystemPrompt()`

```php
private function buildContextualSystemPrompt(array $patientContext): string
```

اكتب الكود الكامل لهذه الـ Method التي:
- تحوّل الـ array إلى نص منظم يمكن للبوت فهمه
- تكتب بالعربية
- تتضمن تعليمات للبوت بكيفية استخدام البيانات

**مثال على الناتج:**
```
[PATIENT_CONTEXT - للاستخدام الداخلي فقط]
المريضة: عمر 28 سنة، BMI: 30.2، فصيلة الدم: A+
الحمل: الأسبوع 24 (الثلث الثاني)، موعد الولادة: سبتمبر 2026
تقييمات الذكاء الاصطناعي:
- سكري الحمل: خطورة عالية (فُحصت في 15 يونيو)
- تسمم الحمل: خطورة منخفضة
- الولادة المبكرة: خطورة متوسطة
آخر حالة مزاجية: قلق
المكملات الحالية: حمض الفوليك، فيتامين د
[نهاية السياق]

تعليمات: استخدمي هذه البيانات لتخصيص ردودك. لا تُفصحي عن أرقام احتمالية خام.
```

#### 5.2 تعديل `sendMessage()`

وضح بالضبط كيف يتغير `sendMessage()`:
- إضافة parameter اختياري: `?array $patientContext = null`
- أين يُحقن السياق في `$chatHistory` قبل الإرسال لـ HF
- تأكد أن `sanitizeForExternalAi()` تُطبَّق بعد بناء السياق

#### 5.3 تعديل `callHuggingFace()`

وضح إذا كان هناك أي تعديل مطلوب على آلية SSE أو parsing عند وجود السياق.

---

### 6. تعديلات الـ Controllers

#### 6.1 `ChatbotController::sendMessage()`

اكتب الـ method كاملةً بعد التعديل مع:
- جلب `PatientChatbotPreference` للمستخدم
- إذا `data_access_enabled = false` → يعمل كالمعتاد بدون سياق
- إذا `data_access_enabled = true` → يستدعي `PatientDataCollectorService`
- يستدعي `AuditLogService` لتسجيل إرسال البيانات
- يمرر السياق لـ `ChatbotService::sendMessage()`

#### 6.2 `ChatbotController::sendWidgetMessage()`

نفس المنطق مع ملاحظة أن الـ Widget يعمل Sync — وضح تأثير استدعاء Collector على زمن الاستجابة وكيف يُخففه الـ Cache.

#### 6.3 Endpoints جديدة للـ Preferences

أضف في `ChatbotController`:

```php
// GET  /patient/chatbot/data-preferences    ← جلب إعدادات المريضة
// PUT  /patient/chatbot/data-preferences    ← تحديث الإعدادات
```

اكتب الـ methods كاملةً مع:
- `Form Request`: `UpdateChatbotPreferencesRequest`
- `Resource`: `ChatbotPreferenceResource`

---

### 7. الـ Routes

**في `routes/patient.php`** أضف:
```php
// Chatbot Data Preferences
Route::get('/chatbot/data-preferences',  [ChatbotController::class, 'getDataPreferences']);
Route::put('/chatbot/data-preferences',  [ChatbotController::class, 'updateDataPreferences']);
```

وضح:
- لماذا هذه الـ Routes لا تتعارض مع الـ Routes الموجودة في `patient.php`
- ما الـ Middleware المطلوب (نفس `auth:patient + CheckPatientStatus`)
- ما الـ Rate Limiting المناسب

---

### 8. آلية العمل وتدفق البيانات الكاملة

ارسم رسومات Mermaid لكل السيناريوهات:

#### 8.1 تدفق رسالة المريضة مع بيانات مخصصة (Async + Queue)

```mermaid
sequenceDiagram — ارسمه كاملاً مع كل الخطوات من:
[المريضة ترسل رسالة] → [ChatbotController] → [PatientChatbotPreference check]
→ [PatientDataCollectorService] → [Redis Cache check] → [DB queries]
→ [buildContextualSystemPrompt] → [sanitizeForExternalAi] → [ProcessChatbotMessageJob]
→ [ChatbotService::sendMessage with context] → [HF Gradio SSE] → [Reply] → [Polling]
```

#### 8.2 تدفق الـ Widget مع بيانات (Sync)

```mermaid
sequenceDiagram — نفس المسار مع تسليط الضوء على:
[Widget Sync Request] → [Cache السياق (30 min)] → [Response فوري] → [UI Update]
```

#### 8.3 تدفق تفعيل الميزة للمرة الأولى

```mermaid
sequenceDiagram — يُظهر:
[أول استخدام للشات] → [Privacy Notice Popup] → [المريضة توافق] → [PUT data-preferences]
→ [DB: data_access_enabled = true] → [الرسائل التالية تحمل السياق]
```

#### 8.4 آلية إلغاء صلاحية الـ Cache عند تحديث البيانات

```mermaid
flowchart — يُظهر:
[المريضة تحديث Tracker أو Prediction] → [Controller] → [Cache::forget(patient_chatbot_ctx:*)]
→ [المرة القادمة: CollectorService يجمع من DB مجدداً]
```

---

### 9. تحديث System Prompts

#### 9.1 القسم المضاف لكل بوت

وضح التعديل المطلوب في ملفات `prompts/prompt/`:
- `postpartum_motherhood_prompt.md`
- `pregnancy_prompt.md`
- `pre_marital_prompt.md`

القسم المضاف لكل ملف:
```markdown
## Patient Context Integration

When you receive a [PATIENT_CONTEXT] block in the conversation:
1. Use the data to personalize your responses naturally
2. Reference specific health information when relevant
3. NEVER reveal raw probability numbers — use descriptive language only
4. For high-risk predictions, always emphasize doctor consultation
5. Do not repeat the context back to the patient verbatim
6. If you don't receive a context block, proceed normally without mentioning it

### Data Mapping per bot:
[اكتب التعيين الخاص بكل بوت بناءً على ما يراه من بيانات]
```

---

### 10. الفرونت إند — التعديلات المطلوبة

#### 10.1 TypeScript Types الجديدة: إضافة لـ `src/types/chatbot.ts`

```typescript
export interface ChatbotDataPreferences {
    data_access_enabled: boolean;
    share_predictions:   boolean;
    share_trackers:      boolean;
    share_medical_file:  boolean;
    share_consultations: boolean;
}

export interface ChatbotContextBadge {
    is_active:      boolean;
    data_sources:   string[]; // ['predictions', 'trackers', 'pregnancy']
}
```

#### 10.2 الـ Service: إضافة لـ `src/services/chatbotService.ts`

اكتب:
- `getDataPreferences(): Promise<ChatbotDataPreferences>`
- `updateDataPreferences(prefs: Partial<ChatbotDataPreferences>): Promise<ChatbotDataPreferences>`

#### 10.3 تعديلات `useChatbot.ts`

وضح التعديلات على الـ Hook الموجود بدون كسر الـ API الحالي:
- إضافة `dataPreferences` state
- إضافة `isContextActive` computed boolean
- جلب الـ Preferences عند mount (TanStack Query)
- Hook جديد: `useChatbotPreferences()` — منفصل لإدارة الإعدادات

#### 10.4 المكونات الجديدة

**`src/components/chatbot/PrivacyConsentModal.tsx`:**
- يظهر مرة واحدة فقط للمستخدمين الجدد
- يشرح ما سيُشارَك بلغة بسيطة
- زر "السماح" + زر "لاحقاً"
- بعد الموافقة → `PUT data-preferences` → لا يظهر مجدداً

**`src/components/chatbot/DataContextBadge.tsx`:**
- شارة صغيرة تظهر في `ChatHeader` عندما تكون الميزة مفعّلة
- تُظهر عند hover: "المساعد يستخدم بياناتك الصحية لتخصيص الردود"
- رابط لصفحة الإعدادات

**`src/components/chatbot/ChatbotPrivacySettings.tsx`:**
- Component كامل للإعدادات يُدمج في `ChatHeader` أو settings dropdown
- Toggles لكل نوع بيانات: predictions / trackers / medical_file / consultations
- زر "إلغاء تفعيل الميزة كاملاً"
- حالة Loading أثناء الحفظ

#### 10.5 دمج في الصفحات الموجودة

وضح بالكود كيف تُدمج المكونات الجديدة في:
- `src/components/chatbot/ChatWindow.tsx` — إضافة `PrivacyConsentModal` و `DataContextBadge`
- `src/components/chatbot/ChatHeader.tsx` — إضافة زر إعدادات البيانات
- `src/pages/patient/ChatbotPage.tsx` — إضافة settings panel جانبي (اختياري)

---

### 11. الأمان وحماية الخصوصية

| الحماية | التفاصيل |
|---|---|
| **Opt-in صريح** | لا يُرسَل أي بيانات بدون موافقة `data_access_enabled = true` |
| **PII Sanitization** | `sanitizeForExternalAi()` تُطبَّق على السياق كله قبل HF |
| **No Raw Probabilities** | `buildContextualSystemPrompt()` تُحوّل الأرقام لنصوص |
| **Data Minimization** | `filterByBotType()` تُرسل فقط البيانات ذات الصلة |
| **Audit Trail** | `AuditLogService` يسجل كل إرسال: `user_id, bot_type, data_sources, timestamp` |
| **Cache Isolation** | Cache key يتضمن `user_id` — لا تداخل بين المريضات |
| **Bot Restriction** | البوت العام `public` محمي برمجياً من تلقي أي سياق |
| **Right to Erasure** | `DELETE /patient/chatbot/messages` الموجود يحذف الـ Preferences أيضاً |

---

### 12. معالجة الأخطاء

#### 12.1 أخطاء الباك إند

| الحالة | الكود | الرسالة العربية |
|---|---|---|
| Collector يفشل في جمع البيانات | Graceful Fallback | يكمل بدون سياق — لا يفشل الطلب |
| ML prediction لا توجد | تُتجاهَل بهدوء | لا يظهر "predictions" في السياق |
| Cache unavailable (Redis down) | Fallback to DB | يستمر بدون cache |
| `sanitizeForExternalAi()` تُعدّل السياق | متوقع ومقصود | لا error |
| HF يرفض الطلب بسبب طول السياق | 503 مع retry | `"خدمة الذكاء الاصطناعي غير متاحة مؤقتاً"` |

#### 12.2 أخطاء الفرونت إند

- فشل جلب الـ Preferences → يعمل الشات كالمعتاد بدون badge
- فشل تحديث الـ Preferences → Toast error + rollback toggle
- `PrivacyConsentModal` يفشل في الحفظ → يُعيد المحاولة مرة واحدة فقط

---

### 13. التأثير على الأداء والـ Benchmarks

اكتب تحليلاً للتأثير على الأداء:

| السيناريو | الوقت المضاف | الحل |
|---|---|---|
| أول طلب (Cache Miss) | +200-400ms (DB queries) | Redis Cache بعدها |
| الطلبات التالية (Cache Hit) | +5ms فقط | Redis lookup |
| بناء `buildContextualSystemPrompt()` | +10ms | CPU فقط |
| `sanitizeForExternalAi()` على السياق | +15ms | Regex على نص أطول |
| إجمالي مع Cache Hit | +30ms | مقبول |
| إجمالي بدون Cache | +430ms | مقبول نظراً للـ Queue |

**مقارنة بالنظام الحالي:**
- Widget (Sync): التأثير أكبر → الـ Cache ضروري جداً
- Full Page (Async + Queue): التأثير مقبول — يظهر فرق الـ 400ms في وقت الانتظار

---

### 14. خطة التنفيذ المرحلية

قسّم التنفيذ لمراحل واضحة مع Checklist كامل:

#### المرحلة A — قاعدة البيانات والـ Config (~1 ساعة)
```
□ Migration: patient_chatbot_preferences (2026_06_21)
□ Model: PatientChatbotPreference
□ Seeder: PatientChatbotPreferenceSeeder (بيانات تجريبية)
□ معيار النجاح: php artisan migrate يعمل بدون أخطاء
```

#### المرحلة B — PatientDataCollectorService (~2 ساعة)
```
□ Service Class كامل مع كل الـ Methods
□ Unit Tests: ChatbotDataCollectorTest (Pest)
□ Cache invalidation في Tracker Controllers
□ معيار النجاح: collectChatbotContext() تُرجع هيكل البيانات الصحيح
```

#### المرحلة C — تعديلات ChatbotService (~1.5 ساعة)
```
□ buildContextualSystemPrompt() method
□ تعديل sendMessage() signature
□ Unit Tests: ChatbotServiceContextTest
□ معيار النجاح: السياق يظهر في SSE request لـ HF
```

#### المرحلة D — Controller + Routes + Form Requests (~1.5 ساعة)
```
□ تعديل ChatbotController::sendMessage()
□ تعديل ChatbotController::sendWidgetMessage()
□ getDataPreferences() + updateDataPreferences()
□ UpdateChatbotPreferencesRequest
□ ChatbotPreferenceResource
□ Routes في patient.php
□ AuditLog integration
□ Feature Tests: ChatbotContextTest (Pest)
□ معيار النجاح: API يعمل end-to-end مع Postman
```

#### المرحلة E — تحديث System Prompts (~0.5 ساعة)
```
□ إضافة Patient Context Integration section لـ 3 ملفات prompts
□ RAG: رفع الملفات المحدثة عبر Admin Panel
□ معيار النجاح: البوت يُشير لبيانات المريضة في ردوده
```

#### المرحلة F — الفرونت إند (~3 ساعات)
```
□ Types في chatbot.ts
□ chatbotService.ts: إضافة Preferences endpoints
□ useChatbotPreferences() hook
□ PrivacyConsentModal component
□ DataContextBadge component
□ ChatbotPrivacySettings component
□ دمج في ChatWindow.tsx و ChatHeader.tsx
□ Frontend Tests: Vitest
□ معيار النجاح: المريضة تفعّل الميزة وترى الـ badge
```

#### المرحلة G — الاختبار النهائي والتوثيق (~1 ساعة)
```
□ Integration Test: رسالة كاملة من UI إلى HF مع سياق
□ Privacy Test: التأكد من عدم إرسال بيانات بدون Opt-in
□ Performance Test: قياس زمن الاستجابة مع وبدون Cache
□ معيار النجاح: كل الاختبارات تعمل ✅
```

**الإجمالي المتوقع: ~10.5 ساعة**

---

### 15. الاختبارات

#### 15.1 Backend Tests (Pest PHP)

```php
// Unit Tests:
- test('collectChatbotContext returns correct structure for pregnancy bot')
- test('collectChatbotContext filters data by bot type')
- test('buildContextualSystemPrompt never includes raw probabilities')
- test('context is cached after first collection')
- test('cache is invalidated when tracker is updated')
- test('sanitizeForExternalAi is applied to context before HF call')

// Feature Tests:
- test('sendMessage with data_access_enabled sends context to HF')
- test('sendMessage with data_access_enabled false sends no context')
- test('public bot never receives patient context regardless of preference')
- test('getDataPreferences returns patient preferences')
- test('updateDataPreferences saves and returns updated preferences')
- test('audit log is created when patient data is sent to HF')
- test('context gracefully handles missing predictions')
- test('context gracefully handles patient with no active pregnancy')
```

#### 15.2 Frontend Tests (Vitest)

```typescript
- test('PrivacyConsentModal shows on first chatbot use')
- test('PrivacyConsentModal does not show if preferences already set')
- test('DataContextBadge shows when data_access_enabled is true')
- test('DataContextBadge hidden when data_access_enabled is false')
- test('useChatbotPreferences fetches on mount')
- test('toggle update calls updateDataPreferences and optimistic update')
- test('ChatbotPrivacySettings renders all toggles')
```

---

### 16. إدارة الأدمن

وضح التعديلات المطلوبة على **`AdminChatbotController`** و **`ChatbotStatsPage.tsx`**:

#### 16.1 إحصاءات جديدة في `GET /admin/chatbot/stats`

```php
// إضافة للـ response الحالي:
'personalized_context' => [
    'enabled_users_count'      => ..., // عدد المريضات اللواتي فعّلن الميزة
    'messages_with_context'    => ..., // رسائل أُرسل معها سياق اليوم
    'cache_hit_rate'           => ..., // % الطلبات من الـ Cache
    'most_shared_data_type'    => ..., // 'predictions' / 'trackers'
]
```

#### 16.2 تعديل صفحة `ChatbotStatsPage.tsx`

إضافة Card جديد يعرض إحصاءات السياق المخصص مع رسم بياني (Recharts).

---

### 17. Rollout Plan والتراجع (Rollback)

| الحالة | الإجراء |
|---|---|
| **Feature Flag** | `config('chatbot.patient_context_enabled', false)` — تفعيل تدريجي |
| **Phase A Rollout** | Profile فقط بدون Predictions |
| **Phase B Rollout** | + Predictions |
| **Phase C Rollout** | + Trackers |
| **Phase D Rollout** | + Medical File + Consultations |
| **Rollback** | تغيير `patient_context_enabled` → false في `.env` فوراً بدون migration |

---

## 🔍 تعليمات إضافية للإيجنت

1. **ابدأ بتحليل الكود** — افحص الملفات الأربعة قبل كتابة أي سطر.

2. **لا تخترع موديلات** — `GestationalDiabetesPrediction`, `PreeclampsiaPrediction`, `PretermBirthPrediction` موجودة بالفعل. افحص حقولها الفعلية واستخدمها.

3. **اتبع آلية الـ Cache الموجودة** — `CacheService.php` موجود. استخدمه كما يُستدعى في `ChatbotService`.

4. **اكتب الكود الكامل** — لا ملخصات، لا pseudocode. كل Method يجب أن تكون قابلة للنسخ والتشغيل مباشرةً.

5. **تحقق من الـ `bot_type`** — عند `public` يجب إرجاع `[]` فوراً من `collectChatbotContext()` بدون أي DB query.

6. **Naming Convention** — snake_case في PHP، camelCase في TypeScript، بنفس أسلوب المشروع.

7. **لا تنسَ `$this->apiResponse()`** — كل ردود الـ API تستخدم `ApiResponse Trait` الموجود.

8. **الـ `UploadChatbotDocumentJob`** موجود — استخدمه مرجعاً لأسلوب كتابة Jobs في المشروع.

9. **لا تُعدّل `CleanupOldChatMessagesJob`** — أضف حذف الـ Preferences منفصلاً إذا لزم.

10. **حالة عدم وجود بيانات** — إذا لم تكن للمريضة أي predictions أو trackers بعد، يعمل الشات كالمعتاد بدون سياق (Graceful Degradation).

---

## ✅ معيار نجاح الخطة

الخطة ناجحة إذا:
- [ ] مطور واحد يستطيع تطبيقها من البداية للنهاية دون أسئلة إضافية
- [ ] كل ملف مكتوب بالكامل وجاهز للنسخ المباشر
- [ ] لا تعارض مع أي كود موجود في المشروع
- [ ] البوت العام `public` محمي تماماً من تلقي أي بيانات شخصية
- [ ] الميزة تعمل بـ Opt-in صريح فقط — لا بيانات تذهب لـ HF بدون إذن
- [ ] `sanitizeForExternalAi()` تُطبَّق دائماً قبل أي إرسال خارجي
- [ ] الـ Cache يُقلل التأثير على الـ Widget Sync إلى < 30ms
- [ ] الأرقام الخام لنماذج ML لا تظهر في أي رد للمريضة أبداً
- [ ] الـ Audit Log يسجل كل إرسال لبيانات خارج المنصة
- [ ] Rollback ممكن في < 5 دقائق بتغيير Feature Flag فقط

---

*هذا البرومبت مبني على تحليل كامل لأربعة ملفات من مشروع وداد-تك — نسخة يونيو 2026*
*الملفات المُحلَّلة: codebase_review | chatbot_system_report | chatbot_integration_report | ai_models_report*
