<?php

use App\Models\User;
use App\Models\Doctor;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows a patient to get the vapid public key', function () {
    $patient = User::factory()->create();
    
    $response = $this->actingAs($patient, 'patient')
        ->getJson('/api/v1/patient/notifications/vapid-key');
        
    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'data' => [
                'vapid_key'
            ]
        ]);
});

it('allows a patient to subscribe and unsubscribe to push notifications', function () {
    $patient = User::factory()->create();
    
    // Subscribe
    $response = $this->actingAs($patient, 'patient')
        ->postJson('/api/v1/patient/notifications/subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint',
            'keys' => [
                'p256dh' => 'fake-p256dh-key',
                'auth' => 'fake-auth-key'
            ]
        ]);
        
    $response->assertStatus(200);
    $this->assertDatabaseHas('push_subscriptions', [
        'subscribable_type' => User::class,
        'subscribable_id' => $patient->id,
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint'
    ]);
    
    // Unsubscribe
    $unsubscribeResponse = $this->actingAs($patient, 'patient')
        ->postJson('/api/v1/patient/notifications/unsubscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint'
        ]);
        
    $unsubscribeResponse->assertStatus(200);
    $this->assertDatabaseMissing('push_subscriptions', [
        'subscribable_id' => $patient->id,
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint'
    ]);
});

it('allows a doctor to subscribe to push notifications', function () {
    $doctor = Doctor::factory()->create();
    
    $response = $this->actingAs($doctor, 'doctor')
        ->postJson('/api/v1/doctor/notifications/subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/doctor-endpoint',
            'keys' => [
                'p256dh' => 'fake-doctor-p256dh-key',
                'auth' => 'fake-doctor-auth-key'
            ]
        ]);
        
    $response->assertStatus(200);
    
    $this->assertDatabaseHas('push_subscriptions', [
        'subscribable_type' => Doctor::class,
        'subscribable_id' => $doctor->id,
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/doctor-endpoint'
    ]);
});
