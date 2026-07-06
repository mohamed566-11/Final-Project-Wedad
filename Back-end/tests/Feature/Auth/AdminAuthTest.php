<?php

use App\Models\Admin;
use App\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Admin Login ──────────────────────────────────────────────────────────────

it('admin can login successfully', function () {
    $role = Role::factory()->superAdmin()->create();
    $admin = Admin::factory()->create([
        'email'     => 'admin@example.com',
        'password'  => bcrypt('password'),
        'role_id'   => $role->id,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/admin/auth/login', [
        'email'    => 'admin@example.com',
        'password' => 'password',
    ]);

    $response->assertOk()
             ->assertJsonStructure(['data' => ['token']]);
});

it('inactive admin cannot login', function () {
    $role = Role::factory()->superAdmin()->create();
    $admin = Admin::factory()->inactive()->create([
        'email'    => 'inactive_admin@example.com',
        'password' => bcrypt('password'),
        'role_id'  => $role->id,
    ]);

    $response = $this->postJson('/api/v1/admin/auth/login', [
        'email'    => 'inactive_admin@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

it('admin token cannot access patient routes', function () {
    $role  = Role::factory()->superAdmin()->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/patient/data');

    $response->assertStatus(401);
});

it('admin token cannot access doctor routes', function () {
    $role  = Role::factory()->superAdmin()->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/doctor/data');

    $response->assertStatus(401);
});
