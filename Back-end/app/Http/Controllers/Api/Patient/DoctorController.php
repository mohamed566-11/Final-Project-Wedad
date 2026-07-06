<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\Consultation\SearchDoctorsRequest;
use App\Http\Resources\Patient\DoctorResource;
use App\Http\Resources\Patient\DoctorDetailResource;
use App\Http\Resources\Patient\ReviewResource;
use App\Models\Doctor;
use App\Models\ConsultationReview;
use App\Services\ConsultationService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    use ApiResponse;

    protected $consultationService;

    public function __construct(ConsultationService $consultationService)
    {
        $this->consultationService = $consultationService;
    }

    /**
     * Search doctors with filters
     * GET /api/v1/patient/doctors/search
     */
    public function search(SearchDoctorsRequest $request)
    {
        $query = Doctor::query()
            ->where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->with('lifeStages');

        // Apply filters
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('specialization', 'like', "%{$searchTerm}%")
                    ->orWhere('bio', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->filled('specialization')) {
            $query->where('specialization', $request->specialization);
        }

        if ($request->filled('life_stage_id')) {
            $query->whereHas('lifeStages', function ($q) use ($request) {
                $q->where('life_stages.id', $request->life_stage_id);
            });
        }

        if ($request->filled('min_price')) {
            $query->where('consultation_price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('consultation_price', '<=', $request->max_price);
        }

        if ($request->filled('min_rating')) {
            $query->where('rating', '>=', $request->min_rating);
        }

        if ($request->filled('languages')) {
            $languages = is_array($request->languages) ? $request->languages : [$request->languages];
            foreach ($languages as $lang) {
                $query->whereJsonContains('languages', $lang);
            }
        }

        if ($request->filled('session_type')) {
            if ($request->session_type !== 'both') {
                $query->where(function ($q) use ($request) {
                    $q->where('session_type', $request->session_type)
                        ->orWhere('session_type', 'both');
                });
            }
        }

        if ($request->filled('availability')) {
            $this->applyAvailabilityFilter($query, $request->availability);
        }

        // Apply sorting
        $sortBy = $request->input('sort_by', 'rating');
        switch ($sortBy) {
            case 'price_low':
                $query->orderBy('consultation_price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('consultation_price', 'desc');
                break;
            case 'experience':
                $query->orderByDesc('years_of_experience');
                break;
            case 'consultations':
                $query->orderByDesc('total_consultations');
                break;
            case 'rating':
            default:
                $query->orderByDesc('rating')->orderByDesc('total_consultations');
                break;
        }

        $perPage = $request->input('per_page', 10);
        $doctors = $query->paginate($perPage);

        return $this->successResponse(
            DoctorResource::collection($doctors),
            'تم جلب الأطباء بنجاح'
        );
    }

    /**
     * Get doctor details
     * GET /api/v1/patient/doctors/{id}
     */
    public function show($id)
    {
        $doctor = Doctor::with(['lifeStages', 'workingHours'])
            ->where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->findOrFail($id);

        return $this->successResponse(
            new DoctorDetailResource($doctor),
            'تم جلب تفاصيل الطبيب بنجاح'
        );
    }

    /**
     * Get available slots for a doctor
     * GET /api/v1/patient/doctors/{id}/available-slots
     */
    public function availableSlots(Request $request, $id)
    {
        $doctor = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->findOrFail($id);

        $date = $request->input('date', Carbon::today()->format('Y-m-d'));
        $duration = $request->input('duration', 30);

        // Validate date
        if (Carbon::parse($date)->isPast() && !Carbon::parse($date)->isToday()) {
            return $this->errorResponse('التاريخ غير صالح', 400);
        }

        $slots = $this->consultationService->getAvailableSlots($doctor, $date, $duration);

        return $this->successResponse($slots, 'تم جلب الأوقات المتاحة بنجاح');
    }

    /**
     * Get doctor reviews
     * GET /api/v1/patient/doctors/{id}/reviews
     */
    public function reviews(Request $request, $id)
    {
        $doctor = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->findOrFail($id);

        $query = ConsultationReview::where('doctor_id', $id)
            ->where('is_published', true)
            ->with(['patient', 'consultation']);

        if ($request->filled('rating')) {
            $query->where('rating', $request->rating);
        }

        $query->orderByDesc('created_at');

        $perPage = $request->input('per_page', 10);
        $reviews = $query->paginate($perPage);

        // Get summary
        $allReviews = ConsultationReview::where('doctor_id', $id)
            ->where('is_published', true)
            ->get();

        $summary = [
            'average_rating' => round($allReviews->avg('rating'), 1) ?: 0,
            'total_reviews' => $allReviews->count(),
            '5_star' => $allReviews->where('rating', 5)->count(),
            '4_star' => $allReviews->where('rating', 4)->count(),
            '3_star' => $allReviews->where('rating', 3)->count(),
            '2_star' => $allReviews->where('rating', 2)->count(),
            '1_star' => $allReviews->where('rating', 1)->count(),
        ];

        return $this->successResponse([
            'reviews' => ReviewResource::collection($reviews),
            'summary' => $summary,
        ], 'تم جلب التقييمات بنجاح');
    }

    /**
     * Get recommended doctors for authenticated patient
     * GET /api/v1/patient/doctors/recommended
     */
    public function recommended(Request $request)
    {
        $patient = $request->user();
        $doctors = $this->consultationService->getRecommendedDoctors($patient);

        return $this->successResponse(
            DoctorResource::collection($doctors),
            'تم جلب الأطباء المقترحين بنجاح'
        );
    }

    /**
     * Apply availability filter to query
     */
    protected function applyAvailabilityFilter($query, string $availability)
    {
        $today = Carbon::today();
        $dayOfWeek = strtolower($today->format('l'));

        switch ($availability) {
            case 'today':
                // Doctor has any working slot for today
                $query->whereHas('workingHours', function ($q) use ($dayOfWeek) {
                    $q->where('day', $dayOfWeek);
                });
                break;
            case 'this_week':
                $daysOfWeek = [];
                for ($i = 0; $i < 7; $i++) {
                    $daysOfWeek[] = strtolower($today->copy()->addDays($i)->format('l'));
                }
                $query->whereHas('workingHours', function ($q) use ($daysOfWeek) {
                    $q->whereIn('day', $daysOfWeek);
                });
                break;
            case 'this_month':
                // Doctor has working hours at all
                $query->whereHas('workingHours');
                break;
        }
    }
}
