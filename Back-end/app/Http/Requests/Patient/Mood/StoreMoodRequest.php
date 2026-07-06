<?php

namespace App\Http\Requests\Patient\Mood;

use App\Http\Requests\BaseRequest;

class StoreMoodRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mood' => 'required|in:very_bad,bad,neutral,good,very_good',
            'notes' => 'nullable|string|max:1000',
            'factors' => 'nullable|array',
            'entry_date' => 'nullable|date|before_or_equal:today',
            'entry_time' => 'nullable|date_format:H:i',
        ];
    }
}
