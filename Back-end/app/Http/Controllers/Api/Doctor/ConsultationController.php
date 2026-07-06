<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doctor\Consultation\CancelConsultationRequest;
use App\Http\Requests\Doctor\Consultation\CompleteConsultationRequest;
use App\Http\Requests\Doctor\Consultation\UpdateWorkingHoursRequest;
use App\Http\Resources\Doctor\ConsultationResource;
use App\Models\Consultation;
use App\Models\DoctorWorkingHour;
use App\Models\Prescription;
use App\Services\ConsultationService;
use App\Services\ZoomService;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConsultationController extends Controller
{
    use ApiResponse;

    protected $consultationService;
    protected $zoomService;

    public function __construct(ConsultationService $consultationService, ZoomService $zoomService)
    {
        $this->consultationService = $consultationService;
        $this->zoomService = $zoomService;
    }

    /**
     * Get consultations calendar
     * GET /api/v1/doctor/consultations/calendar
     */
    public function calendar(Request $request)
    {
        $doctor = $request->user();
        $month = $request->input('month', Carbon::now()->format('Y-m'));

        $startOfMonth = Carbon::parse($month)->startOfMonth();
        $endOfMonth = Carbon::parse($month)->endOfMonth();

        $consultations = Consultation::where('doctor_id', $doctor->id)
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->where('status', '!=', 'cancelled')
            ->with(['patient'])
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        $byDate = $consultations->groupBy(function ($c) {
            return $c->date->format('Y-m-d');
        });

        // Format for calendar
        $formatted = [];
        foreach ($byDate as $date => $items) {
            $formatted[$date] = $items->map(function ($c) {
                return [
                    'id' => $c->id,
                    'time' => Carbon::parse($c->time)->format('H:i'),
                    'patient' => $c->patient->name ?? 'Unknown',
                    'type' => $c->type,
                    'status' => $c->status,
                ];
            });
        }

        // Calculate available slots month-wide based on the new Slots structure
        // Each entry in working_hours represents exactly one 60-minute slot.
        $workingHours = $doctor->workingHours()->get();
        $slotsPerDayName = [];
        foreach ($workingHours as $wh) {
            $day = strtolower($wh->day);
            if (!isset($slotsPerDayName[$day])) {
                $slotsPerDayName[$day] = 0;
            }
            $slotsPerDayName[$day]++; // Each DB record is 1 slot
        }

        $totalTheoreticalSlots = 0;
        $currentDate = $startOfMonth->copy();
        while ($currentDate->lessThanOrEqualTo($endOfMonth)) {
            $dayName = strtolower($currentDate->format('l'));
            if (isset($slotsPerDayName[$dayName])) {
                $totalTheoreticalSlots += $slotsPerDayName[$dayName];
            }
            $currentDate->addDay();
        }

        // Exclude past un-booked, but simpler approach: total theoretical - total booked this month
        $availableSlots = max(0, $totalTheoreticalSlots - $consultations->count());

        $stats = [
            'total_this_month' => $consultations->count(),
            'busy_days' => $byDate->count(),
            'available_slots' => $availableSlots
        ];

        return $this->successResponse([
            'month' => $month,
            'consultations_by_date' => $formatted,
            'stats' => $stats
        ], 'تم جلب بيانات التقويم بنجاح');
    }

    /**
     * Get doctor's consultations
     * GET /api/v1/doctor/consultations
     */
    public function index(Request $request)
    {
        $doctor = $request->user();
        $query = Consultation::where('doctor_id', $doctor->id)
            ->with(['patient', 'patient.lifeStage', 'review']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        // Filter upcoming
        if ($request->boolean('upcoming')) {
            $query->where('date', '>=', Carbon::today())
                ->whereIn('status', ['pending', 'confirmed']);
        }

        // Quick search (Patient name, phone, or notes)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                })->orWhere('patient_notes', 'like', "%{$search}%");
            });
        }

        $query->orderBy('date')->orderBy('time');

        $perPage = $request->input('per_page', 10);
        $consultations = $query->paginate($perPage);

        // Get stats
        $stats = $this->consultationService->getDoctorStats($doctor);

        return $this->successResponse([
            'consultations' => ConsultationResource::collection($consultations),
            'stats' => $stats,
        ], 'تم جلب الاستشارات بنجاح');
    }

    /**
     * Get single consultation details
     * GET /api/v1/doctor/consultations/{id}
     */
    public function show(Request $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->with(['patient', 'patient.profile', 'patient.lifeStage', 'review', 'prescription'])
            ->findOrFail($id);

        return $this->successResponse(
            new ConsultationResource($consultation),
            'تم جلب تفاصيل الاستشارة بنجاح'
        );
    }

    /**
     * Confirm a consultation
     * PUT /api/v1/doctor/consultations/{id}/confirm
     */
    public function confirm(Request $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $consultation->update(['status' => 'confirmed']);

        // Send notification to patient
        if ($consultation->patient) {
            $consultation->patient->notify(new \App\Notifications\ConsultationConfirmedNotification($consultation));
        }

        return $this->successResponse(
            new ConsultationResource($consultation->fresh()),
            'تم تأكيد الاستشارة بنجاح'
        );
    }

    /**
     * Start a consultation
     * PUT /api/v1/doctor/consultations/{id}/start
     */
    public function start(Request $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $result = $this->consultationService->startConsultation($consultation);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse(
            new ConsultationResource($result['consultation']),
            'تم بدء الاستشارة بنجاح'
        );
    }

    /**
     * Complete a consultation
     * PUT /api/v1/doctor/consultations/{id}/complete
     */
    public function complete(CompleteConsultationRequest $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $result = $this->consultationService->completeConsultation($consultation, $request->validated());

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse(
            new ConsultationResource($result['consultation']),
            'تم إنهاء الاستشارة بنجاح'
        );
    }

    /**
     * Cancel a consultation
     * PUT /api/v1/doctor/consultations/{id}/cancel
     */
    public function cancel(CancelConsultationRequest $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $result = $this->consultationService->cancelConsultation(
            $consultation,
            $request->cancellation_reason,
            'doctor'
        );

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse([
            'consultation' => new ConsultationResource($result['consultation']),
            'refund_status' => $result['refund_status'],
        ], 'تم إلغاء الاستشارة بنجاح');
    }

    /**
     * Get patient history for a consultation
     * GET /api/v1/doctor/consultations/{id}/patient-history
     */
    public function patientHistory(Request $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->with('patient')
            ->findOrFail($id);

        $patient = $consultation->patient;

        // Get previous consultations with this doctor
        $previousConsultations = Consultation::where('doctor_id', $doctor->id)
            ->where('user_id', $patient->id)
            ->where('id', '!=', $consultation->id)
            ->where('status', 'completed')
            ->orderByDesc('date')
            ->limit(10)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'date' => $c->date->format('Y-m-d'),
                    'doctor_notes' => $c->doctor_notes,
                    'patient_notes' => $c->patient_notes,
                ];
            });

        // Get medical profile if exists
        $medicalProfile = null;
        if ($patient->profile) {
            $medicalProfile = [
                'blood_type' => $patient->profile->blood_type,
                'chronic_diseases' => $patient->profile->chronic_diseases,
                'allergies' => $patient->profile->allergies,
                'current_medications' => $patient->profile->current_medications,
                'height' => $patient->profile->height,
                'weight' => $patient->profile->weight,
            ];
        }

        // Get pregnancy info if applicable
        $pregnancyInfo = null;
        $activePregnancy = $patient->pregnancies()
            ->where('is_active', true)
            ->first();

        if ($activePregnancy) {
            $currentWeek = $activePregnancy->last_menstrual_period
                ? Carbon::parse($activePregnancy->last_menstrual_period)->diffInWeeks(now())
                : 0;

            $pregnancyInfo = [
                'is_pregnant' => true,
                'current_week' => min((int) $currentWeek, 42),
                'due_date' => $activePregnancy->due_date ? Carbon::parse($activePregnancy->due_date)->format('Y-m-d') : null,
                'high_risk' => $activePregnancy->high_risk ?? false,
            ];
        }

        return $this->successResponse([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'age' => $patient->age,
                'phone' => $patient->phone,
                'life_stage' => $patient->lifeStage?->name,
            ],
            'previous_consultations' => $previousConsultations,
            'medical_profile' => $medicalProfile,
            'pregnancy' => $pregnancyInfo,
        ], 'تم جلب سجل المريض بنجاح');
    }

    /**
     * Get meeting info for a consultation
     * GET /api/v1/doctor/consultations/{id}/meeting-info
     */
    public function getMeetingInfo(Request $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->whereIn('status', ['confirmed', 'in_progress', 'completed'])
            ->findOrFail($id);

        if ($consultation->type !== 'video') {
            return $this->errorResponse('هذه ليست استشارة فيديو', 400);
        }

        if (!$consultation->google_meet_link) {
            // Try to create it if it's missing and status is valid
            if (in_array($consultation->status, ['confirmed', 'in_progress'])) {
                $result = $this->consultationService->startConsultation($consultation);
                if (!$result['success']) {
                    return $this->errorResponse('لم يتم إنشاء رابط الاجتماع بعد', 404);
                }
                $consultation->refresh();
            } else {
                return $this->errorResponse('لا يوجد رابط اجتماع لهذه الاستشارة', 404);
            }
        }

        return $this->successResponse([
            'meet_link' => $consultation->google_meet_link,
            'meet_id' => $consultation->google_meet_id,
            'event_id' => $consultation->google_event_id,
            'can_join' => true, // logic can be refined if needed
        ], 'تم جلب بيانات الاجتماع بنجاح');
    }

    /**
     * Get doctor's working hours — returns slots grouped by day
     * GET /api/v1/doctor/working-hours
     */
    public function getWorkingHours(Request $request)
    {
        $doctor = $request->user();

        $slots = $doctor->workingHours()
            ->orderBy('day')
            ->orderBy('start_time')
            ->get(['id', 'day', 'start_time']);

        // Group by day so front-end can easily map
        $grouped = $slots->groupBy('day')->map(function ($daySlots, $day) {
            return [
                'day' => $day,
                'day_ar' => TranslationHelper::day($day),
                'start_times' => $daySlots->pluck('start_time')
                    ->map(fn($t) => Carbon::parse($t)->format('H:i'))
                    ->values()
                    ->all(),
            ];
        })->values();

        return $this->successResponse($grouped, 'تم جلب ساعات العمل بنجاح');
    }

    /**
     * Update doctor's working hours — replaces all existing slots
     * PUT /api/v1/doctor/working-hours
     */
    public function updateWorkingHours(UpdateWorkingHoursRequest $request)
    {
        $doctor = $request->user();
        $workingHours = $request->working_hours; // [{day, start_time}, ...]

        DB::beginTransaction();
        try {
            // Delete all existing slots for this doctor
            $doctor->workingHours()->delete();

            // Insert new slots — ignore duplicates if frontend sends same slot twice
            foreach ($workingHours as $slot) {
                DoctorWorkingHour::firstOrCreate(
                    [
                        'doctor_id' => $doctor->id,
                        'day' => $slot['day'],
                        'start_time' => $slot['start_time'] . ':00',
                    ]
                );
            }

            DB::commit();

            // Return in the same grouped format
            $updatedSlots = $doctor->workingHours()
                ->orderBy('day')->orderBy('start_time')
                ->get(['id', 'day', 'start_time']);

            $grouped = $updatedSlots->groupBy('day')->map(function ($daySlots, $day) {
                return [
                    'day' => $day,
                    'day_ar' => TranslationHelper::day($day),
                    'start_times' => $daySlots->pluck('start_time')
                        ->map(fn($t) => Carbon::parse($t)->format('H:i'))
                        ->values()->all(),
                ];
            })->values();

            return $this->successResponse($grouped, 'تم تحديث ساعات العمل بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('حدث خطأ أثناء تحديث ساعات العمل', 500);
        }
    }

    /**
     * Get doctor's dashboard stats
     * GET /api/v1/doctor/dashboard
     */
    public function dashboard(Request $request)
    {
        $doctor = $request->user();
        $stats = $this->consultationService->getDoctorStats($doctor);

        // Get today's consultations
        $todayConsultations = Consultation::where('doctor_id', $doctor->id)
            ->where('date', Carbon::today())
            ->whereIn('status', ['pending', 'confirmed', 'in_progress', 'completed'])
            ->with('patient')
            ->orderBy('time')
            ->get();

        // Get recent reviews
        $recentReviews = $doctor->reviews()
            ->where('is_published', true)
            ->with('patient')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'patient_name' => $review->is_anonymous ? 'مستخدم مجهول' : $review->patient->name,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->format('Y-m-d'),
                ];
            });

        return $this->successResponse([
            'stats' => $stats,
            'today_consultations' => ConsultationResource::collection($todayConsultations),
            'recent_reviews' => $recentReviews,
            'rating' => $doctor->rating,
            'total_reviews' => $doctor->reviews()->count(),
        ], 'تم جلب لوحة التحكم بنجاح');
    }
    /**
     * Update consultation notes and prescription
     * PUT /api/v1/doctor/consultations/{id}/update-notes
     */
    public function updateNotes(Request $request, $id)
    {
        $doctor = $request->user();
        $consultation = Consultation::where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $request->validate([
            'doctor_notes' => 'nullable|string|max:5000',
            'medications' => 'nullable|array',
            'medications.*.name' => 'required_with:medications|string',
            'medications.*.dosage' => 'required_with:medications|string',
            'medications.*.frequency' => 'nullable|string',
            'medications.*.duration' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Update doctor notes
            if ($request->has('doctor_notes')) {
                $consultation->doctor_notes = $request->doctor_notes;
                $consultation->save();
            }

            // Update prescription
            if ($request->has('medications')) {
                $prescription = Prescription::updateOrCreate(
                    [
                        'consultation_id' => $consultation->id,
                        'doctor_id'       => $doctor->id,
                        'user_id'         => $consultation->user_id,
                    ],
                    [
                        'medications' => $request->medications,
                        'diagnosis'   => $consultation->doctor_notes,
                    ]
                );
            }

            DB::commit();

            return $this->successResponse(
                new ConsultationResource($consultation->fresh()),
                'تم تحديث البيانات بنجاح'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Consultation notes update error: ' . $e->getMessage());
            return $this->errorResponse('حدث خطأ أثناء تحديث البيانات، يرجى المحاولة لاحقاً', 500);
        }
    }
}
