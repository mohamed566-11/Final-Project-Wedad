<?php

use Tests\Traits\ActingAsAdmin;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsAdmin::class);

it('admin with view_analytics can see dashboard stats', function () {
    $response = $this->actingAsAdmin(['view_analytics'])
                     ->getJson('/api/v1/admin/dashboard/stats');

    $response->assertOk();
});

it('admin can view analytics overview', function () {
    $response = $this->actingAsAdmin(['view_analytics'])
                     ->getJson('/api/v1/admin/analytics/overview');

    $response->assertOk();
});

it('admin can view AI model analytics', function () {
    $response = $this->actingAsAdmin(['view_analytics'])
                     ->getJson('/api/v1/admin/ai-center/analytics');

    $response->assertOk();
});

it('admin can view chatbot stats', function () {
    $response = $this->actingAsAdmin(['manage_chatbot'])
                     ->getJson('/api/v1/admin/chatbot/stats');

    $response->assertOk();
});

it('admin can view chatbot conversations', function () {
    $response = $this->actingAsAdmin(['manage_chatbot'])
                     ->getJson('/api/v1/admin/chatbot/conversations');

    $response->assertOk();
});
