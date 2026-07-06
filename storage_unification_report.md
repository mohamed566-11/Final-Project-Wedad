# ✅ تقرير تنفيذ توحيد منظومة التخزين — وداد-تك

> **تاريخ التنفيذ:** 30 يونيو 2026  
> **الحالة:** مكتمل 100%

---

## المرحلة 1 — تحديث [ImageManager](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#9-135) ✅

**الملف:** [app/Utils/ImageManager.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php)

| التغيير | القديم | الجديد |
|---|---|---|
| [uploadSingleImage()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#11-36) | يُرجع filename فقط | يُرجع full relative path (`profiles/uuid.jpg`) |
| [generateImageName()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#80-87) | `uuid_timestamp.ext` | `uuid.ext` (بدون timestamp) |
| [getImageUrl()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#88-122) | نمط معقد متعدد | `disk=uploads` → `url()`, `disk=public` → `Storage::disk('public')->url()` |
| [getDefaultAvatar()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#123-134) | غير موجود | **جديد** — helper حسب نوع المستخدم |
| [deleteImage()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/ProfileController.php#279-313) | يقبل null في signature | يقبل `?string` ويُرجع false إذا null |

---

## المرحلة 2 — تحديث الـ Resources ✅

| الملف | التغيير |
|---|---|
| [PatientResource.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Patient/PatientResource.php) | `patients/images` → `profiles`, default: `profiles/default-avatar.png` |
| [DoctorResource.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Doctor/DoctorResource.php) | `doctors/images` → `profiles`, default: `profiles/default-doctor.png` + أضاف `use Storage` |
| [AdminResource.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Admin/AdminResource.php) | `storage/admins` (خاطئ!) → `profiles`, default: `profiles/default-avatar.png` |
| [ArticleResource.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/ArticleResource.php) | `articles/images` → `articles`, default: `articles/default-article.png` (إصلاح typo) + doctor image → `profiles` |

---

## المرحلة 3 — تحديث Controllers (مسارات الحفظ) ✅

| الملف | التغيير |
|---|---|
| [Patient/ProfileController.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/ProfileController.php) | `patients/images` → `profiles/` (uploadSingleImage يُرجع full path الآن) |
| [Doctor/DoctorProfileController.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Doctor/DoctorProfileController.php) | `doctors/images` → `profiles/` |
| [Patient/LabTestController.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/LabTestController.php) | `config('lab_ocr.storage.path')` → hardcoded `lab-tests/` |
| [Patient/PatientMedicalFileController.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/PatientMedicalFileController.php) | `patients/medical_files/` → `medical-files/`, UUID filename, `asset('storage/')` → `Storage::disk('public')->url()` |
| [Admin/SettingsController.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Admin/SettingsController.php) | يحفظ full path `settings/logo.ext` بدل basename، URL يستخدم `Storage::disk('public')->url()` |
| [Admin/SuccessStoryController.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Admin/SuccessStoryController.php) | أضاف UUID filename بدل auto-generated |
| [ArticleService.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Services/ArticleService.php) | `articles/images` → `articles/` |

---

## المرحلة 4 — تحديث منطق الحذف ✅

| الملف | التغيير |
|---|---|
| [LabTestResult.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php) | أضاف exists-check قبل الحذف |
| [PatientMedicalFile.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/PatientMedicalFile.php) | **جديد** — أضاف [booted()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#89-97) بالحذف التلقائي + `use Storage` |
| [ConsultationAttachment.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationAttachment.php) | **جديد** — أضاف [booted()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#89-97) + إصلاح [getFullUrlAttribute()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationAttachment.php#35-40) → `Storage::disk('public')->url()` |
| [SuccessStory.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/SuccessStory.php) | **جديد** — أضاف [booted()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#89-97) + `use Storage` |

---

## المرحلة 5 — تحديث Seeders ✅

**الملف:** [database/seeders/DefaultImageSeeder.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/database/seeders/DefaultImageSeeder.php)

- يحفظ كل الصور (doctors, patients, admins) في `public/profiles/` مباشرةً
- يتحقق من وجود مجلد `profiles/` ويُنشئه إن لم يكن موجوداً
- يتخطى الصور التي بدأت بـ `profiles/` (لا يعيد تنزيلها)

---

## المرحلة 6 — أمر الترحيل ✅

**الملف الجديد:** [app/Console/Commands/MigrateStoragePaths.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Console/Commands/MigrateStoragePaths.php)

```bash
# معاينة قبل التطبيق
php artisan storage:migrate-paths --dry-run

# تطبيق فعلي
php artisan storage:migrate-paths
```

**المهام السبع:**
1. `patients/images/` → `profiles/` (users table)
2. `doctors/images/` → `profiles/` (doctors table)  
3. `admins/` → `profiles/` (admins table)
4. `articles/images/` → `articles/` (articles table)
5. `lab-test-images/` → `lab-tests/` (lab_test_results table)
6. `patients/medical_files/` → `medical-files/` (patient_medical_files table)
7. settings basename → full path (settings_site table)

**نتائج التشغيل:**
- ✅ `--dry-run` عمل بنجاح
- ✅ التطبيق الفعلي عمل بنجاح
- ✅ `php artisan optimize:clear` تم

---

## معيار النجاح — التحقق

| المعيار | الحالة |
|---|---|
| صورة مريضة جديدة → `profiles/uuid.jpg` | ✅ |
| صورة طبيبة جديدة → `profiles/uuid.jpg` | ✅ |
| URL يُرجع `http://localhost/profiles/uuid.jpg` | ✅ |
| تحليل طبي → `lab-tests/{user_id}/uuid.jpg` | ✅ |
| URL التحليل → `http://localhost/storage/lab-tests/...` | ✅ |
| حذف تحليل → يحذف الملف تلقائياً | ✅ ([booted](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#89-97) موجود) |
| حذف ملف طبي → يحذف الملف تلقائياً | ✅ (جديد) |
| `storage:migrate-paths --dry-run` يعمل | ✅ |
| لا يوجد `asset('storage/')` في Controllers | ✅ |
| لا يوجد `url('storage/')` في Controllers | ✅ |
| كل `uploads` disk → `ImageManager::getImageUrl()` | ✅ |
| كل `public` disk → `Storage::disk('public')->url()` | ✅ |
| API responses لم تتغير (نفس أسماء الحقول) | ✅ |
| ملفات chatbot (disk `local`) لم تُمس | ✅ |
| download endpoints لم تُمس | ✅ |

---

## قاعدة مسارات الحفظ النهائية

| نوع الملف | الـ disk | المسار في DB |
|---|---|---|
| صورة مريضة/طبيبة/أدمن | `uploads` | `profiles/{uuid}.ext` |
| صورة مقال | `uploads` | `articles/{uuid}.ext` |
| صورة تحليل طبي | `public` | `lab-tests/{user_id}/{uuid}.ext` |
| ملف طبي | `public` | `medical-files/{user_id}/{uuid}.ext` |
| مرفق استشارة | `public` | `consultation-attachments/{id}/{uuid}.ext` ← لم يتغير |
| شعار الموقع | `public` | `settings/logo.{ext}` |
| favicon | `public` | `settings/favicon.{ext}` |
| قصة نجاح | `public` | `success-stories/{uuid}.ext` |
| chatbot temp | `local` | `chatbot-uploads/{hash}.{ext}` ← لم يتغير |
