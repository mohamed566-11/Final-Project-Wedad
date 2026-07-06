<?php

namespace Tests\Feature\Notifications;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Skip middleware if necessary, or just rely on passing the right Auth Guard
        // $this->withoutMiddleware();
    }

    private function makePatientAndAuthenticate(): User
    {
        $patient = User::factory()->create(['is_active' => true]);
        $this->actingAs($patient, 'patient');
        return $patient;
    }

    private function makeDoctorAndAuthenticate(): Doctor
    {
        $doctor = Doctor::factory()->create(['is_active' => true]);
        $this->actingAs($doctor, 'doctor');
        return $doctor;
    }

    public function test_patient_can_get_notifications()
    {
        $patient = $this->makePatientAndAuthenticate();

        $patient->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'test.notification',
            'data' => ['title' => 'Test', 'message' => 'Hello World']
        ]);

        // assuming PatientStatus and EmailVerify middlewares are bypassed or data meets reqs
        $this->withoutMiddleware();

        $response = $this->getJson('/api/v1/patient/notifications');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.unread_count', 1);
    }

    public function test_mark_as_read_endpoint()
    {
        $patient = $this->makePatientAndAuthenticate();
        $this->withoutMiddleware();

        $notification = $patient->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'test.notification',
            'data' => []
        ]);

        $response = $this->postJson("/api/v1/patient/notifications/{$notification->id}/read");

        $response->assertStatus(200);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_mark_all_as_read_endpoint()
    {
        $patient = $this->makePatientAndAuthenticate();
        $this->withoutMiddleware();

        $patient->notifications()->create(['id' => \Illuminate\Support\Str::uuid(), 'type' => 'test', 'data' => []]);
        $patient->notifications()->create(['id' => \Illuminate\Support\Str::uuid(), 'type' => 'test', 'data' => []]);

        $this->assertEquals(2, $patient->unreadNotifications()->count());

        $response = $this->postJson('/api/v1/patient/notifications/read-all');

        $response->assertStatus(200);
        $this->assertEquals(0, $patient->unreadNotifications()->count());
    }

    public function test_notification_settings_validation_and_update()
    {
        $patient = $this->makePatientAndAuthenticate();
        $this->withoutMiddleware();

        // Send valid request
        $response = $this->putJson('/api/v1/patient/notifications/settings', [
            'push_notifications' => true,
            'new_booking_alerts' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.push_notifications', true)
            ->assertJsonPath('data.new_booking_alerts', false);

        // Verify it persisted in DB
        $settings = $patient->fresh()->notification_settings;
        $this->assertTrue($settings['push_notifications']);
        $this->assertFalse($settings['new_booking_alerts']);
    }

    public function test_notification_settings_empty_request_returns_422()
    {
        $patient = $this->makePatientAndAuthenticate();
        $this->withoutMiddleware();

        $response = $this->putJson('/api/v1/patient/notifications/settings', []);

        $response->assertStatus(422);
    }
}
