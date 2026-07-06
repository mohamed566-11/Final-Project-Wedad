# 🗂️ برومبت الإيجنت — توحيد منظومة الصور والملفات في مشروع وداد

---

## 📌 السياق والهدف

أنت خبير Laravel متخصص في refactoring. مهمتك **تنفيذ توحيد كامل** لمنظومة الصور والملفات في مشروع وداد-تك.

**القرارات المحددة مسبقاً:**
- الـ disks: يبقى الاثنان (`public` و `uploads`) لكن بأسلوب استخدام موحّد ومحدد
- بناء URL: نمط واحد لكل disk — `Storage::url()` لـ `public`، `ImageManager::getImageUrl()` لـ `uploads`
- مسارات الحفظ: تُوحَّد — كل صور البروفايل في `profiles/` بدلاً من `patients/images/` و `doctors/images/` و `admins/`
- **لا تغيير في الـ API responses** — نفس الحقول، نفس الأسماء، فقط القيم تتغير

---

## 📂 الملفات المطلوب قراءتها قبل البدء

```
[1]  Back-end/config/filesystems.php
[2]  Back-end/app/Utils/ImageManager.php
[3]  Back-end/app/Models/User.php
[4]  Back-end/app/Models/Doctor.php
[5]  Back-end/app/Models/Admin.php
[6]  Back-end/app/Models/Article.php
[7]  Back-end/app/Models/LabTestResult.php
[8]  Back-end/app/Models/ConsultationAttachment.php
[9]  Back-end/app/Models/PatientMedicalFile.php
[10] Back-end/app/Models/SuccessStory.php
[11] Back-end/app/Models/SettingsSite.php
[12] Back-end/app/Models/ConsultationMessage.php
[13] Back-end/app/Http/Resources/Patient/PatientResource.php
[14] Back-end/app/Http/Resources/Doctor/DoctorResource.php
[15] Back-end/app/Http/Resources/Admin/AdminResource.php
[16] Back-end/app/Http/Resources/ArticleResource.php
[17] Back-end/app/Http/Controllers/Api/Patient/ProfileController.php
[18] Back-end/app/Http/Controllers/Api/Doctor/DoctorProfileController.php
[19] Back-end/app/Http/Controllers/Api/Patient/LabTestController.php
[20] Back-end/app/Http/Controllers/Api/Patient/PatientMedicalFileController.php
[21] Back-end/app/Http/Controllers/Api/ConsultationAttachmentController.php
[22] Back-end/app/Http/Controllers/Api/Admin/SettingsController.php
[23] Back-end/app/Http/Controllers/Api/Admin/SuccessStoryController.php
[24] Back-end/app/Services/ArticleService.php
[25] Back-end/app/Http/Requests/Patient/UpdateBasicInfoRequest.php
[26] Back-end/app/Http/Requests/StoreArticleRequest.php
[27] Back-end/database/seeders/
```

> **إلزامي:** اقرأ كل الملفات قبل كتابة أي سطر كود.

---

## 🎯 قواعد التوحيد الثلاث

---

### القاعدة 1 — تحديد الـ disk لكل نوع ملف

| نوع الملف | الـ disk | السبب |
|---|---|---|
| صور البروفايل (patients, doctors, admins) | `uploads` | موجودة حالياً هناك، `ImageManager` يتعامل معها |
| صور المقالات | `uploads` | نفس السبب |
| ملفات التحاليل (lab tests) | `public` | تحتاج OCR processing عبر path مباشر |
| ملفات المرضى الطبية | `public` | ملفات طبية تحتاج download محمي |
| مرفقات الاستشارات | `public` | نفس السبب |
| صور الدردشة | `public` | موجودة حالياً هناك |
| ملفات الـ Chatbot RAG | `local` | مؤقتة — تُحذف بعد الرفع لـ HF |
| شعار الموقع وـ Favicon | `public` | إعدادات عامة |
| صور قصص النجاح | `public` | محتوى عام |

**القاعدة:** لا تغيّر الـ disk إذا كان الملف يعمل — فقط وحّد الأسلوب.

---

### القاعدة 2 — نمط بناء الـ URL لكل disk

