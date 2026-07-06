import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWindow } from "@/components/chatbot/ChatWindow";

export default function ChatbotPage() {
    const navigate = useNavigate();
    const { user, userType, loading } = useAuth();

    if (loading) {
        return (
            <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
                {/* Decorative background blobs for loading state */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-5 relative z-10"
                >
                    <div className="relative">
                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-primary/20 to-purple-500/20 
                                       flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10 backdrop-blur-md">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                        <h3 className="font-bold text-lg text-foreground/80">جاري تهيئة المساعدة الذكية</h3>
                        <div className="w-32 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                style={{ width: "50%" }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            {/* Ambient background glow for the entire page */}
            <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header bar */}
            <header className="relative flex items-center justify-between px-6 py-4 
                           bg-card/70 dark:bg-card/40 backdrop-blur-2xl
                           border-b border-border/40 dark:border-border/20 
                           shadow-sm shadow-black/5 z-20">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-xl hover:bg-muted/60 dark:hover:bg-muted/40 
                                   transition-all duration-200 text-muted-foreground hover:text-foreground
                                   border border-transparent hover:border-border/50"
                        aria-label="رجوع"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-sm" />
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-purple-500/15 
                                           flex items-center justify-center border border-primary/20 shadow-inner">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground leading-tight">
                                المساعدة الذكية
                            </h1>
                            <p className="text-[11px] text-muted-foreground font-medium">
                                وداد — رفيقتك الصحية
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Full-page chat window */}
            <main className="flex-1 flex items-stretch p-4 sm:p-6 z-10 min-h-0">
                <div className="w-full max-w-7xl mx-auto h-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, type: "spring", damping: 25 }}
                        className="h-full rounded-3xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30 ring-1 ring-border/50"
                    >
                        <ChatWindow
                            isAuthenticated={!!user && userType === "patient"}
                            onClose={() => navigate(-1)}
                            isFullPage
                        />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
