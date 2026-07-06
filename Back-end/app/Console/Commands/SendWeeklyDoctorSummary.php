<?php

namespace App\Console\Commands;

use App\Models\Doctor;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\WeeklyDoctorSummary;

class SendWeeklyDoctorSummary extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'emails:send-weekly-doctor-summary';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send weekly summary emails to doctors';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Sending weekly doctor summaries...');

        $startOfWeek = Carbon::now()->subWeek()->startOfWeek();
        $endOfWeek = Carbon::now()->subWeek()->endOfWeek();

        // Get all active doctors
        $doctors = Doctor::where('is_active', true)
            ->whereNotNull('email_verified_at')
            ->get();

        $sent = 0;
        $errors = 0;

        foreach ($doctors as $doctor) {
            try {
                // Get doctor's weekly stats
                $stats = $this->getDoctorWeeklyStats($doctor->id, $startOfWeek, $endOfWeek);

                // Send email
                Mail::to($doctor->email)->queue(new WeeklyDoctorSummary($doctor, $stats, $startOfWeek, $endOfWeek));

                $sent++;
                $this->line("Sent to: {$doctor->email}");
            } catch (\Exception $e) {
                $errors++;
                $this->error("Failed to send to {$doctor->email}: " . $e->getMessage());
            }
        }

        $this->info("Summary sent to {$sent} doctors. Errors: {$errors}");

        return Command::SUCCESS;
    }

    private function getDoctorWeeklyStats(int $doctorId, Carbon $startOfWeek, Carbon $endOfWeek): array
    {
        $consultations = Consultation::where('doctor_id', $doctorId)
            ->whereBetween('date', [$startOfWeek, $endOfWeek]);

        $completedConsultations = (clone $consultations)
            ->where('status', 'completed')
            ->get();

        return [
            'total_consultations' => $consultations->count(),
            'completed' => $completedConsultations->count(),
            'cancelled' => (clone $consultations)
                ->whereIn('status', ['cancelled_by_patient', 'cancelled_by_doctor'])
                ->count(),
            'no_show' => (clone $consultations)
                ->where('status', 'no_show')
                ->count(),
            'total_earnings' => $completedConsultations->sum('price'),
            'new_reviews' => $completedConsultations
                ->filter(fn($c) => $c->review)
                ->count(),
            'average_rating' => $completedConsultations
                ->filter(fn($c) => $c->review)
                ->avg(fn($c) => $c->review->rating) ?? 0,
            'upcoming_this_week' => Consultation::where('doctor_id', $doctorId)
                ->whereBetween('date', [Carbon::now(), Carbon::now()->addWeek()])
                ->whereIn('status', ['pending', 'confirmed'])
                ->count(),
        ];
    }
}
