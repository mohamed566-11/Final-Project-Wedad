<?php

/**
 * Section 1 — Authenticated Patient: Send Message
 *
 * Tests: POST /api/v1/patient/chatbot/message
 * Auth: auth:patient + PatientStatus
 */

use App\Jobs\ProcessChatbotMessageJob;
use App\Models\AiChatMessage;
use App\Models\User;
use App\Models\LifeStage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

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

    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'test-event-123'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-123' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"هذا رد تجريبي\"}]}]\n\n",
            200
        ),
    ]);
});

// ── T1-01 ────────────────────────────────────────────────────────────────

it('T1-01 authenticated user can send a message and receives processing status', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'ما هي أعراض الحمل الأولى؟',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'processing')
        ->assertJsonPath('data.bot_type', 'public');
});

// ── T1-02 ────────────────────────────────────────────────────────────────

it('T1-02 message is stored in DB with correct user_id, bot_type, session_id', function () {
    $stage = LifeStage::factory()->create(['id' => 2]);
    $user = User::factory()->create(['life_stage_id' => $stage->id, 'is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال تجريبي',
    ]);

    $this->assertDatabaseHas('ai_chat_messages', [
        'user_id'  => $user->id,
        'bot_type' => 'pregnancy',
        'role'     => 'user',
    ]);
});

// ── T1-03 ────────────────────────────────────────────────────────────────

it('T1-03 ProcessChatbotMessageJob is dispatched to chatbot queue', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    Queue::assertPushedOn('chatbot', ProcessChatbotMessageJob::class);
});

// ── T1-04 ────────────────────────────────────────────────────────────────

it('T1-04 unauthenticated user receives 401', function () {
    $response = postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    $response->assertStatus(401);
});

// ── T1-05 ────────────────────────────────────────────────────────────────

it('T1-05 inactive user is rejected by PatientStatus middleware', function () {
    $user = User::factory()->create(['is_active' => 0]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    // PatientStatus middleware should block inactive users
    $response->assertStatus(403);
});

// ── T1-06 ────────────────────────────────────────────────────────────────

it('T1-06 empty message body returns 422 validation error', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => '',
    ]);

    $response->assertStatus(422);
});

// ── T1-07 ────────────────────────────────────────────────────────────────

it('T1-07 message exceeding max length returns 422', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => str_repeat('أ', 1001),
    ]);

    $response->assertStatus(422);
});

// ── T1-08 ────────────────────────────────────────────────────────────────

it('T1-08 valid bot_type values are accepted', function () {
    $user = User::factory()->create(['is_active' => 1]);

    foreach (['public', 'pre_marriage', 'pregnancy', 'motherhood'] as $type) {
        $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
            'message'  => 'سؤال',
            'bot_type' => $type,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.bot_type', $type);
    }
});

// ── T1-09 ────────────────────────────────────────────────────────────────

it('T1-09 invalid bot_type value returns 422', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message'  => 'سؤال',
        'bot_type' => 'invalid_type',
    ]);

    $response->assertStatus(422);
});

// ── T1-10 ────────────────────────────────────────────────────────────────

it('T1-10 session_id is auto-generated when not provided', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    $sessionId = $response->json('data.session_id');
    expect($sessionId)->toBeString()->not->toBeEmpty();
    // Session ID should start with bot_type prefix
    expect($sessionId)->toStartWith('public_');
});

// ── T1-11 ────────────────────────────────────────────────────────────────

it('T1-11 provided session_id is reused correctly', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);
    $customSessionId = 'public_my-custom-session-123';

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message'    => 'سؤال',
        'session_id' => $customSessionId,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.session_id', $customSessionId);
});

// ── T1-12 ────────────────────────────────────────────────────────────────

it('T1-12 force_new_session creates a new session even if recent one exists', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    // Create a recent message so getOrCreateSession would find it
    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_existing_123',
        'bot_type'   => 'public',
        'role'       => 'user',
        'created_at' => now(),
    ]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message'           => 'رسالة جديدة',
        'force_new_session' => true,
    ]);

    $response->assertStatus(200);
    $newSessionId = $response->json('data.session_id');
    expect($newSessionId)->not->toBe('public_existing_123');
});

// ── T1-13 ────────────────────────────────────────────────────────────────

it('T1-13 response includes all required fields', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'status',
                'session_id',
                'bot_type',
                'message_id',
                'user_message',
            ],
        ]);
});

// ── T1-14 ────────────────────────────────────────────────────────────────

it('T1-14 bot_type defaults to life_stage mapping when not provided', function () {
    // life_stage_id=1 → pre_marriage
    $stage1 = LifeStage::factory()->create(['id' => 1]);
    $user1 = User::factory()->create(['life_stage_id' => $stage1->id, 'is_active' => 1]);

    $r1 = actingAs($user1)->postJson('/api/v1/patient/chatbot/message', ['message' => 'سؤال']);
    $r1->assertJsonPath('data.bot_type', 'pre_marriage');

    // life_stage_id=3 → motherhood
    $stage3 = LifeStage::factory()->create(['id' => 3]);
    $user3 = User::factory()->create(['life_stage_id' => $stage3->id, 'is_active' => 1]);

    $r3 = actingAs($user3)->postJson('/api/v1/patient/chatbot/message', ['message' => 'سؤال']);
    $r3->assertJsonPath('data.bot_type', 'motherhood');

    // life_stage_id=null → public
    $userNull = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    $rNull = actingAs($userNull)->postJson('/api/v1/patient/chatbot/message', ['message' => 'سؤال']);
    $rNull->assertJsonPath('data.bot_type', 'public');
});
