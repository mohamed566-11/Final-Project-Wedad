<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\LabTestResult;

class LabTestSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $patients = User::whereNotNull('life_stage_id')->take(5)->get();

            foreach ($patients as $patient) {
                // Mock completed lab test
                LabTestResult::updateOrCreate(
                    [
                        'user_id' => $patient->id,
                        'status' => 'completed'
                    ],
                    [
                        'image_path' => 'lab_tests/demo/sample1.jpg',
                        'image_hash' => md5('sample1' . $patient->id),
                        'results_json' => [
                            'tests' => [
                                ['name' => 'Hemoglobin', 'value' => '12.5', 'unit' => 'g/dL', 'reference_range' => '12.0 - 15.5'],
                                ['name' => 'Fasting Blood Sugar', 'value' => '95', 'unit' => 'mg/dL', 'reference_range' => '70 - 100']
                            ]
                        ],
                        'tests_count' => 2,
                        'processed_at' => now()->subDays(rand(1, 10)),
                    ]
                );

                // Mock pending lab test
                LabTestResult::updateOrCreate(
                    [
                        'user_id' => $patient->id,
                        'status' => 'pending'
                    ],
                    [
                        'image_path' => 'lab_tests/demo/sample2.jpg',
                        'image_hash' => md5('sample2' . $patient->id),
                        'results_json' => null,
                        'tests_count' => 0,
                        'processed_at' => null,
                    ]
                );
            }
        });
    }
}
