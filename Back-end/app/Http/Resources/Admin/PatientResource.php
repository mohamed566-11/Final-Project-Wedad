<?php

namespace App\Http\Resources\Admin;

use App\Utils\TranslationHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'age' => $this->age,
            
            // Life Stage
            'life_stage' => $this->whenLoaded('lifeStage', function () {
                return [
                    'id' => $this->lifeStage->id,
                    'name' => $this->lifeStage->name,
                    'display_name' => $this->getLifeStageDisplayName($this->lifeStage->name),
                ];
            }),
            
            // Profile
            'profile' => $this->whenLoaded('profile', function () {
                return [
                    'height' => $this->profile?->height,
                    'weight' => $this->profile?->weight,
                    'blood_type' => $this->profile?->blood_type,
                    'chronic_diseases' => $this->profile?->chronic_diseases ?? [],
                    'allergies' => $this->profile?->allergies ?? [],
                    'emergency_contact' => $this->profile?->emergency_contact,
                    'emergency_phone' => $this->profile?->emergency_phone,
                ];
            }),
            
            // Status
            'is_active' => $this->is_active,
            'is_verified' => $this->email_verified_at !== null,
            
            // Image
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
            
            // Dates
            'email_verified_at' => $this->email_verified_at?->format('Y-m-d H:i:s'),
            'last_login_at' => $this->last_login_at?->format('Y-m-d H:i:s'),
            'joined_at' => $this->created_at->format('Y-m-d'),
            
            // Stats (when loaded)
            'total_consultations' => $this->when(
                $this->relationLoaded('consultations'), 
                fn() => $this->consultations->count()
            ),
        ];
    }

    private function getLifeStageDisplayName(?string $name): string
    {
        if (!$name) return 'غير محدد';
        return TranslationHelper::lifeStage($name);
    }
}
