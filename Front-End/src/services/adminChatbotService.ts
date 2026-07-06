import api from "./api";

export interface ChatbotDocument {
    id: number;
    bot_type: 'public' | 'pre_marriage' | 'pregnancy' | 'motherhood';
    file_name: string;
    file_size: number;
    formatted_size: string;
    status: 'uploaded' | 'processing' | 'ready' | 'failed';
    error_message?: string;
    created_at: string;
}

export interface PaginatedDocuments {
    data: ChatbotDocument[];
    current_page: number;
    last_page: number;
    total: number;
}

export interface BotStat {
    total_messages: number;
    total_sessions: number;
    active_users: number;
    messages_today: number;
    avg_messages_per_session: number;
    is_enabled: boolean;
}

export interface ChatbotStats {
    total_messages: number;
    total_sessions: number;
    total_users: number;
    messages_today: number;
    messages_this_week: number;
    per_bot: Record<string, BotStat>;
}

export const adminChatbotService = {
    // Get all documents - returns { data: [...], pagination: {...} }
    getDocuments: async (params?: { page?: number; bot_type?: string }): Promise<PaginatedDocuments> => {
        const response = await api.get('/admin/chatbot/documents', { params });
        // Backend: successResponse($paginator) → { status, message, data: [...items], pagination: {...} }
        return {
            data: response.data.data ?? [],
            current_page: response.data.pagination?.meta?.current_page ?? 1,
            last_page: response.data.pagination?.meta?.total_pages ?? 1,
            total: response.data.pagination?.meta?.total ?? 0,
        };
    },

    // Upload a new document
    uploadDocument: async (bot_type: string, file: File) => {
        const formData = new FormData();
        formData.append('bot_type', bot_type);
        formData.append('file', file);
        const response = await api.post('/admin/chatbot/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Delete a document
    deleteDocument: async (id: number) => {
        const response = await api.delete(`/admin/chatbot/documents/${id}`);
        return response.data;
    },

    // Get chatbot overall stats
    getStats: async () => {
        const response = await api.get('/admin/chatbot/stats');
        return response.data.data;
    },

    // Get all conversations
    getConversations: async (params?: { page?: number; bot_type?: string }) => {
        const response = await api.get('/admin/chatbot/conversations', { params });
        return response.data.data;
    },

    // Get conversation details (messages)
    getConversationDetails: async (sessionId: string) => {
        const response = await api.get(`/admin/chatbot/conversations/${sessionId}`);
        return response.data.data;
    },

    // Delete a conversation
    deleteChatConversation: async (sessionId: string) => {
        const response = await api.delete(`/admin/chatbot/conversations/${sessionId}`);
        return response.data;
    },

    // Toggle Bot Enable/Disable
    toggleBot: async (botType: string) => {
        const response = await api.post(`/admin/chatbot/bots/${botType}/toggle`);
        return response.data;
    },

    // Clear Cache
    clearCache: async (botType: string) => {
        const response = await api.post('/admin/chatbot/cache/clear', { bot_type: botType });
        return response.data;
    }
};

