# Chatbot Full Test Suite — Wedad Platform

> **Role**: You are a senior Laravel/Pest + React/Vitest testing engineer.
> Your task is to write a **complete, runnable test suite** for the Wedad chatbot system.
> Cover every section listed below. Do not skip any group.
> Do not modify any existing application code — tests only.
> All backend tests use **Pest PHP** syntax (not PHPUnit classes).

---

## Codebase Reference Map

> **CRITICAL**: Use these exact file paths and API routes when writing tests.
> All routes listed below are verified from the actual route files and `bootstrap/app.php`.

### Route Prefixes (from `bootstrap/app.php`)

| Group         | Prefix              | Route File     |
|---------------|---------------------|----------------|
| Patient       | `api/v1/patient`    | `patient.php`  |
| Admin         | `api/v1/admin`      | `admin.php`    |
| Public        | `api/v1`            | `public.php`   |

### Actual API Routes — Chatbot

| Method   | Full Route                                                    | Controller Method        | Auth        | Route File     |
|----------|---------------------------------------------------------------|--------------------------|-------------|----------------|
| `POST`   | `/api/v1/patient/chatbot/message`                             | `sendMessage`            | `auth:patient` | `patient.php`  |
| `POST`   | `/api/v1/patient/chatbot/widget-message`                      | `sendWidgetMessage`      | `auth:patient` | `patient.php`  |
| `GET`    | `/api/v1/patient/chatbot/messages/{messageId}/status`         | `messageStatus`          | `auth:patient` | `patient.php`  |
| `GET`    | `/api/v1/patient/chatbot/config`                              | `getConfig`              | `auth:patient` | `patient.php`  |
| `GET`    | `/api/v1/patient/chatbot/sessions`                            | `getSessions`            | `auth:patient` | `patient.php`  |
| `PATCH`  | `/api/v1/patient/chatbot/sessions/{sessionId}/rename`         | `renameSession`          | `auth:patient` | `patient.php`  |
| `DELETE` | `/api/v1/patient/chatbot/sessions/{sessionId}`                | `deleteSession`          | `auth:patient` | `patient.php`  |
| `GET`    | `/api/v1/patient/chatbot/sessions/{sessionId}/messages`       | `getMessages`            | `auth:patient` | `patient.php`  |
| `POST`   | `/api/v1/patient/chatbot/sessions/{sessionId}/reset`          | `resetSession`           | `auth:patient` | `patient.php`  |
| `DELETE` | `/api/v1/patient/chatbot/messages`                            | `deleteAllMessages`      | `auth:patient` | `patient.php`  |
| `POST`   | `/api/v1/chatbot/public/message`                              | `sendPublicMessage`      | None        | `public.php`   |
| `GET`    | `/api/v1/chatbot/guest/message/{messageId}/status`            | `guestMessageStatus`     | None (token) | `public.php`  |

### Actual API Routes — Admin Chatbot

| Method   | Full Route                                                    | Controller Method        | Auth / Permission            |
|----------|---------------------------------------------------------------|--------------------------|------------------------------|
| `GET`    | `/api/v1/admin/chatbot/stats`                                 | `stats`                  | `auth:admin` + `MANAGE_CHATBOT` |
| `GET`    | `/api/v1/admin/chatbot/conversations`                         | `conversations`          | `auth:admin` + `MANAGE_CHATBOT` |
| `GET`    | `/api/v1/admin/chatbot/conversations/{sessionId}`             | `showConversation`       | `auth:admin` + `MANAGE_CHATBOT` |
| `DELETE` | `/api/v1/admin/chatbot/conversations/{sessionId}`             | `deleteConversation`     | `auth:admin` + `MANAGE_CHATBOT` |
| `POST`   | `/api/v1/admin/chatbot/bots/{type}/toggle`                    | `toggleBot`              | `auth:admin` + `MANAGE_CHATBOT` |
| `GET`    | `/api/v1/admin/chatbot/bots/{type}/admin-data`                | `getBotAdminData`        | `auth:admin` + `MANAGE_CHATBOT` |
| `POST`   | `/api/v1/admin/chatbot/cache/clear`                           | `clearCache`             | `auth:admin` + `MANAGE_CHATBOT` |
| `GET`    | `/api/v1/admin/chatbot/documents`                             | `index`                  | `auth:admin` + `MANAGE_CHATBOT` |
| `POST`   | `/api/v1/admin/chatbot/documents`                             | `store`                  | `auth:admin` + `MANAGE_CHATBOT` |
| `DELETE` | `/api/v1/admin/chatbot/documents/{id}`                        | `destroy`                | `auth:admin` + `MANAGE_CHATBOT` |

### Backend Files

