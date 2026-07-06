<?php

/**
 * Section 2 — Authenticated Patient: Poll Message Status
 *
 * Tests: GET /api/v1/patient/chatbot/messages/{messageId}/status
 * Auth: auth:patient + PatientStatus
 */

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    config([
        'chatbot.bots.public.url'               => 'https://test-bot.hf.space',
        'chatbot.bots.pre_marriage.url'          => 'https://test-bot.hf.space',
        'chatbot.bots.pregnancy.url'             => 'https://test-bot.hf.space',
        'chatbot.bots.motherhood.url'            => 'https://test-bot.hf.space',
        'chatbot.gradio.api_path'                => '/gradio_api/call',
        'chatbot.gradio.chat_endpoint'           => '/chatbot_fn',
        'chatbot.gradio.reset_endpoint'          => '/reset_chat',
        'chatbot.gradio.admin_endpoint'          => '/admin',
        'chatbot.limits.request_timeout'         => 30,
        'chatbot.limits.max_message_length'      => 1000,
        'chatbot.limits.max_history_messages'    => 20,
        'chatbot.limits.public_rate_per_minute'  => 100,
        'chatbot.limits.auth_rate_per_minute'    => 100,
        'chatbot.cache.enabled'                  => false,
        'chatbot.stage_mapping'                  => [1 => 'pre_marriage', 2 => 'pregnancy', 3 => 'motherhood'],
        'chatbot.hf_token'                       => null,
        'chatbot.process_sync_in_local'          => false,
    ]);
});

// ── T2-01 ────────────────────────────────────────────────────────────────

it('T2-01 owner polls processing status correctly', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $userMsg = AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_test',
        'bot_type'   => 'public',
        'role'       => 'user',
        'metadata'   => ['status' => 'pending'],
    ]);

    $response = actingAs($user)->getJson(
        "/api/v1/patient/chatbot/messages/{$userMsg->id}/status"
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'processing');
});

// ── T2-02 ────────────────────────────────────────────────────────────────

it('T2-02 returns ready with reply when message is replied', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $userMsg = AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_test',
        'bot_type'   => 'public',
        'role'       => 'user',
        'metadata'   => ['status' => 'replied', 'reply_id' => null],
    ]);

    $botMsg = AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_test',
        'bot_type'   => 'public',
        'role'       => 'assistant',
        'message'    => 'هذا رد البوت',
        'metadata'   => ['status' => 'ready', 'parent_id' => $userMsg->id],
    ]);

    // Link reply
    $userMsg->update(['metadata' => ['status' => 'replied', 'reply_id' => $botMsg->id]]);

    $response = actingAs($user)->getJson(
        "/api/v1/patient/chatbot/messages/{$userMsg->id}/status"
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonStructure(['data' => ['status', 'reply']]);
});

// ── T2-03 ────────────────────────────────────────────────────────────────

it('T2-03 returns failed when message processing failed', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $userMsg = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => ['status' => 'failed'],
    ]);

    $response = actingAs($user)->getJson(
        "/api/v1/patient/chatbot/messages/{$userMsg->id}/status"
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'failed');
});

// ── T2-04 ────────────────────────────────────────────────────────────────

it('T2-04 user cannot poll another user message (ownership check)', function () {
    $owner = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    $msg = AiChatMessage::factory()->create([
        'user_id'  => $owner->id,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => ['status' => 'processing'],
    ]);

    $response = actingAs($other)->getJson(
        "/api/v1/patient/chatbot/messages/{$msg->id}/status"
    );

    $response->assertStatus(404);
});

// ── T2-05 ────────────────────────────────────────────────────────────────

it('T2-05 unauthenticated request returns 401', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $msg = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'public',
        'metadata' => ['status' => 'processing'],
    ]);

    $response = getJson("/api/v1/patient/chatbot/messages/{$msg->id}/status");

    $response->assertStatus(401);
});

// ── T2-06 ────────────────────────────────────────────────────────────────

it('T2-06 non-existent message id returns 404', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $response = actingAs($user)->getJson(
        '/api/v1/patient/chatbot/messages/999999/status'
    );

    $response->assertStatus(404);
});
