import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    UserPlus,
    Target,
    Stethoscope,
    Heart,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';
import { HowItWorksStep } from '../../services/landingService';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import './Landing.css';

interface HowItWorksSectionProps {
    data: HowItWorksStep[];
}

const STEP_ICONS = [
    { icon: UserPlus, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
    { icon: Target, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-500' },
    { icon: Stethoscope, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-500' },
    { icon: Heart, gradient: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-500' },
];

const STEP_ACCENTS = [
    'border-primary/30 group-hover:border-primary',
    'border-violet-500/30 group-hover:border-violet-500',
    'border-emerald-500/30 group-hover:border-emerald-500',
    'border-rose-500/30 group-hover:border-rose-500',
];

const BADGE_COLORS = [
    'bg-primary text-white',
    'bg-violet-500 text-white',
    'bg-emerald-500 text-white',
    'bg-rose-500 text-white',
];

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ data }) => {
    const { user, userType } = useAuth();
    const isLoggedIn = !!user && userType === 'patient';

    return (
        <section className="py-28 bg-muted relative overflow-hidden" dir="rtl">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/8 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/4 rounded-full blur-[150px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest mb-6">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        بساطة الاستخدام
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-foreground mb-5 tracking-tighter leading-tight">
                        ابدأي رحلتك{' '}
                        <span className="relative">
                            <span className="text-primary">في دقائق معدودة</span>
                            <motion.span
                                className="absolute -bottom-1 right-0 left-0 h-1 bg-primary/30 rounded-full"
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                            />
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
                        خطوات بسيطة وسهلة تضمن لكِ الحصول على أفضل رعاية صحية في أسرع وقت ممكن.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative max-w-5xl mx-auto">

                    {/* Desktop Connecting Line */}
                    <div className="absolute top-[52px] right-12 left-12 h-px bg-border hidden lg:block overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-l from-rose-400 via-emerald-400 via-violet-400 to-primary"
                            initial={{ x: '100%' }}
                            whileInView={{ x: '0%' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.map((step, index) => {
                            const meta = STEP_ICONS[index % STEP_ICONS.length];
                            const StepIcon = meta.icon;
                            return (
                                <motion.div
                                    key={step.step}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.12, duration: 0.5 }}
                                    className="relative group"
                                >
                                    <div className={cn(
                                        "relative flex flex-col items-center text-center p-6 rounded-3xl border bg-card transition-all duration-500",
                                        "hover:shadow-xl hover:-translate-y-2",
                                        STEP_ACCENTS[index % STEP_ACCENTS.length]
                                    )}>

                                        {/* Step Badge */}
                                        <div className={cn(
                                            "absolute -top-3 -right-3 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center z-10 shadow-lg ring-2 ring-card",
                                            BADGE_COLORS[index % BADGE_COLORS.length]
                                        )}>
                                            {step.step}
                                        </div>

                                        {/* Icon */}
                                        <div className="relative mb-6 mt-2">
                                            <div className={cn(
                                                "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                                                meta.gradient,
                                                `border border-${meta.iconColor.replace('text-', '')}/20`
                                            )}>
                                                <StepIcon className={cn("w-8 h-8", meta.iconColor)} />
                                            </div>
                                            {/* Glow */}
                                            <div className={cn(
                                                "absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500",
                                                meta.gradient
                                            )} />
                                        </div>

                                        <h3 className="text-lg font-black text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Mobile Arrow */}
                                    {index < data.length - 1 && (
                                        <div className="flex justify-center lg:hidden my-4 text-muted-foreground/40">
                                            <div className="w-px h-6 bg-border" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* CTA - Hidden for logged-in patients */}
                {!isLoggedIn && (
                    <motion.div
                        className="mt-20 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        <Link
                            to="/register"
                            className={cn(
                                "inline-flex items-center gap-3 px-10 py-4 rounded-2xl",
                                "bg-primary text-white font-black text-lg shadow-lg",
                                "hover:shadow-xl hover:scale-105 hover:bg-primary/90",
                                "active:scale-95 transition-all duration-300 group"
                            )}
                        >
                            ابدأي الآن مجاناً
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform duration-300" />
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground font-medium">
                            بدون رسوم • بدون بطاقة ائتمان
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default HowItWorksSection;