| Layer                 | File Path                                                                                |
|-----------------------|------------------------------------------------------------------------------------------|
| Controller (Patient)  | `app/Http/Controllers/Api/Patient/ChatbotController.php`                                 |
| Controller (Admin)    | `app/Http/Controllers/Api/Admin/AdminChatbotController.php`                              |
| Controller (Admin Documents) | `app/Http/Controllers/Api/Admin/AdminChatbotDocumentController.php`              |
| Service               | `app/Services/ChatbotService.php`                                                        |
| Job                   | `app/Jobs/ProcessChatbotMessageJob.php`                                                  |
| Model                 | `app/Models/AiChatMessage.php`                                                           |
| Factory               | `database/factories/AiChatMessageFactory.php`                                            |
| Form Request (Send)   | `app/Http/Requests/Patient/SendChatMessageRequest.php`                                   |
| Form Request (Doc)    | `app/Http/Requests/Admin/Chatbot/StoreDocumentRequest.php`                               |
| Cache Command         | `app/Console/Commands/ClearChatbotCacheCommand.php`                                      |
| Rate Limiters         | `app/Providers/AppServiceProvider.php`                                                   |

### Frontend Files

| Layer       | File Path                                                     |
|-------------|---------------------------------------------------------------|
| Hook        | `src/hooks/useChatbot.ts` — exports: `usePublicChatbot`, `useAuthChatbot`, `useWidgetChatbot` |
| Service     | `src/services/chatbotService.ts`                              |
| Types       | `src/types/chatbot.ts`                                        |
| Components  | `src/components/chatbot/ChatWidget.tsx`                       |
|             | `src/components/chatbot/ChatWindow.tsx`                       |
|             | `src/pages/patient/ChatbotPage.tsx`                           |

### Key Implementation Details

- **`ProcessChatbotMessageJob` constructor**: `__construct(AiChatMessage $userMessage, string $botType, array $history)` — **3 required parameters**
- **`ProcessChatbotMessageJob::handle`**: receives `ChatbotService $chatbotService` via DI (container-injected)
- **Job properties**: `$tries = 3`, `$timeout = 60`, `$backoff = [5, 15]`
- **`SendChatMessageRequest` rules**: `message` (required|string|max:config), `session_id` (nullable|string|max:100), `bot_type` (nullable|in:public,pre_marriage,pregnancy,motherhood), `force_new_session` (nullable|boolean)
- **`StoreDocumentRequest` rules**: `bot_type` (required|in:...), `file` (required|file|mimes:pdf,txt,md|max:10240)
- **Middleware chain on patient chatbot routes**: `auth:patient` → `PatientStatus` (no email verify required)
- **JSON wrapper**: All responses use `ApiResponse` trait → `{ status, message, data }` structure
- **AiChatMessage `metadata` cast**: `'array'` — stores `status`, `guest_session_token`, `reply_id`, `bot_type`, `session_title`
- **Guest status endpoint** requires `X-Guest-Session-Token` header and enforces `bot_type = 'public'`
- **Rate limiter names**: `chatbot_public` (for send), `chatbot_auth` (for auth send), `guest-chatbot-status` (for guest poll)
- **Bot types**: `public`, `pre_marriage`, `pregnancy`, `motherhood`
- **Frontend `useChatbot.ts` hooks**:
  - `usePublicChatbot()` → sync, uses `chatbotService.sendPublicMessage()`
  - `useAuthChatbot({enabled, initialBotType})` → async queue + polling via `chatbotService.sendMessage()` + `getMessageStatus()`
  - `useWidgetChatbot()` → sync, uses `chatbotService.sendWidgetMessage()` with public fallback
- **Frontend service methods** (from `chatbotService.ts`): `sendPublicMessage`, `sendWidgetMessage`, `sendMessage`, `getConfig`, `getSessions`, `getSessionMessages`, `renameSession`, `deleteSession`, `resetSession`, `getMessageStatus`, `deleteAllMessages`

### Required Config for All Backend Tests (`beforeEach`)

```php
config([
    'chatbot.bots.public.url'       => 'https://test-bot.hf.space',
    'chatbot.bots.pre_marriage.url' => 'https://test-bot.hf.space',
    'chatbot.bots.pregnancy.url'    => 'https://test-bot.hf.space',
    'chatbot.bots.motherhood.url'   => 'https://test-bot.hf.space',
    'chatbot.gradio.api_path'       => '/gradio_api/call',
    'chatbot.gradio.chat_endpoint'  => '/chatbot_fn',
    'chatbot.gradio.reset_endpoint' => '/reset_chat',
    'chatbot.gradio.admin_endpoint' => '/admin',
    'chatbot.limits.request_timeout'       => 30,
    'chatbot.limits.max_message_length'    => 1000,
    'chatbot.limits.max_history_messages'  => 20,
    'chatbot.limits.public_rate_per_minute'=> 100,
    'chatbot.limits.auth_rate_per_minute'  => 100,
    'chatbot.cache.enabled'                => false,
    'chatbot.stage_mapping'                => [1 => 'pre_marriage', 2 => 'pregnancy', 3 => 'motherhood'],
    'chatbot.hf_token'                     => null,
    'chatbot.process_sync_in_local'        => false,  // Force queue path in tests
]);
```

### Required Http Mocking Pattern (Gradio SSE)

