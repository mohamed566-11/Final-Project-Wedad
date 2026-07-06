<?php

namespace App\Console\Commands;

use App\Models\Consultation;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GenerateDailyReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:generate-daily {--date= : Date to generate report for (Y-m-d format)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily reports for admin dashboard';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $date = $this->option('date') 
            ? Carbon::parse($this->option('date')) 
            : Carbon::yesterday();

        $this->info("Generating daily report for: {$date->format('Y-m-d')}");

        $report = [
            'date' => $date->format('Y-m-d'),
            'generated_at' => now()->toISOString(),
            'consultations' => $this->getConsultationStats($date),
            'payments' => $this->getPaymentStats($date),
            'users' => $this->getUserStats($date),
            'doctors' => $this->getDoctorStats($date),
        ];

        // Save report to storage
        $filename = "reports/daily/{$date->format('Y-m-d')}.json";
        Storage::put($filename, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $this->info("Report saved to: {$filename}");

        // Log summary
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Consultations', $report['consultations']['total']],
                ['Completed', $report['consultations']['completed']],
                ['Cancelled', $report['consultations']['cancelled']],
                ['Total Revenue', number_format($report['payments']['total_amount']) . ' EGP'],
                ['New Patients', $report['users']['new_patients']],
            ]
        );

        return Command::SUCCESS;
    }

    private function getConsultationStats(Carbon $date): array
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        return [
            'total' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'pending' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'pending')->count(),
            'confirmed' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'confirmed')->count(),
            'completed' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'completed')->count(),
            'cancelled' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor'])->count(),
            'no_show' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'no_show')->count(),
            'by_type' => [
                'video' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                    ->where('type', 'video')->count(),
                'offline' => Consultation::whereBetween('created_at', [$startOfDay, $endOfDay])
                    ->where('type', 'offline')->count(),
            ],
        ];
    }

    private function getPaymentStats(Carbon $date): array
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        $payments = Payment::whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->where('status', 'completed');

        return [
            'total_count' => $payments->count(),
            'total_amount' => $payments->sum('amount'),
            'average_amount' => $payments->avg('amount') ?? 0,
            'by_method' => Payment::whereBetween('paid_at', [$startOfDay, $endOfDay])
                ->where('status', 'completed')
                ->select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
                ->groupBy('payment_method')
                ->get()
                ->keyBy('payment_method')
                ->toArray(),
            'refunds' => [
                'count' => Payment::whereBetween('updated_at', [$startOfDay, $endOfDay])
                    ->where('status', 'refunded')->count(),
                'amount' => Payment::whereBetween('updated_at', [$startOfDay, $endOfDay])
                    ->where('status', 'refunded')->sum('amount'),
            ],
        ];
    }

    private function getUserStats(Carbon $date): array
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        return [
            'new_patients' => User::where('user_type', 'patient')
                ->whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'new_doctors' => User::where('user_type', 'doctor')
                ->whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'verified_emails' => User::whereBetween('email_verified_at', [$startOfDay, $endOfDay])->count(),
            'total_patients' => User::where('user_type', 'patient')->count(),
            'total_doctors' => User::where('user_type', 'doctor')->count(),
        ];
    }

    private function getDoctorStats(Carbon $date): array
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        return [
            'active_today' => Consultation::whereBetween('date', [$startOfDay, $endOfDay])
                ->distinct('doctor_id')
                ->count('doctor_id'),
            'top_doctors' => Consultation::whereBetween('date', [$startOfDay, $endOfDay])
                ->select('doctor_id', DB::raw('count(*) as consultations'))
                ->groupBy('doctor_id')
                ->orderByDesc('consultations')
                ->limit(5)
                ->with('doctor:id,name')
                ->get()
                ->toArray(),
        ];
    }
}
