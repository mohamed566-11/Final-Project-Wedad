import { motion } from "framer-motion";

interface SuggestedQuestionsProps {
    questions: string[];
    onSelect: (question: string) => void;
}

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
    if (!questions || questions.length === 0) return null;

    return (
        <div className="flex flex-col gap-2.5 w-full">
            {questions.map((question, idx) => (
                <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(question)}
                    className="text-right px-5 py-3.5 text-sm font-medium
                               bg-card/80 dark:bg-muted/40 backdrop-blur-sm
                               border border-border/60 dark:border-border/30 rounded-2xl
                               text-foreground/75 hover:text-foreground
                               hover:bg-primary/5 dark:hover:bg-primary/10
                               hover:border-primary/30 dark:hover:border-primary/40
                               transition-all duration-200 
                               shadow-sm hover:shadow-md hover:shadow-primary/5
                               group"
                >
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary/70 
                                        transition-colors shrink-0" />
                        {question}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}
