<?php

use App\Models\AiChatMessage;
use App\Models\User;
use App\Services\ChatbotService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

/**
 * Feature Tests: Chatbot API Endpoints
 * اختبار كامل للـ API endpoints مع Mock للـ HTTP وQueue
 */

// إعداد مشترك لكل الاختبارات
beforeEach(function () {
    // إعداد Config مطلوب
    config([
        'chatbot.bots.public.url' => 'https://test-bot.hf.space',
        'chatbot.bots.pre_marriage.url' => 'https://test-bot.hf.space',
        'chatbot.bots.pregnancy.url' => 'https://test-bot.hf.space',
        'chatbot.bots.motherhood.url' => 'https://test-bot.hf.space',
        'chatbot.gradio.api_path' => '/gradio_api/call',
        'chatbot.gradio.chat_endpoint' => '/chatbot_fn',
        'chatbot.gradio.reset_endpoint' => '/reset_chat',
        'chatbot.gradio.admin_endpoint' => '/admin',
        'chatbot.limits.request_timeout' => 30,
        'chatbot.limits.max_message_length' => 1000,
        'chatbot.limits.max_history_messages' => 20,
        'chatbot.limits.public_rate_per_minute' => 100,
        'chatbot.limits.auth_rate_per_minute' => 100,
        'chatbot.cache.enabled' => false, // تعطيل Cache في الاختبارات
        'chatbot.stage_mapping' => [1 => 'pre_marriage', 2 => 'pregnancy', 3 => 'motherhood'],
        'chatbot.hf_token' => null,
    ]);

    // Mock Http لمنع الطلبات الحقيقية لـ HF
    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'test-event-123'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-123' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"هذا رد تجريبي من البوت\"}]}]\n\n",
            200
        ),
        'https://test-bot.hf.space/gradio_api/call/reset_chat' => Http::sequence()
            ->push(['event_id' => 'reset-event-456'], 200),
        'https://test-bot.hf.space/gradio_api/call/reset_chat/reset-event-456' => Http::response("event: complete\ndata: []\n\n", 200),
    ]);
});

// ============================================
// T4: POST /api/v1/chatbot/public/message
// ============================================
describe('POST /api/v1/chatbot/public/message', function () {

    it('returns bot reply for valid message', function () {
        $response = postJson('/api/v1/chatbot/public/message', [
            'message' => 'ما هي منصة وداد؟',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => ['reply', 'bot_type'],
            ])
            ->assertJsonPath('data.bot_type', 'public');
    });

    it('returns 422 when message is empty', function () {
        $response = postJson('/api/v1/chatbot/public/message', [
            'message' => '',
        ]);

        $response->assertStatus(422);
    });

    it('returns 422 when message exceeds max length', function () {
        $response = postJson('/api/v1/chatbot/public/message', [
            'message' => str_repeat('أ', 1001),
        ]);

        $response->assertStatus(422);
    });
});

// ============================================
// T5: POST /api/v1/patient/chatbot/message
// ============================================
describe('POST /api/v1/patient/chatbot/message', function () {

    it('dispatches queue job and returns processing status for authenticated user', function () {
        Queue::fake();

        // Create the referenced life stage first
        $stage = \App\Models\LifeStage::factory()->create(['id' => 2]);
        $user = User::factory()->create(['life_stage_id' => $stage->id, 'is_active' => 1]);

        $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
            'message' => 'ما هي أعراض الحمل؟',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => ['status', 'session_id', 'bot_type', 'message_id', 'user_message'],
            ])
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.bot_type', 'pregnancy');

        // تحقق أن الـ Job أُضيف للـ Queue
        Queue::assertPushedOn('chatbot', \App\Jobs\ProcessChatbotMessageJob::class);
    });

    it('returns 401 for unauthenticated request', function () {
        $response = postJson('/api/v1/patient/chatbot/message', [
            'message' => 'مرحبا',
        ]);

        $response->assertStatus(401);
    });

    it('saves user message to database', function () {
        Queue::fake();

        $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

        actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
            'message' => 'هل يمكنني الاستفسار؟',
        ]);

        $this->assertDatabaseHas('ai_chat_messages', [
            'user_id' => $user->id,
            'role' => 'user',
            'bot_type' => 'public',
            'message' => 'هل يمكنني الاستفسار؟',
        ]);
    });
});

