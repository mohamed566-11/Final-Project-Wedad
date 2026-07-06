<?php

use App\Models\User;
use App\Models\PatientGoogleFit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Traits\ActingAsPatient;

uses(RefreshDatabase::class, ActingAsPatient::class);

test('guest cannot access iot routes', function () {
    $response = $this->getJson('/api/v1/patient/iot/metrics');
    
    // Either 401 or whatever the auth middleware returns
    $response->assertStatus(401);
});

test('authenticated patient can fetch auth url', function () {
    $user = $this->createVerifiedPatient();

    // Patient metrics route requires auth:patient and other middlewares.
    // Sanctum actingAs requires guard to be specified if not default
    $response = $this->actingAs($user, 'patient')
        ->getJson('/api/v1/patient/iot/auth-url');

    $response->assertStatus(200);
    $response->assertJsonStructure(['url']);
});

test('authenticated patient without connection receives disconnected metrics state', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
        ->getJson('/api/v1/patient/iot/metrics');

    $response->assertStatus(200);
    $response->assertJson(['is_connected' => false]);
});
