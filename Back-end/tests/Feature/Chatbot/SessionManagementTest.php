<?php

/**
 * Section 5 — Sessions Management
 *
 * Tests session CRUD endpoints:
 *   GET    /api/v1/patient/chatbot/sessions
 *   GET    /api/v1/patient/chatbot/sessions/{sessionId}/messages
 *   PATCH  /api/v1/patient/chatbot/sessions/{sessionId}/rename
 *   DELETE /api/v1/patient/chatbot/sessions/{sessionId}
 *   POST   /api/v1/patient/chatbot/sessions/{sessionId}/reset
 *   DELETE /api/v1/patient/chatbot/messages
 */

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\deleteJson;

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

    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/reset_chat' => Http::sequence()
            ->push(['event_id' => 'reset-event-456'], 200),
        'https://test-bot.hf.space/gradio_api/call/reset_chat/reset-event-456' => Http::response(
            "event: complete\ndata: []\n\n", 200
        ),
    ]);
});

// ── T5-01 getSessions returns only user's sessions ──────────────────────

it('T5-01 getSessions returns only sessions belonging to authenticated user', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'public_mine', 'bot_type' => 'public']);
    AiChatMessage::factory()->create(['user_id' => $other->id, 'session_id' => 'public_theirs', 'bot_type' => 'public']);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions');

    $response->assertStatus(200);
    $sessions = collect($response->json('data'));
    expect($sessions->pluck('session_id')->toArray())->toContain('public_mine');
    expect($sessions->pluck('session_id')->toArray())->not->toContain('public_theirs');
});

// ── T5-02 getSessions filtered by bot_type ──────────────────────────────

it('T5-02 getSessions filtered by bot_type returns correct sessions only', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'public_s1', 'bot_type' => 'public']);
    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'pregnancy_s1', 'bot_type' => 'pregnancy']);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions?bot_type=public');

    $response->assertStatus(200);
    $sessions = collect($response->json('data'));
    expect($sessions->pluck('bot_type')->unique()->toArray())->toBe(['public']);
});

// ── T5-03 getSessions invalid bot_type ──────────────────────────────────

it('T5-03 getSessions with invalid bot_type returns 422', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions?bot_type=invalid');

    $response->assertStatus(422);
});

// ── T5-04 getSessions does not leak other users' sessions ───────────────

it('T5-04 getSessions does not leak other users sessions', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->count(3)->create(['user_id' => $other->id, 'bot_type' => 'public']);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions');

    $response->assertStatus(200);
    $sessions = collect($response->json('data'));
    expect($sessions)->toBeEmpty();
});

// ── T5-05 getMessages returns messages for correct session ──────────────

it('T5-05 getMessages returns messages for correct session_id and user', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->count(3)->create([
        'user_id'    => $user->id,
        'session_id' => 'public_s1',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions/public_s1/messages');

    $response->assertStatus(200);
    expect(count($response->json('data')))->toBe(3);
});

// ── T5-06 getMessages empty for non-owned session ──────────────────────

it('T5-06 getMessages returns empty array for session not owned by user', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $other->id,
        'session_id' => 'public_other',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions/public_other/messages');

    $response->assertStatus(200);
    expect($response->json('data'))->toBeEmpty();
});

// ── T5-07 renameSession updates session_title ───────────────────────────

it('T5-07 renameSession updates session_title in metadata', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_abc123',
        'bot_type'   => 'public',
        'metadata'   => [],
    ]);

    $response = actingAs($user)->patchJson(
        '/api/v1/patient/chatbot/sessions/public_abc123/rename',
        ['title' => 'محادثة عن الحمل']
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'محادثة عن الحمل');

    // Verify DB metadata updated
    $msg = AiChatMessage::where('session_id', 'public_abc123')->first();
    expect($msg->metadata['session_title'])->toBe('محادثة عن الحمل');
});

// ── T5-08 renameSession 404 for non-owned ───────────────────────────────

it('T5-08 renameSession returns 404 for session not owned by user', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $other->id,
        'session_id' => 'public_other',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->patchJson(
        '/api/v1/patient/chatbot/sessions/public_other/rename',
        ['title' => 'محاولة اختراق']
    );

    $response->assertStatus(404);
});

// ── T5-09 renameSession 422 empty title ─────────────────────────────────

it('T5-09 renameSession returns 422 if title is empty', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_abc',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->patchJson(
        '/api/v1/patient/chatbot/sessions/public_abc/rename',
        ['title' => '']
    );

    $response->assertStatus(422);
});

// ── T5-10 renameSession 422 title too long ──────────────────────────────

it('T5-10 renameSession returns 422 if title exceeds 120 characters', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_abc',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->patchJson(
        '/api/v1/patient/chatbot/sessions/public_abc/rename',
        ['title' => str_repeat('ع', 121)]
    );

    $response->assertStatus(422);
});

// ── T5-11 deleteSession removes all messages ────────────────────────────

it('T5-11 deleteSession removes all messages and returns deleted_count', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->count(5)->create([
        'user_id'    => $user->id,
        'session_id' => 'pregnancy_xyz',
        'bot_type'   => 'pregnancy',
    ]);

    $response = actingAs($user)->deleteJson('/api/v1/patient/chatbot/sessions/pregnancy_xyz');

    $response->assertStatus(200)
        ->assertJsonPath('data.deleted_count', 5);

    $this->assertDatabaseMissing('ai_chat_messages', [
        'user_id'    => $user->id,
        'session_id' => 'pregnancy_xyz',
    ]);
});

// ── T5-12 deleteSession 404 for non-owned ───────────────────────────────

it('T5-12 deleteSession returns 404 for session not owned by user', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $other->id,
        'session_id' => 'public_other',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->deleteJson('/api/v1/patient/chatbot/sessions/public_other');

    $response->assertStatus(404);
});

// ── T5-13 resetSession clears messages ──────────────────────────────────

it('T5-13 resetSession clears all messages and returns deleted_count', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->count(4)->create([
        'user_id'    => $user->id,
        'session_id' => 'public_reset_test',
        'bot_type'   => 'public',
    ]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/sessions/public_reset_test/reset');

    $response->assertStatus(200)
        ->assertJsonPath('data.deleted_count', 4);
});

// ── T5-14 resetSession calls chatbotService->resetChat ──────────────────

it('T5-14 resetSession calls chatbotService resetChat via HTTP', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_reset2',
        'bot_type'   => 'public',
    ]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/sessions/public_reset2/reset');

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'reset_chat');
    });
});

// ── T5-15 deleteAllMessages (Right to Erasure) ─────────────────────────

it('T5-15 deleteAllMessages deletes ONLY current user messages', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->count(3)->create(['user_id' => $user->id, 'bot_type' => 'public']);
    AiChatMessage::factory()->count(2)->create(['user_id' => $other->id, 'bot_type' => 'public']);

    $response = actingAs($user)->deleteJson('/api/v1/patient/chatbot/messages');

    $response->assertStatus(200)
        ->assertJsonPath('data.deleted_count', 3);

    // Other user's messages should remain
    expect(AiChatMessage::where('user_id', $other->id)->count())->toBe(2);
});