```php
Http::fake([
    'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
        ->push(['event_id' => 'test-event-123'], 200),
    'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-123' => Http::response(
        "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"هذا رد تجريبي من البوت\"}]}]\n\n",
        200
    ),
    'https://test-bot.hf.space/gradio_api/call/reset_chat' => Http::sequence()
        ->push(['event_id' => 'reset-event-456'], 200),
    'https://test-bot.hf.space/gradio_api/call/reset_chat/reset-event-456' => Http::response(
        "event: complete\ndata: []\n\n", 200
    ),
]);
```

---

## SECTION 1 — Authenticated Patient: Send Message

**File**: `tests/Feature/Chatbot/PatientSendMessageTest.php`

Write tests for `POST /api/v1/patient/chatbot/message`:

> **Important**: This route uses `SendChatMessageRequest` which has `bot_type` as **nullable**. When not provided, the controller derives it from `user->life_stage_id` via `ChatbotService::getBotTypeFromStage()`.
> With `config('chatbot.process_sync_in_local') = false`, the controller dispatches `ProcessChatbotMessageJob` to the `chatbot` queue.

```
✅ T1-01  authenticated user can send a message and receives status=processing
✅ T1-02  message is stored in ai_chat_messages with correct user_id, bot_type, session_id
✅ T1-03  ProcessChatbotMessageJob is dispatched to 'chatbot' queue
✅ T1-04  unauthenticated user receives 401
✅ T1-05  inactive user (is_active = 0) is rejected by PatientStatus middleware
✅ T1-06  empty message body returns 422 validation error
✅ T1-07  message body exceeding max length (>1000 chars) returns 422
✅ T1-08  valid bot_type values are accepted: public, pre_marriage, pregnancy, motherhood
✅ T1-09  invalid bot_type value returns 422
✅ T1-10  session_id is auto-generated when not provided (contains UUID format)
✅ T1-11  provided session_id is reused correctly
✅ T1-12  force_new_session = true creates a new session even if a recent one exists
✅ T1-13  response includes: data.status, data.session_id, data.bot_type, data.message_id, data.user_message
✅ T1-14  bot_type defaults to life_stage mapping when not provided in request
```

**Example scaffold**:

```php
<?php

use App\Jobs\ProcessChatbotMessageJob;
use App\Models\AiChatMessage;
use App\Models\User;
use App\Models\LifeStage;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();
    // Include the config block and Http::fake from Codebase Reference Map above
});

it('authenticated user can send a message and receives processing status', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    $response = actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'ما هي أعراض الحمل الأولى؟',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'processing')
        ->assertJsonPath('data.bot_type', 'public');

    Queue::assertPushedOn('chatbot', ProcessChatbotMessageJob::class);
});

it('stores message with correct bot_type derived from life_stage', function () {
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

it('returns 422 when message is empty', function () {
    $user = User::factory()->create(['is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => '',
    ])->assertStatus(422);
});

it('creates new session when force_new_session is true', function () {
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    // Create an existing recent message so getOrCreateSession would find it
    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'public_existing_123',
        'bot_type'   => 'public',
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
```

---

## SECTION 2 — Authenticated Patient: Poll Message Status

**File**: `tests/Feature/Chatbot/PatientMessageStatusTest.php`

Write tests for `GET /api/v1/patient/chatbot/messages/{messageId}/status`:

> **Important**: This endpoint filters by `user_id` — the `messageStatus` method does
> `AiChatMessage::where('user_id', $user->id)->findOrFail($messageId)`.

```
✅ T2-01  owner can poll status — returns 'processing' when metadata.status is 'pending' or 'processing'
✅ T2-02  owner can poll status — returns 'ready' with reply when metadata.status='replied' and reply exists
✅ T2-03  owner can poll status — returns 'failed' when metadata.status='failed'
✅ T2-04  user cannot poll another user's message → 404 (ownership check)
✅ T2-05  unauthenticated request returns 401
✅ T2-06  non-existent message id returns 404
```

**Example scaffold**:

```php
it('returns ready with reply when message is replied', function () {
    $user = User::factory()->create(['is_active' => 1]);

    $userMsg = AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'test_session',
        'bot_type'   => 'public',
        'role'       => 'user',
        'metadata'   => ['status' => 'replied', 'reply_id' => null],
    ]);

    $botMsg = AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => 'test_session',
        'bot_type'   => 'public',
        'role'       => 'assistant',
        'metadata'   => ['status' => 'ready', 'parent_id' => $userMsg->id],
    ]);

    // Link reply to user message
    $userMsg->update(['metadata' => ['status' => 'replied', 'reply_id' => $botMsg->id]]);

    $response = actingAs($user)->getJson("/api/v1/patient/chatbot/messages/{$userMsg->id}/status");

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonStructure(['data' => ['status', 'reply']]);
});

it('cannot poll another user\'s message', function () {
    $owner = User::factory()->create(['is_active' => 1]);
    $other = User::factory()->create(['is_active' => 1]);

    $msg = AiChatMessage::factory()->create([
        'user_id'  => $owner->id,
        'bot_type' => 'public',
        'metadata' => ['status' => 'processing'],
    ]);

    actingAs($other)->getJson("/api/v1/patient/chatbot/messages/{$msg->id}/status")
        ->assertStatus(404);
});
```

