<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateMedicalInfoRequest extends BaseRequest
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
            'height' => ['sometimes', 'nullable', 'numeric', 'min:100', 'max:250'],
            'weight' => ['sometimes', 'nullable', 'numeric', 'min:30', 'max:300'],
            'blood_type' => ['sometimes', 'nullable', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today', 'after:1920-01-01'],
            'national_id' => [
                'sometimes',
                'nullable',
                'string',
                'size:14',
                'regex:/^[0-9]{14}$/',
                Rule::unique('user_profiles', 'national_id')->ignore($userId, 'user_id')
            ],
            'medical_history' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'blood_pressure_systolic' => ['sometimes', 'nullable', 'integer', 'min:60', 'max:250'],
            'blood_pressure_diastolic' => ['sometimes', 'nullable', 'integer', 'min:40', 'max:150'],
            'chronic_diseases' => ['sometimes', 'nullable', 'array'],
            'chronic_diseases.*' => ['string', 'max:255'],
            'allergies' => ['sometimes', 'nullable', 'array'],
            'allergies.*' => ['string', 'max:255'],
            'current_medications' => ['sometimes', 'nullable', 'array'],
            'current_medications.*' => ['string', 'max:255'],
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
            'height.numeric' => 'الطول يجب أن يكون رقماً',
            'height.min' => 'الطول يجب أن يكون 100 سم على الأقل',
            'height.max' => 'الطول يجب ألا يتجاوز 250 سم',
            'weight.numeric' => 'الوزن يجب أن يكون رقماً',
            'weight.min' => 'الوزن يجب أن يكون 30 كجم على الأقل',
            'weight.max' => 'الوزن يجب ألا يتجاوز 300 كجم',
            'blood_type.in' => 'فصيلة الدم غير صحيحة',
            'date_of_birth.date' => 'تاريخ الميلاد غير صحيح',
            'date_of_birth.before' => 'تاريخ الميلاد يجب أن يكون في الماضي',
            'date_of_birth.after' => 'تاريخ الميلاد يجب أن يكون بعد 1920',
            'national_id.size' => 'الرقم القومي يجب أن يكون 14 رقماً',
            'national_id.regex' => 'الرقم القومي يجب أن يحتوي على 14 رقماً فقط',
            'national_id.unique' => 'الرقم القومي مسجل مسبقاً',
            'medical_history.max' => 'التاريخ المرضي يجب ألا يتجاوز 5000 حرف',
            'chronic_diseases.array' => 'الأمراض المزمنة يجب أن تكون قائمة',
            'allergies.array' => 'الحساسية يجب أن تكون قائمة',
            'current_medications.array' => 'الأدوية الحالية يجب أن تكون قائمة',
            'blood_pressure_systolic.integer' => 'الضغط الانقباضي يجب أن يكون رقماً صحيحاً',
            'blood_pressure_systolic.min' => 'الضغط الانقباضي قيمة غير منطقية',
            'blood_pressure_systolic.max' => 'الضغط الانقباضي قيمة غير منطقية',
            'blood_pressure_diastolic.integer' => 'الضغط الانبساطي يجب أن يكون رقماً صحيحاً',
            'blood_pressure_diastolic.min' => 'الضغط الانبساطي قيمة غير منطقية',
            'blood_pressure_diastolic.max' => 'الضغط الانبساطي قيمة غير منطقية',
        ];
    }
}
