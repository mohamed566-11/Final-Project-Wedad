import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, Bot, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/types/chatbot";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
    message: ChatMessage;
    index: number;
    isLatest?: boolean;
}

const botAvatarGradients: Record<string, string> = {
    pregnancy: "from-rose-500/20 to-pink-500/20 dark:from-rose-500/30 dark:to-pink-500/30 border-rose-200/30 dark:border-rose-500/20",
    motherhood: "from-primary/20 to-primary-400/20 dark:from-primary/30 dark:to-primary-400/30 border-primary-200/30 dark:border-primary/20",
    pre_marriage: "from-purple-500/20 to-violet-500/20 dark:from-purple-500/30 dark:to-violet-500/30 border-purple-200/30 dark:border-purple-500/20",
    public: "from-primary/20 to-purple-400/20 dark:from-primary/30 dark:to-purple-500/30 border-primary/10 dark:border-primary/20",
};

export function MessageBubble({ message, index, isLatest }: MessageBubbleProps) {
    const isUser = message.role === "user";
    const msgText = message.message ?? "";
    const isError = msgText.includes("حدث خطأ") || msgText.includes("تأخر الرد") || msgText.includes("عذراً");
    const [copied, setCopied] = useState(false);
    
    // Legendary Streaming Simulation State
    const [displayedText, setDisplayedText] = useState(isUser || !isLatest ? msgText : "");
    const [isStreaming, setIsStreaming] = useState(!isUser && isLatest && msgText.length > 0);
    const currentIndexRef = useRef(0);

    // Streaming effect
    useEffect(() => {
        if (isUser || !isLatest || !msgText) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayedText(msgText);
            setIsStreaming(false);
            currentIndexRef.current = msgText.length;
            return;
        }

        // If the text has grown, we continue streaming from where we were.
        // If we've already streamed the whole thing, we just set it.
        if (currentIndexRef.current >= msgText.length) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayedText(msgText);
            setIsStreaming(false);
            return;
        }

        setIsStreaming(true);
        const streamInterval = setInterval(() => {
            // Extremely fast typing: 15 to 30 chars per 10ms.
            currentIndexRef.current += Math.floor(Math.random() * 15) + 15;
            
            if (currentIndexRef.current >= msgText.length) {
                currentIndexRef.current = msgText.length;
                clearInterval(streamInterval);
                setIsStreaming(false);
            }
            
            setDisplayedText(msgText.slice(0, currentIndexRef.current));
            
            // Dispatch event to scroll to bottom smoothly
            window.dispatchEvent(new CustomEvent('chatbot-scroll'));
        }, 10);

        return () => clearInterval(streamInterval);
    }, [msgText, isUser, isLatest]);

    const copyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(msgText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Ignore clipboard errors
        }
    }, [msgText]);

    const ariaLabel = isUser
        ? `رسالتكِ: ${msgText}`
        : `رد المساعد: ${msgText}`;

    const avatarGradient = botAvatarGradients[message.bot_type] || botAvatarGradients.public;

    // Format timestamp
    const timestamp = message.created_at
        ? new Date(message.created_at).toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
            aria-label={ariaLabel}
            className={cn(
                "flex w-full gap-2.5 group",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div
                aria-hidden="true"
                className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    "border shadow-sm transition-all duration-200",
                    isUser
                        ? "bg-gradient-to-br from-primary/15 to-primary/25 dark:from-primary/20 dark:to-primary/30 border-primary/20 dark:border-primary/30"
                        : `bg-gradient-to-br ${avatarGradient}`
                )}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-primary dark:text-primary" />
                ) : (
                    <Sparkles className="w-4 h-4 text-primary dark:text-primary" />
                )}
            </div>

            {/* Bubble + Metadata */}
            <div className={cn("max-w-[80%] flex flex-col", isUser ? "items-end" : "items-start")}>
                {/* Bubble */}
                <div
                    className={cn(
                        "px-4 py-3 text-sm leading-relaxed relative",
                        "shadow-sm transition-all duration-200",
                        isUser
                            ? "bg-gradient-to-br from-primary to-primary-600 text-white rounded-2xl rounded-tl-md shadow-primary/15"
                            : isError
                            ? "bg-red-50/80 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-200/60 dark:border-red-800/40 rounded-2xl rounded-tr-md backdrop-blur-sm"
                            : "bg-card/80 dark:bg-muted/40 backdrop-blur-sm text-foreground border border-border/40 dark:border-border/20 rounded-2xl rounded-tr-md"
                    )}
                >
                    {isUser ? (
                        <span className="whitespace-pre-wrap">{msgText}</span>
                    ) : msgText ? (
                        <div className="prose-chat">
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 mr-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 mr-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                                    code: ({ children }) => (
                                        <code className="bg-primary/8 dark:bg-primary/15 text-primary-700 dark:text-primary-300 
                                                        rounded-md px-1.5 py-0.5 text-xs font-mono border border-primary/10 dark:border-primary/20">
                                            {children}
                                        </code>
                                    ),
                                    pre: ({ children }) => (
                                        <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-xl p-4 my-2 
                                                       overflow-x-auto text-xs font-mono border border-gray-700/50">
                                            {children}
                                        </pre>
                                    ),
                                    a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer"
                                           className="text-primary underline underline-offset-2 hover:text-primary-600 transition-colors">
                                            {children}
                                        </a>
                                    ),
                                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-foreground">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 text-foreground">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-r-2 border-primary/30 pr-3 my-2 text-foreground/70 italic">
                                            {children}
                                        </blockquote>
                                    ),
                                    hr: () => <hr className="my-3 border-border/40" />,
                                }}
                            >
                                {displayedText + (isStreaming ? " ▍" : "")}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic text-xs">جاري معالجة الرد...</span>
                    )}
                </div>

                {/* Metadata row: timestamp + copy button */}
                <div className={cn(
                    "flex items-center gap-2 mt-1 px-1",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}>
                    {timestamp && (
                        <span className="text-[10px] text-muted-foreground/50">{timestamp}</span>
                    )}
                    {!isUser && msgText && (
                        <button
                            onClick={copyToClipboard}
                            className="p-1 rounded-md hover:bg-muted/50 dark:hover:bg-muted/30 
                                       text-muted-foreground/40 hover:text-muted-foreground/70
                                       transition-all duration-200"
                            title="نسخ الرد"
                        >
                            {copied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.article>
    );
}