---

## SECTION 3 — Guest: Send Message (Public Bot)

**File**: `tests/Feature/Chatbot/GuestSendMessageTest.php`

Write tests for `POST /api/v1/chatbot/public/message`:

> **Important**: This route has NO authentication. It uses `SendChatMessageRequest` (same form request).
> The `sendPublicMessage` method forces `bot_type = 'public'` regardless of input.
> This endpoint returns a **synchronous** reply, NOT a queue job. It calls `chatbotService->sendMessage('public', ...)`.

```
✅ T3-01  guest can send a message without authentication → 200
✅ T3-02  response structure contains: data.reply, data.bot_type='public', data.cached
✅ T3-03  empty message returns 422
✅ T3-04  message exceeding max length returns 422
✅ T3-05  rate limit (throttle:chatbot_public) kicks in after configured threshold
```

**Example scaffold**:

```php
it('guest can send a message without authentication', function () {
    $response = postJson('/api/v1/chatbot/public/message', [
        'message' => 'ما هي منصة وداد؟',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status', 'message',
            'data' => ['reply', 'bot_type', 'cached'],
        ])
        ->assertJsonPath('data.bot_type', 'public');
});
```

---

## SECTION 4 — Guest: Poll Message Status (Security Critical ⚠️)

**File**: `tests/Feature/Chatbot/GuestMessageStatusSecurityTest.php`

> ⚠️ These tests cover **Gap A** — the most critical security fix (IDOR prevention).
>
> The `guestMessageStatus` method:
> 1. Reads `X-Guest-Session-Token` header (or `guest_token` query param)
> 2. Returns **422** if no token
> 3. Queries with `WHERE id = ? AND bot_type = 'public' AND metadata->guest_session_token = ?`
> 4. Returns **404** if no match (`firstOrFail()`)

```
✅ T4-01  valid guest token returns correct message status (200)
✅ T4-02  missing guest token returns 422
✅ T4-03  wrong guest token returns 404 (cannot read another guest's message)
✅ T4-04  correct token but non-public bot_type returns 404
✅ T4-05  authenticated user's message (with user_id set, bot_type != public) cannot be accessed via guest endpoint → 404
✅ T4-06  guest_token passed as query param (?guest_token=xxx) also works → 200
✅ T4-07  rate limit 'guest-chatbot-status' kicks in after 30 requests/minute from same token
```

**Complete scaffolds**:

```php
<?php

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'chatbot.limits.public_rate_per_minute' => 100,
        'chatbot.limits.auth_rate_per_minute'   => 100,
    ]);
});

it('returns status with valid guest token', function () {
    $token   = bin2hex(random_bytes(32));
    $message = AiChatMessage::factory()->create([
        'bot_type' => 'public',
        'metadata' => ['guest_session_token' => $token, 'status' => 'processing'],
    ]);

    $response = $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'processing');
});

it('returns 422 when token is missing', function () {
    $message = AiChatMessage::factory()->create([
        'bot_type' => 'public',
        'metadata' => ['guest_session_token' => 'abc', 'status' => 'processing'],
    ]);

    $this->getJson("/api/v1/chatbot/guest/message/{$message->id}/status")
        ->assertStatus(422);
});

it('returns 404 when token belongs to different message', function () {
    $correctToken = bin2hex(random_bytes(32));
    $wrongToken   = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'bot_type' => 'public',
        'metadata' => ['guest_session_token' => $correctToken, 'status' => 'ready'],
    ]);

    $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $wrongToken]
    )->assertStatus(404);
});

it('returns 404 for non-public bot_type even with correct token', function () {
    $token   = bin2hex(random_bytes(32));
    $message = AiChatMessage::factory()->create([
        'bot_type' => 'pregnancy',
        'metadata' => ['guest_session_token' => $token, 'status' => 'ready'],
    ]);

    $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    )->assertStatus(404);
});

it('cannot access authenticated user message via guest endpoint', function () {
    $user  = User::factory()->create(['is_active' => 1]);
    $token = bin2hex(random_bytes(32));

    $message = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'pre_marriage',
        'metadata' => ['guest_session_token' => $token, 'status' => 'ready'],
    ]);

    $this->getJson(
        "/api/v1/chatbot/guest/message/{$message->id}/status",
        ['X-Guest-Session-Token' => $token]
    )->assertStatus(404);
});

it('accepts guest_token as query parameter', function () {
    $token   = bin2hex(random_bytes(32));
    $message = AiChatMessage::factory()->create([
        'bot_type' => 'public',
        'metadata' => ['guest_session_token' => $token, 'status' => 'processing'],
    ]);

    $this->getJson("/api/v1/chatbot/guest/message/{$message->id}/status?guest_token={$token}")
        ->assertStatus(200);
});
```

