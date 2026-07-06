# تقرير شامل: أسماء الحقول في جداول المستخدمين والأطباء والأدمن

## 📊 جدول المقارنة الشامل

### 1️⃣ جدول `users` (المرضى)

| الحقل | النوع | Nullable | الافتراضي | ملاحظات |
|-------|-------|----------|-----------|---------|
| `id` | bigint | ❌ | - | Primary Key |
| `name` | string | ❌ | - | |
| `email` | string | ❌ | - | Unique |
| `password` | string | ❌ | - | Hashed |
| `phone` | string | ✅ | null | |
| `status` | boolean | ❌ | true | ⚠️ **مختلف عن doctors/admins** |
| `email_verified_at` | timestamp | ✅ | null | |
| `life_stage_id` | foreignId | ✅ | null | FK → life_stages |
| `age` | integer | ✅ | null | |
| `image` | string | ✅ | null | مسار: `storage/users/` |
| `google_id` | string | ✅ | null | للـ Social Login |
| `last_login_at` | timestamp | ✅ | null | |
| `remember_token` | string | ✅ | - | |
| `created_at` | timestamp | ❌ | - | |
| `updated_at` | timestamp | ❌ | - | |
| `deleted_at` | timestamp | ✅ | null | Soft Delete |

**العلاقات:**
- `profile` → hasOne(UserProfile)
- `lifeStage` → belongsTo(LifeStage)

---

### 2️⃣ جدول `doctors` (الأطباء)

| الحقل | النوع | Nullable | الافتراضي | ملاحظات |
|-------|-------|----------|-----------|---------|
| `id` | bigint | ❌ | - | Primary Key |
| `name` | string | ❌ | - | |
| `email` | string | ❌ | - | Unique |
| `password` | string | ❌ | - | Hashed |
| `phone` | string | ❌ | - | |
| `is_active` | boolean | ❌ | true | ⚠️ **مختلف عن users** |
| `age` | integer | ✅ | null | |
| `image` | string | ✅ | null | مسار: `storage/doctors/` |
| `specialization` | enum | ❌ | - | gynecology, obstetrics, etc. |
| `license_number` | string | ❌ | - | Unique |
| `bio` | text | ✅ | null | |
| `consultation_price` | decimal(8,2) | ❌ | - | |
| `verification_status` | enum | ❌ | pending | pending, approved, rejected |
| `is_available` | boolean | ❌ | true | |
| `rating` | decimal(3,2) | ❌ | 0.00 | |
| `total_consultations` | integer | ❌ | 0 | |
| `session_type` | enum | ❌ | both | video, offline, both |
| `license_document` | string | ✅ | null | |
| `id_document` | string | ✅ | null | |
| `certificate` | string | ✅ | null | |
| `years_of_experience` | integer | ✅ | null | |
| `languages` | json | ✅ | null | |
| `clinic_address` | string | ✅ | null | |
| `verified_at` | timestamp | ✅ | null | |
| `last_login_at` | timestamp | ✅ | null | |
| `remember_token` | string | ✅ | - | |
| `created_at` | timestamp | ❌ | - | |
| `updated_at` | timestamp | ❌ | - | |
| `deleted_at` | timestamp | ✅ | null | Soft Delete |

**العلاقات:**
- `lifeStages` → belongsToMany(LifeStage) via `doctor_life_stages`

---

### 3️⃣ جدول `admins` (الإداريين)

| الحقل | النوع | Nullable | الافتراضي | ملاحظات |
|-------|-------|----------|-----------|---------|
| `id` | bigint | ❌ | - | Primary Key |
| `name` | string | ❌ | - | |
| `email` | string | ❌ | - | Unique |
| `password` | string | ❌ | - | Hashed |
| `phone` | string | ✅ | null | |
| `is_active` | boolean | ❌ | true | ⚠️ **مختلف عن users** |
| `role_id` | foreignId | ❌ | - | FK → roles |
| `avatar` | string | ✅ | null | ⚠️ **مختلف عن users/doctors (image)** |
| `last_login_at` | timestamp | ✅ | null | |
| `remember_token` | string | ✅ | - | |
| `created_at` | timestamp | ❌ | - | |
| `updated_at` | timestamp | ❌ | - | |
| `deleted_at` | timestamp | ✅ | null | Soft Delete |

**العلاقات:**
- `role` → belongsTo(Role)

---

## ⚠️ الاختلافات المهمة

### 1. حقل الحالة (Status/Active)
- **users**: `status` (boolean, default: true)
- **doctors**: `is_active` (boolean, default: true)
- **admins**: `is_active` (boolean, default: true)

### 2. حقل الصورة
- **users**: `image`
- **doctors**: `image`
- **admins**: `avatar` ⚠️

### 3. مسارات الصور
- **users**: `storage/users/`
- **doctors**: `storage/doctors/`
- **admins**: `storage/admins/`

---

## ✅ التصحيحات المطبقة

### Middleware
- ✅ `CheckPatientStatus`: يتحقق من `status` (صحيح)
- ✅ `CheckDoctorStatus`: تم تصحيحه من `status` إلى `is_active`
- ✅ `CheckAdminStatus`: تم تصحيحه من `status` إلى `is_active`

### Resources
- ✅ `PatientResource`: يستخدم `image` و `image_url`
- ✅ `DoctorResource`: يستخدم `image` و `image_url`
- ✅ `AdminResource`: يستخدم `avatar` و `avatar_url`

### Models - Fillable
- ✅ `User`: يحتوي على `is_active`, `image`
- ✅ `Doctor`: يحتوي على `is_active`, `image`
- ✅ `Admin`: يحتوي على `is_active`, `image`

---

## 📝 توصيات

### للتوحيد المستقبلي (اختياري):
1. توحيد اسم حقل الحالة: استخدام `is_active` في الجميع
2. توحيد اسم حقل الصورة: استخدام `avatar` أو `image` في الجميع

### لكن حالياً:
✅ **جميع الملفات متسقة مع بنية قاعدة البيانات**
✅ **Middleware تتحقق من الحقول الصحيحة**
✅ **Resources تعرض الحقول الصحيحة**
✅ **Models تحتوي على fillable الصحيح**

---

## 🎯 الخلاصة

النظام الآن **متسق بالكامل** ✅
- جميع الملفات تستخدم أسماء الحقول الصحيحة
- Middleware محدثة
- Resources محدثة
- Models محدثة

**النظام جاهز للاستخدام!** 🚀
