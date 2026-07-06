<?php

use App\Models\Doctor;
use App\Models\PayoutRequest;
use Tests\Traits\ActingAsDoctor;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsDoctor::class);

it('doctor can view their financial stats', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/financials/stats');

    $response->assertOk();
});

it('doctor can view transaction history', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/financials/transactions');

    $response->assertOk();
});

it('doctor can request a payout', function () {
    $doctor = $this->createVerifiedDoctor();
    // Give doctor a positive balance via dummy Payment
    $consultation = \App\Models\Consultation::factory()->create(['doctor_id' => $doctor->id]);
    \App\Models\Payment::factory()->create([
        'consultation_id' => $consultation->id,
        'status' => 'completed',
        'payment_method' => 'paymob_card',
        'doctor_amount' => 500.00,
    ]);

    $response = $this->actingAs($doctor, 'doctor')
                     ->postJson('/api/v1/doctor/financials/request-payout', [
                         'amount' => 200.00,
                         'method' => 'bank_transfer',
                         'details' => ['account_number' => '1234567890'],
                     ]);

    if (!in_array($response->status(), [200, 201])) { $response->dump(); }
    $response->assertStatus(201);
});
