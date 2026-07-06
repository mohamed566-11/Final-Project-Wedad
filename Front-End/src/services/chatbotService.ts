import api from "./api";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import type {
    BotType,
    ChatConfig,
    ChatMessage,
    ChatSession,
    ChatbotPreferences,
    SendMessagePayload,
    SendMessageResponse,
    PublicMessageResponse,
    MessageStatusResponse,
} from "@/types/chatbot";

/**
 * Dedicated axios instance for chatbot requests that call Gradio synchronously.
 * Uses a 65-second timeout to allow Gradio cold-start (which can take 30-60s).
 */
const chatbotApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { Accept: "application/json" },
    timeout: 65000,
});

// Add auth token to chatbotApi requests as well
chatbotApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/**
 * Retry interceptor: يعيد المحاولة مرة واحدة عند 503 أو timeout (HF Space نائم)
 * ينتظر 3 ثواني قبل إعادة المحاولة لإتاحة وقت للـ HF Space للاستيقاظ
 */
chatbotApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config as (typeof error.config) & { _retry?: boolean };
        if (!config._retry && (error.response?.status === 503 || error.code === "ECONNABORTED")) {
            config._retry = true;
            await new Promise<void>((r) => setTimeout(r, 3000));
            return chatbotApi(config);
        }
        return Promise.reject(error);
    }
);

export const chatbotService = {
    // ─── PUBLIC (no auth) ────────────────────────────────────────────────────
    /**
     * إرسال رسالة للبوت العام (بدون تسجيل دخول)
     * Backend: POST /api/v1/chatbot/public/message  (public.php)
     */
    sendPublicMessage: async (message: string): Promise<PublicMessageResponse> => {
        const response = await chatbotApi.post("/chatbot/public/message", { message });
        return response.data.data || response.data;
    },

    // ─── AUTHENTICATED (patient prefix) ──────────────────────────────────────
    /**
     * إرسال رسالة فورية للبوت عبر الـ Widget (المستخدم المسجل)
     * يحدد نوع البوت تلقائياً من life_stage_id
     * Backend: POST /api/v1/patient/chatbot/widget-message  (patient.php)
     */
    sendWidgetMessage: async (message: string): Promise<PublicMessageResponse> => {
        const response = await chatbotApi.post("/patient/chatbot/widget-message", { message });
        return response.data.data || response.data;
    },

    /**
     * إرسال رسالة للبوت عبر Queue (async — للصفحة الكاملة)
     * Backend: POST /api/v1/patient/chatbot/message  (patient.php)
     */
    sendMessage: async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
        const response = await api.post("/patient/chatbot/message", payload);
        return response.data.data || response.data;
    },

    /**
     * جلب إعدادات البوت بناءً على مرحلة المستخدمة
     * Backend: GET /api/v1/patient/chatbot/config  (patient.php)
     * يستخدم chatbotApi لتجنب 401-redirect interceptor عند انتهاء الجلسة
     */
    getConfig: async (): Promise<ChatConfig> => {
        const response = await chatbotApi.get("/patient/chatbot/config");
        return response.data.data || response.data;
    },

    /**
     * جلب الجلسات
     * Backend: GET /api/v1/patient/chatbot/sessions  (patient.php)
     */
    getSessions: async (botType?: BotType): Promise<ChatSession[]> => {
        const response = await api.get("/patient/chatbot/sessions", {
            params: botType ? { bot_type: botType } : undefined,
        });
        return response.data.data || response.data;
    },

    /**
     * جلب رسائل جلسة محددة
     * Backend: GET /api/v1/patient/chatbot/sessions/{id}/messages
     */
    getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const response = await api.get(`/patient/chatbot/sessions/${sessionId}/messages`);
        return response.data.data || response.data;
    },

    /**
     * تعديل اسم جلسة
     * Backend: PATCH /api/v1/patient/chatbot/sessions/{id}/rename
     */
    renameSession: async (sessionId: string, title: string): Promise<void> => {
        await api.patch(`/patient/chatbot/sessions/${sessionId}/rename`, { title });
    },

    /**
     * حذف جلسة كاملة
     * Backend: DELETE /api/v1/patient/chatbot/sessions/{id}
     */
    deleteSession: async (sessionId: string): Promise<void> => {
        await api.delete(`/patient/chatbot/sessions/${sessionId}`);
    },

    /**
     * مسح جلسة
     * Backend: POST /api/v1/patient/chatbot/sessions/{id}/reset
     */
    resetSession: async (sessionId: string): Promise<void> => {
        await api.post(`/patient/chatbot/sessions/${sessionId}/reset`);
    },

    /**
     * استعلام حالة رسالة (Polling)
     * Backend: GET /api/v1/patient/chatbot/messages/{id}/status
     */
    getMessageStatus: async (messageId: number): Promise<MessageStatusResponse> => {
        const response = await api.get(`/patient/chatbot/messages/${messageId}/status`);
        return response.data.data || response.data;
    },

    /**
     * حذف كل المحادثات (Right to Erasure)
     * Backend: DELETE /api/v1/patient/chatbot/messages
     */
    deleteAllMessages: async (): Promise<void> => {
        await api.delete("/patient/chatbot/messages");
    },

    // ─── DATA PREFERENCES (Opt-in Privacy) ──────────────────────────────────
    /**
     * جلب إعدادات خصوصية بيانات المريضة
     * Backend: GET /api/v1/patient/chatbot/data-preferences
     */
    getDataPreferences: async (): Promise<ChatbotPreferences> => {
        const response = await api.get("/patient/chatbot/data-preferences");
        return response.data.data || response.data;
    },

    /**
     * تحديث إعدادات خصوصية بيانات المريضة
     * Backend: PUT /api/v1/patient/chatbot/data-preferences
     */
    updateDataPreferences: async (prefs: Partial<ChatbotPreferences>): Promise<ChatbotPreferences> => {
        const response = await api.put("/patient/chatbot/data-preferences", prefs);
        return response.data.data || response.data;
    },
};
