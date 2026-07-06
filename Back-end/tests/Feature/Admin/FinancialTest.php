<?php

use Tests\Traits\ActingAsAdmin;
use Illuminate\Support\Facades\Http;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsAdmin::class);

beforeEach(function () {
    Http::fake(['*paymob*' => Http::response(['success' => true], 200)]);
});

it('admin with manage_financials can view financial overview', function () {
    $response = $this->actingAsAdmin(['manage_financials'])
                     ->getJson('/api/v1/admin/financials/overview');

    $response->assertOk();
});

it('admin without manage_financials gets 403', function () {
    $role  = \App\Models\Role::factory()->create(['permissions' => []]);
    $admin = \App\Models\Admin::factory()->create(['role_id' => $role->id]);

    $response = $this->actingAs($admin, 'admin')
                     ->getJson('/api/v1/admin/financials/overview');

    $response->assertStatus(403);
});

it('admin can view transactions', function () {
    $response = $this->actingAsAdmin(['manage_financials'])
                     ->getJson('/api/v1/admin/financials/transactions');

    $response->assertOk();
});

it('admin with process_payouts can view payout requests', function () {
    $response = $this->actingAsAdmin(['manage_financials', 'process_payouts'])
                     ->getJson('/api/v1/admin/financials/payouts');

    $response->assertOk();
});
