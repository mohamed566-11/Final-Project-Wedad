<?php

/**
 * Patient Medical File Test
 *
 * Covers:
 * - Upload a PDF medical file (201)
 * - List own medical files, scoped by user (200 – returns only own 3)
 * - Delete own medical file (200 + record missing)
 * - Authorization: cannot delete another patient's file (404)
 * - Download own medical file (200 BinaryFileResponse)
 */

use App\Models\PatientMedicalFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────
beforeEach(function () {
    Storage::fake('public');  // intercept all disk operations

    $this->patient = User::factory()->create([
        'is_active'          => true,
        'email_verified_at' => now(),
    ]);
});

// ─────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────
it('allows a patient to upload a medical file', function () {
    $file = UploadedFile::fake()->create('report.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($this->patient, 'patient')
        ->postJson('/api/v1/patient/profile/medical-files', [
            'file'        => $file,
            'description' => 'Blood Test Report',
            'category'    => 'lab_result',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('status', true);

    $this->assertDatabaseHas('patient_medical_files', [
        'user_id'     => $this->patient->id,
        'description' => 'Blood Test Report',
    ]);

    // Verify the uploaded file actually landed in the fake disk
    $record = PatientMedicalFile::where('user_id', $this->patient->id)->firstOrFail();
    Storage::disk('public')->assertExists($record->file_path);
});

// ─────────────────────────────────────────────
// List (scoped to authenticated patient)
// ─────────────────────────────────────────────
it('returns only the authenticated patient\'s medical files', function () {
    PatientMedicalFile::factory()->count(3)->create([
        'user_id' => $this->patient->id,
    ]);

    // Another patient's file — must NOT appear in the response
    PatientMedicalFile::factory()->create();

    $response = $this->actingAs($this->patient, 'patient')
        ->getJson('/api/v1/patient/profile/medical-files');

    $response->assertStatus(200)
        ->assertJsonPath('status', true)
        ->assertJsonCount(3, 'data');
});

// ─────────────────────────────────────────────
// Delete (own file)
// ─────────────────────────────────────────────
it('allows a patient to delete their own medical file', function () {
    $medicalFile = PatientMedicalFile::factory()->create([
        'user_id'   => $this->patient->id,
        'file_path' => 'medical_files/fake.pdf',
    ]);

    $response = $this->actingAs($this->patient, 'patient')
        ->deleteJson("/api/v1/patient/profile/medical-files/{$medicalFile->id}");

    $response->assertStatus(200)
        ->assertJsonPath('status', true);

    $this->assertDatabaseMissing('patient_medical_files', [
        'id' => $medicalFile->id,
    ]);
});

// ─────────────────────────────────────────────
// Authorization: cannot delete another patient's file
// ─────────────────────────────────────────────
it('prevents a patient from deleting another patient\'s medical file', function () {
    $otherPatient = User::factory()->create();
    $medicalFile = PatientMedicalFile::factory()->create([
        'user_id' => $otherPatient->id,
    ]);

    $response = $this->actingAs($this->patient, 'patient')
        ->deleteJson("/api/v1/patient/profile/medical-files/{$medicalFile->id}");

    // Controller scopes by user_id, so the record won't be found → 404 (or 500 via catch)
    $response->assertStatus(404);
});

// ─────────────────────────────────────────────
// Download
// Storage::fake() stores files in a temp dir.
// Storage::disk('public')->path() returns the correct temp path.
// The patched controller uses Storage facade, so this works.
// ─────────────────────────────────────────────
it('allows a patient to download their own medical file', function () {
    // Store a real fake file into the fake public disk
    $fakeFile = UploadedFile::fake()->create('blood_test.pdf', 100, 'application/pdf');
    $storedPath = $fakeFile->store('medical-files/' . $this->patient->id, 'public');

    $medicalFile = PatientMedicalFile::factory()->create([
        'user_id'   => $this->patient->id,
        'file_path' => $storedPath,
        'file_name' => 'blood_test.pdf',
    ]);

    $response = $this->actingAs($this->patient, 'patient')
        ->get("/api/v1/patient/profile/medical-files/{$medicalFile->id}/download");

    $response->assertStatus(200);
    // Laravel's BinaryFileResponse sets Content-Disposition: attachment; filename=...
    $contentDisposition = $response->headers->get('Content-Disposition', '');
    expect($contentDisposition)->toContain('attachment');
});
