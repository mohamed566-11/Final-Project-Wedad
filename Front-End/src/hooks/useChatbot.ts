import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatbotService } from "@/services/chatbotService";
import type { BotType, ChatMessage, SendMessagePayload } from "@/types/chatbot";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CHATBOT_UI } from "@/constants/chatbot-strings";

function classifyError(error: unknown): string {
    const err = error as { code?: string; response?: { status?: number; data?: { message?: string } } };

    // If backend provided a specific error message, use it
    const backendMessage = err?.response?.data?.message;

    if (err?.code === "ECONNABORTED") {
        return CHATBOT_UI.errorTimeout;
    }
    if (err?.response?.status === 503) {
        return backendMessage || "المساعد الذكي في وضع الاستعداد. أعيدي المحاولة خلال لحظات.";
    }
    if (!err?.response) {
        return CHATBOT_UI.errorGeneral;
    }
    return backendMessage || CHATBOT_UI.errorGeneral;
}

/**
 * Public chatbot hook (للزوار)
 */
export function usePublicChatbot() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // استرداد الرسائل من sessionStorage
    useEffect(() => {
        const saved = sessionStorage.getItem("public_chat_messages");
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch { }
        }
    }, []);

    const sendMessage = useCallback(async (text: string) => {
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

            try {
                const audio = new Audio("/assets/sounds/notification.mp3");
                audio.play();
            } catch { }
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: `error_${Date.now()}`,
                role: "assistant",
                message: classifyError(error),
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

interface UseAuthChatbotOptions {
    enabled?: boolean;
    initialBotType?: BotType;
}

/**
 * Authenticated chatbot hook (للمستخدمات المسجلات)
 * يدعم الـ Async/Polling
 */
export function useAuthChatbot(options: UseAuthChatbotOptions = {}) {
    const { enabled = true, initialBotType = "public" } = options;
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const forceNewSessionRef = useRef(false);
    const sessionIdRef = useRef<string | null>(null);
    const hasAutoLoadedSessionRef = useRef(false);

    // جلب إعدادات البوت — retry: false لتجنب تكرار الطلب عند خطأ 401
    // مفتاح الـ query يحتوي على user.id لضمان cache منفصل لكل مستخدم
    const configQuery = useQuery({
        queryKey: ["chatbot", "config", user?.id],
        queryFn: chatbotService.getConfig,
        staleTime: 5 * 60 * 1000,
        enabled: !!user && enabled,
        retry: false,
    });

    const activeBotType: BotType = configQuery.data?.bot_type ?? initialBotType;

    // جلب الجلسات — مفتاح مرتبط بالمستخدم ونوع البوت
    const sessionsQuery = useQuery({
        queryKey: ["chatbot", "sessions", user?.id, activeBotType],
        queryFn: () => chatbotService.getSessions(activeBotType),
        enabled: !!user && enabled,
        retry: false,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });

    // جلب رسائل جلسة حالية
    const messagesQuery = useQuery({
        queryKey: ["chatbot", "messages", sessionId],
        queryFn: () => chatbotService.getSessionMessages(sessionId!),
        enabled: !!sessionId && enabled,
    });

    const loadSession = useCallback((sid: string) => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        forceNewSessionRef.current = false;
        sessionIdRef.current = sid;
        setSessionId(sid);
    }, []);

    useEffect(() => {
        hasAutoLoadedSessionRef.current = false;
        setSessionId(null);
        sessionIdRef.current = null;
        forceNewSessionRef.current = true;
        setMessages([]);
    }, [activeBotType]);

    useEffect(() => {
        // Auto-load the latest session when sessions arrive for the first time on this bot type
        if (sessionsQuery.data && !hasAutoLoadedSessionRef.current) {
            hasAutoLoadedSessionRef.current = true;
            if (sessionsQuery.data.length > 0) {
                loadSession(sessionsQuery.data[0].session_id);
            }
        }
    }, [sessionsQuery.data, loadSession]);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        if (messagesQuery.data && !isTyping) {
            setMessages(messagesQuery.data);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messagesQuery.data]);

    // إرسال رسالة (بدعم Polling للـ Queue)
    const sendMutation = useMutation({
        mutationFn: (payload: SendMessagePayload) =>
            chatbotService.sendMessage(payload),
        onMutate: async (payload) => {
            setIsTyping(true);
            const tempUserMsg: ChatMessage = {
                id: `temp_${Date.now()}`,
                role: "user",
                message: payload.message,
                bot_type: activeBotType,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, tempUserMsg]);
        },
        onSuccess: (data) => {
            setSessionId(data.session_id);
            sessionIdRef.current = data.session_id;
            forceNewSessionRef.current = false;
            setMessages((prev) => {
                const filtered = prev.filter((m) => !String(m.id).startsWith("temp_"));
                return [...filtered, data.user_message];
            });
            pollForReply(data.message_id);
        },
        onError: (error) => {
            setIsTyping(false);
            const errorMsg: ChatMessage = {
                id: `error_${Date.now()}`,
                role: "assistant",
                message: classifyError(error),
                bot_type: activeBotType,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        },
    });

    // Polling logic for async Hugging Face response
    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    const pollForReply = (messageId: number) => {
        stopPolling();
        const maxAttempts = 30; // 30 × 2s = 60 seconds
        let attempts = 0;

        const tick = async () => {
            attempts++;
            if (attempts > maxAttempts) {
                stopPolling();
                addErrorMessage(CHATBOT_UI.errorTimeout);
                return;
            }

            try {
                const data = await chatbotService.getMessageStatus(messageId);
                if (data.status === "ready" && data.reply) {
                    stopPolling();
                    setMessages((prev) => [...prev, data.reply!]);
                    setIsTyping(false);
                    queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions", user?.id, activeBotType] });
                    try {
                        const audio = new Audio("/assets/sounds/notification.mp3");
                        audio.play();
                    } catch { }
                } else if (data.status === "failed") {
                    stopPolling();
                    queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions", user?.id, activeBotType] });
                    addErrorMessage(data.message);
                } else {
                    pollTimerRef.current = setTimeout(tick, 2000);
                }
            } catch (err) {
                stopPolling();
                addErrorMessage(classifyError(err));
            }
        };

        pollTimerRef.current = setTimeout(tick, 2000);
    };

    const addErrorMessage = (text?: string) => {
        setIsTyping(false);
        const errorMsg: ChatMessage = {
            id: `error_${Date.now()}`,
            role: "assistant",
            message: text || CHATBOT_UI.errorGeneral,
            bot_type: activeBotType,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
    };

    const resetMutation = useMutation({
        mutationFn: () => chatbotService.resetSession(sessionId!),
        onSuccess: () => {
            setMessages([]);
            setSessionId(null);
            sessionIdRef.current = null;
            queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions", user?.id, activeBotType] });
        },
    });

    const renameSessionMutation = useMutation({
        mutationFn: ({ sid, title }: { sid: string; title: string }) => chatbotService.renameSession(sid, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions", user?.id, activeBotType] });
        },
    });

    const deleteSessionMutation = useMutation({
        mutationFn: (sid: string) => chatbotService.deleteSession(sid),
        onSuccess: (_data, sid) => {
            if (sessionIdRef.current === sid) {
                setSessionId(null);
                sessionIdRef.current = null;
                setMessages([]);
            }

            queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions", user?.id, activeBotType] });
        },
    });

    const sendMessage = useCallback(
        (text: string) => {
            const shouldForceNewSession = forceNewSessionRef.current;
            const currentSessionId = shouldForceNewSession ? undefined : (sessionIdRef.current || undefined);

            sendMutation.mutate({
                message: text,
                session_id: currentSessionId,
                bot_type: activeBotType,
                force_new_session: shouldForceNewSession || undefined,
            });
        },
        [activeBotType, sendMutation],
    );

    const newConversation = useCallback(() => {
        stopPolling();
        forceNewSessionRef.current = true;
        sessionIdRef.current = null;
        setSessionId(null);
        setMessages([]);
    }, [stopPolling]);

    const renameSession = useCallback(async (sid: string, title: string) => {
        await renameSessionMutation.mutateAsync({ sid, title });
    }, [renameSessionMutation]);

    const deleteSession = useCallback(async (sid: string) => {
        await deleteSessionMutation.mutateAsync(sid);
    }, [deleteSessionMutation]);

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    return {
        messages,
        isLoading: sendMutation.isPending || isTyping,
        config: configQuery.data,
        sessions: sessionsQuery.data,
        activeBotType,
        currentSessionId: sessionId,
        sendMessage,
        resetChat: () => sessionId && resetMutation.mutate(),
        newConversation,
        loadSession,
        renameSession,
        deleteSession,
        isSessionActionLoading: renameSessionMutation.isPending || deleteSessionMutation.isPending,
        isConfigLoading: configQuery.isLoading,
    };
}

/**
 * Widget chatbot for authenticated users — synchronous, uses life-stage bot.
 * Bypasses the queue system for instant responses in the floating widget.
 */
export function useWidgetChatbot() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // retry: false — تجنب إعادة المحاولة التلقائية عند خطأ 401/403
    // مفتاح مرتبط بـ user.id لضمان عدم استخدام cache مستخدم آخر
    const configQuery = useQuery({
        queryKey: ["chatbot", "config", user?.id],
        queryFn: chatbotService.getConfig,
        staleTime: 5 * 60 * 1000,
        enabled: !!user,
        retry: false,
    });

    const sendMessage = useCallback(async (text: string) => {
        const userMsg: ChatMessage = {
            id: `user_${Date.now()}`,
            role: "user",
            message: text,
            bot_type: configQuery.data?.bot_type || "public",
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // أولاً: endpoint المستخدمة المسجلة (بوت المرحلة)
            const response = await chatbotService.sendWidgetMessage(text);
            const botMsg: ChatMessage = {
                id: `bot_${Date.now()}`,
                role: "assistant",
                message: response.reply,
                bot_type: response.bot_type,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (primaryError) {
            // Fallback: endpoint البوت العام — يضمن استمرار الشات
            try {
                const publicResponse = await chatbotService.sendPublicMessage(text);
                const botMsg: ChatMessage = {
                    id: `bot_${Date.now()}`,
                    role: "assistant",
                    message: publicResponse.reply,
                    bot_type: "public",
                    created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, botMsg]);
            } catch (fallbackError) {
                // كلا الـ endpoints فشلا — نصنّف الخطأ بدقة
                const errorMessage = classifyError(primaryError) !== CHATBOT_UI.errorGeneral
                    ? classifyError(primaryError)
                    : classifyError(fallbackError);

                const errorMsg: ChatMessage = {
                    id: `error_${Date.now()}`,
                    role: "assistant",
                    message: errorMessage,
                    bot_type: configQuery.data?.bot_type || "public",
                    created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, errorMsg]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [configQuery.data?.bot_type]);

    const clearChat = useCallback(() => setMessages([]), []);

    return {
        messages,
        isLoading,
        config: configQuery.data,
        isConfigLoading: configQuery.isLoading,
        sendMessage,
        clearChat,
    };
}
