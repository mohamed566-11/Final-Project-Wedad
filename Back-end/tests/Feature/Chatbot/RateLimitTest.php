<?php

/**
 * Section 8 — Rate Limiting
 *
 * Tests all chatbot rate limiters:
 *   - chatbot_auth   (auth send endpoint)
 *   - chatbot_public (guest send endpoint)
 *   - guest-chatbot-status (guest polling)
 */

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->markTestSkipped('Skipped chatbot test as per user request');

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

    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'ev-1'], 200)
            ->push(['event_id' => 'ev-2'], 200)
            ->push(['event_id' => 'ev-3'], 200)
            ->push(['event_id' => 'ev-4'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/*' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"رد\"}]}]\n\n",
            200
        ),
    ]);
});

// ── T8-01 ────────────────────────────────────────────────────────────────

it('T8-01 authenticated user is rate-limited on chatbot_auth after threshold', function () {
    // Set very low limit
    RateLimiter::for('chatbot_auth', function ($request) {
        return Limit::perMinute(2)->by($request->user()?->id ?: $request->ip());
    });

    $user = User::factory()->create(['is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م1'])->assertStatus(200);
    actingAs($user)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م2'])->assertStatus(200);
    actingAs($user)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م3'])->assertStatus(429);
});

// ── T8-02 ────────────────────────────────────────────────────────────────

it('T8-02 guest user is rate-limited on chatbot_public', function () {
    RateLimiter::for('chatbot_public', function ($request) {
        return Limit::perMinute(2)->by($request->ip());
    });

    postJson('/api/v1/chatbot/public/message', ['message' => 'م1'])->assertStatus(200);
    postJson('/api/v1/chatbot/public/message', ['message' => 'م2'])->assertStatus(200);
    postJson('/api/v1/chatbot/public/message', ['message' => 'م3'])->assertStatus(429);
});

// ── T8-03 ────────────────────────────────────────────────────────────────

it('T8-03 guest status endpoint is rate-limited', function () {
    RateLimiter::for('guest-chatbot-status', function ($request) {
        return Limit::perMinute(2)->by(
            $request->header('X-Guest-Session-Token') ?? $request->ip()
        );
    });

    $token = bin2hex(random_bytes(32));
    $msg = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'metadata' => ['guest_session_token' => $token, 'status' => 'processing'],
    ]);

    $url = "/api/v1/chatbot/guest/message/{$msg->id}/status";
    $headers = ['X-Guest-Session-Token' => $token];

    $this->getJson($url, $headers)->assertStatus(200);
    $this->getJson($url, $headers)->assertStatus(200);
    $this->getJson($url, $headers)->assertStatus(429);
});

// ── T8-04 ────────────────────────────────────────────────────────────────

it('T8-04 rate limit response returns 429 status code', function () {
    RateLimiter::for('chatbot_public', function ($request) {
        return Limit::perMinute(1)->by($request->ip());
    });

    postJson('/api/v1/chatbot/public/message', ['message' => 'م1'])->assertStatus(200);
    $response = postJson('/api/v1/chatbot/public/message', ['message' => 'م2']);

    $response->assertStatus(429);
});

// ── T8-05 ────────────────────────────────────────────────────────────────

it('T8-05 different users do not share rate limit buckets', function () {
    RateLimiter::for('chatbot_auth', function ($request) {
        return Limit::perMinute(2)->by($request->user()?->id ?: $request->ip());
    });

    $user1 = User::factory()->create(['is_active' => 1]);
    $user2 = User::factory()->create(['is_active' => 1]);

    // User 1 hits limit
    actingAs($user1)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م1'])->assertStatus(200);
    actingAs($user1)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م2'])->assertStatus(200);
    actingAs($user1)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م3'])->assertStatus(429);

    // User 2 should still be able to send
    actingAs($user2)->postJson('/api/v1/patient/chatbot/message', ['message' => 'م1'])->assertStatus(200);
});
