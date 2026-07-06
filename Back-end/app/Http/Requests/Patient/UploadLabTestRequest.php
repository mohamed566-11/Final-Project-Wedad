<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class UploadLabTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('patient')->check();
    }

    public function rules(): array
    {
        return [
            'image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'يجب رفع صورة التحليل.',
            'image.file'     => 'يجب أن يكون المرفق ملفاً صالحاً.',
            'image.image'    => 'الملف المرفوع يجب أن يكون صورة.',
            'image.mimes'    => 'نوع الملف غير مدعوم، مسموح فقط: JPG، PNG، WebP.',
            'image.max'      => 'حجم الصورة يتجاوز الحد المسموح (10MB).',
        ];
    }
}
