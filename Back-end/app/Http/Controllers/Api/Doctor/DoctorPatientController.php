<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatientNote;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DoctorPatientController extends Controller
{
    use ApiResponse;

    /**
     * Get list of patients
     * GET /api/v1/doctor/patients
     */
    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = $doctor->patients()->with(['lifeStage', 'pregnancies']);

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sorting
        // Since doctor->patients() is belongsToMany, we can sort by pivot or user columns.
        $sort = $request->input('sort_by', 'newest');
        if ($sort === 'most_consultations') {
            $query->orderByDesc('pivot_total_appointments');
        } elseif ($sort === 'name') {
            $query->orderBy('name');
        } else {
            // newest = last added or last appointment? "newest" usually means recently added or recently visited.
            // doctor_patients has created_at
            $query->orderByDesc('pivot_created_at');
        }

        $perPage = $request->input('per_page', 10);
        $patients = $query->paginate($perPage);

        // Transform collection
        $data = $patients->through(function ($patient) use ($doctor) {
            // Get last visit from pivot or relationship
            $lastVisit = $patient->pivot->last_appointment_date;

            // Check active pregnancy
            $activePregnancy = $patient->pregnancies()->where('is_active', true)->first();

            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'age' => $patient->age,
                'phone' => $patient->phone,
                'image_url' => $patient->image
                    ? app('App\Utils\ImageManager')->getImageUrl($patient->image, 'profiles', 'uploads')
                    : null,
                'life_stage' => $patient->lifeStage ? [
                    'id' => $patient->lifeStage->id,
                    'name' => $patient->lifeStage->name,
                    'name_ar' => match ($patient->lifeStage->name) {
                        'pre-marriage' => 'ما قبل الزواج',
                        'married-life' => 'الحياة الزوجية',
                        'motherhood' => 'الأمومة',
                        default => $patient->lifeStage->name
                    },
                ] : null,
                'first_visit' => $patient->pivot->first_appointment_date,
                'last_visit' => $lastVisit,
                'total_consultations' => $patient->pivot->total_appointments,
                'has_pregnancy' => (bool) $activePregnancy,
                'pregnancy_week' => $activePregnancy ? (int) $activePregnancy->last_menstrual_period->diffInWeeks(now()) : null,
            ];
        });

        // Get Summary Stats
        $total = $doctor->patients()->count();
        $newThisMonth = $doctor->patients()
            ->wherePivot('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();
        $active = $doctor->patients()
            ->wherePivot('last_appointment_date', '>=', Carbon::now()->subMonths(3))
            ->count();

        return $this->successResponse([
            'patients' => $data,
            'stats' => [
                'total' => $total,
                'new_this_month' => $newThisMonth,
                'active' => $active,
            ],
            'pagination' => [
                'current_page' => $patients->currentPage(),
                'last_page' => $patients->lastPage(),
                'per_page' => $patients->perPage(),
                'total' => $patients->total(),
            ]
        ], 'تم جلب المرضى بنجاح');
    }

    /**
     * Get single patient details
     * GET /api/v1/doctor/patients/{id}
     */
    public function show(Request $request, $id)
    {
        $doctor = $request->user();

        // Ensure patient is related to doctor
        $patient = $doctor->patients()->findOrFail($id);

        // Ensure all relationships
        $patient->load(['profile', 'lifeStage', 'medicalFiles', 'pregnancies']);

        $activePregnancy = $patient->pregnancies()->where('is_active', true)->first();

        // Get consultation history
        $history = $patient->consultations()
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['completed', 'confirmed'])
            ->orderByDesc('date')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'date' => $c->date->format('Y-m-d'),
                    'time' => $c->time,
                    'type' => $c->type,
                    'diagnosis' => $c->doctor_notes, // or $c->prescription?->diagnosis
                    'notes' => $c->patient_notes,
                    'prescription' => $c->prescription ? [
                        'id' => $c->prescription->id,
                        'medications' => $c->prescription->medications,
                        'diagnosis' => $c->prescription->diagnosis,
                    ] : null,
                ];
            });

        // Get Private Notes
        $notes = PatientNote::where('doctor_id', $doctor->id)
            ->where('user_id', $patient->id)
            ->orderByDesc('created_at')
            ->get();

        return $this->successResponse([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'age' => $patient->age,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'image_url' => $patient->image
                    ? app('App\Utils\ImageManager')->getImageUrl($patient->image, 'profiles', 'uploads', 'profiles/default-avatar.png')
                    : url('profiles/default-avatar.png'),
                'life_stage' => $patient->lifeStage,
                'profile' => $patient->profile ? [
                    'height' => $patient->profile->height,
                    'weight' => $patient->profile->weight,
                    'blood_type' => $patient->profile->blood_type,
                    'chronic_diseases' => $patient->profile->chronic_diseases,
                    'allergies' => $patient->profile->allergies,
                    'current_medications' => $patient->profile->current_medications,
                    'medical_history' => $patient->profile->medical_history,
                    'emergency_contact_name' => $patient->profile->emergency_contact_name,
                    'emergency_contact_phone' => $patient->profile->emergency_contact_phone,
                    'date_of_birth' => $patient->profile->date_of_birth,
                ] : null,
                'relationship_with_doctor' => [
                    'first_appointment' => $patient->pivot->first_appointment_date,
                    'last_appointment' => $patient->pivot->last_appointment_date,
                    'total_appointments' => $patient->pivot->total_appointments,
                ],
                'pregnancy' => $activePregnancy ? [
                    'id' => $activePregnancy->id,
                    'current_week' => $activePregnancy->last_menstrual_period ? $activePregnancy->last_menstrual_period->diffInWeeks(now()) : 0,
                    'due_date' => $activePregnancy->due_date ? $activePregnancy->due_date->format('Y-m-d') : null,
                    'lmp' => $activePregnancy->last_menstrual_period,
                ] : null,
                'consultations_history' => $history,
                'medical_files' => $patient->medicalFiles->map(function ($f) {
                    return [
                        'id' => $f->id,
                        'file_name' => $f->file_name,
                        'file_url' => asset('storage/' . $f->file_path),
                        'category' => $f->category ?? 'general',
                        'created_at' => $f->created_at->format('Y-m-d'),
                    ];
                }),
                'notes' => $notes
            ]
        ], 'تم جلب تفاصيل المريض بنجاح');
    }

    /**
     * Add note to patient
     * POST /api/v1/doctor/patients/{id}/notes
     */
    public function addNote(Request $request, $id)
    {
        $doctor = $request->user();

        $request->validate([
            'note' => 'required|string',
            'is_private' => 'boolean'
        ]);

        // Verify patient relationship
        $patient = $doctor->patients()->findOrFail($id);

        $note = PatientNote::create([
            'doctor_id' => $doctor->id,
            'user_id' => $id,
            'note' => $request->note,
            'is_private' => $request->boolean('is_private', true),
        ]);

        return $this->successResponse($note, 'تم إضافة الملاحظة بنجاح', 201);
    }

    /**
     * Get all notes for a patient (by this doctor)
     * GET /api/v1/doctor/patients/{id}/notes
     */
    public function getNotes(Request $request, $id)
    {
        $doctor = $request->user();

        $notes = PatientNote::where('doctor_id', $doctor->id)
            ->where('user_id', $id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(PatientNote $n) => [
                'id' => $n->id,
                'note' => $n->note,
                'is_private' => $n->is_private,
                'created_at' => $n->created_at->setTimezone('Africa/Cairo')->format('d/m/Y - h:i A'),
            ]);

        return $this->successResponse(['notes' => $notes], 'تم جلب الملاحظات بنجاح');
    }

    /**
     * Delete a note
     * DELETE /api/v1/doctor/patients/{id}/notes/{noteId}
     */
    public function deleteNote(Request $request, $id, $noteId)
    {
        $doctor = $request->user();

        $note = PatientNote::where('doctor_id', $doctor->id)
            ->where('user_id', $id)
            ->findOrFail($noteId);

        $note->delete();

        return $this->successResponse(null, 'تم حذف الملاحظة بنجاح');
    }

    /**
     * Download a medical file securely
     * GET /api/v1/doctor/patients/{id}/medical-files/{fileId}/download
     */
    public function downloadMedicalFile(Request $request, $id, $fileId)
    {
        $doctor = $request->user();

        // Verify patient relationship
        $patient = $doctor->patients()->findOrFail($id);

        $file = \App\Models\PatientMedicalFile::where('user_id', $patient->id)
            ->where('id', $fileId)
            ->firstOrFail();

        $path = storage_path('app/public/' . $file->file_path);

        if (!file_exists($path)) {
            return $this->errorResponse('الملف غير موجود بالخادم', 404);
        }

        return response()->download($path, $file->file_name);
    }
}
