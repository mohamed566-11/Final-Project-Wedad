<?php

namespace App\Http\Requests\Patient\Weight;

use App\Http\Requests\BaseRequest;

class StoreWeightRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'weight' => 'required|numeric|min:30|max:300',
            'height' => 'nullable|numeric|min:100|max:250',
            'notes' => 'nullable|string|max:1000',
            'entry_date' => 'nullable|date|before_or_equal:today',
            'entry_time' => 'nullable|date_format:H:i',
        ];
    }
}
