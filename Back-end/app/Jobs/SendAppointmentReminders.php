<?php

namespace App\Jobs;

use App\Models\AppointmentReminder;
use App\Models\Consultation;
use App\Notifications\ConsultationReminderNotification;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendAppointmentReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(NotificationService $notificationService): void
    {
        $now = Carbon::now();
        $oneHourLater = $now->copy()->addHour();

        // 1) Process any pending reminders already in the DB
        $this->processPendingReminders($notificationService);

        // 2) Find confirmed consultations in the next hour that have no reminder yet
        $consultations = Consultation::where('status', 'confirmed')
            ->whereRaw("CONCAT(date, ' ', time) BETWEEN ? AND ?", [
                $now->format('Y-m-d H:i:s'),
                $oneHourLater->format('Y-m-d H:i:s'),
            ])
            ->whereDoesntHave('reminders', function ($query) {
                $query->whereIn('status', ['sent', 'pending']);
            })
            ->with(['patient', 'doctor'])
            ->get();

        if ($consultations->isEmpty()) {
            return;
        }

        Log::info("SendAppointmentReminders: Found {$consultations->count()} consultations needing reminders");

        foreach ($consultations as $consultation) {
            try {
                $consultationDate = Carbon::parse($consultation->date)->format('Y-m-d');
                $consultationTime = Carbon::parse($consultation->time)->format('H:i');

                // Record the reminder
                AppointmentReminder::create([
                    'consultation_id' => $consultation->id,
                    'user_id' => $consultation->user_id,
                    'reminder_type' => 'email',
                    'scheduled_at' => $now,
                    'sent_at' => $now,
                    'status' => 'sent',
                ]);

                // Notify patient via Notification class (database + email + broadcast)
                if ($consultation->patient) {
                    $consultation->patient->notify(
                        new ConsultationReminderNotification($consultation, '1_hour')
                    );
                }

                // Notify doctor (database notification only)
                if ($consultation->doctor) {
                    $timeUntil = $now->diffForHumans(
                        Carbon::parse("{$consultationDate} {$consultationTime}"),
                        ['parts' => 1, 'syntax' => Carbon::DIFF_RELATIVE_TO_NOW]
                    );

                    $notificationService->create(
                        $consultation->doctor,
                        'appointment.reminder',
                        'تذكير بموعد الاستشارة',
                        "لديك استشارة مع {$consultation->patient->name} {$timeUntil}",
                        [
                            'consultation_id' => $consultation->id,
                            'date' => $consultationDate,
                            'time' => $consultationTime,
                        ]
                    );
                }

                Log::info("Reminder sent for consultation #{$consultation->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send reminder for consultation #{$consultation->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Process any existing pending reminders in the DB (legacy or pre-scheduled)
     */
    protected function processPendingReminders(NotificationService $notificationService): void
    {
        $reminders = AppointmentReminder::where('status', 'pending')
            ->where('scheduled_at', '<=', Carbon::now())
            ->with(['consultation.doctor', 'consultation.patient'])
            ->get();

        foreach ($reminders as $reminder) {
            try {
                $consultation = $reminder->consultation;

                if (!$consultation || !in_array($consultation->status, ['pending', 'confirmed'])) {
                    $reminder->update(['status' => 'sent', 'sent_at' => Carbon::now()]);
                    continue;
                }

                // Send via Notification class (database + email + broadcast)
                if ($consultation->patient) {
                    $consultation->patient->notify(
                        new ConsultationReminderNotification($consultation, '1_hour')
                    );
                }

                $reminder->update(['status' => 'sent', 'sent_at' => Carbon::now()]);

                Log::info("Pending reminder #{$reminder->id} processed for consultation #{$consultation->id}");
            } catch (\Exception $e) {
                $reminder->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                Log::error("Failed to process reminder #{$reminder->id}: {$e->getMessage()}");
            }
        }
    }
}