---

## SECTION 5 — Sessions Management

**File**: `tests/Feature/Chatbot/SessionManagementTest.php`

Write tests for session CRUD endpoints:

```
✅ T5-01  getSessions returns only sessions belonging to the authenticated user
✅ T5-02  getSessions filtered by bot_type returns correct sessions only
✅ T5-03  getSessions with invalid bot_type returns 422
✅ T5-04  getSessions does not leak other users' sessions
✅ T5-05  getMessages returns messages for correct session_id and user
✅ T5-06  getMessages returns empty array for session not owned by user
✅ T5-07  renameSession updates session_title in metadata for all messages in session
✅ T5-08  renameSession returns 404 for session not owned by user
✅ T5-09  renameSession returns 422 if title is empty or missing
✅ T5-10  renameSession returns 422 if title exceeds 120 characters
✅ T5-11  deleteSession removes all messages for that session_id → returns deleted_count
✅ T5-12  deleteSession returns 404 for session not owned by user
✅ T5-13  resetSession clears all messages for that session_id → returns deleted_count
✅ T5-14  resetSession calls chatbotService->resetChat (verify via Http::assertSent)
✅ T5-15  deleteAllMessages (Right to Erasure) deletes ONLY current user's messages
```

**Example scaffolds**:

```php
it('renames a session successfully', function () {
    $user      = User::factory()->create(['is_active' => 1]);
    $sessionId = 'public_abc123';

    AiChatMessage::factory()->create([
        'user_id'    => $user->id,
        'session_id' => $sessionId,
        'bot_type'   => 'public',
        'metadata'   => [],
    ]);

    $response = actingAs($user)->patchJson(
        "/api/v1/patient/chatbot/sessions/{$sessionId}/rename",
        ['title' => 'محادثة عن الحمل']
    );

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'محادثة عن الحمل');
});

it('deletes a session and all its messages', function () {
    $user      = User::factory()->create(['is_active' => 1]);
    $sessionId = 'pregnancy_xyz';

    AiChatMessage::factory()->count(5)->create([
        'user_id'    => $user->id,
        'session_id' => $sessionId,
        'bot_type'   => 'pregnancy',
    ]);

    actingAs($user)->deleteJson(
        "/api/v1/patient/chatbot/sessions/{$sessionId}"
    )->assertStatus(200)
      ->assertJsonPath('data.deleted_count', 5);

    $this->assertDatabaseMissing('ai_chat_messages', [
        'user_id'    => $user->id,
        'session_id' => $sessionId,
    ]);
});
```

---

## SECTION 6 — Bot Type Isolation

**File**: `tests/Feature/Chatbot/BotTypeIsolationTest.php`

> Ensure messages from one bot never appear in another bot's filtered view.

```
✅ T6-01  getSessions with bot_type=pregnancy returns no public sessions
✅ T6-02  getSessions with bot_type=public returns no pregnancy sessions
✅ T6-03  getMessages for a pregnancy session_id returns no messages from other sessions
✅ T6-04  sending a message with bot_type=motherhood stores correct bot_type in DB
✅ T6-05  all 4 bot types are independently filterable: public, pre_marriage, pregnancy, motherhood
✅ T6-06  getOrCreateSession returns session_id prefixed with bot_type (e.g. "pregnancy_...")
```

---

## SECTION 7 — Async Queue + Job Processing

**File**: `tests/Feature/Chatbot/QueueJobTest.php`

> **Important**: `ProcessChatbotMessageJob` constructor takes **3 args**: `(AiChatMessage $userMessage, string $botType, array $history)`.
> The `handle` method receives `ChatbotService` via Laravel DI container injection.

```
✅ T7-01  ProcessChatbotMessageJob is dispatched on 'chatbot' queue when message is sent
✅ T7-02  job.handle() calls chatbotService->callHuggingFace and creates bot reply as AiChatMessage
✅ T7-03  job.handle() updates user message metadata: status → 'replied', reply_id → bot_message.id
✅ T7-04  job.handle() with HuggingFace API failure throws exception → status='failed' after exhausting retries
✅ T7-05  job has correct retry config: tries=3, timeout=60, backoff=[5,15]
✅ T7-06  on failure, status is set to 'failed' only when attempts >= tries
```

**Example scaffold**:

