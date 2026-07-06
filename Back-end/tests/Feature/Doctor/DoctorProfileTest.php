<?php

use App\Models\Doctor;
use Tests\Traits\ActingAsDoctor;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsDoctor::class);

it('verified doctor can view their profile', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/profile');

    $response->assertOk();
});

it('verified doctor can update their profile', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->putJson('/api/v1/doctor/profile', [
                         'bio'                => 'طبيبة متخصصة في أمراض النساء والتوليد',
                         'consultation_price' => 300,
                         'specialization'     => 'gynecology',
                     ]);

    $response->assertOk();
});

it('verified doctor can view dashboard stats', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/dashboard/stats');

    $response->assertOk();
});

it('pending doctor cannot access verified doctor routes', function () {
    $doctor = $this->createPendingDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/dashboard/stats');

    $response->assertStatus(403);
});

it('verified doctor can view their patients', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/patients');

    $response->assertOk();
});
