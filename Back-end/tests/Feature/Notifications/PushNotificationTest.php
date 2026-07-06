<?php

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    Sanctum::actingAs($this->user, ['*'], 'patient');
});

it('can fetch vapid public key', function () {
    config()->set('webpush.vapid.public_key', 'test-public-key-123');

    $response = $this->getJson('/api/v1/patient/notifications/vapid-key');

    $response->assertStatus(200)
             ->assertJsonPath('status', true)
             ->assertJsonPath('data.vapid_key', 'test-public-key-123');
});

it('can subscribe device to push notifications', function () {
    $payload = [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint',
        'keys' => [
            'p256dh' => 'fake-p256dh-key',
            'auth' => 'fake-auth-key'
        ]
    ];

    $response = $this->postJson('/api/v1/patient/notifications/subscribe', $payload);

    $response->assertStatus(200)
             ->assertJsonPath('status', true);

    $this->assertDatabaseHas('push_subscriptions', [
        'subscribable_id' => $this->user->id,
        'subscribable_type' => get_class($this->user),
        'endpoint' => $payload['endpoint'],
        'p256dh_key' => $payload['keys']['p256dh']
    ]);
});

it('prevents duplicate subscription to same endpoint', function () {
    $payload = [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint-duplicate',
        'keys' => [
            'p256dh' => 'key1',
            'auth' => 'auth1'
        ]
    ];

    // First time
    $this->postJson('/api/v1/patient/notifications/subscribe', $payload);

    // Second time
    $response = $this->postJson('/api/v1/patient/notifications/subscribe', $payload);

    $response->assertStatus(200)
             ->assertJsonPath('message', 'الاشتراك موجود بالفعل');

    expect(PushSubscription::where('endpoint', $payload['endpoint'])->count())->toBe(1);
});

it('can unsubscribe from push notifications', function () {
    $subscription = PushSubscription::create([
        'subscribable_type' => get_class($this->user),
        'subscribable_id' => $this->user->id,
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/delete-me',
        'p256dh_key' => 'key',
        'auth_key' => 'auth',
    ]);

    $response = $this->postJson('/api/v1/patient/notifications/unsubscribe', [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/delete-me'
    ]);

    $response->assertStatus(200)
             ->assertJsonPath('status', true);

    $this->assertDatabaseMissing('push_subscriptions', [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/delete-me'
    ]);
});

it('can fetch default notification settings', function () {
    $response = $this->getJson('/api/v1/patient/notifications/settings');

    $response->assertStatus(200)
             ->assertJsonPath('status', true)
             ->assertJsonPath('data.push_notifications', true)
             ->assertJsonPath('data.marketing_emails', false);
});

it('can update notification settings', function () {
    $response = $this->putJson('/api/v1/patient/notifications/settings', [
        'push_notifications' => false,
        'marketing_emails' => true
    ]);

    $response->assertStatus(200)
             ->assertJsonPath('status', true)
             ->assertJsonPath('data.push_notifications', false)
             ->assertJsonPath('data.marketing_emails', true);

    $this->user->refresh();
    expect($this->user->notification_settings['push_notifications'])->toBeFalse();
    expect($this->user->notification_settings['marketing_emails'])->toBeTrue();
});

it('can list notifications', function () {
    $notificationId = Str::uuid()->toString();
    
    // Insert raw notification because we don't have a specific Notification class to trigger
    DatabaseNotification::insert([
        'id' => $notificationId,
        'type' => 'App\Notifications\AppointmentReminder',
        'notifiable_type' => get_class($this->user),
        'notifiable_id' => $this->user->id,
        'data' => json_encode(['title' => 'Reminder', 'message' => 'Your appointment is near']),
        'read_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/patient/notifications');

    $response->assertStatus(200)
             ->assertJsonPath('status', true)
             ->assertJsonStructure([
                 'data' => ['notifications', 'total', 'unread_count']
             ]);

    $data = $response->json('data.notifications');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($notificationId);
    expect($data[0]['title'])->toBe('Reminder');
});

it('can mark notification as read and fetch unread count', function () {
    $notificationId = Str::uuid()->toString();
    
    DatabaseNotification::insert([
        'id' => $notificationId,
        'type' => 'App\Notifications\SystemAlert',
        'notifiable_type' => get_class($this->user),
        'notifiable_id' => $this->user->id,
        'data' => json_encode(['title' => 'Alert', 'message' => 'Check this']),
        'read_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Check count 1
    $this->getJson('/api/v1/patient/notifications/unread-count')
         ->assertJsonPath('data.unread_count', 1);

    // Mark as read
    $response = $this->postJson("/api/v1/patient/notifications/{$notificationId}/read");
    $response->assertStatus(200);

    // Check count 0
    $this->getJson('/api/v1/patient/notifications/unread-count')
         ->assertJsonPath('data.unread_count', 0);
});

it('can mark all as read', function () {
    for ($i = 0; $i < 3; $i++) {
        DatabaseNotification::insert([
            'id' => Str::uuid()->toString(),
            'type' => 'App\Notifications\SystemAlert',
            'notifiable_type' => get_class($this->user),
            'notifiable_id' => $this->user->id,
            'data' => json_encode(['message' => 'alert']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $this->postJson('/api/v1/patient/notifications/read-all')->assertStatus(200);
    
    $this->getJson('/api/v1/patient/notifications/unread-count')
         ->assertJsonPath('data.unread_count', 0);
});

it('can delete a notification', function () {
    $notificationId = Str::uuid()->toString();
    
    DatabaseNotification::insert([
        'id' => $notificationId,
        'type' => 'App\Notifications\SystemAlert',
        'notifiable_type' => get_class($this->user),
        'notifiable_id' => $this->user->id,
        'data' => json_encode(['message' => 'alert']),
        'read_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->deleteJson("/api/v1/patient/notifications/{$notificationId}")->assertStatus(200);

    $this->assertDatabaseMissing('notifications', [
        'id' => $notificationId
    ]);
});
