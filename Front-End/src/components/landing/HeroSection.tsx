import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Play,
    ShieldCheck,
    Users,
    Star,
    Sparkles,
    Stethoscope,
    Calendar,
    ArrowLeft,
    HeartPulse
} from 'lucide-react';
import { HeroData } from '../../services/landingService';
import AnimatedCounter from './AnimatedCounter';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import publicService from '@/services/publicService';
import './Landing.css';

interface HeroSectionProps {
    data: HeroData;
}

const HeroSection: React.FC<HeroSectionProps> = ({ data }) => {
    // Split title into words for staggered animation
    const titleWords = data.title.split(' ');

    const { data: settingsResponse } = useQuery({
        queryKey: ["publicSiteSettings"],
        queryFn: async () => {
            const response = await publicService.getSiteSettings();
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Some endpoints wrap with { data: ... } twice implicitly or useQuery handles data: it's settingsResponse.data
    const settings = (settingsResponse as any)?.data || settingsResponse;

    return (
        <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-background" dir="rtl">
            {/* World Class Background System */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-primary-50 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                <div className="absolute top-1/2 -left-24 w-[350px] h-[350px] bg-primary-100 rounded-full blur-[100px] opacity-15"></div>

                {/* Technical Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            <div className="container mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Content Column */}
                    <div className="hero-content text-right">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 bg-primary-50/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary-100 mb-6 shadow-sm"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">مستقبل الرعاية الصحية للمرأة</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-8 leading-[1.1] tracking-tight">
                            {titleWords.map((word, i) => (
                                <motion.span
                                    key={i}
                                    className={cn("inline-block mr-2", i >= 2 ? "text-primary italic" : "")}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + (i * 0.08), duration: 0.6 }}
                                >
                                    {word}{' '}
                                </motion.span>
                            ))}
                        </h1>

                        <motion.p
                            className="text-lg md:text-xl text-muted-foreground font-medium mb-10 max-w-xl leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            {data.description}
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 mb-14"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Link
                                to={data.cta_primary.link}
                                className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-card transition-all hover:bg-primary-700 hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3 group"
                            >
                                {data.cta_primary.text}
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
                            </Link>

                            <Link
                                to={data.cta_secondary.link}
                                className="px-8 py-4 rounded-2xl bg-card text-foreground font-black text-lg border-2 border-border hover:bg-muted transition-all flex items-center justify-center gap-3 group"
                            >
                                <Play className="w-5 h-5 fill-foreground group-hover:scale-110 transition-transform" />
                                {data.cta_secondary.text}
                            </Link>
                        </motion.div>

                        {/* Trust Indicators - Compact Layout */}
                        <motion.div
                            className="grid grid-cols-3 gap-6 p-6 rounded-3xl bg-card/50 backdrop-blur-md border border-border shadow-soft relative overflow-hidden max-w-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                        >
                            {data.trust_indicators.map((indicator, index) => (
                                <div key={index} className="flex flex-col items-center text-center">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3 text-primary shadow-sm border border-white">
                                        {indicator.icon === '👨‍⚕️' ? <Stethoscope className="w-5 h-5" /> :
                                            indicator.icon === '👩' ? <Users className="w-5 h-5" /> :
                                                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />}
                                    </div>
                                    <div className="text-xl font-black text-foreground leading-none mb-1 italic">
                                        {typeof indicator.value === 'number' ? (
                                            <AnimatedCounter end={indicator.value} suffix="+" />
                                        ) : (
                                            indicator.value
                                        )}
                                    </div>
                                    <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{indicator.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Visual Column - Refined Composition */}
                    <motion.div
                        className="hero-visual relative flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="relative w-full aspect-square max-w-[450px]">
                            {/* Main Concentric Circles Decoration */}
                            <div className="absolute inset-0 border-2 border-primary-50 rounded-full animate-[spin_60s_linear_infinite] opacity-50"></div>
                            <div className="absolute inset-8 border border-primary-100 rounded-full animate-[spin_40s_linear_infinite_reverse] opacity-50"></div>

                            {/* Center Glass Card */}
                            <div className="absolute inset-[15%] bg-gradient-to-br from-primary to-primary-700 rounded-[50px] shadow-deep border-4 border-white overflow-hidden relative group">
                                <div className="absolute inset-0 opacity-20 bg-[url('/patterns/topographic.svg')] bg-repeat scale-150"></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>

                                <div className="relative h-full flex flex-col items-center justify-center p-8">
                                    <motion.div
                                        className="w-40 h-40 rounded-[3.5rem] bg-white flex items-center justify-center mb-6 border-4 border-white overflow-hidden shadow-2xl"
                                        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                    >
                                        {settings?.logo_url ? (
                                            <img src={settings.logo_url} alt={settings.site_name || "Logo"} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <HeartPulse className="w-24 h-24 text-primary" />
                                        )}
                                    </motion.div>
                                    {!settings?.logo_url && (
                                        <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter">WIDAD <span className="opacity-60">PRO</span></h2>
                                    )}
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 rounded-full bg-white/10 text-white text-[8px] font-black uppercase tracking-widest border border-white/10">متابعة دورية</div>
                                        <div className="px-3 py-1 rounded-full bg-white text-primary-700 text-[8px] font-black uppercase tracking-widest">مساعد AI ذكي</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Stats Card */}
                        <motion.div
                            className="absolute top-[10%] -right-4 bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/50 z-20 flex items-center gap-4"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                            style={{ width: 'fit-content' }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shadow-inner">
                                <Stethoscope className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">استشارات طبية</p>
                                <p className="text-sm font-black text-foreground leading-none">تواصل مباشر 24/7</p>
                            </div>
                        </motion.div>

                        {/* Floating Trust Badge */}
                        <motion.div
                            className="absolute bottom-[15%] -left-8 bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/50 z-20 flex items-center gap-4"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">تشخيص ذكي</p>
                                <p className="text-sm font-black text-foreground leading-none">نتائج دقيقة </p>
                            </div>
                        </motion.div>

                        {/* Decorative Background Aura */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[100px] -z-10 rounded-full"></div>
                    </motion.div>
                </div>
            </div>

            {/* Compact Scroll Indicator */}
            <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
                <div className="w-[1px] h-10 bg-border rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute top-0 left-0 w-full h-1/3 bg-primary rounded-full"
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                </div>
            </motion.div>
        </section>
    );
};

export default HeroSection;
