<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientMedicalFile;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PatientMedicalFileController extends Controller
{
    use ApiResponse;

    /**
     * Get all medical files for the authenticated patient
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $files = PatientMedicalFile::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'file_name' => $file->file_name,
                    'file_url' => Storage::disk('public')->url($file->file_path),
                    'file_size' => $file->file_size,
                    'file_type' => $file->file_type,
                    'category' => $file->category,
                    'description' => $file->description,
                    'created_at' => $file->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return $this->successResponse($files, 'تم جلب الملفات الطبية بنجاح');
    }

    /**
     * Upload a new medical file
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:10240', // 10MB max
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ], [
            'file.required' => 'يرجى اختيار ملف للرفع.',
            'file.file' => 'الملف المرفوع غير صالح.',
            'file.mimes' => 'يجب أن يكون الملف من نوع: jpeg, png, jpg, pdf.',
            'file.max' => 'يجب ألا يتجاوز حجم الملف 10 ميجابايت.',
        ]);

        try {
            $user = $request->user();
            $file = $request->file('file');

            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $fileType = $file->getMimeType();

            // Generate unique path with UUID filename
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs(
                'medical-files/' . $user->id,
                $filename,
                'public'
            );

            $medicalFile = PatientMedicalFile::create([
                'user_id' => $user->id,
                'file_name' => $fileName,
                'file_path' => $path,
                'file_size' => $fileSize,
                'file_type' => $fileType,
                'category' => $request->category ?? 'عام',
                'description' => $request->description,
                'file_date' => now(),
            ]);

            return $this->successResponse([
                'id' => $medicalFile->id,
                'file_name' => $medicalFile->file_name,
                'file_url' => Storage::disk('public')->url($medicalFile->file_path),
                'category' => $medicalFile->category,
                'created_at' => $medicalFile->created_at->format('Y-m-d H:i:s')
            ], 'تم رفع الملف الطبي بنجاح', 201);

        } catch (\Exception $e) {
            Log::error('Medical file upload error: ' . $e->getMessage());
            return $this->errorResponse('حدث خطأ أثناء رفع الملف، يرجى المحاولة لاحقاً', 500);
        }
    }

    /**
     * Delete a medical file
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // Let ModelNotFoundException bubble up as a clean 404
        $file = PatientMedicalFile::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        try {

            // Delete physically
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }

            // Delete from database
            $file->delete();

            return $this->successResponse(null, 'تم حذف الملف الطبي بنجاح');

        } catch (\Exception $e) {
            Log::error('Medical file delete error: ' . $e->getMessage());
            return $this->errorResponse('حدث خطأ أثناء حذف الملف، يرجى المحاولة لاحقاً', 500);
        }
    }

    /**
     * Download a medical file securely
     */
    public function download(Request $request, $id)
    {
        $user = $request->user();

        $file = PatientMedicalFile::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        if (!Storage::disk('public')->exists($file->file_path)) {
            return $this->errorResponse('الملف غير موجود بالخادم', 404);
        }

        $path = Storage::disk('public')->path($file->file_path);

        return response()->download($path, $file->file_name);
    }
}
