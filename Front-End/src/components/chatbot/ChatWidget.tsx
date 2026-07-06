import { useState, useEffect, useCallback } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ChatWindow } from "./ChatWindow";
import { cn } from "@/lib/utils";
import { CHATBOT_UI } from "@/constants/chatbot-strings";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, userType } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleClose = useCallback(() => setIsOpen(false), []);
    const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);
    const handleOpenFullPage = useCallback(() => {
        setIsOpen(false);
        navigate("/patient/chatbot");
    }, [navigate]);

    // مفتاح ESC لإغلاق الشات
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                handleClose();
                document.getElementById("chat-toggle-btn")?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    // Hide chatbot on doctor portal and admin routes (but keep it on public /doctors page)
    const isDoctorPortal = location.pathname === "/doctor" || location.pathname.startsWith("/doctor/");
    const isAdminPortal = location.pathname === "/admin" || location.pathname.startsWith("/admin/");

    if (isDoctorPortal || isAdminPortal) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50" dir="rtl">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] sm:hidden z-[-1]"
                            onClick={handleClose}
                        />
                        <motion.div
                            id="chat-window-container"
                            initial={{ opacity: 0, scale: 0.85, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 24 }}
                            transition={{ type: "spring", damping: 22, stiffness: 280 }}
                            className="absolute bottom-[72px] right-0 mb-2"
                        >
                            <ChatWindow
                                isAuthenticated={!!user && userType === "patient"}
                                onClose={handleClose}
                                onOpenFullPage={handleOpenFullPage}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                id="chat-toggle-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleToggle}
                aria-label={isOpen ? CHATBOT_UI.closeChat : CHATBOT_UI.openChat}
                aria-expanded={isOpen}
                aria-controls="chat-window-container"
                className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center relative",
                    "bg-gradient-to-br from-primary to-purple-600 text-white",
                    "shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40",
                    "transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
                )}
            >
                {/* Pulse ring when closed */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping opacity-40 pointer-events-none" />
                )}

                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X aria-hidden="true" className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Sparkles aria-hidden="true" className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
