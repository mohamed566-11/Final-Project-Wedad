<?php

use App\Models\User;
use App\Models\LabTestResult;
use Tests\Traits\ActingAsPatient;
use Tests\Traits\FakeHuggingFace;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsPatient::class, FakeHuggingFace::class);

beforeEach(function () {
    Storage::fake('public');
    Queue::fake();
    $this->fakeHuggingFaceOcrSuccess();
});

it('uploads a lab test image', function () {
    $user = $this->createVerifiedPatient();
    $file = UploadedFile::fake()->image('lab_test.jpg', 800, 600);

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/lab-tests', [
                         'image' => $file,
                     ]);

    $labTest = \App\Models\LabTestResult::first();
    if ($labTest->status !== 'completed') {
        dump($labTest->error_message);
    }
    
    $response->assertStatus(201);
    $this->assertDatabaseHas('lab_test_results', [
        'user_id' => $user->id,
        'status'  => 'completed',
    ]);
});

it('rejects non-image file type', function () {
    $user = $this->createVerifiedPatient();
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/lab-tests', [
                         'image' => $file,
                     ]);

    $response->assertStatus(422);
});

it('returns lab test list', function () {
    $user = $this->createVerifiedPatient();
    LabTestResult::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/lab-tests');

    $response->assertOk()
             ->assertJsonStructure(['data']);
});

it('returns single lab test details', function () {
    $user  = $this->createVerifiedPatient();
    $entry = LabTestResult::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson("/api/v1/patient/lab-tests/{$entry->id}");

    $response->assertOk();
});

it('polls status as pending before processing', function () {
    $user  = $this->createVerifiedPatient();
    $entry = LabTestResult::factory()->create([
        'user_id' => $user->id,
        'status'  => 'pending',
    ]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson("/api/v1/patient/lab-tests/{$entry->id}/status");

    $response->assertOk();
});

it('polls status as completed after processing', function () {
    $user  = $this->createVerifiedPatient();
    $entry = LabTestResult::factory()->completed()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson("/api/v1/patient/lab-tests/{$entry->id}/status");

    $response->assertOk();
});

it('deletes a lab test', function () {
    $user  = $this->createVerifiedPatient();
    $entry = LabTestResult::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->deleteJson("/api/v1/patient/lab-tests/{$entry->id}");

    $response->assertOk();
    $this->assertDatabaseMissing('lab_test_results', ['id' => $entry->id]);
});

it('cannot access another patient lab test', function () {
    $user1  = $this->createVerifiedPatient();
    $user2  = $this->createVerifiedPatient();
    $entry  = LabTestResult::factory()->create(['user_id' => $user2->id]);

    $response = $this->actingAs($user1, 'patient')
                     ->getJson("/api/v1/patient/lab-tests/{$entry->id}");

    $response->assertStatus(404);
});
