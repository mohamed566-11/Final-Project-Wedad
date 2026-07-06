# خطة الاختبارات الشاملة — وداد-تك
> **المشروع:** Widad-Tech — منصة صحة المرأة الرقمية  
> **الإطار:** Laravel 12 + Pest PHP 4  
> **تاريخ الخطة:** 2026-06-29  
> **الحجم:** 52 Model · 67 Controller · 17 Service · 9 Jobs

---

## القسم 6 — تحليل الاختبارات الموجودة (يُقرأ أولاً)

> [!IMPORTANT]
> ابدأ بهذا القسم حتى تعرف ما هو موجود قبل إنشاء أي ملف جديد.

### الاختبارات الموجودة — 18 Feature + 3 Unit

#### Unit Tests (3 ملفات)

| الملف | يغطي | الحالة |
|---|---|---|
| [Unit/PeriodAnalyticsTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Unit/PeriodAnalyticsTest.php) | `PeriodAnalyticsService` — weighted avg, stdDev, confidence, health score, fertility score, prediction range | ✅ **شامل جداً — لا يحتاج تعديل** |
| [Unit/ChatbotServiceTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Unit/ChatbotServiceTest.php) | `ChatbotService` — parseSSEResponse, sanitizeForExternalAi (PII), getBotTypeFromStage, Bot Toggle Cache | ✅ **شامل — لا يحتاج تعديل** |
| [Unit/ExampleTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Unit/ExampleTest.php) | مثال فارغ | 🗑️ **يُحذف أو يُستبدل** |

#### Feature Tests (18 ملف / 15 حقيقي + 3 فارغة/بسيطة)

| الملف | يغطي | الحالة |
|---|---|---|
| [Feature/Chatbot/PatientSendMessageTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/PatientSendMessageTest.php) | POST /chatbot/message (auth patient)، Queue dispatch، DB save | ✅ جيد |
| [Feature/Chatbot/GuestSendMessageTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/GuestSendMessageTest.php) | POST /chatbot/public/message، validation | ✅ جيد |
| [Feature/Chatbot/PatientMessageStatusTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/PatientMessageStatusTest.php) | GET /chatbot/messages/{id}/status — pending/ready/failed | ✅ جيد |
| [Feature/Chatbot/GuestMessageStatusSecurityTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/GuestMessageStatusSecurityTest.php) | أمان endpoint الـ guest status | ✅ جيد |
| [Feature/Chatbot/SessionManagementTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/SessionManagementTest.php) | GET sessions, rename, delete, reset, getMessages | ✅ جيد |
| [Feature/Chatbot/BotTypeIsolationTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/BotTypeIsolationTest.php) | عزل البوتات حسب نوعها | ✅ جيد |
| [Feature/Chatbot/CacheTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/CacheTest.php) | Cache للردود | ✅ جيد |
| [Feature/Chatbot/QueueJobTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/QueueJobTest.php) | Queue dispatch لـ ProcessChatbotMessageJob | ✅ جيد |
| [Feature/Chatbot/AdminChatbotTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/AdminChatbotTest.php) | Admin chatbot management endpoints | ✅ جيد |
| [Feature/Chatbot/RateLimitTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/RateLimitTest.php) | Rate limiting على chatbot endpoints | ✅ جيد |
| [Feature/Chatbot/EndToEndTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Chatbot/EndToEndTest.php) | End-to-end chatbot flow | ⚠️ **يحتاج توسيع** |
| [Feature/ChatbotTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/ChatbotTest.php) | Chatbot عام — public/auth messages, sessions, delete | ✅ جيد (مكرر مع مجلد Chatbot) |
| [Feature/ChatbotContextTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/ChatbotContextTest.php) | Context test بسيط جداً | 🔴 **ناقص — يحتاج توسيع كبير** |
| [Feature/Consultations/ConsultationApiTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Consultations/ConsultationApiTest.php) | list, book, cancel<24h, complete | ⚠️ **ناقص — يفتقد payment، prescription، review** |
| [Feature/PatientDataCollectorTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/PatientDataCollectorTest.php) | PatientDataCollectorService — public bot, disabled flag, cache invalidation, no raw probability | ✅ جيد |
| [Feature/RouteSecurityTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/RouteSecurityTest.php) | تأكد من وجود auth:patient وauth:doctor على كل Routes | ✅ جيد |
| [Feature/TrackerProfileSyncTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/TrackerProfileSyncTest.php) | مزامنة pregnancy entry مع profile و weight tracker | ✅ جيد |
| [Feature/IotIntegrationTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/IotIntegrationTest.php) | guest 401، auth-url، metrics disconnected | ⚠️ **ناقص — يفتقد Google Fit sync و OAuth flow** |
| [Feature/Notifications/NotificationServiceTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Notifications/NotificationServiceTest.php) | NotificationService unit-style tests | ✅ جيد |
| [Feature/Notifications/NotificationControllerTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Notifications/NotificationControllerTest.php) | API endpoints للإشعارات | ⚠️ **يحتاج push subscription tests** |
| [Feature/Notifications/SendBulkNotificationJobTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/Notifications/SendBulkNotificationJobTest.php) | Job الإشعارات الجماعية | ✅ جيد |
| [Feature/ExampleTest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Feature/ExampleTest.php) | فارغ | 🗑️ **يُحذف** |

### ملخص الفجوات الكبرى 🔴

