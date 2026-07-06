<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    use ApiResponse;

    /**
     * Get all prescriptions for the authenticated patient
     * GET /api/v1/patient/prescriptions
     */
    public function index(Request $request)
    {
        $patient = $request->user();

        $prescriptions = Prescription::where('user_id', $patient->id)
            ->with([
                'doctor:id,name,specialization,image',
                'consultation:id,date,type,doctor_notes',
            ])
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        $data = $prescriptions->through(function ($p) {
            return [
                'id'              => $p->id,
                'consultation_id' => $p->consultation_id,
                'diagnosis'       => $p->diagnosis,
                'notes'           => $p->notes,
                'medications'     => $p->medications,
                'medications_count' => count($p->medications ?? []),
                'consultation'    => $p->consultation ? [
                    'id'   => $p->consultation->id,
                    'date' => $p->consultation->date?->format('Y-m-d'),
                    'type' => $p->consultation->type,
                ] : null,
                'doctor'          => $p->doctor ? [
                    'id'              => $p->doctor->id,
                    'name'            => $p->doctor->name,
                    'specialization'  => $p->doctor->specialization,
                    'image_url'       => $p->doctor->image
                        ? app('App\Utils\ImageManager')->getImageUrl($p->doctor->image, 'profiles', 'uploads')
                        : null,
                ] : null,
                'created_at'      => $p->created_at->format('Y-m-d'),
                'created_at_human' => $p->created_at->diffForHumans(),
            ];
        });

        return $this->successResponse([
            'prescriptions' => $data,
            'pagination' => [
                'current_page' => $prescriptions->currentPage(),
                'last_page'    => $prescriptions->lastPage(),
                'per_page'     => $prescriptions->perPage(),
                'total'        => $prescriptions->total(),
            ],
        ], 'تم جلب الوصفات الطبية بنجاح');
    }

    /**
     * Get single prescription details
     * GET /api/v1/patient/prescriptions/{id}
     */
    public function show(Request $request, $id)
    {
        $patient = $request->user();

        $prescription = Prescription::where('user_id', $patient->id)
            ->with([
                'doctor:id,name,specialization,image,clinic_address',
                'consultation:id,date,type,doctor_notes,patient_notes',
            ])
            ->findOrFail($id);

        return $this->successResponse([
            'id'              => $prescription->id,
            'consultation_id' => $prescription->consultation_id,
            'diagnosis'       => $prescription->diagnosis,
            'notes'           => $prescription->notes,
            'medications'     => $prescription->medications,
            'consultation'    => $prescription->consultation ? [
                'id'            => $prescription->consultation->id,
                'date'          => $prescription->consultation->date?->format('Y-m-d'),
                'type'          => $prescription->consultation->type,
                'patient_notes' => $prescription->consultation->patient_notes,
            ] : null,
            'doctor'          => $prescription->doctor ? [
                'id'             => $prescription->doctor->id,
                'name'           => $prescription->doctor->name,
                'specialization' => $prescription->doctor->specialization,
                'clinic_address' => $prescription->doctor->clinic_address,
                'image_url'      => $prescription->doctor->image
                    ? app('App\Utils\ImageManager')->getImageUrl($prescription->doctor->image, 'profiles', 'uploads')
                    : null,
            ] : null,
            'patient'         => [
                'id'   => $patient->id,
                'name' => $patient->name,
                'age'  => $patient->age ?? null,
            ],
            'created_at'      => $prescription->created_at->format('Y-m-d'),
            'created_at_formatted' => $prescription->created_at->format('d/m/Y'),
        ], 'تم جلب الوصفة الطبية بنجاح');
    }

    /**
     * Get prescription by consultation ID
     * GET /api/v1/patient/consultations/{id}/prescription
     */
    public function byConsultation(Request $request, $consultationId)
    {
        $patient = $request->user();

        $prescription = Prescription::where('user_id', $patient->id)
            ->where('consultation_id', $consultationId)
            ->with([
                'doctor:id,name,specialization,image,clinic_address',
                'consultation:id,date,type,doctor_notes,patient_notes',
            ])
            ->firstOrFail();

        return $this->successResponse([
            'id'              => $prescription->id,
            'consultation_id' => $prescription->consultation_id,
            'diagnosis'       => $prescription->diagnosis,
            'notes'           => $prescription->notes,
            'medications'     => $prescription->medications,
            'consultation'    => $prescription->consultation ? [
                'id'            => $prescription->consultation->id,
                'date'          => $prescription->consultation->date?->format('Y-m-d'),
                'type'          => $prescription->consultation->type,
                'patient_notes' => $prescription->consultation->patient_notes,
            ] : null,
            'doctor'          => $prescription->doctor ? [
                'id'             => $prescription->doctor->id,
                'name'           => $prescription->doctor->name,
                'specialization' => $prescription->doctor->specialization,
                'clinic_address' => $prescription->doctor->clinic_address,
                'image_url'      => $prescription->doctor->image
                    ? app('App\Utils\ImageManager')->getImageUrl($prescription->doctor->image, 'profiles', 'uploads')
                    : null,
            ] : null,
            'patient'         => [
                'id'   => $patient->id,
                'name' => $patient->name,
                'age'  => $patient->age ?? null,
            ],
            'created_at'      => $prescription->created_at->format('Y-m-d'),
            'created_at_formatted' => $prescription->created_at->format('d/m/Y'),
        ], 'تم جلب الوصفة الطبية بنجاح');
    }
}
