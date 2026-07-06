# 📁 التقرير التوثيقي الشامل — منظومة الصور والملفات في مشروع وداد-تك

> **التاريخ:** 2025  
> **المشروع:** Widad-Tech — Laravel Backend  
> **الهدف:** توثيق كامل ودقيق لمنظومة إدارة الملفات والصور كما هي في الكود المصدري

---

## 1. إعدادات التخزين (Storage Disks)

### الملف: [config/filesystems.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/config/filesystems.php)

| الـ Disk | الـ Driver | الـ Root | الـ Visibility | الوصف |
|----------|-----------|---------|----------------|-------|
| `local` | `local` | `storage/app/private` | — | التخزين الخاص (غير عام) |
| `public` | `local` | `storage/app/public` | `public` | التخزين العام المرتبط بـ symlink |
| `uploads` | `local` | `public/` | `public` | يكتب مباشرة في `public/` بدون symlink |
| `s3` | `s3` | — | — | إعداد S3 موجود لكنه غير مفعّل (متغيرات بيئية فارغة) |

### الـ Symlink المُدار
```php
'links' => [
    public_path('storage') => storage_path('app/public'),
]
```
أي أن: `public/storage/` ↔ `storage/app/public/`

### متغيرات البيئة ذات الصلة ([.env.example](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/.env.example))
```
FILESYSTEM_DISK=local
APP_URL=http://localhost
```

---

## 2. هيكل المجلدات الفعلي

### مجلد `storage/app/public/` (disk: `public`)
```
storage/app/public/
├── .gitignore
├── about/
├── admins/
├── consultation-attachments/
│   └── {consultation_id}/
├── doctors/
├── lab-test-images/
│   └── {user_id}/
├── patients/
└── settings/
```

