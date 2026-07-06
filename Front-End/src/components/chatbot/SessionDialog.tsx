import { motion, AnimatePresence } from "framer-motion";

interface SessionDialogProps {
    isOpen: boolean;
    mode: "rename" | "delete";
    currentTitle: string;
    renameValue: string;
    isLoading: boolean;
    onRenameChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export function SessionDialog({
    isOpen,
    mode,
    currentTitle,
    renameValue,
    isLoading,
    onRenameChange,
    onSubmit,
    onClose,
}: SessionDialogProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="w-full max-w-md rounded-2xl border border-border/60 dark:border-border/40 
                                   bg-card/95 dark:bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border/40 dark:border-border/30 bg-muted/30 dark:bg-muted/20">
                            <h3 className="text-sm font-bold text-foreground">
                                {mode === "rename" ? "تعديل اسم المحادثة" : "حذف المحادثة"}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5">
                            {mode === "rename" ? (
                                <div className="space-y-2.5">
                                    <label className="text-xs font-medium text-muted-foreground">الاسم الجديد</label>
                                    <input
                                        value={renameValue}
                                        onChange={(e) => onRenameChange(e.target.value)}
                                        placeholder="اكتب اسم المحادثة"
                                        autoFocus
                                        className="w-full rounded-xl border border-border/60 dark:border-border/40 
                                                   bg-background dark:bg-muted/50 px-4 py-3 text-sm text-foreground 
                                                   outline-none transition-all duration-200
                                                   focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                                                   placeholder:text-muted-foreground/50"
                                        maxLength={120}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && renameValue.trim()) onSubmit();
                                        }}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    هل تريد حذف المحادثة:{" "}
                                    <span className="font-bold text-foreground">{currentTitle || "محادثة"}</span>؟
                                    <br />
                                    <span className="text-xs text-red-500/80 mt-1 block">
                                        لا يمكن التراجع عن هذا الإجراء.
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border/40 dark:border-border/30 
                                       flex items-center justify-end gap-3 bg-muted/20 dark:bg-muted/10">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-xs font-medium rounded-xl border border-border/60 dark:border-border/40 
                                           text-muted-foreground hover:bg-muted/50 dark:hover:bg-muted/30 
                                           transition-all duration-200 hover:-translate-y-0.5"
                                disabled={isLoading}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={onSubmit}
                                className={`px-5 py-2.5 text-xs font-medium rounded-xl text-white transition-all duration-200
                                           hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                                           disabled:hover:translate-y-0 ${
                                    mode === "rename"
                                        ? "bg-primary hover:bg-primary-600 shadow-primary/30"
                                        : "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                                }`}
                                disabled={isLoading || (mode === "rename" && !renameValue.trim())}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        جاري...
                                    </span>
                                ) : mode === "rename" ? "حفظ" : "حذف"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
