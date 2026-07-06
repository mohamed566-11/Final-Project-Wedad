import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock chatbotService (named export)
const mockChatbotService = {
    sendPublicMessage: vi.fn(),
    sendMessage: vi.fn(),
    sendWidgetMessage: vi.fn(),
    getMessageStatus: vi.fn(),
    getConfig: vi.fn(),
    getSessions: vi.fn(),
    getSessionMessages: vi.fn(),
    renameSession: vi.fn(),
    deleteSession: vi.fn(),
    resetSession: vi.fn(),
    deleteAllMessages: vi.fn(),
};

vi.mock('../../services/chatbotService', () => ({
    chatbotService: mockChatbotService,
}));

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: { id: 1, name: 'Test User' } })),
}));

// Mock chatbot-strings
vi.mock('../../constants/chatbot-strings', () => ({
    CHATBOT_UI: {
        errorTimeout: 'انتهت مهلة الانتظار. حاولي مرة أخرى.',
        errorGeneral: 'حدث خطأ في الاتصال. حاولي مرة أخرى.',
    },
}));

import { usePublicChatbot, useAuthChatbot, useWidgetChatbot } from '../useChatbot';

// Helper: create QueryClient wrapper for hooks using React Query
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ═══════════════════════════════════════════════════════════════════════════
// Section 10 — usePublicChatbot
// ═══════════════════════════════════════════════════════════════════════════

