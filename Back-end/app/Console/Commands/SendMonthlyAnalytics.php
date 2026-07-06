<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Consultation;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Mail\MonthlyAnalyticsReport;

class SendMonthlyAnalytics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'emails:send-monthly-analytics {--month= : Month to report (Y-m format)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send monthly analytics report to admins';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $month = $this->option('month')
            ? Carbon::createFromFormat('Y-m', $this->option('month'))->startOfMonth()
            : Carbon::now()->subMonth()->startOfMonth();

        $endOfMonth = $month->copy()->endOfMonth();

        $this->info("Generating monthly analytics for: {$month->format('Y-m')}");

        // Generate analytics
        $analytics = $this->generateAnalytics($month, $endOfMonth);

        // Save to storage
        $filename = "reports/monthly/{$month->format('Y-m')}.json";
        Storage::put($filename, json_encode($analytics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->info("Analytics saved to: {$filename}");

        // Get admin users
        $admins = User::where('user_type', 'admin')
            ->whereNotNull('email_verified_at')
            ->get();

        $sent = 0;
        foreach ($admins as $admin) {
            try {
                Mail::to($admin->email)->queue(new MonthlyAnalyticsReport($analytics, $month));
                $sent++;
                $this->line("Sent to: {$admin->email}");
            } catch (\Exception $e) {
                $this->error("Failed to send to {$admin->email}: " . $e->getMessage());
            }
        }

        $this->info("Analytics sent to {$sent} admins.");

        // Print summary
        $this->table(
            ['Metric', 'This Month', 'vs Last Month'],
            [
                ['Revenue', number_format($analytics['revenue']['total']) . ' EGP', $analytics['revenue']['change'] . '%'],
                ['Consultations', $analytics['consultations']['total'], $analytics['consultations']['change'] . '%'],
                ['New Patients', $analytics['users']['new_patients'], $analytics['users']['patients_change'] . '%'],
                ['New Doctors', $analytics['users']['new_doctors'], ''],
                ['Completion Rate', $analytics['consultations']['completion_rate'] . '%', ''],
            ]
        );

        return Command::SUCCESS;
    }

    private function generateAnalytics(Carbon $startOfMonth, Carbon $endOfMonth): array
    {
        // Get previous month for comparison
        $prevMonthStart = $startOfMonth->copy()->subMonth();
        $prevMonthEnd = $prevMonthStart->copy()->endOfMonth();

        // Current month stats
        $currentConsultations = Consultation::whereBetween('created_at', [$startOfMonth, $endOfMonth]);
        $currentPayments = Payment::where('status', 'completed')
            ->whereBetween('paid_at', [$startOfMonth, $endOfMonth]);

        // Previous month stats
        $prevConsultations = Consultation::whereBetween('created_at', [$prevMonthStart, $prevMonthEnd]);
        $prevPayments = Payment::where('status', 'completed')
            ->whereBetween('paid_at', [$prevMonthStart, $prevMonthEnd]);

        // Calculate changes
        $currentRevenue = $currentPayments->sum('amount');
        $prevRevenue = $prevPayments->sum('amount');
        $revenueChange = $prevRevenue > 0 
            ? round((($currentRevenue - $prevRevenue) / $prevRevenue) * 100, 1) 
            : 0;

        $currentConsCount = $currentConsultations->count();
        $prevConsCount = $prevConsultations->count();
        $consultationsChange = $prevConsCount > 0 
            ? round((($currentConsCount - $prevConsCount) / $prevConsCount) * 100, 1) 
            : 0;

        $newPatients = User::where('user_type', 'patient')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();
        $prevPatients = User::where('user_type', 'patient')
            ->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])->count();
        $patientsChange = $prevPatients > 0 
            ? round((($newPatients - $prevPatients) / $prevPatients) * 100, 1) 
            : 0;

        $completedCount = (clone $currentConsultations)->where('status', 'completed')->count();
        $completionRate = $currentConsCount > 0 
            ? round(($completedCount / $currentConsCount) * 100, 1) 
            : 0;

        return [
            'period' => [
                'month' => $startOfMonth->format('Y-m'),
                'start' => $startOfMonth->toDateString(),
                'end' => $endOfMonth->toDateString(),
            ],
            'revenue' => [
                'total' => $currentRevenue,
                'previous' => $prevRevenue,
                'change' => $revenueChange,
                'average_per_consultation' => $completedCount > 0 
                    ? round($currentRevenue / $completedCount, 2) 
                    : 0,
            ],
            'consultations' => [
                'total' => $currentConsCount,
                'completed' => $completedCount,
                'cancelled' => (clone $currentConsultations)
                    ->whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor'])->count(),
                'no_show' => (clone $currentConsultations)->where('status', 'no_show')->count(),
                'completion_rate' => $completionRate,
                'change' => $consultationsChange,
                'by_type' => [
                    'video' => (clone $currentConsultations)->where('type', 'video')->count(),
                    'offline' => (clone $currentConsultations)->where('type', 'offline')->count(),
                ],
            ],
            'users' => [
                'new_patients' => $newPatients,
                'new_doctors' => User::where('user_type', 'doctor')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])->count(),
                'patients_change' => $patientsChange,
                'total_active_patients' => User::where('user_type', 'patient')
                    ->whereHas('consultations', function ($q) use ($startOfMonth, $endOfMonth) {
                        $q->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
                    })->count(),
            ],
            'top_doctors' => Consultation::whereBetween('date', [$startOfMonth, $endOfMonth])
                ->where('status', 'completed')
                ->selectRaw('doctor_id, count(*) as consultations, sum(price) as revenue')
                ->groupBy('doctor_id')
                ->orderByDesc('revenue')
                ->limit(10)
                ->with('doctor:id,name')
                ->get()
                ->toArray(),
            'top_specializations' => Consultation::whereBetween('date', [$startOfMonth, $endOfMonth])
                ->where('status', 'completed')
                ->join('doctors', 'consultations.doctor_id', '=', 'doctors.id')
                ->selectRaw('doctors.specialization, count(*) as consultations')
                ->groupBy('doctors.specialization')
                ->orderByDesc('consultations')
                ->limit(5)
                ->get()
                ->toArray(),
        ];
    }
}
