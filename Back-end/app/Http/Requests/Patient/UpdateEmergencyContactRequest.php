<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\BaseRequest;

class UpdateEmergencyContactRequest extends BaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'emergency_contact_name' => ['required', 'string', 'max:255'],
            'emergency_contact_phone' => ['required', 'string', 'regex:/^01[0125][0-9]{8}$/'],
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
            'emergency_contact_name.required' => 'اسم جهة الاتصال ضروري',
            'emergency_contact_name.string' => 'اسم جهة الاتصال يجب أن يكون نصًا',
            'emergency_contact_name.max' => 'اسم جهة الاتصال يجب ألا يتجاوز 255 حرفًا',
            'emergency_contact_phone.required' => 'رقم هاتف جهة الاتصال ضروري',
            'emergency_contact_phone.regex' => 'رقم هاتف جهة الاتصال غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015',
        ];
    }
}
