<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'phone' => $this->phone,
            'age' => $this->age,
            
            // Specialization
            'specialization' => $this->specialization,
            'specialization_ar' => $this->getSpecializationDisplayName($this->specialization),
            
            // Professional Info
            'license_number' => $this->license_number,
            'bio' => $this->bio,
            'years_of_experience' => $this->years_of_experience,
            'consultation_price' => $this->consultation_price,
            'session_type' => $this->session_type,
            'languages' => $this->languages ?? ['ar'],
            'clinic_address' => $this->clinic_address,
            
            // Life Stages
            'life_stages' => $this->whenLoaded('lifeStages', function () {
                return $this->lifeStages->map(function ($stage) {
                    return [
                        'id' => $stage->id,
                        'name' => $stage->name,
                    ];
                });
            }),
            
            // Working Hours
            'working_hours' => $this->whenLoaded('workingHours', function () {
                return $this->workingHours->map(function ($wh) {
                    return [
                        'day' => $wh->day,
                        'start_time' => $wh->start_time,
                        'end_time' => $wh->end_time,
                        'is_available' => $wh->is_available,
                    ];
                });
            }),
            
            // Verification
            'verification_status' => $this->verification_status,
            'verification_status_ar' => $this->getVerificationStatusDisplayName($this->verification_status),
            'id_verified' => $this->verification_status === 'approved', // For admin verification logic
            'is_verified' => !is_null($this->email_verified_at), // For email verification logic (matching frontend expectation)
            
            // Status
            'is_active' => $this->is_active,
            'is_available' => $this->is_available,
            
            // Ratings
            'rating' => $this->rating,
            'total_consultations' => $this->total_consultations,
            'total_reviews' => $this->when(
                $this->relationLoaded('reviews'),
                fn() => $this->reviews->count()
            ),
            
            // Documents
            'documents' => [
                'license_document' => $this->license_document 
                    ? app('App\Utils\ImageManager')->getImageUrl($this->license_document, 'doctors/documents', 'public') 
                    : null,
                'id_document' => $this->id_document 
                    ? app('App\Utils\ImageManager')->getImageUrl($this->id_document, 'doctors/documents', 'public') 
                    : null,
                'certificate' => $this->certificate 
                    ? app('App\Utils\ImageManager')->getImageUrl($this->certificate, 'doctors/documents', 'public') 
                    : null,
            ],
            'documents_submitted' => !empty($this->license_document) && !empty($this->id_document),
            
            // Image
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            
            // Dates
            'email_verified_at' => $this->email_verified_at?->format('Y-m-d H:i:s'),
            'verified_at' => $this->verified_at?->format('Y-m-d'),
            'last_login_at' => $this->last_login_at?->format('Y-m-d H:i:s'),
            'joined_at' => $this->created_at->format('Y-m-d'),
        ];
    }

    private function getSpecializationDisplayName(?string $specialization): string
    {
        $names = [
            'gynecology' => 'أمراض نساء',
            'obstetrics' => 'توليد',
            'fertility' => 'علاج العقم',
            'dermatology' => 'جلدية',
            'nutrition' => 'تغذية',
            'psychology' => 'نفسية',
            'pediatrics' => 'أطفال',
            'internal_medicine' => 'باطنية',
        ];

        return $names[$specialization ?? ''] ?? ($specialization ?? 'غير محدد');
    }

    private function getVerificationStatusDisplayName(?string $status): string
    {
        $names = [
            'pending' => 'قيد المراجعة',
            'approved' => 'معتمد',
            'rejected' => 'مرفوض',
        ];

        return $names[$status ?? ''] ?? ($status ?? 'غير محدد');
    }
}
