<?php

/**
 * Section 14 — Cache Behavior
 *
 * Tests Chatbot cache behavior.
 */

use App\Models\User;
use App\Models\LifeStage;
use App\Services\ChatbotService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Skip all cache tests if Redis is not available in this environment
    if (!extension_loaded('redis')) {
        test()->markTestSkipped('Redis PHP extension not available');
    }

    try {
        $redis = app('redis')->connection();
        $redis->ping();
    } catch (\Exception $e) {
        test()->skip('Redis server not reachable: ' . $e->getMessage());
    }

    config([
        'cache.default'                          => 'redis',
        'chatbot.cache.enabled'                  => true,
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
        'chatbot.stage_mapping'                  => [1 => 'pre_marriage', 2 => 'pregnancy', 3 => 'motherhood'],
        'chatbot.hf_token'                       => null,
        'chatbot.process_sync_in_local'          => false,
    ]);
});

// ── T14-01 ChatbotService returns cached reply ──────────────────────────

it('T14-01 ChatbotService returns cached reply when same message is sent twice', function () {
    Cache::store('redis')->flush();

    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'test-event-123'], 200)
            ->push(['event_id' => 'test-event-456'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-123' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"رد من المخدم\"}]}]\n\n",
            200
        ),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/test-event-456' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"هذا رد جديد\"}]}]\n\n",
            200
        ),
    ]);

    $service = app(ChatbotService::class);

    // First call (hits API, saves to cache)
    $result1 = $service->sendMessage('public', 'سؤال متكرر', []);

    // Verify it returned API response
    expect($result1['success'])->toBeTrue();
    expect($result1['message'])->toBe('رد من المخدم');

    // Second call (should hit cache, NOT call API again)
    $result2 = $service->sendMessage('public', 'سؤال متكرر', []);

    expect($result2['success'])->toBeTrue();
    expect($result2['message'])->toBe('رد من المخدم'); // Same as cached!
    expect($result2['cached'] ?? false)->toBeTrue();
});

// ── T14-02 clear_cache artisan command ──────────────────────────────────

it('T14-02 chatbot:clear-cache artisan command clears cache for specific bot_type', function () {
    Cache::store('redis')->flush();
    $service = app(ChatbotService::class);
    $cacheKey = $service->getCacheKey('pregnancy', 'كيف الحمل');

    Cache::store('redis')->put($cacheKey, 'test cached response', 3600);

    expect(Cache::store('redis')->has($cacheKey))->toBeTrue();

    $this->artisan('chatbot:clear-cache pregnancy')->assertSuccessful();

    expect(Cache::store('redis')->has($cacheKey))->toBeFalse();
});

// ── T14-03 clear_cache without args ─────────────────────────────────────

it('T14-03 chatbot:clear-cache without argument clears all bot caches', function () {
    Cache::store('redis')->flush();
    $service = app(ChatbotService::class);

    $key1 = $service->getCacheKey('pregnancy', 'Q1');
    $key2 = $service->getCacheKey('motherhood', 'Q2');

    Cache::store('redis')->put($key1, 'R1', 3600);
    Cache::store('redis')->put($key2, 'R2', 3600);

    expect(Cache::store('redis')->has($key1))->toBeTrue();
    expect(Cache::store('redis')->has($key2))->toBeTrue();

    $this->artisan('chatbot:clear-cache')->assertSuccessful();

    expect(Cache::store('redis')->has($key1))->toBeFalse();
    expect(Cache::store('redis')->has($key2))->toBeFalse();
});

// ── T14-04 Cache key format ─────────────────────────────────────────────

it('T14-04 cache key includes bot_type and message hash', function () {
    $service = app(ChatbotService::class);

    $key = $service->getCacheKey('public', 'مرحبا');

    expect($key)->toStartWith('chatbot:public:');
    expect(str_contains($key, md5('مرحبا')))->toBeTrue();
});

// ── T14-05 Cache disabled ───────────────────────────────────────────────

it('T14-05 cache is not used when cache.enabled=false', function () {
    config(['chatbot.cache.enabled' => false]);
    Cache::store('redis')->flush();

    Http::fake([
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn' => Http::sequence()
            ->push(['event_id' => 'ev-1'], 200)
            ->push(['event_id' => 'ev-2'], 200),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/ev-1' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"رد 1\"}]}]\n\n",
            200
        ),
        'https://test-bot.hf.space/gradio_api/call/chatbot_fn/ev-2' => Http::response(
            "event: complete\ndata: [{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"رد 2\"}]}]\n\n",
            200
        ),
    ]);

    $service = app(ChatbotService::class);

    $r1 = $service->sendMessage('public', 'سؤال', []);
    $r2 = $service->sendMessage('public', 'سؤال', []);

    expect($r1['message'])->toBe('رد 1');
    expect($r2['message'])->toBe('رد 2'); // Did not use cache
});
