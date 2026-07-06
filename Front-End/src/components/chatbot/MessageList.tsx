import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ScrollToBottom } from "./ScrollToBottom";
import type { ChatMessage } from "@/types/chatbot";
import { CHATBOT_UI } from "@/constants/chatbot-strings";

interface MessageListProps {
    messages: ChatMessage[];
    isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        bottomRef.current?.scrollIntoView({ behavior });
    }, []);

    // Auto-scroll on new messages or when streaming dispatches an event
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    useEffect(() => {
        const handleStreamScroll = () => scrollToBottom("auto");
        window.addEventListener('chatbot-scroll', handleStreamScroll);
        return () => window.removeEventListener('chatbot-scroll', handleStreamScroll);
    }, [scrollToBottom]);

    // Detect scroll position to show/hide scroll-to-bottom button
    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowScrollButton(distanceFromBottom > 150);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <div className="flex-1 relative overflow-hidden">
            {/* Medical disclaimer */}
            <div
                role="note"
                className="absolute top-0 left-0 right-0 z-10
                           bg-amber-50/90 dark:bg-amber-950/40 backdrop-blur-md
                           px-4 py-2 text-[10px] text-amber-700 dark:text-amber-300/80 
                           text-center font-medium
                           border-b border-amber-200/50 dark:border-amber-800/30"
            >
                {CHATBOT_UI.disclaimer}
            </div>

            {/* Messages container */}
            <div
                ref={containerRef}
                role="log"
                aria-label={CHATBOT_UI.chatLogLabel}
                aria-live="polite"
                aria-atomic="false"
                className="h-full overflow-y-auto pt-10 pb-[100px] px-4 sm:px-6 md:px-8 space-y-5 
                           scrollbar-thin scroll-smooth"
            >
                {messages.map((msg, idx) => (
                    <MessageBubble 
                        key={msg.id || idx} 
                        message={msg} 
                        index={idx} 
                        isLatest={idx === messages.length - 1} 
                    />
                ))}

                {isLoading && (
                    <div className="pr-0">
                        <TypingIndicator />
                    </div>
                )}

                <div ref={bottomRef} className="h-1" />
            </div>

            {/* Scroll-to-bottom floating button */}
            <ScrollToBottom
                isVisible={showScrollButton}
                onClick={() => scrollToBottom("smooth")}
            />
        </div>
    );
}
