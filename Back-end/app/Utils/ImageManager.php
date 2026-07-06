<?php

namespace App\Utils;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class ImageManager
{
    /**
     * رفع صورة واحدة وإرجاع المسار النسبي الكامل
     * يُرجع: 'profiles/uuid.jpg' أو 'articles/uuid.png'
     */
    public function uploadSingleImage(UploadedFile $image, string $path, string $disk = 'uploads'): string
    {
        // التحقق من نوع الملف
        $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!in_array($image->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Invalid image type. Allowed types: jpeg, png, jpg, gif, webp');
        }

        // التحقق من حجم الملف (5MB)
        $maxSize = 5 * 1024 * 1024;
        if ($image->getSize() > $maxSize) {
            throw new \InvalidArgumentException('Image size exceeds maximum allowed size of 5MB');
        }

        // توليد اسم موحّد (UUID فقط — بدون timestamp)
        $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();

        // الحفظ وإرجاع الـ relative path الكامل
        return $image->storeAs($path, $filename, $disk);
        // يُرجع: 'profiles/uuid.jpg'
    }

    /**
     * رفع مجموعة صور وإرجاع مصفوفة بالمسارات النسبية الكاملة
     */
    public function uploadMultipleImages(array $images, string $path, string $disk = 'uploads'): array
    {
        $uploadedPaths = [];

        foreach ($images as $image) {
            $uploadedPaths[] = $this->uploadSingleImage($image, $path, $disk);
        }

        return $uploadedPaths;
    }

    /**
     * حذف صورة من الديسك المحدد
     */
    public function deleteImage(?string $path, string $disk = 'uploads'): bool
    {
        if (!$path) return false;

        if (Storage::disk($disk)->exists($path)) {
            return Storage::disk($disk)->delete($path);
        }

        return false;
    }

    /**
     * تحديث صورة (حذف القديمة ورفع الجديدة)
     * يتوقع أن $oldImagePath هو المسار الكامل المحفوظ في DB (profiles/uuid.jpg)
     */
    public function updateImage(?string $oldImagePath, UploadedFile $newImage, string $path, string $disk = 'uploads'): string
    {
        // حذف الصورة القديمة إذا كانت موجودة
        if ($oldImagePath) {
            $this->deleteImage($oldImagePath, $disk);
        }

        // رفع الصورة الجديدة
        return $this->uploadSingleImage($newImage, $path, $disk);
    }

    /**
     * توليد اسم فريد للصورة (UUID فقط — بدون timestamp)
     */
    public function generateImageName(UploadedFile $image): string
    {
        return Str::uuid() . '.' . $image->getClientOriginalExtension();
    }

    /**
     * الحصول على URL الكامل للصورة
     *
     * - disk `uploads` → public/ مباشرةً (بدون /storage/)
     * - disk `public`  → /storage/{imagePath}
     */
    public function getImageUrl(
        ?string $imagePath,
        string $folder = 'profiles',
        string $disk = 'uploads',
        ?string $defaultImage = null
    ): string {
        // القيمة الافتراضية
        if (!$imagePath) {
            return $defaultImage ? url($defaultImage) : url('profiles/default-avatar.png');
        }

        // رابط خارجي (ui-avatars, etc.)
        if (str_starts_with($imagePath, 'http')) {
            return $imagePath;
        }

        // disk uploads → public/ مباشرةً (بدون /storage/)
        if ($disk === 'uploads') {
            // إذا المسار يتضمن الـ folder بالفعل → url() مباشرة
            if (str_starts_with($imagePath, $folder . '/') || $imagePath === $folder) {
                return url($imagePath);
            }
            return url($folder . '/' . $imagePath);
        }

        // disk public → /storage/
        return Storage::disk('public')->url($imagePath);
    }

    /**
     * helper للصور الافتراضية حسب النوع
     */
    public function getDefaultAvatar(string $type = 'user'): string
    {
        return match ($type) {
            'doctor' => url('profiles/default-doctor.png'),
            'admin'  => url('profiles/default-admin.png'),
            default  => url('profiles/default-avatar.png'),
        };
    }
}
