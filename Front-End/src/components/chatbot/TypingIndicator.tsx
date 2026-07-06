import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: "spring", damping: 20 }}
            className="flex gap-2.5 items-end"
        >
            {/* Bot avatar */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-purple-400/20 
                           dark:from-primary/30 dark:to-purple-500/30
                           flex items-center justify-center shrink-0
                           border border-primary/10 dark:border-primary/20 shadow-sm">
                <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Sparkles className="w-4 h-4 text-primary/70" />
                </motion.div>
            </div>

            {/* Typing bubble */}
            <div
                role="status"
                aria-live="polite"
                className="relative px-5 py-3.5 bg-card/80 dark:bg-muted/40 backdrop-blur-sm
                           border border-border/30 dark:border-border/15
                           rounded-2xl rounded-br-md shadow-sm
                           flex items-center gap-2"
            >
                <span className="sr-only">جاري الكتابة...</span>

                {/* Animated text shimmer */}
                <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground/50 font-medium">يفكر</span>
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="text-xs text-muted-foreground/50"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                        >
                            .
                        </motion.span>
                    ))}
                </div>

                {/* Separator */}
                <div className="w-px h-4 bg-border/30 dark:bg-border/15 mx-1" />

                {/* Bouncing dots */}
                <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full bg-primary/50 dark:bg-primary/40"
                            animate={{
                                y: [0, -4, 0],
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                {/* Blinking cursor */}
                <motion.div
                    aria-hidden="true"
                    className="w-0.5 h-4 bg-primary/50 dark:bg-primary/40 rounded-full"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
            </div>
        </motion.div>
    );
}
