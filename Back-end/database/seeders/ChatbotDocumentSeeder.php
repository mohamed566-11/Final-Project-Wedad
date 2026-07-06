<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ChatbotDocument;

class ChatbotDocumentSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $documents = [
                [
                    'bot_type' => 'pregnancy',
                    'file_name' => 'pregnancy_nutrition_guidelines.pdf',
                    'file_size' => 1500000,
                    'status' => 'processed',
                    'error_message' => null,
                ],
                [
                    'bot_type' => 'motherhood',
                    'file_name' => 'newborn_care_instructions.pdf',
                    'file_size' => 2200000,
                    'status' => 'processed',
                    'error_message' => null,
                ],
                [
                    'bot_type' => 'pre_marriage',
                    'file_name' => 'pre_marriage_medical_tests.pdf',
                    'file_size' => 850000,
                    'status' => 'processed',
                    'error_message' => null,
                ]
            ];

            foreach ($documents as $doc) {
                ChatbotDocument::updateOrCreate(
                    ['bot_type' => $doc['bot_type'], 'file_name' => $doc['file_name']],
                    $doc
                );
            }
        });
    }
}
