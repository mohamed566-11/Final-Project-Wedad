<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\JoinUs;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class JoinRequestController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Get all join requests
     * GET /api/v1/admin/join-requests
     */
    public function index(Request $request)
    {
        $query = JoinUs::query();

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Sort by newest first
        $query->orderByDesc('created_at');

        $requests = $query->paginate(15);

        // Get statistics
        $stats = [
            'total' => JoinUs::count(),
            'pending' => JoinUs::where('status', 'pending')->count(),
            'contacted' => JoinUs::where('status', 'contacted')->count(),
            'approved' => JoinUs::where('status', 'approved')->count(),
            'rejected' => JoinUs::where('status', 'rejected')->count(),
        ];

        // Transform requests data
        $transformedRequests = $requests->getCollection()->map(function ($req) {
            return $this->transformRequest($req);
        });

        return $this->successResponse([
            'requests' => $transformedRequests,
            'stats' => $stats,
            'pagination' => [
                'total' => $requests->total(),
                'per_page' => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific join request
     * GET /api/v1/admin/join-requests/{id}
     */
    public function show($id)
    {
        $request = JoinUs::find($id);

        if (!$request) {
            return $this->errorResponse('الطلب غير موجود', 404);
        }

        return $this->successResponse([
            'request' => $this->transformRequest($request),
        ]);
    }

    /**
     * Update join request status
     * PUT /api/v1/admin/join-requests/{id}/status
     */
    public function updateStatus(Request $httpRequest, $id)
    {
        $joinRequest = JoinUs::find($id);

        if (!$joinRequest) {
            return $this->errorResponse('الطلب غير موجود', 404);
        }

        $httpRequest->validate([
            'status' => 'required|in:pending,contacted,approved,rejected',
            'notes' => 'nullable|string|max:1000',
        ], [
            'status.required' => 'الحالة مطلوبة',
            'status.in' => 'الحالة غير صحيحة',
        ]);

        $joinRequest->update([
            'status' => $httpRequest->status,
            'notes' => $httpRequest->notes,
        ]);

        if (in_array($httpRequest->status, ['contacted', 'approved', 'rejected'])) {
            $doctor = Doctor::where('email', $joinRequest->email)->first();
            $generatedPassword = null;

            if ($httpRequest->status === 'approved' && !$doctor) {
                $generatedPassword = \Illuminate\Support\Str::random(10);
                $doctor = Doctor::create([
                    'name' => $joinRequest->name,
                    'email' => $joinRequest->email,
                    'phone' => $joinRequest->phone,
                    'password' => \Illuminate\Support\Facades\Hash::make($generatedPassword),
                    'specialization' => $joinRequest->specialty,
                    'license_number' => $joinRequest->license_number,
                    'consultation_price' => $joinRequest->consultation_price,
                    'verification_status' => 'verified',
                    'is_active' => true,
                ]);
            }

            if ($doctor) {
                if ($httpRequest->status === 'approved' && $generatedPassword) {
                    $message = "مبروك! تم قبول طلب انضمامك. بيانات الدخول:\nالبريد الإلكتروني: {$doctor->email}\nكلمة المرور: {$generatedPassword}\n(يرجى تغيير كلمة المرور بعد تسجيل الدخول)";
                    $this->notificationService->create(
                        $doctor,
                        'join_request.approved',
                        'تم قبول طلب الانضمام',
                        $message,
                        ['status' => 'approved']
                    );
                } else {
                    $this->notificationService->notifyJoinRequestStatusChanged($doctor, $httpRequest->status);
                }
            }
            Log::info("Join request #{$joinRequest->id} status updated to {$httpRequest->status}");
        }

        return $this->successResponse([
            'request' => $this->transformRequest($joinRequest),
        ], 'تم تحديث حالة الطلب بنجاح');
    }

    /**
     * Delete join request
     * DELETE /api/v1/admin/join-requests/{id}
     */
    public function destroy($id)
    {
        $request = JoinUs::find($id);

        if (!$request) {
            return $this->errorResponse('الطلب غير موجود', 404);
        }

        $request->delete();

        return $this->successResponse(null, 'تم حذف الطلب بنجاح');
    }

    /**
     * Transform request data
     */
    private function transformRequest(JoinUs $request): array
    {
        return [
            'id' => $request->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'specialty' => $request->specialty,
            'specialty_ar' => TranslationHelper::specialization($request->specialty),
            'license_number' => $request->license_number,
            'consultation_price' => $request->consultation_price,
            'status' => $request->status,
            'status_ar' => TranslationHelper::joinRequestStatus($request->status),
            'notes' => $request->notes,
            'ip_address' => $request->ip_address,
            'submitted_at' => $request->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
