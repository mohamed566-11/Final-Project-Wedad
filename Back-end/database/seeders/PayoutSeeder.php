<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayoutRequest;
use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

class PayoutSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $doctors = Doctor::where('is_active', true)->get();

            if ($doctors->isEmpty()) {
                $this->command->warn('PayoutSeeder: No active doctors found. Skipping.');
                return;
            }

            foreach ($doctors->take(3) as $doctor) {
                // طلب مكتمل
                PayoutRequest::updateOrCreate(
                    ['doctor_id' => $doctor->id, 'status' => 'processed'],
                    [
                        'amount'       => rand(500, 2000),
                        'status' => 'processed',
                        'method'       => 'bank_transfer',
                        'details'      => [
                            'bank_account' => '0123456789',
                            'bank_name'    => 'بنك مصر',
                        ],
                        'admin_note'   => 'تحويل شهر يناير - تمت المعالجة',
                        'reference_no' => 'PAY-' . strtoupper(substr(md5($doctor->id . 'completed'), 0, 8)),
                        'processed_at' => now()->subDays(rand(5, 30)),
                    ]
                );

                // طلب معلق
                PayoutRequest::updateOrCreate(
                    ['doctor_id' => $doctor->id, 'status' => 'pending'],
                    [
                        'amount'  => rand(300, 1500),
                        'status'  => 'pending',
                        'method'  => 'bank_transfer',
                        'details' => [
                            'bank_account' => '0123456789',
                            'bank_name'    => 'بنك مصر',
                        ],
                        'admin_note'   => null,
                        'reference_no' => 'PAY-' . strtoupper(substr(md5($doctor->id . 'pending'), 0, 8)),
                    ]
                );
            }

            $this->command->info('✅ PayoutSeeder: Done.');
        });
    }
}
