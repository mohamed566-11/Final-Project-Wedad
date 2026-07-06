<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Services\GoogleMeetService;

class ConsultationService
{
    protected GoogleMeetService $googleMeetService;
    protected PaymobService $paymobService;

    public function __construct(GoogleMeetService $googleMeetService, PaymobService $paymobService)
    {
        $this->googleMeetService = $googleMeetService;
        $this->paymobService = $paymobService;
    }

    /**
     * Parse consultation date to string format Y-m-d
     */
    protected function getDateString(Consultation $consultation): string
    {
        return $consultation->date instanceof \Carbon\Carbon
            ? $consultation->date->format('Y-m-d')
            : $consultation->date;
    }

    /**
     * Get available time slots for a doctor on a specific date.
     * Duration is always 60 minutes. Slots are individually defined by the doctor.
     */
    public function getAvailableSlots(Doctor $doctor, string $date, int $duration = 60): array
    {
        $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
        $slotDuration = 60; // Always 60 minutes per consultation

        // Get the doctor's defined slots for this day (each row = one possible slot)
        $definedSlots = $doctor->workingHours()
            ->where('day', $dayOfWeek)
            ->orderBy('start_time')
            ->get(['start_time']);

        if ($definedSlots->isEmpty()) {
            return [
                'date' => $date,
                'doctor_id' => $doctor->id,
                'slots' => [],
                'message' => 'الطبيب لا يعمل في هذا اليوم',
            ];
        }

        // Get all active bookings on this date for conflict check
        $bookedTimes = Consultation::where('doctor_id', $doctor->id)
            ->whereDate('date', $date)
            ->whereIn('status', ['pending', 'confirmed', 'in_progress'])
            ->pluck('time')
            ->map(fn($t) => Carbon::parse($t)->format('H:i'))
            ->all();

        $slots = [];
        foreach ($definedSlots as $slot) {
            $slotTime = Carbon::parse($slot->start_time)->format('H:i');
            $slotEndTime = Carbon::parse($slot->start_time)->addMinutes($slotDuration)->format('H:i');

            // Past check (only for today — block slots within the next 30 min)
            $isPast = false;
            if (Carbon::parse($date)->isToday()) {
                $isPast = Carbon::parse($date . ' ' . $slotTime)->lessThan(Carbon::now()->addMinutes(30));
            }

            $isBooked = in_array($slotTime, $bookedTimes);

            $slots[] = [
                'time' => $slotTime,
                'end_time' => $slotEndTime,
                'available' => !$isBooked && !$isPast,
                'reason' => $isBooked ? 'محجوز' : ($isPast ? 'انتهى الوقت' : null),
            ];
        }

        return [
            'date' => $date,
            'doctor_id' => $doctor->id,
            'slots' => $slots,
        ];
    }

    /**
     * Check if a specific slot is available for booking.
     * Validates: slot is defined by the doctor, not already booked, not in the past.
     */
    public function isSlotAvailable(Doctor $doctor, string $date, string $time, int $duration = 60): bool
    {
        $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
        $slotTimeNorm = Carbon::parse($time)->format('H:i');

        // Confirm this slot is defined by the doctor for this day
        $exists = $doctor->workingHours()
            ->where('day', $dayOfWeek)
            ->where('start_time', 'like', $slotTimeNorm . '%')
            ->exists();

        if (!$exists) {
            return false;
        }

        // Not in the past
        if (Carbon::parse($date . ' ' . $time)->lessThan(Carbon::now()->addMinutes(30))) {
            return false;
        }

        // No existing active booking at the same time
        return !Consultation::where('doctor_id', $doctor->id)
            ->whereDate('date', $date)
            ->whereIn('status', ['pending', 'confirmed', 'in_progress'])
            ->where('time', 'like', $slotTimeNorm . '%')
            ->exists();
    }