```php
<?php

use App\Jobs\ProcessChatbotMessageJob;
use App\Models\AiChatMessage;
use App\Models\User;
use App\Services\ChatbotService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('dispatches job on chatbot queue when sending message', function () {
    Queue::fake();
    $user = User::factory()->create(['life_stage_id' => null, 'is_active' => 1]);

    actingAs($user)->postJson('/api/v1/patient/chatbot/message', [
        'message' => 'سؤال',
    ]);

    Queue::assertPushedOn('chatbot', ProcessChatbotMessageJob::class);
});

it('job processes message and creates bot reply', function () {
    // Http::fake with Gradio SSE response...

    $user    = User::factory()->create(['is_active' => 1]);
    $userMsg = AiChatMessage::factory()->create([
        'user_id'  => $user->id,
        'bot_type' => 'public',
        'role'     => 'user',
        'message'  => 'سؤال تجريبي',
        'metadata' => ['status' => 'pending'],
    ]);

    $job = new ProcessChatbotMessageJob($userMsg, 'public', []);
    app()->call([$job, 'handle']); // Let container inject ChatbotService

    $userMsg->refresh();
    expect($userMsg->metadata['status'])->toBe('replied');
    expect($userMsg->metadata['reply_id'])->toBeInt();

    $botMsg = AiChatMessage::find($userMsg->metadata['reply_id']);
    expect($botMsg)->not->toBeNull();
    expect($botMsg->role)->toBe('assistant');
});

it('job has correct retry configuration', function () {
    $user = User::factory()->create(['is_active' => 1]);
    $msg  = AiChatMessage::factory()->create(['user_id' => $user->id]);

    $job = new ProcessChatbotMessageJob($msg, 'public', []);

    expect($job->tries)->toBe(3);
    expect($job->timeout)->toBe(60);
    expect($job->backoff)->toBe([5, 15]);
});
```

---

## SECTION 8 — Rate Limiting

**File**: `tests/Feature/Chatbot/RateLimitTest.php`

> Rate limits are defined in `AppServiceProvider::configureRateLimiter()`.

```
✅ T8-01  authenticated user is rate-limited after chatbot_auth threshold on send endpoint → 429
✅ T8-02  guest user is rate-limited on public send endpoint (chatbot_public) → 429
✅ T8-03  guest status endpoint is rate-limited (guest-chatbot-status, 30/min) → 429
✅ T8-04  rate limit response returns 429 status code
✅ T8-05  different users/IPs do not share rate limit buckets
```

**Example scaffold**:

```php
it('guest send endpoint is rate limited', function () {
    // Set very low limit for test
    config(['chatbot.limits.public_rate_per_minute' => 2]);

    // Must re-register the rate limiter with the new config
    $this->app->make(\App\Providers\AppServiceProvider::class)->boot();

    postJson('/api/v1/chatbot/public/message', ['message' => 'رسالة 1'])->assertStatus(200);
    postJson('/api/v1/chatbot/public/message', ['message' => 'رسالة 2'])->assertStatus(200);
    postJson('/api/v1/chatbot/public/message', ['message' => 'رسالة 3'])->assertStatus(429);
});
```

---

## SECTION 9 — Admin Chatbot Operations

**File**: `tests/Feature/Chatbot/AdminChatbotTest.php`

> Admin routes require `auth:admin` + `AdminStatus` + `admin.audit` middleware, plus `permission:MANAGE_CHATBOT`.
> Admin guard is `auth:admin`. You need an Admin model with the `MANAGE_CHATBOT` permission.

```
✅ T9-01  admin can view chatbot stats → 200 with total_messages, total_sessions, per_bot breakdown
✅ T9-02  admin can list all conversations → 200 with pagination
✅ T9-03  admin can view messages of a specific session → 200
✅ T9-04  admin can delete a conversation → 200 with deleted_count
✅ T9-05  admin can toggle a bot on/off → returns new status
✅ T9-06  admin can clear chatbot cache → 200
✅ T9-07  non-admin user cannot access admin chatbot endpoints → 401 or 403
✅ T9-08  admin can upload a knowledge document (POST /chatbot/documents) → validates file type (pdf,txt,md)
✅ T9-09  admin can delete a knowledge document (DELETE /chatbot/documents/{id})
✅ T9-10  document upload rejects non-allowed file extensions → 422
✅ T9-11  getBotAdminData rejects invalid bot type → 422
```

---

## SECTION 10 — Frontend Hook: useChatbot

**File**: `Front-End/src/hooks/__tests__/useChatbot.test.ts`

> Use **Vitest + React Testing Library + MSW** for API mocking.
> The hooks are: `usePublicChatbot`, `useAuthChatbot`, `useWidgetChatbot`.
> `usePublicChatbot` has: `messages`, `isLoading`, `sendMessage`, `clearChat`.
> `useAuthChatbot` has: `messages`, `isLoading`, `config`, `sessions`, `activeBotType`, `currentSessionId`, `sendMessage`, `resetChat`, `newConversation`, `loadSession`, `renameSession`, `deleteSession`, `isSessionActionLoading`, `isConfigLoading`.

