<?php

use App\Services\ChatbotService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Unit Tests: ChatbotService
 * اختبار الوظائف الأساسية للـ Service بدون HTTP calls حقيقية
 */

// T1: parseSSEResponse - تحليل ردود Gradio SSE بتنسيقات مختلفة
describe('ChatbotService::parseSSEResponse', function () {

    it('extracts text from assistant role in Gradio format', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'parseSSEResponse');
        $method->setAccessible(true);

        // Gradio format: outer array [chat_history, state]
        // chat_history = array of messages with role/content
        $chatHistory = [
            ['role' => 'user',      'content' => [['type' => 'text', 'text' => 'مرحبا']]],
            ['role' => 'assistant', 'content' => [['type' => 'text', 'text' => 'أهلاً بك!']]],
        ];
        $outerArray = [$chatHistory, null]; // [chat_history, state]
        $message = json_encode($outerArray);

        $sseBody = "event: complete\ndata: {$message}\n\n";

        $result = $method->invoke($service, $sseBody);

        expect($result)->toBe('أهلاً بك!');
    });

    it('falls back to plain string when no assistant role found', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'parseSSEResponse');
        $method->setAccessible(true);

        $sseBody = "event: complete\ndata: \"رد البوت مباشر\"\n\n";

        $result = $method->invoke($service, $sseBody);

        expect($result)->toBe('رد البوت مباشر');
    });

    it('returns fallback message when data is empty', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'parseSSEResponse');
        $method->setAccessible(true);

        $result = $method->invoke($service, "event: heartbeat\n\n");

        expect($result)->toContain('عذراً');
    });

    it('handles first element of plain array response', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'parseSSEResponse');
        $method->setAccessible(true);

        // When decoded[0] is a string (plain array format)
        $sseBody = "event: complete\ndata: [\"\u0646\u0635 \u0627\u0644\u0631\u062f \u0647\u0646\u0627\", null]\n\n";

        $result = $method->invoke($service, $sseBody);

        expect($result)->toBe('نص الرد هنا');
    });
});

// T2: sanitizeForExternalAi - تنقية البيانات الحساسة (PII Redaction)
describe('ChatbotService::sanitizeForExternalAi', function () {

    beforeEach(fn () => config([
        'chatbot.bots.public.url' => 'https://example.hf.space',
        'chatbot.gradio.api_path' => '/gradio_api/call',
        'chatbot.gradio.chat_endpoint' => '/chatbot_fn',
        'chatbot.gradio.reset_endpoint' => '/reset_chat',
        'chatbot.gradio.admin_endpoint' => '/admin',
        'chatbot.limits.request_timeout' => 30,
        'chatbot.hf_token' => null,
    ]));

    it('redacts Egyptian phone numbers', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'sanitizeForExternalAi');
        $method->setAccessible(true);

        $result = $method->invoke($service, 'اتصل بي على 01012345678');

        expect($result)->toContain('[REDACTED_PHONE]');
        expect($result)->not->toContain('01012345678');
    });

    it('redacts email addresses', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'sanitizeForExternalAi');
        $method->setAccessible(true);

        $result = $method->invoke($service, 'بريدي هو user@example.com شكراً');

        expect($result)->toContain('[REDACTED_EMAIL]');
        expect($result)->not->toContain('user@example.com');
    });

    it('redacts 14-digit national ID', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'sanitizeForExternalAi');
        $method->setAccessible(true);

        $result = $method->invoke($service, 'رقم هويتي 29901011234567');

        expect($result)->toContain('[REDACTED_NATIONAL_ID]');
        expect($result)->not->toContain('29901011234567');
    });

    it('does not modify normal text', function () {
        $service = new ChatbotService();
        $method  = new ReflectionMethod(ChatbotService::class, 'sanitizeForExternalAi');
        $method->setAccessible(true);

        $text   = 'ما هي أعراض الحمل الطبيعية؟';
        $result = $method->invoke($service, $text);

        expect($result)->toBe($text);
    });
});

// T3: getBotTypeFromStage - ربط المراحل بأنواع البوتات
describe('ChatbotService::getBotTypeFromStage', function () {

    beforeEach(fn () => config([
        'chatbot.stage_mapping' => [
            1 => 'pre_marriage',
            2 => 'pregnancy',
            3 => 'motherhood',
        ],
    ]));

    it('returns public for null life_stage_id', function () {
        expect(ChatbotService::getBotTypeFromStage(null))->toBe('public');
    });

    it('maps stage 1 to pre_marriage', function () {
        expect(ChatbotService::getBotTypeFromStage(1))->toBe('pre_marriage');
    });

    it('maps stage 2 to pregnancy', function () {
        expect(ChatbotService::getBotTypeFromStage(2))->toBe('pregnancy');
    });

    it('maps stage 3 to motherhood', function () {
        expect(ChatbotService::getBotTypeFromStage(3))->toBe('motherhood');
    });

    it('returns public for unknown stage', function () {
        expect(ChatbotService::getBotTypeFromStage(99))->toBe('public');
    });
});
// T4: sendMessage - Bot Toggle Check
describe('ChatbotService::sendMessage (Bot Toggle)', function () {

    beforeEach(fn () => config([
        'chatbot.bots.public.url'        => 'https://test-bot.hf.space',
        'chatbot.gradio.api_path'        => '/gradio_api/call',
        'chatbot.gradio.chat_endpoint'   => '/chatbot_fn',
        'chatbot.gradio.reset_endpoint'  => '/reset_chat',
        'chatbot.gradio.admin_endpoint'  => '/admin',
        'chatbot.limits.request_timeout' => 30,
        'chatbot.hf_token'               => null,
        'chatbot.cache.enabled'          => false,
    ]));

    afterEach(function () {
        // تنظيف Cache بعد كل test
        Cache::forget('chatbot_disabled:public');
        Cache::forget('chatbot_disabled:pregnancy');
    });

    it('returns BOT_DISABLED error when bot is toggled off via Cache', function () {
        // Admin يوقف البوت
        Cache::put('chatbot_disabled:public', true, now()->addDays(30));

        $service = new ChatbotService();
        $result  = $service->sendMessage('public', 'مرحبا');

        expect($result['success'])->toBeFalse();
        expect($result['code'])->toBe('BOT_DISABLED');
        expect($result['error'])->toContain('موقوف');
    });

    it('Cache flag is absent by default (bot enabled)', function () {
        // بدون أي toggle — المفتاح يجب أن يكون غائب
        Cache::forget('chatbot_disabled:public');

        $isDisabled = Cache::get('chatbot_disabled:public', false);

        expect($isDisabled)->toBeFalse();
    });

    it('re-enables bot after Cache::forget', function () {
        Cache::put('chatbot_disabled:pregnancy', true, now()->addDays(1));
        // إعادة التشغيل
        Cache::forget('chatbot_disabled:pregnancy');

        $isDisabled = Cache::get('chatbot_disabled:pregnancy', false);
        expect($isDisabled)->toBeFalse();
    });

    it('toggling on then off produces correct Cache states', function () {
        // Disable
        Cache::put('chatbot_disabled:public', true, now()->addMinutes(10));
        expect(Cache::get('chatbot_disabled:public', false))->toBeTrue();

        // Enable
        Cache::forget('chatbot_disabled:public');
        expect(Cache::get('chatbot_disabled:public', false))->toBeFalse();
    });
});
