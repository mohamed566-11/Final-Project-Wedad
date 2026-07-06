<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ChatbotService
{
    private string $apiPath;
    private string $chatEndpoint;
    private string $resetEndpoint;
    private string $adminEndpoint;
    private int $timeout;
    private int $maxAttempts;
    private int $baseRetryDelaySecs;

    public function __construct()
    {
        $this->apiPath = config('chatbot.gradio.api_path');
        $this->chatEndpoint = config('chatbot.gradio.chat_endpoint');
        $this->resetEndpoint = config('chatbot.gradio.reset_endpoint');
        $this->adminEndpoint = config('chatbot.gradio.admin_endpoint');
        $this->timeout = config('chatbot.limits.request_timeout');
        $this->maxAttempts = max(1, (int) config('chatbot.limits.request_max_attempts', 5));
        $this->baseRetryDelaySecs = max(1, (int) config('chatbot.limits.request_retry_delay_seconds', 4));

        // Local development should fail fast to avoid long UI blocking when external providers are slow.
        if (app()->environment('local')) {
            $this->timeout = min($this->timeout, 20);
            $this->maxAttempts = min($this->maxAttempts, 2);
            $this->baseRetryDelaySecs = min($this->baseRetryDelaySecs, 2);
        }
    }

    /**
     * توليد مفتاح الكاش بناءً على نوع البوت والرسالة
     */
    public function getCacheKey(string $botType, string $message): string
    {
        return 'chatbot:' . $botType . ':' . md5(Str::lower(trim($message)));
    }

    /**
     * إرسال رسالة للبوت واستقبال الرد
     * يدعم Redis Cache للأسئلة المتكررة
     */
    public function sendMessage(string $botType, string $message, array $chatHistory = []): array
    {
        $baseUrl = $this->getBaseUrl($botType);

        if (!$baseUrl) {
            return [
                'success' => false,
                'error' => 'Bot type not configured',
            ];
        }

        // === Bot Toggle Check (Admin can disable/enable any bot) ===
        if (Cache::get("chatbot_disabled:{$botType}", false)) {
            Log::info('chatbot_disabled_bot_request', ['bot_type' => $botType]);
            return [
                'success' => false,
                'error' => 'هذا المساعد الذكي موقوف مؤقتاً من قِبَل الإدارة. يُرجى المحاولة لاحقاً.',
                'code' => 'BOT_DISABLED',
            ];
        }

        try {
            // === Redis Cache Check ===
            $cacheConfig = config('chatbot.cache');
            $cacheKey = null;

            if (
                $cacheConfig['enabled']
                && strlen($message) <= $cacheConfig['max_message_length']
                && ($cacheConfig['exclude_with_history'] ? empty($chatHistory) : true)
            ) {
                $cacheKey = $this->getCacheKey($botType, $message);
                $cachedReply = Cache::get($cacheKey);

                if ($cachedReply) {
                    return [
                        'success' => true,
                        'message' => $cachedReply,
                        'cached' => true,
                    ];
                }
            }

            // === Call Gradio API ===
            $botReply = $this->callHuggingFace($botType, $message, $chatHistory);

            // === Cache the reply ===
            if ($cacheKey) {
                Cache::put($cacheKey, $botReply, now()->addHours($cacheConfig['ttl_hours']));
            }

            return [
                'success' => true,
                'message' => $botReply,
            ];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('chatbot_connection_timeout', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => 'المساعد الذكي غير متاح حالياً. حاولي مرة أخرى.',
            ];
        } catch (\Exception $e) {
            Log::error('chatbot_unexpected_error', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => 'حدث خطأ غير متوقع. حاولي مرة أخرى.',
            ];
        }
    }

    /**
     * استدعاء Hugging Face Gradio API مباشرة
     * Step 1: POST → event_id
     * Step 2: GET  → SSE response
     */
    public function callHuggingFace(string $botType, string $message, array $chatHistory = []): string
    {
        $baseUrl = $this->getBaseUrl($botType);
        $postUrl = $baseUrl . $this->apiPath . $this->chatEndpoint;

        $headers = ['Content-Type' => 'application/json'];

        // PII Sanitization before sending to external AI
        $sanitizedMessage = $this->sanitizeForExternalAi($message);

        $maxAttempts = $this->maxAttempts;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                // Step 1: POST → event_id
                $postResponse = Http::withHeaders($headers)
                    ->withOptions(['verify' => !app()->environment('local')])
                    ->timeout($this->timeout)
                    ->post($postUrl, [
                        // chatbot_fn signature in Gradio app.py:
                        // chatbot_fn(user_message, chat_history, state)
                        // so we must pass 3 inputs in this exact order.
                        'data' => [$sanitizedMessage, $this->formatChatHistory($chatHistory), []]
                    ]);

                // 503 or 500 usually means Space is still cold-starting → retry
                if ($postResponse->status() === 503 || $postResponse->status() === 500) {
                    Log::warning('chatbot_space_starting', [
                        'bot_type' => $botType,
                        'attempt' => $attempt,
                        'status' => $postResponse->status(),
                    ]);
                    if ($attempt < $maxAttempts) {
                        sleep($this->retryDelaySeconds($attempt));
                        continue;
                    }
                    throw new \RuntimeException('Gradio Space unavailable after ' . $maxAttempts . ' attempts: ' . $postResponse->status());
                }

                if (!$postResponse->successful()) {
                    Log::error('chatbot_post_failed', [
                        'bot_type' => $botType,
                        'attempt' => $attempt,
                        'status' => $postResponse->status(),
                        'body' => Str::limit($postResponse->body(), 500),
                    ]);
                    throw new \RuntimeException('Gradio POST failed: ' . $postResponse->status());
                }

                $eventId = $postResponse->json('event_id');
                if (!$eventId) {
                    if ($attempt < $maxAttempts) {
                        Log::warning('chatbot_no_event_id', ['attempt' => $attempt]);
                        sleep($this->retryDelaySeconds($attempt));
                        continue;
                    }
                    throw new \RuntimeException('No event_id received from Gradio after ' . $maxAttempts . ' attempts');
                }

                // Step 2: GET → SSE response
                $getResponse = Http::withHeaders($headers)
                    ->withOptions(['verify' => !app()->environment('local')])
                    ->timeout($this->timeout)
                    ->get($postUrl . '/' . $eventId);

                if (!$getResponse->successful()) {
                    Log::error('chatbot_get_failed', [
                        'bot_type' => $botType,
                        'event_id' => $eventId,
                        'status' => $getResponse->status(),
                    ]);
                    throw new \RuntimeException('Gradio GET failed: ' . $getResponse->status());
                }

                $parsed = $this->parseSSEResponse($getResponse->body());

                // If we got a "null" fallback message and can still retry, do so
                if (
                    $attempt < $maxAttempts
                    && str_contains($parsed, 'وضع السكون')
                ) {
                    Log::warning('chatbot_null_reply_retry', ['attempt' => $attempt]);
                    sleep($this->retryDelaySeconds($attempt));
                    continue;
                }

                return $parsed;

            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                if ($attempt < $maxAttempts) {
                    Log::warning('chatbot_connection_retry', [
                        'attempt' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                    sleep($this->retryDelaySeconds($attempt));
                    continue;
                }
                throw $e;
            }
        }

        // Should never reach here, but just in case
        throw new \RuntimeException('Gradio call failed after ' . $maxAttempts . ' attempts');
    }

    /**
     * إعادة تعيين المحادثة على Gradio
     */
    public function resetChat(string $botType): bool
    {
        $baseUrl = $this->getBaseUrl($botType);
        if (!$baseUrl)
            return false;

        try {
            $postUrl = $baseUrl . $this->apiPath . $this->resetEndpoint;
            $response = Http::withOptions(['verify' => !app()->environment('local')])
                ->timeout(10)
                ->post($postUrl, ['data' => []]);

            if ($response->successful()) {
                $eventId = $response->json('event_id');
                if ($eventId) {
                    Http::timeout(10)->get($postUrl . '/' . $eventId);
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::warning('chatbot_reset_failed', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * جلب بيانات Admin من Gradio Bot
     */
    public function getAdminData(string $botType): ?array
    {
        $baseUrl = $this->getBaseUrl($botType);
        if (!$baseUrl)
            return null;

        try {
            $adminKey = config('chatbot.admin_api_key');
            $postUrl = $baseUrl . $this->apiPath . $this->adminEndpoint;

            $response = Http::timeout(15)->post($postUrl, [
                'data' => [$adminKey]
            ]);

            if (!$response->successful())
                return null;

            $eventId = $response->json('event_id');
            if (!$eventId)
                return null;

            $getResponse = Http::timeout(15)->get($postUrl . '/' . $eventId);

            if (!$getResponse->successful())
                return null;

            $rawData = $this->parseSSEResponse($getResponse->body());

            // Try to parse as JSON
            $decoded = json_decode($rawData, true);
            return $decoded ?: ['raw' => $rawData];

        } catch (\Exception $e) {
            Log::warning('chatbot_admin_data_failed', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * جلب إعدادات بوت معين
     */
    public function getBotConfig(string $botType): ?array
    {
        return config("chatbot.bots.{$botType}");
    }

    /**
     * تحديد نوع البوت بناءً على life_stage_id
     */
    public static function getBotTypeFromStage(?int $lifeStageId): string
    {
        if (!$lifeStageId)
            return 'public';
        return config("chatbot.stage_mapping.{$lifeStageId}", 'public');
    }

    /**
     * جلب الـ Base URL حسب نوع البوت
     */
    private function getBaseUrl(string $botType): ?string
    {
        return config("chatbot.bots.{$botType}.url");
    }

    /**
     * تحويل سجل المحادثة للتنسيق الذي يطلبه Gradio
     */
    private function formatChatHistory(array $messages): array
    {
        return array_map(function ($msg) {
            return [
                'role' => ($msg['role'] ?? 'user') === 'bot' ? 'assistant' : ($msg['role'] ?? 'user'),
                'metadata' => null,
                'content' => [
                    ['text' => $msg['message'] ?? '', 'type' => 'text']
                ],
                'options' => null,
            ];
        }, $messages);
    }

    /**
     * معالجة رد SSE من Gradio
     * الرد يأتي بتنسيق:
     * event: complete
     * data: [...]
     */
    private function parseSSEResponse(string $sseBody): string
    {
        Log::info('chatbot_raw_sse', ['body' => Str::limit($sseBody, 2000)]);
        $lines = explode("\n", $sseBody);
        $dataLines = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (str_starts_with($line, 'data:')) {
                $payload = trim(substr($line, 5));
                if ($payload !== '') {
                    $dataLines[] = $payload;
                }
            }
        }

        if (empty($dataLines)) {
            return 'عذراً، لم أستطع معالجة الرد. يبدو أن المساعد الذكي في وضع السكون، حاولي مرة أخرى.';
        }

        $sawNullPayload = false;

        // Scan from newest to oldest; Gradio may end with `data: null` heartbeat after a valid payload.
        for ($i = count($dataLines) - 1; $i >= 0; $i--) {
            $lastData = $dataLines[$i];

            if ($lastData === 'null') {
                $sawNullPayload = true;
                continue;
            }

            if ($lastData === '[DONE]') {
                continue;
            }

            try {
                $decoded = json_decode($lastData, true);

                if (is_null($decoded)) {
                    continue;
                }

                $text = $this->extractAssistantTextFromDecoded($decoded);
                if (is_string($text) && trim($text) !== '') {
                    return $text;
                }

                Log::warning('chatbot_sse_no_text', ['decoded' => $decoded]);
            } catch (\Exception $e) {
                Log::warning('chatbot_sse_parse_error', ['raw' => Str::limit($lastData, 500)]);
            }
        }

        if ($sawNullPayload) {
            return 'عذراً، لم أستطع معالجة الرد. يبدو أن المساعد الذكي في وضع السكون، حاولي مرة أخرى.';
        }

        return 'عذراً، لم أستطع معالجة الرد. حاولي مرة أخرى.';
    }

    /**
     * Extract assistant text from decoded Gradio payload variants.
     */
    private function extractAssistantTextFromDecoded(mixed $decoded): ?string
    {
        if (is_string($decoded) && trim($decoded) !== '') {
            return $decoded;
        }

        if (!is_array($decoded)) {
            return null;
        }

        // Gradio wraps outputs in outer array. For chatbot_fn this is usually [chat_history, state].
        $chatMessages = (isset($decoded[0]) && is_array($decoded[0])) ? $decoded[0] : $decoded;

        $assistantMessages = array_filter(
            $chatMessages,
            fn($m) => is_array($m) && isset($m['role']) && $m['role'] === 'assistant'
        );

        if (!empty($assistantMessages)) {
            $lastAssistant = end($assistantMessages);
            if (is_array($lastAssistant) && isset($lastAssistant['content'])) {
                if (is_array($lastAssistant['content'])) {
                    foreach ($lastAssistant['content'] as $content) {
                        if (
                            is_array($content)
                            && isset($content['type'], $content['text'])
                            && $content['type'] === 'text'
                            && is_string($content['text'])
                            && trim($content['text']) !== ''
                        ) {
                            return $content['text'];
                        }
                    }
                }

                if (is_string($lastAssistant['content']) && trim($lastAssistant['content']) !== '') {
                    return $lastAssistant['content'];
                }
            }
        }

        // Fallback for plain text payloads.
        if (isset($chatMessages[0]) && is_string($chatMessages[0]) && trim($chatMessages[0]) !== '') {
            return $chatMessages[0];
        }

        return null;
    }

    /**
     * تنقية البيانات الحساسة قبل الإرسال لمزود AI خارجي
     * (PII Redaction: Email, Phone, National ID)
     */
    public function sanitizeForExternalAi(string $text): string
    {
        $patterns = [
            '/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i' => '[REDACTED_EMAIL]',
            '/\b(?:\+?2)?01[0-9]{9}\b/' => '[REDACTED_PHONE]',
            '/\b\d{14}\b/' => '[REDACTED_NATIONAL_ID]',
        ];

        return preg_replace(array_keys($patterns), array_values($patterns), $text) ?? $text;
    }

    /**
     * Exponential backoff for retries to improve Space wake-up success rate.
     */
    private function retryDelaySeconds(int $attempt): int
    {
        return min(20, $this->baseRetryDelaySecs * (int) pow(2, max(0, $attempt - 1)));
    }

    /**
     * Upload a document file to the bot's RAG system via the Gradio API.
     */
    public function uploadDocumentToBot($botType, $file)
    {
        $baseUrl = rtrim($this->getBaseUrl($botType), '/');
        $adminKey = config('chatbot.admin_api_key');

        // Step 1: Upload the file bypassing API endpoints using /gradio_api/upload
        $uploadResponse = Http::timeout(120)
            ->withOptions(['verify' => !app()->environment('local')])
            ->attach('files', fopen($file->getRealPath(), 'r'), $file->getClientOriginalName())
            ->post($baseUrl . '/gradio_api/upload');

        $uploadedPaths = $uploadResponse->json();

        \Log::info('uploadResponse', [
            'status' => $uploadResponse->status(),
            'body' => $uploadResponse->body()
        ]);

        if (empty($uploadedPaths) || !isset($uploadedPaths[0])) {
            throw new \Exception("Failed to upload the file to Hugging Face server. HTTP " . $uploadResponse->status());
        }
        $hfUploadedFilePath = $uploadedPaths[0];

        // Step 2: Trigger processing via Gradio 4 API (Async SSE Flow)
        $postResponse = Http::timeout(120)
            ->withOptions(['verify' => !app()->environment('local')])
            ->post($baseUrl . '/gradio_api/call/upload_document', [
                'data' => [
                    ['path' => $hfUploadedFilePath, 'meta' => ['_type' => 'gradio.FileData']],
                    $adminKey
                ]
            ]);

        $eventId = $postResponse->json('event_id');
        if (!$eventId) {
            throw new \Exception("Failed to trigger upload document API. Body: " . $postResponse->body());
        }

        // Poll for result using SSE parser
        $getResponse = Http::timeout(120)
            ->withOptions(['verify' => !app()->environment('local')])
            ->get($baseUrl . '/gradio_api/call/upload_document/' . $eventId);

        $result = $this->parseSSEResponse($getResponse->body());

        if (strpos($result, '❌') !== false || strpos($result, 'غير صحيح') !== false) {
            throw new \Exception($result);
        }

        return $result;
    }

    /**
     * Delete a formatted document by filename from the bot's vector index.
     */
    public function deleteDocumentFromBot($botType, $fileName)
    {
        $baseUrl = rtrim($this->getBaseUrl($botType), '/');
        $adminKey = config('chatbot.admin_api_key');

        $postResponse = Http::timeout(30)
            ->withOptions(['verify' => !app()->environment('local')])
            ->post($baseUrl . '/gradio_api/call/delete_document', [
                'data' => [
                    $fileName,
                    $adminKey
                ]
            ]);

        $eventId = $postResponse->json('event_id');
        if (!$eventId) {
            throw new \Exception("Failed to trigger delete document API. Body: " . $postResponse->body());
        }

        $getResponse = Http::timeout(60)
            ->withOptions(['verify' => !app()->environment('local')])
            ->get($baseUrl . '/gradio_api/call/delete_document/' . $eventId);

        $result = $this->parseSSEResponse($getResponse->body());

        if (strpos($result, '❌') !== false || strpos($result, 'غير صحيح') !== false) {
            throw new \Exception($result);
        }

        return $result;
    }
}
