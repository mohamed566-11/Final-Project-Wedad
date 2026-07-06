<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\Article;
use App\Models\Payment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    use ApiResponse;

    /**
     * Get user analytics
     * GET /api/v1/admin/analytics/users
     */
    public function users(Request $request)
    {
        $period = $request->input('period', 'month');
        $now = Carbon::now();

        [$startDate, $dateFormat, $labels] = $this->getPeriodConfig($period);

        // User growth data
        $patientGrowth = User::where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->orderBy('period')
            ->pluck('count', 'period')
            ->toArray();

        $doctorGrowth = Doctor::where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->orderBy('period')
            ->pluck('count', 'period')
            ->toArray();

        // Active users data
        $activeUsersDaily = User::where('last_login_at', '>=', $now->copy()->subDays(30))
            ->select(
                DB::raw("DATE_FORMAT(last_login_at, '%Y-%m-%d') as date"),
                DB::raw('COUNT(DISTINCT id) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(last_login_at, '%Y-%m-%d')"))
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $dailyAverage = count($activeUsersDaily) > 0
            ? round(array_sum($activeUsersDaily) / count($activeUsersDaily))
            : 0;

        // Find peak day and time
        $peakDay = User::where('last_login_at', '>=', $now->copy()->subDays(30))
            ->select(
                DB::raw("DAYNAME(last_login_at) as day"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DAYNAME(last_login_at)"))
            ->orderByDesc('count')
            ->first();

        $peakHour = User::where('last_login_at', '>=', $now->copy()->subDays(30))
            ->select(
                DB::raw("HOUR(last_login_at) as hour"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("HOUR(last_login_at)"))
            ->orderByDesc('count')
            ->first();

        // Age groups distribution
        $ageGroups = [
            '18-25' => User::whereBetween('age', [18, 25])->count(),
            '26-35' => User::whereBetween('age', [26, 35])->count(),
            '36-45' => User::whereBetween('age', [36, 45])->count(),
            '46+' => User::where('age', '>=', 46)->count(),
        ];

        // Life stages distribution
        $lifeStages = User::join('life_stages', 'users.life_stage_id', '=', 'life_stages.id')
            ->select('life_stages.name', DB::raw('COUNT(*) as count'))
            ->groupBy('life_stages.name')
            ->pluck('count', 'name')
            ->toArray();

        // Calculate percentages for age groups
        $totalUsers = array_sum($ageGroups);
        $ageGroupsPercentages = [];
        foreach ($ageGroups as $group => $count) {
            $ageGroupsPercentages[$group] = $totalUsers > 0
                ? round(($count / $totalUsers) * 100)
                : 0;
        }

        return $this->successResponse([
            'growth' => [
                'new_users' => [
                    'patients' => $patientGrowth,
                    'doctors' => $doctorGrowth,
                ],
                'active_users' => [
                    'daily_average' => $dailyAverage,
                    'peak_day' => $peakDay->day ?? 'N/A',
                    'peak_time' => $peakHour ? sprintf('%02d:00-%02d:00', $peakHour->hour, $peakHour->hour + 1) : 'N/A',
                ],
            ],
            'demographics' => [
                'age_groups' => $ageGroupsPercentages,
                'life_stages' => $lifeStages,
            ],
            'engagement' => [
                'average_session_duration' => '12 minutes', // Placeholder - would need tracking
                'pages_per_session' => 5.2, // Placeholder
                'bounce_rate' => '35%', // Placeholder
                'return_rate' => '68%', // Placeholder
            ],
        ]);
    }

    /**
     * Get consultation analytics
     * GET /api/v1/admin/analytics/consultations
     */
    public function consultations(Request $request)
    {
        $period = $request->input('period', 'month');
        $now = Carbon::now();

        [$startDate, $dateFormat, $labels] = $this->getPeriodConfig($period);

        // Daily trend
        $dailyTrend = Consultation::where('created_at', '>=', $now->copy()->subDays(30))
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as date"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d')"))
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        // Weekly trend
        $weeklyTrend = Consultation::where('created_at', '>=', $now->copy()->subWeeks(12))
            ->select(
                DB::raw("YEARWEEK(created_at) as week"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("YEARWEEK(created_at)"))
            ->orderBy('week')
            ->pluck('count', 'week')
            ->toArray();

        // Monthly trend
        $monthlyTrend = Consultation::where('created_at', '>=', $now->copy()->subMonths(12))
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        // By type
        $byType = [
            'video' => Consultation::where('type', 'video')->count(),
            'offline' => Consultation::where('type', 'offline')->count(),
        ];

        // By specialization
        $bySpecialization = Doctor::join('consultations', 'doctors.id', '=', 'consultations.doctor_id')
            ->select('doctors.specialization', DB::raw('COUNT(consultations.id) as count'))
            ->groupBy('doctors.specialization')
            ->pluck('count', 'specialization')
            ->toArray();

        // Rates
        $total = Consultation::count();
        $completed = Consultation::where('status', 'completed')->count();
        $cancelled = Consultation::whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor'])->count();
        $noShow = Consultation::where('status', 'no_show')->count();

        $completionRate = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
        $cancellationRate = $total > 0 ? round(($cancelled / $total) * 100, 1) : 0;
        $noShowRate = $total > 0 ? round(($noShow / $total) * 100, 1) : 0;

        // Average rating
        $averageRating = DB::table('consultation_reviews')->avg('rating') ?? 0;

        // Peak hours
        $peakHours = Consultation::select(
            DB::raw("HOUR(time) as hour"),
            DB::raw('COUNT(*) as count')
        )
            ->groupBy(DB::raw("HOUR(time)"))
            ->orderByDesc('count')
            ->limit(3)
            ->get()
            ->map(function ($item) {
                return sprintf('%02d:00-%02d:00', $item->hour, $item->hour + 1);
            })
            ->toArray();

        return $this->successResponse([
            'trends' => [
                'daily' => $dailyTrend,
                'weekly' => $weeklyTrend,
                'monthly' => $monthlyTrend,
            ],
            'by_type' => $byType,
            'by_specialization' => $bySpecialization,
            'completion_rate' => $completionRate,
            'cancellation_rate' => $cancellationRate,
            'no_show_rate' => $noShowRate,
            'average_rating' => round($averageRating, 1),
            'peak_hours' => $peakHours,
        ]);
    }

    /**
     * Get financial analytics
     * GET /api/v1/admin/analytics/financials
     */
    public function financials(Request $request)
    {
        $period = $request->input('period', 'month');
        $now = Carbon::now();

        [$startDate, $dateFormat, $labels] = $this->getPeriodConfig($period);

        // Monthly revenue trend
        $revenueTrend = Payment::where('status', 'completed')
            ->where('paid_at', '>=', $now->copy()->subMonths(12))
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '%Y-%m') as month"),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('SUM(platform_fee) as platform_earnings'),
                DB::raw('SUM(doctor_amount) as doctor_earnings')
            )
            ->groupBy(DB::raw("DATE_FORMAT(paid_at, '%Y-%m')"))
            ->orderBy('month')
            ->get();

        // Revenue by payment method
        $byPaymentMethod = Payment::where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method')
            ->toArray();

        // Top earning doctors
        $topDoctors = Doctor::withSum([
            'consultations as earnings' => function ($q) {
                $q->join('payments', 'consultations.id', '=', 'payments.consultation_id')
                    ->where('payments.status', 'completed');
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

        // Average revenue per consultation
        $avgRevenue = Payment::where('status', 'completed')->avg('amount') ?? 0;

        // Growth comparison
        $thisMonth = Payment::where('status', 'completed')
            ->where('paid_at', '>=', $now->copy()->startOfMonth())
            ->sum('amount');

        $lastMonth = Payment::where('status', 'completed')
            ->whereBetween('paid_at', [
                $now->copy()->subMonth()->startOfMonth(),
                $now->copy()->subMonth()->endOfMonth()
            ])
            ->sum('amount');

        $growthPercentage = $lastMonth > 0
            ? round((($thisMonth - $lastMonth) / $lastMonth) * 100, 1)
            : 0;

        return $this->successResponse([
            'revenue_trend' => $revenueTrend,
            'by_payment_method' => $byPaymentMethod,
            'top_doctors' => $topDoctors,
            'average_revenue_per_consultation' => round($avgRevenue, 2),
            'growth' => [
                'this_month' => round($thisMonth, 2),
                'last_month' => round($lastMonth, 2),
                'percentage' => $growthPercentage,
            ],
        ]);
    }

    /**
     * Get article analytics
     * GET /api/v1/admin/analytics/articles
     */
    public function articles()
    {
        $totalArticles = Article::count();
        $totalViews = Article::sum('views_count');
        $averageViews = $totalArticles > 0 ? round($totalViews / $totalArticles) : 0;

        // Most viewed articles
        $mostViewed = Article::with('doctor')
            ->orderByDesc('views_count')
            ->limit(10)
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'views' => $article->views_count,
                    'author' => $article->doctor->name ?? 'Unknown',
                ];
            });

        // By life stage
        $byLifeStage = Article::join('life_stages', 'articles.life_stage_id', '=', 'life_stages.id')
            ->where('articles.status', 'approved')
            ->select('life_stages.name', DB::raw('COUNT(*) as count'))
            ->groupBy('life_stages.name')
            ->pluck('count', 'name')
            ->toArray();

        // By status
        $byStatus = [
            'draft' => Article::where('status', 'draft')->count(),
            'pending_review' => Article::where('status', 'pending_review')->count(),
            'approved' => Article::where('status', 'approved')->count(),
            'rejected' => Article::where('status', 'rejected')->count(),
            'archived' => Article::where('status', 'archived')->count(),
        ];

        // Monthly publication trend
        $publicationTrend = Article::where('status', 'approved')
            ->where('published_at', '>=', Carbon::now()->subMonths(12))
            ->select(
                DB::raw("DATE_FORMAT(published_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(published_at, '%Y-%m')"))
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        // Top authors
        $topAuthors = Doctor::withCount([
            'articles' => function ($q) {
                $q->where('status', 'approved');
            }
        ])
            ->having('articles_count', '>', 0)
            ->orderByDesc('articles_count')
            ->limit(5)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'articles' => $doctor->articles_count,
                ];
            });

        return $this->successResponse([
            'total_articles' => $totalArticles,
            'total_views' => $totalViews,
            'average_views_per_article' => $averageViews,
            'most_viewed' => $mostViewed,
            'by_life_stage' => $byLifeStage,
            'by_status' => $byStatus,
            'publication_trend' => $publicationTrend,
            'top_authors' => $topAuthors,
            'engagement' => [
                'average_reading_time' => '4.5 minutes', // Placeholder
                'completion_rate' => '78%', // Placeholder
            ],
        ]);
    }

    /**
     * Get overall platform analytics
     * GET /api/v1/admin/analytics/overview
     */
    public function overview()
    {
        return \Illuminate\Support\Facades\Cache::remember('admin.analytics.overview', 60, function () { // Cache for 1 minute (for testing)
            $now = Carbon::now();
            $thirtyDaysAgo = $now->copy()->subDays(30);

            // Quick stats
            $totalPatients = User::count();
            $totalDoctors = Doctor::count();
            $totalConsultations = Consultation::count();
            $totalRevenue = Payment::where('status', 'completed')->sum('amount');

            // 30-day comparison
            $newPatients30d = User::where('created_at', '>=', $thirtyDaysAgo)->count();
            $newDoctors30d = Doctor::where('created_at', '>=', $thirtyDaysAgo)->count();
            $consultations30d = Consultation::where('created_at', '>=', $thirtyDaysAgo)->count();
            $revenue30d = Payment::where('status', 'completed')
                ->where('paid_at', '>=', $thirtyDaysAgo)
                ->sum('amount');

            // Activity heatmap (Optimized)
            $startDate = $now->copy()->subDays(6)->startOfDay();

            $userActivity = User::where('last_login_at', '>=', $startDate)
                ->select(DB::raw("DATE(last_login_at) as date"), DB::raw('count(*) as count'))
                ->groupBy(DB::raw("DATE(last_login_at)"))
                ->pluck('count', 'date')
                ->toArray();

            $consultationActivity = Consultation::where('date', '>=', $startDate->format('Y-m-d'))
                ->select('date', DB::raw('count(*) as count'))
                ->groupBy('date')
                ->pluck('count', 'date')
                ->toArray();

            $activityHeatmap = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = $now->copy()->subDays($i)->format('Y-m-d');
                $activityHeatmap[$date] = [
                    'users' => $userActivity[$date] ?? 0,
                    'consultations' => $consultationActivity[$date] ?? 0,
                ];
            }

            return $this->successResponse([
                'totals' => [
                    'patients' => $totalPatients,
                    'doctors' => $totalDoctors,
                    'consultations' => $totalConsultations,
                    'revenue' => round($totalRevenue, 2),
                ],
                'last_30_days' => [
                    'new_patients' => $newPatients30d,
                    'new_doctors' => $newDoctors30d,
                    'consultations' => $consultations30d,
                    'revenue' => round($revenue30d, 2),
                ],
                'activity_heatmap' => $activityHeatmap,
            ]);
        });
    }

    /**
     * Get period configuration
     */
    private function getPeriodConfig(string $period): array
    {
        $now = Carbon::now();

        switch ($period) {
            case 'week':
                return [
                    $now->copy()->subWeeks(4),
                    '%Y-%W',
                    [],
                ];
            case 'quarter':
                return [
                    $now->copy()->subMonths(3),
                    '%Y-%m',
                    [],
                ];
            case 'year':
                return [
                    $now->copy()->subYear(),
                    '%Y-%m',
                    [],
                ];
            case 'month':
            default:
                return [
                    $now->copy()->subMonth(),
                    '%Y-%m-%d',
                    [],
                ];
        }
    }
}