```
❌ لا يوجد أي اختبار للـ Auth (register, login, OTP, logout) لأي guard
❌ لا يوجد اختبار للـ Health Trackers (weight, mood, period, fertility)
❌ لا يوجد اختبار للـ Pregnancy flow
❌ لا يوجد اختبار للـ AI Predictions (GDM, PE, Preterm, SCBU)
❌ لا يوجد اختبار للـ Lab Tests OCR
❌ لا يوجد اختبار للـ Payment webhook (Paymob callback + HMAC)
❌ لا يوجد اختبار للـ Prescription flow
❌ لا يوجد اختبار للـ Admin Panel (user management, analytics, financials, CMS)
❌ لا يوجد اختبار للـ Doctor Portal (profile, schedule, financials, AI tools)
❌ لا يوجد Integration tests
❌ لا يوجد RBAC tests للـ Admin permissions
```

---

## القسم 1 — إعداد بيئة الاختبار

### 1.1 إعداد `phpunit.xml`

```xml
<!-- Back-end/phpunit.xml — التعديلات المطلوبة -->
<php>
    <!-- قاعدة بيانات معزولة في الذاكرة -->
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
    
    <!-- تعطيل الـ Cache الحقيقي -->
    <env name="CACHE_DRIVER" value="array"/>
    
    <!-- Queue synchronous في الاختبارات -->
    <env name="QUEUE_CONNECTION" value="sync"/>
    
    <!-- Mail fake -->
    <env name="MAIL_MAILER" value="array"/>
    
    <!-- تعطيل Redis الحقيقي -->
    <env name="REDIS_CLIENT" value="array"/>
    
    <!-- Session في الذاكرة -->
    <env name="SESSION_DRIVER" value="array"/>
    
    <!-- مفاتيح VAPID وهمية للتشغيل المحلي -->
    <env name="VAPID_PUBLIC_KEY" value="test_public_key"/>
    <env name="VAPID_PRIVATE_KEY" value="test_private_key"/>
</php>
```

**ملاحظة مهمة:** الـ `RefreshDatabase` حالياً **معطل** في [Pest.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/Pest.php) (سطر 15 مُعلَّق). يجب أن تضيف `uses(RefreshDatabase::class)` في كل ملف test بشكل صريح، أو تفعله globally.

**متى تستخدم RefreshDatabase vs DatabaseTransactions:**
- `RefreshDatabase` — للـ Feature Tests التي تحتاج Migrations كاملة (الأكثر شيوعاً)
- `DatabaseTransactions` — للاختبارات السريعة التي لا تغير الـ Schema
- **لا تستخدم أياً منهما** في الـ Unit Tests التي لا تلمس DB

### 1.2 الـ Factories الموجودة والمطلوبة

#### موجودة بالفعل ✅
```
UserFactory, DoctorFactory, PatientFactory (= UserFactory)
ConsultationFactory (مع states: pending/confirmed/completed)
ConsultationReviewFactory
PrescriptionFactory
PregnancyFactory
GestationalDiabetesPredictionFactory
PreeclampsiaPredictionFactory
PretermBirthPredictionFactory
ScbuAdmissionPredictionFactory
AiChatMessageFactory
PaymentFactory
PeriodCycleFactory, MoodEntryFactory, WeightEntryFactory
UserProfileFactory
ArticleFactory, LifeStageFactory
```

#### مطلوب إنشاؤها 🔴
```
AdminFactory                  ← Admin مع Role
LabTestResultFactory          ← نتائج OCR
ChatbotDocumentFactory        ← مستندات RAG
PatientChatbotPreferenceFactory
FertilityEntryFactory
PregnancyKickSessionFactory
PregnancyMedicationFactory
DoctorWorkingHourFactory      ← مع time slots
PayoutRequestFactory          ← طلبات سحب
DoctorJoinRequestFactory      ← طلبات انضمام الأطباء
NotificationFactory
PushSubscriptionFactory
ConsultationMessageFactory    ← رسائل الشات الداخلي
PatientMedicalFileFactory
```

### 1.3 الـ Traits المشتركة المطلوبة

```
tests/Traits/
├── ActingAsPatient.php        ← createVerifiedPatient() + actingAsPatient()
├── ActingAsDoctor.php         ← createVerifiedDoctor() + actingAsDoctor()
├── ActingAsAdmin.php          ← createAdmin(permissions[]) + actingAsAdmin()
├── FakeHuggingFace.php        ← Http::fake() لكل HF endpoints
├── FakePaymob.php             ← Http::fake() لـ Paymob + HMAC helper
└── FakeGoogleFit.php          ← Http::fake() لـ Google Fit API
```

**مثال ActingAsPatient:**
```php
trait ActingAsPatient {
    protected function createVerifiedPatient(array $attrs = []): User {
        $user = User::factory()->create(array_merge([
            'is_active' => true,
            'email_verified_at' => now(),
        ], $attrs));
        UserProfile::factory()->create(['user_id' => $user->id]);
        return $user;
    }
    protected function actingAsPatient(array $attrs = []) {
        return $this->actingAs($this->createVerifiedPatient($attrs), 'patient');
    }
}
```

### 1.4 Helper Functions في [tests/TestCase.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/tests/TestCase.php)

```php
// إضافة للـ TestCase base class
protected function createPatientWithProfile(array $attrs = []): User
protected function createDoctorWithSchedule(array $workingHours = []): Doctor
protected function createConfirmedConsultation(User $patient, Doctor $doctor): Consultation
protected function createAdminWithPermission(Permission ...$permissions): Admin
protected function fakeHuggingFaceOcrResponse(array $results): void
protected function fakePaymobWebhook(bool $success, string $hmac = null): array
```

---

## القسم 2 — خريطة كاملة لـ Test Files

