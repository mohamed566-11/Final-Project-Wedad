<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Consultation;
use App\Models\Payment;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    public function run()
    {
        DB::transaction(function () {
            $consultations = Consultation::whereNotNull('price')->get();

            foreach ($consultations as $consultation) {
                // Ensure platform commission isn't null. Default to 15%.
                $commission = $consultation->platform_commission ?? ($consultation->price * 0.15);

                Payment::updateOrCreate(
                    [
                        'consultation_id' => $consultation->id,
                    ],
                    [
                        'user_id' => $consultation->user_id,
                        'transaction_id' => 'TXN-' . strtoupper(Str::random(12)),
                        'amount' => $consultation->price,
                        'platform_fee' => $commission,
                        'doctor_amount' => $consultation->price - $commission,
                        'status' => $consultation->status === 'completed' ? 'completed' : 'pending',
                        'payment_method' => collect(['paymob_card', 'paymob_wallet'])->random(),
                        'paid_at' => $consultation->status === 'completed' ? $consultation->created_at : null,
                    ]
                );
            }
        });
    }
}
