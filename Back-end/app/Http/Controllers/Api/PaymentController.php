<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Payment;
use App\Services\PaymobService;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PaymentController extends Controller
{
    use ApiResponse;

    protected $paymobService;
    protected $notificationService;

    public function __construct(PaymobService $paymobService, NotificationService $notificationService)
    {
        $this->paymobService = $paymobService;
        $this->notificationService = $notificationService;
    }

    /**
     * Handle Paymob webhook callback
     * POST /api/v1/payments/paymob/callback
     */
    public function paymobCallback(Request $request)
    {
        Log::info('Paymob Callback Received', $request->all());

        // Verify HMAC signature
        if (!$this->paymobService->verifyCallback($request->all())) {
            Log::warning('Paymob Callback: Invalid HMAC');
            return response()->json(['status' => 'invalid_signature'], 403);
        }

        // Process callback
        $result = $this->paymobService->processCallback($request->all());

        if (!$result['consultation_id']) {
            Log::warning('Paymob Callback: Could not find consultation ID');
            return response()->json(['status' => 'consultation_not_found'], 400);
        }

        $consultation = Consultation::find($result['consultation_id']);

        if (!$consultation) {
            Log::warning('Paymob Callback: Consultation not found', ['id' => $result['consultation_id']]);
            return response()->json(['status' => 'consultation_not_found'], 404);
        }

        // Create or update payment record
        $payment = Payment::updateOrCreate(
            ['consultation_id' => $consultation->id],
            [
                'user_id' => $consultation->user_id,
                'transaction_id' => $result['transaction_id'],
                'amount' => $result['amount'],
                'platform_fee' => $consultation->platform_commission,
                'doctor_amount' => $consultation->price - $consultation->platform_commission,
                'status' => $result['success'] ? 'completed' : 'failed',
                'payment_method' => $result['payment_method'] ?? 'paymob_card',
                'paymob_response' => $request->all(),
                'paid_at' => $result['success'] ? Carbon::now() : null,
                'failure_reason' => $result['error_message'],
            ]
        );

        // Update consultation status if payment successful
        if ($result['success']) {
            $consultation->update(['status' => 'confirmed']);

            // Send confirmation notifications to patient and doctor
            $this->notificationService->notifyPaymentSuccess(
                $consultation->patient,
                $consultation->doctor,
                $consultation
            );

            Log::info('Payment successful for consultation', ['id' => $consultation->id]);
        } else {
            Log::warning('Payment failed for consultation', [
                'id' => $consultation->id,
                'error' => $result['error_message'],
            ]);
        }

        return response()->json(['status' => 'received']);
    }

    /**
     * Handle Paymob redirect callback (for frontend)
     * GET /api/v1/payments/paymob/redirect
     */
    public function paymobRedirect(Request $request)
    {
        $successParam = $request->boolean('success');
        $merchantOrderId = $request->input('merchant_order_id');
        $transactionId = $request->input('id');

        // Extract consultation ID from merchant_order_id
        preg_match('/consultation_(\d+)_/', $merchantOrderId ?? '', $matches);
        $consultationId = $matches[1] ?? null;

        if (!$consultationId) {
            Log::error('Paymob Redirect: Missing consultation ID', ['params' => $request->all()]);
            return redirect()->away(config('app.frontend_url') . '/payment/error?reason=invalid_order');
        }

        $consultation = Consultation::find($consultationId);

        if ($consultation && $consultation->status === 'pending') {

            $paymentVerified = false;
            $rawData = $request->all();
            $amountCents = (int)($consultation->price * 100);

            // ─── Strategy 1: Verify via HMAC (local, no external call) ───
            if ($transactionId && $this->paymobService->verifyRedirectHmac($request->all())) {
                // HMAC is valid — Paymob signed this response, trust it
                $paymentVerified = filter_var($request->input('success'), FILTER_VALIDATE_BOOLEAN);
                $amountCents = (int)($request->input('amount_cents', $amountCents));
                Log::info('Paymob Redirect: HMAC verified successfully', ['consultation_id' => $consultationId, 'success' => $paymentVerified]);
            }
            // ─── Strategy 2: Fallback — verify via Paymob API ────────────
            elseif ($transactionId) {
                Log::info('Paymob Redirect: No valid HMAC, trying API verification', ['transaction_id' => $transactionId]);
                $statusCheck = $this->paymobService->checkPaymentStatus($transactionId);
                $paymentVerified = $statusCheck['success'];
                $amountCents = $statusCheck['amount_cents'] ?? $amountCents;
                $rawData = $statusCheck['raw'] ?? $rawData;
                Log::info('Paymob Redirect: API check result', ['verified' => $paymentVerified]);
            }

            if ($paymentVerified) {
                // Save payment and confirm consultation
                Payment::updateOrCreate(
                    ['consultation_id' => $consultation->id],
                    [
                        'user_id'         => $consultation->user_id,
                        'transaction_id'  => $transactionId,
                        'amount'          => $amountCents / 100,
                        'platform_fee'    => $consultation->platform_commission,
                        'doctor_amount'   => $consultation->price - $consultation->platform_commission,
                        'status'          => 'completed',
                        'payment_method'  => $request->input('source_data_type') === 'wallet' ? 'paymob_wallet' : 'paymob_card',
                        'paymob_response' => $rawData,
                        'paid_at'         => Carbon::now(),
                    ]
                );

                $consultation->update(['status' => 'confirmed']);

                try {
                    $this->notificationService->notifyPaymentSuccess(
                        $consultation->patient,
                        $consultation->doctor,
                        $consultation
                    );
                } catch (\Exception $e) {
                    Log::warning('Payment notification failed: ' . $e->getMessage());
                }

                Log::info('Payment confirmed for consultation', ['id' => $consultation->id]);
                $successParam = true;

            } elseif ($transactionId) {
                // Definitively failed payment
                Payment::updateOrCreate(
                    ['consultation_id' => $consultation->id],
                    [
                        'user_id'        => $consultation->user_id,
                        'transaction_id' => $transactionId,
                        'amount'         => $consultation->price,
                        'status'         => 'failed',
                        'failure_reason' => 'Payment failed during redirect verification',
                    ]
                );
                $successParam = false;
            }
        }

        if ($successParam) {
            return redirect()->away(
                config('app.frontend_url') . "/patient/consultations/{$consultationId}?payment=success"
            );
        } else {
            return redirect()->away(
                config('app.frontend_url') . "/patient/consultations/{$consultationId}?payment=failed"
            );
        }
    }

    /**
     * Get patient's payment history
     * GET /api/v1/patient/payments
     */
    public function patientPayments(Request $request)
    {
        $patient = $request->user();

        $payments = Payment::where('user_id', $patient->id)
            ->with('consultation.doctor')
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        $formattedPayments = $payments->getCollection()->map(function ($payment) {
            return [
                'id' => $payment->id,
                'transaction_id' => $payment->transaction_id,
                'amount' => (float) $payment->amount,
                'status' => $payment->status,
                'status_ar' => TranslationHelper::paymentStatus($payment->status),
                'payment_method' => $payment->payment_method,
                'paid_at' => $payment->paid_at?->format('Y-m-d H:i:s'),
                'consultation' => [
                    'id' => $payment->consultation->id,
                    'date' => $payment->consultation->date->format('Y-m-d'),
                    'doctor_name' => $payment->consultation->doctor->name,
                ],
                'created_at' => $payment->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return $this->successResponse([
            'payments' => $formattedPayments,
            'pagination' => [
                'total' => $payments->total(),
                'per_page' => $payments->perPage(),
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
            ],
        ], 'تم جلب سجل المدفوعات بنجاح');
    }

    /**
     * Request refund for a payment
     * POST /api/v1/patient/payments/{id}/request-refund
     */
    public function requestRefund(Request $request, $id)
    {
        $patient = $request->user();

        $payment = Payment::where('user_id', $patient->id)
            ->where('status', 'completed')
            ->findOrFail($id);

        $consultation = $payment->consultation;

        // Check if consultation can be refunded
        $consultationDateTime = Carbon::parse($consultation->date . ' ' . $consultation->time);
        $hoursUntil = Carbon::now()->diffInHours($consultationDateTime, false);

        if ($hoursUntil < 24 && $hoursUntil > 0) {
            return $this->errorResponse(
                'لا يمكن استرجاع المبلغ قبل أقل من 24 ساعة من الموعد',
                400
            );
        }

        if ($consultation->status === 'completed') {
            return $this->errorResponse('لا يمكن استرجاع المبلغ بعد اكتمال الاستشارة', 400);
        }

        // Process refund
        $refunded = $this->paymobService->refund($payment->transaction_id, $payment->amount);

        if ($refunded) {
            $payment->update(['status' => 'refunded']);
            $consultation->update(['status' => 'cancelled_by_patient']);

            return $this->successResponse([
                'payment' => [
                    'id' => $payment->id,
                    'status' => 'refunded',
                ],
            ], 'تم استرجاع المبلغ بنجاح');
        }

        return $this->errorResponse('فشل في استرجاع المبلغ، يرجى المحاولة لاحقاً', 500);
    }
}
