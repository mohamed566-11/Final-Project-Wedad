# 🤖 خطة نظام الشات بوت الشاملة (Chatbot System Plan) - منصة وداد

> **ملاحظة:** هذه الخطة مبنية على تحليل كامل للكود الموجود فعلاً في المشروع (Models، Migrations، Services، Controllers، Frontend patterns) لضمان التوافق الكامل.

---

## 📋 الفهرس

1. [نظرة عامة على النظام](#1-نظرة-عامة-على-النظام)
2. [المتطلبات والتثبيت](#2-المتطلبات-والتثبيت)
3. [هيكل قاعدة البيانات](#3-هيكل-قاعدة-البيانات)
4. [ملفات الإعداد (Config)](#4-ملفات-الإعداد)
5. [الباك إند - الكود الكامل](#5-الباك-إند---الكود-الكامل)
6. [الفرونت إند - الكود الكامل](#6-الفرونت-إند---الكود-الكامل)
7. [آلية العمل وتدفق البيانات](#7-آلية-العمل-وتدفق-البيانات)
8. [الأمان وحدود الاستخدام](#8-الأمان-وحدود-الاستخدام)
9. [معالجة الأخطاء](#9-معالجة-الأخطاء)
10. [خطة التنفيذ المرحلية](#10-خطة-التنفيذ-المرحلية)
11. [الحوكمة الطبية والتصعيد الآمن](#11-الحوكمة-الطبية-والتصعيد-الآمن)
12. [الخصوصية والامتثال وإدارة البيانات](#12-الخصوصية-والامتثال-وإدارة-البيانات)
13. [الاعتمادية والمراقبة التشغيلية](#13-الاعتمادية-والمراقبة-التشغيلية)
14. [الاختبارات والإطلاق التدريجي](#14-الاختبارات-والإطلاق-التدريجي)
15. [المعالجة غير المتزامنة عبر Queue](#15-المعالجة-غير-المتزامنة-عبر-queue)
16. [Redis Caching للأسئلة المتكررة](#16-redis-caching-للأسئلة-المتكررة)
17. [لوحة الإدارة والإشراف](#17-لوحة-الإدارة-والإشراف)
18. [إمكانية الوصول (Accessibility A11y)](#18-إمكانية-الوصول-accessibility-a11y)
19. [Real-time عبر Laravel Reverb (WebSocket)](#19-real-time-عبر-laravel-reverb-websocket)
20. [دعم RTL والخطوط العربية](#20-دعم-rtl-والخطوط-العربية)

---

## 1. نظرة عامة على النظام

### 1.1 الفكرة

4 روبوتات محادثة (Chatbots) مبنية على نماذج ذكاء اصطناعي مستضافة على **Hugging Face Spaces** (Gradio API). يتم التواصل معها عبر **HTTP REST** من خلال الباك إند (Laravel) كـ Proxy لحماية مفاتيح الـ API وتخزين سجل المحادثات.

### 1.2 أنواع الشات بوت

| #   | البوت                     | الجمهور                      | الوصف                                  | الـ `bot_type` |
| --- | ------------------------- | ---------------------------- | -------------------------------------- | -------------- |
| 1   | **الشات بوت العام**       | الزوار (غير مسجلين)          | معلومات عن المنصة وخدماتها             | `public`       |
| 2   | **شات بوت ما قبل الزواج** | مستخدمات مرحلة ما قبل الزواج | نصائح صحية ونفسية لمرحلة ما قبل الزواج | `pre_marriage` |
| 3   | **شات بوت الحمل**         | مستخدمات مرحلة الحمل         | متابعة الحمل والنصائح الصحية           | `pregnancy`    |
| 4   | **شات بوت الأمومة**       | مستخدمات مرحلة الأمومة       | رعاية الطفل ونصائح ما بعد الولادة      | `motherhood`   |

### 1.3 آلية الاتصال بـ Gradio API (HTTP REST)

Gradio يستخدم نظام **Server-Sent Events (SSE)**، الطلب يتم على خطوتين:

1. **`POST /gradio_api/call/chatbot_fn`** → يُرجع `event_id`
2. **`GET /gradio_api/call/chatbot_fn/{event_id}`** → يُرجع الرد كـ SSE stream

### 1.4 ملفات النظام

```
Back-end/
├── config/chatbot.php                              ← إعدادات البوتات
├── app/
│   ├── Models/AiChatMessage.php                    ← موجود (سنعدّله)
│   ├── Services/ChatbotService.php                 ← جديد
│   ├── Jobs/ProcessChatbotMessageJob.php           ← جديد (Queue)
│   ├── Events/ChatbotResponseReady.php             ← جديد (WebSocket)
│   ├── Console/Commands/ClearChatbotCacheCommand.php ← جديد (Cache)
│   ├── Http/
│   │   ├── Controllers/Api/Patient/ChatbotController.php  ← جديد
│   │   ├── Controllers/Api/Admin/AdminChatbotController.php ← جديد
│   │   └── Requests/Patient/SendChatMessageRequest.php    ← جديد
│   └── Resources/Patient/ChatMessageResource.php          ← جديد
├── routes/patient.php                              ← إضافة routes
├── routes/public.php                               ← إضافة route
├── routes/admin.php                                ← إضافة routes
├── routes/channels.php                             ← تعديل (WebSocket)

Front-End/src/
├── lib/echo.ts                                     ← جديد (WebSocket)
├── constants/chatbot-strings.ts                    ← جديد (نصوص عربية)
├── services/chatbotService.ts                      ← جديد
├── hooks/useChatbot.ts                             ← جديد
├── components/chatbot/
│   ├── ChatWidget.tsx                              ← الزر العائم
│   ├── ChatWindow.tsx                              ← نافذة الشات
│   ├── ChatHeader.tsx                              ← هيدر النافذة
│   ├── MessageList.tsx                             ← قائمة الرسائل
│   ├── MessageBubble.tsx                           ← فقاعة الرسالة
│   ├── MessageInput.tsx                            ← مربع الإدخال
│   ├── TypingIndicator.tsx                         ← مؤشر الكتابة
│   └── SuggestedQuestions.tsx                      ← أسئلة مقترحة
└── types/chatbot.ts                                ← TypeScript types
```

---

## 2. المتطلبات والتثبيت

### 2.1 لا حاجة لتثبيت حزم جديدة في الباك إند

- **`guzzlehttp/guzzle`** ← موجود افتراضياً في Laravel
- **`illuminate/http`** ← موجود (يدعم `Http::` facade)

### 2.2 تثبيت حزم الفرونت إند

```bash
cd Front-End
bun add react-markdown laravel-echo pusher-js tailwindcss-rtl
bun add -D @axe-core/react
```

> **الباقي موجود:** `axios`, `lucide-react`, `framer-motion`, `@radix-ui/*`, TanStack Query

### 2.3 إعدادات البيئة (`.env`)

إضافة هذه المتغيرات في `Back-end/.env`:

```env
# ============================================
# Chatbot Configuration (Hugging Face Gradio)
# ============================================
HUGGINGFACE_API_TOKEN=your_hf_token_here

# Gradio API Base URLs (بدون /gradio_api/call)
CHATBOT_PUBLIC_URL=https://amrhassank-chat-bot-v1.hf.space
CHATBOT_PREMARRIAGE_URL=https://your-premarriage-bot.hf.space
CHATBOT_PREGNANCY_URL=https://your-pregnancy-bot.hf.space
CHATBOT_MOTHERHOOD_URL=https://your-motherhood-bot.hf.space

# Rate Limits
CHATBOT_PUBLIC_RATE_LIMIT=10
CHATBOT_AUTH_RATE_LIMIT=30
CHATBOT_MAX_MESSAGE_LENGTH=1000
CHATBOT_MAX_HISTORY_MESSAGES=20
CHATBOT_REQUEST_TIMEOUT=30

# Queue
QUEUE_CONNECTION=redis
QUEUE_CHATBOT=chatbot

# Cache
CHATBOT_CACHE_ENABLED=true
CHATBOT_CACHE_TTL_HOURS=24

# Reverb (WebSocket) - يُولّد تلقائياً بعد php artisan reverb:install
# REVERB_APP_ID=
# REVERB_APP_KEY=
# REVERB_APP_SECRET=
# REVERB_HOST=localhost
# REVERB_PORT=8080
# REVERB_SCHEME=http
# VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
# VITE_REVERB_HOST="${REVERB_HOST}"
# VITE_REVERB_PORT="${REVERB_PORT}"
# VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

---

## 3. هيكل قاعدة البيانات

### 3.1 الجدول الموجود: `ai_chat_messages`

> ⚠️ **مهم:** يوجد بالفعل جدول `ai_chat_messages` وموديل `AiChatMessage` والـ relationship `User->aiChatMessages()`. **سنستخدمهم مباشرة** بدون إنشاء جداول جديدة.

```
ai_chat_messages
├── id              (BigInt, PK, Auto Increment)
├── user_id         (FK → users.id, CASCADE)
├── session_id      (String) ← يحتوي bot_type + uuid مثل: "pregnancy_abc123"
├── role            (Enum: 'user', 'assistant')
├── message         (Text)
├── metadata        (JSON, Nullable) ← لتخزين معلومات إضافية
├── created_at      (Timestamp)
└── updated_at      (Timestamp)
Index: (user_id, session_id)
```

### 3.2 Migration تعديل (إضافة حقل `bot_type`)

نحتاج migration جديدة لإضافة حقل `bot_type` مباشرة للجدول لسهولة الـ Query:

```php
// database/migrations/2026_02_21_000001_add_bot_type_to_ai_chat_messages_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_chat_messages', function (Blueprint $table) {
            $table->enum('bot_type', ['public', 'pre_marriage', 'pregnancy', 'motherhood'])
                  ->default('public')
                  ->after('session_id');
            $table->index('bot_type');
        });
    }

    public function down(): void
    {
        Schema::table('ai_chat_messages', function (Blueprint $table) {
            $table->dropIndex(['bot_type']);
            $table->dropColumn('bot_type');
        });
    }
};
```

### 3.3 تعديل الموديل `AiChatMessage`

```php
// الإضافات على الموديل الموجود:
protected $fillable = [
    'user_id',
    'session_id',
    'bot_type',    // ← جديد
    'role',
    'message',
    'metadata',
];

// ← Scope جديد للفلترة حسب نوع البوت
public function scopeForBot($query, string $botType)
{
    return $query->where('bot_type', $botType);
}

// ← Scope للجلسة الحالية
public function scopeForSession($query, string $sessionId)
{
    return $query->where('session_id', $sessionId);
}
```

---

## 4. ملفات الإعداد

### 4.1 ملف `config/chatbot.php`

```php
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Hugging Face API Token
    |--------------------------------------------------------------------------
    */
    'hf_token' => env('HUGGINGFACE_API_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Bot Endpoints (Gradio Spaces)
    |--------------------------------------------------------------------------
    | كل بوت له Space خاص على Hugging Face
    */
    'bots' => [
        'public' => [
            'url' => env('CHATBOT_PUBLIC_URL', 'https://amrhassank-chat-bot-v1.hf.space'),
            'name' => 'وداد - المساعد العام',
            'welcome_message' => 'أهلاً بك في منصة وداد! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟',
            'suggested_questions' => [
                'ما هي منصة وداد؟',
                'ما هي الخدمات المتاحة؟',
                'كيف أسجل في المنصة؟',
                'ما هي باقات الاشتراك؟',
            ],
        ],
        'pre_marriage' => [
            'url' => env('CHATBOT_PREMARRIAGE_URL'),
            'name' => 'وداد - مرحلة ما قبل الزواج',
            'welcome_message' => 'أهلاً بكِ! أنا مساعدتكِ في مرحلة ما قبل الزواج. يمكنني مساعدتكِ بالنصائح الصحية والنفسية.',
            'suggested_questions' => [
                'ما هي الفحوصات المطلوبة قبل الزواج؟',
                'نصائح للتغذية السليمة',
                'كيف أهتم بصحتي النفسية؟',
            ],
        ],
        'pregnancy' => [
            'url' => env('CHATBOT_PREGNANCY_URL'),
            'name' => 'وداد - مرحلة الحمل',
            'welcome_message' => 'أهلاً بكِ! أنا مساعدتكِ في مرحلة الحمل. اسأليني عن أي شيء يتعلق بصحتكِ وصحة جنينكِ.',
            'suggested_questions' => [
                'ما هي أعراض الحمل الطبيعية؟',
                'جدول متابعة الحمل',
                'نصائح التغذية أثناء الحمل',
                'متى يجب أن أذهب للطبيب؟',
            ],
        ],
        'motherhood' => [
            'url' => env('CHATBOT_MOTHERHOOD_URL'),
            'name' => 'وداد - مرحلة الأمومة',
            'welcome_message' => 'أهلاً بكِ أيتها الأم! أنا هنا لمساعدتكِ في رحلة الأمومة. اسأليني عن أي شيء.',
            'suggested_questions' => [
                'نصائح الرضاعة الطبيعية',
                'جدول تطعيمات الطفل',
                'كيف أتعامل مع اكتئاب ما بعد الولادة؟',
                'متى يبدأ الطفل بالأكل؟',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Gradio API Settings
    |--------------------------------------------------------------------------
    */
    'gradio' => [
        'api_path' => '/gradio_api/call',
        'chat_endpoint' => '/chatbot_fn',
        'reset_endpoint' => '/reset_chat',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting & Constraints
    |--------------------------------------------------------------------------
    */
    'limits' => [
        'public_rate_per_minute' => (int) env('CHATBOT_PUBLIC_RATE_LIMIT', 10),
        'auth_rate_per_minute' => (int) env('CHATBOT_AUTH_RATE_LIMIT', 30),
        'max_message_length' => (int) env('CHATBOT_MAX_MESSAGE_LENGTH', 1000),
        'max_history_messages' => (int) env('CHATBOT_MAX_HISTORY_MESSAGES', 20),
        'request_timeout' => (int) env('CHATBOT_REQUEST_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Life Stage → Bot Type Mapping
    |--------------------------------------------------------------------------
    | ربط life_stage_id (من جدول life_stages) بنوع البوت
    */
    'stage_mapping' => [
        1 => 'pre_marriage',   // ما قبل الزواج
        2 => 'pregnancy',      // الحمل
        3 => 'motherhood',     // الأمومة
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'enabled'              => env('CHATBOT_CACHE_ENABLED', true),
        'ttl_hours'            => (int) env('CHATBOT_CACHE_TTL_HOURS', 24),
        'max_message_length'   => 150,
        'exclude_with_history' => true,
    ],

];
```

### 4.2 تحسين مهم: ربط المراحل بالـ `slug/code` وليس IDs ثابتة

> ⚠️ لتجنب كسر النظام عند تغيير seed أو ترتيب البيانات، لا يُنصح بالاعتماد على `life_stage_id` الثابت.

**النهج الأفضل:**

- إضافة عمود ثابت مثل `code` في جدول `life_stages` (مثل: `pre_marriage`, `pregnancy`, `motherhood`).
- عمل الـ mapping بناءً على `life_stage.code` بدلاً من الرقم.

```php
// مثال أدق داخل config/chatbot.php
'stage_mapping_by_code' => [
  'pre_marriage' => 'pre_marriage',
  'pregnancy' => 'pregnancy',
  'motherhood' => 'motherhood',
],
```

```php
// مثال داخل ChatbotService
public static function getBotTypeFromStageCode(?string $stageCode): string
{
  if (!$stageCode) return 'public';
  return config("chatbot.stage_mapping_by_code.{$stageCode}", 'public');
}
```

### 4.3 إضافة في `config/services.php`

```php
// إضافة ضمن المصفوفة الموجودة:
'huggingface' => [
    'token' => env('HUGGINGFACE_API_TOKEN'),
],
```

---

## 5. الباك إند - الكود الكامل

### 5.1 الـ Service: `app/Services/ChatbotService.php`

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\AiChatMessage;

class ChatbotService
{
    private string $apiPath;
    private string $chatEndpoint;
    private string $resetEndpoint;
    private int $timeout;
    private ?string $hfToken;

    public function __construct()
    {
        $this->apiPath = config('chatbot.gradio.api_path');
        $this->chatEndpoint = config('chatbot.gradio.chat_endpoint');
        $this->resetEndpoint = config('chatbot.gradio.reset_endpoint');
        $this->timeout = config('chatbot.limits.request_timeout');
        $this->hfToken = config('chatbot.hf_token');
    }

    /**
     * إرسال رسالة للبوت واستقبال الرد
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

        try {
            // الخطوة 1: إرسال POST للحصول على event_id
            $postUrl = $baseUrl . $this->apiPath . $this->chatEndpoint;

            $headers = ['Content-Type' => 'application/json'];
            if ($this->hfToken) {
                $headers['Authorization'] = 'Bearer ' . $this->hfToken;
            }

            $postResponse = Http::withHeaders($headers)
                ->timeout($this->timeout)
                ->post($postUrl, [
                    'data' => [$message, $this->formatChatHistory($chatHistory)]
                ]);

            if (!$postResponse->successful()) {
                Log::error('Chatbot POST failed', [
                    'bot_type' => $botType,
                    'status' => $postResponse->status(),
                    'body' => $postResponse->body(),
                ]);
                return [
                    'success' => false,
                    'error' => 'Failed to connect to AI service',
                ];
            }

            $eventId = $postResponse->json('event_id');

            if (!$eventId) {
                return [
                    'success' => false,
                    'error' => 'No event ID received from AI service',
                ];
            }

            // الخطوة 2: GET لجلب الرد باستخدام event_id
            $getUrl = $postUrl . '/' . $eventId;

            $getResponse = Http::withHeaders($headers)
                ->timeout($this->timeout)
                ->get($getUrl);

            if (!$getResponse->successful()) {
                Log::error('Chatbot GET failed', [
                    'bot_type' => $botType,
                    'event_id' => $eventId,
                    'status' => $getResponse->status(),
                ]);
                return [
                    'success' => false,
                    'error' => 'Failed to get response from AI service',
                ];
            }

            // معالجة رد SSE
            $botReply = $this->parseSSEResponse($getResponse->body());

            return [
                'success' => true,
                'message' => $botReply,
            ];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Chatbot connection timeout', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => 'AI service is not responding. Please try again later.',
            ];
        } catch (\Exception $e) {
            Log::error('Chatbot unexpected error', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => 'An unexpected error occurred',
            ];
        }
    }

    /**
     * إعادة تعيين المحادثة على Gradio
     */
    public function resetChat(string $botType): bool
    {
        $baseUrl = $this->getBaseUrl($botType);
        if (!$baseUrl) return false;

        try {
            $postUrl = $baseUrl . $this->apiPath . $this->resetEndpoint;
            $headers = [];
            if ($this->hfToken) {
                $headers['Authorization'] = 'Bearer ' . $this->hfToken;
            }

            $response = Http::withHeaders($headers)
                ->timeout(10)
                ->post($postUrl, ['data' => []]);

            if ($response->successful()) {
                $eventId = $response->json('event_id');
                // استهلاك الحدث
                Http::withHeaders($headers)
                    ->timeout(10)
                    ->get($postUrl . '/' . $eventId);
            }

            return true;
        } catch (\Exception $e) {
            Log::warning('Chatbot reset failed', [
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
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
     * Gradio chat_history format:
     * [{"role": "user", "content": [{"text": "msg", "type": "text"}]},
     *  {"role": "assistant", "content": [{"text": "reply", "type": "text"}]}]
     */
    private function formatChatHistory(array $messages): array
    {
        return array_map(function ($msg) {
            return [
                'role' => $msg['role'] === 'bot' ? 'assistant' : $msg['role'],
                'metadata' => null,
                'content' => [
                    ['text' => $msg['message'], 'type' => 'text']
                ],
                'options' => null,
            ];
        }, $messages);
    }

    /**
     * معالجة رد SSE من Gradio
     * الرد يأتي بتنسيق:
     * event: ...
     * data: ...
     *
     * event: complete
     * data: [{"role":"assistant","content":[{"text":"الرد هنا","type":"text"}]}]
     */
    private function parseSSEResponse(string $sseBody): string
    {
        $lines = explode("\n", $sseBody);
        $lastData = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (str_starts_with($line, 'data:')) {
                $lastData = trim(substr($line, 5));
            }
        }

        if (!$lastData) {
            return 'عذراً، لم أستطع معالجة الرد. حاولي مرة أخرى.';
        }

        try {
            $decoded = json_decode($lastData, true);

            // Gradio يرجع مصفوفة من الرسائل، آخر رسالة هي رد البوت
            if (is_array($decoded)) {
                // البحث عن آخر رسالة من assistant
                $assistantMessages = array_filter($decoded, fn($m) =>
                    isset($m['role']) && $m['role'] === 'assistant'
                );

                if (!empty($assistantMessages)) {
                    $lastAssistant = end($assistantMessages);
                    if (isset($lastAssistant['content'])) {
                        foreach ($lastAssistant['content'] as $content) {
                            if ($content['type'] === 'text') {
                                return $content['text'];
                            }
                        }
                    }
                }

                // fallback: إذا كان plain text
                if (isset($decoded[0]) && is_string($decoded[0])) {
                    return $decoded[0];
                }
            }

            // إذا كان الرد string مباشرة
            if (is_string($decoded)) {
                return $decoded;
            }

            return $lastData;
        } catch (\Exception $e) {
            Log::warning('Chatbot SSE parse error', ['raw' => $lastData]);
            return $lastData; // إرجاع الـ raw data
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
     * استدعاء Hugging Face Gradio API مباشرة
     * يُستخدم من sendMessage ومن ProcessChatbotMessageJob
     */
    public function callHuggingFace(string $botType, string $message, array $chatHistory = []): string
    {
        $baseUrl = $this->getBaseUrl($botType);
        $postUrl = $baseUrl . $this->apiPath . $this->chatEndpoint;

        $headers = ['Content-Type' => 'application/json'];
        if ($this->hfToken) {
            $headers['Authorization'] = 'Bearer ' . $this->hfToken;
        }

        // الخطوة 1: POST → event_id
        $postResponse = Http::withHeaders($headers)
            ->timeout($this->timeout)
            ->post($postUrl, [
                'data' => [$message, $this->formatChatHistory($chatHistory)]
            ]);

        if (!$postResponse->successful()) {
            throw new \RuntimeException('Gradio POST failed: ' . $postResponse->status());
        }

        $eventId = $postResponse->json('event_id');
        if (!$eventId) {
            throw new \RuntimeException('No event_id received from Gradio');
        }

        // الخطوة 2: GET → SSE response
        $getResponse = Http::withHeaders($headers)
            ->timeout($this->timeout)
            ->get($postUrl . '/' . $eventId);

        if (!$getResponse->successful()) {
            throw new \RuntimeException('Gradio GET failed: ' . $getResponse->status());
        }

        return $this->parseSSEResponse($getResponse->body());
    }

    /**
     * تحديد نوع البوت بناءً على life_stage_id
     */
    public static function getBotTypeFromStage(?int $lifeStageId): string
    {
        if (!$lifeStageId) return 'public';
        return config("chatbot.stage_mapping.{$lifeStageId}", 'public');
    }
}
```

### 5.2 الـ Form Request: `app/Http/Requests/Patient/SendChatMessageRequest.php`

```php
<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\BaseRequest;

class SendChatMessageRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'max:' . config('chatbot.limits.max_message_length', 1000),
            ],
            'session_id' => 'nullable|string|max:100',
            'bot_type' => 'nullable|in:public,pre_marriage,pregnancy,motherhood',
        ];
    }

    public function messages(): array
    {
        return [
            'message.required' => 'الرسالة مطلوبة',
            'message.max' => 'الرسالة طويلة جداً، الحد الأقصى ' . config('chatbot.limits.max_message_length') . ' حرف',
        ];
    }
}
```

### 5.3 الـ Resource: `app/Http/Resources/Patient/ChatMessageResource.php`

```php
<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'message' => $this->message,
            'bot_type' => $this->bot_type,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

### 5.4 الـ Controller: `app/Http/Controllers/Api/Patient/ChatbotController.php`

```php
<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\SendChatMessageRequest;
use App\Http\Resources\Patient\ChatMessageResource;
use App\Models\AiChatMessage;
use App\Services\ChatbotService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChatbotController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ChatbotService $chatbotService
    ) {}

    /**
     * إرسال رسالة للشات بوت العام (للزوار - بدون تسجيل)
     * POST /api/v1/chatbot/public/message
     */
    public function sendPublicMessage(SendChatMessageRequest $request): JsonResponse
    {
        $message = $request->validated()['message'];

        // الشات العام لا يحفظ في الداتابيز ولا يرسل history
        $result = $this->chatbotService->sendMessage('public', $message, []);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        return $this->successResponse([
            'reply' => $result['message'],
            'bot_type' => 'public',
        ], 'Message sent successfully');
    }

    /**
     * إرسال رسالة للشات بوت (للمستخدمات المسجلات)
     * POST /api/v1/patient/chatbot/message
     */
    public function sendMessage(SendChatMessageRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $message = $validated['message'];

        // تحديد نوع البوت: من الطلب أو من مرحلة المستخدمة
        $botType = $validated['bot_type']
            ?? ChatbotService::getBotTypeFromStage($user->life_stage_id);

        // تحديد الجلسة: استخدام الموجودة أو إنشاء جديدة
        $sessionId = $validated['session_id']
            ?? $this->getOrCreateSession($user->id, $botType);

        // جلب آخر N رسالة كـ context
        $maxHistory = config('chatbot.limits.max_history_messages', 20);
        $previousMessages = AiChatMessage::where('user_id', $user->id)
            ->forSession($sessionId)
            ->latest()
            ->take($maxHistory)
            ->get()
            ->sortBy('created_at')
            ->values()
            ->map(fn($m) => ['role' => $m->role, 'message' => $m->message])
            ->toArray();

        // حفظ رسالة المستخدم
        $userMessage = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'bot_type' => $botType,
            'role' => 'user',
            'message' => $message,
            'metadata' => ['bot_type' => $botType],
        ]);

        // إرسال للبوت مع السياق
        $result = $this->chatbotService->sendMessage($botType, $message, $previousMessages);

        if (!$result['success']) {
            // حذف رسالة المستخدم إذا فشل الإرسال
            $userMessage->delete();
            return $this->errorResponse($result['error'], 503);
        }

        // حفظ رد البوت
        $botMessage = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'bot_type' => $botType,
            'role' => 'assistant',
            'message' => $result['message'],
            'metadata' => ['bot_type' => $botType],
        ]);

        return $this->successResponse([
            'reply' => $result['message'],
            'session_id' => $sessionId,
            'bot_type' => $botType,
            'user_message' => new ChatMessageResource($userMessage),
            'bot_message' => new ChatMessageResource($botMessage),
        ], 'Message sent successfully');
    }

    /**
     * جلب جلسات المحادثة
     * GET /api/v1/patient/chatbot/sessions
     */
    public function getSessions(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessions = AiChatMessage::where('user_id', $user->id)
            ->selectRaw('session_id, bot_type, MIN(created_at) as started_at, MAX(created_at) as last_message_at, COUNT(*) as messages_count')
            ->groupBy('session_id', 'bot_type')
            ->orderByDesc('last_message_at')
            ->get();

        return $this->successResponse($sessions, 'Sessions retrieved');
    }

    /**
     * جلب رسائل جلسة محددة
     * GET /api/v1/patient/chatbot/sessions/{sessionId}/messages
     */
    public function getMessages(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();

        $messages = AiChatMessage::where('user_id', $user->id)
            ->forSession($sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return $this->successResponse(
            ChatMessageResource::collection($messages),
            'Messages retrieved'
        );
    }

    /**
     * جلب إعدادات البوت (اسم، رسالة ترحيبية، أسئلة مقترحة)
     * GET /api/v1/patient/chatbot/config
     */
    public function getConfig(Request $request): JsonResponse
    {
        $user = $request->user();
        $botType = ChatbotService::getBotTypeFromStage($user->life_stage_id);
        $config = $this->chatbotService->getBotConfig($botType);

        return $this->successResponse([
            'bot_type' => $botType,
            'name' => $config['name'] ?? 'وداد',
            'welcome_message' => $config['welcome_message'] ?? 'أهلاً بكِ!',
            'suggested_questions' => $config['suggested_questions'] ?? [],
        ], 'Config retrieved');
    }

    /**
     * مسح محادثة (إعادة تعيين)
     * POST /api/v1/patient/chatbot/sessions/{sessionId}/reset
     */
    public function resetSession(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();

        // حذف الرسائل من الداتابيز
        $deleted = AiChatMessage::where('user_id', $user->id)
            ->forSession($sessionId)
            ->delete();

        // إعادة تعيين على Gradio (اختياري)
        $botType = ChatbotService::getBotTypeFromStage($user->life_stage_id);
        $this->chatbotService->resetChat($botType);

        return $this->successResponse([
            'deleted_count' => $deleted,
        ], 'Chat session reset successfully');
    }

    /**
     * إنشاء أو جلب session_id
     */
    private function getOrCreateSession(int $userId, string $botType): string
    {
        // البحث عن آخر جلسة نشطة (آخر رسالة خلال ساعة)
        $recentSession = AiChatMessage::where('user_id', $userId)
            ->forBot($botType)
            ->where('created_at', '>=', now()->subHour())
            ->orderByDesc('created_at')
            ->value('session_id');

        return $recentSession ?? ($botType . '_' . Str::uuid()->toString());
    }

    /**
     * حذف كل محادثات المستخدم (Right to Erasure - القسم 12.2)
     * DELETE /api/v1/patient/chatbot/messages
     */
    public function deleteAllMessages(Request $request): JsonResponse
    {
        $user = $request->user();

        $deleted = AiChatMessage::where('user_id', $user->id)->delete();

        Log::info('chatbot_data_erasure', [
            'user_id'       => $user->id,
            'deleted_count' => $deleted,
            'requested_at'  => now()->toISOString(),
        ]);

        return $this->successResponse([
            'deleted_count' => $deleted,
        ], 'تم حذف جميع المحادثات بنجاح');
    }
}
```

### 5.5 الـ Routes

#### في `routes/public.php` (للزوار):

```php
use App\Http\Controllers\Api\Patient\ChatbotController;

// ضمن المسارات العامة:
Route::post('chatbot/public/message', [ChatbotController::class, 'sendPublicMessage'])
    ->middleware('throttle:chatbot_public');
Route::get('chatbot/messages/{messageId}/status', [ChatbotController::class, 'guestMessageStatus']);
```

#### في `routes/patient.php` (للمستخدمات المسجلات):

```php
use App\Http\Controllers\Api\Patient\ChatbotController;

// ضمن مجموعة الـ authenticated routes:
Route::prefix('chatbot')->controller(ChatbotController::class)->group(function () {
    Route::post('/message', 'sendMessage')->middleware('throttle:chatbot_auth');
    Route::get('/config', 'getConfig');
    Route::get('/sessions', 'getSessions');
    Route::get('/sessions/{sessionId}/messages', 'getMessages');
    Route::post('/sessions/{sessionId}/reset', 'resetSession');
    Route::get('/messages/{messageId}/status', 'messageStatus');  // Polling
    Route::delete('/messages', 'deleteAllMessages');               // Right to Erasure §12.2
});
```

### 5.6 Rate Limiting (في `app/Providers/AppServiceProvider.php`)

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// في دالة boot():
RateLimiter::for('chatbot_public', function ($request) {
    return Limit::perMinute(config('chatbot.limits.public_rate_per_minute', 10))
        ->by($request->ip());
});

RateLimiter::for('chatbot_auth', function ($request) {
    return Limit::perMinute(config('chatbot.limits.auth_rate_per_minute', 30))
        ->by($request->user()?->id ?: $request->ip());
});
```

---

## 6. الفرونت إند - الكود الكامل

### 6.1 الـ Types: `src/types/chatbot.ts`

```typescript
export type BotType = "public" | "pre_marriage" | "pregnancy" | "motherhood";

export interface ChatMessage {
  id: number | string;
  role: "user" | "assistant";
  message: string;
  bot_type: BotType;
  created_at: string;
  isLoading?: boolean; // للرسائل التي يتم تحميلها
}

export interface ChatSession {
  session_id: string;
  bot_type: BotType;
  started_at: string;
  last_message_at: string;
  messages_count: number;
}

export interface ChatConfig {
  bot_type: BotType;
  name: string;
  welcome_message: string;
  suggested_questions: string[];
}

export interface SendMessagePayload {
  message: string;
  session_id?: string;
  bot_type?: BotType;
}

export interface SendMessageResponse {
  reply: string;
  session_id: string;
  bot_type: BotType;
  user_message: ChatMessage;
  bot_message: ChatMessage;
}

export interface PublicMessageResponse {
  reply: string;
  bot_type: "public";
}
```

### 6.2 الـ Service: `src/services/chatbotService.ts`

```typescript
import api from "./api";
import type {
  ChatConfig,
  ChatMessage,
  ChatSession,
  SendMessagePayload,
  SendMessageResponse,
  PublicMessageResponse,
} from "@/types/chatbot";

export const chatbotService = {
  /**
   * إرسال رسالة للبوت العام (بدون تسجيل دخول)
   */
  sendPublicMessage: async (
    message: string,
  ): Promise<PublicMessageResponse> => {
    const response = await api.post("/chatbot/public/message", { message });
    return response.data.data;
  },

  /**
   * إرسال رسالة للبوت (مسجلة دخول)
   */
  sendMessage: async (
    payload: SendMessagePayload,
  ): Promise<SendMessageResponse> => {
    const response = await api.post("/patient/chatbot/message", payload);
    return response.data.data;
  },

  /**
   * جلب إعدادات البوت
   */
  getConfig: async (): Promise<ChatConfig> => {
    const response = await api.get("/patient/chatbot/config");
    return response.data.data;
  },

  /**
   * جلب الجلسات
   */
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get("/patient/chatbot/sessions");
    return response.data.data;
  },

  /**
   * جلب رسائل جلسة محددة
   */
  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(
      `/patient/chatbot/sessions/${sessionId}/messages`,
    );
    return response.data.data;
  },

  /**
   * مسح جلسة
   */
  resetSession: async (sessionId: string): Promise<void> => {
    await api.post(`/patient/chatbot/sessions/${sessionId}/reset`);
  },

  /**
   * استعلام حالة رسالة (Polling) - القسم 15
   */
  getMessageStatus: async (messageId: number) => {
    const response = await api.get(
      `/patient/chatbot/messages/${messageId}/status`,
    );
    return response.data;
  },

  /**
   * حذف كل المحادثات (Right to Erasure) - القسم 12
   */
  deleteAllMessages: async (): Promise<void> => {
    await api.delete("/patient/chatbot/messages");
  },
};
```

### 6.3 الـ Hook: `src/hooks/useChatbot.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatbotService } from "@/services/chatbotService";
import type { BotType, ChatMessage, SendMessagePayload } from "@/types/chatbot";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Public chatbot hook (للزوار)
 */
export function usePublicChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // استرداد الرسائل من sessionStorage
  useState(() => {
    const saved = sessionStorage.getItem("public_chat_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  });

  const sendMessage = useCallback(async (text: string) => {
    // إضافة رسالة المستخدم فوراً
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      message: text,
      bot_type: "public",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      sessionStorage.setItem("public_chat_messages", JSON.stringify(updated));
      return updated;
    });

    setIsLoading(true);

    try {
      const response = await chatbotService.sendPublicMessage(text);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: "assistant",
        message: response.reply,
        bot_type: "public",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        sessionStorage.setItem("public_chat_messages", JSON.stringify(updated));
        return updated;
      });
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        message: "عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.",
        bot_type: "public",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem("public_chat_messages");
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}

/**
 * Authenticated chatbot hook (للمستخدمات المسجلات)
 */
export function useAuthChatbot() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // جلب إعدادات البوت
  const configQuery = useQuery({
    queryKey: ["chatbot", "config"],
    queryFn: chatbotService.getConfig,
    staleTime: 5 * 60 * 1000, // 5 دقائق
    enabled: !!user,
  });

  // جلب الجلسات
  const sessionsQuery = useQuery({
    queryKey: ["chatbot", "sessions"],
    queryFn: chatbotService.getSessions,
    enabled: !!user,
  });

  // جلب رسائل جلسة حالية
  const messagesQuery = useQuery({
    queryKey: ["chatbot", "messages", sessionId],
    queryFn: () => chatbotService.getSessionMessages(sessionId!),
    enabled: !!sessionId,
  });

  // TanStack Query v5: استبدال onSuccess بـ useEffect
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  // إرسال رسالة
  const sendMutation = useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      chatbotService.sendMessage(payload),
    onMutate: async (payload) => {
      // Optimistic update: إضافة رسالة المستخدم فوراً
      const tempUserMsg: ChatMessage = {
        id: `temp_${Date.now()}`,
        role: "user",
        message: payload.message,
        bot_type: configQuery.data?.bot_type || "public",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
    },
    onSuccess: (data) => {
      setSessionId(data.session_id);
      // استبدال الرسائل المؤقتة بالحقيقية
      setMessages((prev) => {
        const filtered = prev.filter((m) => !String(m.id).startsWith("temp_"));
        return [...filtered, data.user_message, data.bot_message];
      });
      // تحديث الكاش
      queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions"] });
    },
    onError: () => {
      // إضافة رسالة خطأ
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        message: "عذراً، حدث خطأ. حاولي مرة أخرى.",
        bot_type: configQuery.data?.bot_type || "public",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  // مسح المحادثة
  const resetMutation = useMutation({
    mutationFn: () => chatbotService.resetSession(sessionId!),
    onSuccess: () => {
      setMessages([]);
      setSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions"] });
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      sendMutation.mutate({
        message: text,
        session_id: sessionId || undefined,
        bot_type: configQuery.data?.bot_type,
      });
    },
    [sessionId, configQuery.data?.bot_type, sendMutation],
  );

  const loadSession = useCallback((sid: string) => {
    setSessionId(sid);
  }, []);

  return {
    messages,
    isLoading: sendMutation.isPending,
    config: configQuery.data,
    sessions: sessionsQuery.data,
    sendMessage,
    resetChat: () => sessionId && resetMutation.mutate(),
    loadSession,
    isConfigLoading: configQuery.isLoading,
  };
}
```

### 6.4 المكونات (Components)

#### `src/components/chatbot/ChatWidget.tsx` (الزر العائم + النافذة)

```tsx
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWindow } from "./ChatWindow";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="fixed bottom-6 left-6 z-50" dir="rtl">
      {/* نافذة الشات */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-16 left-0 mb-2"
          >
            <ChatWindow
              isAuthenticated={!!user}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* الزر العائم */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
          "bg-gradient-to-r from-pink-500 to-purple-600 text-white",
          "hover:shadow-xl transition-shadow",
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90 }}
              animate={{ rotate: 0 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
```

#### `src/components/chatbot/ChatWindow.tsx` (النافذة الرئيسية)

```tsx
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { usePublicChatbot, useAuthChatbot } from "@/hooks/useChatbot";

interface ChatWindowProps {
  isAuthenticated: boolean;
  onClose: () => void;
}

export function ChatWindow({ isAuthenticated, onClose }: ChatWindowProps) {
  // اختيار الـ Hook المناسب حسب حالة التسجيل
  const publicChat = usePublicChatbot();
  const authChat = useAuthChatbot();
  const chat = isAuthenticated ? authChat : publicChat;

  const config = isAuthenticated
    ? authChat.config
    : {
        bot_type: "public" as const,
        name: "وداد - المساعد العام",
        welcome_message: "أهلاً بك في منصة وداد! كيف يمكنني مساعدتك اليوم؟",
        suggested_questions: [
          "ما هي منصة وداد؟",
          "ما هي الخدمات المتاحة؟",
          "كيف أسجل في المنصة؟",
        ],
      };

  const hasMessages = chat.messages.length > 0;

  return (
    <div
      className="w-[380px] h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
      dir="rtl"
    >
      {/* الهيدر */}
      <ChatHeader
        name={config?.name || "وداد"}
        botType={config?.bot_type || "public"}
        onClose={onClose}
        onReset={"resetChat" in chat ? chat.resetChat : chat.clearChat}
      />

      {/* الرسائل */}
      <div className="flex-1 overflow-hidden">
        {!hasMessages && config ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              {config.welcome_message}
            </p>
            <SuggestedQuestions
              questions={config.suggested_questions}
              onSelect={chat.sendMessage}
            />
          </div>
        ) : (
          <MessageList messages={chat.messages} isLoading={chat.isLoading} />
        )}
      </div>

      {/* مربع الإدخال */}
      <MessageInput onSend={chat.sendMessage} disabled={chat.isLoading} />
    </div>
  );
}
```

#### `src/components/chatbot/ChatHeader.tsx`

```tsx
import { X, RotateCcw, Bot } from "lucide-react";
import type { BotType } from "@/types/chatbot";

interface ChatHeaderProps {
  name: string;
  botType: BotType;
  onClose: () => void;
  onReset: () => void;
}

const botColors: Record<BotType, string> = {
  public: "from-pink-500 to-purple-600",
  pre_marriage: "from-rose-400 to-pink-500",
  pregnancy: "from-purple-400 to-indigo-500",
  motherhood: "from-teal-400 to-emerald-500",
};

export function ChatHeader({
  name,
  botType,
  onClose,
  onReset,
}: ChatHeaderProps) {
  return (
    <div
      className={`bg-gradient-to-r ${botColors[botType]} p-4 text-white flex items-center gap-3`}
    >
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <Bot className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">{name}</h3>
        <p className="text-xs text-white/80">متصل الآن</p>
      </div>
      <button
        onClick={onReset}
        className="p-1.5 hover:bg-white/20 rounded-full transition"
        title="مسح المحادثة"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-white/20 rounded-full transition"
        title="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

#### `src/components/chatbot/MessageList.tsx`

```tsx
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "@/types/chatbot";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3 scrollbar-thin">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
```

#### `src/components/chatbot/MessageBubble.tsx`

```tsx
import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chatbot";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* الأيقونة */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
          isUser
            ? "bg-pink-100 text-pink-600"
            : "bg-purple-100 text-purple-600",
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* الفقاعة */}
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-pink-500 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm",
        )}
      >
        {/* دعم الروابط والـ newlines */}
        {message.message.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1" : ""}>
            {line}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
```

#### `src/components/chatbot/TypingIndicator.tsx`

```tsx
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### `src/components/chatbot/MessageInput.tsx`

```tsx
import { useState, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اكتبي رسالتك هنا..."
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600",
          "bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-pink-500",
          "placeholder:text-gray-400 max-h-24",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        style={{ direction: "rtl" }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
          text.trim() && !disabled
            ? "bg-pink-500 text-white hover:bg-pink-600 shadow-md"
            : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed",
        )}
      >
        <Send className="w-4 h-4 rotate-180" />
      </button>
    </div>
  );
}
```

#### `src/components/chatbot/SuggestedQuestions.tsx`

```tsx
import { motion } from "framer-motion";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({
  questions,
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {questions.map((q, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onSelect(q)}
          className="text-xs px-3 py-2 rounded-full border border-pink-300 text-pink-600
                     hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
        >
          {q}
        </motion.button>
      ))}
    </div>
  );
}
```

### 6.5 إضافة الـ Widget في الـ Layout

في ملف الـ Layout الرئيسي (مثلاً `App.tsx` أو layout component):

```tsx
import { ChatWidget } from "@/components/chatbot/ChatWidget";

// داخل الـ return:
<>
  {/* ... باقي المحتوى */}
  <ChatWidget />
</>;
```

---

## 7. آلية العمل وتدفق البيانات

### 7.1 للزوار (غير مسجلين)

```
[المستخدم يكتب رسالة]
        │
        ▼
[الفرونت إند]
├── إضافة رسالة المستخدم للـ UI فوراً
├── حفظ في sessionStorage
├── إظهار مؤشر الكتابة
├── POST /api/v1/chatbot/public/message
│         │
│         ▼
│   [الباك إند - Laravel]
│   ├── Validation (SendChatMessageRequest)
│   ├── Rate Limit Check (10/minute per IP)
│   ├── POST → Gradio API /chatbot_fn → EVENT_ID
│   ├── GET  → Gradio API /chatbot_fn/{EVENT_ID} → SSE Response
│   ├── Parse SSE → استخراج رد البوت
│   └── Return JSON { reply, bot_type }
│         │
│         ▼
├── إضافة رد البوت للـ UI
├── حفظ في sessionStorage
└── إخفاء مؤشر الكتابة
```

### 7.2 للمستخدمات المسجلات

```
[المستخدمة تكتب رسالة]
        │
        ▼
[الفرونت إند]
├── Optimistic Update (إضافة رسالة مؤقتة)
├── إظهار مؤشر الكتابة
├── POST /api/v1/patient/chatbot/message (مع Bearer Token)
│     Body: { message, session_id?, bot_type? }
│         │
│         ▼
│   [الباك إند - Laravel]
│   ├── Auth Check (Sanctum)
│   ├── Validation (SendChatMessageRequest)
│   ├── Rate Limit Check (30/minute per user)
│   ├── تحديد bot_type من life_stage_id (إذا لم يُرسل)
│   ├── جلب/إنشاء session_id
│   ├── جلب آخر 20 رسالة كـ context
│   ├── حفظ رسالة المستخدم في ai_chat_messages
│   ├── POST → Gradio API /chatbot_fn → EVENT_ID
│   ├── GET  → Gradio API /chatbot_fn/{EVENT_ID} → SSE Response
│   ├── Parse SSE → استخراج رد البوت
│   ├── حفظ رد البوت في ai_chat_messages
│   └── Return JSON { reply, session_id, bot_type, user_message, bot_message }
│         │
│         ▼
├── استبدال الرسالة المؤقتة بالحقيقية
├── تحديث session_id
└── إخفاء مؤشر الكتابة
```

---

## 8. الأمان وحدود الاستخدام

### 8.1 Rate Limiting

| النوع    | الحد           | التعريف     |
| -------- | -------------- | ----------- |
| الزوار   | 10 رسائل/دقيقة | حسب IP      |
| المسجلات | 30 رسالة/دقيقة | حسب User ID |

### 8.2 حماية المحتوى

- **Input Sanitization:** التحقق من طول الرسالة (max 1000 حرف).
- **XSS Protection:** الفرونت إند يعرض النصوص كـ text وليس HTML.
- **API Key Protection:** مفتاح Hugging Face محفوظ في الباك إند فقط.
- **PII Redaction Before Send:** إخفاء البيانات الحساسة قبل الإرسال إلى مزود الذكاء الاصطناعي (Email، Phone، National ID، أسماء كاملة).

مثال وظيفة تنقية في الباك إند قبل استدعاء Gradio:

```php
private function sanitizeForExternalAi(string $text): string
{
  $patterns = [
    '/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i' => '[REDACTED_EMAIL]',
    '/\b(?:\+?2)?01[0-9]{9}\b/' => '[REDACTED_PHONE]',
    '/\b\d{14}\b/' => '[REDACTED_NATIONAL_ID]',
  ];

  return preg_replace(array_keys($patterns), array_values($patterns), $text) ?? $text;
}
```

### 8.3 حدود الاشتراكات (مستقبلاً)

يمكن ربطها بنظام الاشتراكات الموجود:
| الباقة | الحد اليومي |
|--------|-------------|
| وداد الأساسية (مجاناً) | 10 رسائل/يوم |
| وداد بلس | 50 رسالة/يوم |
| وداد برو | غير محدود |
| وداد برو بلس | غير محدود |

---

## 9. معالجة الأخطاء

### 9.1 أخطاء الباك إند

| الحالة           | الكود | الرسالة                         |
| ---------------- | ----- | ------------------------------- |
| Gradio لا يستجيب | 503   | "المساعد الذكي غير متاح حالياً" |
| Timeout          | 503   | "انتهت مهلة الانتظار"           |
| Rate Limit       | 429   | "تم تجاوز حد الرسائل"           |
| خطأ في الإدخال   | 422   | "الرسالة مطلوبة"                |
| غير مصرح         | 401   | "يجب تسجيل الدخول"              |

### 9.2 أخطاء الفرونت إند

- عرض رسالة خطأ داخل الشات (كفقاعة رسالة).
- زر "إعادة المحاولة" لآخر رسالة فاشلة.
- Timeout notification بعد 30 ثانية.

---

## 10. خطة التنفيذ المرحلية

### المرحلة 1: البنية التحتية (Backend) ⏱️ ~2 ساعات

- [ ] 1.1 إنشاء `config/chatbot.php`
- [ ] 1.2 إضافة متغيرات `.env`
- [ ] 1.3 إنشاء migration لإضافة `bot_type`
- [ ] 1.4 تحديث `AiChatMessage` model
- [ ] 1.5 إنشاء `ChatbotService`
- [ ] 1.6 إنشاء `SendChatMessageRequest`
- [ ] 1.7 إنشاء `ChatMessageResource`
- [ ] 1.8 إنشاء `ChatbotController`
- [ ] 1.9 إضافة Routes في `patient.php` و `public.php`
- [ ] 1.10 إضافة Rate Limiters
- [ ] 1.11 اختبار مع Postman/Thunder Client

### المرحلة 2: الفرونت إند (Frontend) ⏱️ ~3 ساعات

- [ ] 2.1 إنشاء `types/chatbot.ts`
- [ ] 2.2 إنشاء `services/chatbotService.ts`
- [ ] 2.3 إنشاء `hooks/useChatbot.ts`
- [ ] 2.4 بناء المكونات: `ChatWidget`, `ChatWindow`, `ChatHeader`
- [ ] 2.5 بناء المكونات: `MessageList`, `MessageBubble`, `TypingIndicator`
- [ ] 2.6 بناء المكونات: `MessageInput`, `SuggestedQuestions`
- [ ] 2.7 إضافة `ChatWidget` للـ Layout الرئيسي
- [ ] 2.8 اختبار الشات العام (بدون تسجيل)
- [ ] 2.9 اختبار الشات المخصص (مع تسجيل)

### المرحلة 3: التحسينات ⏱️ ~1 ساعة

- [ ] 3.1 دعم الـ Dark Mode
- [ ] 3.2 تحسين الـ Responsive على الموبايل
- [ ] 3.3 إضافة صوت notification عند وصول رد
- [ ] 3.4 دعم react-markdown إذا لزم الأمر

### المرحلة 4: الجودة والتشغيل الإنتاجي ⏱️ ~2 ساعات

- [ ] 4.1 إضافة Medical Disclaimer ثابت داخل واجهة الشات
- [ ] 4.2 إضافة Emergency Escalation Flow للحالات الحرجة
- [ ] 4.3 تنفيذ Retention Policy + Auto Cleanup Job
- [ ] 4.4 إنشاء Endpoint لحذف كل محادثات المستخدم (Right to Erasure)
- [ ] 4.5 إضافة Retry + Exponential Backoff + Circuit Breaker
- [ ] 4.6 إضافة Metrics و Logs و Alerts
- [ ] 4.7 إضافة Unit/Integration/E2E tests
- [ ] 4.8 تفعيل Feature Flag والإطلاق التدريجي (10% → 50% → 100%)

### المرحلة 5: الأداء والإدارة والوصول ⏱️ ~3 ساعات

- [ ] 5.1 تحويل `ChatbotController` لاستخدام Queue Jobs بدلاً من الاستدعاء المباشر
- [ ] 5.2 إنشاء `ProcessChatbotMessageJob` مع Retry و Backoff
- [ ] 5.3 إضافة Polling Endpoint `GET /chatbot/messages/{id}/status`
- [ ] 5.4 تحديث Frontend لاستخدام نمط Polling بعد الإرسال
- [ ] 5.5 إضافة Redis Cache لنتائج الأسئلة المتكررة
- [ ] 5.6 إنشاء `CacheableChatResponse` service layer
- [ ] 5.7 إنشاء Admin Routes والـ `AdminChatbotController`
- [ ] 5.8 بناء واجهة Admin Dashboard لعرض الإحصاءات والمحادثات
- [ ] 5.9 إضافة ARIA labels و keyboard navigation لمكونات الشات
- [ ] 5.10 اختبار إمكانية الوصول بأدوات مثل axe-core

### المرحلة 6: Real-time وتجربة المستخدم العربية ⏱️ ~2 ساعة

- [ ] 6.1 تثبيت وإعداد Laravel Reverb (`php artisan reverb:install`)
- [ ] 6.2 إنشاء `ChatbotResponseReady` Event وإرساله من داخل Job
- [ ] 6.3 إنشاء `ChatbotChannel` كـ PrivateChannel لكل مستخدمة
- [ ] 6.4 تثبيت Laravel Echo في Frontend واستبدال Polling بـ WebSocket
- [ ] 6.5 إضافة Fallback تلقائي لـ Polling عند فشل WebSocket
- [ ] 6.6 تطبيق `dir="rtl"` و `font-family` العربي على مكونات الشات
- [ ] 6.7 ضبط محاذاة الفقاعات (user يمين ← bot يسار)
- [ ] 6.8 اختبار Scroll وعرض النص على شاشات الموبايل

### الإجمالي المقدر: ~13 ساعة عمل

---

## 11. الحوكمة الطبية والتصعيد الآمن

### 11.1 Medical Disclaimer إلزامي

يظهر في أول رسالة وفي تذييل نافذة الشات:

- "المساعد الذكي يقدم معلومات عامة ولا يغني عن استشارة الطبيب."
- "في الحالات الطارئة اتصلي بالطوارئ فوراً أو توجهي لأقرب مستشفى."

### 11.2 Emergency Detection & Escalation

عند اكتشاف مؤشرات خطورة (نزيف شديد، ألم حاد مفاجئ، صعوبة تنفس، أفكار إيذاء النفس):

1. إيقاف الرد الإرشادي العادي.
2. إظهار رسالة طوارئ واضحة وفورية.
3. إظهار أزرار سريعة:
   - "احجزي استشارة عاجلة"
   - "اتصلي بالطوارئ"
   - "تواصلي مع الدعم"
4. تسجيل الحدث في logs كـ `risk_escalation_event`.

### 11.3 سياسة المحتوى الطبي

- منع التشخيص الجازم أو وصف أدوية بجرعات.
- تقديم إرشاد عام + دعوة لزيارة طبيب عند الشك.
- إجبار البوت على صياغة "درجة اليقين" إذا كانت الإجابة غير مؤكدة.

---

## 12. الخصوصية والامتثال وإدارة البيانات

### 12.1 Data Retention Policy

- **المحادثات العامة (Guest):** Session Storage فقط + حذف عند إغلاق الجلسة.
- **المحادثات للمسجلات:** حفظ 90 يوم (قابلة للتعديل من Settings).
- إنشاء job يومي لحذف الرسائل المنتهية.

### 12.2 Right to Erasure (حذف البيانات)

إضافة Endpoint:

```http
DELETE /api/v1/patient/chatbot/messages
```

وظيفته:

- حذف كامل محادثات المستخدم من `ai_chat_messages`.
- توثيق العملية في audit log.

### 12.3 حماية البيانات الحساسة

- تنقية PII قبل الإرسال لمزود خارجي.
- منع حفظ أي secrets داخل `metadata`.
- تشفير أي حقول شديدة الحساسية إذا أضيفت مستقبلاً.

### 12.4 تتبع الموافقة (Consent)

- إظهار تنبيه "باستخدام الشات فأنتِ توافقين على سياسة الاستخدام والخصوصية".
- حفظ timestamp للموافقة في أول استخدام.

---

## 13. الاعتمادية والمراقبة التشغيلية

### 13.1 Reliability Patterns

- **Timeout:** حد أقصى 30 ثانية.
- **Retry:** محاولتان كحد أقصى عند فشل مؤقت (5xx / timeout).
- **Exponential Backoff:** 500ms ثم 1500ms.
- **Circuit Breaker:** إذا فشلت 5 طلبات متتالية خلال دقيقة، يتم إيقاف الاستدعاء الخارجي مؤقتاً 60 ثانية مع fallback message.

### 13.2 Fallback Strategy

عند تعطل مزود AI:

- إظهار رسالة افتراضية مهذبة.
- اقتراح إجراء بديل (حجز استشارة / دعم فني).
- تسجيل الحدث كـ `chatbot_provider_unavailable`.

### 13.3 Observability (Metrics + Logging)

المؤشرات الإلزامية:

- `chatbot_requests_total` (لكل bot_type)
- `chatbot_success_rate`
- `chatbot_timeout_rate`
- `chatbot_p95_latency_ms`
- `chatbot_avg_response_length`
- `chatbot_escalation_events_total`

السجلات (Structured Logs):

- `request_id`
- `user_id` (nullable)
- `bot_type`
- `session_id`
- `provider_status_code`
- `latency_ms`
- `error_type`

### 13.4 Alerts

- Alert إذا `timeout_rate > 10%` خلال 5 دقائق.
- Alert إذا `success_rate < 90%` خلال 10 دقائق.
- Alert إذا `p95_latency > 8s` لمدة 10 دقائق.

---

## 14. الاختبارات والإطلاق التدريجي

### 14.1 Test Strategy

- **Unit Tests (Backend):**
  - `ChatbotService::parseSSEResponse`
  - `sanitizeForExternalAi`
  - `getBotTypeFromStageCode`
- **Feature Tests (Backend):**
  - `POST /chatbot/public/message`
  - `POST /patient/chatbot/message`
  - `POST /patient/chatbot/sessions/{id}/reset`
  - `DELETE /patient/chatbot/messages`
- **Frontend Tests:**
  - إرسال رسالة وظهور TypingIndicator
  - فشل الشبكة وإظهار fallback bubble
  - حفظ واستعادة رسائل guest من sessionStorage
- **Load Test:**
  - 100 مستخدم متزامن على البوت العام لمدة 10 دقائق

### 14.2 Feature Flag & Gradual Rollout

إضافة Feature Flags:

- `chatbot_enabled`
- `chatbot_public_enabled`
- `chatbot_stage_enabled`
- `chatbot_emergency_escalation_enabled`

خطة الإطلاق:

1. **Internal QA فقط** (0%)
2. **Canary**: 10% من الزوار/المستخدمات
3. **Beta**: 50%
4. **Full Rollout**: 100% بعد استقرار 72 ساعة

### 14.3 معايير النجاح (Go/No-Go)

- Success Rate ≥ 95%
- p95 Latency ≤ 6s
- CSAT ≥ 4.2/5
- Escalation false positives < 5%
- لا توجد incidents حرجة لمدة 7 أيام بعد الإطلاق الكامل

---

## 15. المعالجة غير المتزامنة عبر Queue

### 15.1 لماذا Async؟

الاستدعاء المباشر (Synchronous) لـ Hugging Face API يسبب:

- **خطر PHP Timeout:** PHP-FPM لديه حد 30 ثانية، وبوتات HF قد تستغرق 10-25 ثانية.
- **استهلاك Workers:** كل طلب يحتجز worker كامل طوال فترة الانتظار، مما يُقلل المستخدمين المتزامنين.
- **لا إعادة محاولة تلقائية:** إذا فشل الطلب، ضاع تماماً.

### 15.2 بنية Queue Job

```
المستخدم يرسل رسالة
        ↓
Laravel يحفظ رسالة المستخدم في DB فوراً
        ↓
Laravel يضع ProcessChatbotMessageJob في Redis Queue
        ↓
يُرجع للـ Frontend: { status: "processing", message_id: 123 } ← < 100ms
        ↓
Queue Worker (خلفية) يستدعي HF API بدون ضغط على الـ HTTP Workers
        ↓
عند الرد → يحفظ رد البوت في DB
        ↓
Frontend يعمل Polling كل 2 ثانية على endpoint الحالة
        ↓
عند وجود الرد → يعرضه للمستخدم
```

### 15.3 الملف الجديد: `app/Jobs/ProcessChatbotMessageJob.php`

```php
<?php

namespace App\Jobs;

use App\Models\AiChatMessage;
use App\Services\ChatbotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessChatbotMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;           // 3 محاولات تلقائية
    public int $timeout = 60;        // مستقل عن PHP timeout
    public array $backoff = [5, 15]; // انتظار 5 ثانية ثم 15 ثانية

    public function __construct(
        private readonly AiChatMessage $userMessage,
        private readonly string $botType,
        private readonly array $history,
    ) {}

    public function handle(ChatbotService $chatbotService): void
    {
        // تحديث الحالة إلى "processing"
        $this->userMessage->update(['metadata->status' => 'processing']);

        try {
            $reply = $chatbotService->callHuggingFace(
                botType: $this->botType,
                message: $this->userMessage->message,
                history: $this->history,
            );

            AiChatMessage::create([
                'user_id'    => $this->userMessage->user_id,
                'session_id' => $this->userMessage->session_id,
                'bot_type'   => $this->botType,
                'role'       => 'assistant',
                'message'    => $reply,
                'metadata'   => ['status' => 'ready', 'parent_id' => $this->userMessage->id],
            ]);

            $this->userMessage->update(['metadata->status' => 'replied']);

        } catch (\Throwable $e) {
            Log::error('chatbot_job_failed', [
                'message_id' => $this->userMessage->id,
                'bot_type'   => $this->botType,
                'error'      => $e->getMessage(),
                'attempt'    => $this->attempts(),
            ]);

            if ($this->attempts() >= $this->tries) {
                $this->userMessage->update(['metadata->status' => 'failed']);
            }

            throw $e; // تأكد من إعادة المحاولة التلقائية
        }
    }
}
```

### 15.4 Polling Endpoint

إضافة Route جديد:

```php
// routes/patient.php
Route::get('chatbot/messages/{messageId}/status', [ChatbotController::class, 'messageStatus']);

// routes/public.php
Route::get('chatbot/messages/{messageId}/status', [ChatbotController::class, 'guestMessageStatus']);
```

الـ Controller Method:

```php
public function messageStatus(int $messageId): JsonResponse
{
    $userMessage = AiChatMessage::findOrFail($messageId);
    $status = $userMessage->metadata['status'] ?? 'processing';

    if ($status === 'replied') {
        $reply = AiChatMessage::where('metadata->parent_id', $messageId)->first();
        return $this->successResponse([
            'status' => 'ready',
            'reply'  => $reply ? new ChatMessageResource($reply) : null,
        ]);
    }

    if ($status === 'failed') {
        return $this->successResponse(['status' => 'failed']);
    }

    return $this->successResponse(['status' => 'processing']);
}
```

### 15.5 تعديل Frontend للـ Polling

```typescript
// hooks/useChatbot.ts - بعد إرسال الرسالة
const pollForReply = (messageId: number) => {
  const maxAttempts = 30; // 30 × 2s = 60 ثانية حد أقصى
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      setError("انتهت مهلة الانتظار، يرجى المحاولة مرة أخرى.");
      return;
    }
    const { data } = await chatbotService.getMessageStatus(messageId);
    if (data.status === "ready") {
      clearInterval(interval);
      addBotMessage(data.reply);
      setIsTyping(false);
    } else if (data.status === "failed") {
      clearInterval(interval);
      setError("حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.");
      setIsTyping(false);
    }
  }, 2000);
};
```

### 15.6 إعداد Queue Worker

إضافة للـ `.env`:

```env
QUEUE_CONNECTION=redis
QUEUE_CHATBOT=chatbot  # queue مخصص للشات بوت
```

تشغيل الـ Worker:

```bash
# في الإنتاج (Supervisor)
php artisan queue:work redis --queue=chatbot --tries=3 --sleep=3
```

### 15.7 المقارنة بين الطريقتين

| الجانب               | Sync (الحالي) | Async Queue (المقترح) |
| -------------------- | ------------- | --------------------- |
| خطر Timeout          | عالي جداً     | معدوم                 |
| مستخدمون متزامنون    | محدود         | غير محدود تقريباً     |
| إعادة محاولة تلقائية | لا            | نعم (3 مرات)          |
| تعقيد التطبيق        | بسيط          | متوسط                 |
| متطلب إضافي          | لا شيء        | Redis (موجود)         |

---

## 16. Redis Caching للأسئلة المتكررة

### 16.1 الهدف

الأسئلة الشائعة مثل "ما هي منصة وداد؟" أو "ما هي الفحوصات قبل الزواج؟" تتكرر آلاف المرات يومياً. إرسالها في كل مرة لـ HF API يُسبب:

- تكلفة غير ضرورية (API calls)
- تأخير إضافي للمستخدمين

### 16.2 استراتيجية الـ Cache

```
المستخدم يرسل سؤالاً
        ↓
إنشاء Cache Key: hash(bot_type + normalize(message))
        ↓
هل الرد موجود في Redis؟
    نعم → إرجاع الرد فوراً (< 5ms) ✅
    لا  → إرسال لـ HF → حفظ الرد في Cache (TTL: 24h) → إرجاعه
```

### 16.3 إضافة Cache Layer في `ChatbotService::sendMessage()`

> **ملاحظة:** `sendMessage()` في القسم 5.1 يُرجع `array` (مع `success` و `error`). هنا نضيف الـ Cache **داخل** تلك الدالة دون تغيير توقيعها:

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

// داخل sendMessage() - قبل استدعاء callHuggingFace()
// أضف هذا الجزء في بداية try block:

$cacheConfig = config('chatbot.cache');
if (
    $cacheConfig['enabled']
    && strlen($message) <= $cacheConfig['max_message_length']
    && empty($chatHistory)
) {
    $cacheKey = 'chatbot:' . $botType . ':' . md5(Str::lower(trim($message)));
    $cachedReply = Cache::get($cacheKey);

    if ($cachedReply) {
        return [
            'success' => true,
            'message' => $cachedReply,
            'cached'  => true,
        ];
    }
}

// ... بعد استقبال الرد بنجاح من parseSSEResponse():
if (isset($cacheKey)) {
    Cache::put($cacheKey, $botReply, now()->addHours($cacheConfig['ttl_hours']));
}
```

### 16.4 Cache Invalidation

```php
// أمر artisan لتنظيف cache البوتات
// php artisan chatbot:clear-cache {bot_type?}
class ClearChatbotCacheCommand extends Command
{
    protected $signature = 'chatbot:clear-cache {bot_type?}';

    public function handle(): void
    {
        $botType = $this->argument('bot_type') ?? '*';
        $pattern = "chatbot:{$botType}:*";

        // مسح cache بالـ pattern
        $keys = Redis::keys($pattern);
        if (!empty($keys)) {
            Redis::del($keys);
        }

        $this->info("تم مسح cache البوت: {$botType}");
    }
}
```

### 16.5 إعدادات Cache في `config/chatbot.php`

```php
'cache' => [
    'enabled'            => env('CHATBOT_CACHE_ENABLED', true),
    'ttl_hours'          => (int) env('CHATBOT_CACHE_TTL_HOURS', 24),
    'max_message_length' => 150, // لا نُخزن الرسائل الطويلة
    'exclude_with_history' => true, // لا نُخزن ردوداً تعتمد على سياق
],
```

متغيرات إضافية في `.env`:

```env
CHATBOT_CACHE_ENABLED=true
CHATBOT_CACHE_TTL_HOURS=24
```

---

## 17. لوحة الإدارة والإشراف

### 17.1 نظرة عامة

تُمكّن المشرفين من:

- مراقبة إحصاءات الشات بوت في الوقت الفعلي.
- مراجعة المحادثات التي تُشير لمخاطر أو تصعيد.
- إدارة المحتوى المخالف أو البلاغات.
- تشغيل/إيقاف أي بوت فوراً.

### 17.2 Routes الإدارة

```php
// routes/admin.php - إضافة مجموعة جديدة
Route::prefix('chatbot')->name('chatbot.')->group(function () {
    Route::get('stats',               [AdminChatbotController::class, 'stats']);
    Route::get('conversations',       [AdminChatbotController::class, 'conversations']);
    Route::get('conversations/{id}',  [AdminChatbotController::class, 'showConversation']);
    Route::delete('conversations/{id}', [AdminChatbotController::class, 'deleteConversation']);
    Route::get('escalations',         [AdminChatbotController::class, 'escalations']);
    Route::post('bots/{type}/toggle', [AdminChatbotController::class, 'toggleBot']);
});
```

### 17.3 `AdminChatbotController` - الإحصاءات

```php
<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiChatMessage;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminChatbotController extends Controller
{
    use ApiResponse;

    public function stats(): JsonResponse
    {
        $stats = [
            'total_messages'       => AiChatMessage::count(),
            'messages_today'       => AiChatMessage::whereDate('created_at', today())->count(),
            'by_bot_type'          => AiChatMessage::select('bot_type', DB::raw('count(*) as count'))
                                        ->groupBy('bot_type')->pluck('count', 'bot_type'),
            'unique_users_today'   => AiChatMessage::whereDate('created_at', today())
                                        ->whereNotNull('user_id')->distinct('user_id')->count(),
            'avg_messages_per_session' => AiChatMessage::select('session_id', DB::raw('count(*) as cnt'))
                                        ->groupBy('session_id')
                                        ->get()->avg('cnt'),
            'escalations_today'    => AiChatMessage::whereDate('created_at', today())
                                        ->whereJsonContains('metadata->flags', 'emergency')->count(),
        ];

        return $this->successResponse($stats);
    }

    public function conversations(): JsonResponse
    {
        $conversations = AiChatMessage::select('session_id', 'bot_type', 'user_id',
                            DB::raw('count(*) as message_count'),
                            DB::raw('max(created_at) as last_message_at'))
            ->groupBy('session_id', 'bot_type', 'user_id')
            ->orderByDesc('last_message_at')
            ->paginate(20);

        return $this->successResponse($conversations);
    }

    public function toggleBot(string $botType): JsonResponse
    {
        $key = "chatbot_enabled_{$botType}";
        $current = cache($key, true);
        cache([$key => !$current], now()->addDay());

        return $this->successResponse([
            'bot_type' => $botType,
            'enabled'  => !$current,
            'message'  => !$current ? 'تم تفعيل البوت' : 'تم إيقاف البوت',
        ]);
    }
}
```

### 17.4 Frontend - Admin Dashboard Widget

بطاقات الإحصاءات التي يجب على لوحة الأدمن عرضها:

| المؤشر               | التوضيح                               |
| -------------------- | ------------------------------------- |
| إجمالي الرسائل اليوم | عدد كل الرسائل المرسلة والمستقبَلة    |
| المستخدمات النشطات   | عدد المستخدمات الفريدات اليوم         |
| توزيع البوتات        | نسبة الاستخدام لكل bot_type           |
| حوادث التصعيد        | عدد المحادثات التي رُصدت كحالات طارئة |
| معدل فشل الـ Queue   | Job failure rate خلال آخر ساعة        |
| حالة كل بوت          | 🟢 / 🔴 + زر تبديل لكل بوت            |

### 17.5 Moderation: المحادثات المُصعَّدة

```php
// استعلام لجلب المحادثات التي تحتاج مراجعة
public function escalations(): JsonResponse
{
    $flagged = AiChatMessage::with('user:id,name,email')
        ->whereJsonContains('metadata->flags', 'emergency')
        ->orWhereJsonContains('metadata->flags', 'risk')
        ->orderByDesc('created_at')
        ->paginate(15);

    return $this->successResponse($flagged);
}
```

---

## 18. إمكانية الوصول (Accessibility A11y)

### 18.1 معايير WCAG 2.1 المستهدفة (Level AA)

| المعيار                    | التطبيق في الشات                              |
| -------------------------- | --------------------------------------------- |
| 1.1.1 Non-text Content     | `alt` لكل أيقونة، ARIA label للأزرار          |
| 1.3.1 Info & Relationships | استخدام `<section>`, `<article>`, roles صحيحة |
| 1.4.3 Contrast             | نسبة تباين 4.5:1 على الأقل للنصوص             |
| 2.1.1 Keyboard             | كل التفاعلات متاحة بالـ keyboard فقط          |
| 2.4.3 Focus Order          | ترتيب focus منطقي من أعلى لأسفل               |
| 4.1.2 Name, Role, Value    | كل عنصر تفاعلي له `aria-label` و `role`       |

### 18.2 تطبيق ARIA في مكونات الشات

```tsx
// ChatWindow.tsx
<section
  role="dialog"
  aria-modal="true"
  aria-label={`محادثة مع ${botConfig.name}`}
  aria-describedby="chat-disclaimer"
>
  <header aria-label="رأس نافذة المحادثة">
    <h2>{botConfig.name}</h2>
    <button aria-label="إغلاق المحادثة" onClick={onClose}>
      <X aria-hidden="true" />
    </button>
  </header>

  <div
    role="log"
    aria-live="polite"
    aria-label="سجل المحادثة"
    aria-atomic="false"
  >
    {messages.map((msg) => (
      <MessageBubble key={msg.id} message={msg} />
    ))}
  </div>

  <p id="chat-disclaimer" className="sr-only">
    هذا المساعد يقدم معلومات عامة ولا يغني عن استشارة الطبيب
  </p>
</section>
```

```tsx
// MessageBubble.tsx
<article
  aria-label={`${message.role === "user" ? "رسالتك" : "رد المساعد"}: ${message.content}`}
>
  {message.content}
  <time
    dateTime={message.created_at}
    aria-label={`بتاريخ ${formatDate(message.created_at)}`}
  >
    {formatTime(message.created_at)}
  </time>
</article>
```

```tsx
// MessageInput.tsx
<form onSubmit={handleSubmit} aria-label="نموذج إرسال رسالة">
  <label htmlFor="chat-input" className="sr-only">
    اكتبي رسالتك هنا
  </label>
  <textarea
    id="chat-input"
    aria-label="اكتبي رسالتك"
    aria-required="true"
    aria-describedby="char-counter"
    aria-disabled={isLoading}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }}
  />
  <span id="char-counter" aria-live="polite">
    {charCount}/1000
  </span>
  <button
    type="submit"
    aria-label={isLoading ? "جارٍ الإرسال..." : "إرسال الرسالة"}
    aria-busy={isLoading}
    disabled={isLoading}
  >
    <Send aria-hidden="true" />
  </button>
</form>
```

```tsx
// TypingIndicator.tsx
<div role="status" aria-live="polite" aria-label="المساعد يكتب الآن">
  <span className="sr-only">المساعد يكتب...</span>
  {/* animation dots */}
</div>
```

### 18.3 Keyboard Navigation

| المفتاح         | الوظيفة                          |
| --------------- | -------------------------------- |
| `Tab`           | الانتقال بين عناصر الشات         |
| `Shift + Tab`   | الرجوع للعنصر السابق             |
| `Enter`         | إرسال الرسالة أو فتح/إغلاق الشات |
| `Shift + Enter` | سطر جديد في مربع الإدخال         |
| `Escape`        | إغلاق نافذة الشات                |
| `Alt + C`       | فتح نافذة الشات (اختصار عالمي)   |

تطبيق `Escape`:

```tsx
// ChatWindow.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.altKey && e.key === "c") setIsOpen((prev) => !prev);
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [onClose]);

// إعادة Focus لزر فتح الشات عند الإغلاق
useEffect(() => {
  if (!isOpen) {
    document.getElementById("chat-toggle-btn")?.focus();
  }
}, [isOpen]);
```

### 18.4 أدوات الاختبار

```bash
# تثبيت axe-core للاختبار التلقائي
bun add -D @axe-core/react
```

```tsx
// في بيئة التطوير فقط
import { useAxe } from "@axe-core/react";
import React from "react";
import { createRoot } from "react-dom/client";

if (process.env.NODE_ENV !== "production") {
  useAxe(React, createRoot, 1000);
}
```

قائمة مراجعة A11y قبل الإطلاق:

- [ ] تشغيل axe-core بدون أي violations حرجة
- [ ] اختبار بـ keyboard فقط (بدون mouse)
- [ ] اختبار بـ screen reader (NVDA / VoiceOver)
- [ ] التحقق من نسب التباين اللوني
- [ ] اختبار على أحجام خط مختلفة (zoom 200%)

---

## 19. Real-time عبر Laravel Reverb (WebSocket)

### 19.1 لماذا Reverb بدلاً من Polling؟

| الجانب             | Polling (القسم 15)       | WebSocket Reverb                 |
| ------------------ | ------------------------ | -------------------------------- |
| طريقة استقبال الرد | كل 2 ثانية يسأل Frontend | الـ Server يدفع الرد فور جاهزيته |
| زمن الاستجابة      | 0-2 ثانية تأخير إضافي    | < 100ms بعد جاهزية الرد          |
| الضغط على السيرفر  | طلبات HTTP مستمرة        | اتصال مفتوح واحد فقط             |
| تعقيد الإعداد      | بسيط                     | متوسط                            |
| المتطلب            | لا شيء                   | Laravel Reverb (مجاني ومدمج)     |

> **التوصية:** استخدام Reverb مع **Fallback تلقائي** لـ Polling عند عدم توفر WebSocket.

### 19.2 التثبيت والإعداد

```bash
# في Back-end/
php artisan reverb:install
```

يُضيف تلقائياً في `.env`:

```env
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# للـ Frontend
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### 19.3 إنشاء Event: `ChatbotResponseReady`

```php
<?php
// app/Events/ChatbotResponseReady.php

namespace App\Events;

use App\Models\AiChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatbotResponseReady implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        private readonly AiChatMessage $replyMessage,
        private readonly ?int $userId,      // null لجلسات الـ Guest
        private readonly string $sessionId,
    ) {}

    public function broadcastOn(): array
    {
        // قناة خاصة لكل مستخدمة أو جلسة
        if ($this->userId) {
            return [new PrivateChannel("chatbot.user.{$this->userId}")];
        }
        return [new Channel("chatbot.guest.{$this->sessionId}")];
    }

    public function broadcastAs(): string
    {
        return 'response.ready';
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->replyMessage->id,
            'content'    => $this->replyMessage->message,
            'bot_type'   => $this->replyMessage->bot_type,
            'created_at' => $this->replyMessage->created_at->toISOString(),
        ];
    }
}
```

### 19.4 إرسال Event من داخل Job

```php
// app/Jobs/ProcessChatbotMessageJob.php - تعديل handle()
public function handle(ChatbotService $chatbotService): void
{
    $reply = $chatbotService->callHuggingFace(...);

    $replyMessage = AiChatMessage::create([
        'user_id'    => $this->userMessage->user_id,
        'session_id' => $this->userMessage->session_id,
        'bot_type'   => $this->botType,
        'role'       => 'assistant',
        'message'    => $reply,
        'metadata'   => ['status' => 'ready', 'parent_id' => $this->userMessage->id],
    ]);

    // إطلاق Event → يصل للـ Frontend فوراً عبر WebSocket
    ChatbotResponseReady::dispatch(
        replyMessage: $replyMessage,
        userId: $this->userMessage->user_id,
        sessionId: $this->userMessage->session_id,
    );

    $this->userMessage->update(['metadata->status' => 'replied']);
}
```

### 19.5 Channel Authorization

```php
// routes/channels.php
use App\Models\User;

Broadcast::channel('chatbot.user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId; // المستخدمة تسمع قناتها فقط
});
// قنوات Guest عامة (لا تحتاج authorization)
```

### 19.6 Frontend - استبدال Polling بـ Laravel Echo

```bash
# في Front-End/
bun add laravel-echo pusher-js
```

```typescript
// src/lib/echo.ts
import Echo from "laravel-echo";
import Pusher from "pusher-js";

(window as any).Pusher = Pusher;

export const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
  enabledTransports: ["ws", "wss"],
});
```

```typescript
// hooks/useChatbot.ts - استبدال pollForReply
const listenForReply = (sessionId: string, messageId: number) => {
  const channel = userId
    ? echo.private(`chatbot.user.${userId}`)
    : echo.channel(`chatbot.guest.${sessionId}`);

  // Timeout fallback: إذا لم يصل الرد خلال 35 ثانية → Polling
  const fallbackTimer = setTimeout(() => {
    channel.stopListening(".response.ready");
    pollForReply(messageId); // الـ Fallback
  }, 35_000);

  channel.listen(".response.ready", (data: ChatbotReplyEvent) => {
    if (data.message_id !== messageId) return; // تجاهل ردود جلسات أخرى
    clearTimeout(fallbackTimer);
    channel.stopListening(".response.ready");
    addBotMessage(data.content);
    setIsTyping(false);
  });
};
```

### 19.7 تشغيل Reverb Server

```bash
# في الإنتاج (مع Supervisor)
php artisan reverb:start --host=0.0.0.0 --port=8080

# في التطوير
php artisan reverb:start
```

### 19.8 إضافة لملف الهيكل في القسم 1.4

ملفات جديدة:

```
Back-end/
├── app/
│   └── Events/ChatbotResponseReady.php     ← جديد
├── routes/channels.php                      ← تعديل

Front-End/src/
└── lib/echo.ts                              ← جديد
```

---

## 20. دعم RTL والخطوط العربية

### 20.1 أهمية RTL في شات عربي

بدون دعم RTL صريح:

- فقاعات الرسائل قد تظهر بمحاذاة خاطئة (LTR)
- الأيقونات والأزرار قد تكون في الجهة الخاطئة
- النص العربي قد يُقطع بشكل غير صحيح في الأطراف
- علامات الترقيم تظهر في الطرف الخطأ

### 20.2 إعداد الـ Container الرئيسي

```tsx
// ChatWindow.tsx
<section
  dir="rtl"
  lang="ar"
  className="font-arabic flex flex-col"
  role="dialog"
  aria-modal="true"
>
  {/* ... */}
</section>
```

### 20.3 Tailwind CSS - تكوين RTL

```typescript
// tailwind.config.ts - التأكد من وجود RTL variant
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: [
          "Tajawal", // ← الأسرع والأوضح للنصوص الطبية
          "Cairo",
          "Noto Sans Arabic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [
    require("tailwindcss-rtl"), // ← دعم ps-*, pe-*, ms-*, me-*
  ],
} satisfies Config;
```

```bash
# تثبيت المكتبة وخط Tajawal
bun add tailwindcss-rtl
```

```html
<!-- index.html - تحميل الخط من Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
```

### 20.4 محاذاة فقاعات الرسائل

```tsx
// MessageBubble.tsx
const isUser = message.role === "user";

<article
  className={cn(
    "flex items-end gap-2 max-w-[85%]",
    isUser
      ? "self-start flex-row-reverse ms-auto" // ← رسائل المستخدمة: يمين
      : "self-start flex-row me-auto", // ← ردود البوت: يسار
  )}
>
  {/* Avatar */}
  <div
    className={cn(
      "w-8 h-8 rounded-full flex-shrink-0",
      isUser ? "bg-primary" : "bg-secondary",
    )}
  >
    {isUser ? <User size={16} /> : <Bot size={16} />}
  </div>

  {/* Bubble */}
  <div
    className={cn(
      "px-4 py-2 rounded-2xl text-sm leading-relaxed font-arabic",
      isUser
        ? "bg-primary text-white rounded-tr-sm" // ← شكل الفقاعة للمستخدمة
        : "bg-muted text-foreground rounded-tl-sm", // ← شكل الفقاعة للبوت
    )}
  >
    {message.content}
  </div>
</article>;
```

### 20.5 Scroll تلقائي بالعربي

```tsx
// MessageList.tsx
const bottomRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  // scrollIntoView يعمل بشكل صحيح مع RTL
  bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
}, [messages]);

<div
  role="log"
  dir="rtl"
  className="flex flex-col gap-3 overflow-y-auto p-4 font-arabic"
  aria-live="polite"
>
  {messages.map((msg) => (
    <MessageBubble key={msg.id} message={msg} />
  ))}
  <div ref={bottomRef} />
</div>;
```

### 20.6 نصوص واجهة الشات (i18n محلي)

```typescript
// constants/chatbot-strings.ts
export const CHATBOT_UI = {
  placeholder: "اكتبي رسالتك هنا...",
  send: "إرسال",
  sending: "جارٍ الإرسال...",
  typing: "وداد تكتب...",
  retry: "إعادة المحاولة",
  clear: "مسح المحادثة",
  export: "تصدير المحادثة",
  disclaimer: "المساعد الذكي يقدم معلومات عامة ولا يغني عن استشارة الطبيب.",
  errorGeneral: "حدث خطأ، يرجى المحاولة مرة أخرى.",
  errorTimeout: "انتهت مهلة الانتظار، يرجى المحاولة مرة أخرى.",
  charCount: (n: number) => `${n}/1000`,
  openChat: "فتح نافذة المحادثة",
  closeChat: "إغلاق نافذة المحادثة",
} as const;
```

### 20.7 اختبارات RTL

قائمة مراجعة قبل الإطلاق:

- [ ] فقاعات رسائل المستخدمة تظهر على اليمين
- [ ] ردود البوت تظهر على اليسار
- [ ] نص مربع الإدخال يبدأ من اليمين
- [ ] أيقونة الإرسال على اليسار (نهاية السطر في RTL)
- [ ] الأزرار السريعة (Suggested Questions) محاذاة يمين
- [ ] Scroll يعمل بشكل صحيح عند وصول رسائل جديدة
- [ ] الخط الطبي يظهر بوضوح على الأجهزة المحمولة
- [ ] لا يوجد نص مختلط (Arabic + قوسين إنجليزية) يُحدث اضطراباً في الاتجاه
