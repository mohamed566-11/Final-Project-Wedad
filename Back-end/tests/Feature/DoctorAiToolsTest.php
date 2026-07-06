<?php

use App\Models\Doctor;
use App\Models\User;
use App\Models\GestationalDiabetesPrediction;
use App\Models\MlPredictionsHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->doctor = Doctor::factory()->create([
        'verification_status' => 'verified',
    ]);
    
    $this->patient = User::factory()->create();
    
    // Link doctor and patient
    $this->doctor->patients()->attach($this->patient->id);
    
    // Create an AI Prediction without a factory
    $this->prediction = GestationalDiabetesPrediction::create([
        'user_id' => $this->patient->id,
        'risk_level' => 'high',
        'maternal_age' => 30,
        'no_of_pregnancy' => 1,
        'height_cm' => 160,
        'weight_kg' => 70,
        'doctor_comments' => null,
    ]);
    
    // Check if observer created history automatically, if not, create it
    // Usually Observers create history during created event. Let's find it.
    $this->history = MlPredictionsHistory::where('predictable_id', $this->prediction->id)
        ->where('predictable_type', GestationalDiabetesPrediction::class)
        ->first();
        
    if (!$this->history) {
        $this->history = MlPredictionsHistory::create([
            'user_id' => $this->patient->id,
            'predictable_type' => GestationalDiabetesPrediction::class,
            'predictable_id' => $this->prediction->id,
            'disease_type' => 'gestational_diabetes', // Match enum
            'risk_level' => 'high',
            'risk_score' => 0.85,
            'input_features' => [],
            'model_output' => [],
            'model_version' => 'v1.0',
            'algorithm_used' => 'LightGBM',
        ]);
    } else {
        $this->history->update(['risk_level' => 'high']); // Ensure high risk
    }
});

it('can fetch prediction statistics for a doctors patients', function () {
    $response = $this->actingAs($this->doctor, 'doctor')
        ->getJson('/api/v1/doctor/ai-center/stats');
        
    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'total_predictions',
                'high_risk_count',
                'recent_7_days',
                'by_disease',
                'high_risk_patients'
            ]
        ]);
        
    expect($response->json('data.total_predictions'))->toBe(1)
          ->and($response->json('data.high_risk_count'))->toBe(1);
});

it('can fetch patient predictions list', function () {
    $response = $this->actingAs($this->doctor, 'doctor')
        ->getJson("/api/v1/doctor/ai-center/patients/{$this->patient->id}/predictions");
        
    $response->assertStatus(200);
    expect($response->json('data.predictions.data'))->toHaveCount(1);
});

it('denies accessing predictions of unlinked patients', function () {
    $otherPatient = User::factory()->create();
    
    $response = $this->actingAs($this->doctor, 'doctor')
        ->getJson("/api/v1/doctor/ai-center/patients/{$otherPatient->id}/predictions");
        
    $response->assertStatus(403);
});

it('allows doctor to add a comment to a prediction', function () {
    $response = $this->actingAs($this->doctor, 'doctor')
        ->postJson("/api/v1/doctor/ai-center/predictions/{$this->history->id}/comment", [
            'comment' => 'This requires immediate attention.'
        ]);
        
    $response->assertStatus(200);
    
    $this->assertDatabaseHas('gestational_diabetes_predictions', [
        'id' => $this->prediction->id,
        'doctor_id' => $this->doctor->id,
        'doctor_comments' => 'This requires immediate attention.'
    ]);
});