```
tests/
├── Unit/
│   ├── Auth/
│   │   ├── OtpServiceTest.php                    🔴 جديد
│   │   └── SanctumTokenTest.php                  🔴 جديد
│   ├── Patient/
│   │   ├── PeriodAnalyticsServiceTest.php         ✅ موجود (كامل)
│   │   ├── PatientDataCollectorServiceTest.php    ⚠️ موجود (يحتاج توسيع)
│   │   ├── BmiCalculationTest.php                 🔴 جديد
│   │   └── ChatbotContextBuilderTest.php          🔴 جديد
│   ├── Consultation/
│   │   ├── ConsultationServiceTest.php            🔴 جديد
│   │   ├── SlotAvailabilityTest.php               🔴 جديد
│   │   └── ConflictCheckTest.php                  🔴 جديد
│   ├── AI/
│   │   ├── ChatbotServiceTest.php                 ✅ موجود (كامل)
│   │   ├── LabTestOcrServiceTest.php              🔴 جديد
│   │   └── AiPredictionServiceTest.php            🔴 جديد
│   ├── Finance/
│   │   └── PaymobHmacTest.php                     🔴 جديد
│   └── Notifications/
│       ├── NotificationServiceTest.php            ✅ موجود
│       └── WebPushServiceTest.php                 🔴 جديد
│
├── Feature/
│   ├── Auth/
│   │   ├── PatientAuthTest.php                    🔴 جديد
│   │   ├── DoctorAuthTest.php                     🔴 جديد
│   │   ├── AdminAuthTest.php                      🔴 جديد
│   │   └── RbacTest.php                           🔴 جديد
│   ├── Patient/
│   │   ├── HealthTrackersTest.php                 🔴 جديد
│   │   ├── PregnancyTest.php                      🔴 جديد
│   │   ├── AiPredictionTest.php                   🔴 جديد
│   │   ├── Chatbot/ (11 ملف)                      ✅ موجودة (كاملة)
│   │   ├── ChatbotContextTest.php                 ⚠️ يحتاج توسيع
│   │   ├── LabTestTest.php                        🔴 جديد
│   │   └── IotIntegrationTest.php                 ⚠️ يحتاج توسيع
│   ├── Consultation/
│   │   ├── ConsultationApiTest.php                ⚠️ يحتاج توسيع
│   │   ├── PaymentCallbackTest.php                🔴 جديد
│   │   ├── SessionTest.php                        🔴 جديد
│   │   ├── MedicalFileTest.php                    🔴 جديد
│   │   └── ReviewTest.php                         🔴 جديد
│   ├── Doctor/
│   │   ├── DoctorProfileTest.php                  🔴 جديد
│   │   ├── DoctorScheduleTest.php                 🔴 جديد
│   │   ├── DoctorAiToolsTest.php                  🔴 جديد
│   │   └── DoctorFinancialTest.php                🔴 جديد
│   ├── Admin/
│   │   ├── UserManagementTest.php                 🔴 جديد
│   │   ├── AnalyticsTest.php                      🔴 جديد
│   │   ├── ChatbotManagementTest.php              ✅ موجود (AdminChatbotTest)
│   │   ├── FinancialTest.php                      🔴 جديد
│   │   └── CmsTest.php                            🔴 جديد
│   ├── Notifications/
│   │   ├── NotificationControllerTest.php         ⚠️ يحتاج توسيع
│   │   ├── PushNotificationTest.php               🔴 جديد
│   │   └── SendBulkNotificationJobTest.php        ✅ موجود
│   └── Security/
│       ├── RouteSecurityTest.php                  ✅ موجود
│       └── CrossGuardAccessTest.php               🔴 جديد
│
└── Integration/
    ├── FullBookingFlowTest.php                    🔴 جديد
    ├── ChatbotWithContextTest.php                 🔴 جديد
    ├── LabTestOcrFlowTest.php                     🔴 جديد
    └── PaymentToConfirmationTest.php              🔴 جديد
```

---

## القسم 3 — تفاصيل كل Test File

### 🔐 Auth Tests

---

#### `Feature/Auth/PatientAuthTest.php`
**Traits:** `RefreshDatabase`  
**setUp:** Config للـ OTP، Mail::fake()

```
✓ it('registers a new patient with valid data')
    POST /api/v1/patient/auth/register
    → 201, DB has user, Mail sent (OTP)

✓ it('fails registration with duplicate email')
    → 422, validation error on email

✓ it('fails registration with invalid phone format')
    → 422, validation error on phone

✓ it('logs in with correct credentials')
    POST /api/v1/patient/auth/login
    → 200, returns token, user data

✓ it('returns 401 for wrong password')
    → 401 or 422

✓ it('returns 401 for non-existent email')
    → 401

✓ it('cannot login with soft-deleted account')
    User::factory()->trashed()->create()
    → 401 or 403

✓ it('verifies OTP successfully')
    POST /api/v1/patient/auth/email/verify
    → 200, email_verified_at updated

✓ it('rejects expired OTP')
    → 422 or 400

✓ it('rejects incorrect OTP')
    → 422 or 400

✓ it('logs out and invalidates token')
    POST /api/v1/patient/auth/logout
    → 200, token deleted from DB

✓ it('throttles login after 5 attempts')
    6 requests in < 1 min → 429

✓ it('resets password via OTP flow')
    POST /password/email + POST /password/reset
    → 200, password changed

Mocks: Mail::fake(), Cache::fake() (for OTP)
```

---

#### `Feature/Auth/DoctorAuthTest.php`
**Traits:** `RefreshDatabase`

```
✓ it('doctor can login with approved status')
✓ it('doctor cannot login with pending status')
✓ it('doctor cannot login with rejected status')
✓ it('doctor token has doctor guard')
    actingAs($doctor, 'doctor') → GET /api/v1/doctor/data → 200
✓ it('doctor token cannot access patient routes')
    → 401 or 403
✓ it('unverified doctor cannot access DoctorVerified routes')
    Doctor with verification_status='pending'
    → 403 on /api/v1/doctor/consultations
```

---

#### `Feature/Auth/AdminAuthTest.php`
**Traits:** `RefreshDatabase`

