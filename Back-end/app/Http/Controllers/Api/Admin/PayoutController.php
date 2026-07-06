<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayoutRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayoutController extends Controller
{
    use ApiResponse;

    /**
     * Get list of payout requests
     * GET /api/v1/admin/payouts
     */
    public function index(Request $request)
    {
        $query = PayoutRequest::with('doctor');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by doctor
        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        // Search by reference or doctor name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhereHas('doctor', function ($dq) use ($search) {
                      $dq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $payouts = $query->orderByDesc('created_at')->paginate($request->input('per_page', 20));

        return $this->successResponse($payouts);
    }

    /**
     * Show payout details
     * GET /api/v1/admin/payouts/{id}
     */
    public function show($id)
    {
        $payout = PayoutRequest::with('doctor')->findOrFail($id);
        return $this->successResponse($payout);
    }

    /**
     * Process payout request (Approve/Reject)
     * PUT /api/v1/admin/payouts/{id}/process
     */
    public function process(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:processed,rejected', // approved = processed usually
            'admin_note' => 'nullable|string|max:1000',
            'transaction_reference' => 'nullable|string|max:255', // If bank transfer ref
        ]);

        $payout = PayoutRequest::findOrFail($id);

        if ($payout->status !== 'pending') {
            return $this->errorResponse('هذا الطلب تمت معالجته مسبقاً', 400);
        }

        DB::beginTransaction();
        try {
            $payout->update([
                'status' => $request->status,
                'admin_note' => $request->admin_note,
                'reference_no' => $request->transaction_reference, // Update reference if provided
                'processed_at' => now(),
            ]);

            // If rejected, we might need to "refund" the balance to the doctor's "available balance" logic.
            // Currently, available balance is calculated dynamically: Total Earnings - (Pending + Processed Payouts).
            // If status is 'rejected', it is NO LONGER 'pending' or 'processed'.
            // So logic in DoctorFinancialController::availableBalance should automatically handle it 
            // provided it filters by whereIn('status', ['pending', 'processed', 'approved']).
            
            // Let's verify DoctorFinancialController logic later. 
            // If it subtracts "Pending + Approved", then "Rejected" will NOT be subtracted, effectively returning money to balance.
            
            // Send Notification
            // $payout->doctor->notify(new \App\Notifications\PayoutStatusNotification($payout));
            // Assuming Doctor model uses Notifiable trait, or use Notification facade
            try {
                $payout->doctor->notify(new \App\Notifications\PayoutStatusNotification($payout));
            } catch (\Exception $e) {
                // Log notification failure but don't fail transaction
                \Illuminate\Support\Facades\Log::error("Failed to send payout notification: " . $e->getMessage());
            }

            DB::commit();

            return $this->successResponse($payout, 'تم تحديث حالة الطلب بنجاح');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payout processing error: ' . $e->getMessage());
            return $this->errorResponse('حدث خطأ أثناء المعالجة، يرجى المحاولة لاحقاً', 500);
        }
    }
}
