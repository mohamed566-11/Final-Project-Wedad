<?php

use App\Models\User;
use App\Models\Pregnancy;
use Tests\Traits\ActingAsPatient;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsPatient::class);

it('starts a new pregnancy', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/pregnancy/start', [
                         'last_menstrual_period'   => now()->subWeeks(8)->toDateString(),
                         'expected_due_date'       => now()->addWeeks(32)->toDateString(),
                     ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('pregnancies', ['user_id' => $user->id, 'is_active' => true]);
});

it('returns current active pregnancy', function () {
    $user      = $this->createVerifiedPatient();
    Pregnancy::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/pregnancy/current');

    $response->assertOk()
             ->assertJsonStructure(['data']);
});

it('returns null when no active pregnancy', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/pregnancy/current');

    $response->assertStatus(404);
});

it('stores a pregnancy entry with weight sync', function () {
    $user      = $this->createVerifiedPatient();
    $pregnancy = Pregnancy::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/pregnancy/entry', [
                         'date'   => now()->toDateString(),
                         'weight' => 70.0,
                         'notes'  => 'Feeling well',
                     ]);

    $response->assertStatus(201);
});

it('returns week info for current week', function () {
    $user = $this->createVerifiedPatient();
    Pregnancy::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/pregnancy/week/20');

    $response->assertOk();
});

it('adds a medication to pregnancy', function () {
    $user = $this->createVerifiedPatient();
    Pregnancy::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/pregnancy/medications', [
                         'name'      => 'Folic Acid',
                         'dosage'    => '400 mcg',
                         'frequency' => 'daily',
                         'start_date' => now()->toDateString(),
                     ]);

    $response->assertStatus(200);
});

it('records a kick counter session', function () {
    $user = $this->createVerifiedPatient();
    Pregnancy::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/pregnancy/kicks', [
                         'kick_count'       => 10,
                         'duration_seconds' => 60,
                         'started_at'       => now()->toDateTimeString(),
                         'ended_at'         => now()->addSeconds(60)->toDateTimeString(),
                     ]);

    $response->assertStatus(200);
});

it('lists kick sessions', function () {
    $user = $this->createVerifiedPatient();
    Pregnancy::factory()->create(['user_id' => $user->id, 'is_active' => true]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/pregnancy/kicks');

    $response->assertOk();
});