```
✓ it('admin can login successfully')
✓ it('inactive admin cannot login')
✓ it('admin token has admin guard')
✓ it('admin token cannot access patient routes')
✓ it('admin token cannot access doctor routes')
```

---

#### `Feature/Auth/RbacTest.php`
**Traits:** `RefreshDatabase`

```
✓ it('admin with view_analytics can access dashboard')
    Admin + Role(view_analytics) → GET /api/v1/admin/dashboard/stats → 200

✓ it('admin without view_analytics gets 403 on dashboard')
    Admin + Role(no permissions) → GET /api/v1/admin/dashboard/stats → 403

✓ it('admin with manage_users can toggle patient status')
✓ it('admin without manage_users gets 403 on toggle')
✓ it('admin with manage_financials can access financials')
✓ it('admin without manage_financials gets 403')
✓ it('admin with manage_chatbot can access chatbot management')
✓ it('admin with process_payouts can process payout requests')
✓ it('admin without process_payouts gets 403 on payout')
```

---

#### `Feature/Security/CrossGuardAccessTest.php`
**Traits:** `RefreshDatabase`

```
✓ it('patient token rejected on doctor routes')
✓ it('patient token rejected on admin routes')  
✓ it('doctor token rejected on patient protected routes')
✓ it('doctor token rejected on admin routes')
✓ it('admin token rejected on patient routes')
✓ it('admin token rejected on doctor routes')
✓ it('unauthenticated request gets 401 on all protected routes')
```

---

### 🩺 Patient Core Flow Tests

---

#### `Feature/Patient/HealthTrackersTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient`  
**setUp:** verified patient + profile

```
// Weight Tracker
✓ it('stores a weight entry')
    POST /api/v1/patient/weight → 201, DB has entry

✓ it('returns weight history with trend')
    3 entries → GET /api/v1/patient/weight → 200, data.trend field present

✓ it('deletes a weight entry')
    DELETE /api/v1/patient/weight/{id} → 200, DB missing

// Mood Tracker
✓ it('stores a mood entry')
    POST /api/v1/patient/mood → 201

✓ it('returns mood analytics')
    GET /api/v1/patient/mood/analytics → 200, structure check

✓ it('validates mood value range')
    mood: 6 (out of 1-5) → 422

// Period Tracker
✓ it('starts a new period cycle')
    POST /api/v1/patient/period → 201

✓ it('ends an active period cycle')
    PUT /api/v1/patient/period/{id}/end → 200

✓ it('returns period predictions')
    GET /api/v1/patient/period/predictions → 200

✓ it('returns period analytics')
    GET /api/v1/patient/period/analytics → 200

// Fertility Tracker
✓ it('stores a fertility entry')
    POST /api/v1/patient/fertility → 201

✓ it('returns fertile window calculation')
    GET /api/v1/patient/fertility/fertile-window → 200

// Trackers Summary
✓ it('returns comprehensive trackers summary')
    GET /api/v1/patient/trackers/summary → 200, all sections present

Mocks: none (pure DB operations)
```

---

#### `Feature/Patient/PregnancyTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient`

```
✓ it('starts a new pregnancy')
    POST /api/v1/patient/pregnancy/start
    → 201, DB has pregnancy with is_active=true

✓ it('returns current active pregnancy')
    GET /api/v1/patient/pregnancy/current → 200

✓ it('returns null when no active pregnancy')
    → 200, data: null

✓ it('stores a pregnancy entry with weight sync')
    POST /api/v1/patient/pregnancy/entry
    → 201, weight_entries updated, user_profiles updated

✓ it('returns week info for current week')
    GET /api/v1/patient/pregnancy/week/{n} → 200

✓ it('adds a medication to pregnancy')
    POST /api/v1/patient/pregnancy/medications → 201

✓ it('toggles medication taken status')
    POST /api/v1/patient/pregnancy/medications/{id}/toggle → 200

✓ it('records a kick counter session')
    POST /api/v1/patient/pregnancy/kicks → 201

✓ it('lists kick sessions')
    GET /api/v1/patient/pregnancy/kicks → 200

✓ it('completes a pregnancy')
    PUT /api/v1/patient/pregnancy/{id}/complete → 200, is_active=false
```

---

#### `Feature/Patient/AiPredictionTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient, FakeHuggingFace`

```
✓ it('predicts GDM risk with valid input')
    Http::fake() → POST /api/v1/patient/ai-center/gdm/predict
    → 200, data.risk_level present, DB has GestationalDiabetesPrediction

✓ it('returns 422 for GDM with missing fields')
    → 422, validation errors

✓ it('predicts preeclampsia risk')
    Post /api/v1/patient/ai-center/preeclampsia/predict → 200

✓ it('predicts preterm birth risk')
    → 200

✓ it('predicts SCBU admission risk')
    → 200

✓ it('returns prediction history')
    GET /api/v1/patient/ai-center/history → 200, list of predictions

✓ it('returns single prediction detail')
    GET /api/v1/patient/ai-center/predictions/{id} → 200

✓ it('returns prefill data from patient profile')
    GET /api/v1/patient/ai-center/gdm/prefill → 200

✓ it('handles HF timeout gracefully')
    Http::fake() → timeout → 500 or 503 with human message

✓ it('handles HF error response gracefully')
    Http::fake() → 500 → graceful error

Mocks:
- Http::fake(['*/api/predict*' => Http::response(['label' => 'High Risk', 'confidences' => [...]], 200)])
- Http::fake() for timeout: Http::sequence()->pushStatus(504)
```

---

#### `Feature/Patient/LabTestTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient, FakeHuggingFace`  
**setUp:** Storage::fake('public')

