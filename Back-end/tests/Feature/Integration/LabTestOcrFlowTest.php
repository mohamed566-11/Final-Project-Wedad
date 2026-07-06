<?php

use App\Models\User;
use App\Models\LabTestResult;
use App\Services\LabTestOcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->patient = User::factory()->create([
        'is_active' => true,
        'email_verified_at' => now(),
    ]);
});

it('processes uploaded lab result through OCR and saves structured data', function () {
    Storage::fake('public');
    
    // Mock the OCR Service
    $ocrServiceSpy = \Mockery::spy(LabTestOcrService::class);
    $ocrServiceSpy->shouldReceive('processImage')->andReturnUsing(function ($labTest) {
        $labTest->markAsCompleted([
            'patient_info' => ['name' => 'Test Patient'],
            'tests' => [
                [
                    'canonical_name' => 'Hemoglobin',
                    'value' => '13.5',
                    'unit' => 'g/dL',
                    'status' => 'normal',
                ]
            ]
        ]);
    });
    
    app()->instance(LabTestOcrService::class, $ocrServiceSpy);
    
    $file = UploadedFile::fake()->image('lab_result.jpg');
    
    $response = $this->actingAs($this->patient, 'patient')
        ->postJson('/api/v1/patient/lab-tests', [
            'image' => $file,
        ]);
        
    $response->assertStatus(201);
    $response->assertJsonStructure([
        'status',
        'message',
        'data' => [
            'lab_test_id',
            'status'
        ]
    ]);
    
    $labTestId = $response->json('data.lab_test_id');
    $labTest = LabTestResult::find($labTestId);
    
    expect($labTest->status)->toBe('completed');
    expect($labTest->tests_count)->toBe(1);
    expect($labTest->results_json['tests'][0]['canonical_name'])->toBe('Hemoglobin');
    
    Storage::disk('public')->assertExists($labTest->image_path);
});
