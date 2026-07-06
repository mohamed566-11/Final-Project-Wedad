import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, Heart, Shield, Baby } from "lucide-react";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { CHATBOT_UI } from "@/constants/chatbot-strings";
import type { ChatConfig } from "@/types/chatbot";

interface WelcomeScreenProps {
    config: ChatConfig & { welcome_message: string; suggested_questions: string[] };
    onSelectQuestion: (question: string) => void;
    displayName: string;
}

// Floating particles for visual richness
function FloatingParticles() {
    const particles = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        size: Math.random() * 6 + 3,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        duration: Math.random() * 4 + 4,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-primary/15 dark:bg-primary/10"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 15, -15, 0],
                        opacity: [0.3, 0.7, 0.3],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

// Orbiting icons around the avatar
function OrbitingIcons() {
    const icons = [
        { Icon: Heart, color: "text-rose-400", delay: 0 },
        { Icon: Shield, color: "text-blue-400", delay: 1.3 },
        { Icon: Baby, color: "text-purple-400", delay: 2.6 },
    ];

    return (
        <>
            {icons.map(({ Icon, color, delay }, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${color}`}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 0.6, 0],
                        rotate: [0, 360],
                        x: [0, 35 * Math.cos((i * 2 * Math.PI) / 3), 0],
                        y: [0, 35 * Math.sin((i * 2 * Math.PI) / 3), 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay,
                        ease: "easeInOut",
                    }}
                >
                    <Icon className="w-3.5 h-3.5" />
                </motion.div>
            ))}
        </>
    );
}

export function WelcomeScreen({ config, onSelectQuestion, displayName }: WelcomeScreenProps) {

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center relative overflow-hidden">
            {/* Floating particles */}
            <FloatingParticles />

            {/* Large decorative gradient blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/12 via-purple-400/8 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-500/10 via-pink-400/6 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/8 to-cyan-400/5 rounded-full blur-2xl pointer-events-none" />

            {/* Bot avatar with orbit effect */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 150, delay: 0.1 }}
                className="relative mb-6"
            >
                {/* Glow ring */}
                <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 via-purple-400/15 to-pink-400/20 
                               rounded-[2rem] blur-xl animate-pulse-soft" />
                
                {/* Avatar container */}
                <div className="relative w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-purple-400/10 to-pink-400/15 
                               dark:from-primary/25 dark:via-purple-500/20 dark:to-pink-500/25
                               flex items-center justify-center
                               shadow-xl shadow-primary/15 dark:shadow-primary/25
                               border border-primary/15 dark:border-primary/25
                               backdrop-blur-sm">
                    <motion.div
                        animate={{ rotateY: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-11 h-11 text-primary dark:text-primary" />
                    </motion.div>

                    {/* Orbiting health icons */}
                    <OrbitingIcons />

                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-background dark:bg-background 
                                   flex items-center justify-center border-2 border-background dark:border-background">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
                            <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-50" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bot name with gradient text */}
            <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-2xl font-extrabold mb-1.5 bg-gradient-to-l from-primary via-purple-500 to-primary 
                          bg-clip-text text-transparent"
            >
                {displayName}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-xs font-medium text-muted-foreground/60 mb-5 flex items-center gap-1.5"
            >
                <MessageCircle className="w-3 h-3" />
                مساعدتك الذكية للصحة النسائية
            </motion.p>

            {/* Welcome message card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring", damping: 20 }}
                className="max-w-sm mb-8 relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-purple-400/8 rounded-2xl blur-sm" />
                <div className="relative px-6 py-4 bg-card/60 dark:bg-muted/30 backdrop-blur-md 
                               rounded-2xl border border-border/40 dark:border-border/20
                               shadow-lg shadow-primary/5 dark:shadow-primary/10">
                    <p className="text-foreground/80 text-sm leading-relaxed font-medium">
                        {config.welcome_message}
                    </p>
                </div>
            </motion.div>

            {/* Suggested questions */}
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="w-full max-w-md"
            >
                <p className="text-xs font-semibold text-muted-foreground/50 mb-4 flex items-center justify-center gap-2">
                    <span className="w-10 h-px bg-gradient-to-r from-transparent to-border" />
                    {CHATBOT_UI.suggestedQuestionsLabel}
                    <span className="w-10 h-px bg-gradient-to-l from-transparent to-border" />
                </p>
                <SuggestedQuestions
                    questions={config.suggested_questions}
                    onSelect={onSelectQuestion}
                />
            </motion.div>
        </div>
    );
}
