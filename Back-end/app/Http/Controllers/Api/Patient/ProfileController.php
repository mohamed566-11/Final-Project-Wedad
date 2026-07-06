<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\UpdateBasicInfoRequest;
use App\Http\Requests\Patient\UpdateMedicalInfoRequest;
use App\Http\Requests\Patient\UpdateEmergencyContactRequest;
use App\Http\Requests\Patient\UpdatePasswordRequest;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\Patient\PatientResource;
use App\Http\Resources\Patient\ProfileResource;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\LifeStage;
use App\Utils\ImageManager;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProfileController extends Controller
{
    use ApiResponse;

    protected $imageManager;

    public function __construct(ImageManager $imageManager)
    {
        $this->imageManager = $imageManager;
    }
    /**
     * Display the patient's profile
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Load relationships
        $user->load(['profile', 'lifeStage']);

        // Calculate profile completion
        $profileCompletion = $this->calculateProfileCompletion($user);

        // Create resource with additional metadata
        $patientResource = new PatientResource($user);

        // Add profile completion data to the resource
        $resourceData = $patientResource->toArray($request);
        $resourceData['profile_completion'] = $profileCompletion['percentage'];
        $resourceData['missing_fields'] = $profileCompletion['missing_fields'];

        return $this->successResponse($resourceData, 'تم جلب الملف الشخصي بنجاح');
    }

    /**
     * Update basic profile information
     */
    public function updateBasicInfo(UpdateBasicInfoRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imagePath = $this->imageManager->uploadSingleImage($image, 'profiles', 'uploads');

                // Delete old image if exists
                if ($user->image) {
                    $this->imageManager->deleteImage($user->image, 'uploads');
                }

                $validated['image'] = $imagePath;
            }

            $oldAge = $user->age;
            
            // Update user data
            $user->update($validated);

            // Sync with profile date of birth if age was changed
            if (isset($validated['age']) && $validated['age'] != $oldAge) {
                $profile = $user->profile ?: new UserProfile(['user_id' => $user->id]);
                // Approximate birth date by subtracting years
                $profile->date_of_birth = now()->subYears($validated['age'])->startOfYear();
                $profile->save();
            }

            DB::commit();

            // Return updated patient resource
            $updatedUser = $user->fresh()->load(['profile', 'lifeStage']);
            $patientResource = new PatientResource($updatedUser);

            return $this->successResponse(
                $patientResource->toArray($request),
                'تم تحديث المعلومات الأساسية بنجاح'
            );
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Profile update error: ' . $e->getMessage());
            return $this->errorResponse(
                'حدث خطأ أثناء تحديث المعلومات، يرجى المحاولة لاحقاً',
                500
            );
        }
    }

    /**
     * Update user password
     */
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $request->user();

        // Update password
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }


    /**
     * Update medical profile information
     */
    public function updateMedicalInfo(UpdateMedicalInfoRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Ensure user has a profile
            $profile = $user->profile ?: new UserProfile(['user_id' => $user->id]);

            // No need to manually json_encode arrays, as the model casts them to 'array' (UserProfile casts).

            // Store old weight to track changes
            $oldWeight = $profile->weight;

            // Update profile
            $profile->fill($validated);
            $profile->save();

            // Sync user's age if date_of_birth is provided
            if (isset($validated['date_of_birth']) && $validated['date_of_birth']) {
                $dob = \Carbon\Carbon::parse($validated['date_of_birth']);
                $user->update(['age' => $dob->age]);
            }

            // Sync with General Weight Tracker if weight changed
            if (isset($validated['weight']) && $validated['weight'] != $oldWeight) {
                \App\Models\WeightEntry::create([
                    'user_id' => $user->id,
                    'weight' => $validated['weight'],
                    'height' => $profile->height ?? null,
                    'entry_date' => now()->toDateString(),
                    'entry_time' => now(),
                    'notes' => 'تحديث من الملف الشخصي الطبي'
                ]);
            }

            DB::commit();

            // Reload profile with fresh data
            $user->load(['profile', 'lifeStage']);

            // Return patient resource with updated profile
            $patientResource = new PatientResource($user);

            return $this->successResponse(
                $patientResource->toArray($request),
                'تم تحديث المعلومات الطبية بنجاح'
            );
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Medical info update error: ' . $e->getMessage());
            return $this->errorResponse(
                'حدث خطأ أثناء تحديث المعلومات الطبية، يرجى المحاولة لاحقاً',
                500
            );
        }
    }

    /**
     * Update emergency contact information
     */
    public function updateEmergencyContact(UpdateEmergencyContactRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Ensure user has a profile
            $profile = $user->profile ?: new UserProfile(['user_id' => $user->id]);

            // Update emergency contact info
            $profile->emergency_contact_name = $validated['emergency_contact_name'];
            $profile->emergency_contact_phone = $validated['emergency_contact_phone'];
            $profile->save();

            DB::commit();

            // Reload profile with fresh data
            $user->load(['profile', 'lifeStage']);

            // Return patient resource with updated profile
            $patientResource = new PatientResource($user);

            return $this->successResponse(
                $patientResource->toArray($request),
                'تم تحديث معلومات الطوارئ بنجاح'
            );
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Emergency contact update error: ' . $e->getMessage());
            return $this->errorResponse(
                'حدث خطأ أثناء تحديث معلومات الطوارئ، يرجى المحاولة لاحقاً',
                500
            );
        }
    }

    /**
     * Get profile statistics
     */
    public function getStats(Request $request)
    {
        $user = $request->user();
        $user->load(['profile', 'lifeStage']);

        $profileCompletion = $this->calculateProfileCompletion($user);

        $bmi = $user->profile ? $user->profile->bmi : null;
        $bmiCategory = $user->profile ? $user->profile->bmi_category : null;

        $healthScore = $this->calculateHealthScore($user, $bmi, $profileCompletion['percentage']);

        // Pregnancy summary for profile
        $pregnancySummary = null;
        $activePregnancy = $user->activePregnancy;
        if ($activePregnancy) {
            $lmp = Carbon::parse($activePregnancy->last_menstrual_period);
            $daysPregnant = $lmp->diffInDays(Carbon::today());
            $currentWeek = (int) floor($daysPregnant / 7);

            $pregnancySummary = [
                'is_active' => true,
                'current_week' => $currentWeek,
                'due_date' => $activePregnancy->due_date->format('Y-m-d'),
                'trimester' => $currentWeek <= 13 ? 1 : ($currentWeek <= 27 ? 2 : 3),
                'total_entries' => $activePregnancy->entries()->count(),
            ];
        }

        return response()->json([
            'status' => true,
            'message' => 'تم جلب الإحصائيات بنجاح',
            'data' => [
                'profile_completion_percentage' => $profileCompletion['percentage'],
                'missing_fields' => $profileCompletion['missing_fields'],
                'bmi' => $bmi,
                'bmi_category' => $bmiCategory,
                'health_score' => $healthScore,
                'last_updated' => $user->profile ? $user->profile->updated_at->format('Y-m-d H:i') : null,
                'pregnancy_summary' => $pregnancySummary,
            ]
        ]);
    }

    /**
     * Delete profile image
     */
    public function deleteImage(Request $request)
    {
        $user = $request->user();

        if (!$user->image) {
            return response()->json([
                'status' => false,
                'message' => 'لا توجد صورة للحذف'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Delete image from storage using ImageManager
            $this->imageManager->deleteImage($user->image, 'uploads');

            // Remove image reference from user
            $user->update(['image' => null]);

            DB::commit();

            return $this->successResponse(null, 'تم حذف الصورة الشخصية بنجاح');
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Delete image error: ' . $e->getMessage());
            return $this->errorResponse(
                'حدث خطأ أثناء حذف الصورة، يرجى المحاولة لاحقاً',
                500
            );
        }
    }

    /**
     * Get available life stages (public endpoint)
     */
    public function getLifeStages()
    {
        $lifeStages = LifeStage::select('id', 'name', 'slug', 'description')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'تم جلب المراحل الحياتية بنجاح',
            'data' => $lifeStages
        ]);
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateProfileCompletion($user)
    {
        $completedFields = 0;
        $totalFields = 10; // Total fields to check
        $missingFields = [];

        // Basic info (30% weight)
        if (!empty($user->name))
            $completedFields += 1;
        else
            $missingFields[] = 'name';
        if (!empty($user->age))
            $completedFields += 1;
        else
            $missingFields[] = 'age';
        if (!empty($user->phone))
            $completedFields += 1;
        else
            $missingFields[] = 'phone';
        if (!empty($user->image))
            $completedFields += 1;
        else
            $missingFields[] = 'image';

        // Medical info (50% weight)
        if ($user->profile) {
            if (!empty($user->profile->height))
                $completedFields += 1;
            else
                $missingFields[] = 'height';
            if (!empty($user->profile->weight))
                $completedFields += 1;
            else
                $missingFields[] = 'weight';
            if (!empty($user->profile->blood_type))
                $completedFields += 1;
            else
                $missingFields[] = 'blood_type';
            if (!empty($user->profile->date_of_birth))
                $completedFields += 1;
            else
                $missingFields[] = 'date_of_birth';
        } else {
            $missingFields = array_merge($missingFields, ['height', 'weight', 'blood_type', 'date_of_birth']);
        }

        // Emergency contact (20% weight)
        if ($user->profile) {
            if (!empty($user->profile->emergency_contact_name))
                $completedFields += 1;
            else
                $missingFields[] = 'emergency_contact_name';
            if (!empty($user->profile->emergency_contact_phone))
                $completedFields += 1;
            else
                $missingFields[] = 'emergency_contact_phone';
        } else {
            $missingFields = array_merge($missingFields, ['emergency_contact_name', 'emergency_contact_phone']);
        }

        $percentage = ($completedFields / $totalFields) * 100;

        return [
            'percentage' => round($percentage, 2),
            'missing_fields' => array_unique($missingFields)
        ];
    }

    /**
     * Calculate health score based on profile completeness and BMI
     */
    private function calculateHealthScore($user, $bmi, $completionPercentage = null)
    {
        $score = 0;

        // Profile completion contributes 60% to health score
        $profileCompletion = $completionPercentage ?? $this->calculateProfileCompletion($user)['percentage'];
        $score += ($profileCompletion * 0.6);

        // BMI contributes 40% to health score (if available)
        if ($bmi !== null) {
            if ($bmi >= 18.5 && $bmi < 25) {
                $score += 40; // Perfect BMI
            } elseif (($bmi >= 17 && $bmi < 18.5) || ($bmi >= 25 && $bmi < 27)) {
                $score += 30; // Near normal
            } elseif (($bmi >= 15 && $bmi < 17) || ($bmi >= 27 && $bmi < 30)) {
                $score += 20; // Mild concern
            } else {
                $score += 10; // Significant concern
            }
        }

        return min(100, round($score, 2));
    }
}