// ============================================
// T6: GET /api/v1/patient/chatbot/messages/{id}/status
// ============================================
describe('GET /api/v1/patient/chatbot/messages/{id}/status', function () {

    it('returns processing status when message is pending', function () {
        $user = User::factory()->create(['is_active' => 1]);

        $msg = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => 'test_session_1',
            'bot_type' => 'public',
            'role' => 'user',
            'message' => 'سؤال تجريبي',
            'metadata' => ['status' => 'pending'],
        ]);

        $response = actingAs($user)->getJson("/api/v1/patient/chatbot/messages/{$msg->id}/status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'processing');
    });

    it('returns ready status with reply when message is replied', function () {
        $user = User::factory()->create(['is_active' => 1]);

        // رد البوت
        $botMsg = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => 'test_session_2',
            'bot_type' => 'public',
            'role' => 'assistant',
            'message' => 'هذا رد البوت',
            'metadata' => ['status' => 'ready'],
        ]);

        $userMsg = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => 'test_session_2',
            'bot_type' => 'public',
            'role' => 'user',
            'message' => 'سؤال تجريبي',
            'metadata' => ['status' => 'replied', 'reply_id' => $botMsg->id],
        ]);

        $botMsg->update(['metadata' => ['status' => 'ready', 'parent_id' => $userMsg->id]]);

        $response = actingAs($user)->getJson("/api/v1/patient/chatbot/messages/{$userMsg->id}/status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonStructure(['data' => ['status', 'reply']]);
    });

    it('returns failed status when job failed', function () {
        $user = User::factory()->create(['is_active' => 1]);

        $msg = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => 'test_session_3',
            'bot_type' => 'public',
            'role' => 'user',
            'message' => 'سؤال تجريبي',
            'metadata' => ['status' => 'failed'],
        ]);

        $response = actingAs($user)->getJson("/api/v1/patient/chatbot/messages/{$msg->id}/status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'failed');
    });
});

// ============================================
// GET /api/v1/patient/chatbot/sessions
// ============================================
describe('GET /api/v1/patient/chatbot/sessions', function () {

    it('returns all sessions when bot_type filter is not provided', function () {
        $user = User::factory()->create(['is_active' => 1]);

        AiChatMessage::factory()->create([
            'user_id' => $user->id,
            'session_id' => 'public_session_1',
            'bot_type' => 'public',
            'role' => 'user',
        ]);

        AiChatMessage::factory()->create([
            'user_id' => $user->id,
            'session_id' => 'pregnancy_session_1',
            'bot_type' => 'pregnancy',
            'role' => 'assistant',
        ]);

        $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    });

    it('returns only matching sessions when bot_type filter is provided', function () {
        $user = User::factory()->create(['is_active' => 1]);

        AiChatMessage::factory()->create([
            'user_id' => $user->id,
            'session_id' => 'public_session_2',
            'bot_type' => 'public',
            'role' => 'user',
        ]);

        AiChatMessage::factory()->create([
            'user_id' => $user->id,
            'session_id' => 'motherhood_session_1',
            'bot_type' => 'motherhood',
            'role' => 'assistant',
        ]);

        $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions?bot_type=public');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.bot_type', 'public');
    });

    it('returns 422 for invalid bot_type filter', function () {
        $user = User::factory()->create(['is_active' => 1]);

        $response = actingAs($user)->getJson('/api/v1/patient/chatbot/sessions?bot_type=invalid_bot');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bot_type']);
    });
});

// ============================================
// T7: DELETE /api/v1/patient/chatbot/messages (Right to Erasure)
// ============================================
describe('DELETE /api/v1/patient/chatbot/messages', function () {

    it('deletes all messages for the authenticated user', function () {
        $user = User::factory()->create(['is_active' => 1]);

        // إنشاء رسائل للمستخدم
        AiChatMessage::factory()->count(5)->create(['user_id' => $user->id, 'bot_type' => 'public']);
        // رسالة لمستخدم آخر (لا يجب حذفها)
        $otherUser = User::factory()->create(['is_active' => 1]);
        AiChatMessage::factory()->create(['user_id' => $otherUser->id, 'bot_type' => 'public']);

        $response = actingAs($user)->deleteJson('/api/v1/patient/chatbot/messages');

        $response->assertStatus(200)
            ->assertJsonPath('data.deleted_count', 5);

        // تأكد حذف رسائل المستخدم
        $this->assertDatabaseMissing('ai_chat_messages', ['user_id' => $user->id]);
        // تأكد بقاء رسائل المستخدم الآخر
        $this->assertDatabaseHas('ai_chat_messages', ['user_id' => $otherUser->id]);
    });
});

