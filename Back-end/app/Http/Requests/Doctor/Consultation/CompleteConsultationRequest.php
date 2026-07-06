<?php

namespace App\Http\Requests\Doctor\Consultation;

use App\Http\Requests\BaseRequest;

class CompleteConsultationRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'doctor_notes' => 'required|string|max:2000',
            'diagnosis' => 'nullable|string|max:1000',
            'prescription' => 'nullable|string|max:2000', // Legacy support or general notes
            'medications' => 'nullable|array',
            'medications.*.name' => 'required_with:medications|string',
            'medications.*.dosage' => 'required_with:medications|string',
            'medications.*.frequency' => 'nullable|string',
            'medications.*.duration' => 'nullable|string',
            'follow_up_required' => 'nullable|boolean',
            'follow_up_after_days' => 'nullable|integer|min:1|max:365',
        ];
    }

    public function messages(): array
    {
        return [
            'doctor_notes.required' => 'يجب إضافة ملاحظات الطبيب',
            'doctor_notes.max' => 'ملاحظات الطبيب طويلة جداً',
            'prescription.max' => 'الوصفة الطبية طويلة جداً',
            'follow_up_after_days.min' => 'عدد أيام المتابعة يجب أن يكون 1 على الأقل',
            'follow_up_after_days.max' => 'عدد أيام المتابعة يجب أن لا يتجاوز سنة',
        ];
    }
}
