import { SendHorizontal, Square } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHATBOT_UI } from "@/constants/chatbot-strings";

const MAX_LENGTH = 1000;
const MAX_ROWS = 5;

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [text, setText] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 22 * MAX_ROWS)}px`;
    }, []);

    useEffect(() => { adjustHeight(); }, [text, adjustHeight]);
    useEffect(() => { if (!disabled) textareaRef.current?.focus(); }, [disabled]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = text.trim();
        if (trimmed && !disabled && !isOverLimit) {
            onSend(trimmed);
            setText("");
            requestAnimationFrame(() => {
                if (textareaRef.current) textareaRef.current.style.height = "auto";
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    };

    const charCount = text.length;
    const isOverLimit = charCount > MAX_LENGTH;
    const canSend = text.trim().length > 0 && !disabled && !isOverLimit;

    return (
        <div className="relative pb-2">
            <form onSubmit={handleSubmit} aria-label={CHATBOT_UI.messageFormLabel} className="w-full">
                
                <div className={`relative rounded-[32px] transition-all duration-500 ${isFocused ? "shadow-2xl shadow-primary/10" : "shadow-lg shadow-black/5 dark:shadow-black/20"}`}>
                    {isFocused && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute -inset-[1px] rounded-[34px] bg-gradient-to-r from-primary/30 via-purple-400/20 to-primary/30 blur-[2px] pointer-events-none" />
                    )}

                    <div className={`relative flex items-end gap-2 p-1.5 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-3xl border rounded-[32px] transition-all duration-300 ${
                        isFocused ? "border-primary/30 dark:border-primary/40 bg-white dark:bg-zinc-900" : "border-black/5 dark:border-white/10"
                    }`}>
                        <label htmlFor="chat-input" className="sr-only">{CHATBOT_UI.placeholder}</label>

                        <textarea ref={textareaRef} id="chat-input" rows={1} value={text}
                            onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                            placeholder={disabled ? "جاري معالجة طلبك..." : "اكتب رسالتك لوداد..."}
                            disabled={disabled} aria-required="true" aria-disabled={disabled}
                            aria-describedby="chat-char-counter" maxLength={MAX_LENGTH + 50} dir="rtl"
                            className="flex-1 px-4 py-3 mx-1 bg-transparent resize-none border-0 focus:outline-none focus:ring-0
                                       text-[15px] font-medium text-foreground leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed
                                       placeholder:text-muted-foreground/50 placeholder:font-normal scrollbar-none"
                            style={{ minHeight: "48px", maxHeight: `${24 * MAX_ROWS}px` }} />

                        <AnimatePresence mode="wait">
                            {disabled ? (
                                <motion.button key="stop" type="button"
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                    className="p-3 m-0.5 rounded-[24px] bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-red-500 transition-colors
                                               flex items-center justify-center shrink-0 h-10 w-10" title="إيقاف">
                                    <Square className="w-4 h-4 fill-current" />
                                </motion.button>
                            ) : (
                                <motion.button key="send" type="submit" disabled={!canSend}
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                    whileHover={canSend ? { scale: 1.05 } : {}} whileTap={canSend ? { scale: 0.95 } : {}}
                                    aria-label={CHATBOT_UI.send}
                                    className={`p-3 m-0.5 rounded-[24px] flex items-center justify-center shrink-0 h-10 w-10 transition-all duration-300 ${
                                        canSend
                                            ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90"
                                            : "bg-muted/40 dark:bg-white/5 text-muted-foreground/30 cursor-not-allowed"
                                    }`}>
                                    <SendHorizontal className="w-5 h-5 rtl:-translate-x-0.5 rtl:-scale-x-100" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2 px-2">
                    <p className="text-[9px] text-muted-foreground/30 font-medium hidden sm:block">
                        Enter للإرسال • Shift+Enter لسطر جديد
                    </p>
                    <AnimatePresence>
                        {charCount > 800 && (
                            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                id="chat-char-counter" aria-live="polite"
                                className={`text-[10px] font-semibold ${isOverLimit ? "text-red-500" : "text-muted-foreground/40"}`}>
                                {CHATBOT_UI.charCount(charCount)}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </form>
        </div>
    );
}
