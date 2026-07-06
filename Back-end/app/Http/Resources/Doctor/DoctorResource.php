<?php

namespace App\Http\Resources\Doctor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DoctorResource extends JsonResource
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

            // البيانات الأساسية
            'age' => $this->age,
            'phone' => $this->phone,

            // البيانات المهنية
            'specialization' => $this->specialization,
            'specialization_ar' => \App\Utils\TranslationHelper::specialization($this->specialization),
            'license_number' => $this->license_number,
            'bio' => $this->bio,
            'years_of_experience' => $this->years_of_experience,
            'languages' => $this->languages,

            // معلومات الاستشارة
            'consultation_price' => $this->consultation_price,
            'session_type' => $this->session_type,
            'clinic_address' => $this->clinic_address,

            // الحالة والتقييم
            'verification_status' => $this->verification_status,
            'is_active' => $this->is_active,
            'is_available' => $this->is_available,
            'rating' => $this->rating,
            'total_consultations' => $this->total_consultations,

            // المرحلة العمرية المتخصص فيها
            'life_stages' => $this->whenLoaded('lifeStages', function () {
                return $this->lifeStages->map(function ($stage) {
                    return [
                        'id' => $stage->id,
                        'name' => $stage->name,
                        'slug' => $stage->slug,
                    ];
                });
            }),

            // معالجة الصورة
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),

            // حالة التوثيق
            'is_verified' => $this->verification_status === 'approved' || $this->verification_status === 'verified',
            'is_email_verified' => $this->email_verified_at !== null,
            'email_verified_at' => $this->email_verified_at?->format('Y-m-d H:i:s'),
            'verified_at' => $this->verified_at?->format('Y-m-d'),

            // تنسيق التواريخ
            'joined_at' => $this->created_at->format('Y-m-d'),
        ];
    }
}
