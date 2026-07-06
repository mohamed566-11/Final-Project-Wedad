<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doctor\Profile\UpdateProfileRequest;
use App\Http\Resources\Doctor\DoctorResource;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class DoctorProfileController extends Controller
{
    use ApiResponse;

    protected $imageManager;

    public function __construct(\App\Utils\ImageManager $imageManager)
    {
        $this->imageManager = $imageManager;
    }

    /**
     * Get doctor profile
     * GET /api/v1/doctor/profile
     */
    public function show(Request $request)
    {
        $doctor = $request->user()->load('lifeStages');

        return $this->successResponse([
            'doctor' => new DoctorResource($doctor),
        ], 'تم جلب الملف الشخصي بنجاح');
    }

    /**
     * Update doctor profile
     * PUT /api/v1/doctor/profile
     */
    public function update(UpdateProfileRequest $request)
    {
        $doctor = $request->user();
        $data = $request->validated();

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imagePath = $this->imageManager->uploadSingleImage($image, 'profiles', 'uploads');

            if ($doctor->image) {
                $this->imageManager->deleteImage($doctor->image, 'uploads');
            }
            // المسار الكامل محفوظ مباشرةً من uploadSingleImage
            $data['image'] = $imagePath;
        }

        // Handle Life Stages (Many-to-Many)
        if (isset($data['life_stage_ids'])) {
            $doctor->lifeStages()->sync($data['life_stage_ids']);
            unset($data['life_stage_ids']);
        }

        $doctor->update($data);

        return $this->successResponse([
            'doctor' => new DoctorResource($doctor->fresh()->load('lifeStages')),
        ], 'تم تحديث الملف الشخصي بنجاح');
    }

    /**
     * Update availability status
     * PUT /api/v1/doctor/profile/availability
     */
    public function updateAvailability(Request $request)
    {
        $request->validate([
            'is_available' => 'required|boolean'
        ]);

        $doctor = $request->user();
        $doctor->update(['is_available' => $request->is_available]);

        return $this->successResponse([
            'is_available' => $doctor->is_available
        ], 'تم تحديث حالة التوافر بنجاح');
    }

    /**
     * Change doctor password
     * PUT /api/v1/doctor/profile/change-password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة',
            'new_password.required' => 'كلمة المرور الجديدة مطلوبة',
            'new_password.min' => 'كلمة المرور يجب أن لا تقل عن 8 أحرف',
            'new_password.confirmed' => 'كلمتا المرور لا تتطابقان',
        ]);

        $doctor = $request->user();

        // Check if the current password matches
        if (!Hash::check($request->current_password, $doctor->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 400);
        }

        // Update with the new hashed password
        $doctor->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->new_password)
        ]);

        // إرسال الإشعار - لا يجب أن يُوقف العملية في حال فشل الإرسال
        try {
            $doctor->notify(new \App\Notifications\PasswordChangedNotification());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('PasswordChangedNotification failed: ' . $e->getMessage());
        }

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }
}