### مجلد `public/` (disk: `uploads`)
يُكتب فيه مباشرةً بواسطة [ImageManager](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#9-111). المجلدات المُستخدمة:
```
public/
├── patients/
│   └── images/
│       ├── {uuid}_{timestamp}.ext
│       └── default-user.png
├── doctors/
│   └── images/
│       ├── {uuid}_{timestamp}.ext
│       └── default-doctor.png
└── articles/
    └── images/
        ├── {uuid}_{timestamp}.ext
        └── default-aericle.png
```

### مجلد `storage/app/private/` (disk: `local`)
يُستخدم فقط مؤقتاً لملفات الـ Chatbot قبل معالجتها:
```
storage/app/private/
└── chatbot-uploads/
    └── {hash}.{ext}  ← ملف مؤقت يُحذف بعد الرفع لـ HuggingFace
```

---

## 3. النماذج (Models) وحقول الملفات

### جدول شامل للنماذج وحقول الملفات

| النموذج | الجدول | حقول الملفات | نوع الحقل | الـ Disk المُستخدم |
|---------|--------|-------------|-----------|-------------------|
| [User](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/User.php#15-217) | `users` | `image` | `string\|nullable` | `uploads` (disk) |
| [Doctor](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/Doctor.php#13-131) | [doctors](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85) | `image`, `license_document`, `id_document`, `certificate` | `string\|nullable` | `image` → `uploads`; documents → `public` |
| [Article](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/Article.php#10-70) | [articles](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/Doctor.php#97-101) | `image` | `string\|nullable` | `uploads` |
| [ChatbotDocument](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ChatbotDocument.php#8-46) | `chatbot_documents` | `file_name`, `file_size` | `string`, `integer` | لا يُخزَّن مسار (يُرفع لـ HuggingFace) |
| [ConsultationAttachment](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationAttachment.php#7-67) | `consultation_attachments` | `file_name`, `file_path`, `original_name`, `file_type`, `file_size` | متعددة | `public` |
| [LabTestResult](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#8-96) | `lab_test_results` | `image_path` | `string` | `public` |
| [ConsultationMessage](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationMessage.php#8-111) | `consultation_messages` | `image_path` | `string\|nullable` | disk محدد بـ `config('chat.storage.disk')` (افتراضي: `public`) |
| [PatientMedicalFile](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/PatientMedicalFile.php#7-42) | `patient_medical_files` | `file_name`, `file_path`, `file_size`, `file_type` | متعددة | `public` |
| [SuccessStory](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/SuccessStory.php#9-86) | `success_stories` | `patient_image` | `string\|nullable` | `public` |
| [SettingsSite](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/SettingsSite.php#7-40) | `settings_site` | `logo`, `favicon` | `string\|nullable` | `public` |
| [Admin](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/Admin.php#10-71) | `admins` | `image` | `string\|nullable` | `uploads` |

---

## 4. نقاط الرفع (Upload Endpoints) وقواعد التحقق (Validation Rules)

### 4.1 صورة المريضة (Patient Profile Image)
- **الـ Endpoint:** `PUT /api/v1/patient/profile/basic-info`
- **الكنترولر:** `Patient\ProfileController::updateBasicInfo`
- **الـ Request:** [UpdateBasicInfoRequest](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Requests/Patient/UpdateBasicInfoRequest.php#8-55)
- **قواعد التحقق:**
  ```php
  'image' => ['sometimes', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048']
  // max: 2MB
  ```
- **مسار الحفظ:** `patients/images/{uuid}_{timestamp}.ext` (disk: `uploads`)
- **القيمة المحفوظة في DB:** `'patients/images/' . $newImageName`

### 4.2 حذف صورة المريضة
- **الـ Endpoint:** `DELETE /api/v1/patient/profile/image`
- **الكنترولر:** `Patient\ProfileController::deleteImage`
- **آلية الحذف:** `ImageManager::deleteImage($user->image, 'uploads')`

### 4.3 تحليل المختبر (Lab Test Image)
- **الـ Endpoint:** `POST /api/v1/patient/lab-tests`
- **الكنترولر:** `Patient\LabTestController::upload`
- **الـ Request:** [UploadLabTestRequest](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Requests/Patient/UploadLabTestRequest.php#7-32)
- **قواعد التحقق:**
  ```php
  'image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:10240'
  // max: 10MB
  ```
- **مسار الحفظ:** `{config('lab_ocr.storage.path')}/{user_id}/{uuid}.ext` (disk: `public`)
- **آلية التخزين:** `Storage::disk('public')->putFileAs($directory, $image, $filename)`
- **القيمة المحفوظة في DB:** `image_path = $directory . '/' . $filename`

### 4.4 الملفات الطبية للمريضة (Patient Medical Files)
- **الـ Endpoint:** `POST /api/v1/patient/medical-files`
- **الكنترولر:** `Patient\PatientMedicalFileController::store`
- **قواعد التحقق (inline):**
  ```php
  'file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:10240'
  // max: 10MB
  ```
- **مسار الحفظ:** `patients/medical_files/{user_id}/{timestamp}_{sanitized_filename}` (disk: `public`)
- **آلية التخزين:** `$file->storeAs('patients/medical_files/' . $user->id, $sanitizedName, 'public')`

### 4.5 مرفقات الاستشارة (Consultation Attachments)
- **الـ Endpoint:** `POST /api/v1/{guard}/consultations/{id}/attachments`
- **الكنترولر:** `ConsultationAttachmentController::upload`
- **قواعد التحقق (inline):**
  ```php
  'file'        => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
  'category'    => 'required|in:lab_result,ultrasound,x_ray,prescription,medical_report,other',
  'description' => 'nullable|string|max:500',
  // max: 10MB
  ```
- **مسار الحفظ:** `consultation-attachments/{consultation_id}/{uuid}.ext` (disk: `public`)
- **آلية التخزين:** `$file->storeAs($folderPath, $storedName, 'public')`

### 4.6 صور الدردشة في الاستشارة (Chat Images)
- **الـ Endpoint:** `POST /api/v1/patient/consultations/{id}/chat/messages`
- **الكنترولر:** `Patient\ConsultationChatController::sendMessage`
- **آلية التخزين:** تُفوَّض لـ `ChatImageService::store($file, $consultationId)`

### 4.7 صورة الطبيب (Doctor Profile Image)
- **الـ Endpoint:** `PUT /api/v1/doctor/profile`
- **الكنترولر:** `Doctor\DoctorProfileController::update`
- **الـ Request:** `Doctor\Profile\UpdateProfileRequest`
- **قواعد التحقق:**
  ```php
  'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
  // max: 2MB
  ```
- **مسار الحفظ:** `doctors/images/{uuid}_{timestamp}.ext` (disk: `uploads`)
- **القيمة المحفوظة في DB:** `'doctors/images/' . $newImageName`

### 4.8 صورة المقال (Article Image)
- **الـ Endpoint:** `POST /api/v1/doctor/articles` و `PUT /api/v1/doctor/articles/{id}`
- **الكنترولر:** `Doctor\ArticleController` → [ArticleService](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Services/ArticleService.php#13-493)
- **الـ Request:** [StoreArticleRequest](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Requests/StoreArticleRequest.php#8-60)
- **قواعد التحقق:**
  ```php
  'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120'
  // max: 5MB
  ```
- **مسار الحفظ:** `articles/images/{uuid}_{timestamp}.ext` (disk: `uploads`)

### 4.9 ملفات قاعدة المعرفة للـ Chatbot
- **الـ Endpoint:** `POST /api/v1/admin/chatbot/documents`
- **الكنترولر:** `Admin\AdminChatbotDocumentController::store`
- **الـ Request:** `Admin\Chatbot\StoreDocumentRequest`
- **قواعد التحقق:**
  ```php
  'bot_type' => 'required|string|in:public,pre_marriage,pregnancy,motherhood',
  'file'     => 'required|file|mimes:pdf,txt,md|max:10240'
  // max: 10MB
  ```
- **التخزين المؤقت:** `$file->store('chatbot-uploads', 'local')` ← يُحذف بعد المعالجة
- **المعالجة:** `UploadChatbotDocumentJob::dispatchSync(...)`

### 4.10 شعار ونيقونة الموقع (Site Logo & Favicon)
- **الـ Endpoint:** `PUT /api/v1/admin/settings/site`
- **الكنترولر:** `Admin\SettingsController::updateSiteSettings`
- **قواعد التحقق (inline):**
  ```php
  'logo'    => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
  'favicon' => 'nullable|image|mimes:png,ico|max:512',
  ```
- **مسار الحفظ Logo:** `settings/{auto_name}` (disk: `public`)
- **مسار الحفظ Favicon:** `settings/{auto_name}` (disk: `public`)
- **القيمة المحفوظة في DB:** `basename($logoPath)` و `basename($faviconPath)` فقط (بدون مجلد)

### 4.11 صورة قصة النجاح (Success Story Image)
- **الـ Endpoint:** `POST /api/v1/admin/success-stories` و `PUT /api/v1/admin/success-stories/{id}`
- **الكنترولر:** `Admin\SuccessStoryController`
- **قواعد التحقق (inline):**
  ```php
  'patient_image' => 'nullable|image|max:2048'
  // max: 2MB
  ```
- **مسار الحفظ:** `success-stories/{auto_name}` (disk: `public`)
- **آلية التخزين:** `$file->store('success-stories', 'public')`

---

## 5. أنماط توليد الـ URLs

### 5.1 أداة `ImageManager::getImageUrl()` (الأكثر استخداماً)
```php
// التعريف
public function getImageUrl(?string $imagePath, string $folder, string $disk = 'uploads', ?string $defaultImage = null): string

// آلية العمل:
// 1. إذا $imagePath فارغ → يُرجع url($defaultImage) أو url('images/default-avatar.png')
// 2. إذا $imagePath يبدأ بـ 'http' → يُرجعه كما هو (رابط خارجي)
// 3. إذا disk === 'uploads':
//    - إذا المسار يبدأ بـ $folder → url($imagePath)
//    - غير ذلك → url($folder . '/' . $imagePath)
// 4. غير ذلك → url('storage/' . $folder . '/' . $imagePath)
```

**الاستخدامات الموثقة:**

| النموذج/الـ Resource | استدعاء [getImageUrl](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#87-110) | الـ folder | الـ disk | الـ default |
|--------------------|----------------------|-----------|---------|------------|
| [PatientResource](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Patient/PatientResource.php#9-54) (Patient) | `$this->image` | `patients/images` | `uploads` | `patients/images/default-user.png` |
| [PatientResource](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Patient/PatientResource.php#9-54) (Admin) | `$this->image` | `patients/images` | `uploads` | `patients/images/default-user.png` |
| [DoctorResource](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Doctor/DoctorResource.php#8-72) (Doctor) | `$this->image` | `doctors/images` | `uploads` | `doctors/images/default-doctor.png` |
| [DoctorResource](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Doctor/DoctorResource.php#8-72) (Admin) | `$this->image` | `doctors/images` | `uploads` | `doctors/images/default-doctor.png` |
| [AdminResource](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/Admin/AdminResource.php#8-48) | `$this->image` | `storage/admins` | `uploads` | `patients/images/default-user.png` |
| [ArticleResource](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Http/Resources/ArticleResource.php#10-205) | `$this->image` | `articles/images` | `uploads` | `articles/images/default-aericle.png` |
| Admin Doctor detail | `doctor->license_document` | `doctors/documents` | `public` | — |
| Admin Doctor detail | `doctor->id_document` | `doctors/documents` | `public` | — |
| Admin Doctor detail | `doctor->certificate` | `doctors/documents` | `public` | — |

### 5.2 نمط `Storage::url()` (في النماذج)
```php
// LabTestResult Model — accessor image_url
public function getImageUrlAttribute(): ?string
{
    return $this->image_path ? Storage::url($this->image_path) : null;
}
// يُنتج: http://localhost/storage/{image_path}
```

### 5.3 نمط `asset('storage/')` (في الكنترولرات)
```php
// PatientMedicalFileController::index & store
'file_url' => asset('storage/' . $file->file_path)

// ConsultationAttachmentController::formatAttachment
'url' => asset('storage/' . $a->file_path)
```

### 5.4 نمط `url('storage/')` (في الكنترولرات)
```php
// SettingsController::getSiteSettings
'logo'    => $settings->logo    ? url('storage/settings/' . $settings->logo) : null,
'favicon' => $settings->favicon ? url('storage/settings/' . $settings->favicon) : null,
```

### 5.5 نمط رابط التحميل المحمي (Download URL)
```php
// ChatMessageResource (Shared)
'image_url' => $this->image_path
    ? rtrim(config('app.url'), '/') . "/api/v1/{$currentUserType}/consultations/{$this->consultation_id}/chat/messages/{$this->id}/download"
    : null
// لا يُكشف المسار الفعلي — يُعاد التوجيه عبر endpoint محمي
```

### 5.6 نمط `ConsultationAttachment::full_url` (Model Accessor)
```php
// ConsultationAttachment Model
public function getFullUrlAttribute(): ?string
{
    if (!$this->file_path) return null;
    return Storage::disk('public')->url($this->file_path);
}
// يُنتج: http://localhost/storage/{file_path}
```

---

## 6. منطق الحذف وتنظيف الملفات

### 6.1 الحذف التلقائي عبر [booted()](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#89-95) في النماذج

#### [LabTestResult](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#8-96) Model
```php
protected static function booted(): void
{
    static::deleting(function (LabTestResult $labTest) {
        if ($labTest->image_path) {
            Storage::disk('public')->delete($labTest->image_path);
        }
    });
}
```
- يُشغَّل عند كل `$labTest->delete()`
- يحذف الصورة من disk `public` بمجرد حذف السجل

#### [ConsultationMessage](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationMessage.php#8-111) Model
```php
protected static function booted(): void
{
    static::deleting(function (ConsultationMessage $msg) {
        if ($msg->image_path) {
            $disk = config('chat.storage.disk', 'public');
            Storage::disk($disk)->delete($msg->image_path);
        }
    });
}
```
- يُشغَّل عند كل `$msg->delete()`
- الـ disk يُقرأ من `config('chat.storage.disk')` (افتراضي: `public`)

### 6.2 الحذف اليدوي في الكنترولرات

#### `ConsultationAttachmentController::destroy`
```php
Storage::disk('public')->delete($attachment->file_path);
$attachment->delete();
```
- يحذف الملف أولاً ثم السجل

#### `PatientMedicalFileController::destroy`
```php
if (Storage::disk('public')->exists($file->file_path)) {
    Storage::disk('public')->delete($file->file_path);
}
$file->delete();
```
- يتحقق من وجود الملف قبل الحذف

#### `SuccessStoryController::destroy`
```php
if ($successStory->patient_image) {
    Storage::disk('public')->delete($successStory->patient_image);
}
$successStory->delete();
```

#### `SuccessStoryController::update`
```php
if ($request->hasFile('patient_image')) {
    if ($successStory->patient_image) {
        Storage::disk('public')->delete($successStory->patient_image);
    }
    $path = $request->file('patient_image')->store('success-stories', 'public');
    $validated['patient_image'] = $path;
}
```

#### `SettingsController::updateSiteSettings`
```php
// Logo
if ($settings->logo) {
    Storage::disk('public')->delete('settings/' . $settings->logo);
}
// Favicon
if ($settings->favicon) {
    Storage::disk('public')->delete('settings/' . $settings->favicon);
}
```

### 6.3 الحذف عبر [ImageManager](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#9-111) (في الـ Services والكنترولرات)

#### `ArticleService::deleteArticle`
```php
if ($article->image) {
    $this->imageManager->deleteImage($article->image, 'uploads');
}
$article->delete();
```

#### `Patient\ProfileController::updateBasicInfo`
```php
if ($user->image) {
    $this->imageManager->deleteImage($user->image, 'uploads');
}
```

#### `Doctor\DoctorProfileController::update`
```php
if ($doctor->image) {
    $this->imageManager->deleteImage($doctor->image, 'uploads');
}
```

#### `Patient\ProfileController::deleteImage`
```php
$this->imageManager->deleteImage($user->image, 'uploads');
$user->update(['image' => null]);
```

### 6.4 نماذج بدون منطق حذف تلقائي للملفات
النماذج التالية **لا تملك** منطق حذف ملفات تلقائي عند حذف السجل:

| النموذج | الحقل | ملاحظة |
|---------|-------|---------|
| [ConsultationAttachment](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationAttachment.php#7-67) | `file_path` | الحذف يتم يدوياً في الكنترولر فقط |
| [PatientMedicalFile](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/PatientMedicalFile.php#7-42) | `file_path` | الحذف يتم يدوياً في الكنترولر فقط |
| [SuccessStory](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/SuccessStory.php#9-86) | `patient_image` | الحذف يتم يدوياً في الكنترولر فقط |
| [SettingsSite](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/SettingsSite.php#7-40) | `logo`, `favicon` | الحذف يتم يدوياً في الكنترولر فقط |
| [User](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/User.php#15-217) | `image` | الحذف يتم يدوياً في الكنترولر فقط |
| [Doctor](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/Doctor.php#13-131) | `image`, `license_document`, إلخ | الحذف يتم يدوياً عند الحاجة |
| [ChatbotDocument](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ChatbotDocument.php#8-46) | `file_name` | الملف مُخزَّن خارجياً على HuggingFace |

---

## 7. الـ Jobs الخلفية المتعلقة بالملفات

### 7.1 [UploadChatbotDocumentJob](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/UploadChatbotDocumentJob.php#22-113)
- **الملف:** [app/Jobs/UploadChatbotDocumentJob.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/UploadChatbotDocumentJob.php)
- **آلية التشغيل:** `dispatchSync(...)` (تُنفَّذ بشكل فوري متزامن في جميع البيئات)
- **الخطوات:**
  1. يستلم `$documentId`, `$botType`, `$tempPath`, `$originalFileName`
  2. يقرأ الملف من disk `local`: `Storage::disk('local')->get($tempPath)`
  3. يرفعه إلى **HuggingFace** عبر `ChatbotService`
  4. يُحدِّث حالة [ChatbotDocument](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/ChatbotDocument.php#8-46) إلى `uploaded`
  5. يحذف الملف المؤقت: `Storage::disk('local')->delete($tempPath)`
  6. في حالة الفشل: يُحدِّث الحالة إلى [failed](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/ProcessLabTestJob.php#36-47) ويحذف الملف المؤقت أيضاً
- **لا يُخزَّن** الملف دائمياً في Storage المحلي؛ التخزين الدائم على HuggingFace

### 7.2 [ProcessLabTestJob](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/ProcessLabTestJob.php#14-48)
- **الملف:** [app/Jobs/ProcessLabTestJob.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/ProcessLabTestJob.php)
- **الاستخدام الحالي:** موجود كـ Job لكن التشغيل الفعلي يتم بشكل مباشر في الكنترولر:
  ```php
  // LabTestController::upload
  try {
      $ocrService->processImage($labTest);
  } catch (\Exception $e) {
      $labTest->markAsFailed($e->getMessage());
  }
  ```
- **الخدمة المُستخدمة:** `LabTestOcrService::processImage($labTest)`
- **الخطوات في [LabTestOcrService](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Services/LabTestOcrService.php#12-240):**
  1. يقرأ مسار الصورة من `$labTest->image_path`
  2. يحسب المسار الكامل: `Storage::disk('public')->path($imagePath)`
  3. يرفع الصورة إلى **HuggingFace Space** (OCR API)
  4. يحلل الاستجابة ويُخزِّن النتائج في `results_json`
  5. يُحدِّث حالة [LabTestResult](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php#8-96) إلى `completed` أو [failed](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/ProcessLabTestJob.php#36-47)
  6. الصورة الأصلية **تبقى** في Storage ولا تُحذف بعد المعالجة

---

## 8. أداة [ImageManager](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#9-111) (Utility Class)

### الملف: [app/Utils/ImageManager.php](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php)

#### الوظائف

| الدالة | الوصف | القيمة المُرجعة |
|-------|-------|--------------|
| [uploadSingleImage($image, $path, $disk)](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#11-35) | ترفع صورة واحدة بعد التحقق من النوع والحجم | اسم الملف (string) |
| [uploadMultipleImages($images[], $path, $disk)](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#36-50) | ترفع مجموعة صور | مصفوفة أسماء الملفات |
| [deleteImage($path, $disk)](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#51-63) | تحذف ملفاً إذا كان موجوداً | `bool` |
| [updateImage($oldPath, $newImage, $path, $disk)](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#64-77) | تحذف القديمة وترفع الجديدة | اسم الملف الجديد |
| [generateImageName($image)](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#78-86) | تولّد اسماً فريداً بصيغة UUID | `{uuid}_{timestamp}.ext` |
| [getImageUrl($imagePath, $folder, $disk, $default)](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#87-110) | تُرجع URL كامل للصورة مع معالجة حالات الـ null والروابط الخارجية | URL (string) |

#### قيود التحقق الداخلية في [uploadSingleImage](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#11-35)
```php
$allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB
```

#### منطق [getImageUrl](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Utils/ImageManager.php#87-110) بالتفصيل
```
إذا $imagePath فارغ:
    → url($defaultImage) أو url('images/default-avatar.png')
إذا $imagePath يبدأ بـ 'http':
    → يُرجعه كما هو
إذا $disk === 'uploads':
    إذا $imagePath يبدأ بـ $folder:
        → url($imagePath)         // مثال: url('patients/images/file.jpg')
    غير ذلك:
        → url($folder . '/' . $imagePath)  // مثال: url('patients/images/' . 'file.jpg')
غير ذلك:
    → url('storage/' . $folder . '/' . $imagePath)
```

---

## 9. ملخص جدول جميع الـ Endpoints المتعلقة بالملفات

| الـ HTTP Method | الـ Endpoint | الكنترولر | حقل الملف | الـ Disk | حد الحجم |
|---------------|------------|----------|-----------|---------|---------|
| `POST` | `/api/v1/patient/profile/basic-info` | `Patient\ProfileController::updateBasicInfo` | `image` | `uploads` | 2MB |
| `DELETE` | `/api/v1/patient/profile/image` | `Patient\ProfileController::deleteImage` | `image` | `uploads` | — |
| `POST` | `/api/v1/patient/lab-tests` | `Patient\LabTestController::upload` | `image` | `public` | 10MB |
| `DELETE` | `/api/v1/patient/lab-tests/{id}` | `Patient\LabTestController::destroy` | — | `public` | — |
| `POST` | `/api/v1/patient/medical-files` | `Patient\PatientMedicalFileController::store` | [file](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/User.php#72-76) | `public` | 10MB |
| `DELETE` | `/api/v1/patient/medical-files/{id}` | `Patient\PatientMedicalFileController::destroy` | — | `public` | — |
| `GET` | `/api/v1/patient/medical-files/{id}/download` | `Patient\PatientMedicalFileController::download` | — | `public` | — |
| `POST` | `/api/v1/{guard}/consultations/{id}/attachments` | `ConsultationAttachmentController::upload` | [file](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/User.php#72-76) | `public` | 10MB |
| `DELETE` | `/api/v1/{guard}/consultations/{id}/attachments/{aid}` | `ConsultationAttachmentController::destroy` | — | `public` | — |
| `GET` | `/api/v1/{guard}/consultations/{id}/attachments/{aid}/download` | `ConsultationAttachmentController::download` | — | `public` | — |
| `POST` | `/api/v1/patient/consultations/{id}/chat/messages` | `Patient\ConsultationChatController::sendMessage` | `image` | `chat.storage.disk` | — |
| `GET` | `/api/v1/{guard}/consultations/{id}/chat/messages/{mid}/download` | `ConsultationChatController::downloadImage` | — | `chat.storage.disk` | — |
| `PUT` | `/api/v1/doctor/profile` | `Doctor\DoctorProfileController::update` | `image` | `uploads` | 2MB |
| `POST` | `/api/v1/doctor/articles` | `Doctor\ArticleController` (→ [ArticleService](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Services/ArticleService.php#13-493)) | `image` | `uploads` | 5MB |
| `PUT` | `/api/v1/doctor/articles/{id}` | `Doctor\ArticleController` (→ [ArticleService](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Services/ArticleService.php#13-493)) | `image` | `uploads` | 5MB |
| `POST` | `/api/v1/admin/chatbot/documents` | `Admin\AdminChatbotDocumentController::store` | [file](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Models/User.php#72-76) | `local` (مؤقت) | 10MB |
| `DELETE` | `/api/v1/admin/chatbot/documents/{id}` | `Admin\AdminChatbotDocumentController::destroy` | — | HuggingFace | — |
| `PUT` | `/api/v1/admin/settings/site` | `Admin\SettingsController::updateSiteSettings` | `logo`, `favicon` | `public` | 2MB / 512KB |
| `POST` | `/api/v1/admin/success-stories` | `Admin\SuccessStoryController::store` | `patient_image` | `public` | 2MB |
| `PUT` | `/api/v1/admin/success-stories/{id}` | `Admin\SuccessStoryController::update` | `patient_image` | `public` | 2MB |
| `DELETE` | `/api/v1/admin/success-stories/{id}` | `Admin\SuccessStoryController::destroy` | — | `public` | — |

---

## 10. الخدمات الخارجية والتكاملات

### HuggingFace (خدمة خارجية)
يتكامل المشروع مع HuggingFace في حالتين:

1. **معالجة صور التحاليل (OCR):** [LabTestOcrService](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Services/LabTestOcrService.php#12-240)
   - يقرأ الصورة من disk `public`
   - يرفعها إلى HuggingFace Space محدد في [.env](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/.env)
   - يُحلِّل الاستجابة ويُخزِّن النتائج في `results_json` (JSON)
   - الصورة تبقى في Storage المحلي

2. **قاعدة المعرفة للـ Chatbot (RAG):** [UploadChatbotDocumentJob](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/app/Jobs/UploadChatbotDocumentJob.php#22-113)
   - يقرأ الملف من disk `local` (مؤقت)
   - يرفعه إلى HuggingFace (model/dataset)
   - يحذف الملف المؤقت فوراً بعد الرفع
   - لا يوجد تخزين محلي دائم للملف

### متغيرات البيئة للـ HuggingFace (من [.env.example](file:///d:/final-project%20main%20km/Final_Project_Front_And_Back/Back-end/.env.example))
```
CHATBOT_PUBLIC_URL=
CHATBOT_PRE_MARRIAGE_URL=
CHATBOT_PREGNANCY_URL=
CHATBOT_MOTHERHOOD_URL=
CHATBOT_LAB_OCR_URL=
CHATBOT_API_KEY=  (HuggingFace Token)
```

---

*نهاية التقرير*
