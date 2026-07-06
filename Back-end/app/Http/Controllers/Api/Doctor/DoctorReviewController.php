<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\ReviewResource;
use App\Models\ConsultationReview;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DoctorReviewController extends Controller
{
    use ApiResponse;

    /**
     * Get the authenticated doctor's reviews with stats and pagination.
     * GET /api/v1/doctor/reviews
     */
    public function index(Request $request)
    {
        $doctor = $request->user();

        // ============================================================
        // Build query with optional filters
        // ============================================================
        $query = ConsultationReview::where('doctor_id', $doctor->id)
            ->with(['patient', 'consultation']);

        // Filter by star rating  e.g. ?rating=5
        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->input('rating'));
        }

        // Sorting
        $sort = $request->input('sort', 'newest');
        switch ($sort) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'highest':
                $query->orderByDesc('rating')->orderByDesc('created_at');
                break;
            case 'lowest':
                $query->orderBy('rating', 'asc')->orderByDesc('created_at');
                break;
            case 'newest':
            default:
                $query->orderByDesc('created_at');
                break;
        }

        $perPage = (int) $request->input('per_page', 15);
        $reviews = $query->paginate($perPage);

        // ============================================================
        // Build stats from ALL published reviews (not paginated slice)
        // ============================================================
        $allReviews = ConsultationReview::where('doctor_id', $doctor->id)
            ->get();

        $totalReviews = $allReviews->count();
        $averageRating = $totalReviews ? round($allReviews->avg('rating'), 1) : 0;

        $breakdown = [
            '5' => $allReviews->where('rating', 5)->count(),
            '4' => $allReviews->where('rating', 4)->count(),
            '3' => $allReviews->where('rating', 3)->count(),
            '2' => $allReviews->where('rating', 2)->count(),
            '1' => $allReviews->where('rating', 1)->count(),
        ];

        return $this->successResponse([
            'reviews' => ReviewResource::collection($reviews),
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
            'stats' => [
                'average_rating' => $averageRating,
                'total_reviews' => $totalReviews,
                'rating_breakdown' => $breakdown,
            ],
        ], 'تم جلب التقييمات بنجاح');
    }   // end index()

    /**
     * Toggle is_published for a review (show / hide from public).
     * PATCH /api/v1/doctor/reviews/{id}/toggle
     */
    public function toggle(Request $request, int $id)
    {
        $doctor = $request->user();

        $review = ConsultationReview::where('id', $id)
            ->where('doctor_id', $doctor->id)
            ->first();

        if (!$review) {
            return $this->errorResponse('التقييم غير موجود أو لا يخصك', 404);
        }

        $review->is_published = !$review->is_published;
        $review->save();

        $msg = $review->is_published ? 'تم إظهار التقييم بنجاح' : 'تم إخفاء التقييم بنجاح';

        return $this->successResponse([
            'id' => $review->id,
            'is_published' => $review->is_published,
        ], $msg);
    }

    /**
     * Delete a review that belongs to this doctor.
     * DELETE /api/v1/doctor/reviews/{id}
     */
    public function destroy(Request $request, int $id)
    {
        $doctor = $request->user();

        $review = ConsultationReview::where('id', $id)
            ->where('doctor_id', $doctor->id)
            ->first();

        if (!$review) {
            return $this->errorResponse('التقييم غير موجود أو لا يخصك', 404);
        }

        $review->delete();

        return $this->successResponse(null, 'تم حذف التقييم بنجاح');
    }
}
