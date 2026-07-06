<?php

namespace App\Http\Requests\Doctor;

use App\Http\Requests\BaseRequest;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends BaseRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email'=> ['required', 'email', 'exists:doctors,email', 'max:70'],
            'code'=> ['required', 'size:5'],
            'password'=> ['required', 'min:8', 'max:20', 'confirmed'],
            'password_confirmation'=> ['required'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'الرجاء إدخال البريد الإلكتروني.',
            'email.email' => 'البريد الإلكتروني غير صالح.',
            'email.exists' => 'هذا البريد الإلكتروني غير مسجل.',
            'code.required' => 'الرجاء إدخال رمز التحقق.',
            'code.size' => 'رمز التحقق يجب أن يكون 5 أرقام.',
            'password.required' => 'الرجاء إدخال كلمة المرور الجديدة.',
            'password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
            'password.max' => 'كلمة المرور يجب ألا تزيد عن 20 حرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
            'password_confirmation.required' => 'الرجاء تأكيد كلمة المرور.',
        ];
    }
}
