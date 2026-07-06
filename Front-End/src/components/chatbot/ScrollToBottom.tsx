import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToBottomProps {
    isVisible: boolean;
    onClick: () => void;
}

export function ScrollToBottom({ isVisible, onClick }: ScrollToBottomProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    onClick={onClick}
                    aria-label="التمرير للأسفل"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20
                               w-9 h-9 rounded-full 
                               bg-card/90 dark:bg-muted/90 backdrop-blur-md
                               border border-border/60 dark:border-border/40
                               shadow-lg shadow-black/10 dark:shadow-black/30
                               flex items-center justify-center
                               hover:bg-card dark:hover:bg-muted hover:shadow-xl
                               hover:-translate-y-0.5 transition-all duration-200
                               text-muted-foreground hover:text-foreground"
                >
                    <ArrowDown className="w-4 h-4" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
