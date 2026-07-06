<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use App\Http\Resources\Patient\ProfileResource;
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

            // التعامل مع القيم التي قد تكون Null
            'age' => $this->age,
            'phone' => $this->phone,

            // المرحلة العمرية
            'life_stage_id' => $this->life_stage_id,
            'life_stage' => $this->whenLoaded('lifeStage', function () {
                return [
                    'id' => $this->lifeStage->id,
                    'name' => $this->lifeStage->name,
                    'slug' => $this->lifeStage->slug,
                ];
            }),

            // ✅ الإضافة هنا: عرض البروفايل فقط إذا تم تحميله
            'profile' => new ProfileResource($this->whenLoaded('profile')),

            // الحالة
            'is_active' => $this->is_active,
            // معالجة الصورة: إرجاع رابط كامل باستخدام ImageManager
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
            // حالة توثيق الإيميل (مفيد للفرونت إند لإظهار رسالة "يرجى تفعيل حسابك")
            'is_verified' => !is_null($this->email_verified_at),

            // تنسيق التواريخ بشكل احترافي
            'joined_at' => $this->created_at->format('Y-m-d'), // تاريخ فقط: 2025-10-21
            // 'created_at_human' => $this->created_at->diffForHumans(), // اختياري: منذ يومين
        ];
    }
}