#### لـ disk `uploads` — استخدم `ImageManager::getImageUrl()` دائماً
```php
// ✅ الصحيح في كل Resource يستخدم uploads disk:
'image_url' => $this->imageManager->getImageUrl(
    $this->image,
    'profiles',      // ← المجلد الموحّد
    'uploads',
    'profiles/default-avatar.png'
),

// ❌ ممنوع في uploads disk:
'image_url' => Storage::url($this->image),
'image_url' => asset('storage/' . $this->image),
'image_url' => url($this->image),
```

#### لـ disk `public` — استخدم `Storage::disk('public')->url()` دائماً
```php
// ✅ الصحيح في كل Controller/Resource يستخدم public disk:
'file_url' => $model->file_path
    ? Storage::disk('public')->url($model->file_path)
    : null,

// ❌ ممنوع في public disk:
'file_url' => asset('storage/' . $model->file_path),
'file_url' => url('storage/' . $model->file_path),
```

**استثناء Download URLs:** الملفات التي تحتاج تحميلاً محمياً (medical files, attachments, chat images) تبقى على نمط الـ download endpoint الحالي — لا تغيير.

---

### القاعدة 3 — مسارات الحفظ الموحّدة

| نوع الملف | المسار القديم | المسار الجديد | الـ disk |
|---|---|---|---|
| صورة مريضة | `patients/images/{uuid}_{ts}.ext` | `profiles/{uuid}.ext` | `uploads` |
| صورة طبيبة | `doctors/images/{uuid}_{ts}.ext` | `profiles/{uuid}.ext` | `uploads` |
| صورة أدمن | `admins/{auto}.ext` | `profiles/{uuid}.ext` | `uploads` |
| صورة مقال | `articles/images/{uuid}_{ts}.ext` | `articles/{uuid}.ext` | `uploads` |
| صورة تحليل | `lab-test-images/{user_id}/{uuid}.ext` | `lab-tests/{user_id}/{uuid}.ext` | `public` |
| ملف طبي | `patients/medical_files/{user_id}/{ts}_{name}` | `medical-files/{user_id}/{uuid}.ext` | `public` |
| مرفق استشارة | `consultation-attachments/{id}/{uuid}.ext` | `consultation-attachments/{id}/{uuid}.ext` | `public` ← لا تغيير |
| شعار الموقع | `settings/{auto}.ext` | `settings/logo.{ext}` | `public` |
| قصة نجاح | `success-stories/{auto}.ext` | `success-stories/{uuid}.ext` | `public` |

**قاعدة التسمية الموحّدة:** كل ملف جديد = `Str::uuid() . '.' . $extension` — بدون timestamp في الاسم.

---

## 🔧 التنفيذ — المرحلة بمرحلة

---

## المرحلة 1 — تحديث `ImageManager` (الأساس)

### 1.1 الملف: `app/Utils/ImageManager.php`

**التغييرات المطلوبة:**

#### أ) تحديث `uploadSingleImage()` — توحيد اسم الملف

```php
// القديم: يُولّد UUID_timestamp
public function uploadSingleImage($image, string $path, string $disk = 'uploads'): string

// الجديد: يُولّد UUID فقط + يُرجع full relative path
public function uploadSingleImage($image, string $path, string $disk = 'uploads'): string
{
    // التحقق من النوع والحجم (يبقى كما هو)
    $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024;

    if (!in_array($image->getMimeType(), $allowedMimes)) {
        throw new \InvalidArgumentException('نوع الصورة غير مدعوم');
    }
    if ($image->getSize() > $maxSize) {
        throw new \InvalidArgumentException('حجم الصورة يتجاوز الحد المسموح');
    }

    // توليد اسم موحّد
    $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();

    // الحفظ وإرجاع الـ relative path الكامل
    return $image->storeAs($path, $filename, $disk);
    // يُرجع: 'profiles/uuid.jpg' أو 'articles/uuid.png'
}
```

#### ب) تحديث `generateImageName()` — إزالة الـ timestamp

```php
// القديم:
public function generateImageName($image): string
{
    return Str::uuid() . '_' . time() . '.' . $image->getClientOriginalExtension();
}

// الجديد:
public function generateImageName($image): string
{
    return Str::uuid() . '.' . $image->getClientOriginalExtension();
}
```

#### ج) تحديث `getImageUrl()` — توحيد المسارات

