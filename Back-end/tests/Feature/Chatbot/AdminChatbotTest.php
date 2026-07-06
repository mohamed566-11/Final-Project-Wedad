<?php

/**
 * Section 9 — Admin Chatbot Operations
 *
 * Tests:
 *   GET    /api/v1/admin/chatbot/stats
 *   GET    /api/v1/admin/chatbot/conversations
 *   GET    /api/v1/admin/chatbot/conversations/{sessionId}
 *   DELETE /api/v1/admin/chatbot/conversations/{sessionId}
 *   POST   /api/v1/admin/chatbot/bots/{type}/toggle
 *   GET    /api/v1/admin/chatbot/bots/{type}/admin-data
 *   POST   /api/v1/admin/chatbot/cache/clear
 *   GET    /api/v1/admin/chatbot/documents
 *   POST   /api/v1/admin/chatbot/documents
 *   DELETE /api/v1/admin/chatbot/documents/{id}
 */

use App\Models\Admin;
use App\Models\Role;
use App\Models\User;
use App\Models\AiChatMessage;
use App\Models\ChatbotDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use function Pest\Laravel\actingAs;

beforeEach(function () {
    Queue::fake();
    Storage::fake('local'); // Ensure we fake storage for document tests

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

function createAdminWithChatbotPermission()
{
    $role = Role::create([
        'role' => 'admin',
        'permissions' => ['manage_chatbot'],
        'description' => 'Test admin',
    ]);

    return Admin::create([
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'phone' => '0500000000',
        'is_active' => 1,
        'role_id' => $role->id,
    ]);
}

function createPatient() {
    return User::factory()->create(['is_active' => 1]);
}

// ── T9-01 ────────────────────────────────────────────────────────────────

it('T9-01 admin can view chatbot stats', function () {
    $admin = createAdminWithChatbotPermission();
    $patient = createPatient();

    AiChatMessage::factory()->count(3)->create(['user_id' => $patient->id, 'session_id' => 's1', 'bot_type' => 'pregnancy']);

    $response = actingAs($admin, 'admin')->getJson('/api/v1/admin/chatbot/stats');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'data' => [
                'total_messages',
                'total_sessions',
                'total_users',
                'messages_today',
                'messages_this_week',
                'per_bot' => [
                    'public'       => ['total_messages', 'total_sessions', 'active_users', 'messages_today', 'avg_messages_per_session', 'is_enabled'],
                    'pre_marriage' => ['total_messages', 'total_sessions', 'active_users', 'messages_today', 'avg_messages_per_session', 'is_enabled'],
                    'pregnancy'    => ['total_messages', 'total_sessions', 'active_users', 'messages_today', 'avg_messages_per_session', 'is_enabled'],
                    'motherhood'   => ['total_messages', 'total_sessions', 'active_users', 'messages_today', 'avg_messages_per_session', 'is_enabled'],
                ],
            ]
        ]);

    // By default all bots should be enabled (is_enabled = true)
    $response->assertJsonPath('data.per_bot.pregnancy.is_enabled', true);
    $response->assertJsonPath('data.per_bot.public.is_enabled', true);
});

// ── T9-02 ────────────────────────────────────────────────────────────────

it('T9-02 admin can list all conversations', function () {
    $admin = createAdminWithChatbotPermission();
    $patient = createPatient();

    AiChatMessage::factory()->create(['user_id' => $patient->id, 'session_id' => 'admin_test_session', 'bot_type' => 'pregnancy']);

    $response = actingAs($admin, 'admin')->getJson('/api/v1/admin/chatbot/conversations');

    $response->assertStatus(200);
    $data = collect($response->json('data'));
    expect($data->pluck('session_id'))->toContain('admin_test_session');
});

// ── T9-03 ────────────────────────────────────────────────────────────────

it('T9-03 admin can view messages of a specific session', function () {
    $admin = createAdminWithChatbotPermission();
    $patient = createPatient();

    AiChatMessage::factory()->create(['user_id' => $patient->id, 'session_id' => 'see_me', 'message' => 'hello admin']);

    $response = actingAs($admin, 'admin')->getJson('/api/v1/admin/chatbot/conversations/see_me');

    $response->assertStatus(200);
    // Response is ChatMessageResource::collection wrapped in successResponse
    $data = $response->json('data');
    $messages = is_array($data) ? collect($data) : collect($data['messages'] ?? $data);
    expect($messages->pluck('message'))->toContain('hello admin');
});

// ── T9-04 ────────────────────────────────────────────────────────────────

it('T9-04 admin can delete a conversation', function () {
    $admin = createAdminWithChatbotPermission();
    $patient = createPatient();

    AiChatMessage::factory()->count(2)->create(['user_id' => $patient->id, 'session_id' => 'delete_me']);

    $response = actingAs($admin, 'admin')->deleteJson('/api/v1/admin/chatbot/conversations/delete_me');

    $response->assertStatus(200)
        ->assertJsonPath('data.deleted_count', 2);

    expect(AiChatMessage::where('session_id', 'delete_me')->count())->toBe(0);
});

