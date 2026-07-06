<?php

/**
 * Section 15 — End-to-End Happy Path (Integration)
 *
 * Simulates complete flow: User sending message -> job dispatched ->
 * manual job processing -> polling endpoint -> checking sessions list.
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
            ->push(['event_id' => 'e2e-event'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/e2e-event' => Http::response(
            "event: complete\ndata: [[{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"فيتامينات الحمل هي ...\"}]}]]\n\n",
            200
        ),
    ]);
});

it('T15-01 full conversation flow works end to end', function () {
    $stage = LifeStage::factory()->create(['id' => 2]); // Pregnancy
    $user  = User::factory()->create(['life_stage_id' => $stage->id, 'is_active' => 1]);

    // Step 1: Send message
    $sendResponse = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'ما هي فيتامينات الحمل؟',
    ]);
    $sendResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'processing')
        ->assertJsonPath('data.bot_type', 'pregnancy');

    $messageId = $sendResponse->json('data.message_id');
    $sessionId = $sendResponse->json('data.session_id');

    // Step 2: Verify job was dispatched
    Queue::assertPushedOn('chatbot', ProcessChatbotMessageJob::class);

    // Step 3: Process job manually (Simulate Queue Worker)
    $userMsg = AiChatMessage::findOrFail($messageId);
    $job = new ProcessChatbotMessageJob($userMsg, 'pregnancy', []);
    app()->call([$job, 'handle']);

    // Step 4: Poll for reply
    $pollResponse = actingAs($user)->getJson(
        "/api/v1/patient/chatbot/messages/{$messageId}/status"
    );
    
    $pollResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonPath('data.reply.message', 'فيتامينات الحمل هي ...')
        ->assertJsonStructure(['data' => ['status', 'reply']]);

    // Step 5: Session appears in list
    $sessionsResponse = actingAs($user)->getJson(
        '/api/v1/patient/chatbot/sessions?bot_type=pregnancy'
    );
    $sessionsResponse->assertStatus(200);
    
    $sessions = collect($sessionsResponse->json('data'));
    expect($sessions->pluck('session_id')->toArray())->toContain($sessionId);
});
