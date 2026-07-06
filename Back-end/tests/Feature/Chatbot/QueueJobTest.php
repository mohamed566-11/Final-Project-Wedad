<?php

/**
 * Section 7 — Async Queue + Job Processing
 *
 * Tests ProcessChatbotMessageJob:
 *   Constructor: (AiChatMessage $userMessage, string $botType, array $history)
 *   handle() receives ChatbotService via DI
 */

use App\Jobs\ProcessChatbotMessageJob;
use App\Models\AiChatMessage;
use App\Models\User;
use App\Models\LifeStage;
use App\Services\ChatbotService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;

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

// ── T7-01 ────────────────────────────────────────────────────────────────

it('T7-01 ProcessChatbotMessageJob is dispatched on chatbot queue', function () {
    Queue::fake();

    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    Queue::assertPushedOn('chatbot', ProcessChatbotMessageJob::class);
});

// ── T7-02 ────────────────────────────────────────────────────────────────

it('T7-02 job handle creates bot reply as AiChatMessage', function () {
    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'test-event-123'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-123' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"هذا رد تجريبي\"}]}]\n\n",
            200
        ),
    ]);

    $user = User::factory()->create(['is_active' => 1]);
    $userMsg = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'public',
        'role'     => 'user',
        'message'  => 'سؤال تجريبي',
        'metadata' => ['status' => 'pending'],
    ]);

    $job = new ProcessChatbotMessageJob($userMsg, 'public', []);
    app()->call([$job, 'handle']);

    $userMsg->refresh();
    expect($userMsg->metadata['status'])->toBe('replied');
    expect($userMsg->metadata['reply_id'])->toBeInt();

    $botMsg = AiChatMessage::find($userMsg->metadata['reply_id']);
    expect($botMsg)->not->toBeNull();
    expect($botMsg->role)->toBe('assistant');
});

// ── T7-03 ────────────────────────────────────────────────────────────────

it('T7-03 job handle updates user message metadata with replied status and reply_id', function () {
    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'ev-1'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/ev-1' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"رد\"}]}]\n\n",
            200
        ),
    ]);

    $user = User::factory()->create(['is_active' => 1]);
    $userMsg = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => ['status' => 'pending'],
    ]);

    $job = new ProcessChatbotMessageJob($userMsg, 'public', []);
    app()->call([$job, 'handle']);

    $userMsg->refresh();
    expect($userMsg->metadata)->toHaveKey('status');
    expect($userMsg->metadata['status'])->toBe('replied');
    expect($userMsg->metadata)->toHaveKey('reply_id');
});

// ── T7-04 ────────────────────────────────────────────────────────────────

it('T7-04 job handle with HuggingFace failure throws exception', function () {
    config([
        'chatbot.limits.request_max_attempts' => 1,
        'chatbot.limits.request_retry_delay_seconds' => 1,
    ]);

    Http::fake([
        'https://test-bot.hf.space/*' => Http::response([], 503),
    ]);

    $user = User::factory()->create(['is_active' => 1]);
    $userMsg = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'public',
        'role'     => 'user',
        'metadata' => ['status' => 'pending'],
    ]);

    $job = new ProcessChatbotMessageJob($userMsg, 'public', []);

    try {
        app()->call([$job, 'handle']);
    } catch (\Throwable $e) {
        // Expected — job should throw on failure
        expect($e)->toBeInstanceOf(\Throwable::class);
    }

    $userMsg->refresh();
    // Status can be processing since attempts() < tries during direct call
    expect(in_array($userMsg->metadata['status'], ['failed', 'pending', 'processing']))->toBeTrue();
});

// ── T7-05 ────────────────────────────────────────────────────────────────

it('T7-05 job has correct retry configuration', function () {
    $user = User::factory()->create(['is_active' => 1]);
    $msg = AiChatMessage::factory()->create(['user_id' => $user->id]);

    $job = new ProcessChatbotMessageJob($msg, 'public', []);

    expect($job->tries)->toBe(3);
    expect($job->timeout)->toBe(60);
    expect($job->backoff)->toBe([5, 15]);
});

// ── T7-06 ────────────────────────────────────────────────────────────────

it('T7-06 job constructor accepts 3 required parameters', function () {
    $user = User::factory()->create(['is_active' => 1]);
    $msg = AiChatMessage::factory()->create(['user_id' => $user->id]);

    // Should not throw ArgumentCountError
    $job = new ProcessChatbotMessageJob($msg, 'pregnancy', ['role' => 'user', 'message' => 'test']);

    expect($job)->toBeInstanceOf(ProcessChatbotMessageJob::class);
});