// ============================================
// T8: POST /api/v1/patient/chatbot/sessions/{id}/reset
// ============================================
describe('POST /api/v1/patient/chatbot/sessions/{id}/reset', function () {

    it('deletes all messages in the specified session', function () {
        $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

        $sessionId = 'public_test-session-abc123';

        // رسائل في الجلسة المطلوبة
        AiChatMessage::factory()->count(3)->create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'bot_type' => 'public',
        ]);

        // رسائل في جلسة أخرى (يجب ألا تُحذف)
        AiChatMessage::factory()->create([
            'user_id' => $user->id,
            'session_id' => 'other_session',
            'bot_type' => 'public',
        ]);

        $response = actingAs($user)->postJson("/api/v1/patient/chatbot/sessions/{$sessionId}/reset");

        $response->assertStatus(200)
            ->assertJsonPath('data.deleted_count', 3);

        // تأكد حذف رسائل الجلسة
        $this->assertDatabaseMissing('ai_chat_messages', [
            'user_id' => $user->id,
            'session_id' => $sessionId,
        ]);

        // تأكد بقاء الجلسة الأخرى
        $this->assertDatabaseHas('ai_chat_messages', [
            'user_id' => $user->id,
            'session_id' => 'other_session',
        ]);
    });
});

// ── Guest Message Status Security Tests ─────────────────────────────────────

it('returns message status when guest token is valid', function () {
    $token = bin2hex(random_bytes(32));
    $message = AiChatMessage::factory()->create([
        'bot_type' => 'public',
        'metadata' => [
            'guest_session_token' => $token,
            'status'              => 'ready',
        ],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(200);
});

it('returns 422 when guest token is missing', function () {
    $message = AiChatMessage::factory()->create([
        'bot_type' => 'public',
        'metadata' => ['guest_session_token' => 'sometoken', 'status' => 'ready'],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status"
    );

    $response->assertStatus(422);
});

it('returns 404 when guest token does not match message owner', function () {
    $correctToken = bin2hex(random_bytes(32));
    $wrongToken   = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
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

it('cannot access an authenticated user message via guest endpoint', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'pre_marriage', // not public
        'metadata' => ['guest_session_token' => $token, 'status' => 'ready'],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    // bot_type is not 'public', must not be found
    $response->assertStatus(404);
});

// ── Bot Toggle Integration Tests ─────────────────────────────────────────────

describe('Bot Toggle — Disabled bot rejects requests', function () {

    beforeEach(function () {
        // Enable test Cache (array driver in tests)
        \Illuminate\Support\Facades\Cache::put('chatbot_disabled:public', true, now()->addDays(1));
    });

    afterEach(function () {
        \Illuminate\Support\Facades\Cache::forget('chatbot_disabled:public');
        \Illuminate\Support\Facades\Cache::forget('chatbot_disabled:pregnancy');
    });

    it('returns error when guest sends message to disabled public bot', function () {
        $response = postJson('/api/v1/chatbot/public/message', [
            'message' => 'مرحبا!',
        ]);

        // The service returns ['success'=>false, 'code'=>'BOT_DISABLED']
        // Controller should return 503
        $response->assertStatus(503)
            ->assertJsonPath('message', fn ($msg) => str_contains($msg ?? '', 'موقوف') || str_contains($msg ?? '', 'BOT_DISABLED'));
    });

    it('returns error when authenticated patient sends to disabled bot', function () {
        \Illuminate\Support\Facades\Cache::put('chatbot_disabled:pregnancy', true, now()->addDays(1));
        \Illuminate\Support\Facades\Queue::fake();

        $stage = \App\Models\LifeStage::factory()->create(['id' => 2]);
        $user  = User::factory()->create(['life_stage_id' => $stage->id, 'is_active' => 1]);

        $response = actingAs($user)->postJson('/api/v1/patient/chatbot/widget-message', [
            'message' => 'ما هي أعراض الحمل؟',
        ]);

        // Bot is disabled — should not succeed
        $response->assertStatus(503);
    });
});

