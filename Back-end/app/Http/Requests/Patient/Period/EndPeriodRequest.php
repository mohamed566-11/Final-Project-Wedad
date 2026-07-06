<?php

namespace App\Http\Requests\Patient\Period;

use App\Http\Requests\BaseRequest;

/**
 * TASK 4 — Validation for ending a period cycle.
 */
class EndPeriodRequest extends BaseRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'end_date' => 'required|date|before_or_equal:today',
        ];
    }

    public function messages(): array
    {
        return [
            'end_date.required'        => 'تاريخ انتهاء الدورة مطلوب.',
            'end_date.date'            => 'تاريخ الانتهاء غير صالح.',
            'end_date.before_or_equal' => 'لا يمكن تسجيل تاريخ انتهاء في المستقبل.',
        ];
    }
}
