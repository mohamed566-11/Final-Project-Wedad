<?php

/**
 * Section 3 — Guest: Send Message (Public Bot)
 *
 * Tests: POST /api/v1/chatbot/public/message
 * Auth: None (public route)
 */

use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\postJson;

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
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::response(['event_id' => 'test-event-123'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-123' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"هذا رد تجريبي من البوت\"}]}]\n\n",
            200
        ),
    ]);
});

// ── T3-01 ────────────────────────────────────────────────────────────────

it('T3-01 guest can send a message without authentication', function () {
    $response = postJson('/api/v1/chatbot/public/message', [
        'message' => 'ما هي منصة وداد؟',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status', 'message',
            'data' => ['reply', 'bot_type'],
        ])
        ->assertJsonPath('data.bot_type', 'public');
});

// ── T3-02 ────────────────────────────────────────────────────────────────

it('T3-02 response contains reply and bot_type=public', function () {
    $response = postJson('/api/v1/chatbot/public/message', [
        'message' => 'كيف أسجل في المنصة؟',
    ]);

    $response->assertStatus(200);
    $data = $response->json('data');

    expect($data['bot_type'])->toBe('public');
    expect($data['reply'])->toBeString()->not->toBeEmpty();
});

// ── T3-03 ────────────────────────────────────────────────────────────────

it('T3-03 empty message returns 422', function () {
    $response = postJson('/api/v1/chatbot/public/message', [
        'message' => '',
    ]);

    $response->assertStatus(422);
});

// ── T3-04 ────────────────────────────────────────────────────────────────

it('T3-04 message exceeding max length returns 422', function () {
    $response = postJson('/api/v1/chatbot/public/message', [
        'message' => str_repeat('أ', 1001),
    ]);

    $response->assertStatus(422);
});

// ── T3-05 ────────────────────────────────────────────────────────────────

it('T3-05 rate limit chatbot_public kicks in after configured threshold', function () {
    config(['chatbot.limits.public_rate_per_minute' => 2]);

    // Re-register rate limiter with new config
    (new \App\Providers\AppServiceProvider(app()))->boot();

    postJson('/api/v1/chatbot/public/message', ['message' => 'رسالة 1'])->assertStatus(200);
    postJson('/api/v1/chatbot/public/message', ['message' => 'رسالة 2'])->assertStatus(200);
    $response = postJson('/api/v1/chatbot/public/message', ['message' => 'رسالة 3']);
    if ($response->status() !== 429) {
        $response->dump();
    }
    $response->assertStatus(429);
});
