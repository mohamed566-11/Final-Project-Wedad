<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\Payment;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DoctorController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected NotificationService $notificationService
    ) {
    }

    /**
     * Get all doctors with filters
     * GET /api/v1/admin/doctors
     */
    public function index(Request $request)
    {
        $query = Doctor::query()->withCount('reviews')->with(['lifeStages', 'workingHours']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%");
            });
        }

        // Specialization filter
        if ($request->filled('specialization')) {
            $query->where('specialization', $request->specialization);
        }

        // Verification status filter
        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }

        // Active status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Available status filter
        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        // Sort options
        $sortBy = $request->input('sort_by', 'newest');
        switch ($sortBy) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'rating':
                $query->orderByDesc('rating');
                break;
            case 'consultations':
                $query->orderByDesc('total_consultations');
                break;
            case 'name':
                $query->orderBy('name', 'asc');
                break;
            case 'newest':
            default:
                $query->orderByDesc('created_at');
                break;
        }

        $doctors = $query->paginate(15);

        // Get statistics (Cached)
        $stats = Cache::remember('admin.doctors.stats', CacheService::DURATION_SHORT, function () {
            return [
                'total' => Doctor::count(),
                'pending_verification' => Doctor::where('verification_status', 'pending')->count(),
                'verified' => Doctor::where('verification_status', 'verified')->count(),
                'rejected' => Doctor::where('verification_status', 'rejected')->count(),
                'active' => Doctor::where('is_active', true)->count(),
                'inactive' => Doctor::where('is_active', false)->count(),
            ];
        });

        // Transform doctors data
        $transformedDoctors = $doctors->getCollection()->map(function ($doctor) {
            return $this->transformDoctor($doctor);
        });

        return $this->successResponse([
            'doctors' => $transformedDoctors,
            'stats' => $stats,
            'pagination' => [
                'total' => $doctors->total(),
                'per_page' => $doctors->perPage(),
                'current_page' => $doctors->currentPage(),
                'last_page' => $doctors->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific doctor details
     * GET /api/v1/admin/doctors/{id}
     */
    public function show($id)
    {
        $doctor = Doctor::with(['lifeStages', 'workingHours', 'reviews', 'articles'])
            ->find($id);

        if (!$doctor) {
            return $this->errorResponse('الطبيب غير موجود', 404);
        }

        // Get earnings
        $totalEarnings = Payment::where('status', 'completed')
            ->whereHas('consultation', function ($q) use ($id) {
                $q->where('doctor_id', $id);
            })
            ->sum('doctor_amount');

        $thisMonthEarnings = Payment::where('status', 'completed')
            ->where('paid_at', '>=', Carbon::now()->startOfMonth())
            ->whereHas('consultation', function ($q) use ($id) {
                $q->where('doctor_id', $id);
            })
            ->sum('doctor_amount');

        $pendingPayout = Payment::where('status', 'completed')
            ->whereHas('consultation', function ($q) use ($id) {
                $q->where('doctor_id', $id);
            })
            // Assuming we track payouts - for now, just a placeholder
            ->sum('doctor_amount') * 0; // Placeholder

        return $this->successResponse([
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'phone' => $doctor->phone,
                'age' => $doctor->age,
                'specialization' => $doctor->specialization,
                'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
                'license_number' => $doctor->license_number,
                'bio' => $doctor->bio,
                'years_of_experience' => $doctor->years_of_experience,
                'consultation_price' => $doctor->consultation_price,
                'session_type' => $doctor->session_type,
                'languages' => $doctor->languages ?? ['ar'],
                'clinic_address' => $doctor->clinic_address,
                'verification_status' => $doctor->verification_status,
                'is_active' => $doctor->is_active,
                'is_available' => $doctor->is_available,
                'rating' => $doctor->rating,
                'total_consultations' => $doctor->total_consultations,
                'total_reviews' => $doctor->reviews->count(),
                'documents' => [
                    'license_document' => $doctor->license_document
                        ? app('App\Utils\ImageManager')->getImageUrl($doctor->license_document, 'doctors/documents', 'public')
                        : null,
                    'id_document' => $doctor->id_document
                        ? app('App\Utils\ImageManager')->getImageUrl($doctor->id_document, 'doctors/documents', 'public')
                        : null,
                    'certificate' => $doctor->certificate
                        ? app('App\Utils\ImageManager')->getImageUrl($doctor->certificate, 'doctors/documents', 'public')
                        : null,
                ],
                'life_stages' => $doctor->lifeStages->map(function ($stage) {
                    return [
                        'id' => $stage->id,
                        'name' => $stage->name,
                    ];
                }),
                'working_hours' => $doctor->workingHours->map(function ($wh) {
                    return [
                        'day' => $wh->day,
                        'start_time' => $wh->start_time,
                        'end_time' => $wh->end_time,
                        'is_available' => $wh->is_available,
                    ];
                }),
                'image_url' => app('App\Utils\ImageManager')->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                'joined_at' => $doctor->created_at->format('Y-m-d'),
                'verified_at' => $doctor->verified_at?->format('Y-m-d'),
                'last_login_at' => $doctor->last_login_at?->format('Y-m-d H:i:s'),
            ],
            'earnings' => [
                'total' => round($totalEarnings, 2),
                'this_month' => round($thisMonthEarnings, 2),
                'pending_payout' => round($pendingPayout, 2),
            ],
            'articles' => [
                'total' => $doctor->articles->count(),
                'approved' => $doctor->articles->where('status', 'approved')->count(),
                'pending' => $doctor->articles->where('status', 'pending_review')->count(),
            ],
        ]);
    }

    /**
     * Verify a doctor
     * PUT /api/v1/admin/doctors/{id}/verify
     */
    public function verify(Request $request, $id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return $this->errorResponse('الطبيب غير موجود', 404);
        }

        $request->validate([
            'verification_status' => 'required|in:verified,approved,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($request->verification_status === 'verified' || $request->verification_status === 'approved') {
            $doctor->update([
                'verification_status' => 'approved',
                'verified_at' => Carbon::now(),
                'is_available' => true,
            ]);

            // Send verification approval notification to doctor
            $this->notificationService->notifyDoctorVerificationApproved($doctor);

            return $this->successResponse([
                'doctor' => [
                    'id' => $doctor->id,
                    'verification_status' => $doctor->verification_status,
                    'verified_at' => $doctor->verified_at->format('Y-m-d H:i:s'),
                ],
            ], 'تم التحقق من الطبيب بنجاح');
        }

        return $this->errorResponse('استخدم endpoint الرفض للرفض', 400);
    }

    /**
     * Reject a doctor verification
     * PUT /api/v1/admin/doctors/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return $this->errorResponse('الطبيب غير موجود', 404);
        }

        $request->validate([
            'rejection_reason' => 'required|string|min:10|max:1000',
        ], [
            'rejection_reason.required' => 'سبب الرفض مطلوب',
            'rejection_reason.min' => 'سبب الرفض يجب أن يكون 10 أحرف على الأقل',
        ]);

        $doctor->update([
            'verification_status' => 'rejected',
            'is_available' => false,
        ]);

        // Send rejection notification to doctor with reason
        $this->notificationService->notifyDoctorVerificationRejected($doctor, $request->rejection_reason);

        // Store rejection reason
        $doctor->update(['rejection_reason' => $request->rejection_reason]);
        Log::info("Doctor #{$doctor->id} verification rejected. Reason: {$request->rejection_reason}");

        return $this->successResponse([
            'doctor' => [
                'id' => $doctor->id,
                'verification_status' => $doctor->verification_status,
            ],
        ], 'تم رفض التحقق من الطبيب');
    }

    /**
     * Toggle doctor account status
     * PUT /api/v1/admin/doctors/{id}/toggle-status
     */
    public function toggleStatus(Request $request, $id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return $this->errorResponse('الطبيب غير موجود', 404);
        }

        $request->validate([
            'is_active' => 'required|boolean',
            'reason' => 'required_if:is_active,false|nullable|string|max:500',
        ]);

        $doctor->update([
            'is_active' => $request->is_active,
        ]);

        // If deactivating, also make unavailable and revoke tokens
        if (!$request->is_active) {
            $doctor->update(['is_available' => false]);
            $doctor->tokens()->delete();

            // Cancel upcoming consultations
            $cancelledCount = Consultation::where('doctor_id', $doctor->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->update([
                    'status' => 'cancelled_by_doctor',
                    'cancellation_reason' => $request->reason ?? 'تم إيقاف حساب الطبيب',
                ]);
            Log::info("Doctor #{$doctor->id} deactivated. {$cancelledCount} consultations cancelled. Reason: {$request->reason}");

            // Send notification to doctor
            $this->notificationService->notifyDoctorDeactivated($doctor, $request->reason);
        }

        $message = $request->is_active
            ? 'تم تفعيل حساب الطبيب بنجاح'
            : 'تم إيقاف حساب الطبيب بنجاح';

        return $this->successResponse([
            'doctor' => [
                'id' => $doctor->id,
                'is_active' => $doctor->is_active,
            ],
        ], $message);
    }

    /**
     * Delete doctor account (soft delete)
     * DELETE /api/v1/admin/doctors/{id}
     */
    public function destroy($id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return $this->errorResponse('الطبيب غير موجود', 404);
        }

        // Revoke all tokens
        $doctor->tokens()->delete();

        // Soft delete
        $doctor->delete();

        return $this->successResponse(null, 'تم حذف حساب الطبيب بنجاح');
    }

    /**
     * Get available specializations for filtering
     * GET /api/v1/admin/doctors/specializations
     */
    public function specializations()
    {
        $specializations = Doctor::select('specialization')
            ->distinct()
            ->pluck('specialization')
            ->filter()
            ->map(function ($spec) {
                return [
                    'value' => $spec,
                    'label' => TranslationHelper::specialization($spec),
                ];
            })
            ->values();

        return $this->successResponse([
            'specializations' => $specializations,
        ]);
    }

    /**
     * Transform doctor data
     */
    private function transformDoctor(Doctor $doctor): array
    {
        return [
            'id' => $doctor->id,
            'name' => $doctor->name,
            'email' => $doctor->email,
            'phone' => $doctor->phone,
            'specialization' => $doctor->specialization,
            'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
            'license_number' => $doctor->license_number,
            'verification_status' => $doctor->verification_status,
            'is_active' => $doctor->is_active,
            'is_available' => $doctor->is_available,
            'rating' => $doctor->rating,
            'total_consultations' => $doctor->total_consultations,
            'total_reviews' => $doctor->reviews_count ?? 0,
            'consultation_price' => $doctor->consultation_price,
            'joined_at' => $doctor->created_at->format('Y-m-d'),
            'verified_at' => $doctor->verified_at?->format('Y-m-d'),
            'documents_submitted' => !empty($doctor->license_document)
                && !empty($doctor->id_document),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
        ];
    }

}