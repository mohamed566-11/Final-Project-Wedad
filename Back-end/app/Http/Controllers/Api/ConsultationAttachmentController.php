<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\ConsultationAttachment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConsultationAttachmentController extends Controller
{
    use ApiResponse;

    /**
     * Upload a file to a consultation
     * POST /api/v1/{guard}/consultations/{id}/attachments
     */
    public function upload(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'category' => 'required|in:lab_result,ultrasound,x_ray,prescription,medical_report,other',
            'description' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $guard = $this->detectGuard($request);

        // Find consultation and verify ownership
        $consultation = $this->findConsultation($id, $user, $guard);
        if (!$consultation) {
            return $this->errorResponse('الاستشارة غير موجودة أو ليس لديك صلاحية الوصول', 404);
        }

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $originalName = $file->getClientOriginalName();
        $storedName = Str::uuid() . '.' . $extension;
        $folderPath = 'consultation-attachments/' . $id;

        // Store the file
        $file->storeAs($folderPath, $storedName, 'public');
        $relativePath = $folderPath . '/' . $storedName;

        $attachment = ConsultationAttachment::create([
            'consultation_id' => $consultation->id,
            'user_id' => $user->id,
            'file_name' => $storedName,
            'file_path' => $relativePath,
            'original_name' => $originalName,
            'file_type' => $extension,
            'file_size' => $file->getSize(),
            'category' => $request->category,
            'description' => $request->description,
            'uploaded_by' => $guard,
        ]);

        return $this->successResponse([
            'attachment' => $this->formatAttachment($attachment),
        ], 'تم رفع الملف بنجاح', 201);
    }

    /**
     * List all attachments for a consultation
     * GET /api/v1/{guard}/consultations/{id}/attachments
     */
    public function index(Request $request, $id)
    {
        $user = $request->user();
        $guard = $this->detectGuard($request);

        $consultation = $this->findConsultation($id, $user, $guard);
        if (!$consultation) {
            return $this->errorResponse('الاستشارة غير موجودة', 404);
        }

        $attachments = ConsultationAttachment::where('consultation_id', $consultation->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(ConsultationAttachment $a) => $this->formatAttachment($a));

        return $this->successResponse([
            'attachments' => $attachments,
            'total' => $attachments->count(),
        ], 'تم جلب المرفقات بنجاح');
    }

    /**
     * Delete an attachment
     * DELETE /api/v1/{guard}/consultations/{id}/attachments/{attachmentId}
     */
    public function destroy(Request $request, $id, $attachmentId)
    {
        $user = $request->user();
        $guard = $this->detectGuard($request);

        $consultation = $this->findConsultation($id, $user, $guard);
        if (!$consultation) {
            return $this->errorResponse('الاستشارة غير موجودة', 404);
        }

        $attachment = ConsultationAttachment::where('consultation_id', $consultation->id)
            ->where('id', $attachmentId)
            ->first();

        if (!$attachment) {
            return $this->errorResponse('الملف غير موجود', 404);
        }

        // Only the uploader or doctor can delete
        $canDelete = ($attachment->user_id === $user->id)
            || ($guard === 'doctor' && $consultation->doctor_id === $user->id);

        if (!$canDelete) {
            return $this->errorResponse('ليس لديك صلاحية حذف هذا الملف', 403);
        }

        // Remove from storage
        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return $this->successResponse(null, 'تم حذف الملف بنجاح');
    }

    /**
     * Download an attachment securely
     * GET /api/v1/{guard}/consultations/{id}/attachments/{attachmentId}/download
     */
    public function download(Request $request, $id, $attachmentId)
    {
        $user = $request->user();
        $guard = $this->detectGuard($request);

        $consultation = $this->findConsultation($id, $user, $guard);
        if (!$consultation) {
            return $this->errorResponse('الاستشارة غير موجودة', 404);
        }

        $attachment = ConsultationAttachment::where('consultation_id', $consultation->id)
            ->where('id', $attachmentId)
            ->first();

        if (!$attachment) {
            return $this->errorResponse('الملف غير موجود', 404);
        }

        $path = storage_path('app/public/' . $attachment->file_path);

        if (!file_exists($path)) {
            return $this->errorResponse('الملف غير موجود بالخادم', 404);
        }

        return response()->download($path, $attachment->original_name);
    }

    // ─── Helpers ───────────────────────────────────────────

    private function detectGuard(Request $request): string
    {
        // Check which guard authenticated the user
        if (auth('doctor')->check() && auth('doctor')->id() === $request->user()->id) {
            return 'doctor';
        }
        return 'patient';
    }

    private function findConsultation($id, $user, string $guard)
    {
        $query = Consultation::findOrFail($id);

        if ($guard === 'doctor') {
            return $query->doctor_id === $user->id ? $query : null;
        }

        // Patient
        return $query->user_id === $user->id ? $query : null;
    }

    private function formatAttachment(ConsultationAttachment $a): array
    {
        return [
            'id' => $a->id,
            'file_name' => $a->original_name,
            'file_type' => $a->file_type,
            'file_size' => $a->file_size,
            'file_size_formatted' => $a->file_size_formatted,
            'category' => $a->category,
            'category_label' => $a->category_label,
            'description' => $a->description,
            'uploaded_by' => $a->uploaded_by,
            'is_image' => $a->isImage(),
            'url' => asset('storage/' . $a->file_path),
            'created_at' => $a->created_at->format('Y-m-d H:i'),
        ];
    }
}
