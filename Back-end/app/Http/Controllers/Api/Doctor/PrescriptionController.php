<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    use ApiResponse;

    /**
     * Get all prescriptions issued by the authenticated doctor
     * GET /api/v1/doctor/prescriptions
     */
    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Prescription::where('doctor_id', $doctor->id)
            ->with([
                'patient:id,name,image',
                'consultation:id,date,type',
            ]);

        // Filter by patient
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $prescriptions = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        $data = $prescriptions->through(function ($p) {
            return [
                'id'              => $p->id,
                'consultation_id' => $p->consultation_id,
                'diagnosis'       => $p->diagnosis,
                'medications'     => $p->medications,
                'medications_count' => count($p->medications ?? []),
                'consultation'    => $p->consultation ? [
                    'id'   => $p->consultation->id,
                    'date' => $p->consultation->date?->format('Y-m-d'),
                    'type' => $p->consultation->type,
                ] : null,
                'patient'         => $p->patient ? [
                    'id'        => $p->patient->id,
                    'name'      => $p->patient->name,
                    'image_url' => $p->patient->image
                        ? app('App\Utils\ImageManager')->getImageUrl($p->patient->image, 'profiles', 'uploads')
                        : null,
                ] : null,
                'created_at'      => $p->created_at->format('Y-m-d'),
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
     * GET /api/v1/doctor/prescriptions/{id}
     */
    public function show(Request $request, $id)
    {
        $doctor = $request->user();

        $prescription = Prescription::where('doctor_id', $doctor->id)
            ->with([
                'patient:id,name,image',
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
                'doctor_notes'  => $prescription->consultation->doctor_notes,
                'patient_notes' => $prescription->consultation->patient_notes,
            ] : null,
            'patient'         => $prescription->patient ? [
                'id'        => $prescription->patient->id,
                'name'      => $prescription->patient->name,
                'image_url' => $prescription->patient->image
                    ? app('App\Utils\ImageManager')->getImageUrl($prescription->patient->image, 'profiles', 'uploads')
                    : null,
            ] : null,
            'doctor'          => [
                'id'             => $doctor->id,
                'name'           => $doctor->name,
                'specialization' => $doctor->specialization,
                'clinic_address' => $doctor->clinic_address,
            ],
            'created_at'      => $prescription->created_at->format('Y-m-d'),
            'created_at_formatted' => $prescription->created_at->format('d/m/Y'),
        ], 'تم جلب الوصفة الطبية بنجاح');
    }
}
