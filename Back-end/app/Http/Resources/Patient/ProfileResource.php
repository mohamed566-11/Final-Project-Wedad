<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // البيانات الصحية
            'height' => $this->height,
            'weight' => $this->weight,
            'bmi' => $this->bmi,
            'bmi_category' => $this->bmi_category,
            'age_calculated' => $this->age_calculated,
            'blood_type' => $this->blood_type,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'national_id' => $this->national_id,

            // البيانات الطبية
            'medical_history' => $this->medical_history,
            'chronic_diseases' => $this->chronic_diseases,
            'allergies' => $this->allergies,
            'current_medications' => $this->current_medications,

            // جهات الاتصال في حالات الطوارئ
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,

            'last_update' => $this->updated_at->format('Y-m-d'),
        ];
    }
}
