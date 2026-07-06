<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminResource extends JsonResource
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
            
            // الدور والصلاحيات
            'role_id' => $this->role_id,
            'role' => $this->whenLoaded('role', function () {
                return [
                    'id' => $this->role->id,
                    'role' => $this->role->role,
                    'description' => $this->role->description,
                    'permissions' => $this->role->permissions ?? [],
                ];
            }),
            
            // الحالة
            'is_active' => $this->is_active,
            'is_super_admin' => $this->isSuperAdmin(),
            
            // معالجة الصورة
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
            
            // تنسيق التواريخ
            'last_login_at' => $this->last_login_at?->format('Y-m-d H:i:s'),
            'joined_at' => $this->created_at->format('Y-m-d'),
        ];
    }
}
