<?php

namespace App\Http\Requests\Patient\Consultation;

use App\Http\Requests\BaseRequest;

class CancelConsultationRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'cancellation_reason' => 'required|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'cancellation_reason.required' => 'يجب ذكر سبب الإلغاء',
            'cancellation_reason.max' => 'سبب الإلغاء طويل جداً',
        ];
    }
}
