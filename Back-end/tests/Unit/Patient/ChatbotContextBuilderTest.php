<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\PatientChatbotPreference;
use App\Services\Patient\PatientDataCollectorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->service = new PatientDataCollectorService();
});

it('returns empty context for public bot type', function () {
    $user = User::factory()->create();
    
    $context = $this->service->collectChatbotContext($user, 'public');
    
    expect($context)->toBeEmpty();
});

it('returns empty context if context is disabled in config', function () {
    config()->set('chatbot.patient_context_enabled', false);
    $user = User::factory()->create();
    
    $context = $this->service->collectChatbotContext($user, 'pregnancy');
    
    expect($context)->toBeEmpty();
});

it('collects basic profile context for patient if opted in', function () {
    config()->set('chatbot.patient_context_enabled', true);
    
    $user = User::factory()->create(['age' => 30]);
    UserProfile::factory()->create([
        'user_id' => $user->id,
        'height' => 160,
        'weight' => 60,
        'blood_type' => 'O+',
        'chronic_diseases' => ['Asthma'],
        'allergies' => ['Peanuts'],
        'medical_history' => 'Healthy generally',
    ]);
    
    PatientChatbotPreference::create([
        'user_id' => $user->id,
        'data_access_enabled' => true,
        'share_predictions' => true,
        'share_trackers' => false,
        'share_consultations' => false,
    ]);
    
    $context = $this->service->collectChatbotContext($user, 'pre_marriage');
    
    expect($context)->not->toBeEmpty();
    expect($context['profile'])->toBeArray();
    expect($context['profile']['age'])->toBeInt();
    expect($context['profile']['height'])->toBe(160);
    expect($context['profile']['blood_type'])->toBe('O+');
    expect($context['profile']['chronic_diseases'])->toContain('Asthma');
    expect($context['profile']['allergies'])->toContain('Peanuts');
});

it('builds a contextual system prompt string from collected context', function () {
    $sampleContext = [
        'profile' => [
            'age' => 28,
            'height' => 165,
            'weight' => 65,
            'blood_type' => 'A+',
            'chronic_diseases' => ['None'],
        ],
        'pregnancy' => [
            'current_week' => 24,
            'trimester_label' => 'الثلث الثاني',
        ]
    ];
    
    $prompt = $this->service->buildContextualSystemPrompt($sampleContext);
    
    expect($prompt)->toBeString();
    expect($prompt)->toContain('المعلومة الأساسية');
    expect($prompt)->toContain('28 سنة');
    expect($prompt)->toContain('A+');
    expect($prompt)->toContain('الأسبوع: 24');
    expect($prompt)->toContain('الثلث الثاني');
});
