import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module (default export used by authenticated endpoints)
const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
};

vi.mock('../api', () => ({
    default: mockApi,
}));

// Mock axios.create to control chatbotApi (used by public/widget/config endpoints)
const mockChatbotApi = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
    },
};

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockChatbotApi),
    },
}));

// Must import AFTER mocks are set up
import { chatbotService } from '../chatbotService';

describe('chatbotService', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup typical successful responses
        mockChatbotApi.post.mockResolvedValue({ data: { status: 'success', data: { reply: 'رد', bot_type: 'public', cached: false } } });
        mockChatbotApi.get.mockResolvedValue({ data: { status: 'success', data: {} } });
        mockApi.post.mockResolvedValue({ data: { status: 'success', data: { status: 'processing', session_id: 's1', bot_type: 'public', message_id: 1, user_message: {} } } });
        mockApi.get.mockResolvedValue({ data: { status: 'success', data: [] } });
        mockApi.patch.mockResolvedValue({ data: { status: 'success' } });
        mockApi.delete.mockResolvedValue({ data: { status: 'success' } });
    });

    it('T11-01 sendPublicMessage sends POST to /chatbot/public/message', async () => {
        await chatbotService.sendPublicMessage('مرحبا');
        expect(mockChatbotApi.post).toHaveBeenCalledWith('/chatbot/public/message', { message: 'مرحبا' });
    });

    it('T11-02 sendMessage sends POST to /patient/chatbot/message with payload', async () => {
        await chatbotService.sendMessage({
            message: 'سؤال',
            bot_type: 'public',
            session_id: 'session-123',
        });
        expect(mockApi.post).toHaveBeenCalledWith('/patient/chatbot/message', {
            message: 'سؤال',
            bot_type: 'public',
            session_id: 'session-123',
        });
    });

    it('T11-03 sendWidgetMessage sends POST to /patient/chatbot/widget-message', async () => {
        await chatbotService.sendWidgetMessage('ألم بالبطن');
        expect(mockChatbotApi.post).toHaveBeenCalledWith('/patient/chatbot/widget-message', {
            message: 'ألم بالبطن'
        });
    });

    it('T11-04 getSessions sends GET with optional bot_type param', async () => {
        await chatbotService.getSessions('pregnancy');
        expect(mockApi.get).toHaveBeenCalledWith('/patient/chatbot/sessions', {
            params: { bot_type: 'pregnancy' }
        });
    });

    it('T11-05 getSessions without filter calls without query params', async () => {
        await chatbotService.getSessions();
        expect(mockApi.get).toHaveBeenCalledWith('/patient/chatbot/sessions', {
            params: undefined
        });
    });

    it('T11-06 getSessionMessages sends GET for session', async () => {
        await chatbotService.getSessionMessages('session-1');
        expect(mockApi.get).toHaveBeenCalledWith('/patient/chatbot/sessions/session-1/messages');
    });

    it('T11-07 renameSession sends PATCH', async () => {
        await chatbotService.renameSession('session-1', 'new title');
        expect(mockApi.patch).toHaveBeenCalledWith('/patient/chatbot/sessions/session-1/rename', { title: 'new title' });
    });

    it('T11-08 deleteSession sends DELETE', async () => {
        await chatbotService.deleteSession('session-1');
        expect(mockApi.delete).toHaveBeenCalledWith('/patient/chatbot/sessions/session-1');
    });

    it('T11-09 resetSession sends POST', async () => {
        await chatbotService.resetSession('session-1');
        expect(mockApi.post).toHaveBeenCalledWith('/patient/chatbot/sessions/session-1/reset');
    });

    it('T11-10 getMessageStatus sends GET status', async () => {
        await chatbotService.getMessageStatus(1234);
        expect(mockApi.get).toHaveBeenCalledWith('/patient/chatbot/messages/1234/status');
    });

    it('T11-11 deleteAllMessages sends DELETE', async () => {
        await chatbotService.deleteAllMessages();
        expect(mockApi.delete).toHaveBeenCalledWith('/patient/chatbot/messages');
    });

    it('T11-12 sendMessage includes auth Bearer header via api interceptor', async () => {
        // The api instance automatically adds Authorization header via interceptor
        // We verify sendMessage uses the authenticated `api` instance, not chatbotApi
        await chatbotService.sendMessage({ message: 'test', bot_type: 'public' });
        expect(mockApi.post).toHaveBeenCalled();
        expect(mockChatbotApi.post).not.toHaveBeenCalledWith(
            expect.stringContaining('/patient/chatbot/message'),
            expect.anything()
        );
    });

    it('T11-13 getConfig sends GET to config via chatbotApi', async () => {
        await chatbotService.getConfig();
        expect(mockChatbotApi.get).toHaveBeenCalledWith('/patient/chatbot/config');
    });
});