```
✓ it('uploads a lab test image')
    POST /api/v1/patient/lab-tests (multipart/form-data)
    → 201, DB has LabTestResult with status=pending
    Queue::assertPushed(ProcessLabTestJob)

✓ it('rejects non-image file type')
    → 422

✓ it('returns lab test list')
    GET /api/v1/patient/lab-tests → 200

✓ it('returns single lab test details')
    GET /api/v1/patient/lab-tests/{id} → 200

✓ it('polls status as pending before processing')
    GET /api/v1/patient/lab-tests/{id}/status → 200, status=pending

✓ it('polls status as ready after job completion')
    Manually set status=ready in DB
    GET /api/v1/patient/lab-tests/{id}/status → 200, status=ready

✓ it('deletes a lab test')
    DELETE /api/v1/patient/lab-tests/{id} → 200

✓ it('cannot access another patient lab test')
    → 403 or 404

Mocks:
- Queue::fake() — ProcessLabTestJob
- Storage::fake()
```

---

### 🏥 Consultation & Telehealth Tests

---

#### `Feature/Consultation/ConsultationApiTest.php` (توسيع)
**إضافة للاختبارات الموجودة:**

```
✓ it('patient can search for doctors')
    GET /api/v1/patient/doctors/search?specialization=... → 200

✓ it('returns available slots for a doctor')
    GET /api/v1/patient/doctors/{id}/available-slots?date=... → 200

✓ it('pay for consultation initiates payment')
    POST /api/v1/patient/consultations/{id}/pay → 200, payment_url returned

✓ it('patient can reschedule a consultation')
    PUT /api/v1/patient/consultations/{id}/reschedule → 200

✓ it('doctor can confirm consultation')
    PUT /api/v1/doctor/consultations/{id}/confirm → 200

✓ it('doctor can start consultation session')
    PUT /api/v1/doctor/consultations/{id}/start → 200

✓ it('doctor can update consultation notes')
    PUT /api/v1/doctor/consultations/{id}/update-notes → 200
```

---

#### `Feature/Consultation/PaymentCallbackTest.php`
**Traits:** `RefreshDatabase`  
**هذا الأهم للأمان:**

```
✓ it('confirms consultation on successful paymob callback')
    POST /api/v1/patient/payments/paymob/callback
    body: { success: true, obj: { order: { merchant_order_id: uuid } } }
    Valid HMAC → 200, consultation.status = confirmed

✓ it('cancels consultation on failed paymob callback')
    body: { success: false }
    Valid HMAC → 200, consultation.status = cancelled

✓ it('rejects callback with invalid HMAC')
    Wrong HMAC signature → 403 (SECURITY TEST)

✓ it('returns 404 for unknown consultation in callback')
    Valid HMAC but unknown merchant_order_id → 404 or 200 (no-op)

✓ it('is idempotent — second callback does not double-confirm')
    Run callback twice → consultation confirmed only once

Mocks:
- Http::fake() (Paymob refund notification if needed)
- Mail::fake() (confirmation email)
```

---

#### `Feature/Consultation/SessionTest.php`
**Traits:** `RefreshDatabase, ActingAsDoctor, ActingAsPatient`

```
✓ it('doctor can send a chat message in active consultation')
    Consultation(confirmed) → POST /api/v1/doctor/consultations/{id}/chat/messages → 201

✓ it('patient can receive chat messages')
    GET /api/v1/patient/consultations/{id}/chat/messages → 200, messages list

✓ it('patient cannot read another patient consultation chat')
    → 403 or 404

✓ it('doctor can write a prescription')
    POST /api/v1/doctor/prescriptions (or via consultation)
    → 201, DB has Prescription

✓ it('patient can view their prescription')
    GET /api/v1/patient/consultations/{id}/prescription → 200

✓ it('patient cannot view another patient prescription')
    → 403

✓ it('doctor can fetch patient history for consultation')
    GET /api/v1/doctor/consultations/{id}/patient-history → 200

✓ it('doctor can get meeting info')
    GET /api/v1/doctor/consultations/{id}/meeting-info → 200, google_meet_link
```

---

#### `Feature/Consultation/ReviewTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient`

```
✓ it('patient can review doctor after completed consultation')
    Consultation(completed) → POST /api/v1/patient/consultations/{id}/review
    → 201, DB has ConsultationReview

✓ it('patient cannot review non-completed consultation')
    Consultation(pending) → 400 or 422

✓ it('patient cannot review same consultation twice')
    → 422 or 409

✓ it('rating must be between 1 and 5')
    rating: 6 → 422
```

---

#### `Feature/Consultation/MedicalFileTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient, ActingAsDoctor`  
**setUp:** `Storage::fake()`

```
✓ it('patient can upload a medical file')
    POST /api/v1/patient/profile/medical-files → 201, file stored

✓ it('patient can list their medical files')
    GET /api/v1/patient/profile/medical-files → 200

✓ it('patient can delete their medical file')
    DELETE /api/v1/patient/profile/medical-files/{id} → 200

✓ it('doctor with consultation can access patient medical files')
    createConfirmedConsultation($patient, $doctor)
    GET /api/v1/doctor/patients/{id}/... → 200

✓ it('doctor without consultation cannot access patient medical files')
    No consultation between them
    → 403
```

---

### ⚗️ Lab Tests & IoT Tests

---

#### `Unit/AI/LabTestOcrServiceTest.php`
**Traits:** none (pure unit test)

```
✓ it('parseOcrResult extracts hemoglobin from HF JSON')
    $service->parseOcrResult(['tests' => [['name' => 'Hemoglobin', 'value' => 12.5, 'unit' => 'g/dL']]])
    → ['hemoglobin' => ['value' => 12.5, 'unit' => 'g/dL', 'status' => 'normal']]

✓ it('interpretStatus returns low when value below reference range')
    interpretStatus(9.0, [12.0, 16.0]) → 'low'

✓ it('interpretStatus returns high when value above reference range')
    interpretStatus(18.0, [12.0, 16.0]) → 'high'

✓ it('interpretStatus returns normal when within range')
    interpretStatus(14.0, [12.0, 16.0]) → 'normal'

✓ it('handles missing reference range gracefully')
    → 'unknown' or null, no exception

Mocks: none
```

