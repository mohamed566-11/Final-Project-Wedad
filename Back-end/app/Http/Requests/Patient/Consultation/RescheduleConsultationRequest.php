<?php

namespace App\Http\Requests\Patient\Consultation;

use App\Http\Requests\BaseRequest;

class RescheduleConsultationRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'new_date' => 'required|date|after_or_equal:today',
            'new_time' => 'required|date_format:H:i',
            'reason' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'new_date.required' => 'يجب تحديد التاريخ الجديد',
            'new_date.date' => 'صيغة التاريخ غير صحيحة',
            'new_date.after_or_equal' => 'لا يمكن الحجز في تاريخ سابق',
            'new_time.required' => 'يجب تحديد الوقت الجديد',
            'new_time.date_format' => 'صيغة الوقت غير صحيحة',
            'reason.max' => 'السبب طويل جداً',
        ];
    }
}
