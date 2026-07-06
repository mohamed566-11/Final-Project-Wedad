<?php

namespace App\Http\Requests;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class StoreArticleRequest extends BaseRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'min:5',
                'max:255',
                Rule::unique('articles', 'title')->whereNull('deleted_at'),
            ],
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string|min:20',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB
            'life_stage_id' => 'nullable|exists:life_stages,id',
            'status' => 'nullable|in:draft,pending_review',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'عنوان المقال مطلوب',
            'title.min' => 'يجب أن يكون العنوان 10 أحرف على الأقل',
            'title.max' => 'العنوان يجب ألا يزيد عن 255 حرف',
            'title.unique' => 'هذا العنوان مستخدم بالفعل',
            'excerpt.max' => 'الملخص يجب ألا يزيد عن 500 حرف',
            'content.required' => 'محتوى المقال مطلوب',
            'content.min' => 'المحتوى يجب أن يكون 20 حرفاً على الأقل',
            'image.image' => 'الملف يجب أن يكون صورة',
            'image.mimes' => 'الصورة يجب أن تكون من نوع: jpeg, png, jpg, webp',
            'image.max' => 'حجم الصورة يجب ألا يزيد عن 5 ميجابايت',
            'life_stage_id.exists' => 'المرحلة الحياتية غير موجودة',
            'status.in' => 'الحالة غير صالحة',
        ];
    }
}