```php
// الجديد: منطق أبسط بعد توحيد المسارات
public function getImageUrl(
    ?string $imagePath,
    string $folder = 'profiles',
    string $disk = 'uploads',
    ?string $defaultImage = null
): string {
    // القيمة الافتراضية
    if (!$imagePath) {
        return url($defaultImage ?? 'images/default-avatar.png');
    }

    // رابط خارجي (UI Avatars, etc.)
    if (str_starts_with($imagePath, 'http')) {
        return $imagePath;
    }

    // disk uploads → public/ مباشرةً (بدون /storage/)
    if ($disk === 'uploads') {
        // إذا المسار يتضمن الـ folder بالفعل → url() مباشرة
        if (str_starts_with($imagePath, $folder . '/') || str_starts_with($imagePath, $folder)) {
            return url($imagePath);
        }
        return url($folder . '/' . $imagePath);
    }

    // disk public → /storage/
    return Storage::disk('public')->url($imagePath);
}
```

#### د) إضافة `getDefaultAvatar()` helper

```php
// helper جديد للصور الافتراضية
public function getDefaultAvatar(string $type = 'user'): string
{
    return match($type) {
        'doctor' => url('profiles/default-doctor.png'),
        'admin'  => url('profiles/default-admin.png'),
        default  => url('profiles/default-avatar.png'),
    };
}
```

اكتب الملف `app/Utils/ImageManager.php` كاملاً بعد التعديل.

---

## المرحلة 2 — تحديث الـ Resources (بناء URL)

### 2.1 `PatientResource.php`

```php
// القديم:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'patients/images', 'uploads', 'patients/images/default-user.png'
),

// الجديد:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'
),
```

### 2.2 `DoctorResource.php`

```php
// القديم:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'doctors/images', 'uploads', 'doctors/images/default-doctor.png'
),

// الجديد:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'
),

// وثائق الطبيب — تبقى على public disk:
'license_document' => $this->license_document
    ? Storage::disk('public')->url($this->license_document)
    : null,
'id_document' => $this->id_document
    ? Storage::disk('public')->url($this->id_document)
    : null,
'certificate' => $this->certificate
    ? Storage::disk('public')->url($this->certificate)
    : null,
```

### 2.3 `AdminResource.php`

```php
// القديم:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'storage/admins', 'uploads', 'patients/images/default-user.png'
),
// لاحظ: 'storage/admins' خاطئ في القديم!

// الجديد:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'
),
```

### 2.4 `ArticleResource.php`

```php
// القديم:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'articles/images', 'uploads', 'articles/images/default-aericle.png'
),

// الجديد:
'image' => $this->imageManager->getImageUrl(
    $this->image, 'articles', 'uploads', 'articles/default-article.png'
),
```

### 2.5 `LabTestResource` (أو في Controller)

```php
// القديم (في Model accessor):
public function getImageUrlAttribute(): ?string
{
    return $this->image_path ? Storage::url($this->image_path) : null;
}

// الجديد — يبقى Storage::disk('public') لكن صريح:
public function getImageUrlAttribute(): ?string
{
    return $this->image_path
        ? Storage::disk('public')->url($this->image_path)
        : null;
}
```

### 2.6 Controllers تستخدم `asset('storage/')`

ابحث في كل Controller عن:
```php
asset('storage/' . $model->file_path)
```
وعدّلها لـ:
```php
Storage::disk('public')->url($model->file_path)
```

التأثير على:
- `PatientMedicalFileController` → `file_url`
- `ConsultationAttachmentController` → `url`
- `SettingsController` → `logo`, `favicon`

اكتب كل Resource وController كاملاً بعد التعديل.

---

## المرحلة 3 — تحديث Controllers (مسارات الحفظ)

### 3.1 `Patient\ProfileController::updateBasicInfo()`

```php
// القديم:
$imageName = $this->imageManager->generateImageName($request->file('image'));
$this->imageManager->uploadSingleImage($request->file('image'), 'patients/images', 'uploads');

// الجديد:
$imagePath = $this->imageManager->uploadSingleImage(
    $request->file('image'),
    'profiles',   // ← المجلد الموحّد
    'uploads'
);
// يُحفظ في DB: 'profiles/uuid.jpg'
$user->update(['image' => $imagePath]);
```

### 3.2 `Doctor\DoctorProfileController::update()`

