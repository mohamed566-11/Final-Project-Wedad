<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;

class AdminRegisterRequest extends BaseRequest
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

            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            // confirmed تعني أنه يجب إرسال حقل آخر اسمه password_confirmation
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'age' => ['nullable', 'integer', 'min:12', 'max:100'],

            'phone' => ['required', 'string', 'regex:/^01[0125][0-9]{8}$/','unique:users,phone'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
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
            'age.min' => 'يجب ان يكون عمر病ليتك أكبر من 12 سنة.',
            'age.max' => 'يجب ان يكون عمر病ليتك أقل من 100 سنة.',
            'phone.required' => 'الرجاء إدخال رقم الهاتف.',
            
            'email.unique' => 'هذا البريد الإلكتروني مسجل مسبقاً.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
            'image.max' => 'حجم الصورة يجب ألا يتعدى 2 ميجابايت.',
            'phone.regex' => 'رقم الهاتف غير صحيح، يجب أن يكون رقم مصري مكون من 11 رقم (مثل: 010xxxxxxxxx).',
            'phone.unique' => 'هذا الرقم المحمول مسجل مسبقاً، الرجاء تسجيل الدخول أو استخدام رقم آخر.',
        ];
    }
}