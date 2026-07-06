<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Admin;
use App\Models\Role;
use App\Models\Doctor;
use Tests\Traits\ActingAsAdmin;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsAdmin::class);

// ─── Patients Management ──────────────────────────────────────────────────────

it('admin can list patients with pagination', function () {
    User::factory()->count(5)->create(['is_active' => true]);

    $response = $this->actingAsAdmin(['manage_users'])
                     ->getJson('/api/v1/admin/patients');

    $response->assertOk()
             ->assertJsonStructure(['data']);
});

it('admin can view single patient', function () {
    $patient = User::factory()->create(['is_active' => true]);

    $response = $this->actingAsAdmin(['manage_users'])
                     ->getJson("/api/v1/admin/patients/{$patient->id}");

    $response->assertOk();
});

it('admin with manage_users can toggle patient status', function () {
    $patient = User::factory()->create(['is_active' => true]);

    $response = $this->actingAsAdmin(['manage_users'])
                     ->putJson("/api/v1/admin/patients/{$patient->id}/toggle-status", [
                         'is_active' => false,
                         'reason' => 'Violation of terms',
                     ]);

    $response->assertOk();
});

it('admin without manage_users cannot toggle patient status', function () {
    $patient = User::factory()->create();
    $role    = Role::factory()->create(['permissions' => []]); // no permissions
    $admin   = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->putJson("/api/v1/admin/patients/{$patient->id}/toggle-status", [
                         'is_active' => false,
                         'reason' => 'Violation of terms',
                     ]);

    $response->assertStatus(403);
});

it('admin with manage_users can soft delete patient', function () {
    $patient = User::factory()->create();

    $response = $this->actingAsAdmin(['manage_users'])
                     ->deleteJson("/api/v1/admin/patients/{$patient->id}");

    $response->assertOk();
    $this->assertSoftDeleted('users', ['id' => $patient->id]);
});

// ─── Doctors Management ───────────────────────────────────────────────────────

it('admin can list doctors', function () {
    Doctor::factory()->count(3)->create();

    $response = $this->actingAsAdmin(['verify_doctors'])
                     ->getJson('/api/v1/admin/doctors');

    $response->assertOk();
});

it('admin with verify_doctors can verify a doctor', function () {
    $doctor = Doctor::factory()->pending()->create();

    $response = $this->actingAsAdmin(['manage_doctors', 'verify_doctors'])
                     ->putJson("/api/v1/admin/doctors/{$doctor->id}/verify", [
                         'verification_status' => 'approved',
                     ]);

    $response->assertOk();
    $this->assertDatabaseHas('doctors', [
        'id'                  => $doctor->id,
        'verification_status' => 'approved',
    ]);
});

it('admin with verify_doctors can reject a doctor', function () {
    $doctor = Doctor::factory()->pending()->create();

    $response = $this->actingAsAdmin(['manage_doctors', 'verify_doctors'])
                     ->putJson("/api/v1/admin/doctors/{$doctor->id}/reject", [
                         'verification_status' => 'rejected',
                         'rejection_reason' => 'Invalid license',
                     ]);

    $response->assertOk();
    $this->assertDatabaseHas('doctors', [
        'id'                  => $doctor->id,
        'verification_status' => 'rejected',
    ]);
});

it('admin can view join requests', function () {
    $response = $this->actingAsAdmin(['verify_doctors'])
                     ->getJson('/api/v1/admin/join-requests');

    $response->assertOk();
});
