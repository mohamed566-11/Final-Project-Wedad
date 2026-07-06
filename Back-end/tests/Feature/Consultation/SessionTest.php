<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\Prescription;
use Tests\Traits\ActingAsDoctor;
use Tests\Traits\ActingAsPatient;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsDoctor::class, ActingAsPatient::class);

// ─── Consultation Chat ────────────────────────────────────────────────────────

it('doctor can send a chat message in active consultation', function () {
    $patient      = $this->createVerifiedPatient();
    $doctor       = $this->createVerifiedDoctor();
    $consultation = Consultation::factory()->confirmed()->create([
        'user_id'   => $patient->id,
        'doctor_id' => $doctor->id,
    ]);

    $response = $this->actingAs($doctor, 'doctor')
                     ->postJson("/api/v1/doctor/consultations/{$consultation->id}/chat/messages", [
                         'message' => 'كيف تشعرين اليوم؟',
                     ]);

    $response->assertStatus(201);
});

it('patient can receive chat messages', function () {
    $patient      = $this->createVerifiedPatient();
    $doctor       = $this->createVerifiedDoctor();
    $consultation = Consultation::factory()->confirmed()->create([
        'user_id'   => $patient->id,
        'doctor_id' => $doctor->id,
    ]);

    $response = $this->actingAs($patient, 'patient')
                     ->getJson("/api/v1/patient/consultations/{$consultation->id}/chat/messages");

    $response->assertOk()
             ->assertJsonStructure(['data']);
});

it('patient cannot read another patient consultation chat', function () {
    $patient1     = $this->createVerifiedPatient();
    $patient2     = $this->createVerifiedPatient();
    $doctor       = $this->createVerifiedDoctor();
    $consultation = Consultation::factory()->confirmed()->create([
        'user_id'   => $patient2->id,
        'doctor_id' => $doctor->id,
    ]);

    $response = $this->actingAs($patient1, 'patient')
                     ->getJson("/api/v1/patient/consultations/{$consultation->id}/chat/messages");

    $response->assertStatus(404);
});

// ─── Prescription ─────────────────────────────────────────────────────────────

it('patient can view their prescription', function () {
    $patient      = $this->createVerifiedPatient();
    $doctor       = $this->createVerifiedDoctor();
    $consultation = Consultation::factory()->completed()->create([
        'user_id'   => $patient->id,
        'doctor_id' => $doctor->id,
    ]);
    Prescription::factory()->create([
        'consultation_id' => $consultation->id,
        'doctor_id'       => $doctor->id,
        'user_id'         => $patient->id,
    ]);

    $response = $this->actingAs($patient, 'patient')
                     ->getJson("/api/v1/patient/consultations/{$consultation->id}/prescription");

    $response->assertOk();
});

// ─── Doctor Consultation Actions ──────────────────────────────────────────────

it('doctor can fetch patient history for consultation', function () {
    $patient      = $this->createVerifiedPatient();
    $doctor       = $this->createVerifiedDoctor();
    $consultation = Consultation::factory()->confirmed()->create([
        'user_id'   => $patient->id,
        'doctor_id' => $doctor->id,
    ]);

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson("/api/v1/doctor/consultations/{$consultation->id}/patient-history");

    $response->assertOk();
});

it('doctor can get meeting info', function () {
    $patient      = $this->createVerifiedPatient();
    $doctor       = $this->createVerifiedDoctor();
    $consultation = Consultation::factory()->withGoogleMeet()->confirmed()->create([
        'user_id'   => $patient->id,
        'doctor_id' => $doctor->id,
    ]);

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson("/api/v1/doctor/consultations/{$consultation->id}/meeting-info");

    $response->assertOk();
});