```php
// القديم:
$imageName = $this->imageManager->generateImageName($request->file('image'));
$this->imageManager->uploadSingleImage($request->file('image'), 'doctors/images', 'uploads');

// الجديد:
$imagePath = $this->imageManager->uploadSingleImage(
    $request->file('image'),
    'profiles',
    'uploads'
);
$doctor->update(['image' => $imagePath]);
```

### 3.3 `Patient\LabTestController::upload()`

```php
// القديم:
$directory = config('lab_ocr.storage.path') . '/' . $user->id;
// يُنتج: 'lab-test-images/{user_id}'

// الجديد:
$directory = 'lab-tests/' . $user->id;
$filename  = Str::uuid() . '.' . $image->getClientOriginalExtension();
$imagePath = Storage::disk('public')->putFileAs($directory, $image, $filename);
// يُحفظ في DB: 'lab-tests/{user_id}/uuid.jpg'
```

### 3.4 `Patient\PatientMedicalFileController::store()`

```php
// القديم:
$sanitizedName = time() . '_' . Str::slug($file->getClientOriginalName());
$path = $file->storeAs('patients/medical_files/' . $user->id, $sanitizedName, 'public');

// الجديد:
$filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
$path     = $file->storeAs('medical-files/' . $user->id, $filename, 'public');
// يُحفظ في DB: 'medical-files/{user_id}/uuid.pdf'
```

### 3.5 `Admin\SettingsController::updateSiteSettings()`

```php
// القديم:
$logoPath    = $request->file('logo')->store('settings', 'public');
$faviconPath = $request->file('favicon')->store('settings', 'public');
// يُحفظ في DB: basename($logoPath) فقط!

// الجديد:
$logoExt     = $request->file('logo')->getClientOriginalExtension();
$logoPath    = $request->file('logo')->storeAs('settings', 'logo.' . $logoExt, 'public');
$faviconExt  = $request->file('favicon')->getClientOriginalExtension();
$faviconPath = $request->file('favicon')->storeAs('settings', 'favicon.' . $faviconExt, 'public');
// يُحفظ في DB: المسار الكامل 'settings/logo.png' (لا basename)
// تعديل SettingsController::getSiteSettings أيضاً:
'logo'    => $settings->logo ? Storage::disk('public')->url($settings->logo) : null,
'favicon' => $settings->favicon ? Storage::disk('public')->url($settings->favicon) : null,
```

### 3.6 `Admin\SuccessStoryController`

```php
// القديم:
$path = $request->file('patient_image')->store('success-stories', 'public');

// الجديد:
$filename = Str::uuid() . '.' . $request->file('patient_image')->getClientOriginalExtension();
$path     = $request->file('patient_image')->storeAs('success-stories', $filename, 'public');
```

### 3.7 `ArticleService` (عبر `ImageManager`)

```php
// القديم:
$this->imageManager->uploadSingleImage($image, 'articles/images', 'uploads');

// الجديد:
$this->imageManager->uploadSingleImage($image, 'articles', 'uploads');
```

اكتب كل Controller كاملاً بعد التعديل.

---

## المرحلة 4 — تحديث منطق الحذف

### 4.1 توحيد `deleteImage()` في `ImageManager`

```php
// القديم: يفحص الوجود ثم يحذف
public function deleteImage(?string $path, string $disk = 'uploads'): bool
{
    if (!$path) return false;
    if (Storage::disk($disk)->exists($path)) {
        return Storage::disk($disk)->delete($path);
    }
    return false;
}
// يبقى كما هو — منطق صحيح
```

### 4.2 `LabTestResult::booted()` — تحديث المسار

```php
// القديم:
static::deleting(function (LabTestResult $labTest) {
    if ($labTest->image_path) {
        Storage::disk('public')->delete($labTest->image_path);
    }
});

// الجديد: يبقى نفسه (disk صحيح) لكن يتحقق من الوجود:
static::deleting(function (LabTestResult $labTest) {
    if ($labTest->image_path && Storage::disk('public')->exists($labTest->image_path)) {
        Storage::disk('public')->delete($labTest->image_path);
    }
});
```

### 4.3 إضافة `booted()` للـ Models التي تفتقده

أضف `booted()` للـ Models التالية التي ليس لها حذف تلقائي:

