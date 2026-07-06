<?php

use Tests\Traits\ActingAsAdmin;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsAdmin::class);

it('admin can view articles pending review', function () {
    $response = $this->actingAsAdmin(['review_articles'])
                     ->getJson('/api/v1/admin/articles');

    $response->assertOk();
});

it('admin with review_articles can approve article', function () {
    $article = \App\Models\Article::factory()->create(['status' => 'pending_review']);

    $response = $this->actingAsAdmin(['review_articles'])
                     ->postJson("/api/v1/admin/articles/{$article->id}/approve");

    $response->assertOk();
});

it('admin can reject article', function () {
    $article = \App\Models\Article::factory()->create(['status' => 'pending_review']);

    $response = $this->actingAsAdmin(['review_articles'])
                     ->putJson("/api/v1/admin/articles/{$article->id}/reject", [
                         'admin_notes' => 'Content is not accurate',
                     ]);

    $response->assertOk();
});

it('admin with manage_faqs can create FAQ', function () {
    $response = $this->actingAsAdmin(['manage_faqs'])
                     ->postJson('/api/v1/admin/faqs', [
                         'question' => 'ما هي الأعراض الشائعة للحمل؟',
                         'answer'   => 'من أبرز الأعراض: الغثيان، والتعب، وتأخر الدورة.',
                         'category' => 'pregnancy',
                     ]);

    $response->assertStatus(201);
});

it('admin can update site settings', function () {
    $response = $this->actingAsAdmin(['manage_settings'])
                     ->putJson('/api/v1/admin/settings/site', [
                         'name'     => 'وداد-تك',
                         'email'    => 'support@widad.tech',
                         'phone'    => '01001234567',
                     ]);

    $response->assertOk();
});

it('admin can view audit logs', function () {
    $response = $this->actingAsAdmin(['manage_settings'])
                     ->getJson('/api/v1/admin/settings/audit-logs');

    $response->assertOk();
});

it('admin can manage roles', function () {
    $response = $this->actingAsAdmin()
                     ->postJson('/api/v1/admin/settings/roles', [
                         'role'        => 'content_manager',
                         'permissions' => ['manage_articles', 'review_articles'],
                         'description' => 'Content management role',
                     ]);

    $response->assertStatus(201);
});
