<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class SendChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        $maxSize = config('chat.limits.max_image_size_kb', 5120);
        $maxLength = config('chat.limits.max_message_length', 1000);
        $allowedTypes = implode(',', config('chat.limits.allowed_image_types', ['jpg','jpeg','png','webp']));

        return [
            'message' => "nullable|string|max:{$maxLength}|required_without:image",
            'image'   => "nullable|file|image|mimes:{$allowedTypes}|max:{$maxSize}|required_without:message",
        ];
    }

    public function messages(): array
    {
        return [
            'message.required_without' => 'يجب إرسال نص أو صورة',
            'message.max'              => 'الرسالة تتجاوز الحد الأقصى (:max حرف)',
            'image.required_without'   => 'يجب إرسال نص أو صورة',
            'image.image'              => 'الملف يجب أن يكون صورة',
            'image.mimes'              => 'نوع الملف غير مدعوم، مسموح فقط: JPG, PNG, WebP',
            'image.max'                => 'حجم الصورة يتجاوز 5MB',
        ];
    }
}
