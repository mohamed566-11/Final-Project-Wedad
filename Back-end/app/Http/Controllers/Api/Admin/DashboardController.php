<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;
use App\Models\Consultation;
use App\Models\Article;
use App\Models\Payment;
use App\Models\ContactUs;
use App\Models\JoinUs;
use App\Traits\ApiResponse;
use App\Services\CacheService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get dashboard statistics
     * GET /api/v1/admin/dashboard/stats
     */
    public function stats()
    {
        // Cache stats for 5 minutes
        return CacheService::getDashboardStats(function () {
            return $this->buildDashboardStats();
        });
    }

    /**
     * Build dashboard statistics (internal method)
     */
    private function buildDashboardStats()
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $lastMonth = $now->copy()->subMonth();
        $startOfLastMonth = $lastMonth->copy()->startOfMonth();
        $endOfLastMonth = $lastMonth->copy()->endOfMonth();
        $today = $now->copy()->startOfDay();

        // ==================== USERS OVERVIEW ====================
        $totalPatients = User::count();
        $totalDoctors = Doctor::count();
        $totalAdmins = Admin::count();

        // Last month counts for growth calculation
        $patientsLastMonth = User::where('created_at', '<', $startOfMonth)->count();
        $patientsGrowth = $patientsLastMonth > 0
            ? round((($totalPatients - $patientsLastMonth) / $patientsLastMonth) * 100, 1)
            : 0;

        // Active today (logged in today)
        $activePatientsToday = User::whereDate('last_login_at', $today)->count();
        $activeDoctorsToday = Doctor::whereDate('last_login_at', $today)->count();

        // New this month
        $newPatientsThisMonth = User::where('created_at', '>=', $startOfMonth)->count();
        $newDoctorsThisMonth = Doctor::where('created_at', '>=', $startOfMonth)->count();

        // ==================== CONSULTATIONS ====================
        $totalConsultations = Consultation::count();
        $consultationsThisMonth = Consultation::where('created_at', '>=', $startOfMonth)->count();
        $consultationsToday = Consultation::whereDate('created_at', $today)->count();
        $pendingConsultations = Consultation::where('status', 'pending')->count();
        $completedConsultations = Consultation::where('status', 'completed')->count();
        $cancelledConsultations = Consultation::whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor', 'cancelled_by_admin'])->count();

        // Average rating from reviews
        $averageRating = DB::table('consultation_reviews')->avg('rating') ?? 0;

        // Revenue this month
        $revenueThisMonth = Payment::where('status', 'completed')
            ->where('paid_at', '>=', $startOfMonth)
            ->sum('amount');

        // ==================== ARTICLES ====================
        $totalArticles = Article::count();
        $pendingReviewArticles = Article::where('status', 'pending_review')->count();
        $approvedArticles = Article::where('status', 'approved')->count();
        $rejectedArticles = Article::where('status', 'rejected')->count();
        $totalArticleViews = Article::sum('views_count');

        // ==================== DOCTORS VERIFICATION ====================
        $pendingVerificationDoctors = Doctor::where('verification_status', 'pending')->count();
        $verifiedDoctors = Doctor::where('verification_status', 'verified')->count();
        $rejectedDoctors = Doctor::where('verification_status', 'rejected')->count();
        $averageDoctorRating = Doctor::where('verification_status', 'verified')->avg('rating') ?? 0;

        // ==================== FINANCIALS ====================
        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        $platformEarnings = Payment::where('status', 'completed')->sum('platform_fee');
        $doctorsEarnings = Payment::where('status', 'completed')->sum('doctor_amount');

        $platformEarningsThisMonth = Payment::where('status', 'completed')
            ->where('paid_at', '>=', $startOfMonth)
            ->sum('platform_fee');

        // Last month revenue for growth calculation
        $revenueLastMonth = Payment::where('status', 'completed')
            ->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('amount');

        $revenueGrowth = $revenueLastMonth > 0
            ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
            : 0;

        // Pending payouts (doctors with completed consultations not yet paid out)
        // This would require a payouts table, for now we'll estimate
        $pendingPayouts = Payment::where('status', 'completed')
            ->whereNull('paid_at')
            ->sum('doctor_amount');

        // ==================== SYSTEM HEALTH ====================
        // These are placeholder values - in production, you'd get real metrics
        $systemHealth = [
            'database_size' => $this->getDatabaseSize(),
            'storage_used' => $this->getStorageUsed(),
            'api_uptime' => '99.8%',
            'average_response_time' => '245ms',
        ];

        return $this->successResponse([
            'users_overview' => [
                'patients' => [
                    'total' => $totalPatients,
                    'new_this_month' => $newPatientsThisMonth,
                    'active_today' => $activePatientsToday,
                    'growth' => $patientsGrowth,
                ],
                'doctors' => [
                    'total' => $totalDoctors,
                    'new_this_month' => $newDoctorsThisMonth,
                    'active_today' => $activeDoctorsToday,
                    'pending_verification' => $pendingVerificationDoctors,
                    'verified' => $verifiedDoctors,
                    'average_rating' => round($averageDoctorRating, 1),
                ],
                'admins' => [
                    'total' => $totalAdmins,
                ],
            ],
            'consultations' => [
                'total' => $totalConsultations,
                'this_month' => $consultationsThisMonth,
                'today' => $consultationsToday,
                'pending' => $pendingConsultations,
                'completed' => $completedConsultations,
                'cancelled' => $cancelledConsultations,
                'average_rating' => round($averageRating, 1),
                'revenue_this_month' => round($revenueThisMonth, 2),
            ],
            'articles' => [
                'total' => $totalArticles,
                'pending_review' => $pendingReviewArticles,
                'approved' => $approvedArticles,
                'rejected' => $rejectedArticles,
                'total_views' => $totalArticleViews,
            ],
            'doctors_verification' => [
                'pending_verification' => $pendingVerificationDoctors,
                'verified' => $verifiedDoctors,
                'rejected' => $rejectedDoctors,
                'average_rating' => round($averageDoctorRating, 1),
            ],
            'financials' => [
                'total_revenue' => round($totalRevenue, 2),
                'revenue_this_month' => round($revenueThisMonth, 2),
                'platform_earnings' => round($platformEarnings, 2),
                'platform_earnings_this_month' => round($platformEarningsThisMonth, 2),
                'doctors_earnings' => round($doctorsEarnings, 2),
                'pending_payouts' => round($pendingPayouts, 2),
                'revenue_growth' => $revenueGrowth,
            ],
            'system_health' => $systemHealth,
        ]);
    }

    /**
     * Get recent activity
     * GET /api/v1/admin/dashboard/recent-activity
     */
    public function recentActivity(Request $request)
    {
        $limit = $request->input('limit', 20);
        $activities = [];

        // Get recent users (last 24 hours)
        $recentUsers = User::where('created_at', '>=', Carbon::now()->subDay())
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($recentUsers as $user) {
            $activities[] = [
                'id' => 'user_' . $user->id,
                'type' => 'user_registered',
                'description' => 'مستخدم جديد: ' . $user->name,
                'icon' => 'user-plus',
                'timestamp' => $this->getHumanReadableTime($user->created_at),
                'image_url' => app('App\Utils\ImageManager')->getImageUrl($user->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
                'link' => '/admin/patients/' . $user->id,
                'created_at' => $user->created_at,
            ];
        }

        // Get recent doctors (last 24 hours)
        $recentDoctors = Doctor::where('created_at', '>=', Carbon::now()->subDay())
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($recentDoctors as $doctor) {
            $activities[] = [
                'id' => 'doctor_' . $doctor->id,
                'type' => 'doctor_registered',
                'description' => 'طبيب جديد: ' . $doctor->name,
                'icon' => 'user-md',
                'timestamp' => $this->getHumanReadableTime($doctor->created_at),
                'image_url' => app('App\Utils\ImageManager')->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                'link' => '/admin/doctors/' . $doctor->id,
                'created_at' => $doctor->created_at,
            ];
        }

        // Get recent articles submitted for review
        $recentArticles = Article::where('status', 'pending_review')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($recentArticles as $article) {
            $activities[] = [
                'id' => 'article_' . $article->id,
                'type' => 'article_submitted',
                'description' => 'مقال جديد للمراجعة: ' . $article->title,
                'icon' => 'file-text',
                'timestamp' => $this->getHumanReadableTime($article->created_at),
                'image_url' => app('App\Utils\ImageManager')->getImageUrl($article->image, 'articles/images', 'uploads', 'articles/images/default-aericle.png'),
                'link' => '/admin/articles/review/' . $article->id,
                'created_at' => $article->created_at,
            ];
        }

        // Get recent completed consultations
        $recentConsultations = Consultation::with('doctor')
            ->where('status', 'completed')
            ->where('updated_at', '>=', Carbon::now()->subDay())
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get();

        foreach ($recentConsultations as $consultation) {
            $activities[] = [
                'id' => 'consultation_' . $consultation->id,
                'type' => 'consultation_completed',
                'description' => 'استشارة مكتملة: ' . ($consultation->doctor->name ?? 'Unknown'),
                'icon' => 'check-circle',
                'timestamp' => $this->getHumanReadableTime($consultation->updated_at),
                'image_url' => app('App\Utils\ImageManager')->getImageUrl($consultation->doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                'link' => '/admin/consultations/' . $consultation->id,
                'created_at' => $consultation->updated_at,
            ];
        }

        // Get recent contact messages
        $recentMessages = ContactUs::where('created_at', '>=', Carbon::now()->subDay())
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($recentMessages as $message) {
            $activities[] = [
                'id' => 'message_' . $message->id,
                'type' => 'contact_message',
                'description' => 'رسالة جديدة من: ' . $message->name,
                'icon' => 'mail',
                'timestamp' => $this->getHumanReadableTime($message->created_at),
                'link' => '/admin/contact-messages/' . $message->id,
                'created_at' => $message->created_at,
            ];
        }

        // Sort all activities by created_at descending
        usort($activities, function ($a, $b) {
            return $b['created_at'] <=> $a['created_at'];
        });

        // Remove created_at from response and limit results
        $activities = array_slice($activities, 0, $limit);
        $activities = array_map(function ($activity) {
            unset($activity['created_at']);
            return $activity;
        }, $activities);

        return $this->successResponse([
            'activities' => $activities,
            'alerts' => [
                'pending_articles' => Article::where('status', 'pending_review')->count(),
                'pending_doctor_verifications' => Doctor::where('verification_status', 'pending')->count(),
                'unread_contact_messages' => ContactUs::where('is_read', false)->count(),
                'pending_join_requests' => JoinUs::where('status', 'pending')->count(),
            ]
        ]);
    }

    /**
     * Get alerts and notifications for admin
     * GET /api/v1/admin/dashboard/alerts
     */
    public function alerts()
    {
        $alerts = [];

        // Pending article reviews
        $pendingArticles = Article::where('status', 'pending_review')->count();
        if ($pendingArticles > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'مقالات بانتظار المراجعة',
                'count' => $pendingArticles,
                'link' => '/admin/articles?status=pending_review',
                'icon' => 'file-text',
            ];
        }

        // Pending doctor verifications
        $pendingDoctors = Doctor::where('verification_status', 'pending')->count();
        if ($pendingDoctors > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'أطباء بانتظار التحقق',
                'count' => $pendingDoctors,
                'link' => '/admin/doctors?verification_status=pending',
                'icon' => 'user-check',
            ];
        }

        // Unread contact messages
        $unreadMessages = ContactUs::where('is_read', false)->count();
        if ($unreadMessages > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'رسائل تواصل غير مقروءة',
                'count' => $unreadMessages,
                'link' => '/admin/contact-messages?is_read=false',
                'icon' => 'mail',
            ];
        }

        // Pending join requests
        $pendingJoinRequests = JoinUs::where('status', 'pending')->count();
        if ($pendingJoinRequests > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'طلبات انضمام معلقة',
                'count' => $pendingJoinRequests,
                'link' => '/admin/join-requests?status=pending',
                'icon' => 'user-plus',
            ];
        }

        // Pending consultations
        $pendingConsultations = Consultation::where('status', 'pending')->count();
        if ($pendingConsultations > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'استشارات معلقة',
                'count' => $pendingConsultations,
                'link' => '/admin/consultations?status=pending',
                'icon' => 'clock',
            ];
        }

        return $this->successResponse([
            'alerts' => $alerts,
            'total_alerts' => count($alerts),
        ]);
    }

    /**
     * Get human readable time difference
     */
    private function getHumanReadableTime(Carbon $date): string
    {
        $now = Carbon::now();
        $diff = (int) $date->diffInMinutes($now);

        if ($diff < 1) {
            return 'الآن';
        } elseif ($diff < 60) {
            return 'منذ ' . $diff . ' دقيقة';
        } elseif ($diff < 1440) {
            $hours = floor($diff / 60);
            return 'منذ ' . $hours . ' ساعة';
        } elseif ($diff < 10080) {
            $days = floor($diff / 1440);
            return 'منذ ' . $days . ' يوم';
        } else {
            return $date->format('Y-m-d');
        }
    }

    /**
     * Get database size (placeholder)
     */
    private function getDatabaseSize(): string
    {
        try {
            $dbName = config('database.connections.mysql.database');
            $result = DB::select("SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb 
                FROM information_schema.tables 
                WHERE table_schema = ?", [$dbName]);

            $sizeMb = $result[0]->size_mb ?? 0;

            if ($sizeMb >= 1024) {
                return round($sizeMb / 1024, 2) . ' GB';
            }
            return $sizeMb . ' MB';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    /**
     * Get storage used (placeholder)
     */
    private function getStorageUsed(): string
    {
        try {
            $storagePath = storage_path('app/public');
            if (!is_dir($storagePath)) {
                return '0 MB';
            }

            $bytes = 0;
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($storagePath, \RecursiveDirectoryIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                $bytes += $file->getSize();
            }

            $mb = $bytes / 1024 / 1024;
            if ($mb >= 1024) {
                return round($mb / 1024, 2) . ' GB';
            }
            return round($mb, 2) . ' MB';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }
}
