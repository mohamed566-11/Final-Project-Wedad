<?php

namespace App\Http\Requests\Doctor;

use App\Http\Requests\BaseRequest;

class DoctorRegisterRequest extends BaseRequest
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
            'name' => ['required', 'string', 'max:255'],

            'email' => ['required', 'email', 'max:255', 'unique:doctors,email'],
            'password' => ['required', 'string', 'min:8'],
            'age' => ['nullable', 'integer', 'min:25', 'max:100'],

            'phone' => ['required', 'string', 'regex:/^01[0125][0-9]{8}$/','unique:doctors,phone'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],

            // Doctor-specific required fields
            'specialization' => ['required', 'string'],
            'license_number' => ['required', 'string', 'unique:doctors,license_number'],
            'consultation_price' => ['required', 'numeric', 'min:0', 'max:99999.99'],
        ];
    }


    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim($this->email)),
            ]);
        }

        if ($this->has('name')) {
            $this->merge([
                'name' => trim($this->name),
            ]);
        }
    }


    public function messages(): array
    {
        return [
            'name.required' => 'الرجاء إدخال الاسم.',
            'email.required' => 'الرجاء إدخال البريد الإلكتروني.',
            'password.required' => 'الرجاء إدخال كلمة المرور.',
            'age.min' => 'يجب أن يكون العمر أكبر من 25 سنة.',
            'age.max' => 'يجب أن يكون العمر أقل من 100 سنة.',
            'phone.required' => 'الرجاء إدخال رقم الهاتف.',
            'phone.unique' => 'هذا الرقم المحمول مسجل مسبقاً، الرجاء تسجيل الدخول أو استخدام رقم آخر.',
            'phone.regex' => 'رقم الهاتف غير صحيح، يجب أن يكون رقم مصري مكون من 11 رقم (مثل: 010xxxxxxxxx).',
            'email.unique' => 'هذا البريد الإلكتروني مسجل مسبقاً.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
            'image.max' => 'حجم الصورة يجب ألا يتعدى 2 ميجابايت.',

            'specialization.required' => 'الرجاء اختيار التخصص.',
            'specialization.in' => 'التخصص المحدد غير صحيح.',
            'license_number.required' => 'الرجاء إدخال رقم الترخيص.',
            'license_number.unique' => 'رقم الترخيص مسجل مسبقاً.',
            'consultation_price.required' => 'الرجاء إدخال سعر الاستشارة.',
            'consultation_price.numeric' => 'سعر الاستشارة يجب أن يكون رقماً.',

        ];
    }
}