---

#### `Feature/Patient/IotIntegrationTest.php` (توسيع)
**إضافة:**

```
✓ it('returns google fit auth url')
    GET /api/v1/patient/iot/auth-url → 200, data.url contains accounts.google.com

✓ it('stores google fit token after oauth callback')
    POST /api/v1/patient/iot/connect
    body: { code: 'google_oauth_code' }
    Http::fake() for Google token exchange → 200, PatientGoogleFit created

✓ it('syncs google fit data')
    POST /api/v1/patient/iot/sync
    Http::fake() for Google Fit API → 200, PatientStep/PatientHeartRate created

✓ it('returns metrics when connected')
    PatientGoogleFit exists → GET /api/v1/patient/iot/metrics → 200, is_connected=true

✓ it('disconnects google fit')
    DELETE /api/v1/patient/iot/disconnect → 200, PatientGoogleFit deleted

Mocks:
- Http::fake(['*googleapis.com*' => Http::response([...], 200)])
- Queue::fake() for SyncGoogleFitData job
```

---

### 👩‍💼 Admin Panel Tests

---

#### `Feature/Admin/UserManagementTest.php`
**Traits:** `RefreshDatabase, ActingAsAdmin`

```
✓ it('admin can list patients with pagination')
    GET /api/v1/admin/patients → 200, paginated

✓ it('admin can filter patients by life stage')
    GET /api/v1/admin/patients?life_stage=2 → 200

✓ it('admin can view single patient')
    GET /api/v1/admin/patients/{id} → 200

✓ it('admin with manage_users can toggle patient status')
    PUT /api/v1/admin/patients/{id}/toggle-status → 200

✓ it('admin without manage_users cannot toggle patient status')
    Admin(no manage_users) → 403

✓ it('admin with manage_users can soft delete patient')
    DELETE /api/v1/admin/patients/{id} → 200, DB user.deleted_at not null

✓ it('admin can list doctors')
    GET /api/v1/admin/doctors → 200

✓ it('admin with verify_doctors can verify a doctor')
    PUT /api/v1/admin/doctors/{id}/verify → 200, verification_status=verified

✓ it('admin with verify_doctors can reject a doctor')
    PUT /api/v1/admin/doctors/{id}/reject → 200, verification_status=rejected

✓ it('admin can view join requests')
    GET /api/v1/admin/join-requests → 200

✓ it('audit log records sensitive operations')
    After toggle-status → AuditLog has entry with action='toggle_patient_status'
```

---

#### `Feature/Admin/FinancialTest.php`
**Traits:** `RefreshDatabase, ActingAsAdmin`

```
✓ it('admin with manage_financials can view financial overview')
    GET /api/v1/admin/financials/overview → 200

✓ it('admin without manage_financials gets 403')
    Admin(no manage_financials) → 403

✓ it('admin can view transactions')
    GET /api/v1/admin/financials/transactions → 200

✓ it('admin with process_payouts can view payout requests')
    GET /api/v1/admin/financials/payouts → 200

✓ it('admin can process a payout request')
    PayoutRequest(pending) → PUT /api/v1/admin/financials/payouts/{id}/process
    → 200, status=approved

✓ it('admin can refund a payment')
    POST /api/v1/admin/financials/transactions/{id}/refund → 200
    Http::fake() for Paymob refund API

Mocks:
- Http::fake() for Paymob refund endpoint
```

---

#### `Feature/Admin/CmsTest.php`
**Traits:** `RefreshDatabase, ActingAsAdmin`

```
✓ it('admin can view articles pending review')
    GET /api/v1/admin/articles → 200

✓ it('admin with review_articles can approve article')
    PUT/POST /api/v1/admin/articles/{id}/approve → 200, status=published

✓ it('admin can reject article')
    PUT /api/v1/admin/articles/{id}/reject → 200

✓ it('admin with manage_faqs can create FAQ')
    POST /api/v1/admin/faqs → 201

✓ it('admin can update site settings')
    PUT /api/v1/admin/settings/site → 200

✓ it('admin can view audit logs')
    GET /api/v1/admin/settings/audit-logs → 200

✓ it('admin can manage roles')
    POST /api/v1/admin/settings/roles → 201, Role created
```

---

#### `Feature/Admin/AnalyticsTest.php`
**Traits:** `RefreshDatabase, ActingAsAdmin`

```
✓ it('admin with view_analytics can see dashboard stats')
    GET /api/v1/admin/dashboard/stats → 200

✓ it('admin can view analytics overview')
    GET /api/v1/admin/analytics/overview → 200

✓ it('admin can view AI model analytics')
    GET /api/v1/admin/ai-center/analytics → 200

✓ it('admin can view chatbot stats')
    GET /api/v1/admin/chatbot/stats → 200

✓ it('admin can view chatbot conversations')
    GET /api/v1/admin/chatbot/conversations → 200
```

---

### 👩‍⚕️ Doctor Portal Tests

---

#### `Feature/Doctor/DoctorProfileTest.php`
**Traits:** `RefreshDatabase, ActingAsDoctor`

