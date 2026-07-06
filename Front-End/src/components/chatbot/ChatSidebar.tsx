import { useState } from "react";
import { Plus, MessageSquare, Pencil, Trash2, ChevronRight, Loader2, Sparkles, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatSession } from "@/types/chatbot";

interface ChatSidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    isCollapsed: boolean;
    isLoading?: boolean;
    isActionLoading?: boolean;
    onToggle: () => void;
    onNewConversation: () => void;
    onLoadSession: (sid: string) => void;
    onRenameSession: (sid: string, title: string) => void;
    onDeleteSession: (sid: string, title: string) => void;
}

export function ChatSidebar({
    sessions, currentSessionId, isCollapsed, isLoading = false, isActionLoading = false,
    onToggle, onNewConversation, onLoadSession, onRenameSession, onDeleteSession,
}: ChatSidebarProps) {
    const [hoveredSession, setHoveredSession] = useState<string | null>(null);

    const formatSessionDate = (dateString?: string) => {
        if (!dateString) return "مؤخراً";
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `اليوم، ${date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return "أمس";
        }
        return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    };

    return (
        <>
            <motion.button 
                onClick={onToggle}
                initial={false}
                animate={{ 
                    right: isCollapsed ? "16px" : "16px", 
                    opacity: 1 
                }}
                className="absolute top-5 z-30 p-2.5 rounded-full 
                           bg-background/80 dark:bg-muted/80 backdrop-blur-xl
                           border border-border/50 shadow-sm
                           hover:bg-card dark:hover:bg-muted hover:shadow-md
                           transition-all duration-300 text-muted-foreground hover:text-foreground"
                title={isCollapsed ? "فتح القائمة" : "إغلاق القائمة"}
            >
                <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <ChevronRight className="w-4 h-4" />
                </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0, x: 20 }}
                        animate={{ width: 320, opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="h-full border-l border-border/30 dark:border-border/15
                                   bg-background/60 dark:bg-background/40 backdrop-blur-3xl
                                   flex flex-col overflow-hidden shrink-0 relative z-20"
                    >
                        {/* Premium Soft Lighting Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 right-0 w-full h-48 bg-gradient-to-b from-primary/5 to-transparent" />
                        </div>

                        <div className="flex flex-col h-full w-[320px] relative">
                            
                            <div className="p-5 border-b border-border/20">
                                <motion.button 
                                    whileHover={{ scale: 1.01, y: -1 }} 
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onNewConversation}
                                    className="w-full flex items-center justify-between rounded-2xl
                                               bg-gradient-to-r from-card to-card/50 dark:from-muted/50 dark:to-muted/30
                                               border border-border/50 dark:border-border/30
                                               p-1.5 pl-5 transition-all duration-300
                                               hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                                               dark:hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.1)]
                                               group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 
                                                        flex items-center justify-center text-primary
                                                        group-hover:bg-primary group-hover:text-white
                                                        transition-all duration-300 shadow-inner">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="text-[14px] font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                                            محادثة جديدة
                                        </span>
                                    </div>
                                    <Sparkles className="w-4.5 h-4.5 text-primary/0 group-hover:text-primary/60 transition-all duration-300 transform group-hover:rotate-12" />
                                </motion.button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
                                {isLoading ? (
                                    <div className="space-y-4 px-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex gap-3.5 items-center opacity-50">
                                                <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
                                                <div className="space-y-2.5 w-full">
                                                    <div className="h-3 w-2/3 bg-muted rounded-full animate-pulse" />
                                                    <div className="h-2 w-1/3 bg-muted/60 rounded-full animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center justify-center h-full text-center px-6"
                                    >
                                        <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-5 border border-primary/10 shadow-sm">
                                            <MessageSquare className="w-7 h-7 text-primary/40" />
                                        </div>
                                        <p className="text-[15px] font-bold text-foreground/80 mb-1.5">مساحتك الخاصة</p>
                                        <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
                                            جميع محادثاتك مع المساعدة الذكية ستظهر هنا بأمان وسرية تامة.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2 mb-4">
                                            سجل المحادثات
                                        </p>
                                        
                                        {sessions.map((session, idx) => {
                                            const isActive = currentSessionId === session.session_id;
                                            const isHovered = hoveredSession === session.session_id;

                                            return (
                                                <motion.div key={session.session_id}
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="relative group"
                                                    onMouseEnter={() => setHoveredSession(session.session_id)}
                                                    onMouseLeave={() => setHoveredSession(null)}
                                                >
                                                    <button onClick={() => onLoadSession(session.session_id)} 
                                                        className={`w-full text-right p-3 rounded-[20px] transition-all duration-300 flex items-center gap-3.5 relative overflow-hidden
                                                            ${isActive 
                                                                ? "bg-primary/5 dark:bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                                                                : "hover:bg-muted/40"
                                                            }`}
                                                    >
                                                        {isActive && (
                                                            <motion.div layoutId="activeSessionIndicator" 
                                                                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
                                                        )}

                                                        <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-300
                                                            ${isActive 
                                                                ? "bg-gradient-to-br from-primary to-primary-600 text-white shadow-md shadow-primary/20" 
                                                                : "bg-background border border-border/60 text-muted-foreground/70 group-hover:border-primary/30 group-hover:text-primary/70"}`}
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </div>

                                                        <div className="flex-1 min-w-0 pr-1">
                                                            <div className={`text-[13px] font-bold truncate transition-colors duration-300 ${isActive ? "text-primary dark:text-primary-400" : "text-foreground/80 group-hover:text-foreground"}`}>
                                                                {session.title || "محادثة بدون عنوان"}
                                                            </div>
                                                            <div className="text-[11px] flex items-center gap-1.5 mt-1 font-medium text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{formatSessionDate(session.last_message_at)}</span>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Elegant Floating Actions */}
                                                    <AnimatePresence>
                                                        {isHovered && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.9, x: -5 }} 
                                                                animate={{ opacity: 1, scale: 1, x: 0 }} 
                                                                exit={{ opacity: 0, scale: 0.9, x: -5 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="absolute top-1/2 -translate-y-1/2 left-2 flex items-center gap-1 
                                                                           bg-background/95 dark:bg-muted/95 backdrop-blur-xl rounded-[14px] p-1 
                                                                           shadow-lg border border-border/40"
                                                            >
                                                                <button onClick={(e) => { e.stopPropagation(); onRenameSession(session.session_id, session.title || ""); }}
                                                                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors"
                                                                    title="تعديل الاسم" disabled={isActionLoading}>
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <div className="w-px h-4 bg-border/50" />
                                                                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.session_id, session.title || "محادثة"); }}
                                                                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground/70 hover:text-red-500 transition-colors"
                                                                    title="حذف المحادثة" disabled={isActionLoading}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {isActionLoading && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-5 left-5 right-5 p-3.5 bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl flex items-center justify-center gap-2.5 z-50"
                                    >
                                        <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" />
                                        <span className="text-[13px] font-bold text-foreground/90">جاري التنفيذ...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
