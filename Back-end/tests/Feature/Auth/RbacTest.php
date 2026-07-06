<?php

use App\Models\Admin;
use App\Models\Role;
use App\Models\User;
use App\Models\UserProfile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── View Analytics permission ────────────────────────────────────────────────

it('admin with view_analytics can access dashboard', function () {
    $role  = Role::factory()->withPermission('view_analytics')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/dashboard/stats');

    $response->assertOk();
});

it('admin without view_analytics gets 403 on dashboard', function () {
    $role  = Role::factory()->create(['permissions' => []]);
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/dashboard/stats');

    $response->assertStatus(403);
});

// ─── Manage Users permission ──────────────────────────────────────────────────

it('admin with manage_users can view patients list', function () {
    $role  = Role::factory()->withPermission('manage_users')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/patients');

    $response->assertOk();
});

it('admin without manage_users gets 403 on patients list', function () {
    $role  = Role::factory()->create(['permissions' => []]);
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/patients');

    $response->assertStatus(403);
});

// ─── Manage Financials permission ─────────────────────────────────────────────

it('admin with manage_financials can access financials', function () {
    $role  = Role::factory()->withPermission('manage_financials')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/financials/overview');

    $response->assertOk();
});

it('admin without manage_financials gets 403', function () {
    $role  = Role::factory()->create(['permissions' => []]);
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/financials/overview');

    $response->assertStatus(403);
});

// ─── Manage Chatbot permission ────────────────────────────────────────────────

it('admin with manage_chatbot can access chatbot management', function () {
    $role  = Role::factory()->withPermission('manage_chatbot')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/chatbot/stats');

    $response->assertOk();
});

// ─── Process Payouts permission ───────────────────────────────────────────────

it('admin with process_payouts can view payout requests', function () {
    $role  = Role::factory()->withPermission('manage_financials', 'process_payouts')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/financials/payouts');

    $response->assertOk();
});

it('admin without process_payouts gets 403 on payouts', function () {
    $role  = Role::factory()->withPermission('manage_financials')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/financials/payouts');

    $response->assertStatus(403);
});

// ─── Verify Doctors permission ────────────────────────────────────────────────

it('admin with verify_doctors can access doctor management', function () {
    $role  = Role::factory()->withPermission('verify_doctors')->create();
    $admin = Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/doctors');

    $response->assertOk();
});
