<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\SendChatMessageRequest;
use App\Http\Requests\Patient\UpdateChatbotPreferencesRequest;
use App\Http\Resources\Patient\ChatMessageResource;
use App\Http\Resources\Patient\ChatbotPreferenceResource;
use App\Jobs\ProcessChatbotMessageJob;
use App\Models\AiChatMessage;
use App\Models\PatientChatbotPreference;
use App\Services\ChatbotService;
use App\Services\Patient\PatientDataCollectorService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatbotController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ChatbotService $chatbotService,
        private PatientDataCollectorService $dataCollector,
    ) {
    }

    /**
     * إرسال رسالة للبوت عبر الـ Widget (موجّهة حسب مرحلة المستخدمة) - استجابة فورية
     * POST /api/v1/patient/chatbot/widget-message
     */
    public function sendWidgetMessage(SendChatMessageRequest $request): JsonResponse
    {
        $user = $request->user();
        $message = $request->validated()['message'];

        $botType = ChatbotService::getBotTypeFromStage($user->life_stage_id);

        // === Patient Context Injection ===
        $contextPrompt = null;
        if ($botType !== 'public' && config('chatbot.patient_context_enabled', false)) {
            $patientContext = $this->dataCollector->collectChatbotContext($user, $botType);
            if (!empty($patientContext)) {
                $rawPrompt = $this->dataCollector->buildContextualSystemPrompt($patientContext);
                $contextPrompt = $this->chatbotService->sanitizeForExternalAi($rawPrompt);
            }
        }
        
        // حقن السياق بدلاً من إضافته للتاريخ، ندمجه مع الرسالة الحالية
        $historyWithContext = [];
        $finalMessage = $message;
        if ($contextPrompt) {
            $finalMessage = $contextPrompt . "\n\nسؤال المريضة:\n" . $message;
        }

        $result = $this->chatbotService->sendMessage($botType, $finalMessage, $historyWithContext);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        return $this->successResponse([
            'reply' => $result['message'],
            'bot_type' => $botType,
            'cached' => $result['cached'] ?? false,
        ], 'Message sent successfully');
    }

    // ============================================
    // PUBLIC (Guests - No Auth)
    // ============================================

    /**
     * إرسال رسالة للشات بوت العام (للزوار - بدون تسجيل)
     * POST /api/v1/chatbot/public/message
     */
    public function sendPublicMessage(SendChatMessageRequest $request): JsonResponse
    {
        $message = $request->validated()['message'];

        $result = $this->chatbotService->sendMessage('public', $message, []);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], 503);
        }

        return $this->successResponse([
            'reply' => $result['message'],
            'bot_type' => 'public',
            'cached' => $result['cached'] ?? false,
        ], 'Message sent successfully');
    }

    // ============================================
    // PATIENT (Authenticated)
    // ============================================

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

        $forceNewSession = (bool) ($validated['force_new_session'] ?? false);

        // تحديد الجلسة: استخدام الموجودة أو إنشاء جديدة
        $sessionId = $forceNewSession
            ? ($botType . '_' . Str::uuid()->toString())
            : ($validated['session_id'] ?? $this->getOrCreateSession($user->id, $botType));

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

        // === Patient Context Injection ===
        $contextPrompt = null;
        if ($botType !== 'public' && config('chatbot.patient_context_enabled', false)) {
            $patientContext = $this->dataCollector->collectChatbotContext($user, $botType);

            if (!empty($patientContext)) {
                $rawPrompt = $this->dataCollector->buildContextualSystemPrompt($patientContext);
                $contextPrompt = $this->chatbotService->sanitizeForExternalAi($rawPrompt);

                // Audit Trail
                Log::info('chatbot_patient_context_sent', [
                    'user_id' => $user->id,
                    'bot_type' => $botType,
                    'context_keys' => array_keys($patientContext),
                ]);
            }
        }

        // حفظ رسالة المستخدم
        $userMessage = AiChatMessage::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'bot_type' => $botType,
            'role' => 'user',
            'message' => $message,
            'metadata' => ['bot_type' => $botType, 'status' => 'pending'],
        ]);

        // In local development, process immediately to avoid depending on queue workers.
        if (app()->environment('local') && config('chatbot.process_sync_in_local', true)) {
            try {
                $historyWithContext = $previousMessages;
                $finalMessage = $message;
                if ($contextPrompt) {
                    $finalMessage = $contextPrompt . "\n\nسؤال المريضة:\n" . $message;
                }

                $reply = $this->chatbotService->callHuggingFace($botType, $finalMessage, $historyWithContext);

                $botMessage = AiChatMessage::create([
                    'user_id' => $user->id,
                    'session_id' => $sessionId,
                    'bot_type' => $botType,
                    'role' => 'assistant',
                    'message' => $reply,
                    'metadata' => ['bot_type' => $botType, 'status' => 'ready', 'parent_id' => $userMessage->id],
                ]);

                $userMessage->update([
                    'metadata' => [
                        'bot_type' => $botType,
                        'status' => 'replied',
                        'reply_id' => $botMessage->id,
                    ],
                ]);

                return $this->successResponse([
                    'status' => 'processing',
                    'session_id' => $sessionId,
                    'bot_type' => $botType,
                    'message_id' => $userMessage->id,
                    'user_message' => new ChatMessageResource($userMessage),
                ], 'Message queued for processing');
            } catch (\Throwable $e) {
                $userMessage->update([
                    'metadata' => [
                        'bot_type' => $botType,
                        'status' => 'failed',
                    ],
                ]);

                return $this->errorResponse('حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.', 503);
            }
        }

        // === Async via Queue ===
        ProcessChatbotMessageJob::dispatch($userMessage, $botType, $previousMessages, $contextPrompt)
            ->onQueue('chatbot');

        return $this->successResponse([
            'status' => 'processing',
            'session_id' => $sessionId,
            'bot_type' => $botType,
            'message_id' => $userMessage->id,
            'user_message' => new ChatMessageResource($userMessage),
        ], 'Message queued for processing');
    }

    /**
     * استعلام حالة رسالة (Polling)
     * GET /api/v1/patient/chatbot/messages/{messageId}/status
     */
    public function messageStatus(Request $request, int $messageId): JsonResponse
    {
        $user = $request->user();
        $userMessage = AiChatMessage::where('user_id', $user->id)
            ->findOrFail($messageId);

        $status = $userMessage->metadata['status'] ?? 'processing';

        if ($status === 'replied') {
            $parentId = $userMessage->metadata['reply_id'] ?? null;
            $reply = $parentId ? AiChatMessage::find($parentId) : null;

            return $this->successResponse([
                'status' => $reply ? 'ready' : 'processing',
                'reply' => $reply ? new ChatMessageResource($reply) : null,
            ]);
        }

        if ($status === 'failed') {
            return $this->successResponse([
                'status' => 'failed',
                'message' => 'حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.',
            ]);
        }

        return $this->successResponse(['status' => 'processing']);
    }

    /**
     * استعلام حالة رسالة للزوار (Polling)
     * GET /api/v1/chatbot/messages/{messageId}/status
     */
    public function guestMessageStatus(Request $request, int $messageId): JsonResponse
    {
        $guestToken = $request->header('X-Guest-Session-Token')
            ?? $request->query('guest_token');

        if (!$guestToken) {
            return $this->errorResponse('Guest token is required', 422);
        }

        $userMessage = AiChatMessage::query()
            ->where('id', $messageId)
            ->where('bot_type', 'public')
            ->where('metadata->guest_session_token', $guestToken)
            ->firstOrFail();

        $status = $userMessage->metadata['status'] ?? 'processing';

        if ($status === 'replied') {
            $parentId = $userMessage->metadata['reply_id'] ?? null;
            $reply = $parentId ? AiChatMessage::find($parentId) : null;

            return $this->successResponse([
                'status' => $reply ? 'ready' : 'processing',
                'reply' => $reply ? new ChatMessageResource($reply) : null,
            ]);
        }

        if ($status === 'failed') {
            return $this->successResponse(['status' => 'failed']);
        }

        return $this->successResponse(['status' => 'processing']);
    }

    /**
     * جلب جلسات المحادثة
     * GET /api/v1/patient/chatbot/sessions
     */
    public function getSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'bot_type' => 'nullable|in:public,pre_marriage,pregnancy,motherhood',
        ]);

        $botType = $validated['bot_type'] ?? null;

        $sessionsQuery = AiChatMessage::where('user_id', $user->id);

        if ($botType) {
            $sessionsQuery->forBot($botType);
        }

        $sessions = $sessionsQuery
            ->selectRaw('session_id, bot_type, MIN(created_at) as started_at, MAX(created_at) as last_message_at, COUNT(*) as messages_count')
            ->groupBy('session_id', 'bot_type')
            ->orderByDesc('last_message_at')
            ->limit(50)
            ->get();

        if ($sessions->isNotEmpty()) {
            $sessionIds = $sessions->pluck('session_id')->all();

            $sessionMessages = AiChatMessage::where('user_id', $user->id)
                ->whereIn('session_id', $sessionIds)
                ->orderBy('created_at', 'asc')
                ->get(['session_id', 'role', 'message', 'metadata']);

            $firstUserMessageBySession = [];
            $customTitleBySession = [];

            foreach ($sessionMessages as $message) {
                $sid = $message->session_id;

                if (!isset($firstUserMessageBySession[$sid]) && $message->role === 'user') {
                    $firstUserMessageBySession[$sid] = $message->message;
                }

                $customTitle = data_get($message->metadata, 'session_title');
                if (!isset($customTitleBySession[$sid]) && is_string($customTitle) && trim($customTitle) !== '') {
                    $customTitleBySession[$sid] = trim($customTitle);
                }
            }

            $sessions = $sessions->map(function ($session) use ($customTitleBySession, $firstUserMessageBySession) {
                $baseTitle = $customTitleBySession[$session->session_id]
                    ?? $firstUserMessageBySession[$session->session_id]
                    ?? 'محادثة جديدة';

                $session->title = Str::limit($baseTitle, 80);

                return $session;
            });
        }

        return $this->successResponse($sessions, 'Sessions retrieved');
    }

    /**
     * تعديل اسم المحادثة
     * PATCH /api/v1/patient/chatbot/sessions/{sessionId}/rename
     */
    public function renameSession(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:120',
        ]);

        $title = trim($validated['title']);

        $messages = AiChatMessage::where('user_id', $user->id)
            ->forSession($sessionId)
            ->get();

        if ($messages->isEmpty()) {
            return $this->errorResponse('Session not found', 404);
        }

        /** @var AiChatMessage $message */
        foreach ($messages as $message) {
            $metadata = $message->metadata ?? [];
            $metadata['session_title'] = $title;
            $message->update(['metadata' => $metadata]);
        }

        return $this->successResponse([
            'session_id' => $sessionId,
            'title' => $title,
        ], 'Session renamed successfully');
    }

    /**
     * حذف محادثة كاملة
     * DELETE /api/v1/patient/chatbot/sessions/{sessionId}
     */
    public function deleteSession(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();

        $deleted = AiChatMessage::where('user_id', $user->id)
            ->forSession($sessionId)
            ->delete();

        if ($deleted === 0) {
            return $this->errorResponse('Session not found', 404);
        }

        return $this->successResponse([
            'deleted_count' => $deleted,
        ], 'Session deleted successfully');
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
     * جلب إعدادات البوت
     * GET /api/v1/patient/chatbot/config
     */
    public function getConfig(Request $request): JsonResponse
    {
        $user = $request->user();
        $botType = ChatbotService::getBotTypeFromStage($user->life_stage_id);
        $config = $this->chatbotService->getBotConfig($botType);

        // للمستخدمة المسجلة بدون مرحلة صحية: استخدم الاسم المخصص
        $name = $config['name'] ?? 'وداد';
        if ($botType === 'public' && $user) {
            $name = $config['authenticated_name'] ?? 'وداد';
        }

        return $this->successResponse([
            'bot_type' => $botType,
            'name' => $name,
            'welcome_message' => $config['welcome_message'] ?? 'أهلاً بكِ!',
            'suggested_questions' => $config['suggested_questions'] ?? [],
            'has_life_stage' => !is_null($user->life_stage_id),
        ], 'Config retrieved');
    }

    /**
     * مسح محادثة (إعادة تعيين)
     * POST /api/v1/patient/chatbot/sessions/{sessionId}/reset
     */
    public function resetSession(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();

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
     * حذف كل محادثات المستخدم (Right to Erasure)
     * DELETE /api/v1/patient/chatbot/messages
     */
    public function deleteAllMessages(Request $request): JsonResponse
    {
        $user = $request->user();
        $deleted = AiChatMessage::where('user_id', $user->id)->delete();

        Log::info('chatbot_data_erasure', [
            'user_id' => $user->id,
            'deleted_count' => $deleted,
            'requested_at' => now()->toISOString(),
        ]);

        return $this->successResponse([
            'deleted_count' => $deleted,
        ], 'تم حذف جميع المحادثات بنجاح');
    }

    // ============================================
    // DATA PREFERENCES
    // ============================================

    /**
     * GET /patient/chatbot/data-preferences
     * جلب إعدادات خصوصية بيانات المريضة
     */
    public function getDataPreferences(): JsonResponse
    {
        $user = auth('patient')->user();

        $preference = $user->chatbotPreference
            ?? new PatientChatbotPreference(
                PatientChatbotPreference::getDefaultsFor($user)
            );

        return $this->successResponse(
            new ChatbotPreferenceResource($preference),
            'إعدادات خصوصية البيانات'
        );
    }

    /**
     * PUT /patient/chatbot/data-preferences
     * تحديث إعدادات خصوصية بيانات المريضة
     */
    public function updateDataPreferences(UpdateChatbotPreferencesRequest $request): JsonResponse
    {
        $user = auth('patient')->user();

        $preference = PatientChatbotPreference::updateOrCreate(
            ['user_id' => $user->id],
            $request->validated(),
        );

        // إلغاء الـ Cache عند تغيير الإعدادات
        PatientDataCollectorService::invalidateCache($user->id);

        Log::info('chatbot_preferences_updated', [
            'user_id' => $user->id,
            'data_access_enabled' => $preference->data_access_enabled,
        ]);

        return $this->successResponse(
            new ChatbotPreferenceResource($preference),
            'تم تحديث إعدادات الخصوصية'
        );
    }

    // ============================================
    // HELPERS
    // ============================================

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
}
