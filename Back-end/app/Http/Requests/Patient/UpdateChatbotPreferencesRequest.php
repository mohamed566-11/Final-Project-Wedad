<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatbotPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        return [
            'data_access_enabled' => 'sometimes|boolean',
            'share_predictions' => 'sometimes|boolean',
            'share_trackers' => 'sometimes|boolean',
            'share_medical_file' => 'sometimes|boolean',
            'share_consultations' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'data_access_enabled.required' => 'يجب تحديد حالة تفعيل مشاركة البيانات',
            'data_access_enabled.boolean' => 'القيمة يجب أن تكون true أو false',
        ];
    }
}