```
✓ it('verified doctor can view their profile')
    GET /api/v1/doctor/profile → 200

✓ it('verified doctor can update their profile')
    PUT /api/v1/doctor/profile → 200, DB updated

✓ it('verified doctor can view dashboard stats')
    GET /api/v1/doctor/dashboard/stats → 200

✓ it('pending doctor can view profile but not dashboard')
    Doctor(pending) → GET /api/v1/doctor/dashboard/stats → 403

✓ it('verified doctor can view their patients')
    GET /api/v1/doctor/patients → 200

✓ it('doctor cannot view patient without consultation')
    GET /api/v1/doctor/patients/{id} (no consultation) → 403
```

---

#### `Feature/Doctor/DoctorScheduleTest.php`
**Traits:** `RefreshDatabase, ActingAsDoctor`

```
✓ it('doctor can set working hours')
    PUT /api/v1/doctor/working-hours → 200, DoctorWorkingHour records created

✓ it('doctor can get their working hours')
    GET /api/v1/doctor/working-hours → 200

✓ it('doctor can update availability status')
    PUT /api/v1/doctor/profile/availability → 200

✓ it('available slots reflect working hours correctly')
    Set working hours → GET /patient/doctors/{id}/available-slots → slots match hours
```

---

#### `Feature/Doctor/DoctorFinancialTest.php`
**Traits:** `RefreshDatabase, ActingAsDoctor`

```
✓ it('doctor can view their financial stats')
    GET /api/v1/doctor/financials/stats → 200

✓ it('doctor can view transaction history')
    GET /api/v1/doctor/financials/transactions → 200

✓ it('doctor can request a payout')
    POST /api/v1/doctor/financials/request-payout → 201, PayoutRequest created

✓ it('doctor cannot request payout with insufficient balance')
    → 400 or 422
```

---

#### `Feature/Doctor/DoctorAiToolsTest.php`
**Traits:** `RefreshDatabase, ActingAsDoctor, FakeHuggingFace`

```
✓ it('doctor can view AI prediction stats')
    GET /api/v1/doctor/ai-center/stats → 200

✓ it('doctor can view patient predictions')
    createConfirmedConsultation($patient, $doctor)
    GET /api/v1/doctor/ai-center/patients/{id}/predictions → 200

✓ it('doctor cannot view predictions of patient without consultation')
    → 403

✓ it('doctor can add comment to prediction')
    POST /api/v1/doctor/ai-center/predictions/{id}/comment → 200
```

---

### 🔔 Notifications Tests

---

#### `Feature/Notifications/PushNotificationTest.php`
**Traits:** `RefreshDatabase, ActingAsPatient`  
**Mocks:** `Http::fake()` for WebPush VAPID

```
✓ it('patient can subscribe to push notifications')
    POST /api/v1/patient/notifications/subscribe → 200, PushSubscription created

✓ it('patient can unsubscribe from push notifications')
    POST /api/v1/patient/notifications/unsubscribe → 200, subscription deleted

✓ it('returns VAPID public key')
    GET /api/v1/patient/notifications/vapid-key → 200, data.public_key present

✓ it('patient can get notification list')
    GET /api/v1/patient/notifications → 200

✓ it('patient can mark notification as read')
    POST /api/v1/patient/notifications/{id}/read → 200

✓ it('patient can mark all as read')
    POST /api/v1/patient/notifications/read-all → 200

✓ it('unread count decreases after marking read')
    3 unread → mark-read 1 → GET /unread-count → 2
```

---

### 🔗 Unit Tests — Services

---

#### `Unit/Consultation/ConsultationServiceTest.php`

```
✓ it('checkConflict returns true when same slot is taken')
    Doctor has Consultation at 14:00 → checkConflict(doctor, date, '14:00') → true

✓ it('checkConflict returns false when slot is free')
    → false

✓ it('cancel calculates refund correctly for cancellation > 24h')
    → refund = full price

✓ it('cancel refuses refund for cancellation < 24h')
    → refund = 0 or business rule applied

✓ it('cancel updates consultation status to cancelled')
    → status = cancelled

Mocks: none (pure logic, mock DB with factory data)
```

---

#### `Unit/Finance/PaymobHmacTest.php`

```
✓ it('verifies valid HMAC signature correctly')
    PaymobService::verifyHmac($payload, $hmac, $secret) → true

✓ it('rejects invalid HMAC signature')
    Wrong secret → false

✓ it('rejects tampered payload')
    Modified amount in payload → false

✓ it('computes HMAC consistently for same input')
    Same input → same HMAC
```

---

### 🔄 Integration Tests

---

#### `Integration/FullBookingFlowTest.php`

```
✓ it('completes full booking flow from search to completion')
    1. Patient searches for doctor → finds Dr. X
    2. Checks available slots → finds 14:00
    3. Books consultation → status=pending
    4. Paymob callback success → status=confirmed
    5. Doctor starts session → status=in_progress
    6. Doctor completes session → status=completed
    7. Patient leaves review → ConsultationReview created
    
Mocks: Http::fake() for Paymob, Mail::fake()
```

---

#### `Integration/LabTestOcrFlowTest.php`

```
✓ it('completes full lab test OCR flow')
    1. Patient uploads lab image → status=pending, job queued
    2. Process ProcessLabTestJob manually (queue:work in test)
    3. HF OCR returns structured JSON
    4. LabTestResult saved with parsed results
    5. Patient polls status → ready
    6. Patient views results with normal/low/high interpretation

Mocks: Http::fake() for HF OCR, Storage::fake()
```

---

#### `Integration/ChatbotWithContextTest.php`

```
✓ it('pregnancy bot injects patient context when enabled')
    Patient with pregnancy + GDM prediction
    data_access_enabled = true
    POST /patient/chatbot/message (pregnancy bot)
    → Job runs → HF called with system prompt containing pregnancy context
    → Reply saved

✓ it('pregnancy bot skips context when data_access_disabled')
    data_access_enabled = false
    → HF called WITHOUT patient data

✓ it('public bot never receives patient context')
    Even with data_access_enabled=true
    Public bot → NO context injected

✓ it('PII in message is redacted before reaching HF')
    Message with phone number → HF receives [REDACTED_PHONE]
```

