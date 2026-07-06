<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Doctor;
use App\Models\Admin;
use App\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Patient token rejected on other guards ───────────────────────────────────

it('patient token rejected on doctor routes', function () {
    $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user, 'patient')
         ->getJson('/api/v1/doctor/data')
         ->assertStatus(401);
});

it('patient token rejected on admin routes', function () {
    $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
    UserProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user, 'patient')
         ->getJson('/api/v1/admin/data')
         ->assertStatus(401);
});

// ─── Doctor token rejected on other guards ────────────────────────────────────

it('doctor token rejected on patient protected routes', function () {
    $doctor = Doctor::factory()->approved()->create();

    $this->actingAs($doctor, 'doctor')
         ->getJson('/api/v1/patient/data')
         ->assertStatus(401);
});

it('doctor token rejected on admin routes', function () {
    $doctor = Doctor::factory()->approved()->create();

    $this->actingAs($doctor, 'doctor')
         ->getJson('/api/v1/admin/data')
         ->assertStatus(401);
});

// ─── Admin token rejected on other guards ────────────────────────────────────

it('admin token rejected on patient routes', function () {
    $role  = Role::factory()->superAdmin()->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $this->actingAs($admin, 'admin')
         ->getJson('/api/v1/patient/data')
         ->assertStatus(401);
});

it('admin token rejected on doctor routes', function () {
    $role  = Role::factory()->superAdmin()->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $this->actingAs($admin, 'admin')
         ->getJson('/api/v1/doctor/data')
         ->assertStatus(401);
});

// ─── Unauthenticated requests ──────────────────────────────────────────────────

it('unauthenticated request gets 401 on patient routes', function () {
    $this->getJson('/api/v1/patient/data')->assertStatus(401);
});

it('unauthenticated request gets 401 on doctor routes', function () {
    $this->getJson('/api/v1/doctor/data')->assertStatus(401);
});

it('unauthenticated request gets 401 on admin routes', function () {
    $this->getJson('/api/v1/admin/data')->assertStatus(401);
});
