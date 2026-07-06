# ImageManager Documentation

## 📚 دليل استخدام ImageManager

`ImageManager` هو utility class لإدارة الصور في التطبيق بشكل احترافي وآمن.

---

## 📋 جدول المحتويات

1. [التثبيت والإعداد](#التثبيت-والإعداد)
2. [الدوال المتاحة](#الدوال-المتاحة)
3. [أمثلة الاستخدام](#أمثلة-الاستخدام)
4. [Best Practices](#best-practices)
5. [معالجة الأخطاء](#معالجة-الأخطاء)

---

## 🚀 التثبيت والإعداد

### 1. الموقع
```
app/Utils/ImageManager.php
```

### 2. Dependency Injection
استخدم Dependency Injection في الـ Controller:

```php
use App\Utils\ImageManager;

public function store(Request $request, ImageManager $imageManager)
{
    // استخدم $imageManager هنا
}
```

### 3. إعداد Storage
تأكد من تشغيل:
```bash
php artisan storage:link
```

---

## 🛠️ الدوال المتاحة

### 1️⃣ `uploadSingleImage()`

**الوصف:** رفع صورة واحدة مع validation تلقائي

**التوقيع:**
```php
public function uploadSingleImage(
    UploadedFile $image, 
    string $path, 
    string $disk = 'public'
): string
```

**المعاملات:**
- `$image`: الصورة المرفوعة من الـ Request
- `$path`: المسار داخل storage (مثل: 'users', 'doctors', 'posts')
- `$disk`: نوع الـ storage (افتراضي: 'public')

**القيمة المرجعة:**
- `string`: اسم الملف المحفوظ (مثل: `uuid_timestamp.jpg`)

**Validation:**
- ✅ أنواع مسموحة: jpeg, png, jpg, gif, webp
- ✅ الحد الأقصى للحجم: 5MB

**مثال:**
```php
public function updateAvatar(Request $request, ImageManager $imageManager)
{
    $request->validate([
        'avatar' => 'required|image'
    ]);
    
    $fileName = $imageManager->uploadSingleImage(
        $request->file('avatar'),
        'users',
        'public'
    );
    
    auth()->user()->update(['image' => $fileName]);
}
```

**الأخطاء المحتملة:**
```php
// InvalidArgumentException: نوع ملف غير مسموح
// InvalidArgumentException: حجم الملف أكبر من 5MB
```

---

### 2️⃣ `uploadMultipleImages()`

**الوصف:** رفع مجموعة صور دفعة واحدة

**التوقيع:**
```php
public function uploadMultipleImages(
    array $images, 
    string $path, 
    string $disk = 'public'
): array
```

**المعاملات:**
- `$images`: مصفوفة من الصور المرفوعة
- `$path`: المسار داخل storage
- `$disk`: نوع الـ storage

**القيمة المرجعة:**
- `array`: مصفوفة بأسماء الملفات المحفوظة

**مثال:**
```php
public function createPost(Request $request, ImageManager $imageManager)
{
    $request->validate([
        'images' => 'required|array',
        'images.*' => 'image|max:5120'
    ]);
    
    $post = Post::create($request->only('title', 'content'));
    
    $fileNames = $imageManager->uploadMultipleImages(
        $request->file('images'),
        'posts'
    );
    
    foreach ($fileNames as $fileName) {
        $post->images()->create(['file_name' => $fileName]);
    }
}
```

---

### 3️⃣ `deleteImage()`

**الوصف:** حذف صورة من الـ storage

**التوقيع:**
```php
public function deleteImage(
    string $path, 
    string $disk = 'public'
): bool
```

**المعاملات:**
- `$path`: المسار الكامل للصورة (مثل: 'users/image.jpg')
- `$disk`: نوع الـ storage

**القيمة المرجعة:**
- `bool`: true إذا تم الحذف بنجاح، false إذا لم يكن الملف موجوداً

**مثال:**
```php
public function deleteAvatar(ImageManager $imageManager)
{
    $user = auth()->user();
    
    if ($user->image) {
        $deleted = $imageManager->deleteImage('users/' . $user->image);
        
        if ($deleted) {
            $user->update(['image' => null]);
            return response()->json(['message' => 'Avatar deleted']);
        }
    }
    
    return response()->json(['message' => 'No avatar to delete'], 404);
}
```

---

### 4️⃣ `updateImage()` ⭐

**الوصف:** تحديث صورة (حذف القديمة ورفع الجديدة تلقائياً)

**التوقيع:**
```php
public function updateImage(
    ?string $oldImagePath, 
    UploadedFile $newImage, 
    string $path, 
    string $disk = 'public'
): string
```

**المعاملات:**
- `$oldImagePath`: اسم الصورة القديمة (يمكن أن يكون null)
- `$newImage`: الصورة الجديدة
- `$path`: المسار داخل storage
- `$disk`: نوع الـ storage

**القيمة المرجعة:**
- `string`: اسم الملف الجديد

**مثال:**
```php
public function updateProfile(Request $request, ImageManager $imageManager)
{
    $user = auth()->user();
    
    if ($request->hasFile('avatar')) {
        $user->image = $imageManager->updateImage(
            $user->image,  // سيتم حذفها تلقائياً
            $request->file('avatar'),
            'users'
        );
        $user->save();
    }
    
    return response()->json(['message' => 'Profile updated']);
}
```

**الميزات:**
- ✅ يحذف الصورة القديمة تلقائياً
- ✅ يرفع الصورة الجديدة
- ✅ يتعامل مع null بأمان

---

### 5️⃣ `getImageUrl()` ⭐

**الوصف:** الحصول على الرابط الكامل للصورة

**التوقيع:**
```php
public function getImageUrl(
    ?string $imagePath, 
    string $folder, 
    string $disk = 'public', 
    ?string $defaultImage = null
): string
```

**المعاملات:**
- `$imagePath`: اسم الصورة (يمكن أن يكون null)
- `$folder`: المجلد (users, doctors, posts)
- `$disk`: نوع الـ storage
- `$defaultImage`: صورة افتراضية (اختياري)

**القيمة المرجعة:**
- `string`: الرابط الكامل للصورة

**مثال 1: في Controller**
```php
public function show($id, ImageManager $imageManager)
{
    $user = User::findOrFail($id);
    
    return response()->json([
        'user' => [
            'name' => $user->name,
            'avatar' => $imageManager->getImageUrl($user->image, 'users')
        ]
    ]);
}
```

**مثال 2: في Resource**
```php
namespace App\Http\Resources;

use App\Utils\ImageManager;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $imageManager = app(ImageManager::class);
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar_url' => $imageManager->getImageUrl(
                $this->image, 
                'users',
                'public',
                'images/default-avatar.png'
            ),
        ];
    }
}
```

---

### 6️⃣ `generateImageName()`

**الوصف:** توليد اسم فريد للصورة (يستخدم داخلياً)

**التوقيع:**
```php
public function generateImageName(UploadedFile $image): string
```

**صيغة الاسم:**
```
uuid_timestamp.extension
مثال: 550e8400-e29b-41d4-a716-446655440000_1706284800.jpg
```

---

## 📖 أمثلة الاستخدام الكاملة

### مثال 1: تسجيل مستخدم جديد مع صورة

```php
use App\Utils\ImageManager;
use Illuminate\Support\Facades\Hash;

public function register(Request $request, ImageManager $imageManager)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8|confirmed',
        'avatar' => 'nullable|image|max:5120'
    ]);
    
    $userData = [
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
    ];
    
    // رفع الصورة إذا كانت موجودة
    if ($request->hasFile('avatar')) {
        $userData['image'] = $imageManager->uploadSingleImage(
            $request->file('avatar'),
            'users'
        );
    }
    
    $user = User::create($userData);
    
    return response()->json([
        'user' => new UserResource($user),
        'token' => $user->createToken('auth-token')->plainTextToken
    ], 201);
}
```

---

### مثال 2: تحديث بيانات الطبيب

```php
public function updateDoctor(Request $request, $id, ImageManager $imageManager)
{
    $doctor = Doctor::findOrFail($id);
    
    $request->validate([
        'name' => 'sometimes|string|max:255',
        'bio' => 'sometimes|string',
        'image' => 'sometimes|image|max:5120'
    ]);
    
    // تحديث البيانات النصية
    $doctor->fill($request->only(['name', 'bio']));
    
    // تحديث الصورة
    if ($request->hasFile('image')) {
        $doctor->image = $imageManager->updateImage(
            $doctor->image,
            $request->file('image'),
            'doctors'
        );
    }
    
    $doctor->save();
    
    return response()->json([
        'message' => 'Doctor updated successfully',
        'doctor' => new DoctorResource($doctor)
    ]);
}
```

---

### مثال 3: إنشاء مقال مع صور متعددة

```php
public function createArticle(Request $request, ImageManager $imageManager)
{
    $request->validate([
        'title' => 'required|string|max:255',
        'content' => 'required|string',
        'cover_image' => 'required|image|max:5120',
        'gallery_images' => 'nullable|array|max:10',
        'gallery_images.*' => 'image|max:5120'
    ]);
    
    DB::beginTransaction();
    try {
        // إنشاء المقال
        $article = Article::create([
            'title' => $request->title,
            'content' => $request->content,
        ]);
        
        // رفع صورة الغلاف
        $article->cover_image = $imageManager->uploadSingleImage(
            $request->file('cover_image'),
            'articles/covers'
        );
        $article->save();
        
        // رفع صور المعرض
        if ($request->hasFile('gallery_images')) {
            $galleryImages = $imageManager->uploadMultipleImages(
                $request->file('gallery_images'),
                'articles/gallery'
            );
            
            foreach ($galleryImages as $imageName) {
                $article->galleryImages()->create([
                    'image_path' => $imageName
                ]);
            }
        }
        
        DB::commit();
        
        return response()->json([
            'message' => 'Article created successfully',
            'article' => new ArticleResource($article)
        ], 201);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'message' => 'Failed to create article',
            'error' => $e->getMessage()
        ], 500);
    }
}
```

---

### مثال 4: حذف حساب مع صوره

```php
public function deleteAccount(ImageManager $imageManager)
{
    $user = auth()->user();
    
    // حذف الصورة من الـ storage
    if ($user->image) {
        $imageManager->deleteImage('users/' . $user->image);
    }
    
    // حذف الحساب
    $user->delete();
    
    return response()->json([
        'message' => 'Account deleted successfully'
    ]);
}
```

---

## ✅ Best Practices

### 1. استخدم Validation في Request
```php
// ❌ سيء
$imageManager->uploadSingleImage($request->file('image'), 'users');

// ✅ جيد
$request->validate(['image' => 'required|image|max:5120']);
$imageManager->uploadSingleImage($request->file('image'), 'users');
```

### 2. استخدم Database Transactions
```php
DB::beginTransaction();
try {
    $user = User::create($data);
    $user->image = $imageManager->uploadSingleImage(...);
    $user->save();
    DB::commit();
} catch (\Exception $e) {
    DB::rollBack();
    // معالجة الخطأ
}
```

### 3. استخدم updateImage بدلاً من الحذف والرفع يدوياً
```php
// ❌ سيء
if ($user->image) {
    $imageManager->deleteImage('users/' . $user->image);
}
$user->image = $imageManager->uploadSingleImage(...);

// ✅ جيد
$user->image = $imageManager->updateImage($user->image, ...);
```

### 4. استخدم getImageUrl في Resources
```php
// في UserResource
'avatar_url' => app(ImageManager::class)->getImageUrl($this->image, 'users'),
```

---

## ⚠️ معالجة الأخطاء

### الأخطاء المحتملة

#### 1. InvalidArgumentException - نوع ملف غير مسموح
```php
try {
    $fileName = $imageManager->uploadSingleImage($image, 'users');
} catch (\InvalidArgumentException $e) {
    return response()->json([
        'message' => 'Invalid file type',
        'error' => $e->getMessage()
    ], 422);
}
```

#### 2. InvalidArgumentException - حجم ملف كبير
```php
try {
    $fileName = $imageManager->uploadSingleImage($image, 'users');
} catch (\InvalidArgumentException $e) {
    if (str_contains($e->getMessage(), 'size exceeds')) {
        return response()->json([
            'message' => 'File too large. Maximum 5MB allowed.'
        ], 422);
    }
}
```

#### 3. Storage Exception
```php
use Illuminate\Contracts\Filesystem\FileNotFoundException;

try {
    $imageManager->deleteImage('users/nonexistent.jpg');
} catch (FileNotFoundException $e) {
    // الملف غير موجود
}
```

---

## 📁 هيكل المجلدات

```
storage/
└── app/
    └── public/
        ├── users/          # صور المستخدمين
        ├── doctors/        # صور الأطباء
        ├── admins/         # صور الإداريين
        ├── posts/          # صور المنشورات
        └── articles/       # صور المقالات
            ├── covers/     # صور الغلاف
            └── gallery/    # صور المعرض
```

---

## 🔧 الإعدادات

### تغيير الحد الأقصى لحجم الملف

في `ImageManager.php`:
```php
// السطر 23
$maxSize = 10 * 1024 * 1024; // 10MB
```

### إضافة أنواع ملفات جديدة

في `ImageManager.php`:
```php
// السطر 17
$allowedMimes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'image/gif', 
    'image/webp',
    'image/svg+xml'  // إضافة SVG
];
```

---

## 📝 ملاحظات مهمة

1. ✅ **تأكد من تشغيل** `php artisan storage:link` قبل الاستخدام
2. ✅ **استخدم Validation** دائماً في الـ Request
3. ✅ **استخدم Database Transactions** عند رفع الصور
4. ✅ **احذف الصور القديمة** عند التحديث أو الحذف
5. ✅ **استخدم getImageUrl** في Resources للحصول على الرابط الكامل

---

## 🎯 الخلاصة

`ImageManager` يوفر:
- ✅ رفع صورة واحدة أو متعددة
- ✅ Validation تلقائي للنوع والحجم
- ✅ حذف آمن للصور
- ✅ تحديث سهل (حذف القديمة + رفع الجديدة)
- ✅ الحصول على URL الكامل
- ✅ أسماء فريدة تلقائياً

**استخدمه في جميع عمليات إدارة الصور في التطبيق!** 🚀
