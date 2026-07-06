<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiChatMessage;
use App\Services\ChatbotService;
use App\Traits\ApiResponse;
use App\Http\Resources\Patient\ChatMessageResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class AdminChatbotController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ChatbotService $chatbotService
    ) {}

    /**
     * إحصاءات الشات بوت
     * GET /api/v1/admin/chatbot/stats
     */
    public function stats(): JsonResponse
    {
        $botTypes = ['public', 'pre_marriage', 'pregnancy', 'motherhood'];

        $stats = [
            'total_messages'     => AiChatMessage::count(),
            'total_sessions'     => AiChatMessage::distinct('session_id')->count('session_id'),
            'total_users'        => AiChatMessage::distinct('user_id')->count('user_id'),
            'messages_today'     => AiChatMessage::whereDate('created_at', today())->count(),
            'messages_this_week' => AiChatMessage::where('created_at', '>=', now()->startOfWeek())->count(),

            // Per bot stats — يشمل حالة التشغيل الفعلية
            'per_bot' => collect($botTypes)->mapWithKeys(fn($t) => [$t => $this->botStats($t)])->all(),
        ];

        return $this->successResponse($stats, 'Chatbot stats retrieved');
    }

    /**
     * جلب المحادثات مع pagination
     * GET /api/v1/admin/chatbot/conversations
     */
    public function conversations(Request $request): JsonResponse
    {
        $botType = $request->query('bot_type');

        $query = AiChatMessage::selectRaw(
                'session_id, bot_type, user_id, MIN(created_at) as started_at, MAX(created_at) as last_message_at, COUNT(*) as messages_count'
            )
            ->groupBy('session_id', 'bot_type', 'user_id')
            ->orderByDesc('last_message_at');

        if ($botType) {
            $query->where('bot_type', $botType);
        }

        $conversations = $query->paginate(20);

        return $this->successResponse($conversations, 'Conversations retrieved');
    }

    /**
     * عرض محادثة محددة
     * GET /api/v1/admin/chatbot/conversations/{sessionId}
     */
    public function showConversation(string $sessionId): JsonResponse
    {
        $messages = AiChatMessage::forSession($sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return $this->successResponse(
            ChatMessageResource::collection($messages),
            'Conversation retrieved'
        );
    }

    /**
     * حذف محادثة
     * DELETE /api/v1/admin/chatbot/conversations/{sessionId}
     */
    public function deleteConversation(string $sessionId): JsonResponse
    {
        $deleted = AiChatMessage::forSession($sessionId)->delete();

        Log::info('admin_chatbot_conversation_deleted', [
            'session_id'    => $sessionId,
            'deleted_count' => $deleted,
        ]);

        return $this->successResponse([
            'deleted_count' => $deleted,
        ], 'Conversation deleted');
    }

    /**
     * تشغيل/إيقاف بوت
     * POST /api/v1/admin/chatbot/bots/{type}/toggle
     */
    public function toggleBot(string $type): JsonResponse
    {
        $cacheKey  = "chatbot_disabled:{$type}";
        $isDisabled = Cache::get($cacheKey, false);

        if ($isDisabled) {
            Cache::forget($cacheKey);
            $newStatus = 'enabled';
        } else {
            Cache::put($cacheKey, true, now()->addDays(30));
            $newStatus = 'disabled';
        }

        Log::info('admin_chatbot_toggled', [
            'bot_type'   => $type,
            'new_status' => $newStatus,
        ]);

        return $this->successResponse([
            'bot_type' => $type,
            'status'   => $newStatus,
        ], "Bot {$type} is now {$newStatus}");
    }

    /**
     * جلب بيانات Admin من Hugging Face لبوت معين
     * GET /api/v1/admin/chatbot/bots/{type}/admin-data
     */
    public function getBotAdminData(string $type): JsonResponse
    {
        $validTypes = ['public', 'pre_marriage', 'pregnancy', 'motherhood'];
        if (!in_array($type, $validTypes)) {
            return $this->errorResponse('Invalid bot type', 422);
        }

        $adminData = $this->chatbotService->getAdminData($type);

        if (!$adminData) {
            return $this->errorResponse('Could not fetch admin data from bot', 503);
        }

        return $this->successResponse([
            'bot_type'   => $type,
            'admin_data' => $adminData,
        ], 'Admin data retrieved');
    }

    /**
     * مسح cache بوت معين
     * POST /api/v1/admin/chatbot/cache/clear
     */
    public function clearCache(Request $request): JsonResponse
    {
        $botType = $request->input('bot_type', '*');

        try {
            // Use Cache::flush for simple approach, or pattern-based for Redis
            $store = config('cache.default');
            if ($store === 'redis') {
                $pattern = "chatbot:{$botType}:*";
                $prefix  = config('cache.prefix', '') . ':';
                $keys    = Redis::keys($prefix . $pattern);
                if (!empty($keys)) {
                    // Strip prefix for DEL command
                    Redis::del($keys);
                }
            }

            Log::info('admin_chatbot_cache_cleared', ['bot_type' => $botType]);

            return $this->successResponse([
                'bot_type' => $botType,
            ], "Cache cleared for bot: {$botType}");
        } catch (\Exception $e) {
            Log::error('admin_chatbot_cache_clear_failed', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to clear cache', 500);
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * إحصاء بوت محدد — يشمل حالة التشغيل الفعلية من Redis
     */
    private function botStats(string $botType): array
    {
        $total    = AiChatMessage::forBot($botType)->count();
        $sessions = AiChatMessage::forBot($botType)->distinct('session_id')->count('session_id');

        return [
            'total_messages'           => $total,
            'total_sessions'           => $sessions,
            'active_users'             => AiChatMessage::forBot($botType)->distinct('user_id')->count('user_id'),
            'messages_today'           => AiChatMessage::forBot($botType)->whereDate('created_at', today())->count(),
            'avg_messages_per_session' => round($total / max($sessions, 1), 1),
            // الحالة من Redis (true = يعمل، false = موقوف)
            'is_enabled'               => !Cache::get("chatbot_disabled:{$botType}", false),
        ];
    }
}