    /**
     * Create a new consultation booking
     */
    public function bookConsultation(array $data, User $patient): array
    {
        $doctor = Doctor::findOrFail($data['doctor_id']);

        // Validate doctor availability
        if (!$doctor->is_available || !$doctor->is_active || !in_array($doctor->verification_status, ['approved', 'verified'])) {
            return [
                'success' => false,
                'message' => 'الطبيب غير متاح حالياً',
            ];
        }

        // Check if doctor accepts this session type
        if ($doctor->session_type !== 'both' && $doctor->session_type !== $data['type']) {
            return [
                'success' => false,
                'message' => 'الطبيب لا يقبل هذا النوع من الجلسات',
            ];
        }

        // Check slot availability
        if (!$this->isSlotAvailable($doctor, $data['date'], $data['time'])) {
            return [
                'success' => false,
                'message' => 'هذا الموعد غير متاح',
            ];
        }

        DB::beginTransaction();
        try {
            // Calculate commission
            $commission = $this->paymobService->calculateCommission($doctor->consultation_price);

            // Create consultation — duration is always 60 minutes
            $consultation = Consultation::create([
                'doctor_id' => $doctor->id,
                'user_id' => $patient->id,
                'date' => $data['date'],
                'time' => $data['time'],
                'type' => $data['type'],
                'status' => 'pending',
                'price' => $doctor->consultation_price,
                'platform_commission' => $commission['platform_fee'],
                'patient_notes' => $data['patient_notes'] ?? null,
                'duration_minutes' => 60,
            ]);

            // Create Google Meet for video consultations
            $meetData = null;
            if ($data['type'] === 'video') {
                $meetResult = $this->googleMeetService->createMeeting($consultation);

                if ($meetResult['success']) {
                    $meetData = $meetResult;
                } else {
                    // Log error but proceed (meeting can be created later or manually)
                    // Or we could return an error if video is mandatory immediately
                    // For now, we'll proceed but without a link
                    // Ideally, checking doctor connection beforehand would be better
                }
            }

            // Handle payment
            $paymentData = null;
            if (isset($data['payment_method']) && $data['payment_method'] !== 'cash') {
                if ($this->paymobService->isConfigured()) {
                    if ($data['payment_method'] === 'wallet' && !empty($data['wallet_number'])) {
                        $paymentData = $this->paymobService->initiateWalletPayment($consultation, $data['wallet_number']);
                    } else {
                        // Default to Card
                        $paymentData = $this->paymobService->initiatePayment($consultation);
                    }
                }
            }

            // Create appointment reminders
            $this->createReminders($consultation);

            DB::commit();

            return [
                'success' => true,
                'consultation' => $consultation->fresh()->load(['doctor', 'patient']),
                'meet' => $meetData,
                'payment' => $paymentData,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'حدث خطأ أثناء الحجز: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel a consultation
     */
    public function cancelConsultation(Consultation $consultation, string $reason, string $cancelledBy = 'patient'): array
    {
        if (!$consultation->canBeCancelled()) {
            return [
                'success' => false,
                'message' => 'لا يمكن إلغاء هذه الاستشارة',
            ];
        }

        // Check 24-hour policy for patient cancellation
        $dateString = $this->getDateString($consultation);
        $consultationDateTime = Carbon::parse($dateString . ' ' . $consultation->time);
        $hoursUntilConsultation = Carbon::now()->diffInHours($consultationDateTime, false);

        if ($cancelledBy === 'patient' && $hoursUntilConsultation < 24 && $hoursUntilConsultation > 0) {
            return [
                'success' => false,
                'message' => 'لا يمكن الإلغاء قبل أقل من 24 ساعة من الموعد',
            ];
        }

        DB::beginTransaction();
        try {
            $status = $cancelledBy === 'patient' ? 'cancelled_by_patient' : 'cancelled_by_doctor';

            $consultation->update([
                'status' => $status,
                'cancellation_reason' => $reason,
            ]);

            // Delete Google Meet if exists
            if ($consultation->google_event_id) {
                $this->googleMeetService->cancelMeeting($consultation);
            }

            // Handle refund if payment was made
            $refundStatus = null;
            if ($consultation->payment && $consultation->payment->status === 'completed') {
                if ($hoursUntilConsultation >= 24 || $cancelledBy === 'doctor') {
                    $refunded = $this->paymobService->refund(
                        $consultation->payment->transaction_id,
                        $consultation->payment->amount
                    );
                    $refundStatus = $refunded ? 'refunded' : 'refund_failed';

                    if ($refunded) {
                        $consultation->payment->update(['status' => 'refunded']);
                    }
                }
            }

            DB::commit();

            return [
                'success' => true,
                'consultation' => $consultation->fresh(),
                'refund_status' => $refundStatus,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'حدث خطأ أثناء الإلغاء: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Reschedule a consultation
     */
    public function rescheduleConsultation(Consultation $consultation, string $newDate, string $newTime, string $reason): array
    {
        if (!$consultation->canBeCancelled()) {
            return [
                'success' => false,
                'message' => 'لا يمكن إعادة جدولة هذه الاستشارة',
            ];
        }

        // Check 24-hour policy
        $dateString = $this->getDateString($consultation);
        $consultationDateTime = Carbon::parse($dateString . ' ' . $consultation->time);
        if (Carbon::now()->diffInHours($consultationDateTime, false) < 24) {
            return [
                'success' => false,
                'message' => 'لا يمكن إعادة الجدولة قبل أقل من 24 ساعة من الموعد',
            ];
        }

        // Check new slot availability
        if (!$this->isSlotAvailable($consultation->doctor, $newDate, $newTime)) {
            return [
                'success' => false,
                'message' => 'الموعد الجديد غير متاح',
            ];
        }

        DB::beginTransaction();
        try {
            $oldDate = $consultation->date;
            $oldTime = $consultation->time;

            $consultation->update([
                'date' => $newDate,
                'time' => $newTime,
            ]);

            // Update Google Meet if exists
            if ($consultation->google_event_id) {
                $this->googleMeetService->rescheduleMeeting($consultation, $newDate, $newTime);
            }

            // Update reminders
            $consultation->reminders()->delete();
            $this->createReminders($consultation);

            DB::commit();

            return [
                'success' => true,
                'consultation' => $consultation->fresh(),
                'old_date' => $oldDate,
                'old_time' => $oldTime,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'حدث خطأ أثناء إعادة الجدولة: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Start a consultation (Doctor)
     */
    public function startConsultation(Consultation $consultation): array
    {
        if ($consultation->status !== 'confirmed' && $consultation->status !== 'in_progress') {
            return [
                'success' => false,
                'message' => 'الاستشارة ليست مؤكدة',
            ];
        }

        // Check if within time window (15 minutes before to 15 minutes after)
        $dateString = $this->getDateString($consultation);
        $consultationDateTime = Carbon::parse($dateString . ' ' . $consultation->time);
        $now = Carbon::now();
        $minutesUntil = $now->diffInMinutes($consultationDateTime, false);

        if (!config('app.debug') && ($minutesUntil > 15 || $minutesUntil < -30)) {
            return [
                'success' => false,
                'message' => 'لا يمكن بدء الجلسة في هذا الوقت',
            ];
        }

        // Create Google Meet if missing or placeholder
        if ($consultation->type === 'video' && (!$consultation->google_meet_link || str_contains($consultation->google_meet_link, 'abc-defg-hij'))) {
            $meetResult = $this->googleMeetService->createMeeting($consultation);

            if (!$meetResult['success']) {
                if (isset($meetResult['needs_auth']) && $meetResult['needs_auth']) {
                    return [
                        'success' => false,
                        'message' => 'يجب ربط حساب Google لإنشاء الاجتماع',
                        'needs_auth' => true,
                    ];
                }
                // Log error but continue? Or block?
                // Better block because it's a video call.
                return [
                    'success' => false,
                    'message' => 'فشل في إنشاء رابط الاجتماع: ' . ($meetResult['error'] ?? 'خطأ غير معروف'),
                ];
            }
            // Refresh to get link
            $consultation->refresh();
        }

        $consultation->update([
            'status' => 'in_progress',
            'started_at' => $consultation->started_at ?? Carbon::now(),
        ]);

        return [
            'success' => true,
            'consultation' => $consultation->fresh(),
        ];
    }

    /**
     * Complete a consultation (Doctor)
     */
    public function completeConsultation(Consultation $consultation, array $data): array
    {
        if (!in_array($consultation->status, ['in_progress', 'confirmed'])) {
            return [
                'success' => false,
                'message' => 'لا يمكن إنهاء الاستشارة، يجب أن تكون جارية أو مؤكدة',
            ];
        }

        DB::beginTransaction();
        try {
            $consultation->update([
                'status' => 'completed',
                'ended_at' => Carbon::now(),
                'doctor_notes' => $data['doctor_notes'] ?? null,
                'duration_minutes' => $consultation->started_at
                    ? Carbon::now()->diffInMinutes($consultation->started_at)
                    : 30,
            ]);

            // Update doctor stats
            $doctor = $consultation->doctor;
            $doctor->increment('total_consultations');

            // Create or Update Prescription if medications provided
            if (isset($data['medications']) && !empty($data['medications'])) {
                \App\Models\Prescription::updateOrCreate(
                    ['consultation_id' => $consultation->id],
                    [
                        'doctor_id' => $consultation->doctor_id,
                        'user_id' => $consultation->user_id,
                        'medications' => $data['medications'],
                        'diagnosis' => $data['diagnosis'] ?? null,
                        'notes' => $data['notes'] ?? null,
                    ]
                );
            }

            // Update doctor-patient relationship
            $this->updateDoctorPatientRelation($consultation);

            // Send Notification to Patient
            try {
                $patient = $consultation->patient ?? \App\Models\User::find($consultation->user_id);
                if ($patient) {
                    $patient->notify(new \App\Notifications\ConsultationCompletedNotification($consultation));
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send consultation completed notification: " . $e->getMessage());
            }

            DB::commit();

            return [
                'success' => true,
                'consultation' => $consultation->fresh(),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'حدث خطأ: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update doctor-patient relationship tracking
     */
    protected function updateDoctorPatientRelation(Consultation $consultation): void
    {
        $existing = DB::table('doctor_patients')
            ->where('doctor_id', $consultation->doctor_id)
            ->where('user_id', $consultation->user_id)
            ->first();

        if ($existing) {
            DB::table('doctor_patients')
                ->where('id', $existing->id)
                ->update([
                    'last_appointment_date' => Carbon::now(),
                    'total_appointments' => $existing->total_appointments + 1,
                    'updated_at' => Carbon::now(),
                ]);
        } else {
            DB::table('doctor_patients')->insert([
                'doctor_id' => $consultation->doctor_id,
                'user_id' => $consultation->user_id,
                'first_appointment_date' => Carbon::now(),
                'last_appointment_date' => Carbon::now(),
                'total_appointments' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }

    /**
     * Create appointment reminders
     */
    protected function createReminders(Consultation $consultation): void
    {
        $dateString = $this->getDateString($consultation);
        $consultationDateTime = Carbon::parse($dateString . ' ' . $consultation->time);

        $reminders = [
            ['hours' => 24, 'type' => 'email'],
            ['hours' => 1, 'type' => 'push_notification'],
            ['minutes' => 15, 'type' => 'push_notification'],
        ];

        foreach ($reminders as $reminder) {
            $scheduledAt = isset($reminder['hours'])
                ? $consultationDateTime->copy()->subHours($reminder['hours'])
                : $consultationDateTime->copy()->subMinutes($reminder['minutes']);

            if ($scheduledAt->greaterThan(Carbon::now())) {
                $consultation->reminders()->create([
                    'user_id' => $consultation->user_id,
                    'reminder_type' => $reminder['type'],
                    'scheduled_at' => $scheduledAt,
                    'status' => 'pending',
                ]);
            }
        }
    }

    /**
     * Get recommended doctors for a patient
     */
    public function getRecommendedDoctors(User $patient, int $limit = 10)
    {
        $query = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->where('is_available', true);

        // Filter by patient's life stage if available
        if ($patient->life_stage_id) {
            $query->whereHas('lifeStages', function ($q) use ($patient) {
                $q->where('life_stages.id', $patient->life_stage_id);
            });
        }

        return $query->orderByDesc('rating')
            ->orderByDesc('total_consultations')
            ->limit($limit)
            ->get();
    }

    /**
     * Get consultation statistics for a doctor
     * Optimized: uses grouped query instead of 7 separate COUNT queries
     */
    public function getDoctorStats(Doctor $doctor): array
    {
        $today = Carbon::today();
        $thisWeekStart = Carbon::now()->startOfWeek();
        $thisMonthStart = Carbon::now()->startOfMonth();

        // Single query with conditional aggregation
        $stats = Consultation::where('doctor_id', $doctor->id)
            ->selectRaw("
                COUNT(CASE WHEN date = ? AND status IN ('pending','confirmed','in_progress','completed') THEN 1 END) as today,
                COUNT(CASE WHEN date >= ? AND status IN ('pending','confirmed','in_progress','completed') THEN 1 END) as this_week,
                COUNT(CASE WHEN date >= ? AND status IN ('pending','confirmed','in_progress','completed') THEN 1 END) as this_month,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                COALESCE(SUM(CASE WHEN date >= ? AND status = 'completed' THEN price ELSE 0 END), 0) as monthly_earnings
            ", [$today, $thisWeekStart, $thisMonthStart, $thisMonthStart])
            ->first();

        return [
            'today' => (int) $stats->today,
            'this_week' => (int) $stats->this_week,
            'this_month' => (int) $stats->this_month,
            'total_completed' => (int) $stats->total_completed,
            'pending' => (int) $stats->pending,
            'confirmed' => (int) $stats->confirmed,
            'monthly_earnings' => (float) $stats->monthly_earnings,
        ];
    }
}
