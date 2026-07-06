import { X, RefreshCcw, Sparkles, Maximize2, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface ChatHeaderProps {
    name: string;
    botType: string;
    isLoading?: boolean;
    onClose: () => void;
    onReset?: () => void;
    onOpenFullPage?: () => void;
    onPrivacySettings?: () => void;
}

const botGradients: Record<string, string> = {
    pregnancy: "from-rose-500 via-pink-500 to-rose-600",
    motherhood: "from-primary via-primary-500 to-primary-600",
    pre_marriage: "from-purple-500 via-violet-500 to-purple-600",
    public: "from-primary via-purple-500 to-violet-600",
};

export function ChatHeader({ name, botType, isLoading = false, onClose, onReset, onOpenFullPage, onPrivacySettings }: ChatHeaderProps) {
    const gradient = botGradients[botType] || botGradients.public;

    return (
        <div className={`relative bg-gradient-to-l ${gradient} overflow-hidden`}>
            {/* Animated mesh gradient overlay */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/8 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
                <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-white/5 rounded-full blur-lg" />
                {/* Subtle noise/pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }}
                />
            </div>

            {/* Shimmer line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px">
                <motion.div
                    className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <div className="relative flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Bot avatar */}
                    <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className="relative"
                    >
                        {/* Glow behind avatar */}
                        <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-md" />
                        <div className="relative w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md 
                                       flex items-center justify-center 
                                       border border-white/25 shadow-lg shadow-black/15
                                       ring-1 ring-white/10">
                            <Sparkles className="w-5.5 h-5.5 text-white drop-shadow-sm" />
                        </div>

                        {/* Tiny status dot */}
                        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 
                                       border-2 border-white/30 shadow-lg shadow-emerald-500/40">
                            <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-40" />
                        </div>
                    </motion.div>

                    <div className="min-w-0">
                        {/* Bot name — skeleton while config loads */}
                        {isLoading ? (
                            <div className="space-y-1.5">
                                <div className="h-4 w-28 bg-white/25 rounded-lg animate-pulse" />
                                <div className="h-3 w-16 bg-white/15 rounded-md animate-pulse" />
                            </div>
                        ) : onOpenFullPage ? (
                            <button
                                onClick={onOpenFullPage}
                                className="font-bold text-sm text-white hover:text-white/90 text-right block truncate 
                                           transition-colors drop-shadow-sm"
                                title="فتح صفحة الشات الكاملة"
                            >
                                {name}
                            </button>
                        ) : (
                            <h3 className="font-bold text-sm text-white truncate drop-shadow-sm">{name}</h3>
                        )}

                        {!isLoading && (
                            <p className="text-[11px] text-white/65 font-medium mt-0.5 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-50" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                                </span>
                                متصل الآن
                            </p>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                    {onPrivacySettings && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onPrivacySettings}
                            className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200 
                                       text-white/70 hover:text-white"
                            title="إعدادات الخصوصية"
                        >
                            <Shield className="w-4 h-4" />
                        </motion.button>
                    )}
                    {onOpenFullPage && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onOpenFullPage}
                            className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200 
                                       text-white/70 hover:text-white"
                            title="فتح صفحة الشات الكاملة"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </motion.button>
                    )}
                    {onReset && (
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onReset}
                            className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200 
                                       text-white/70 hover:text-white"
                            title="محادثة جديدة"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200 
                                   text-white/70 hover:text-white"
                        title="إغلاق"
                    >
                        <X className="w-4.5 h-4.5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
