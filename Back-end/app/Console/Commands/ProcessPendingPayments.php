<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\Consultation;
use App\Services\PaymobService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessPendingPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:process-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check status of pending payments with payment gateway';

    /**
     * Execute the console command.
     */
    public function handle(PaymobService $paymobService): int
    {
        $this->info('Processing pending payments...');

        // Get pending payments older than 5 minutes (give time for callbacks)
        $pendingPayments = Payment::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subMinutes(5))
            ->where('created_at', '>', Carbon::now()->subHours(24)) // Only last 24 hours
            ->get();

        $this->info("Found {$pendingPayments->count()} pending payments to check.");

        $processed = 0;
        $confirmed = 0;
        $failed = 0;

        foreach ($pendingPayments as $payment) {
            try {
                $this->line("Checking payment #{$payment->id}...");

                // Check payment status with Paymob
                $status = $paymobService->checkPaymentStatus($payment->transaction_id);

                if ($status['success']) {
                    // Payment was successful
                    $payment->update([
                        'status' => 'completed',
                        'paid_at' => now(),
                        'gateway_response' => $status,
                    ]);

                    // Confirm the consultation
                    $payment->consultation->update(['status' => 'confirmed']);

                    $confirmed++;
                    $this->info("Payment #{$payment->id} confirmed.");
                } elseif ($status['failed']) {
                    // Payment failed
                    $payment->update([
                        'status' => 'failed',
                        'gateway_response' => $status,
                    ]);

                    // Cancel the consultation
                    $payment->consultation->update([
                        'status' => 'cancelled_by_patient',
                        'cancellation_reason' => 'فشل الدفع',
                    ]);

                    $failed++;
                    $this->warn("Payment #{$payment->id} failed.");
                }

                $processed++;
            } catch (\Exception $e) {
                Log::error("Error processing payment #{$payment->id}: " . $e->getMessage());
                $this->error("Error processing payment #{$payment->id}: " . $e->getMessage());
            }
        }

        $this->info("Processed: {$processed}, Confirmed: {$confirmed}, Failed: {$failed}");

        return Command::SUCCESS;
    }
}
