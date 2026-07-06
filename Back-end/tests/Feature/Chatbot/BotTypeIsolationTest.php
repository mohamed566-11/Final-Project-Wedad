<?php

/**
 * Section 6 — Bot Type Isolation
 *
 * Ensures messages from one bot never appear in another bot's filtered view.
 */

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;

beforeEach(function () {
    Queue::fake();

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

// ── T6-01 ────────────────────────────────────────────────────────────────

it('T6-01 getSessions with bot_type=pregnancy returns no public sessions', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'public_s1', 'bot_type' => 'public']);
    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'pregnancy_s1', 'bot_type' => 'pregnancy']);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions?bot_type=pregnancy');

    $response->assertStatus(200);
    $sessions = collect($response->json('data'));
    expect($sessions->pluck('bot_type')->unique()->toArray())->toBe(['pregnancy']);
    expect($sessions->pluck('session_id')->toArray())->not->toContain('public_s1');
});

// ── T6-02 ────────────────────────────────────────────────────────────────

it('T6-02 getSessions with bot_type=public returns no pregnancy sessions', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'public_s1', 'bot_type' => 'public']);
    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'pregnancy_s1', 'bot_type' => 'pregnancy']);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions?bot_type=public');

    $response->assertStatus(200);
    $sessions = collect($response->json('data'));
    expect($sessions->pluck('session_id')->toArray())->not->toContain('pregnancy_s1');
});

// ── T6-03 ────────────────────────────────────────────────────────────────

it('T6-03 getMessages for a session returns no messages from other sessions', function () {
    $user = User::factory()->create(['is_active' => 1]);

    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'pregnancy_s1', 'bot_type' => 'pregnancy', 'message' => 'msg1']);
    AiChatMessage::factory()->create(['user_id' => $user->id, 'session_id' => 'public_s1', 'bot_type' => 'public', 'message' => 'msg2']);

    $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions/pregnancy_s1/messages');

    $response->assertStatus(200);
    $messages = collect($response->json('data'));
    expect($messages)->toHaveCount(1);
});

// ── T6-04 ────────────────────────────────────────────────────────────────

it('T6-04 sending message with bot_type=motherhood stores correct bot_type', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message'  => 'سؤال عن الأمومة',
        'bot_type' => 'motherhood',
    ]);

    $this->assertDatabaseHas('ai_chat_messages', [
        'user_id'  => $user->id,
        'bot_type' => 'motherhood',
    ]);
});

// ── T6-05 ────────────────────────────────────────────────────────────────

it('T6-05 all 4 bot types are independently filterable', function () {
    $user = User::factory()->create(['is_active' => 1]);

    foreach (['public', 'pre_marriage', 'pregnancy', 'motherhood'] as $type) {
        AiChatMessage::factory()->create([
            'user_id'    => $user->id,
            'session_id' => "{$type}_test",
            'bot_type'   => $type,
        ]);
    }

    foreach (['public', 'pre_marriage', 'pregnancy', 'motherhood'] as $type) {
        $response = actingAs($user)->getJson("/api/v1/patient/chatbot/sessions?bot_type={$type}");
        $sessions = collect($response->json('data'));
        expect($sessions)->toHaveCount(1);
        expect($sessions->first()['bot_type'])->toBe($type);
    }
});

// ── T6-06 ────────────────────────────────────────────────────────────────

it('T6-06 auto-generated session_id is prefixed with bot_type', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message'           => 'سؤال',
        'bot_type'          => 'pregnancy',
        'force_new_session' => true,
    ]);

    $sessionId = $response->json('data.session_id');
    expect($sessionId)->toStartWith('pregnancy_');
});
