<?php

use App\Models\Doctor;
use Tests\Traits\ActingAsDoctor;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsDoctor::class);

it('doctor can set working hours', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->putJson('/api/v1/doctor/working-hours', [
                         'working_hours' => [
                             ['day' => 'monday',    'start_time' => '09:00', 'end_time' => '17:00'],
                             ['day' => 'wednesday',  'start_time' => '10:00', 'end_time' => '15:00'],
                         ],
                     ]);

    $response->assertOk();
});

it('doctor can get their working hours', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->getJson('/api/v1/doctor/working-hours');

    $response->assertOk();
});

it('doctor can update availability status', function () {
    $doctor = $this->createVerifiedDoctor();

    $response = $this->actingAs($doctor, 'doctor')
                     ->putJson('/api/v1/doctor/profile/availability', [
                         'is_available' => true,
                     ]);

    $response->assertOk();
});
