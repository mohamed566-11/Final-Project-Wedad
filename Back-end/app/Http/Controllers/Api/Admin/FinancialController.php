<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use App\Services\CacheService;
use App\Services\NotificationService;
use App\Services\PaymobService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FinancialController extends Controller
{
    use ApiResponse;

    protected NotificationService $notificationService;
    protected PaymobService $paymobService;

    public function __construct(NotificationService $notificationService, PaymobService $paymobService)
    {
        $this->notificationService = $notificationService;
        $this->paymobService = $paymobService;
    }

    /**
     * Get financial overview
     * GET /api/v1/admin/financials/overview
     */
    public function overview(Request $request)
    {
        $period = $request->input('period', 'month');
        $cacheKey = "admin.financial.overview.v2.{$period}";

        // Cache for short duration (5 mins) as defined in CacheService
        $data = Cache::remember($cacheKey, CacheService::DURATION_SHORT, function () use ($period) {
            $now = Carbon::now();

            switch ($period) {
                case 'today':
                    $startDate = $now->copy()->startOfDay();
                    $prevStart = $now->copy()->subDay()->startOfDay();
                    $prevEnd = $now->copy()->subDay()->endOfDay();
                    break;
                case 'week':
                    $startDate = $now->copy()->startOfWeek();
                    $prevStart = $now->copy()->subWeek()->startOfWeek();
                    $prevEnd = $now->copy()->subWeek()->endOfWeek();
                    break;
                case 'year':
                    $startDate = $now->copy()->startOfYear();
                    $prevStart = $now->copy()->subYear()->startOfYear();
                    $prevEnd = $now->copy()->subYear()->endOfYear();
                    break;
                case 'month':
                default:
                    $startDate = $now->copy()->startOfMonth();
                    $prevStart = $now->copy()->subMonth()->startOfMonth();
                    $prevEnd = $now->copy()->subMonth()->endOfMonth();
                    break;
            }

            // Current period revenue & totals (single query)
            $thisPeriodStats = Payment::where('status', 'completed')
                ->where('paid_at', '>=', $startDate)
                ->selectRaw("
                    COALESCE(SUM(amount), 0) as revenue,
                    COALESCE(SUM(platform_fee), 0) as platform_earnings,
                    COALESCE(SUM(doctor_amount), 0) as doctors_earnings
                ")->first();

            $revenueThisPeriod = (float) $thisPeriodStats->revenue;
            $platformEarningsThisPeriod = (float) $thisPeriodStats->platform_earnings;
            $doctorsEarningsThisPeriod = (float) $thisPeriodStats->doctors_earnings;

            // Previous period for growth calculation
            $revenuePrevPeriod = (float) Payment::where('status', 'completed')
                ->whereBetween('paid_at', [$prevStart, $prevEnd])
                ->sum('amount');

            $monthlyGrowth = $revenuePrevPeriod > 0
                ? round((($revenueThisPeriod - $revenuePrevPeriod) / $revenuePrevPeriod) * 100, 1)
                : 0;

            // Global Transaction stats and Revenue (single query)
            $globalStats = Payment::selectRaw("
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
                SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_transactions,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN platform_fee ELSE 0 END), 0) as total_platform_earnings,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN doctor_amount ELSE 0 END), 0) as total_doctors_earnings,
                COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as total_refunds
            ")->first();

            $totalRevenue = (float) $globalStats->total_revenue;
            $totalPlatformEarnings = (float) $globalStats->total_platform_earnings;
            $totalDoctorsEarnings = (float) $globalStats->total_doctors_earnings;

            $totalTransactions = (int) $globalStats->total_transactions;
            $successfulTransactions = (int) $globalStats->successful_transactions;
            $pendingTransactions = (int) $globalStats->pending_transactions;
            $refundedTransactions = (int) $globalStats->refunded_transactions;

            // Average consultation price
            $averagePrice = $successfulTransactions > 0 ? $totalRevenue / $successfulTransactions : 0;

            // Today's revenue
            $revenueToday = (float) Payment::where('status', 'completed')
                ->whereDate('paid_at', $now->toDateString())
                ->sum('amount');

            // This week's revenue
            $revenueThisWeek = (float) Payment::where('status', 'completed')
                ->where('paid_at', '>=', $now->copy()->startOfWeek())
                ->sum('amount');

            // Consultations count
            $consultationsThisPeriod = Consultation::where('created_at', '>=', $startDate)->count();

            // Payment methods breakdown
            $paymentMethods = Payment::where('status', 'completed')
                ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
                ->groupBy('payment_method')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->payment_method => [
                            'count' => $item->count,
                            'total' => round($item->total, 2),
                        ]
                    ];
                });

            // Pending payouts (doctors with earnings not yet paid out)
            // For now, assuming all doctor earnings are pending until payouts system is implemented
            $pendingPayouts = $totalDoctorsEarnings;

            return [
                'period' => $period,
                'total_revenue' => round($totalRevenue, 2),
                'revenue_this_month' => round($revenueThisPeriod, 2),
                'growth_rate' => $monthlyGrowth,
                'platform_earnings' => round($totalPlatformEarnings, 2),
                'doctors_earnings' => round($totalDoctorsEarnings, 2),
                'pending_payouts' => round($pendingPayouts, 2),

                'total_transactions' => $totalTransactions,
                'successful_transactions' => $successfulTransactions,
                'pending_transactions' => $pendingTransactions,
                'refunded_transactions' => $refundedTransactions,
            ];
        });

        return $this->successResponse($data);
    }

    /**
     * Get all transactions
     * GET /api/v1/admin/financials/transactions
     */
    public function transactions(Request $request)
    {
        $query = Payment::with(['patient', 'consultation.doctor']);

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Payment method filter
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('paid_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('paid_at', '<=', $request->date_to);
        }

        // Search by transaction ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sort by date descending
        $query->orderByDesc('created_at');

        $transactions = $query->paginate(20);

        // Transform transactions data
        $transformedTransactions = $transactions->getCollection()->map(function ($transaction) {
            return $this->transformTransaction($transaction);
        });

        return $this->successResponse([
            'transactions' => $transformedTransactions,
            'pagination' => [
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific transaction
     * GET /api/v1/admin/financials/transactions/{id}
     */
    public function showTransaction($id)
    {
        $transaction = Payment::with(['patient', 'consultation.doctor'])->find($id);

        if (!$transaction) {
            return $this->errorResponse('المعاملة غير موجودة', 404);
        }

        return $this->successResponse([
            'transaction' => $this->transformTransactionDetails($transaction),
        ]);
    }

    /**
     * Process refund
     * POST /api/v1/admin/financials/transactions/{id}/refund
     */
    public function refund(Request $request, $id)
    {
        $transaction = Payment::with(['consultation'])->find($id);

        if (!$transaction) {
            return $this->errorResponse('المعاملة غير موجودة', 404);
        }

        if ($transaction->status !== 'completed') {
            return $this->errorResponse('لا يمكن استرداد هذه المعاملة', 400);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ], [
            'reason.required' => 'سبب الاسترداد مطلوب',
        ]);

        $transaction->update([
            'status' => 'refunded',
            'failure_reason' => 'Refund: ' . $request->reason,
        ]);

        // Process actual refund through payment gateway (Paymob)
        if ($transaction->transaction_id) {
            try {
                $refunded = $this->paymobService->refund(
                    $transaction->transaction_id,
                    $transaction->amount
                );
                if (!$refunded) {
                    Log::warning('Paymob refund failed for transaction: ' . $transaction->id);
                }
            } catch (\Exception $e) {
                Log::error('Paymob refund error for transaction ' . $transaction->id . ': ' . $e->getMessage());
            }
        }

        return $this->successResponse([
            'transaction' => $this->transformTransaction($transaction),
        ], 'تم استرداد المعاملة بنجاح');
    }

    /**
     * Get doctors payouts
     * GET /api/v1/admin/financials/doctors-payouts
     */
    public function doctorsPayouts(Request $request)
    {
        $query = Doctor::where('verification_status', 'verified');

        // Doctor filter
        if ($request->filled('doctor_id')) {
            $query->where('id', $request->doctor_id);
        }

        $doctors = $query->get();

        $payouts = $doctors->map(function ($doctor) {
            $totalEarnings = Payment::where('status', 'completed')
                ->whereHas('consultation', function ($q) use ($doctor) {
                    $q->where('doctor_id', $doctor->id);
                })
                ->sum('doctor_amount');

            $thisMonthEarnings = Payment::where('status', 'completed')
                ->where('paid_at', '>=', Carbon::now()->startOfMonth())
                ->whereHas('consultation', function ($q) use ($doctor) {
                    $q->where('doctor_id', $doctor->id);
                })
                ->sum('doctor_amount');

            $totalConsultations = Consultation::where('doctor_id', $doctor->id)
                ->where('status', 'completed')
                ->count();

            // Pending amount (simplified - in production, track actual payouts)
            $pendingAmount = $thisMonthEarnings; // Placeholder

            return [
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->name,
                'doctor_email' => $doctor->email,
                'total_earnings' => round($totalEarnings, 2),
                'paid_amount' => 0, // Placeholder as we assumed all earnings are pending
                'pending_amount' => round($pendingAmount, 2),
                'completed_consultations' => $totalConsultations,
            ];
        });

        // Calculate summary
        $totalPending = $payouts->sum('pending_amount');
        $totalPaidThisMonth = 0; // Would come from payouts table

        return $this->successResponse([
            'payouts' => $payouts,
            'summary' => [
                'total_pending' => round($totalPending, 2),
                'total_paid_this_month' => round($totalPaidThisMonth, 2),
                'total_doctors' => $doctors->count(),
            ],
        ]);
    }

    /**
     * Process payout to doctor
     * POST /api/v1/admin/financials/process-payout
     */
    public function processPayout(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
            'amount' => 'required|numeric|min:1',
            'payout_method' => 'required|in:bank_transfer,wallet,cash',
            'notes' => 'nullable|string|max:500',
        ], [
            'doctor_id.required' => 'الطبيب مطلوب',
            'doctor_id.exists' => 'الطبيب غير موجود',
            'amount.required' => 'المبلغ مطلوب',
            'amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'payout_method.required' => 'طريقة الدفع مطلوبة',
        ]);

        $doctor = Doctor::find($request->doctor_id);

        // Record payout in doctor_payouts table
        $payout = DB::table('doctor_payouts')->insertGetId([
            'doctor_id' => $doctor->id,
            'admin_id' => $request->user()->id,
            'amount' => $request->amount,
            'payout_method' => $request->payout_method,
            'status' => 'processing',
            'notes' => $request->notes,
            'processed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send notification to doctor
        $this->notificationService->notifyPayoutProcessed(
            $doctor,
            $request->amount,
            $request->payout_method
        );

        return $this->successResponse([
            'payout' => [
                'doctor_id' => $doctor->id,
                'amount' => $request->amount,
                'payout_method' => $request->payout_method,
                'status' => 'processing',
                'processed_at' => now()->format('Y-m-d H:i:s'),
            ],
        ], 'تم معالجة الدفعة بنجاح');
    }

    /**
     * Get financial reports
     * GET /api/v1/admin/financials/reports
     */
    public function reports(Request $request)
    {
        $type = $request->input('type', 'monthly');
        $now = Carbon::now();

        switch ($type) {
            case 'daily':
                $startDate = $now->copy()->subDays(30);
                $groupFormat = 'Y-m-d';
                break;
            case 'weekly':
                $startDate = $now->copy()->subWeeks(12);
                $groupFormat = 'Y-W';
                break;
            case 'yearly':
                $startDate = $now->copy()->subYears(3);
                $groupFormat = 'Y';
                break;
            case 'monthly':
            default:
                $startDate = $now->copy()->subMonths(12);
                $groupFormat = 'Y-m';
                break;
        }

        // Override with custom date range if provided
        if ($request->filled('date_from')) {
            $startDate = Carbon::parse($request->date_from);
        }
        $endDate = $request->filled('date_to') ? Carbon::parse($request->date_to) : $now;

        // Get revenue data grouped by period
        $revenueData = Payment::where('status', 'completed')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '%Y-%m') as period"),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('SUM(platform_fee) as platform_earnings'),
                DB::raw('SUM(doctor_amount) as doctors_earnings'),
                DB::raw('COUNT(*) as consultations')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Get refunds data
        $refundsData = Payment::where('status', 'refunded')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->sum('amount');

        // Top performing doctors
        $topDoctors = Doctor::withSum([
            'consultations as earnings' => function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                    ->whereBetween('date', [$startDate, $endDate])
                    ->join('payments', 'consultations.id', '=', 'payments.consultation_id');
            }
        ], 'payments.doctor_amount')
            ->orderByDesc('earnings')
            ->limit(10)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'earnings' => round($doctor->earnings ?? 0, 2),
                ];
            });

        return $this->successResponse([
            'report' => [
                'type' => $type,
                'period' => [
                    'from' => $startDate->format('Y-m-d'),
                    'to' => $endDate->format('Y-m-d'),
                ],
                'total_revenue' => round($revenueData->sum('revenue'), 2),
                'total_consultations' => $revenueData->sum('consultations'),
                'platform_earnings' => round($revenueData->sum('platform_earnings'), 2),
                'doctors_earnings' => round($revenueData->sum('doctors_earnings'), 2),
                'refunds' => round($refundsData, 2),
                'breakdown_by_period' => $revenueData,
                'top_doctors' => $topDoctors,
            ],
        ]);
    }

    /**
     * Transform transaction data
     */
    private function transformTransaction(Payment $transaction): array
    {
        return [
            'id' => $transaction->id,
            'transaction_id' => $transaction->transaction_id,
            'consultation_id' => $transaction->consultation_id,
            'patient' => [
                'id' => $transaction->patient->id ?? null,
                'name' => $transaction->patient->name ?? 'Unknown',
            ],
            'doctor' => [
                'id' => $transaction->consultation?->doctor?->id ?? null,
                'name' => $transaction->consultation?->doctor?->name ?? 'Unknown',
            ],
            'amount' => $transaction->amount,
            'platform_fee' => $transaction->platform_fee,
            'doctor_amount' => $transaction->doctor_amount,
            'payment_method' => $transaction->payment_method,
            'payment_method_ar' => $this->getPaymentMethodName($transaction->payment_method),
            'status' => $transaction->status,
            'status_ar' => TranslationHelper::paymentStatus($transaction->status, admin: true),
            'paid_at' => $transaction->paid_at?->format('Y-m-d H:i:s'),
            'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Transform transaction details
     */
    private function transformTransactionDetails(Payment $transaction): array
    {
        $basic = $this->transformTransaction($transaction);

        return array_merge($basic, [
            'paymob_response' => $transaction->paymob_response,
            'failure_reason' => $transaction->failure_reason,
        ]);
    }

    /**
     * Get payment method display name
     */
    private function getPaymentMethodName(?string $method): string
    {
        $names = [
            'paymob_card' => 'بطاقة ائتمان',
            'paymob_wallet' => 'محفظة إلكترونية',
            'paymob_installments' => 'تقسيط',
            'cash' => 'نقدي',
        ];

        return $names[$method ?? ''] ?? ($method ?? 'غير محدد');
    }

}