<?php

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use App\Models\UserProfile;
use Tests\Traits\FakePaymob;
use Illuminate\Support\Facades\Mail;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, FakePaymob::class);

beforeEach(function () {
    Mail::fake();
    config(['services.paymob.hmac_secret' => 'test_secret']);
});

// ─── Paymob Callback Tests (SECURITY CRITICAL) ────────────────────────────────

it('confirms consultation on successful paymob callback', function () {
    $user        = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);
    $doctor      = Doctor::factory()->approved()->create();
    $consultation = Consultation::factory()->create([
        'user_id'   => $user->id,
        'doctor_id' => $doctor->id,
        'status'    => 'pending',
    ]);

    $payload = $this->buildPaymobCallback($consultation->id, true);

    $response = $this->postJson('/api/v1/patient/payments/paymob/callback', $payload);

    $response->assertOk();
    $this->assertDatabaseHas('consultations', [
        'id'     => $consultation->id,
        'status' => 'confirmed',
    ]);
});

it('does NOT confirm consultation on failed paymob callback', function () {
    $user        = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);
    $doctor      = Doctor::factory()->approved()->create();
    $consultation = Consultation::factory()->create([
        'user_id'   => $user->id,
        'doctor_id' => $doctor->id,
        'status'    => 'pending',
    ]);

    $payload = $this->buildPaymobCallback($consultation->id, false);

    $response = $this->postJson('/api/v1/patient/payments/paymob/callback', $payload);

    $response->assertOk();
    $this->assertDatabaseMissing('consultations', [
        'id'     => $consultation->id,
        'status' => 'confirmed',
    ]);
});

it('rejects callback with invalid HMAC — SECURITY TEST', function () {
    $user        = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);
    $doctor      = Doctor::factory()->approved()->create();
    $consultation = Consultation::factory()->create([
        'user_id'   => $user->id,
        'doctor_id' => $doctor->id,
        'status'    => 'pending',
    ]);

    $payload = $this->buildPaymobCallback($consultation->id, true, 'wrong_secret');

    $response = $this->postJson('/api/v1/patient/payments/paymob/callback', $payload);

    $response->assertStatus(403);

    // Consultation must NOT be confirmed after invalid HMAC
    $this->assertDatabaseHas('consultations', [
        'id'     => $consultation->id,
        'status' => 'pending',
    ]);
});

it('returns 404 for unknown consultation in callback', function () {
    $payload = $this->buildPaymobCallback(99999999, true);

    $response = $this->postJson('/api/v1/patient/payments/paymob/callback', $payload);

    $response->assertStatus(404);
});
