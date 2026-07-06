import { useState, useEffect } from "react";
import { UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ChatHeader } from "./ChatHeader";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { EmergencyCard } from "./EmergencyCard";
import { SessionDialog } from "./SessionDialog";
import { PrivacySettingsModal } from "./PrivacySettingsModal";
import { useAuthChatbot, usePublicChatbot, useWidgetChatbot } from "@/hooks/useChatbot";
import { CHATBOT_UI, BOT_NAMES, EMERGENCY_KEYWORDS } from "@/constants/chatbot-strings";

interface ChatWindowProps {
    isAuthenticated: boolean;
    onClose: () => void;
    onOpenFullPage?: () => void;
    isFullPage?: boolean;
}

/**
 * يكشف إذا كانت أي رسالة في سجل المحادثة تحتوي على كلمات طوارئ
 */
function hasEmergencyContent(messages: { message?: string; role: string }[]): boolean {
    return messages.some((msg) =>
        msg.role === "user" &&
        msg.message &&
        EMERGENCY_KEYWORDS.some((kw) => msg.message!.includes(kw))
    );
}

export function ChatWindow({ isAuthenticated, onClose, onOpenFullPage, isFullPage = false }: ChatWindowProps) {
    const publicChat = usePublicChatbot();
    const authChat = useAuthChatbot({ enabled: isAuthenticated && isFullPage });
    const widgetChat = useWidgetChatbot();
    const authModeChat = isFullPage ? authChat : widgetChat;
    const chat = isAuthenticated ? authModeChat : publicChat;

    const [showEmergency, setShowEmergency] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sessionDialog, setSessionDialog] = useState<{
        mode: "rename" | "delete";
        sessionId: string;
        currentTitle: string;
    } | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);

    const publicConfig = {
        bot_type: "public" as const,
        name: BOT_NAMES.public,
        welcome_message: "أهلاً بك في منصة وداد! كيف يمكنني مساعدتك اليوم؟",
        suggested_questions: [
            "ما هي منصة وداد؟",
            "ما هي الخدمات المتاحة؟",
            "كيف أسجل في المنصة؟",
        ],
    };

    const authenticatedFallbackConfig = {
        bot_type: "public" as const,
        name: BOT_NAMES.authenticated_default,
        welcome_message: "أهلاً بكِ! كيف يمكنني مساعدتك اليوم؟",
        suggested_questions: [
            "ما هي منصة وداد؟",
            "ما هي الخدمات المتاحة؟",
            "كيف أسجل في المنصة؟",
        ],
    };

    const config = isAuthenticated
        ? (authModeChat.config ?? (authModeChat.isConfigLoading ? null : authenticatedFallbackConfig))
        : publicConfig;

    const displayName = !config
        ? BOT_NAMES.default
        : isAuthenticated && config.bot_type === "public"
            ? BOT_NAMES.authenticated_default
            : config.name || BOT_NAMES.default;

    const hasMessages = chat.messages.length > 0;

    useEffect(() => {
        if (chat.messages.length > 0 && hasEmergencyContent(chat.messages)) {
            setShowEmergency(true);
        }
    }, [chat.messages]);

    useEffect(() => {
        const firstButton = document.querySelector<HTMLButtonElement>("[data-chat-first-focus]");
        firstButton?.focus();
    }, []);

    const openRenameDialog = (sessionId: string, title: string) => {
        setRenameValue(title);
        setSessionDialog({ mode: "rename", sessionId, currentTitle: title });
    };

    const openDeleteDialog = (sessionId: string, title: string) => {
        setRenameValue("");
        setSessionDialog({ mode: "delete", sessionId, currentTitle: title });
    };

    const closeSessionDialog = () => {
        setSessionDialog(null);
        setRenameValue("");
    };

    const submitSessionDialog = async () => {
        if (!sessionDialog) return;

        if (sessionDialog.mode === "rename") {
            const newTitle = renameValue.trim();
            if (!newTitle) return;
            await authChat.renameSession(sessionDialog.sessionId, newTitle);
            closeSessionDialog();
            return;
        }

        await authChat.deleteSession(sessionDialog.sessionId);
        closeSessionDialog();
    };

    const showSidebar = isAuthenticated && isFullPage;

    return (
        <section
            role="dialog"
            aria-modal="true"
            aria-label={CHATBOT_UI.chatDialogLabel}
            dir="rtl"
            lang="ar"
            className={
                isFullPage
                    ? "w-full h-full bg-background dark:bg-background rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 flex flex-col overflow-hidden border border-border/40 dark:border-border/20"
                    : "w-[92vw] max-w-[400px] h-[75vh] max-h-[560px] min-h-[420px] sm:w-[400px] sm:h-[560px] bg-background dark:bg-background rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/40 flex flex-col overflow-hidden border border-border/40 dark:border-border/20"
            }
        >
            {/* Header */}
            <ChatHeader
                name={displayName}
                botType={config?.bot_type || "public"}
                isLoading={isAuthenticated && (isFullPage ? authChat.isConfigLoading : widgetChat.isConfigLoading)}
                onClose={onClose}
                onReset={
                    isAuthenticated
                        ? (isFullPage ? authChat.newConversation : widgetChat.clearChat)
                        : publicChat.clearChat
                }
                onOpenFullPage={onOpenFullPage}
                onPrivacySettings={isAuthenticated ? () => setShowPrivacySettings(true) : undefined}
            />

            {/* تنبيه: المستخدمة المسجلة لم تحدد مرحلتها الصحية بعد */}
            {isAuthenticated && !authModeChat.isConfigLoading && authModeChat.config?.bot_type === "public" && (
                <div className="flex items-center gap-2 px-4 py-2.5 
                               bg-purple-50/80 dark:bg-purple-950/30 backdrop-blur-sm
                               border-b border-purple-100/60 dark:border-purple-800/30 
                               text-xs text-purple-700 dark:text-purple-300">
                    <UserCircle className="w-4 h-4 shrink-0 text-purple-500 dark:text-purple-400" />
                    <span>
                        لم تحددي مرحلتك الصحية بعد —{" "}
                        <Link
                            to="/patient/profile/medical"
                            className="font-bold underline underline-offset-2 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
                        >
                            أضيفيها الآن
                        </Link>
                        {" "}لتفعيل مساعدتك المخصصة
                    </span>
                </div>
            )}

            {/* Main content area */}
            <div className="flex flex-1 min-h-0 relative">
                {/* Sidebar — full page authenticated mode only */}
                {showSidebar && (
                    <ChatSidebar
                        sessions={authChat.sessions ?? []}
                        currentSessionId={authChat.currentSessionId}
                        isCollapsed={sidebarCollapsed}
                        isActionLoading={authChat.isSessionActionLoading}
                        onToggle={() => setSidebarCollapsed((v) => !v)}
                        onNewConversation={authChat.newConversation}
                        onLoadSession={authChat.loadSession}
                        onRenameSession={openRenameDialog}
                        onDeleteSession={openDeleteDialog}
                    />
                )}

                {/* Chat area */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-background relative z-10">
                    {/* Welcome screen or message list */}
                    {!hasMessages && config ? (
                        <WelcomeScreen
                            config={config}
                            onSelectQuestion={chat.sendMessage}
                            displayName={displayName}
                        />
                    ) : (
                        <MessageList messages={chat.messages} isLoading={chat.isLoading} />
                    )}

                    {/* Emergency card */}
                    <AnimatePresence>
                        {showEmergency && (
                            <EmergencyCard onDismiss={() => setShowEmergency(false)} />
                        )}
                    </AnimatePresence>

                    {/* Floating Input (Manus Style) */}
                    <div className="w-full shrink-0 flex justify-center pb-4 pt-1 px-3 bg-gradient-to-t from-background via-background/95 to-transparent relative z-20">
                        <div className="w-full max-w-4xl drop-shadow-xl transition-all duration-300">
                            <MessageInput onSend={chat.sendMessage} disabled={chat.isLoading} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Session rename/delete dialog */}
            <SessionDialog
                isOpen={!!sessionDialog}
                mode={sessionDialog?.mode || "rename"}
                currentTitle={sessionDialog?.currentTitle || ""}
                renameValue={renameValue}
                isLoading={authChat.isSessionActionLoading}
                onRenameChange={setRenameValue}
                onSubmit={submitSessionDialog}
                onClose={closeSessionDialog}
            />

            {/* Privacy Settings Modal */}
            {isAuthenticated && (
                <PrivacySettingsModal
                    isOpen={showPrivacySettings}
                    onClose={() => setShowPrivacySettings(false)}
                />
            )}
        </section>
    );
}
