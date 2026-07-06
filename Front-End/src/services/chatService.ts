import api from './api';
import type { SendMessagePayload } from '@/types/chat';

type Role = 'patient' | 'doctor';

const BASE = (role: Role, id: number) => `/${role}/consultations/${id}/chat`;

export const chatService = {
    getMessages: (id: number, role: Role = 'patient', page = 1) =>
        api.get(`${BASE(role, id)}/messages`, { params: { page } }),

    getNewMessages: (id: number, role: Role = 'patient', lastMessageId: number, checkIds: number[] = []) =>
        api.get(`${BASE(role, id)}/messages/new`, { 
            params: { 
                last_message_id: lastMessageId,
                check_ids: checkIds.join(',')
            } 
        }),

    downloadImage: (id: number, role: Role = 'patient', messageId: number) =>
        api.get(`${BASE(role, id)}/messages/${messageId}/download`, { responseType: 'blob' }),

    sendMessage: (id: number, role: Role = 'patient', payload: SendMessagePayload) => {
        const form = new FormData();
        if (payload.message) form.append('message', payload.message);
        if (payload.image) form.append('image', payload.image);
        return api.post(`${BASE(role, id)}/messages`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    markAsRead: (id: number, role: Role = 'patient') =>
        api.put(`${BASE(role, id)}/messages/read`),

    getUnreadCount: (role: Role = 'patient') =>
        api.get(`/${role}/consultations/chat/unread-count`),
};
