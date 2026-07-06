<?php

/**
 * Section 4 — Guest Message Status Security (IDOR Prevention)
 *
 * Tests the guestMessageStatus endpoint:
 *   GET /api/v1/chatbot/guest/message/{messageId}/status
 *
 * This is the MOST CRITICAL security section:
 * - Validates X-Guest-Session-Token ownership
 * - Enforces bot_type = 'public' isolation
 * - Prevents IDOR attacks
 */

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->markTestSkipped('Skipped public chatbot tests as per user request');
});

// ── T4-01: Valid guest token returns correct message status ──────────────

it('T4-01 returns message status when guest provides a valid token', function () {
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'processing',
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'processing');
});

// ── T4-02: Missing guest token returns 422 ──────────────────────────────

it('T4-02 returns 422 when guest token is missing', function () {
    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'metadata' => [
            'guest_session_token' => bin2hex(random_bytes(32)),
            'status'              => 'processing',
        ],
    ]);

    $response = getJson("/api/v1/chatbot/guest/message/{$message->id}/status");

    $response->assertStatus(422);
});

// ── T4-03: Wrong guest token returns 404 ────────────────────────────────

it('T4-03 returns 404 when guest token does not match (IDOR prevention)', function () {
    $correctToken = bin2hex(random_bytes(32));
    $wrongToken   = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'metadata' => [
            'guest_session_token' => $correctToken,
            'status'              => 'ready',
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $wrongToken]
    );

    $response->assertStatus(404);
});

// ── T4-04: Correct token but non-public bot_type returns 404 ────────────

it('T4-04 returns 404 when bot_type is not public even with correct token', function () {
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'pregnancy',   // ← not 'public'
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'ready',
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(404);
});

// ── T4-05: Authenticated user's message cannot be accessed via guest endpoint ─

it('T4-05 cannot access authenticated user message via guest endpoint', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'pre_marriage',  // not public
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'ready',
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    // bot_type is not 'public' → must not be found
    $response->assertStatus(404);
});

// ── T4-06: guest_token as query parameter works ─────────────────────────

it('T4-06 accepts guest_token as query parameter', function () {
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'processing',
        ],
    ]);

    $response = getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status?guest_token={$token}"
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'processing');
});

// ── T4-07: Rate limit triggers after 30 requests from same token ────────

it('T4-07 rate limit guest-chatbot-status kicks in after threshold', function () {
    // Re-register rate limiter with low threshold for testing
    \Illuminate\Support\Facades\RateLimiter::for('guest-chatbot-status', function ($request) {
        return \Illuminate\Cache\RateLimiting\Limit::perMinute(3)->by(
            $request->header('X-Guest-Session-Token') ?? $request->ip()
        );
    });

    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'processing',
        ],
    ]);

    $url = "/api/v1/chatbot/guest/message/{$message->id}/status";
    $headers = ['X-Guest-Session-Token' => $token];

    // First 3 should succeed
    $this->getJson($url, $headers)->assertStatus(200);
    $this->getJson($url, $headers)->assertStatus(200);
    $this->getJson($url, $headers)->assertStatus(200);

    // 4th should be throttled
    $this->getJson($url, $headers)->assertStatus(429);
});

// ── Bonus: "replied" status returns ready with reply ────────────────────

it('T4-01b returns ready with reply when guest message is replied', function () {
    $token = bin2hex(random_bytes(32));

    $userMsg = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'replied',
            'reply_id'            => null,
        ],
    ]);

    $botMsg = AiChatMessage::factory()->create([
        'user_id'    => null,
        'session_id' => $userMsg->session_id,
        'bot_type'   => 'public',
        'role'       => 'assistant',
        'message'    => 'هذا رد تجريبي',
        'metadata'   => ['status' => 'ready', 'parent_id' => $userMsg->id],
    ]);

    // Link the reply
    $userMsg->update([
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'replied',
            'reply_id'            => $botMsg->id,
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$userMsg->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonStructure(['data' => ['status', 'reply']]);
});

// ── Bonus: "failed" status returns failed ───────────────────────────────

it('T4-01c returns failed when guest message processing failed', function () {
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => null,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'failed',
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'failed');
});

// ── Bonus: Non-existent message ID returns 404 ─────────────────────────

it('T4-03b returns 404 for non-existent message ID', function () {
    $token = bin2hex(random_bytes(32));

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/999999/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(404);
});