describe('usePublicChatbot', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    it('T10-01 initial state is empty', () => {
        const { result } = renderHook(() => usePublicChatbot());
        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('T10-02 sendMessage adds optimistic user message', async () => {
        mockChatbotService.sendPublicMessage.mockResolvedValue({
            reply: 'مرحباً!',
            bot_type: 'public',
            cached: false,
        });

        const { result } = renderHook(() => usePublicChatbot());

        await act(async () => {
            await result.current.sendMessage('مرحبا');
        });

        // Check we have 2 messages: user's and bot's
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[0].message).toBe('مرحبا');
        expect(result.current.messages[0].role).toBe('user');
    });

    it('T10-03 sendMessage receives bot reply and appends it to messages', async () => {
        mockChatbotService.sendPublicMessage.mockResolvedValue({
            reply: 'هذا رد من البوت!',
            bot_type: 'public',
            cached: false,
        });

        const { result } = renderHook(() => usePublicChatbot());

        await act(async () => {
            await result.current.sendMessage('مرحبا');
        });

        expect(result.current.messages[1].message).toBe('هذا رد من البوت!');
        expect(result.current.messages[1].role).toBe('assistant');
    });

    it('T10-04 clearChat empties messages array and clears sessionStorage', async () => {
        mockChatbotService.sendPublicMessage.mockResolvedValue({
            reply: 'رد',
            bot_type: 'public',
            cached: false,
        });

        const { result } = renderHook(() => usePublicChatbot());

        // Send a message first to populate messages
        await act(async () => {
            await result.current.sendMessage('test');
        });

        expect(result.current.messages.length).toBeGreaterThan(0);

        // Clear
        act(() => {
            result.current.clearChat();
        });

        expect(result.current.messages).toEqual([]);
        // The actual code uses 'public_chat_messages' key
        expect(sessionStorage.getItem('public_chat_messages')).toBeNull();
    });

    it('T10-05 error from API shows error message', async () => {
        mockChatbotService.sendPublicMessage.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => usePublicChatbot());

        await act(async () => {
            await result.current.sendMessage('سؤال');
        });

        // Should have user message + error message
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[1].role).toBe('assistant');
        // Error message should be present
        expect(result.current.messages[1].message).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Section 10 — useAuthChatbot
// ═══════════════════════════════════════════════════════════════════════════

describe('useAuthChatbot', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('T10-06 initial state is empty with no sessions', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAuthChatbot({ enabled: false }), { wrapper });

        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.sessions).toBeUndefined();
    });

    it('T10-07 sendMessage dispatches mutation with correct payload', async () => {
        vi.useRealTimers();

        mockChatbotService.sendMessage.mockResolvedValue({
            status: 'processing',
            session_id: 'public_abc',
            bot_type: 'public',
            message_id: 42,
            user_message: { id: 42, role: 'user', message: 'سؤال', bot_type: 'public', created_at: new Date().toISOString() },
        });
        mockChatbotService.getConfig.mockResolvedValue({ bot_type: 'public', name: 'وداد', welcome_message: '', suggested_questions: [] });
        mockChatbotService.getSessions.mockResolvedValue([]);
        mockChatbotService.getMessageStatus.mockResolvedValue({ status: 'processing' });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useAuthChatbot({ enabled: true, initialBotType: 'public' }), { wrapper });

        await act(async () => {
            result.current.sendMessage('سؤال');
        });

        await waitFor(() => {
            expect(mockChatbotService.sendMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'سؤال',
                    bot_type: 'public',
                })
            );
        });
    });

    it('T10-08 polling stops when component unmounts', () => {
        const wrapper = createWrapper();
        const { unmount } = renderHook(() => useAuthChatbot({ enabled: true, initialBotType: 'public' }), { wrapper });

        unmount();

        // No pending timers should remain
        expect(vi.getTimerCount()).toBe(0);
    });

    it('T10-09 newConversation clears messages and session', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAuthChatbot({ enabled: false, initialBotType: 'public' }), { wrapper });

        act(() => {
            result.current.newConversation();
        });

        expect(result.current.messages).toEqual([]);
        expect(result.current.currentSessionId).toBeNull();
    });

    it('T10-10 loadSession sets currentSessionId', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useAuthChatbot({ enabled: false, initialBotType: 'public' }), { wrapper });

        act(() => {
            result.current.loadSession('pregnancy_abc123');
        });

        expect(result.current.currentSessionId).toBe('pregnancy_abc123');
    });

    it('T10-11 renameSession calls service with correct args', async () => {
        vi.useRealTimers();
        mockChatbotService.renameSession.mockResolvedValue(undefined);

        const wrapper = createWrapper();
        const { result } = renderHook(() => useAuthChatbot({ enabled: false, initialBotType: 'public' }), { wrapper });

        await act(async () => {
            await result.current.renameSession('session-1', 'عنوان جديد');
        });

        expect(mockChatbotService.renameSession).toHaveBeenCalledWith('session-1', 'عنوان جديد');
    });

    it('T10-12 deleteSession calls service and clears state if current', async () => {
        vi.useRealTimers();
        mockChatbotService.deleteSession.mockResolvedValue(undefined);

        const wrapper = createWrapper();
        const { result } = renderHook(() => useAuthChatbot({ enabled: false, initialBotType: 'public' }), { wrapper });

        // Load a session first
        act(() => {
            result.current.loadSession('session-to-delete');
        });
        expect(result.current.currentSessionId).toBe('session-to-delete');

        // Delete it
        await act(async () => {
            await result.current.deleteSession('session-to-delete');
        });

        expect(mockChatbotService.deleteSession).toHaveBeenCalledWith('session-to-delete');
        expect(result.current.currentSessionId).toBeNull();
        expect(result.current.messages).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Section 10 — useWidgetChatbot
// ═══════════════════════════════════════════════════════════════════════════

describe('useWidgetChatbot', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('T10-13 initial state is empty', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useWidgetChatbot(), { wrapper });
        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('T10-14 sendMessage calls widget endpoint', async () => {
        mockChatbotService.sendWidgetMessage.mockResolvedValue({
            reply: 'رد الويدجت',
            bot_type: 'pregnancy',
        });
        mockChatbotService.getConfig.mockResolvedValue({ bot_type: 'pregnancy', name: 'وداد', welcome_message: '', suggested_questions: [] });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useWidgetChatbot(), { wrapper });

        await act(async () => {
            await result.current.sendMessage('سؤال');
        });

        expect(mockChatbotService.sendWidgetMessage).toHaveBeenCalledWith('سؤال');
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[1].message).toBe('رد الويدجت');
    });

    it('T10-15 widget falls back to public endpoint on failure', async () => {
        mockChatbotService.sendWidgetMessage.mockRejectedValue(new Error('503'));
        mockChatbotService.sendPublicMessage.mockResolvedValue({
            reply: 'رد البوت العام',
            bot_type: 'public',
            cached: false,
        });
        mockChatbotService.getConfig.mockResolvedValue({ bot_type: 'pregnancy', name: 'وداد', welcome_message: '', suggested_questions: [] });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useWidgetChatbot(), { wrapper });

        await act(async () => {
            await result.current.sendMessage('سؤال');
        });

        // Widget failed, should have fallen back to public
        expect(mockChatbotService.sendPublicMessage).toHaveBeenCalledWith('سؤال');
        expect(result.current.messages[1].message).toBe('رد البوت العام');
    });
});