```
✅ T10-01  usePublicChatbot: initial state: messages=[], isLoading=false
✅ T10-02  usePublicChatbot: sendMessage adds optimistic user message to messages
✅ T10-03  usePublicChatbot: sendMessage receives bot reply and appends it to messages
✅ T10-04  usePublicChatbot: clearChat empties messages array and clears sessionStorage
✅ T10-05  useAuthChatbot: initial state: messages=[], isLoading=false, sessions undefined
✅ T10-06  useAuthChatbot: sendMessage adds optimistic user message then starts polling
✅ T10-07  useAuthChatbot: when polling returns ready, reply is appended and isLoading=false
✅ T10-08  useAuthChatbot: when polling returns failed, error message is shown and isLoading=false
✅ T10-09  useAuthChatbot: loadSession sets currentSessionId and triggers message fetch
✅ T10-10  useAuthChatbot: newConversation clears messages and sets sessionId to null
✅ T10-11  useAuthChatbot: switching activeBotType clears messages to []
✅ T10-12  useAuthChatbot: renameSession calls PATCH and invalidates sessions query
✅ T10-13  useAuthChatbot: deleteSession calls DELETE and removes session from state
✅ T10-14  useAuthChatbot: polling stops when component unmounts (no memory leak)
✅ T10-15  useWidgetChatbot: falls back to sendPublicMessage when sendWidgetMessage fails
```

**Example scaffold**:

```ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';
import { usePublicChatbot } from '../useChatbot';

describe('usePublicChatbot', () => {
  it('initial state is empty', () => {
    const { result } = renderHook(() => usePublicChatbot());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('sendMessage adds user message optimistically', async () => {
    server.use(
      http.post('*/chatbot/public/message', () =>
        HttpResponse.json({
          status: 'success',
          data: { reply: 'مرحباً!', bot_type: 'public', cached: false },
        })
      )
    );

    const { result } = renderHook(() => usePublicChatbot());

    await act(async () => {
      await result.current.sendMessage('مرحبا');
    });

    expect(result.current.messages[0].message).toBe('مرحبا');
    expect(result.current.messages[0].role).toBe('user');
  });

  it('clearChat empties messages', () => {
    const { result } = renderHook(() => usePublicChatbot());

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
  });
});

describe('useAuthChatbot', () => {
  it('stops polling on unmount', async () => {
    const { unmount } = renderHook(() =>
      useAuthChatbot({ enabled: true, initialBotType: 'public' })
    );
    unmount();
    // No pending timers should remain
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

---

## SECTION 11 — Frontend Service: chatbotService

**File**: `Front-End/src/services/__tests__/chatbotService.test.ts`

> The `chatbotService` object exports methods, NOT a class. Methods use two axios instances:
> - `chatbotApi` (65s timeout, auto-retry on 503) for: `sendPublicMessage`, `sendWidgetMessage`, `getConfig`
> - `api` (standard) for: `sendMessage`, `getSessions`, `getSessionMessages`, `renameSession`, `deleteSession`, `resetSession`, `getMessageStatus`, `deleteAllMessages`

```
✅ T11-01  sendPublicMessage sends POST to /chatbot/public/message with { message }
✅ T11-02  sendMessage sends POST to /patient/chatbot/message with full payload
✅ T11-03  sendWidgetMessage sends POST to /patient/chatbot/widget-message with { message }
✅ T11-04  getSessions sends GET to /patient/chatbot/sessions with optional bot_type query param
✅ T11-05  getSessions without filter calls without query params
✅ T11-06  getSessionMessages sends GET to /patient/chatbot/sessions/{id}/messages
✅ T11-07  renameSession sends PATCH to /patient/chatbot/sessions/{id}/rename with { title }
✅ T11-08  deleteSession sends DELETE to /patient/chatbot/sessions/{id}
✅ T11-09  resetSession sends POST to /patient/chatbot/sessions/{id}/reset
✅ T11-10  getMessageStatus sends GET to /patient/chatbot/messages/{id}/status
✅ T11-11  deleteAllMessages sends DELETE to /patient/chatbot/messages
✅ T11-12  all methods attach Authorization Bearer header from localStorage token
✅ T11-13  getConfig sends GET to /patient/chatbot/config
```

---

## SECTION 12 — Frontend Components: ChatWidget

**File**: `Front-End/src/components/chatbot/__tests__/ChatWidget.test.tsx`

> `ChatWidget` renders a floating button. When open, it renders `<ChatWindow>` inside `<AnimatePresence>`.
> Uses `Escape` key to close and returns focus to `#chat-toggle-btn`.
> Note: No `Alt+C` keyboard shortcut exists in the actual component.

```
✅ T12-01  widget is closed by default (isOpen = false)
✅ T12-02  clicking toggle button opens the widget (renders ChatWindow)
✅ T12-03  pressing Escape closes the widget and returns focus to toggle button
✅ T12-04  widget does not render ChatWindow when closed (AnimatePresence exit)
✅ T12-05  toggle button has correct aria-expanded attribute
✅ T12-06  widget renders with dir="rtl"
```

---

## SECTION 13 — Frontend Components: ChatWindow

**File**: `Front-End/src/components/chatbot/__tests__/ChatWindow.test.tsx`

> `ChatWindow` accepts props: `isAuthenticated`, `onClose`, `onOpenFullPage?`, `isFullPage?` (default false).
> When `isFullPage=true` + `isAuthenticated=true`, it uses `useAuthChatbot` and shows sidebar.
> When `isFullPage=false` + `isAuthenticated=true`, it uses `useWidgetChatbot` (no sidebar).
> When `isAuthenticated=false`, it uses `usePublicChatbot`.

