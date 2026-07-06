<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DoctorFinancialController extends Controller
{
    use ApiResponse;

    /**
     * Get financial dashboard stats
     */
    public function index(Request $request)
    {
        $doctor = $request->user();

        // 1. Total Earnings (Lifetime) - Includes Cash & Online
        $totalEarnings = Payment::whereHas('consultation', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })
        ->where('status', 'completed')
        ->sum('doctor_amount');

        // 2. Earnings This Month
        $monthEarnings = Payment::whereHas('consultation', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })
        ->where('status', 'completed')
        ->where('paid_at', '>=', Carbon::now()->startOfMonth())
        ->sum('doctor_amount');

        // 3. Online Earnings (Held by Platform)
        $onlineEarnings = Payment::whereHas('consultation', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })
        ->where('status', 'completed')
        ->whereIn('payment_method', ['paymob_card', 'paymob_wallet', 'paymob_installments'])
        ->sum('doctor_amount');

        // 4. Withdrawable Balance 
        // Logic: Online Earnings - (Processed Payouts). 
        // Since Payouts table doesn't exist yet, we stick to Online Earnings as 'Available'
        $withdrawableBalance = $onlineEarnings; 

        // 5. Last Transaction
        $lastTransaction = Payment::whereHas('consultation', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })
        ->where('status', 'completed')
        ->latest('paid_at')
        ->first();

        return $this->successResponse([
            'total_earnings' => round($totalEarnings, 2),
            'month_earnings' => round($monthEarnings, 2),
            'withdrawable_balance' => round($withdrawableBalance, 2),
            'online_earnings' => round($onlineEarnings, 2),
            'next_payout_date' => Carbon::now()->endOfMonth()->addDay()->format('Y-m-d'), 
            'last_transaction_date' => $lastTransaction ? $lastTransaction->paid_at->format('Y-m-d') : null,
        ], 'تم جلب الإحصائيات المالية بنجاح');
    }

    /**
     * Get transactions list
     */
    public function transactions(Request $request)
    {
        $doctor = $request->user();
        
        $query = Payment::whereHas('consultation', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })
        ->with(['consultation.patient'])
        ->where('status', 'completed'); // Only show completed transactions in financials

        // Filter by date
        if ($request->filled('date_from')) {
            $query->whereDate('paid_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('paid_at', '<=', $request->date_to);
        }

        $query->orderByDesc('paid_at');

        $transactions = $query->paginate($request->input('per_page', 10));

        $data = $transactions->through(function ($payment) {
            $isCash = $payment->payment_method === 'cash';
            
            return [
                'id' => $payment->id,
                'transaction_id' => $payment->transaction_id ?? 'CASH-' . $payment->id,
                'amount' => $payment->doctor_amount,
                'total_amount' => $payment->amount,
                'currency' => 'EGP',
                'type' => $isCash ? 'cash' : 'online',
                'type_label' => $isCash ? 'نقدي' : 'إلكتروني',
                'status' => $payment->status,
                'consultation_id' => $payment->consultation_id,
                'patient_name' => $payment->consultation->patient->name ?? 'مريض غير معروف',
                'date' => $payment->paid_at ? $payment->paid_at->format('Y-m-d') : $payment->created_at->format('Y-m-d'),
                'time' => $payment->paid_at ? $payment->paid_at->format('H:i') : $payment->created_at->format('H:i'),
            ];
        });

        return $this->successResponse($data, 'تم جلب المعاملات بنجاح');
    }

    /**
     * Get payout requests history
     */
    public function payouts(Request $request)
    {
        $doctor = $request->user();

        $payouts = \App\Models\PayoutRequest::where('doctor_id', $doctor->id)
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        // Use custom transformation or return as is
        return $this->successResponse($payouts, 'تم جلب سجل السحوبات بنجاح');
    }

    /**
     * Request a payout
     */
    public function requestPayout(Request $request)
    {
        $doctor = $request->user();

        $request->validate([
            'amount' => 'required|numeric|min:100', // Min 100 EGP
            'method' => 'required|in:bank_transfer,wallet,cash',
            'details' => 'required_unless:method,cash|array',
        ], [
            'amount.min' => 'الحد الأدنى للسحب هو 100 جنيه',
            'details.required_unless' => 'بيانات التحويل مطلوبة',
        ]);

        // Calculate Available Balance Logic (Reused)
        $onlineEarnings = Payment::whereHas('consultation', function ($q) use ($doctor) {
            $q->where('doctor_id', $doctor->id);
        })
        ->where('status', 'completed')
        ->whereIn('payment_method', ['paymob_card', 'paymob_wallet', 'paymob_installments'])
        ->sum('doctor_amount');

        // Subtract pending/processed payouts
        $totalRequested = \App\Models\PayoutRequest::where('doctor_id', $doctor->id)
            ->whereIn('status', ['pending', 'approved', 'processed'])
            ->sum('amount');

        $availableBalance = $onlineEarnings - $totalRequested;

        if ($request->amount > $availableBalance) {
            return $this->errorResponse('رصيدك الحالي غير كافٍ لإتمام هذه المعاملة', 400);
        }

        $payout = \App\Models\PayoutRequest::create([
            'doctor_id' => $doctor->id,
            'amount' => $request->amount,
            'method' => $request->method,
            'details' => $request->details,
            'status' => 'pending',
        ]);

        return $this->successResponse($payout, 'تم إرسال طلب السحب بنجاح', 201);
    }
}
