<?php

namespace App\Http\Requests\Patient\Period;

use App\Http\Requests\BaseRequest;

/**
 * TASK 4 — Validation rules for starting a new period cycle.
 */
class StartPeriodRequest extends BaseRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'start_date' => 'required|date|before_or_equal:today',
            'flow'       => 'nullable|in:light,medium,heavy',
            'symptoms'   => 'nullable|array',
            'symptoms.*' => 'nullable|string|max:50',
            'notes'      => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.required'        => 'تاريخ البدء مطلوب.',
            'start_date.date'            => 'تاريخ البدء غير صالح.',
            'start_date.before_or_equal' => 'لا يمكن تسجيل دورة بتاريخ مستقبلي.',
            'flow.in'                    => 'مستوى التدفق يجب أن يكون: خفيف أو متوسط أو غزير.',
        ];
    }
}