```php
// PatientMedicalFile::booted()
protected static function booted(): void
{
    static::deleting(function (PatientMedicalFile $file) {
        if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
            Storage::disk('public')->delete($file->file_path);
        }
    });
}

// ConsultationAttachment::booted()
protected static function booted(): void
{
    static::deleting(function (ConsultationAttachment $attachment) {
        if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }
    });
}

// SuccessStory::booted()
protected static function booted(): void
{
    static::deleting(function (SuccessStory $story) {
        if ($story->patient_image && Storage::disk('public')->exists($story->patient_image)) {
            Storage::disk('public')->delete($story->patient_image);
        }
    });
}
```

**لا تضف `booted()` لـ `User` و `Doctor`** — حذفهم يتم عبر `ImageManager::deleteImage()` في Controllers وهذا مقصود (حذف ناعم / soft delete).

اكتب كل Model كاملاً بعد التعديل.

---

## المرحلة 5 — تحديث الـ Seeders

### 5.1 `DefaultImageSeeder` (أو `DoctorSeeder` / `PatientSeeder`)

```php
// القديم:
$path = "doctors/images/doctor_{$doctor->id}.png";
$path = "patients/images/patient_{$user->id}.png";

// الجديد — كل البروفايلات في profiles/:
$filename = "doctor_{$doctor->id}.png";
$path = "profiles/{$filename}";
Storage::disk('uploads')->put($path, $imageContent);
$doctor->update(['image' => $path]);

$filename = "patient_{$user->id}.png";
$path = "profiles/{$filename}";
Storage::disk('uploads')->put($path, $imageContent);
$user->update(['image' => $path]);
```

### 5.2 صور الـ Seeders الافتراضية

ضع ملفات الصور الافتراضية في:
```
public/profiles/default-avatar.png   ← للمرضى والأدمن
public/profiles/default-doctor.png   ← للأطباء
public/articles/default-article.png  ← للمقالات (كان: default-aericle.png)
```

اكتب الـ Seeders كاملاً بعد التعديل.

---

## المرحلة 6 — Migration للبيانات الموجودة

### 6.1 أنشئ Command جديد: `php artisan storage:migrate-paths`