---

#### `Integration/PaymentToConfirmationTest.php`

```
✓ it('full payment flow: initiate → webhook success → confirmed')
    1. POST /patient/consultations/book → consultation pending
    2. POST /patient/consultations/{id}/pay → payment initiated, payment_url
    3. POST /patient/payments/paymob/callback (success + valid HMAC)
    4. GET /patient/consultations/{id} → status=confirmed
    5. Patient receives confirmation notification

Mocks: Http::fake() for Paymob, Mail::fake(), Queue operations
```

---

## القسم 4 — Coverage Targets

| المجال | Target Coverage | الأولوية | الملاحظات |
|---|---|---|---|
| Auth & Guards | 95% | 🔴 حرج | بوابة أمان المنصة |
| Chatbot + Context | 90% | 🔴 حرج | ✅ مغطى جيداً بالفعل |
| Consultation + Payment | 90% | 🔴 حرج | HMAC verification إلزامي |
| AI Predictions | 85% | 🟠 عالي | Mock HF لكل prediction |
| Lab Tests + OCR | 85% | 🟠 عالي | OCR flow end-to-end |
| RBAC Admin | 90% | 🔴 حرج | كل permission يُختبر |
| Health Trackers | 80% | 🟡 متوسط | موجود جزئياً |
| Doctor Portal | 80% | 🟡 متوسط | — |
| Notifications | 80% | 🟡 متوسط | Push + DB |
| Google Fit / IoT | 70% | 🟢 منخفض | OAuth flow |
| CMS (Articles/FAQs) | 75% | 🟢 منخفض | Admin only |

---

## القسم 5 — CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Widad Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  tests:
    runs-on: ubuntu-latest

    services:
      # No MySQL needed — SQLite in-memory

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: sqlite3, pdo_sqlite
          coverage: pcov

      - name: Install dependencies
        run: composer install --no-interaction
        working-directory: Back-end

      - name: Copy .env.testing
        run: cp .env.testing.example .env.testing
        working-directory: Back-end

      - name: Generate key
        run: php artisan key:generate --env=testing
        working-directory: Back-end

      - name: Run tests (parallel)
        run: php artisan test --parallel --coverage --min=80
        working-directory: Back-end

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: Back-end/coverage/
```

### 5.2 أوامر التشغيل

```bash
# كل الاختبارات
php artisan test

# موازي — أسرع بـ 3-4x
php artisan test --parallel

# مجموعة محددة
php artisan test --group=auth
php artisan test --group=chatbot
php artisan test --group=payment

# مجلد محدد
php artisan test tests/Feature/Auth/
php artisan test tests/Feature/Consultation/

# مع coverage threshold
php artisan test --coverage --min=80

# ملف محدد
php artisan test --filter=PaymentCallbackTest
php artisan test --filter="HMAC"   # بحث بكلمة

# تجاهل الاختبارات البطيئة
php artisan test --group=unit  # Unit tests فقط (أسرع)
```

### 5.3 Test Groups المقترحة

```php
// استخدام Pest attributes
describe('Payment Callback', function () {
    // ...
})->group('payment', 'integration');

// أو PHPUnit
#[Group('auth')]
#[Group('security')]
class PatientAuthTest extends TestCase { ... }
```

**Groups المقترحة:**
```
auth          ← كل اختبارات المصادقة
patient       ← Patient flows
chatbot       ← Chatbot (موجود بالفعل جيد)
consultation  ← Booking + Sessions
payment       ← Paymob callbacks + HMAC
ai            ← AI predictions + OCR
admin         ← Admin panel
doctor        ← Doctor portal
integration   ← End-to-end flows
security      ← Cross-guard + RBAC
iot           ← Google Fit
unit          ← كل الـ Unit tests
```

---

## ملخص الأولويات التنفيذية

> [!CAUTION]
> ابدأ بهذا الترتيب — الأكثر خطراً أولاً

### المرحلة الأولى (فورية) — Security Foundation
1. `Feature/Auth/PatientAuthTest.php`
2. `Feature/Auth/DoctorAuthTest.php`  
3. `Feature/Auth/AdminAuthTest.php`
4. `Feature/Auth/RbacTest.php`
5. `Feature/Security/CrossGuardAccessTest.php`
6. `Feature/Consultation/PaymentCallbackTest.php` ← **HMAC إلزامي**

### المرحلة الثانية — Core Business Logic
7. `Feature/Patient/AiPredictionTest.php`
8. `Feature/Patient/LabTestTest.php`
9. `Feature/Consultation/SessionTest.php`
10. `Feature/Consultation/MedicalFileTest.php`
11. `Feature/Admin/UserManagementTest.php`
12. `Feature/Admin/FinancialTest.php`

### المرحلة الثالثة — Complete Coverage
13. `Feature/Patient/HealthTrackersTest.php`
14. `Feature/Patient/PregnancyTest.php`
15. `Feature/Doctor/` (كل الملفات)
16. `Feature/Admin/` (ما تبقى)  
17. `Integration/` (كل الملفات)

### الـ Factories المطلوبة أولاً (قبل أي شيء)
```bash
# إنشاء بالترتيب
php artisan make:factory AdminFactory
php artisan make:factory LabTestResultFactory
php artisan make:factory DoctorWorkingHourFactory
php artisan make:factory PatientChatbotPreferenceFactory
php artisan make:factory ConsultationMessageFactory
```

---

> **معيار النجاح:** خطة ناجحة = كل الـ 67 Controller مغطى · كل الـ 17 Service مختبرة · Payment HMAC محمي · Cross-guard access ممنوع · 4 Integration journeys مكتملة
