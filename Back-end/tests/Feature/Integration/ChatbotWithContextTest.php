<?php

use App\Models\User;
use App\Models\PatientChatbotPreference;
use App\Models\HealthSync;
use App\Models\Pregnancy;
use App\Models\GestationalDiabetesPrediction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Services\Patient\PatientDataCollectorService;
use App\Services\AiService;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    try {
        $this->patient = User::factory()->create([
            'age' => 30,
        ]);

        // Data Access Enabled
        PatientChatbotPreference::create([
            'user_id' => $this->patient->id,
            'language' => 'ar',
            'data_access_enabled' => true,
        ]);

        // Mock Weight
        \App\Models\WeightEntry::create([
            'user_id' => $this->patient->id,
            'weight' => 75.5,
            'entry_date' => now(),
            'entry_time' => now(),
        ]);

        // Pregnancy & ML predictions
        $pregnancy = Pregnancy::factory()->create(['user_id' => $this->patient->id]);
        
        GestationalDiabetesPrediction::create([
            'user_id' => $this->patient->id,
            'pregnancy_id' => $pregnancy->id,
            'risk_level' => 'high',
            'age' => 30,
            'bmi' => 28.5,
            'prediction' => json_encode(['probability' => 0.85]),
        ]);
    } catch (\Exception $e) {
        dd($e->getMessage());
    }
});

it('includes patient medical context in chatbot prompt when data access is enabled', function () {
    // We expect formatting from PatientDataCollectorService
    $service = new PatientDataCollectorService();
    // Use collectChatbotContext with botType='pregnancy' to simulate full context gathering
    $collectedContextArray = $service->collectChatbotContext($this->patient, 'pregnancy');
    $collectedData = $service->buildContextualSystemPrompt($collectedContextArray);

    expect($collectedData)->toContain('العمر: 30 سنة');
    expect($collectedData)->toContain('الوزن الحالي: 75.5 كجم');
    expect($collectedData)->toContain('خطورة عالية');
});

it('sends context to external LLM correctly via ChatbotController', function () {
    // 1. Spy on ChatbotService
    $chatbotSpy = \Mockery::spy(\App\Services\ChatbotService::class)->makePartial();
    // Since getBotTypeFromStage is static, it uses the db. Let's just mock the singleton's sendMessage
    $chatbotSpy->shouldReceive('sendMessage')->andReturn([
        'success' => true,
        'message' => 'مرحباً، بناءً على بياناتك الطبية...'
    ]);
    
    app()->instance(\App\Services\ChatbotService::class, $chatbotSpy);

    // Make sure patient stage hits pregnancy (assuming 2 is pregnancy)
    \Illuminate\Support\Facades\DB::table('life_stages')->insertOrIgnore([
        'id' => 2,
        'name' => 'Pregnancy',
        'slug' => 'pregnancy',
    ]);
    $this->patient->life_stage_id = 2;
    $this->patient->save();

    // Enable the feature flag
    config(['chatbot.patient_context_enabled' => true]);

    // 2. Perform API call
    $response = $this->actingAs($this->patient, 'patient')
        ->postJson('/api/v1/patient/chatbot/widget-message', [
            'message' => 'هل وزني الحالي يشكل خطرا؟'
        ]);

    // Remove $response->json() dump
    $response->assertStatus(200);

    // 3. Assert ChatbotService received context
    $chatbotSpy->shouldHaveReceived('sendMessage')->withArgs(function ($botType, $finalMessage, $history) {
        return str_contains($finalMessage, 'خطورة عالية') 
            && str_contains($finalMessage, '75.5 كجم');
    });
});
