<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Doctor;
use App\Models\Consultation;
use Tests\Traits\FakePaymob;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, FakePaymob::class);

it('full payment flow: initiate → webhook success → confirmed', function () {
    Mail::fake();
    config(['services.paymob.hmac_secret' => 'test_secret']);

    // 1. Create patient and doctor
    $user   = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);
    $doctor = Doctor::factory()->approved()->create(['session_type' => 'both']);

    $bookingDate = now()->addDays(2);
    $doctor->workingHours()->create([
        'day' => strtolower($bookingDate->format('l')),
        'start_time' => '14:00:00',
    ]);

    Http::fake([
        '*paymob*'  => Http::response([
            'token'       => 'fake_paymob_token',
            'payment_url' => 'https://accept.paymob.com/pay/123',
            'id'          => 99999,
        ], 200),
        '*accept*'  => Http::response(['token' => 'fake_token'], 200),
    ]);

    // 2. Book consultation → status=pending
    $bookResponse = $this->actingAs($user, 'patient')
                         ->postJson('/api/v1/patient/consultations/book', [
                             'doctor_id' => $doctor->id,
                             'date'      => $bookingDate->toDateString(),
                             'time'      => '14:00',
                             'type'      => 'video',
                             'payment_method' => 'paymob_card'
                         ]);

    $bookResponse->assertStatus(201);
    $consultationId = $bookResponse->json('data.consultation.id');


    $this->assertDatabaseHas('consultations', ['id' => $consultationId, 'status' => 'pending']);

    // 3. Initiate payment → payment_url returned
    $payResponse = $this->actingAs($user, 'patient')
                        ->postJson("/api/v1/patient/consultations/{$consultationId}/pay", [
                            'payment_method' => 'paymob_card',
                        ]);

    $payResponse->assertOk();

    // 4. Paymob webhook HMAC-verified callback
    $payload = $this->buildPaymobCallback($consultationId, true);
    $callbackResponse = $this->postJson('/api/v1/patient/payments/paymob/callback', $payload);
    $callbackResponse->assertOk();

    // 5. Consultation confirmed
    $this->assertDatabaseHas('consultations', [
        'id'     => $consultationId,
        'status' => 'confirmed',
    ]);
});
