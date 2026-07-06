<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use App\Services\CacheService;
use App\Services\GoogleMeetService;
use App\Services\NotificationService;
use App\Services\PaymobService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ConsultationController extends Controller
{
    use ApiResponse;

    protected NotificationService $notificationService;
    protected PaymobService $paymobService;
    protected GoogleMeetService $googleMeetService;

    public function __construct(
        NotificationService $notificationService,
        PaymobService $paymobService,
        GoogleMeetService $googleMeetService
    ) {
        $this->notificationService = $notificationService;
        $this->paymobService = $paymobService;
        $this->googleMeetService = $googleMeetService;
    }

    /**
     * Get all consultations with filters
     * GET /api/v1/admin/consultations
     */
    public function index(Request $request)
    {
        $query = Consultation::with(['doctor', 'patient', 'payment', 'review']);

        // Status filter
        if ($request->filled('status')) {
            if ($request->status === 'cancelled') {
                $query->whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor', 'cancelled_by_admin']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Doctor filter
        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        // Patient filter
        if ($request->filled('patient_id')) {
            $query->where('user_id', $request->patient_id);
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('doctor', function ($dq) use ($search) {
                    $dq->where('name', 'like', "%{$search}%");
                })
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sort by date descending
        $query->orderByDesc('date')->orderByDesc('time');

        $consultations = $query->paginate(15);

        // Get statistics (Cached)
        $stats = Cache::remember('admin.consultations.stats', CacheService::DURATION_SHORT, function () {
            return [
                'total' => Consultation::count(),
                'pending' => Consultation::where('status', 'pending')->count(),
                'confirmed' => Consultation::where('status', 'confirmed')->count(),
                'in_progress' => Consultation::where('status', 'in_progress')->count(),
                'completed' => Consultation::where('status', 'completed')->count(),
                'cancelled' => Consultation::whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor', 'cancelled_by_admin'])->count(),
                'no_show' => Consultation::where('status', 'no_show')->count(),
            ];
        });

        // Transform consultations data
        $transformedConsultations = $consultations->getCollection()->map(function ($consultation) {
            return $this->transformConsultation($consultation);
        });

        return $this->successResponse([
            'consultations' => $transformedConsultations,
            'stats' => $stats,
            'pagination' => [
                'total' => $consultations->total(),
                'per_page' => $consultations->perPage(),
                'current_page' => $consultations->currentPage(),
                'last_page' => $consultations->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific consultation
     * GET /api/v1/admin/consultations/{id}
     */
    public function show($id)
    {
        $consultation = Consultation::with(['doctor', 'patient', 'payment', 'review'])
            ->find($id);

        if (!$consultation) {
            return $this->errorResponse('الاستشارة غير موجودة', 404);
        }

        return $this->successResponse([
            'consultation' => $this->transformConsultationDetails($consultation),
        ]);
    }

    /**
     * Cancel a consultation (admin override)
     * PUT /api/v1/admin/consultations/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        $consultation = Consultation::with(['doctor', 'patient', 'payment'])->find($id);

        if (!$consultation) {
            return $this->errorResponse('الاستشارة غير موجودة', 404);
        }

        // Check if can be cancelled
        if (in_array($consultation->status, ['completed', 'cancelled_by_patient', 'cancelled_by_doctor', 'cancelled_by_admin'])) {
            return $this->errorResponse('لا يمكن إلغاء هذه الاستشارة', 400);
        }

        $request->validate([
            'cancellation_reason' => 'required|string|max:500',
            'refund' => 'nullable|boolean',
        ], [
            'cancellation_reason.required' => 'سبب الإلغاء مطلوب',
        ]);

        $consultation->update([
            'status' => 'cancelled_by_admin',
            'cancellation_reason' => $request->cancellation_reason,
        ]);

        // Handle refund if requested and payment exists
        if ($request->boolean('refund') && $consultation->payment) {
            $consultation->payment->update([
                'status' => 'refunded',
            ]);

            // Process actual refund through payment gateway
            if ($consultation->payment->transaction_id) {
                try {
                    $refunded = $this->paymobService->refund(
                        $consultation->payment->transaction_id,
                        $consultation->payment->amount
                    );
                    if (!$refunded) {
                        Log::warning('Paymob refund failed for consultation: ' . $consultation->id);
                    }
                } catch (\Exception $e) {
                    Log::error('Paymob refund error for consultation ' . $consultation->id . ': ' . $e->getMessage());
                }
            }
        }

        // Cancel meeting (Google Meet) if exists
        if ($consultation->type === 'video' && $consultation->google_meet_id) {
            try {
                $this->googleMeetService->cancelMeeting($consultation);
            } catch (\Exception $e) {
                Log::error('Google Meet cancellation failed for consultation ' . $consultation->id . ': ' . $e->getMessage());
            }
        }

        // Send notifications to doctor and patient
        $this->notificationService->notifyConsultationCancelledByAdmin(
            $consultation,
            $request->cancellation_reason
        );

        return $this->successResponse([
            'consultation' => $this->transformConsultation($consultation->fresh()),
        ], 'تم إلغاء الاستشارة بنجاح');
    }

    /**
     * Get consultation statistics by period
     * GET /api/v1/admin/consultations/stats
     */
    public function statistics(Request $request)
    {
        $period = $request->input('period', 'month');

        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $startDate = $now->copy()->startOfDay();
                break;
            case 'week':
                $startDate = $now->copy()->startOfWeek();
                break;
            case 'year':
                $startDate = $now->copy()->startOfYear();
                break;
            case 'month':
            default:
                $startDate = $now->copy()->startOfMonth();
                break;
        }

        $stats = Consultation::where('created_at', '>=', $startDate)
            ->selectRaw("
                count(*) as total,
                sum(case when status = 'completed' then 1 else 0 end) as completed,
                sum(case when status in ('cancelled_by_patient', 'cancelled_by_doctor', 'cancelled_by_admin') then 1 else 0 end) as cancelled,
                sum(case when status = 'no_show' then 1 else 0 end) as no_show,
                sum(case when type = 'video' then 1 else 0 end) as video_type,
                sum(case when type = 'offline' then 1 else 0 end) as offline_type
            ")->first();

        $totalConsultations = (int) ($stats->total ?? 0);
        $completedConsultations = (int) ($stats->completed ?? 0);
        $cancelledConsultations = (int) ($stats->cancelled ?? 0);
        $noShowConsultations = (int) ($stats->no_show ?? 0);

        // Completion rate
        $completionRate = $totalConsultations > 0
            ? round(($completedConsultations / $totalConsultations) * 100, 1)
            : 0;

        // Cancellation rate
        $cancellationRate = $totalConsultations > 0
            ? round(($cancelledConsultations / $totalConsultations) * 100, 1)
            : 0;

        // By type
        $byType = [
            'video' => (int) ($stats->video_type ?? 0),
            'offline' => (int) ($stats->offline_type ?? 0),
        ];

        // Top doctors
        $topDoctors = Doctor::withCount([
            'consultations' => function ($q) use ($startDate) {
                $q->where('status', 'completed')
                    ->where('created_at', '>=', $startDate);
            }
        ])
            ->orderByDesc('consultations_count')
            ->limit(5)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'consultations' => $doctor->consultations_count,
                ];
            });

        return $this->successResponse([
            'period' => $period,
            'total' => $totalConsultations,
            'completed' => $completedConsultations,
            'cancelled' => $cancelledConsultations,
            'no_show' => $noShowConsultations,
            'completion_rate' => $completionRate,
            'cancellation_rate' => $cancellationRate,
            'by_type' => $byType,
            'top_doctors' => $topDoctors,
        ]);
    }

    /**
     * Transform consultation data
     */
    private function transformConsultation(Consultation $consultation): array
    {
        $rawStatus = $consultation->status;

        // Normalize cancelled statuses to a single 'cancelled' for frontend filtering
        $normalizedStatus = in_array($rawStatus, ['cancelled_by_patient', 'cancelled_by_doctor', 'cancelled_by_admin'])
            ? 'cancelled'
            : $rawStatus;

        $paymentStatus = $consultation->payment?->status ?? 'pending';

        return [
            'id' => $consultation->id,
            'doctor' => [
                'id' => $consultation->doctor?->id,
                'name' => $consultation->doctor?->name ?? 'Unknown',
                'specialization' => $consultation->doctor?->specialization,
            ],
            'patient' => [
                'id' => $consultation->patient?->id,
                'name' => $consultation->patient?->name ?? 'Unknown',
                'email' => $consultation->patient?->email,
                'phone' => $consultation->patient?->phone,
            ],
            'date' => \Carbon\Carbon::parse($consultation->date)->format('Y-m-d'),
            'time' => \Carbon\Carbon::parse($consultation->time)->format('h:i A'),
            'type' => $consultation->type,
            'type_ar' => TranslationHelper::consultationType($consultation->type),
            'status' => $normalizedStatus,
            'status_raw' => $rawStatus,
            'status_ar' => TranslationHelper::consultationStatus($rawStatus, admin: true),
            'price' => number_format($consultation->price, 2, '.', ''),
            'platform_commission' => number_format($consultation->platform_commission ?? 0, 2, '.', ''),
            'payment_status' => $paymentStatus,
            'payment_status_ar' => TranslationHelper::paymentStatus($paymentStatus, admin: true),
            'created_at' => $consultation->created_at->format('Y-m-d H:i'),

            // Additional details returned inline for faster page rendering
            'patient_notes' => $consultation->patient_notes,
            'doctor_notes' => $consultation->doctor_notes,
            'duration_minutes' => $consultation->duration_minutes,
            'started_at' => $consultation->started_at?->format('Y-m-d H:i:s'),
            'ended_at' => $consultation->ended_at?->format('Y-m-d H:i:s'),
            'cancellation_reason' => $consultation->cancellation_reason,
            'meeting_info' => [
                'meeting_id' => $consultation->zoom_meeting_id,
                'join_url' => $consultation->zoom_join_url,
            ],
            'review' => $consultation->review ? [
                'rating' => $consultation->review->rating,
                'comment' => $consultation->review->comment,
                'created_at' => $consultation->review->created_at->format('Y-m-d'),
            ] : null,
            'payment' => $consultation->payment ? [
                'id' => $consultation->payment->id,
                'transaction_id' => $consultation->payment->transaction_id,
                'amount' => $consultation->payment->amount,
                'platform_fee' => $consultation->payment->platform_fee,
                'doctor_amount' => $consultation->payment->doctor_amount,
                'status' => $consultation->payment->status,
                'payment_method' => $consultation->payment->payment_method,
                'paid_at' => $consultation->payment->paid_at?->format('Y-m-d H:i:s'),
            ] : null,
        ];
    }

    /**
     * Transform consultation details
     */
    private function transformConsultationDetails(Consultation $consultation): array
    {
        return $this->transformConsultation($consultation);
    }
}