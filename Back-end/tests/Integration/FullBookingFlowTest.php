<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Doctor;
use App\Models\Consultation;
use Tests\Traits\FakePaymob;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, FakePaymob::class);

it('completes full booking flow from search to completion', function () {
    config(['services.paymob.hmac_secret' => 'test_secret']);
    Mail::fake();

    // 1. Setup
    $user   = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);
    $doctor = Doctor::factory()->approved()->create(['session_type' => 'both']);
    
    $bookingDate = now()->addDays(3);
    $doctor->workingHours()->create([
        'day' => strtolower($bookingDate->format('l')),
        'start_time' => '10:00:00', // start_time can be 10:00:00 in DB
    ]);

    Http::fake([
        '*paymob*' => Http::response(['payment_url' => 'https://accept.paymob.com/pay', 'id' => 123], 200),
    ]);

    // 2. Patient searches for doctors
    $searchResponse = $this->actingAs($user, 'patient')
                           ->getJson('/api/v1/patient/doctors/search?specialization=' . $doctor->specialization);
    $searchResponse->assertOk();

    // 3. Books consultation
    $bookResponse = $this->actingAs($user, 'patient')
                         ->postJson('/api/v1/patient/consultations/book', [
                             'doctor_id' => $doctor->id,
                             'date'      => $bookingDate->toDateString(),
                             'time'      => '10:00',
                             'type'      => 'video',
                             'payment_method' => 'paymob_card',
                             'patient_notes' => 'استشارة منتظمة',
                         ]);
    $bookResponse->assertStatus(201);
    $consultationId = $bookResponse->json('data.consultation.id');

    // 4. Paymob callback success → consultation confirmed
    $payload = $this->buildPaymobCallback($consultationId, true);
    $callbackResponse = $this->postJson('/api/v1/patient/payments/paymob/callback', $payload);
    $callbackResponse->assertOk();

    $this->assertDatabaseHas('consultations', [
        'id'     => $consultationId,
        'status' => 'confirmed',
    ]);

    // 5. Doctor starts session
    $doctor->update(['is_active' => true]);
    $startResponse = $this->actingAs($doctor, 'doctor')
                          ->putJson("/api/v1/doctor/consultations/{$consultationId}/start");
    $startResponse->assertOk();

    // 6. Doctor completes session
    $completeResponse = $this->actingAs($doctor, 'doctor')
                             ->putJson("/api/v1/doctor/consultations/{$consultationId}/complete", [
                                 'doctor_notes' => 'تمت الاستشارة بنجاح',
                             ]);
    $completeResponse->assertOk();

    // 7. Patient leaves review
    $reviewResponse = $this->actingAs($user, 'patient')
                           ->postJson("/api/v1/patient/consultations/{$consultationId}/review", [
                               'rating'  => 5,
                               'comment' => 'خدمة ممتازة',
                           ]);
    $reviewResponse->assertStatus(201);

    $this->assertDatabaseHas('consultation_reviews', [
        'consultation_id' => $consultationId,
        'rating'          => 5,
    ]);
});