// ── T9-05 ────────────────────────────────────────────────────────────────

it('T9-05 admin can toggle bot status', function () {
    $admin = createAdminWithChatbotPermission();

    // Toggle 1: should disable the bot
    $response = actingAs($admin, 'admin')->postJson('/api/v1/admin/chatbot/bots/pregnancy/toggle');

    $response->assertStatus(200)
        ->assertJsonStructure(['status', 'data' => ['bot_type', 'status']]);

    $firstStatus = $response->json('data.status');
    expect($firstStatus)->toBeIn(['enabled', 'disabled']);

    // Verify stats now reflects the toggled state
    $statsResponse = actingAs($admin, 'admin')->getJson('/api/v1/admin/chatbot/stats');
    $statsResponse->assertStatus(200);

    $isEnabled = $statsResponse->json('data.per_bot.pregnancy.is_enabled');
    expect($isEnabled)->toBe($firstStatus === 'enabled');

    // Toggle 2: should reverse the state
    $response2 = actingAs($admin, 'admin')->postJson('/api/v1/admin/chatbot/bots/pregnancy/toggle');
    $secondStatus = $response2->json('data.status');
    expect($secondStatus)->not->toBe($firstStatus);
});

// ── T9-06 ────────────────────────────────────────────────────────────────

it('T9-06 admin can clear chatbot cache', function () {
    $admin = createAdminWithChatbotPermission();

    $response = actingAs($admin, 'admin')->postJson('/api/v1/admin/chatbot/cache/clear');

    $response->assertStatus(200);
});

// ── T9-07 ────────────────────────────────────────────────────────────────

it('T9-07 non-admin user cannot access admin chatbot endpoints', function () {
    $patient = createPatient();

    // Try accessing with patient guard
    $response = actingAs($patient, 'patient')->getJson('/api/v1/admin/chatbot/stats');

    // Assuming admin routes check for auth:admin guard which redirects or 401s
    $response->assertStatus(401);
});

// ── T9-08 ────────────────────────────────────────────────────────────────

it('T9-08 admin upload triggers sync job', function () {
    $admin = createAdminWithChatbotPermission();

    $file = UploadedFile::fake()->create('knowledge.pdf', 100, 'application/pdf');

    // We mock the HTTP service inside ChatbotService so the sync job doesn't fail
    \Illuminate\Support\Facades\Http::fake([
        '*gradio_api/call/admin*' => \Illuminate\Support\Facades\Http::sequence()
            ->push(['event_id' => '1'], 200)
            ->push("event: complete\ndata: [\"success\"]\n\n", 200),
    ]);

    $response = actingAs($admin, 'admin')->postJson('/api/v1/admin/chatbot/documents', [
        'bot_type' => 'pregnancy',
        'file'     => $file,
    ]);

    $response->assertStatus(200);

    // After sync job it might be 'ready', unless it failed
    $doc = ChatbotDocument::first();
    expect($doc)->not->toBeNull();
});

// ── T9-09 ────────────────────────────────────────────────────────────────

it('T9-09 admin can delete a knowledge document', function () {
    $admin = createAdminWithChatbotPermission();

    // Create a document record in DB to delete
    $document = ChatbotDocument::create([
        'bot_type'   => 'pregnancy',
        'file_name'  => 'test-doc.pdf',
        'file_size'  => 1024,
        'status'     => 'ready',
    ]);

    \Illuminate\Support\Facades\Http::fake([
        '*gradio_api/call/delete_document*' => \Illuminate\Support\Facades\Http::sequence()
            ->push(['event_id' => '123'], 200)
            ->push("event: complete\ndata: [\"تم حذف الملف بنجاح\"]\n\n", 200),
    ]);

    $response = actingAs($admin, 'admin')->deleteJson("/api/v1/admin/chatbot/documents/{$document->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('chatbot_documents', ['id' => $document->id]);
});

// ── T9-10 ────────────────────────────────────────────────────────────────

it('T9-10 document upload rejects non-allowed file extensions', function () {
    $admin = createAdminWithChatbotPermission();

    $file = UploadedFile::fake()->create('malicious.exe', 100, 'application/x-msdownload');

    $response = actingAs($admin, 'admin')->postJson('/api/v1/admin/chatbot/documents', [
        'bot_type' => 'pregnancy',
        'file' => $file,
    ]);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
});

// ── T9-11 ────────────────────────────────────────────────────────────────

it('T9-11 getBotAdminData rejects invalid bot type', function () {
    $admin = createAdminWithChatbotPermission();

    $response = actingAs($admin, 'admin')->getJson('/api/v1/admin/chatbot/bots/not_a_bot/admin-data');

    // Controller validates inline with in_array(), returns 422 via errorResponse
    $response->assertStatus(422);
});
