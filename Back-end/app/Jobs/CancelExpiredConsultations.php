<?php

namespace App\Jobs;

use App\Models\Consultation;
use App\Notifications\ConsultationCancelledNotification;
use App\Notifications\ConsultationNoShowNotification;
use App\Services\NotificationService;
use App\Services\ZoomService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CancelExpiredConsultations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(ZoomService $zoomService, NotificationService $notificationService): void
    {
        $this->cancelUnpaidConsultations($zoomService, $notificationService);
        $this->markNoShowConsultations();
    }

    /**
     * Cancel pending consultations where payment wasn't completed within 30 minutes
     */
    protected function cancelUnpaidConsultations(ZoomService $zoomService, NotificationService $notificationService): void
    {
        $expiredPending = Consultation::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subMinutes(30))
            ->whereDoesntHave('payment', function ($query) {
                $query->where('status', 'completed');
            })
            ->with(['patient', 'doctor', 'reminders'])
            ->get();

        if ($expiredPending->isEmpty()) {
            return;
        }

        Log::info("CancelExpiredConsultations: Found {$expiredPending->count()} unpaid consultations to cancel");

        foreach ($expiredPending as $consultation) {
            try {
                $consultation->update([
                    'status' => 'cancelled_by_patient',
                    'cancellation_reason' => 'انتهت مهلة الدفع',
                ]);

                // Delete Zoom meeting if exists
                if ($consultation->zoom_meeting_id && $zoomService->isConfigured()) {
                    $zoomService->deleteMeeting($consultation->zoom_meeting_id);
                }

                // Delete reminders
                $consultation->reminders()->delete();

                // Notify patient via Notification class (database + email + broadcast)
                if ($consultation->patient) {
                    $consultation->patient->notify(
                        new ConsultationCancelledNotification($consultation, 'انتهت مهلة الدفع')
                    );
                }

                // Notify doctor (database notification only)
                if ($consultation->doctor) {
                    $notificationService->create(
                        $consultation->doctor,
                        'consultation.expired',
                        'تم إلغاء استشارة',
                        "تم إلغاء استشارة {$consultation->patient->name} تلقائياً بسبب عدم إتمام الدفع",
                        [
                            'consultation_id' => $consultation->id,
                            'reason' => 'payment_timeout',
                        ]
                    );
                }

                Log::info("Expired consultation #{$consultation->id} cancelled (payment timeout)");
            } catch (\Exception $e) {
                Log::error("Failed to cancel expired consultation #{$consultation->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Mark no-show consultations (confirmed but patient didn't join within 15 min after start)
     */
    protected function markNoShowConsultations(): void
    {
        $noShowConsultations = Consultation::where('status', 'confirmed')
            ->where('type', 'video')
            ->whereRaw("CONCAT(date, ' ', time) < ?", [Carbon::now()->subMinutes(15)->format('Y-m-d H:i:s')])
            ->with(['patient', 'doctor'])
            ->get();

        if ($noShowConsultations->isEmpty()) {
            return;
        }

        Log::info("CancelExpiredConsultations: Found {$noShowConsultations->count()} no-show consultations");

        foreach ($noShowConsultations as $consultation) {
            try {
                $consultation->update(['status' => 'no_show']);

                // Notify patient (database + email + broadcast via Notification class)
                if ($consultation->patient) {
                    $consultation->patient->notify(
                        new ConsultationNoShowNotification($consultation)
                    );
                }

                // Notify doctor (database + email + broadcast via Notification class)
                if ($consultation->doctor) {
                    $consultation->doctor->notify(
                        new ConsultationNoShowNotification($consultation)
                    );
                }

                Log::info("Consultation #{$consultation->id} marked as no-show");
            } catch (\Exception $e) {
                Log::error("Failed to mark consultation #{$consultation->id} as no-show: {$e->getMessage()}");
            }
        }
    }
}
