<?php

use App\Models\Doctor;
use App\Models\MlPredictionsHistory;
use App\Models\GestationalDiabetesPrediction;
use App\Models\User;
use App\Models\Pregnancy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Traits\ActingAsDoctor;

uses(RefreshDatabase::class, ActingAsDoctor::class);

beforeEach(function () {
    $this->doctor = $this->createVerifiedDoctor();
    $this->patient = User::factory()->create();
    
    // Associate doctor and patient via pivot
    $this->doctor->patients()->attach($this->patient->id, [
        'last_appointment_date' => now(),
    ]);
});

it('fetches doctor ai stats correctly', function () {
    try {
        MlPredictionsHistory::create([
            'user_id' => $this->patient->id,
            'disease_type' => 'gestational_diabetes',
            'risk_level' => 'high',
            'predictable_type' => GestationalDiabetesPrediction::class,
            'predictable_id' => 1,
            'model_version' => '1.0',
            'algorithm_used' => 'test',
            'confidence_score' => 0.99,
            'input_features' => [],
            'model_output' => [],
        ]);
    } catch (\Exception $e) {
        dd($e->getMessage());
    }

    $response = $this->actingAs($this->doctor, 'doctor')
                     ->getJson('/api/v1/doctor/ai-center/stats');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'data' => [
                'total_predictions',
                'high_risk_count',
                'recent_7_days',
                'by_disease',
                'high_risk_patients',
            ],
            'message'
        ]);

    $data = $response->json('data');
    expect($data['total_predictions'])->toBe(1);
    expect($data['high_risk_count'])->toBe(1);
    expect($data['by_disease']['gestational_diabetes'])->toBe(1);
});

it('fetches patient predictions with correct authorization', function () {
    $pregnancy = Pregnancy::factory()->create(['user_id' => $this->patient->id]);
    
    $prediction = GestationalDiabetesPrediction::create([
        'user_id' => $this->patient->id,
        'pregnancy_id' => $pregnancy->id,
        'risk_level' => 'low',
    ]);

    MlPredictionsHistory::create([
        'user_id' => $this->patient->id,
        'disease_type' => 'gestational_diabetes',
        'risk_level' => 'low',
        'predictable_type' => GestationalDiabetesPrediction::class,
        'predictable_id' => $prediction->id,
        'model_version' => '1.0',
        'algorithm_used' => 'test',
        'confidence_score' => 0.1,
        'input_features' => [],
        'model_output' => [],
    ]);

    $response = $this->actingAs($this->doctor, 'doctor')
                     ->getJson("/api/v1/doctor/ai-center/patients/{$this->patient->id}/predictions");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'data' => [
                'patient' => ['id', 'name', 'email'],
                'predictions' => ['data', 'current_page'],
                'latest_by_type' => ['gdm', 'preeclampsia', 'preterm_birth']
            ],
            'message'
        ]);
});

it('prevents doctor from fetching predictions of unauthorized patient', function () {
    $unauthorizedPatient = User::factory()->create();

    $response = $this->actingAs($this->doctor, 'doctor')
                     ->getJson("/api/v1/doctor/ai-center/patients/{$unauthorizedPatient->id}/predictions");

    // Expecting 403 because they aren't associated with the doctor
    $response->assertStatus(403);
});

it('allows doctor to add comment on prediction', function () {
    $pregnancy = Pregnancy::factory()->create(['user_id' => $this->patient->id]);
    
    $prediction = GestationalDiabetesPrediction::create([
        'user_id' => $this->patient->id,
        'pregnancy_id' => $pregnancy->id,
        'risk_level' => 'high',
    ]);

    $history = MlPredictionsHistory::create([
        'user_id' => $this->patient->id,
        'disease_type' => 'gestational_diabetes',
        'risk_level' => 'high',
        'predictable_type' => GestationalDiabetesPrediction::class,
        'predictable_id' => $prediction->id,
        'model_version' => '1.0',
        'algorithm_used' => 'test',
        'confidence_score' => 0.99,
        'input_features' => [],
        'model_output' => [],
    ]);

    $response = $this->actingAs($this->doctor, 'doctor')
                     ->postJson("/api/v1/doctor/ai-center/predictions/{$history->id}/comment", [
                         'comment' => 'Need to schedule an immediate checkup.',
                     ]);

    $response->assertStatus(200);
    
    $this->assertDatabaseHas('gestational_diabetes_predictions', [
        'id' => $prediction->id,
        'doctor_id' => $this->doctor->id,
        'doctor_comments' => 'Need to schedule an immediate checkup.',
    ]);
});
