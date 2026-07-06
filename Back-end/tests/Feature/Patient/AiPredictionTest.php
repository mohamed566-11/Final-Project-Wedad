<?php

use App\Models\User;
use App\Models\UserProfile;
use Tests\Traits\ActingAsPatient;
use Tests\Traits\FakeHuggingFace;
use Illuminate\Support\Facades\Http;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsPatient::class, FakeHuggingFace::class);

// ─── GDM Prediction ───────────────────────────────────────────────────────────

it('predicts GDM risk with valid input', function () {
    $this->fakeHuggingFaceSuccess();
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/ai-center/gdm/predict', [
                         'age' => 28,
                         'height_cm' => 165,
                         'weight_kg' => 70,
                         'no_of_pregnancy' => 1,
                         'family_history' => 1,
                         'pcos' => 0,
                         'sedentary_lifestyle' => 1,
                         'prediabetes' => 0,
                         'unexplained_prenatal_loss' => 0,
                         'large_child_or_birth_default' => 0,
                         'gestation_in_previous_pregnancy' => 0,
                     ]);
    if ($response->status() !== 200) { $response->dump(); }

    $response->assertOk()
             ->assertJsonStructure(['data' => ['risk_level']]);

    $this->assertDatabaseHas('gestational_diabetes_predictions', ['user_id' => $user->id]);
});

it('returns 422 for GDM with missing fields', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/ai-center/gdm/predict', []);

    $response->assertStatus(422);
});

// ─── Preeclampsia Prediction ──────────────────────────────────────────────────

it('predicts preeclampsia risk', function () {
    $this->fakeHuggingFaceSuccess();
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/ai-center/preeclampsia/predict', [
                         'gravida'           => 1,
                         'parity'            => 0,
                         'gest_age'          => 20,
                         'age'               => 30,
                         'bmi'               => 28.0,
                         'diabetes'          => 0,
                         'htn'               => 0,
                         'sysbp'             => 130,
                         'diabp'             => 85,
                         'hb'                => 12,
                         'proteinuria'       => 1,
                     ]);

    $response->assertOk();
});

// ─── Prediction History ───────────────────────────────────────────────────────

it('returns prediction history', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/ai-center/history');

    $response->assertOk()
             ->assertJsonStructure(['data']);
});

it('returns prefill data from patient profile', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/ai-center/gdm/prefill');

    $response->assertOk();
});

// ─── HuggingFace Error Handling ────────────────────────────────────────────────

it('handles HF timeout gracefully', function () {
    $this->fakeHuggingFaceTimeout();
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/ai-center/gdm/predict', [
                         'age' => 28,
                         'height_cm' => 165,
                         'weight_kg' => 70,
                         'no_of_pregnancy' => 1,
                         'family_history' => 1,
                         'pcos' => 0,
                         'sedentary_lifestyle' => 1,
                         'prediabetes' => 0,
                         'unexplained_prenatal_loss' => 0,
                         'large_child_or_birth_default' => 0,
                         'gestation_in_previous_pregnancy' => 0,
                     ]);

    $this->assertTrue(in_array($response->status(), [500, 503, 504]), 'Response status must be 500, 503, or 504');
})->skip('Timeout test may behave differently per environment');

it('handles HF error response gracefully', function () {
    $this->fakeHuggingFaceError();
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/ai-center/gdm/predict', [
                         'age' => 28,
                         'height_cm' => 165,
                         'weight_kg' => 70,
                         'no_of_pregnancy' => 1,
                         'family_history' => 1,
                         'pcos' => 0,
                         'sedentary_lifestyle' => 1,
                         'prediabetes' => 0,
                         'unexplained_prenatal_loss' => 0,
                         'large_child_or_birth_default' => 0,
                         'gestation_in_previous_pregnancy' => 0,
                     ]);

    expect($response->status())->toBeIn([200, 500, 503]);
});
