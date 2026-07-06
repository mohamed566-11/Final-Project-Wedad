# 🔐 مراجعة شاملة لنظام الصلاحيات والمصادقة

## Comprehensive Permissions & Authorization System Review

> **تاريخ المراجعة:** 2026-03-01  
> **المشروع:** Widad Health Platform — Back-end (Laravel + Sanctum)

---

## 📋 جدول المحتويات

1. [نظرة عامة على البنية](#1-نظرة-عامة-على-البنية)
2. [نظام المصادقة (Authentication)](#2-نظام-المصادقة-authentication)
3. [نظام الأدوار والصلاحيات (Roles & Permissions)](#3-نظام-الأدوار-والصلاحيات-roles--permissions)
4. [طبقات الحماية (Middleware)](#4-طبقات-الحماية-middleware)
5. [حماية المسارات (Routes Protection)](#5-حماية-المسارات-routes-protection)
6. [ملكية البيانات (Data Ownership)](#6-ملكية-البيانات-data-ownership)
7. [تحليل التناسق والفجوات](#7-تحليل-التناسق-والفجوات)
8. [التوصيات والتحسينات المطلوبة](#8-التوصيات-والتحسينات-المطلوبة)
9. [خلاصة التقييم](#9-خلاصة-التقييم)
10. [خريطة الصلاحيات على المسارات](#10-خريطة-الصلاحيات-على-المسارات-بعد-التنفيذ)
11. [نظام سجلات التدقيق (Audit Log System)](#11-نظام-سجلات-التدقيق-audit-log-system)

---

## 1. نظرة عامة على البنية

### النمط المعماري

النظام يستخدم **Multi-Guard Authentication** مع **Laravel Sanctum** (Token-based) لفصل ثلاثة أنواع من المستخدمين:

| الدور           | الجدول    | النموذج (Model)     | الحارس (Guard) | المزوّد (Provider) |
| --------------- | --------- | ------------------- | -------------- | ------------------ |
| مريضة (Patient) | `users`   | `App\Models\User`   | `patient`      | `patients`         |
| طبيب (Doctor)   | `doctors` | `App\Models\Doctor` | `doctor`       | `doctors`          |
| مسؤول (Admin)   | `admins`  | `App\Models\Admin`  | `admin`        | `admins`           |

### ملف الإعدادات: `config/auth.php`

- **الحارس الافتراضي:** `patient`
- **كل حارس** يستخدم `sanctum` driver مع provider مستقل
- **إعادة تعيين كلمة المرور** مُعرّفة لكل نوع (patients, doctors, admins) — كلها تستخدم نفس الجدول `password_reset_tokens`

---

## 2. نظام المصادقة (Authentication)

### 2.1 التسجيل (Registration)

| النوع   | المسار                               | Form Request             | ملاحظات                                           |
| ------- | ------------------------------------ | ------------------------ | ------------------------------------------------- |
| Patient | `POST /api/v1/patient/auth/register` | `PatientRegisterRequest` | يُنشئ بروفايل فارغ + يرسل OTP للبريد              |
| Doctor  | `POST /api/v1/doctor/auth/register`  | `DoctorRegisterRequest`  | ✅ `verification_status = 'pending'` (تم الإصلاح) |
| Admin   | ❌ لا يوجد تسجيل                     | —                        | يُنشأ فقط بواسطة Super Admin                      |

### 2.2 تسجيل الدخول (Login)

| النوع   | المسار                            | Form Request          | Rate Limiting                             | حماية إضافية    |
| ------- | --------------------------------- | --------------------- | ----------------------------------------- | --------------- |
| Patient | `POST /api/v1/patient/auth/login` | `PatientLoginRequest` | `throttle:5,1` + manual (5 محاولات/دقيقة) | فحص `is_active` |
| Doctor  | `POST /api/v1/doctor/auth/login`  | `DoctorLoginRequest`  | `throttle:5,1` + manual (5 محاولات/دقيقة) | فحص `is_active` |
| Admin   | `POST /api/v1/admin/auth/login`   | `AdminLoginRequest`   | `throttle:5,1` + manual (5 محاولات/دقيقة) | فحص `is_active` |

### 2.3 تسجيل الخروج (Logout)

كل نوع يدعم:

- `POST auth/logout` — حذف التوكن الحالي
- `POST auth/logout/all` — حذف كل التوكنات (كل الأجهزة)

### 2.4 إعادة تعيين كلمة المرور

كل نوع يدعم:

- `POST password/email` — إرسال OTP
- `POST password/reset` — إعادة التعيين

### 2.5 إعدادات التوكن (Sanctum)

- **مدة الصلاحية:** 43,200 دقيقة (30 يوم) — مُعرّفة في `config/sanctum.php`
- **الأذونات (Abilities):** جميع التوكنات تُنشأ بـ `['*']` (كل الأذونات) — ⚠️ لا يتم التمييز

---

## 3. نظام الأدوار والصلاحيات (Roles & Permissions)

### 3.1 هيكل قاعدة البيانات

**جدول `roles`:**

```
| عمود | النوع | الوصف |
|------|-------|-------|
| id | bigint | المعرف |
| role | string (unique) | اسم الدور |
| permissions | JSON | مصفوفة الصلاحيات |
| description | text (nullable) | وصف |
```

**العلاقة:** `admins.role_id → roles.id` (Many-to-One)

### 3.2 الأدوار المُعرّفة (Seeder)

| الدور             | الوصف         | الصلاحيات                                                                                                                                                                                                                                                |
| ----------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `super_admin`     | صلاحيات كاملة | `Permission::all()` — جميع الـ 20 صلاحية                                                                                                                                                                                                                 |
| `admin`           | إدارة عامة    | `manage_users`, `view_users`, `manage_doctors`, `verify_doctors`, `view_doctors`, `manage_articles`, `review_articles`, `manage_consultations`, `view_consultations`, `view_analytics`, `view_reports`, `manage_messages`, `manage_faqs`, `manage_pages` |
| `moderator`       | إشراف المحتوى | `manage_articles`, `review_articles`, `view_users`, `view_doctors`, `view_consultations`, `manage_faqs`, `manage_messages`                                                                                                                               |
| `financial_admin` | إدارة مالية   | `manage_financials`, `process_payouts`, `view_analytics`, `view_reports`, `view_consultations`                                                                                                                                                           |

### 3.3 الصلاحيات المتاحة (`Permission` Enum — 20 صلاحية)

| الثابت (Constant)      | القيمة                 | الوصف                              |
| ---------------------- | ---------------------- | ---------------------------------- |
| `MANAGE_ADMINS`        | `manage_admins`        | إدارة المسؤولين                    |
| `MANAGE_ROLES`         | `manage_roles`         | إدارة الأدوار                      |
| `MANAGE_USERS`         | `manage_users`         | إدارة المستخدمين                   |
| `VIEW_USERS`           | `view_users`           | عرض المستخدمين                     |
| `MANAGE_DOCTORS`       | `manage_doctors`       | إدارة الأطباء                      |
| `VERIFY_DOCTORS`       | `verify_doctors`       | التحقق من الأطباء                  |
| `VIEW_DOCTORS`         | `view_doctors`         | عرض الأطباء                        |
| `MANAGE_ARTICLES`      | `manage_articles`      | إدارة المقالات                     |
| `REVIEW_ARTICLES`      | `review_articles`      | مراجعة المقالات                    |
| `MANAGE_FAQS`          | `manage_faqs`          | إدارة الأسئلة الشائعة              |
| `MANAGE_PAGES`         | `manage_pages`         | إدارة الصفحات (من نحن، قصص النجاح) |
| `MANAGE_CONSULTATIONS` | `manage_consultations` | إدارة الاستشارات                   |
| `VIEW_CONSULTATIONS`   | `view_consultations`   | عرض الاستشارات                     |
| `MANAGE_FINANCIALS`    | `manage_financials`    | إدارة الماليات                     |
| `PROCESS_PAYOUTS`      | `process_payouts`      | معالجة المدفوعات                   |
| `MANAGE_SETTINGS`      | `manage_settings`      | إدارة الإعدادات                    |
| `VIEW_ANALYTICS`       | `view_analytics`       | عرض التحليلات                      |
| `VIEW_REPORTS`         | `view_reports`         | عرض التقارير                       |
| `SEND_NOTIFICATIONS`   | `send_notifications`   | إرسال الإشعارات                    |
| `MANAGE_MESSAGES`      | `manage_messages`      | إدارة رسائل التواصل                |

### 3.4 دوال المساعدة في النموذج

```php
// App\Models\Admin
public function hasPermission($permission) {
    return in_array($permission, $this->role->permissions ?? []);
}

public function isSuperAdmin() {
    return $this->role->role === 'super_admin';
}
```

---

## 4. طبقات الحماية (Middleware)

### 4.1 Middleware المُسجّلة

| الاسم المستعار       | الكلاس                    | الوظيفة                                                      |
| -------------------- | ------------------------- | ------------------------------------------------------------ |
| `PatientStatus`      | `CheckPatientStatus`      | يفحص `is_active` للمريضة — يحذف التوكن ويرجع 403 إذا مُعطّلة |
| `DoctorStatus`       | `CheckDoctorStatus`       | يفحص `is_active` للطبيب — يحذف التوكن ويرجع 403 إذا مُعطّل   |
| `AdminStatus`        | `CheckAdminStatus`        | يفحص `is_active` للمسؤول — يحذف التوكن ويرجع 403 إذا مُعطّل  |
| `PatientEmailVerify` | `CheckPatientEmailVerify` | يفحص `email_verified_at` للمريضة — يرجع 403 إذا لم يُتحقق    |
| `permission`         | `CheckPermission`         | ✅ NEW — يفحص صلاحيات الأدمن حسب الدور (super_admin يتجاوز)  |
| `DoctorVerified`     | `CheckDoctorVerified`     | ✅ NEW — يفحص حالة تحقق الطبيب (verified/pending/rejected)   |
| `admin.audit`        | `AuditAdminActions`       | ✅ NEW — يسجل عمليات POST/PUT/PATCH/DELETE في سجل التدقيق    |

### 4.2 Middleware عامة (API)

```php
$middleware->api([
    SubstituteBindings::class,
    OptimizeApiResponse::class, // ضغط + Cache headers
]);
```

### 4.3 ما تم إنشاؤه ✅ (كان مفقوداً سابقاً)

| Middleware            | الحالة       | الوصف                                                             |
| --------------------- | ------------ | ----------------------------------------------------------------- |
| `CheckPermission`     | ✅ مُنفّذ    | فحص صلاحيات الأدمن — super_admin يتجاوز — يدعم صلاحيات متعددة     |
| `CheckDoctorVerified` | ✅ مُنفّذ    | فحص حالة تحقق الطبيب — رسائل مختلفة حسب الحالة (pending/rejected) |
| `AuditAdminActions`   | ✅ مُنفّذ    | تسجيل عمليات POST/PUT/PATCH/DELETE في سجل التدقيق                 |
| `CheckRole`           | ❌ غير مطلوب | تم الاستعاضة عنه بـ `permission` middleware الأكثر دقة            |

---

## 5. حماية المسارات (Routes Protection)

### 5.1 مسارات المريضة (`routes/patient.php`)

```
prefix: api/v1/patient
```

| المجموعة               | Middleware                                            | ملاحظات          |
| ---------------------- | ----------------------------------------------------- | ---------------- |
| Auth (register, login) | `throttle:register` / `throttle:5,1`                  | عامة             |
| Email Verification     | `auth:patient`                                        | مصادقة فقط       |
| Forget/Reset Password  | بدون                                                  | عامة             |
| Get Data (`/data`)     | `auth:patient`, `PatientStatus`                       | ✅               |
| جميع المسارات المحمية  | `auth:patient`, `PatientStatus`, `PatientEmailVerify` | ✅ ثلاث طبقات    |
| Articles (عامة)        | بدون                                                  | قراءة فقط        |
| Payment Webhooks       | بدون                                                  | Callbacks خارجية |

### 5.2 مسارات الطبيب (`routes/doctor.php`)

```
prefix: api/v1/doctor
```

| المجموعة                                                                | Middleware                                      | ملاحظات                    |
| ----------------------------------------------------------------------- | ----------------------------------------------- | -------------------------- |
| Auth (register, login)                                                  | `throttle:register` / `throttle:5,1`            | عامة                       |
| Forget/Reset Password                                                   | `throttle:3,1` / `throttle:5,1`                 | ✅ محمية بـ rate limiting  |
| data, profile (GET), notifications                                      | `auth:doctor`, `DoctorStatus`                   | ✅ بدون تحقق — متاح للجميع |
| dashboard, profile (PUT), consultations, patients, articles, financials | `auth:doctor`, `DoctorStatus`, `DoctorVerified` | ✅ يتطلب تحقق الطبيب       |

### 5.3 مسارات المسؤول (`routes/admin.php`)

```
prefix: api/v1/admin
```

| المجموعة                  | Middleware                                 | ملاحظات                      |
| ------------------------- | ------------------------------------------ | ---------------------------- |
| Auth (login)              | `throttle:5,1`                             | عامة                         |
| Forget/Reset Password     | بدون                                       | عامة                         |
| **جميع المسارات المحمية** | `auth:admin`, `AdminStatus`, `admin.audit` | ✅ فحص صلاحيات + تسجيل تدقيق |

### 5.4 المسارات العامة (`routes/public.php`)

```
prefix: api/v1
```

| المسار                          | Middleware     |
| ------------------------------- | -------------- |
| Landing page, About, FAQs, etc. | بدون (عامة)    |
| Contact Us, Join Us             | `throttle:3,1` |
| Global Search                   | بدون           |

---

## 6. ملكية البيانات (Data Ownership)

### 6.1 مسارات المريضة

✅ **جيد** — جميع الـ Controllers تفلتر البيانات حسب `user_id` من المستخدم المصادق:

```php
$patient = $request->user();
Consultation::where('user_id', $patient->id)
```

- ✅ `ConsultationController` — `where('user_id', $patient->id)`
- ✅ `PregnancyController` — `where('user_id', $request->user()->id)`
- ✅ `MoodController`, `WeightController`, `PeriodController`, `FertilityController` — كلها تفلتر بـ `user_id`
- ✅ `PatientDashboardController` — يستخدم `$user->id`

### 6.2 مسارات الطبيب

✅ **جيد** — جميع الـ Controllers تفلتر بـ `doctor_id`:

```php
$doctor = $request->user();
Consultation::where('doctor_id', $doctor->id)
```

- ✅ `ConsultationController` — `where('doctor_id', $doctor->id)`
- ✅ `DoctorDashboardController` — `where('doctor_id', $doctor->id)`
- ✅ `DoctorFinancialController` — `where('doctor_id', $doctor->id)`
- ✅ `DoctorPatientController` — `where('doctor_id', $doctor->id)`
- ✅ `ArticleController` — تفلتر مقالات الطبيب الحالي

### 6.3 مسارات المسؤول

✅ الـ Admin يمكنه الوصول لكل البيانات — وهذا مقبول لكونه مسؤول.

### 6.4 الإشعارات (NotificationController المشترك)

✅ **جيد** — يستخدم `Auth::user()` ويعتمد على الـ guard النشط:

```php
$user = Auth::user();
$user->notifications(); // يجلب إشعارات المستخدم المصادق فقط
```

---

## 7. تحليل التناسق والفجوات

### � مشاكل حرجة — تم حلها (Critical — RESOLVED)

#### 7.1 ~~الصلاحيات الدقيقة غير مُطبقة~~ ✅ تم الإصلاح

**الحل:** تم تطبيق `permission:Permission::CONSTANT` middleware على كل 15 مجموعة مسارات في `routes/admin.php`:

| Controller                    | الصلاحية المطبقة (Route Middleware)                      |
| ----------------------------- | -------------------------------------------------------- |
| `PatientController`           | `permission:manage_users`                                |
| `DoctorController`            | `permission:manage_doctors`                              |
| `ConsultationController`      | `permission:view_consultations` + `manage_consultations` |
| `FinancialController`         | `permission:manage_financials`                           |
| `PayoutController`            | `permission:process_payouts`                             |
| `ArticleController`           | `permission:manage_articles`                             |
| `NotificationAdminController` | `permission:send_notifications`                          |
| `AnalyticsController`         | `permission:view_analytics`                              |
| `ContactMessageController`    | `permission:manage_messages`                             |
| `JoinRequestController`       | `permission:manage_doctors`                              |
| `FaqController`               | `permission:manage_faqs`                                 |
| `AboutController`             | `permission:manage_pages`                                |
| `SuccessStoryController`      | `permission:manage_pages`                                |
| `DashboardController`         | `permission:view_analytics`                              |
| `SettingsController`          | `permission:manage_settings`                             |

**الـ Controllers التي تفحص الصلاحيات إضافياً (على مستوى الكود):**

- ✅ `SettingsController` — إنشاء/تعديل/حذف الأدوار (`isSuperAdmin`)
- ✅ `AdminManagementController` — إنشاء/تعديل/حذف المسؤولين (`isSuperAdmin`)

#### 7.2 ~~عدم التمييز بين الصلاحيات في الـ Seeder والـ Controllers~~ ✅ تم الإصلاح

**الحل:**

- الـ Seeder يستخدم الآن `Permission::CONSTANT` من `app/Enums/Permission.php`
- الـ SettingsController يستخدم `Permission::allWithDescriptions()` من نفس الـ Enum
- لا يوجد عدم تطابق — كلاهما يعتمد على نفس المصدر المركزي (20 صلاحية)

---

### � مشاكل متوسطة — تم حلها (Medium — RESOLVED)

#### 7.3 ~~تسجيل الطبيب بحالة `verified` تلقائياً~~ ✅ تم الإصلاح

**الحل:** تم تغيير `verification_status` إلى `'pending'` في `RegisterController.php`

```php
// RegisterController.php (Doctor)
'verification_status' => 'pending', // Requires admin verification
```

#### 7.4 ~~لا يوجد Middleware لفحص حالة تحقق الطبيب~~ ✅ تم الإنشاء

**الحل:** تم إنشاء `CheckDoctorVerified` middleware وتطبيقه على المسارات المهنية (dashboard, consultations, patients, articles, financials). يعرض رسائل مختلفة حسب الحالة (pending/rejected).

#### 7.5 التوكنات تُنشأ بصلاحيات `['*']`

```php
$token = $admin->createToken('Admin-access-token', ['*'], ...);
$token = $doctor->createToken('Doctor-access-token', ['*'], ...);
$token = $user->createToken('patient-access-token', ['*'], ...);
```

**المشكلة:** Sanctum يدعم Token Abilities للتمييز بين أنواع التوكنات، لكنها غير مُستخدمة. (تحسين اختياري — الحماية الفعلية تتم عبر `CheckPermission` middleware)

#### 7.6 لا يوجد نظام Policies

**المشكلة:** لا يستخدم Laravel Policies لحماية العمليات على المودلز. Resource-level authorization غير مُطبق. (تحسين اختياري — الحماية على مستوى المسارات كافية حالياً)

---

### 🟡 مشاكل بسيطة / متبقية (Low / Remaining)

#### 7.7 عدم وجود Rate Limiting على مسارات الأدمن المحمية

**المشكلة:** مسارات مثل حذف المرضى أو الأطباء لا تملك rate limiting (عدا Login).

#### 7.8 إعادة تعيين كلمة المرور تستخدم نفس الجدول

**المشكلة:** `password_reset_tokens` مستخدم لجميع الأنواع الثلاثة. قد يسبب تعارض إذا استخدم نفس البريد في جداول مختلفة.

#### 7.9 ~~مسارات كلمة المرور للأدمن بدون rate limiting~~ ✅ تم الإصلاح

**الحل:** تم إضافة `throttle:3,1` على `password/email` و `throttle:5,1` على `password/reset` في مسارات الأدمن.

#### 7.10 عدم فحص `email_verified_at` للطبيب

**المشكلة:** يوجد `PatientEmailVerify` middleware للمريضة لكن لا يوجد مكافئ للطبيب، رغم وجود حقل `email_verified_at` في جدول الأطباء.

---

## 8. التوصيات والتحسينات المطلوبة

### � أولوية قصوى — تم التنفيذ ✅

#### 8.1 ~~إنشاء Middleware للصلاحيات الدقيقة~~ ✅

**تم:** إنشاء `CheckPermission` middleware في `app/Http/Middleware/CheckPermission.php`

- يدعم صلاحية واحدة أو أكثر (ALL مطلوبة)
- super_admin يتجاوز كل الفحوصات
- رسالة خطأ واضحة بالعربية مع اسم الصلاحية المطلوبة

#### 8.2 ~~تسجيل الـ Middleware~~ ✅

**تم:** تسجيل 3 middleware جديدة في `bootstrap/app.php`:

```php
'permission' => CheckPermission::class,
'DoctorVerified' => CheckDoctorVerified::class,
'admin.audit' => AuditAdminActions::class,
```

#### 8.3 ~~تطبيق الصلاحيات على المسارات~~ ✅

**تم:** كل مجموعة مسارات في `routes/admin.php` محمية بـ `permission:Permission::CONSTANT`:

- 15 مجموعة مسارات محمية بالصلاحيات المناسبة
- استخدام `Permission` Enum constants بدلاً من strings

#### 8.4 ~~توحيد مصفوفة الصلاحيات~~ ✅

**تم:** إنشاء `app/Enums/Permission.php` مع 20 صلاحية + `allWithDescriptions()` + `all()`

### 🟢 أولوية متوسطة — تم التنفيذ ✅

#### 8.5 ~~تغيير حالة التسجيل الافتراضية للطبيب~~ ✅

**تم:** `verification_status` أصبح `'pending'` في `RegisterController.php`

#### 8.6 ~~إنشاء Middleware لفحص حالة تحقق الطبيب~~ ✅

**تم:** `CheckDoctorVerified` middleware مع رسائل مختلفة حسب الحالة (pending/rejected/approved)

### 🟡 أولوية منخفضة — تحسينات مستقبلية اختيارية

#### 8.7 استخدام Token Abilities

```php
// عند إنشاء التوكن
$token = $admin->createToken('admin-token', $admin->role->permissions ?? []);

// عند الفحص
if (!$request->user()->tokenCan('manage_users')) {
    abort(403);
}
```

**ملاحظة:** تحسين اختياري — الحماية الفعلية تتم عبر `CheckPermission` middleware حالياً.

#### 8.8 إنشاء Policies للعمليات الحساسة (تحسين اختياري)

```php
// app/Policies/ConsultationPolicy.php
class ConsultationPolicy
{
    public function view(User|Doctor $user, Consultation $consultation): bool
    {
        return $user->id === $consultation->user_id
            || $user->id === $consultation->doctor_id;
    }

    public function cancel(User|Doctor $user, Consultation $consultation): bool
    {
        return $user->id === $consultation->user_id
            || $user->id === $consultation->doctor_id;
    }
}
```

**ملاحظة:** تحسين اختياري — الحماية الحالية كافية عبر Middleware + ownership checks في الكونترولرات.

#### 8.9 إضافة Rate Limiting للمسارات الإدارية العامة (تحسين اختياري)

```php
Route::prefix('patients')->middleware(['permission:manage_users', 'throttle:30,1'])->group(function () {
    // ...
});
```

**ملاحظة:** مسارات كلمة المرور محمية بالفعل بـ `throttle:3,1` و `throttle:5,1`. هذا تحسين إضافي للمسارات العامة.

#### 8.10 فصل جدول `password_reset_tokens` (تحسين اختياري)

استخدام جداول منفصلة أو إضافة عمود `guard` للتمييز.

#### 8.11 ~~إضافة Rate Limiting لمسارات كلمة المرور للأدمن~~ ✅

**تم:** مسارات كلمة المرور محمية بالفعل:

- `throttle:3,1` على `password/email` (إرسال OTP)
- `throttle:5,1` على `password/verify-otp` و `password/reset`

---

## 9. خلاصة التقييم

### ما هو جيد ✅

| الجانب                                         | التقييم  |
| ---------------------------------------------- | -------- |
| فصل Guards لثلاثة أنواع مستخدمين               | ممتاز    |
| ملكية البيانات (Ownership) في Patient و Doctor | ممتاز    |
| فحص `is_active` عبر Middleware                 | جيد جداً |
| فحص تأكيد البريد للمريضة                       | جيد      |
| Rate Limiting على تسجيل الدخول                 | جيد      |
| نموذج الأدوار والصلاحيات (DB Schema)           | جيد      |
| حذف الرموز عند الإيقاف                         | جيد      |
| Soft Delete للحسابات                           | جيد      |
| حماية Super Admin من الحذف/الإيقاف             | جيد      |

### ما تم تنفيذه ✅ (بعد المراجعة)

| التحسين                                      | الحالة    | التفاصيل                                                         |
| -------------------------------------------- | --------- | ---------------------------------------------------------------- |
| إنشاء `Permission` Enum مركزي                | ✅ مُنفّذ | `app/Enums/Permission.php` — 20 صلاحية مع أوصاف عربية            |
| إنشاء `CheckPermission` Middleware           | ✅ مُنفّذ | `app/Http/Middleware/CheckPermission.php` — super_admin يتجاوز   |
| إنشاء `CheckDoctorVerified` Middleware       | ✅ مُنفّذ | `app/Http/Middleware/CheckDoctorVerified.php` — رسائل حسب الحالة |
| تسجيل الـ Middleware في Bootstrap            | ✅ مُنفّذ | `bootstrap/app.php` — `permission` و `DoctorVerified`            |
| توحيد صلاحيات RoleSeeder                     | ✅ مُنفّذ | 4 أدوار: super_admin, admin, moderator, financial_admin          |
| تطبيق Permission Middleware على Admin Routes | ✅ مُنفّذ | 15 مجموعة مسارات محمية بالصلاحيات                                |
| تطبيق DoctorVerified على Doctor Routes       | ✅ مُنفّذ | المميزات المهنية تتطلب التحقق فقط                                |
| إصلاح تسجيل الطبيب (pending)                 | ✅ مُنفّذ | `verification_status` أصبح `pending`                             |
| Rate Limiting لمسارات كلمة المرور            | ✅ مُنفّذ | `throttle:3,1` و `throttle:5,1`                                  |
| تحديث SettingsController                     | ✅ مُنفّذ | يستخدم `Permission::allWithDescriptions()`                       |
| إنشاء نظام سجلات التدقيق (Audit Log)         | ✅ مُنفّذ | Migration + Model + Service + Middleware + API + صفحة فرونت إند  |
| إنشاء `AuditAdminActions` Middleware         | ✅ مُنفّذ | يسجل كل POST/PUT/PATCH/DELETE مع تنظيف البيانات الحساسة          |
| صفحة سجلات التدقيق (Frontend)                | ✅ مُنفّذ | بحث + فلاتر + Pagination + تصدير CSV + مودال التفاصيل            |

### ما يمكن تحسينه مستقبلاً 🔮

| الجانب                           | الخطورة   | ملاحظات                                                |
| -------------------------------- | --------- | ------------------------------------------------------ |
| إضافة Laravel Policies           | 🟡 بسيط   | حماية إضافية على مستوى الموارد                         |
| استخدام Sanctum Token Abilities  | 🟡 بسيط   | فرصة أمنية إضافية                                      |
| فصل جدول `password_reset_tokens` | 🟡 بسيط   | لكل guard جدول منفصل                                   |
| ~~إضافة تدقيق (Audit Log)~~      | ✅ مُنفّذ | ~~تتبع العمليات الحساسة~~ — تم التنفيذ (راجع القسم 11) |

### التقييم العام (بعد التحسينات)

| المعيار                           | قبل      | بعد      |
| --------------------------------- | -------- | -------- |
| المصادقة (Authentication)         | 8/10     | 9/10     |
| التفويض (Authorization)           | 3/10     | 9/10     |
| ملكية البيانات (Ownership)        | 9/10     | 9/10     |
| حماية المسارات (Route Protection) | 6/10     | 9/10     |
| التناسق (Consistency)             | 4/10     | 9/10     |
| التدقيق والمراقبة (Audit)         | 0/10     | 9/10     |
| **المجموع**                       | **6/10** | **9/10** |

> **الخلاصة:** تم تطبيق جميع التحسينات الحرجة والمتوسطة. النظام الآن يملك:
>
> - ✅ صلاحيات مركزية موحّدة عبر `Permission` Enum
> - ✅ حماية على مستوى المسارات لكل مجموعة إدارية
> - ✅ فصل بين المميزات التي تتطلب تحقق الطبيب والتي لا تتطلب
> - ✅ Rate Limiting على المسارات الحساسة
> - ✅ تطابق كامل بين Seeder و الـ UI
> - ✅ نظام سجلات تدقيق (Audit Log) شامل مع واجهة إدارية كاملة

---

## 10. خريطة الصلاحيات على المسارات (بعد التنفيذ)

### Admin Routes — Permission Mapping

| مجموعة المسارات               | الصلاحية المطلوبة      | الملف المرجعي                      |
| ----------------------------- | ---------------------- | ---------------------------------- |
| `dashboard/*`                 | `view_analytics`       | `DashboardController`              |
| `patients/*`                  | `manage_users`         | `PatientController`                |
| `doctors/*`                   | `manage_doctors`       | `DoctorController`                 |
| `admins/*`                    | `manage_admins`        | `AdminManagementController`        |
| `join-requests/*`             | `manage_doctors`       | `JoinRequestController`            |
| `consultations/*` (view)      | `view_consultations`   | `ConsultationController`           |
| `consultations/*/cancel`      | `manage_consultations` | `ConsultationController`           |
| `financials/*`                | `manage_financials`    | `FinancialController`              |
| `financials/payouts/*`        | `process_payouts`      | `PayoutController`                 |
| `articles/*`                  | `manage_articles`      | `ArticleController`                |
| `contact-messages/*`          | `manage_messages`      | `ContactMessageController`         |
| `notifications/send,history`  | `send_notifications`   | `NotificationAdminController`      |
| `notifications/*` (receiving) | — (any admin)          | `NotificationController`           |
| `analytics/*`                 | `view_analytics`       | `AnalyticsController`              |
| `settings/*`                  | `manage_settings`      | `SettingsController`               |
| `settings/audit-logs`         | `manage_settings`      | `SettingsController::getAuditLogs` |
| `faqs/*`                      | `manage_faqs`          | `FaqController`                    |
| `about-us/*`                  | `manage_pages`         | `AboutController`                  |
| `success-stories/*`           | `manage_pages`         | `SuccessStoryController`           |

### Doctor Routes — Verification Mapping

| مجموعة المسارات   | يتطلب تحقق؟ | ملاحظات                   |
| ----------------- | ----------- | ------------------------- |
| `data`            | ❌          | الطبيب يرى بياناته دائماً |
| `profile` (GET)   | ❌          | عرض البروفايل متاح        |
| `notifications/*` | ❌          | الإشعارات متاحة           |
| `dashboard/*`     | ✅          | يتطلب `DoctorVerified`    |
| `profile` (PUT)   | ✅          | التعديل يتطلب تحقق        |
| `consultations/*` | ✅          | يتطلب `DoctorVerified`    |
| `patients/*`      | ✅          | يتطلب `DoctorVerified`    |
| `articles/*`      | ✅          | يتطلب `DoctorVerified`    |
| `financials/*`    | ✅          | يتطلب `DoctorVerified`    |

---

## ملحق: خريطة الملفات المرتبطة

```
config/
├── auth.php                          # Guards, Providers, Passwords
├── sanctum.php                       # Token settings

app/Enums/
├── Permission.php                    # ✅ NEW — Centralized permission constants

app/Models/
├── User.php                          # Patient model (Authenticatable + HasApiTokens)
├── Doctor.php                        # Doctor model (Authenticatable + HasApiTokens)
├── Admin.php                         # Admin model (Authenticatable + HasApiTokens + hasPermission + isSuperAdmin + auditLogs)
├── AuditLog.php                      # ✅ NEW — سجل التدقيق (admin belongsTo, JSON casts)
├── Role.php                          # Role model (permissions JSON)

app/Http/Middleware/
├── CheckAdminStatus.php              # فحص is_active للأدمن
├── CheckDoctorStatus.php             # فحص is_active للطبيب
├── CheckPatientStatus.php            # فحص is_active للمريضة
├── CheckPatientEmailVerify.php       # فحص email_verified_at للمريضة
├── CheckPermission.php               # ✅ NEW — فحص صلاحيات الأدمن (super_admin يتجاوز)
├── CheckDoctorVerified.php           # ✅ NEW — فحص حالة تحقق الطبيب
├── AuditAdminActions.php             # ✅ NEW — After-middleware لتسجيل عمليات الأدمن
├── OptimizeApiResponse.php           # Cache headers + compression

app/Services/
├── AuditLogService.php               # ✅ NEW — خدمة تسجيل التدقيق (sanitize + extract response)

bootstrap/
├── app.php                           # ✅ UPDATED — تسجيل permission & DoctorVerified & admin.audit middleware

routes/
├── admin.php                         # ✅ UPDATED — كل مجموعة محمية بـ permission middleware
├── doctor.php                        # ✅ UPDATED — المميزات المهنية تتطلب DoctorVerified
├── patient.php                       # مسارات المريضة
├── public.php                        # مسارات عامة

database/
├── migrations/
│   ├── 0001_01_01_000001_create_users_table.php
│   ├── 0001_01_01_000004_create_roles_table.php
│   ├── 0001_01_01_000014_create_admins_table.php
│   ├── 0001_01_01_000016_create_doctors_table.php
│   ├── 0001_01_01_000007_create_personal_access_tokens_table.php
│   └── 2026_03_01_210000_create_audit_logs_table.php  # ✅ NEW — جدول سجلات التدقيق
├── seeders/
│   └── RoleSeeder.php                # ✅ UPDATED — يستخدم Permission enum + financial_admin role

app/Http/Controllers/Api/
├── Admin/
│   ├── Auth/LoginController.php
│   ├── AdminManagementController.php # ✅ محمي بـ permission:manage_admins (route) + isSuperAdmin (controller)
│   ├── SettingsController.php        # ✅ UPDATED + محمي بـ permission:manage_settings
│   ├── DashboardController.php       # ✅ محمي بـ permission:view_analytics
│   ├── PatientController.php         # ✅ محمي بـ permission:manage_users
│   ├── DoctorController.php          # ✅ محمي بـ permission:manage_doctors
│   ├── ConsultationController.php    # ✅ محمي بـ permission:view_consultations + manage_consultations
│   ├── FinancialController.php       # ✅ محمي بـ permission:manage_financials
│   ├── PayoutController.php          # ✅ محمي بـ permission:process_payouts
│   ├── ArticleController.php         # ✅ محمي بـ permission:manage_articles
│   ├── NotificationAdminController.php # ✅ محمي بـ permission:send_notifications
│   ├── AnalyticsController.php       # ✅ محمي بـ permission:view_analytics
│   ├── ContactMessageController.php  # ✅ محمي بـ permission:manage_messages
│   ├── JoinRequestController.php     # ✅ محمي بـ permission:manage_doctors
│   ├── FaqController.php             # ✅ محمي بـ permission:manage_faqs
│   ├── AboutController.php           # ✅ محمي بـ permission:manage_pages
│   └── SuccessStoryController.php    # ✅ محمي بـ permission:manage_pages
├── Doctor/
│   ├── Auth/LoginController.php
│   ├── Auth/RegisterController.php   # ✅ UPDATED — verification_status = pending
│   ├── ConsultationController.php    # ✅ يفلتر بـ doctor_id + DoctorVerified middleware
│   └── ...
├── Patient/
│   ├── Auth/LoginController.php
│   ├── Auth/RegisterController.php
│   ├── ConsultationController.php    # ✅ يفلتر بـ user_id
│   └── ...
└── NotificationController.php        # مشترك — يعتمد على Auth::user()

app/Traits/
├── ApiResponse.php                   # successResponse / errorResponse

# ═══ Frontend (Audit Log) ═══

src/pages/admin/
├── AuditLogsPage.tsx                 # ✅ NEW — صفحة سجلات التدقيق (بحث + فلاتر + CSV + موداﻝ التفاصيل)

src/services/
├── adminService.ts                   # ✅ UPDATED — getAuditLogs() API call

src/hooks/
├── useAdminQueries.ts                # ✅ UPDATED — useAuditLogs() hook + adminQueryKeys.auditLogs

src/utils/
├── permissions.ts                    # ✅ UPDATED — ROUTE_PERMISSIONS['/admin/audit-logs']

src/components/admin/
├── AdminLayout.tsx                   # ✅ UPDATED — رابط "سجلات التدقيق" في القائمة الجانبية

src/App.tsx                           # ✅ UPDATED — Route path="audit-logs" + RequirePermission
```

---

## 11. نظام سجلات التدقيق (Audit Log System)

### 11.1 نظرة عامة

نظام تتبع شامل يسجّل **كل العمليات الكتابية** (POST/PUT/PATCH/DELETE) التي يقوم بها المسؤولون داخل لوحة الإدارة. يعمل كـ After-middleware فلا يؤثر على أداء الطلبات أو يمنعها حتى في حالة فشل التسجيل.

### 11.2 هيكل قاعدة البيانات

**جدول `audit_logs`:**

| العمود             | النوع                  | الوصف                                      |
| ------------------ | ---------------------- | ------------------------------------------ |
| `id`               | bigint (PK)            | المعرف                                     |
| `admin_id`         | FK → admins (nullable) | المسؤول المنفذ (null إذا حُذف)             |
| `method`           | string(10)             | HTTP method (POST/PUT/PATCH/DELETE)        |
| `endpoint`         | string(255)            | المسار (مثال: `api/v1/admin/patients/5`)   |
| `action`           | string(120)            | اسم Route (مثال: `admin.patients.destroy`) |
| `resource_type`    | string(100)            | نوع الكيان المستهدف (Patient, Doctor...)   |
| `resource_id`      | string(100)            | معرف الكيان المستهدف                       |
| `status_code`      | smallint               | كود الاستجابة (200, 201, 422...)           |
| `ip_address`       | ip                     | عنوان IP للمسؤول                           |
| `user_agent`       | text                   | معلومات المتصفح                            |
| `request_data`     | JSON                   | بيانات الطلب (بعد تنظيف البيانات الحساسة)  |
| `response_message` | string(500)            | رسالة الاستجابة من API                     |
| `metadata`         | JSON                   | بيانات إضافية (query params)               |
| `created_at`       | timestamp              | وقت التنفيذ                                |

**الفهارس المركبة:**

| الفهرس                         | الهدف                       |
| ------------------------------ | --------------------------- |
| `(admin_id, created_at)`       | فلترة حسب المسؤول + الترتيب |
| `(method, created_at)`         | فلترة حسب نوع الطلب         |
| `(status_code, created_at)`    | فلترة حسب حالة الاستجابة    |
| `(resource_type, resource_id)` | البحث عن عمليات كيان محدد   |

**FK:** `admin_id` → `admins.id` مع `nullOnDelete` — حذف المسؤول لا يحذف سجلاته.

### 11.3 البنية (Architecture)

```
Request (POST/PUT/PATCH/DELETE)
    │
    ▼
┌─────────────────────────────┐
│  AuditAdminActions          │  (After-middleware)
│  - يتجاوز GET requests       │
│  - يتجاوز auth/* routes      │
│  - يستدعي AuditLogService    │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  AuditLogService            │  (Service class)
│  - sanitizeRequestData()    │  → يحذف password/token/otp
│  - extractResponseMessage() │  → يقرأ رسالة JSON response
│  - logAdminRequest()        │  → يحفظ في audit_logs
│  - try/catch + report()     │  → لا يكسر الطلب أبداً
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  AuditLog Model             │
│  - $timestamps = false      │
│  - casts: request_data,     │
│    metadata → array         │
│  - admin() belongsTo        │
└─────────────────────────────┘
```

### 11.4 الأمان

| الإجراء                | التفاصيل                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| تنظيف البيانات الحساسة | `password`, `password_confirmation`, `current_password`, `token`, `otp` تُحذف |
| معالجة الملفات         | ملفات الرفع تتحول إلى `[uploaded_file]` بدلاً من تخزين المحتوى                |
| تجاوز مسارات المصادقة  | `api/v1/admin/auth/*` لا تُسجَّل                                              |
| عدم كسر الطلبات        | `try/catch` + `report($e)` — إذا فشل التسجيل يكمل الطلب                       |
| FK مع nullOnDelete     | حذف المسؤول يضع `null` في `admin_id` ولا يحذف السجلات                         |

### 11.5 API Endpoint

```
GET /api/v1/admin/settings/audit-logs
```

**Middleware:** `auth:admin` → `AdminStatus` → `admin.audit` → `permission:manage_settings`

**المعاملات (Query Parameters):**

| المعامل       | النوع   | الوصف                                |
| ------------- | ------- | ------------------------------------ |
| `search`      | string  | بحث بالمسار أو اسم/بريد المسؤول      |
| `method`      | enum    | POST, PUT, PATCH, DELETE             |
| `status_code` | integer | كود الحالة (100-599)                 |
| `from_date`   | date    | من تاريخ                             |
| `to_date`     | date    | إلى تاريخ (after_or_equal:from_date) |
| `per_page`    | integer | عدد النتائج (5-100، افتراضي: 20)     |
| `page`        | integer | رقم الصفحة                           |

**الاستجابة:** Paginated response عبر `ApiResponse::successResponse()` مع `admin:id,name,email` eager loading.

### 11.6 واجهة المستخدم (Frontend)

**الصفحة:** `AuditLogsPage.tsx` — تحت `/admin/audit-logs`

| الميزة         | التفاصيل                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| بحث            | بالمسار أو اسم المسؤول                                                                   |
| فلتر الطريقة   | POST / PUT / PATCH / DELETE                                                              |
| فلتر الحالة    | 200, 201, 400, 401, 403, 404, 422, 500                                                   |
| فلتر التاريخ   | من / إلى                                                                                 |
| جدول النتائج   | التاريخ، المسؤول، الطريقة، المسار، الحالة، الكيان، الرسالة                               |
| تصفح الصفحات   | Pagination مع عداد (صفحة X من Y — Z سجل)                                                 |
| تصدير CSV      | مع BOM لدعم العربية في Excel                                                             |
| موداﻝ التفاصيل | بيانات المسؤول + الطلب + الاستجابة + الكيان + IP + request_data (JSON) + metadata (JSON) |
| تحديث          | زر تحديث يدوي + 60 ثانية staleTime                                                       |

**الحماية:**

- Route: `RequirePermission route="/admin/audit-logs"` → `MANAGE_SETTINGS`
- Sidebar: يظهر فقط للمسؤولين الذين يملكون صلاحية `manage_settings`

### 11.7 الملفات المرتبطة

```
# Backend
database/migrations/2026_03_01_210000_create_audit_logs_table.php   # Migration
app/Models/AuditLog.php                                             # Model
app/Services/AuditLogService.php                                    # Service
app/Http/Middleware/AuditAdminActions.php                            # Middleware
app/Http/Controllers/Api/Admin/SettingsController.php               # getAuditLogs()
routes/admin.php                                                    # Route registration
bootstrap/app.php                                                   # Middleware alias

# Frontend
src/pages/admin/AuditLogsPage.tsx                                   # Page component
src/services/adminService.ts                                        # API call
src/hooks/useAdminQueries.ts                                        # React Query hook
src/utils/permissions.ts                                            # Route permission
src/components/admin/AdminLayout.tsx                                # Sidebar link
src/App.tsx                                                         # Route definition
```