```
✅ T13-01  renders welcome screen with suggested questions when no messages exist
✅ T13-02  renders message list when messages exist
✅ T13-03  Sidebar is visible in full-page authenticated mode (isFullPage=true, isAuthenticated=true)
✅ T13-04  Sidebar is hidden in widget mode (isFullPage=false)
✅ T13-05  clicking a session in Sidebar calls loadSession
✅ T13-06  clicking "محادثة جديدة" button calls newConversation
✅ T13-07  empty state message is shown when sessions list is empty ("لا توجد محادثات لهذا البوت.")
✅ T13-08  send button is disabled while isLoading=true
✅ T13-09  medical disclaimer is always visible
✅ T13-10  emergency card shows when message contains emergency keywords
```

---

## SECTION 14 — Cache Behavior

**File**: `tests/Feature/Chatbot/CacheTest.php`

> The `ChatbotService` caches replies in Redis with key `chatbot:{botType}:{md5(message)}`.
> The `ClearChatbotCacheCommand` artisan command clears by pattern.
> The admin `clearCache` endpoint also clears via Redis pattern.
>
> ⚠️ **Environment Guard**: These tests require a running Redis instance. In CI environments
> without Redis, they must skip gracefully — not fail. Use the `beforeEach` guard below.

```
✅ T14-01  ChatbotService returns cached reply when same message is sent twice (cache.enabled=true)
✅ T14-02  chatbot:clear-cache artisan command clears cache for specific bot_type
✅ T14-03  chatbot:clear-cache without argument clears all bot caches
✅ T14-04  cache key includes bot_type and message hash to prevent cross-bot leaks
✅ T14-05  cache is not used when cache.enabled=false
```

**Required `beforeEach` guard** (place at the top of this test file):

```php
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Skip all cache tests if Redis is not available in this environment
    if (!extension_loaded('redis')) {
        test()->skip('Redis PHP extension not available');
    }

    try {
        $redis = app('redis')->connection();
        $redis->ping();
    } catch (\Exception $e) {
        test()->skip('Redis server not reachable: ' . $e->getMessage());
    }

    config([
        'cache.default'        => 'redis',
        'chatbot.cache.enabled' => true,
        // ... include standard chatbot config block
    ]);
});
```

---

## SECTION 15 — End-to-End Happy Path (Integration)

**File**: `tests/Feature/Chatbot/EndToEndTest.php`

Write one full scenario test that chains all steps:

```
✅ T15-01  Full flow: user sends message → job is dispatched → job processes → polling returns ready → session appears in sessions list
```

```php
it('full conversation flow works end to end', function () {
    Queue::fake();

    // Configure to force queue path (not sync)
    config(['chatbot.process_sync_in_local' => false]);

    $stage = LifeStage::factory()->create(['id' => 2]);
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

    // Step 3: Process job manually
    $userMsg = AiChatMessage::findOrFail($messageId);
    $job = new ProcessChatbotMessageJob($userMsg, 'pregnancy', []);
    app()->call([$job, 'handle']);

    // Step 4: Poll for reply
    $pollResponse = actingAs($user)->getJson(
        "/api/v1/patient/chatbot/messages/{$messageId}/status"
    );
    $pollResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'ready')
        ->assertJsonStructure(['data' => ['status', 'reply']]);

    // Step 5: Session appears in list
    $sessionsResponse = actingAs($user)->getJson(
        '/api/v1/patient/chatbot/sessions?bot_type=pregnancy'
    );
    $sessionsResponse->assertStatus(200);
    $sessions = collect($sessionsResponse->json('data'));
    expect($sessions->pluck('session_id'))->toContain($sessionId);
});
```

---

## Execution Instructions

### Backend (Pest)

```bash
# Run all chatbot tests
php artisan test tests/Feature/Chatbot/

# Run a specific section
php artisan test tests/Feature/Chatbot/GuestMessageStatusSecurityTest.php

# Run with coverage
php artisan test --coverage --filter=Chatbot
```

### Frontend (Vitest)

```bash
# Run all chatbot tests
npx vitest run src/components/chatbot/__tests__ src/hooks/__tests__ src/services/__tests__

# Run with UI
npx vitest --ui
```

---

## Final Verification Checklist

After running all tests, confirm:

- [ ] All 15 sections have at least the listed test cases
- [ ] All tests pass green
- [ ] No existing tests are broken
- [ ] Security tests T4-01 to T4-07 pass (Gap A is closed)
- [ ] Bot type isolation tests T6-01 to T6-06 pass (no message leakage)
- [ ] Job processing tests T7-01 to T7-06 pass (correct constructor signature)
- [ ] Hook memory leak test T10-14 passes (no dangling timers)
- [ ] End-to-end T15-01 completes the full flow successfully
- [ ] Coverage report shows ≥ 80% on ChatbotController, ChatbotService, and useChatbot
