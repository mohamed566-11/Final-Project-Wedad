<?php

namespace App\Http\Requests\Doctor\Profile;

use App\Http\Requests\BaseRequest;

class UpdateProfileRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->user()->id;
        return [
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|regex:/^01[0125][0-9]{8}$/|unique:doctors,phone,' . $id,
            'age' => 'nullable|integer|min:25|max:80',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'bio' => 'nullable|string|max:1000',
            'consultation_price' => 'nullable|numeric|min:50|max:5000',
            'session_type' => 'nullable|in:video,offline,both',
            'languages' => 'nullable|array',
            'languages.*' => 'in:ar,en,fr',
            'clinic_address' => 'nullable|string|max:500',
            'life_stage_ids' => 'nullable|array',
            'life_stage_ids.*' => 'exists:life_stages,id',
        ];
    }
}
