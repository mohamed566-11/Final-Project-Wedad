<?php

namespace App\Http\Requests\Patient\Fertility;

use App\Http\Requests\BaseRequest;

class StoreFertilityRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entry_date' => 'required|date|before_or_equal:today',
            'bbt' => 'nullable|numeric|min:35|max:42',
            'cervical_mucus' => 'nullable|in:dry,sticky,creamy,watery,egg_white',
            'ovulation_test_positive' => 'boolean',
            'intercourse' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ];
    }
}
