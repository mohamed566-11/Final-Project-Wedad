<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateBasicInfoRequest extends BaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = auth()->id();

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'age' => ['sometimes', 'integer', 'min:12', 'max:100'],
            'phone' => [
                'sometimes',
                'string',
                'regex:/^01[0125][0-9]{8}$/',
                Rule::unique('users', 'phone')->ignore($userId)
            ],
            'image' => ['sometimes', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'life_stage_id' => ['sometimes', 'exists:life_stages,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'name.string' => 'الاسم يجب أن يكون نصًا',
            'name.max' => 'الاسم يجب ألا يتجاوز 255 حرفًا',
            'age.integer' => 'العمر يجب أن يكون رقماً صحيحاً',
            'age.min' => 'العمر يجب أن يكون 12 سنة على الأقل',
            'age.max' => 'العمر يجب ألا يتجاوز 100 سنة',
            'phone.regex' => 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015',
            'phone.unique' => 'رقم الهاتف مسجل مسبقاً',
            'image.image' => 'الملف يجب أن يكون صورة',
            'image.mimes' => 'نوع الصورة غير مدعوم. الصيغ المدعومة: jpeg, png, jpg, gif',
            'image.max' => 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت',
            'life_stage_id.exists' => 'المرحلة الحياتية المحددة غير موجودة',
        ];
    }
}
