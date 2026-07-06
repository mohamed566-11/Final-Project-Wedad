<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\Consultation\BookConsultationRequest;
use App\Http\Requests\Patient\Consultation\CancelConsultationRequest;
use App\Http\Requests\Patient\Consultation\RescheduleConsultationRequest;
use App\Http\Requests\Patient\Consultation\ReviewConsultationRequest;
use App\Http\Resources\Patient\ConsultationResource;
use App\Models\Consultation;
use App\Models\ConsultationReview;
use App\Services\ConsultationService;
use App\Services\ZoomService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConsultationController extends Controller
{
    use ApiResponse;

    protected $consultationService;
    protected $zoomService;

    public function __construct(ConsultationService $consultationService, ZoomService $zoomService)
    {
        $this->consultationService = $consultationService;
        $this->zoomService = $zoomService;
    }

    /**
     * Book a new consultation
     * POST /api/v1/patient/consultations/book
     */
    public function book(BookConsultationRequest $request)
    {
        $patient = $request->user();
        $result = $this->consultationService->bookConsultation($request->validated(), $patient);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        $response = [
            'consultation' => new ConsultationResource($result['consultation']),
        ];

        if (isset($result['payment']) && $result['payment']) {
            $response['payment'] = [
                'order_id' => $result['payment']['order_id'] ?? null,
                'payment_url' => $result['payment']['payment_url'] ?? null,
                'redirect_url' => $result['payment']['redirect_url'] ?? null,
                'pending' => $result['payment']['pending'] ?? false,
                'status' => 'pending',
            ];
        }

        return $this->successResponse($response, 'تم حجز الاستشارة بنجاح', 201);
    }

    /**
     * Retry payment for an existing consultation
     * POST /api/v1/patient/consultations/{id}/pay
     */
    public function pay(Request $request, $id, \App\Services\PaymobService $paymobService)
    {
        $patient = $request->user();
        $consultation = Consultation::where('user_id', $patient->id)->findOrFail($id);

        if ($consultation->status !== 'pending') {
            return $this->errorResponse('هذه الاستشارة ليست قيد الانتظار أو تم دفعها مسبقاً', 400);
        }

        $request->validate([
            'payment_method' => 'required|in:paymob_card,paymob_wallet,card,wallet',
            'wallet_number' => 'required_if:payment_method,paymob_wallet,wallet|nullable|string|regex:/^01[0125][0-9]{8}$/',
        ]);

        $paymentMethod = in_array($request->payment_method, ['wallet', 'paymob_wallet']) ? 'wallet' : 'card';

        $paymentData = null;
        if ($paymobService->isConfigured()) {
            if ($paymentMethod === 'wallet' && !empty($request->wallet_number)) {
                $paymentData = $paymobService->initiateWalletPayment($consultation, $request->wallet_number);
            } else {
                $paymentData = $paymobService->initiatePayment($consultation);
            }
        }

        if (!$paymentData) {
            return $this->errorResponse('خدمة الدفع غير متوفرة حالياً، يرجى المحاولة لاحقاً', 503);
        }

        return $this->successResponse([
            'payment' => [
                'order_id' => $paymentData['order_id'] ?? null,
                'payment_url' => $paymentData['payment_url'] ?? null,
                'redirect_url' => $paymentData['redirect_url'] ?? null,
                'pending' => $paymentData['pending'] ?? false,
                'status' => 'pending',
            ]
        ], 'تم إنشاء رابط الدفع بنجاح');
    }

    /**
     * Get patient's consultations
     * GET /api/v1/patient/consultations
     */
    public function index(Request $request)
    {
        $patient = $request->user();
        $query = Consultation::where('user_id', $patient->id)
            ->with(['doctor', 'payment', 'review']);

        // Filter by status (supports comma-separated values like "cancelled_by_patient,cancelled_by_doctor")
        if ($request->filled('status')) {
            $statuses = explode(',', $request->status);
            if (count($statuses) > 1) {
                $query->whereIn('status', $statuses);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Filter upcoming (future confirmed consultations)
        if ($request->boolean('upcoming')) {
            $query->where('date', '>=', Carbon::today())
                ->whereIn('status', ['pending', 'confirmed']);
        }

        // Filter past (completed or past date)
        if ($request->boolean('past')) {
            $query->where(function ($q) {
                $q->where('status', 'completed')
                    ->orWhere('date', '<', Carbon::today());
            });
        }

        $query->orderByDesc('date')->orderByDesc('time');

        $perPage = $request->input('per_page', 10);
        $consultations = $query->paginate($perPage);

        // Optimized stats — each counter EXACTLY matches the corresponding tab filter
        $today = Carbon::today()->format('Y-m-d');
        $rawStats = Consultation::where('user_id', $patient->id)
            ->selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN date >= ? AND status IN ('pending', 'confirmed') THEN 1 END) as upcoming,
                COUNT(CASE WHEN status = 'completed' OR date < ? THEN 1 END) as past,
                COUNT(CASE WHEN status IN ('cancelled_by_patient', 'cancelled_by_doctor') THEN 1 END) as cancelled
            ", [$today, $today])
            ->first();

        $stats = [
            'total' => (int) $rawStats->total,
            'upcoming' => (int) $rawStats->upcoming,
            'completed' => (int) $rawStats->past,      // renamed in query but mapped to 'completed' key for frontend compatibility
            'cancelled' => (int) $rawStats->cancelled,
        ];

        return $this->successResponse([
            'consultations' => ConsultationResource::collection($consultations),
            'stats' => $stats,
        ], 'تم جلب الاستشارات بنجاح');
    }

    /**
     * Get single consultation details
     * GET /api/v1/patient/consultations/{id}
     */
    public function show(Request $request, $id)
    {
        $patient = $request->user();
        $consultation = Consultation::where('user_id', $patient->id)
            ->with(['doctor', 'payment', 'review', 'prescription'])
            ->findOrFail($id);

        return $this->successResponse(
            new ConsultationResource($consultation),
            'تم جلب تفاصيل الاستشارة بنجاح'
        );
    }

    /**
     * Cancel a consultation
     * PUT /api/v1/patient/consultations/{id}/cancel
     */
    public function cancel(CancelConsultationRequest $request, $id)
    {
        $patient = $request->user();
        $consultation = Consultation::where('user_id', $patient->id)
            ->findOrFail($id);

        $result = $this->consultationService->cancelConsultation(
            $consultation,
            $request->cancellation_reason,
            'patient'
        );

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse([
            'consultation' => new ConsultationResource($result['consultation']),
            'refund_status' => $result['refund_status'],
        ], 'تم إلغاء الاستشارة بنجاح');
    }

    /**
     * Reschedule a consultation
     * PUT /api/v1/patient/consultations/{id}/reschedule
     */
    public function reschedule(RescheduleConsultationRequest $request, $id)
    {
        $patient = $request->user();
        $consultation = Consultation::where('user_id', $patient->id)
            ->findOrFail($id);

        $result = $this->consultationService->rescheduleConsultation(
            $consultation,
            $request->new_date,
            $request->new_time,
            $request->reason ?? ''
        );

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        // Send notification to doctor
        if ($consultation->doctor) {
            $consultation->doctor->notify(new \App\Notifications\ConsultationRescheduledNotification(
                $consultation,
                $result['old_date'],
                $result['old_time']
            ));
        }

        return $this->successResponse([
            'consultation' => new ConsultationResource($result['consultation']),
            'old_date' => $result['old_date'],
            'old_time' => $result['old_time'],
        ], 'تم إعادة جدولة الاستشارة بنجاح');
    }

    /**
     * Review a consultation
     * POST /api/v1/patient/consultations/{id}/review
     */
    public function review(ReviewConsultationRequest $request, $id)
    {
        $patient = $request->user();
        $consultation = Consultation::where('user_id', $patient->id)
            ->where('status', 'completed')
            ->findOrFail($id);

        // Check if already reviewed
        if ($consultation->review()->exists()) {
            return $this->errorResponse('تم تقييم هذه الاستشارة مسبقاً', 400);
        }

        DB::beginTransaction();
        try {
            $review = ConsultationReview::create([
                'consultation_id' => $consultation->id,
                'doctor_id' => $consultation->doctor_id,
                'user_id' => $patient->id,   // Fix 1: was 'patient_id' — column name is user_id
                'rating' => $request->rating,
                'comment' => $request->comment,
                'is_anonymous' => $request->boolean('is_anonymous', false),
                'is_published' => true,
            ]);

            // Fix 2: removed manual updateRating() call — model booted() fires it automatically
            // via the 'created' event defined in ConsultationReview::booted()

            DB::commit();

            return $this->successResponse([
                'review' => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'is_anonymous' => $review->is_anonymous,
                    'created_at' => $review->created_at->format('Y-m-d H:i:s'),
                ],
                'doctor_new_rating' => $consultation->doctor->fresh()->rating,
            ], 'تم إرسال التقييم بنجاح', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('حدث خطأ أثناء إرسال التقييم', 500);
        }
    }

    /**
     * Get Zoom signature for joining a meeting
     * GET /api/v1/patient/consultations/{id}/zoom-signature
     */
    public function getZoomSignature(Request $request, $id)
    {
        $patient = $request->user();
        $consultation = Consultation::where('user_id', $patient->id)
            ->whereIn('status', ['confirmed', 'in_progress'])
            ->where('type', 'video')
            ->findOrFail($id);

        if (!$consultation->zoom_meeting_id) {
            return $this->errorResponse('لا يوجد اجتماع لهذه الاستشارة', 400);
        }

        // Check time window
        $consultationDateTime = Carbon::parse($consultation->date . ' ' . $consultation->time);
        $minutesUntil = Carbon::now()->diffInMinutes($consultationDateTime, false);

        if ($minutesUntil > 15 || $minutesUntil < -60) {
            return $this->errorResponse('لا يمكن الانضمام في هذا الوقت', 400);
        }

        $signature = $this->zoomService->generateSignature($consultation->zoom_meeting_id, 0); // 0 = participant

        return $this->successResponse([
            'signature' => $signature,
            'meeting_number' => $consultation->zoom_meeting_id,
            'password' => $consultation->zoom_password,
            'user_name' => $patient->name,
            'sdk_key' => config('services.zoom.sdk_key'),
        ], 'تم جلب بيانات الاجتماع بنجاح');
    }
}