```php
// app/Console/Commands/MigrateStoragePaths.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;
use App\Models\Article;
use App\Models\LabTestResult;
use App\Models\PatientMedicalFile;
use App\Models\SettingsSite;

class MigrateStoragePaths extends Command
{
    protected $signature   = 'storage:migrate-paths {--dry-run : عرض التغييرات بدون تطبيقها}';
    protected $description = 'ترحيل مسارات الملفات القديمة للمسارات الموحّدة الجديدة';

    public function handle(): void
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? '🔍 وضع المعاينة — لا تغييرات فعلية' : '🚀 بدء الترحيل...');

        // 1. صور المرضى: patients/images/ → profiles/
        $this->migrateUserImages($dryRun);

        // 2. صور الأطباء: doctors/images/ → profiles/
        $this->migrateDoctorImages($dryRun);

        // 3. صور الأدمن: admins/ → profiles/
        $this->migrateAdminImages($dryRun);

        // 4. صور المقالات: articles/images/ → articles/
        $this->migrateArticleImages($dryRun);

        // 5. صور التحاليل: lab-test-images/ → lab-tests/
        $this->migrateLabTestImages($dryRun);

        // 6. الملفات الطبية: patients/medical_files/ → medical-files/
        $this->migrateMedicalFiles($dryRun);

        // 7. إعدادات الموقع: settings/{basename} → settings/logo.ext
        $this->migrateSettingsFiles($dryRun);

        $this->info('✅ انتهى الترحيل');
    }

    private function migrateUserImages(bool $dryRun): void
    {
        $this->info('📁 ترحيل صور المرضى...');
        $count = 0;

        User::whereNotNull('image')
            ->where('image', 'like', 'patients/images/%')
            ->chunkById(100, function ($users) use ($dryRun, &$count) {
                foreach ($users as $user) {
                    $oldPath  = $user->image;
                    $filename = basename($oldPath);
                    $newPath  = 'profiles/' . $filename;

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        // انسخ الملف للمسار الجديد
                        if (file_exists(public_path($oldPath))) {
                            if (!file_exists(public_path('profiles'))) {
                                mkdir(public_path('profiles'), 0755, true);
                            }
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $user->update(['image' => $newPath]);
                    }
                    $count++;
                }
            });

        $this->info("  → {$count} صورة مرحَّلة");
    }

    private function migrateDoctorImages(bool $dryRun): void
    {
        $this->info('📁 ترحيل صور الأطباء...');
        $count = 0;

        Doctor::whereNotNull('image')
            ->where('image', 'like', 'doctors/images/%')
            ->chunkById(100, function ($doctors) use ($dryRun, &$count) {
                foreach ($doctors as $doctor) {
                    $oldPath  = $doctor->image;
                    $filename = basename($oldPath);
                    $newPath  = 'profiles/' . $filename;

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (file_exists(public_path($oldPath))) {
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $doctor->update(['image' => $newPath]);
                    }
                    $count++;
                }
            });

        $this->info("  → {$count} صورة مرحَّلة");
    }

    private function migrateAdminImages(bool $dryRun): void
    {
        $this->info('📁 ترحيل صور الأدمن...');
        // نفس النمط — uploads disk مباشرة في public/admins/

        Admin::whereNotNull('image')
            ->where('image', 'not like', 'profiles/%')
            ->chunkById(100, function ($admins) use ($dryRun) {
                foreach ($admins as $admin) {
                    $oldPath = $admin->image;
                    $newPath = 'profiles/' . basename($oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (file_exists(public_path($oldPath))) {
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $admin->update(['image' => $newPath]);
                    }
                }
            });
    }

    private function migrateArticleImages(bool $dryRun): void
    {
        $this->info('📁 ترحيل صور المقالات...');

        \App\Models\Article::whereNotNull('image')
            ->where('image', 'like', 'articles/images/%')
            ->chunkById(100, function ($articles) use ($dryRun) {
                foreach ($articles as $article) {
                    $oldPath = $article->image;
                    $newPath = 'articles/' . basename($oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (file_exists(public_path($oldPath))) {
                            if (!file_exists(public_path('articles'))) {
                                mkdir(public_path('articles'), 0755, true);
                            }
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $article->update(['image' => $newPath]);
                    }
                }
            });
    }

    private function migrateLabTestImages(bool $dryRun): void
    {
        $this->info('📁 ترحيل صور التحاليل...');

        LabTestResult::whereNotNull('image_path')
            ->where('image_path', 'like', 'lab-test-images/%')
            ->chunkById(100, function ($tests) use ($dryRun) {
                foreach ($tests as $test) {
                    $oldPath = $test->image_path;
                    // lab-test-images/{user_id}/file.jpg → lab-tests/{user_id}/file.jpg
                    $newPath = str_replace('lab-test-images/', 'lab-tests/', $oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->copy($oldPath, $newPath);
                        }
                        $test->update(['image_path' => $newPath]);
                    }
                }
            });
    }

    private function migrateMedicalFiles(bool $dryRun): void
    {
        $this->info('📁 ترحيل الملفات الطبية...');

        PatientMedicalFile::whereNotNull('file_path')
            ->where('file_path', 'like', 'patients/medical_files/%')
            ->chunkById(100, function ($files) use ($dryRun) {
                foreach ($files as $file) {
                    $oldPath = $file->file_path;
                    // patients/medical_files/{user_id}/{name} → medical-files/{user_id}/{name}
                    $newPath = str_replace('patients/medical_files/', 'medical-files/', $oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->copy($oldPath, $newPath);
                        }
                        $file->update(['file_path' => $newPath]);
                    }
                }
            });
    }

    private function migrateSettingsFiles(bool $dryRun): void
    {
        $this->info('📁 ترحيل إعدادات الموقع...');

        $settings = SettingsSite::first();
        if (!$settings) return;

        // إذا كان محفوظاً كـ basename فقط
        if ($settings->logo && !str_contains($settings->logo, '/')) {
            $newLogo = 'settings/' . $settings->logo;
            $this->line("  logo: {$settings->logo} → {$newLogo}");
            if (!$dryRun) {
                $settings->update(['logo' => $newLogo]);
            }
        }

        if ($settings->favicon && !str_contains($settings->favicon, '/')) {
            $newFavicon = 'settings/' . $settings->favicon;
            $this->line("  favicon: {$settings->favicon} → {$newFavicon}");
            if (!$dryRun) {
                $settings->update(['favicon' => $newFavicon]);
            }
        }
    }
}
```

اكتب هذا الـ Command كاملاً.

