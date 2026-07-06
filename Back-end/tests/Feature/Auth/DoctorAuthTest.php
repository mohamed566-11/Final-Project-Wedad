<?php

use App\Models\Doctor;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Doctor Login ─────────────────────────────────────────────────────────────

it('doctor can login with approved status', function () {
    $doctor = Doctor::factory()->approved()->create([
        'email'    => 'approved@doctor.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/v1/doctor/auth/login', [
        'email'    => 'approved@doctor.com',
        'password' => 'password',
    ]);

    $response->assertOk()
             ->assertJsonStructure(['data' => ['token']]);
});

it('doctor cannot login with pending status', function () {
    $doctor = Doctor::factory()->pending()->create([
        'email'    => 'pending@doctor.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/v1/doctor/auth/login', [
        'email'    => 'pending@doctor.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('doctor cannot login with rejected status', function () {
    $doctor = Doctor::factory()->rejected()->create([
        'email'    => 'rejected@doctor.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/v1/doctor/auth/login', [
        'email'    => 'rejected@doctor.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('doctor token has doctor guard', function () {
    $doctor = Doctor::factory()->approved()->create();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/data');

    $response->assertOk();
});

it('doctor token cannot access patient routes', function () {
    $doctor = Doctor::factory()->approved()->create();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/patient/data');

    $response->assertStatus(401);
});
