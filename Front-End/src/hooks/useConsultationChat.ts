import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService } from '@/services/chatService';
import type { ChatMessage, SendMessagePayload } from '@/types/chat';
import { toast } from 'sonner';

const POLL_MS = 3000;
const ACTIVE = ['confirmed', 'in_progress'];

type Role = 'patient' | 'doctor';

export function useConsultationChat(
    consultationId: number,
    consultationStatus: string,
    userRole: Role = 'patient'
) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const lastIdRef = useRef<number>(0);
    const failRef = useRef<number>(0);
    const unacknowledgedIdsRef = useRef<number[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isActive = ACTIVE.includes(consultationStatus);

    useEffect(() => {
        (async () => {
            try {
                const res = await chatService.getMessages(consultationId, userRole);
                const msgs: ChatMessage[] = res.data.data ?? [];
                setMessages(msgs);
                if (typeof res.data.other_party_online === 'boolean') {
                    setIsOnline(res.data.other_party_online);
                }
                if (msgs.length) lastIdRef.current = msgs[msgs.length - 1].id;
                await chatService.markAsRead(consultationId, userRole);
            } catch {
                toast.error('تعذر تحميل الرسائل');
            } finally {
                setIsLoading(false);
            }
        })();

    }, [consultationId, userRole]);

    // Delivery status tracking logic
    const handleFocus = useCallback(() => {
        if (document.hasFocus()) chatService.markAsRead(consultationId, userRole).catch(() => {});
    }, [consultationId, userRole]);

    useEffect(() => {
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [handleFocus]);

    // Unread count refresh on focus
    useEffect(() => {
        const refreshUnread = () => {
            if (document.hasFocus()) chatService.getUnreadCount(userRole).catch(() => {});
        };
        const id = setInterval(refreshUnread, 15_000);
        return () => clearInterval(id);
    }, [userRole]);

    useEffect(() => {
        unacknowledgedIdsRef.current = messages
            .filter(m => m.is_mine && (!m.is_read || !m.is_delivered) && m.id > 0)
            .map(m => m.id);
    }, [messages]);

    useEffect(() => {
        if (!isActive) return;
        intervalRef.current = setInterval(async () => {
            try {
                const checkIds = unacknowledgedIdsRef.current;
                const res = await chatService.getNewMessages(consultationId, userRole, lastIdRef.current, checkIds);
                const newMsgs: ChatMessage[] = res.data.data ?? [];
                
                if (typeof res.data.other_party_online === 'boolean') {
                    setIsOnline(res.data.other_party_online);
                }

                if (newMsgs.length) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMsgsMap = new Map(newMsgs.map(m => [m.id, m]));
                        const trulyNew = newMsgs.filter(m => !existingIds.has(m.id));
                        
                        let updatedPrev = prev.map(m => newMsgsMap.has(m.id) ? newMsgsMap.get(m.id)! : m);
                        
                        // Fallback UI trick: If other person sent us a message, they must have seen ours natively
                        if (trulyNew.some(m => !m.is_mine)) {
                            updatedPrev = updatedPrev.map(m => m.is_mine ? { ...m, is_read: true, is_delivered: true } : m);
                        }

                        return [...updatedPrev, ...trulyNew];
                    });
                    
                    const latestTrullyNewId = newMsgs.filter(m => m.id > lastIdRef.current).pop()?.id;
                    if (latestTrullyNewId) lastIdRef.current = latestTrullyNewId;

                    if (document.hasFocus()) {
                        chatService.markAsRead(consultationId, userRole).catch(() => {});
                    }
                }
                failRef.current = 0;
            } catch {
                failRef.current++;
                if (failRef.current >= 3) toast.warning('تحقق من اتصالك بالإنترنت');
            }
        }, POLL_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [consultationId, isActive, userRole]);

    const sendMessage = useCallback(async (payload: SendMessagePayload) => {
        if (isSending) return;
        const tempId = -Date.now();
        const optimistic: ChatMessage = {
            id: tempId,
            consultation_id: consultationId,
            sender_type: userRole,
            sender_id: 0,
            sender_name: 'أنت',
            sender_avatar: null,
            message: payload.message ?? null,
            image_url: payload.image ? URL.createObjectURL(payload.image) : null,
            message_type: payload.image ? (payload.message ? 'text_image' : 'image') : 'text',
            is_delivered: false,
            delivered_at: null,
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString(),
            is_mine: true,
        };
        setMessages(prev => [...prev, optimistic]);
        setIsSending(true);
        try {
            const res = await chatService.sendMessage(consultationId, userRole, payload);
            const real: ChatMessage = res.data.data;
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                if (existingIds.has(real.id)) return prev.filter(m => m.id !== tempId);
                return prev.map(m => m.id === tempId ? real : m);
            });
            lastIdRef.current = Math.max(lastIdRef.current, real.id);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error('فشل إرسال الرسالة، حاول مرة أخرى');
        } finally {
            setIsSending(false);
        }
    }, [consultationId, isSending, userRole]);

    return { messages, isLoading, isSending, isActive, isOnline, sendMessage };
}
