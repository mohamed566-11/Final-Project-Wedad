<?php

use App\Models\User;
use App\Models\PatientChatbotPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Chatbot Data Preferences API', function () {

    it('GET /data-preferences returns defaults for new user', function () {
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($user, 'patient')
            ->getJson('/api/v1/patient/chatbot/data-preferences');

        $response->assertOk()
            ->assertJsonFragment(['data_access_enabled' => true]);
    });

    it('PUT /data-preferences disables data access', function () {
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($user, 'patient')
            ->putJson('/api/v1/patient/chatbot/data-preferences', [
                'data_access_enabled' => false,
            ]);

        $response->assertOk()
            ->assertJsonFragment(['data_access_enabled' => false]);

        $this->assertDatabaseHas('patient_chatbot_preferences', [
            'user_id' => $user->id,
            'data_access_enabled' => 0, // false in mysql/sqlite is usually 0
        ]);
    });

    it('PUT /data-preferences validates boolean field', function () {
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($user, 'patient')
            ->putJson('/api/v1/patient/chatbot/data-preferences', [
                'data_access_enabled' => 'not_a_boolean',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('data_access_enabled');
    });
});