---

## المرحلة 7 — تحديث الـ Tests

### 7.1 تحديث `Storage::fake()` في الاختبارات

```php
// في كل test يرفع ملفات — بعد التوحيد:
Storage::fake('uploads'); // لصور البروفايل والمقالات
Storage::fake('public');  // لباقي الملفات

// تحقق من المسار الجديد:
Storage::disk('uploads')->assertExists('profiles/' . /* filename */);
// بدلاً من:
Storage::disk('uploads')->assertExists('patients/images/' . /* filename */);
```

### 7.2 `FeatureTest\Consultation\MedicalFileTest`

```php
// تحديث assertion:
Storage::disk('public')->assertExists('medical-files/' . $user->id . '/' . /* filename */);
// بدلاً من:
Storage::disk('public')->assertExists('patients/medical_files/...');
```

---

## 🚀 ترتيب التنفيذ

```
الخطوة 1: اقرأ كل الملفات (إلزامي)
الخطوة 2: نفّذ المرحلة 1 — تحديث ImageManager كاملاً
الخطوة 3: نفّذ المرحلة 2 — تحديث Resources (4 ملفات)
الخطوة 4: نفّذ المرحلة 3 — تحديث Controllers (6 controllers)
الخطوة 5: نفّذ المرحلة 4 — تحديث منطق الحذف (3 Models + تحديث موجودين)
الخطوة 6: نفّذ المرحلة 5 — تحديث Seeders
الخطوة 7: نفّذ المرحلة 6 — إنشاء MigrateStoragePaths Command
الخطوة 8: نفّذ المرحلة 7 — تحديث Tests
الخطوة 9: أنشئ مجلد public/profiles/ وضع الصور الافتراضية فيه
الخطوة 10: شغّل الأوامر:
    php artisan storage:migrate-paths --dry-run  ← معاينة أولاً
    php artisan storage:migrate-paths            ← تطبيق فعلي
    php artisan test --filter=Storage            ← تحقق
```

---

## 🚫 قواعد صارمة لا تنكسر

| القاعدة | التفاصيل |
|---|---|
| **لا تكسر الـ API** | نفس أسماء الحقول في الـ responses — فقط القيم تتغير |
| **لا تحذف الملفات القديمة** | Command الترحيل ينسخ فقط — الحذف يدوياً بعد التأكد |
| **`--dry-run` أولاً دائماً** | لا تشغّل الترحيل بدون معاينة أولاً |
| **`chunkById` للـ DB** | لا `User::all()` — استخدم chunk للسجلات الكثيرة |
| **لا تغيّر Download URLs** | الملفات المحمية (medical files, attachments, chat) تبقى كما هي |
| **الملفات المؤقتة (chatbot)** | disk `local` يبقى كما هو — لا تغيير |
| **الاختبارات أولاً بعد كل مرحلة** | `php artisan test` بعد كل مرحلة قبل الانتقال للتالية |
| **لا basename في DB** | دائماً احفظ المسار الكامل النسبي مثل `settings/logo.png` |

---

## ✅ معيار نجاح التوحيد

```bash
# بعد الانتهاء — كل هذه يجب أن تعمل:

# 1. صورة مريضة جديدة تُحفظ في profiles/
# 2. صورة طبيبة جديدة تُحفظ في profiles/
# 3. URL الصورة يُرجع http://localhost/profiles/uuid.jpg
# 4. تحليل طبي جديد يُحفظ في lab-tests/{user_id}/
# 5. URL التحليل يُرجع http://localhost/storage/lab-tests/...
# 6. حذف تحليل → يحذف الملف تلقائياً
# 7. حذف ملف طبي → يحذف الملف تلقائياً (booted جديد)
# 8. php artisan storage:migrate-paths --dry-run يعمل بدون أخطاء
# 9. php artisan test → كل الاختبارات تعمل
# 10. لا يوجد asset('storage/') في أي Controller
# 11. لا يوجد url('storage/') في أي Controller
# 12. كل uploads disk → ImageManager::getImageUrl()
# 13. كل public disk → Storage::disk('public')->url()
```

---

*البرومبت مبني على التقرير التوثيقي الشامل لمشروع وداد-تك — يونيو 2026*
*القرارات: disk مزدوج محتفظ به + URL موحّد per disk + مسار profiles/ موحّد*
