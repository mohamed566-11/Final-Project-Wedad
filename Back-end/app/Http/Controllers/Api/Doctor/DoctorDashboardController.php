<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Payment;
use App\Services\ConsultationService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DoctorDashboardController extends Controller
{
    use ApiResponse;

    protected $consultationService;

    public function __construct(ConsultationService $consultationService)
    {
        $this->consultationService = $consultationService;
    }

    /**
     * Get dashboard main stats
     * GET /api/v1/doctor/dashboard/stats
     */
    public function stats(Request $request)
    {
        try {
            $doctor = $request->user();

            // 1. Consultation basic stats
            $consultationStats = $this->consultationService->getDoctorStats($doctor);
            
            // 2. Earnings Calculation (Optimized using DB query)
            $earningsQuery = DB::table('payments')
                ->join('consultations', 'payments.consultation_id', '=', 'consultations.id')
                ->where('consultations.doctor_id', $doctor->id)
                ->where('payments.status', 'completed');
            
            $totalEarnings = (clone $earningsQuery)->sum('doctor_amount');
            $thisMonthEarnings = (clone $earningsQuery)->whereMonth('payments.paid_at', Carbon::now()->month)->sum('doctor_amount');
            $thisWeekEarnings = (clone $earningsQuery)->whereBetween('payments.paid_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->sum('doctor_amount');
            
            $pendingPayout = 0; 

            // 3. Patients Stats (Optimized)
            $totalPatients = $doctor->patients()->count();
            // Optimized query for new patients using DB table directly to avoid Pivot object overhead if huge
            // Using try-catch specific for this query in case table missing
            try {
                $newPatientsThisMonth = DB::table('doctor_patients')
                    ->where('doctor_id', $doctor->id)
                    ->where('created_at', '>=', Carbon::now()->startOfMonth())
                    ->count();
                
                $returningPatients = DB::table('doctor_patients')
                    ->where('doctor_id', $doctor->id)
                    ->where('total_appointments', '>', 1)
                    ->count();
            } catch (\Exception $e) {
                // Fallback if table doesn't exist or other error
                $newPatientsThisMonth = 0;
                $returningPatients = 0;
            }

            $returningRate = $totalPatients > 0 ? round(($returningPatients / $totalPatients) * 100, 1) : 0;

            // 4. Articles Stats (Optimized single query)
            // Handle if Articles table doesn't have deleted_at or views_count
            try {
                $articleStats = DB::table('articles')
                    ->where('doctor_id', $doctor->id)
                    ->whereNull('deleted_at') 
                    ->selectRaw('count(*) as total, count(case when status="published" then 1 end) as approved, count(case when status="pending" then 1 end) as pending, count(case when status="draft" then 1 end) as draft, sum(views_count) as views')
                    ->first();
            } catch (\Exception $e) {
                // Fallback
                $articleStats = (object)['total'=>0, 'approved'=>0, 'pending'=>0, 'draft'=>0, 'views'=>0];
            }

            // 5. Schedule (Next Consultation)
            $nextConsultation = Consultation::where('doctor_id', $doctor->id)
                ->whereDate('date', '>=', Carbon::today())
                ->whereIn('status', ['confirmed', 'paid'])
                ->orderBy('date')
                ->orderBy('time')
                ->with(['patient:id,name,image']) // CORRECTED COLUMN NAME
                ->first();
            
            $nextConsultationData = null;
            if ($nextConsultation) {
                // Recalculate if it's strictly in future (including time)
                $consultationDateTime = Carbon::parse($nextConsultation->date->format('Y-m-d') . ' ' . $nextConsultation->time);
                if ($consultationDateTime->isFuture() || $consultationDateTime->isToday()) {
                     $nextConsultationData = [
                        'id' => $nextConsultation->id,
                        'patient' => [
                            'name' => $nextConsultation->patient->name,
                            'image_url' => $nextConsultation->patient->image ? url('storage/' . $nextConsultation->patient->image) : null,
                        ],
                        'date' => $nextConsultation->date instanceof Carbon ? $nextConsultation->date->format('Y-m-d') : $nextConsultation->date,
                        'time' => Carbon::parse($nextConsultation->time)->format('H:i'),
                        'type' => $nextConsultation->type,
                        'in_minutes' => Carbon::now()->diffInMinutes($consultationDateTime, false)
                    ];
                }
            }

            // 6. Today's Schedule
            $todaySchedule = Consultation::where('doctor_id', $doctor->id)
                ->whereDate('date', Carbon::today())
                ->whereIn('status', ['confirmed', 'pending', 'in_progress', 'completed'])
                ->with(['patient:id,name'])
                ->orderBy('time')
                ->get()
                ->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'time' => Carbon::parse($c->time)->format('H:i'),
                        'patient' => $c->patient->name,
                        'type' => $c->type,
                        'status' => $c->status
                    ];
                });

            // 7. Ratings Distribution
            $reviewsQuery = DB::table('consultation_reviews')
                ->join('consultations', 'consultation_reviews.consultation_id', '=', 'consultations.id')
                ->where('consultations.doctor_id', $doctor->id);
            
            $ratings = (clone $reviewsQuery)
                ->select('rating', DB::raw('count(*) as count'))
                ->groupBy('rating')
                ->pluck('count', 'rating')
                ->toArray();

            // Fill missing stars
            $distribution = [
                '5_star' => $ratings[5] ?? 0,
                '4_star' => $ratings[4] ?? 0,
                '3_star' => $ratings[3] ?? 0,
                '2_star' => $ratings[2] ?? 0,
                '1_star' => $ratings[1] ?? 0,
            ];
            
            $recentReviewCount = (clone $reviewsQuery)->where('consultation_reviews.created_at', '>=', Carbon::now()->subMonth())->count();

            $data = [
                'overview' => [
                    'total_consultations' => $consultationStats['total_completed'],
                    'this_month' => $consultationStats['this_month'],
                    'this_week' => $consultationStats['this_week'],
                    'today' => $consultationStats['today'],
                    'upcoming' => $consultationStats['confirmed'],
                ],
                'earnings' => [
                    'total' => $totalEarnings,
                    'this_month' => $thisMonthEarnings,
                    'this_week' => $thisWeekEarnings,
                    'pending_payout' => $pendingPayout,
                    'next_payout_date' => Carbon::now()->addDays(15)->format('Y-m-d'), // Warning: placeholder
                ],
                'rating' => [
                    'average' => $doctor->rating,
                    'total_reviews' => array_sum($distribution),
                    'recent_reviews' => $recentReviewCount,
                    'distribution' => $distribution
                ],
                'patients' => [
                    'total' => $totalPatients,
                    'new_this_month' => $newPatientsThisMonth,
                    'active' => $returningPatients, 
                    'returning_rate' => $returningRate
                ],
                'articles' => [
                    'total' => $articleStats->total ?? 0,
                    'approved' => $articleStats->approved ?? 0,
                    'pending_review' => $articleStats->pending ?? 0,
                    'draft' => $articleStats->draft ?? 0,
                    'total_views' => $articleStats->views ?? 0
                ],
                'schedule' => [
                    'next_consultation' => $nextConsultationData,
                    'today_schedule' => $todaySchedule
                ]
            ];
            
            // Notifications (uncached for real-time accuracy)
            $notifications = [
                'unread' => $doctor->unreadNotifications()->count(),
                'new_consultations' => $doctor->unreadNotifications()->where('type', 'App\Notifications\NewConsultation')->count(),
                'new_reviews' => $doctor->unreadNotifications()->where('type', 'App\Notifications\NewReview')->count(),
            ];
            
            $data['notifications'] = $notifications;

            return $this->successResponse($data, 'تم جلب الإحصائيات بنجاح');

        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage(), ['line' => $e->getLine()]);
            return $this->errorResponse('حدث خطأ في النظام، يرجى المحاولة لاحقاً', 500);
        }
    }

    /**
     * Get chart data
     * GET /api/v1/doctor/dashboard/chart-data
     */
    public function chartData(Request $request)
    {
        $doctor = $request->user();
        $period = $request->input('period', 'month'); // week, month, quarter, year

        // Cache chart data
        $data = Cache::remember("doctor.chart.{$period}.{$doctor->id}", 60, function () use ($doctor, $period) {
            
            // Consultations Trend
            $consultationsTrend = $this->getConsultationsTrend($doctor, $period);
            
            // Earnings Trend
            $earningsTrend = $this->getEarningsTrend($doctor, $period);
            
            // Consultations by Type
            $byType = [
                'video' => Consultation::where('doctor_id', $doctor->id)->where('type', 'video')->count(),
                'offline' => Consultation::where('doctor_id', $doctor->id)->where('type', 'offline')->count(),
            ];

            return [
                'consultations_trend' => $consultationsTrend,
                'earnings_trend' => $earningsTrend,
                'consultations_by_type' => $byType,
            ];
        });

        return $this->successResponse($data, 'تم جلب بيانات الرسم البياني بنجاح');
    }

    private function getConsultationsTrend($doctor, $period)
    {
        $labels = [];
        $data = [];

        if ($period === 'year') {
            for ($i = 1; $i <= 12; $i++) {
                $date = Carbon::create(null, $i, 1);
                $labels[] = $date->format('M'); // Jan, Feb
                $count = Consultation::where('doctor_id', $doctor->id)
                    ->whereYear('date', Carbon::now()->year)
                    ->whereMonth('date', $i)
                    ->count();
                $data[] = $count;
            }
        } elseif ($period === 'month') {
            $daysInMonth = Carbon::now()->daysInMonth;
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $date = Carbon::create(null, null, $i);
                $labels[] = $date->format('d');
                $count = Consultation::where('doctor_id', $doctor->id)
                    ->whereDate('date', $date)
                    ->count();
                $data[] = $count;
            }
        } else {
            // Default to last 7 days
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $labels[] = $date->format('D');
                $count = Consultation::where('doctor_id', $doctor->id)
                    ->whereDate('date', $date)
                    ->count();
                $data[] = $count;
            }
        }

        return ['labels' => $labels, 'data' => $data];
    }

    private function getEarningsTrend($doctor, $period)
    {
        $labels = [];
        $data = [];

        if ($period === 'year') {
            for ($i = 1; $i <= 12; $i++) {
                $date = Carbon::create(null, $i, 1);
                $labels[] = $date->format('M');
                $amount = Payment::join('consultations', 'payments.consultation_id', '=', 'consultations.id')
                    ->where('consultations.doctor_id', $doctor->id)
                    ->whereYear('payments.paid_at', Carbon::now()->year)
                    ->whereMonth('payments.paid_at', $i)
                    ->where('payments.status', 'completed')
                    ->sum('payments.doctor_amount');
                $data[] = (float) $amount; // Ensure float
            }
        } elseif ($period === 'month') {
             $daysInMonth = Carbon::now()->daysInMonth;
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $date = Carbon::create(null, null, $i);
                $labels[] = $date->format('d');
                $amount = Payment::join('consultations', 'payments.consultation_id', '=', 'consultations.id')
                    ->where('consultations.doctor_id', $doctor->id)
                    ->whereDate('payments.paid_at', $date)
                    ->where('payments.status', 'completed')
                    ->sum('payments.doctor_amount');
                $data[] = (float) $amount;
            }
        } else {
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $labels[] = $date->format('D');
                $amount = Payment::join('consultations', 'payments.consultation_id', '=', 'consultations.id')
                    ->where('consultations.doctor_id', $doctor->id)
                    ->whereDate('payments.paid_at', $date)
                    ->where('payments.status', 'completed')
                    ->sum('payments.doctor_amount');
                $data[] = (float) $amount;
            }
        }

        return ['labels' => $labels, 'data' => $data];
    }
}
