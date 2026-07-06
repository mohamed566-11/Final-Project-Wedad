<?php

/**
 * Consultation Review Test
 *
 * Covers:
 * - Patient: submit review for completed consultation (201)
 * - Patient: cannot review non-completed consultation (404 via findOrFail scope)
 * - Patient: cannot submit duplicate review for same consultation (400)
 * - Patient: rating validation (422)
 * - Doctor: list own reviews with stats (200)
 * - Doctor: toggle review is_published flag (200)
 * - Doctor: delete a review (200 + record missing)
 */

use App\Models\Consultation;
use App\Models\ConsultationReview;
use App\Models\User;
use App\Models\Doctor;
use App\Models\DoctorWorkingHour;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────
beforeEach(function () {
    $this->patient = User::factory()->create([
        'is_active'          => true,
        'email_verified_at' => now(),
    ]);

    $this->doctor = Doctor::factory()->create([
        'verification_status' => 'approved',
        'is_active'           => true,
    ]);

    // Give the doctor at least one working-hour slot (satisfies FK / availability checks)
    DoctorWorkingHour::factory()->create([
        'doctor_id'  => $this->doctor->id,
        'day'        => strtolower(Carbon::now()->addDay()->format('l')),
        'start_time' => '09:00',
    ]);
});

// ─────────────────────────────────────────────
// Patient: submit review
// ─────────────────────────────────────────────
it('allows patient to submit a review for a completed consultation', function () {
    $consultation = Consultation::factory()->create([
        'user_id'   => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'status'    => 'completed',
    ]);

    $response = $this->actingAs($this->patient, 'patient')
        ->postJson("/api/v1/patient/consultations/{$consultation->id}/review", [
            'rating'  => 5,
            'comment' => 'The doctor was very helpful and professional.',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('status', true)
        ->assertJsonPath('data.review.rating', 5)
        ->assertJsonPath('data.review.comment', 'The doctor was very helpful and professional.');

    $this->assertDatabaseHas('consultation_reviews', [
        'consultation_id' => $consultation->id,
        'user_id'         => $this->patient->id,
        'doctor_id'       => $this->doctor->id,
        'rating'          => 5,
    ]);
});

// ─────────────────────────────────────────────
// Patient: cannot review incomplete consultation
// The controller uses: Consultation::where('status','completed')->findOrFail($id)
// so a non-completed consultation will throw 404 ModelNotFoundException
// ─────────────────────────────────────────────
it('prevents patient from reviewing a non-completed consultation', function () {
    $consultation = Consultation::factory()->create([
        'user_id'   => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'status'    => 'confirmed', // not completed
    ]);

    $response = $this->actingAs($this->patient, 'patient')
        ->postJson("/api/v1/patient/consultations/{$consultation->id}/review", [
            'rating'  => 4,
            'comment' => 'Great experience',
        ]);

    // findOrFail on status=completed will throw 404
    $response->assertStatus(404);

    $this->assertDatabaseMissing('consultation_reviews', [
        'consultation_id' => $consultation->id,
    ]);
});

// ─────────────────────────────────────────────
// Patient: cannot submit duplicate review
// consultation_reviews.consultation_id is unique
// ─────────────────────────────────────────────
it('prevents patient from submitting a duplicate review', function () {
    $consultation = Consultation::factory()->create([
        'user_id'   => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'status'    => 'completed',
    ]);

    // Seed an existing review linked to this exact consultation_id
    ConsultationReview::factory()->create([
        'consultation_id' => $consultation->id,
        'user_id'         => $this->patient->id,
        'doctor_id'       => $this->doctor->id,
    ]);

    // Attempt a second review
    $response = $this->actingAs($this->patient, 'patient')
        ->postJson("/api/v1/patient/consultations/{$consultation->id}/review", [
            'rating' => 3,
        ]);

    // The controller returns 400 when review already exists
    $response->assertStatus(400);
});

// ─────────────────────────────────────────────
// Patient: rating validation
// ─────────────────────────────────────────────
it('rejects a review with an out-of-range rating', function () {
    $consultation = Consultation::factory()->create([
        'user_id'   => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'status'    => 'completed',
    ]);

    $response = $this->actingAs($this->patient, 'patient')
        ->postJson("/api/v1/patient/consultations/{$consultation->id}/review", [
            'rating' => 6, // invalid: max is 5
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('rating');
});

// ─────────────────────────────────────────────
// Doctor: list own reviews
// ─────────────────────────────────────────────
it('allows a doctor to list their own reviews with stats', function () {
    ConsultationReview::factory()->count(3)->create([
        'doctor_id'    => $this->doctor->id,
        'is_published' => true,
    ]);

    // Another doctor's review — must NOT appear in the count
    ConsultationReview::factory()->create();

    $response = $this->actingAs($this->doctor, 'doctor')
        ->getJson('/api/v1/doctor/reviews');

    $response->assertStatus(200)
        ->assertJsonPath('status', true)
        ->assertJsonPath('data.stats.total_reviews', 3);
});

// ─────────────────────────────────────────────
// Doctor: toggle is_published
// ─────────────────────────────────────────────
it('allows a doctor to toggle the visibility of a review', function () {
    $review = ConsultationReview::factory()->create([
        'doctor_id'    => $this->doctor->id,
        'is_published' => true,
    ]);

    $response = $this->actingAs($this->doctor, 'doctor')
        ->patchJson("/api/v1/doctor/reviews/{$review->id}/toggle");

    $response->assertStatus(200)
        ->assertJsonPath('status', true);

    $this->assertDatabaseHas('consultation_reviews', [
        'id'           => $review->id,
        'is_published' => false, // flipped
    ]);
});

// ─────────────────────────────────────────────
// Doctor: delete review
// ─────────────────────────────────────────────
it('allows a doctor to delete one of their reviews', function () {
    $review = ConsultationReview::factory()->create([
        'doctor_id' => $this->doctor->id,
    ]);

    $response = $this->actingAs($this->doctor, 'doctor')
        ->deleteJson("/api/v1/doctor/reviews/{$review->id}");

    $response->assertStatus(200)
        ->assertJsonPath('status', true);

    $this->assertDatabaseMissing('consultation_reviews', [
        'id' => $review->id,
    ]);
});
