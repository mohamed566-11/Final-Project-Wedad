import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAiCenterHub } from "@/hooks/useAiCenter";
import {
    Activity,
    ShieldCheck,
    ChevronLeft,
    Brain,
    HeartPulse,
    Baby,
    Clock,
    Droplet,
    ShieldAlert,
    Shield,
    Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const AiCenterHub: React.FC = () => {
    const { data: hubData, isLoading, isError } = useAiCenterHub();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 120, damping: 14 }
        },
    };

    const handleCardClick = (path: string) => {
        navigate(`/patient/ai-center/${path}`);
    };

    const renderMedicalIcon = (id: string) => {
        switch (id) {
            case "gdm":
                return (
                    <div className="relative flex items-center justify-center">
                        <Droplet className="w-8 h-8 text-white relative z-10 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                        <Activity className="w-4 h-4 text-rose-200 absolute -bottom-1 -right-1 z-20 group-hover:rotate-12 transition-transform duration-500" strokeWidth={2.5} />
                    </div>
                );
            case "preeclampsia":
                return (
                    <div className="relative flex items-center justify-center">
                        <HeartPulse className="w-8 h-8 text-white relative z-10 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                        <ShieldAlert className="w-4 h-4 text-indigo-200 absolute -bottom-1 -right-1 z-20 group-hover:scale-120 transition-transform duration-500" strokeWidth={2} />
                    </div>
                );
            case "preterm":
                return (
                    <div className="relative flex items-center justify-center">
                        <Baby className="w-8 h-8 text-white relative z-10 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                        <Shield className="w-4 h-4 text-amber-200 absolute -bottom-1 -right-1 z-20 group-hover:rotate-12 transition-transform duration-500" strokeWidth={2} />
                    </div>
                );
            case "scbu":
                return (
                    <div className="relative flex items-center justify-center">
                        <Activity className="w-8 h-8 text-white relative z-10 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                        <Shield className="w-4 h-4 text-cyan-200 absolute -bottom-1 -right-1 z-20 group-hover:rotate-12 transition-transform duration-500" strokeWidth={2} />
                    </div>
                );
            default:
                return <Brain className="w-8 h-8 text-white" />;
        }
    };

    const renderRiskStatus = (risk: string) => {
        const normalizedRisk = risk?.toLowerCase() || '';
        if (normalizedRisk.includes('high') || normalizedRisk.includes('عالية') || normalizedRisk.includes('high_risk')) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    مستوى خطورة مرتفع
                </span>
            );
        } else if (normalizedRisk.includes('moderate') || normalizedRisk.includes('medium') || normalizedRisk.includes('متوسطة') || normalizedRisk.includes('mod')) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    مستوى خطورة متوسط
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    مستوى خطورة منخفض
                </span>
            );
        }
    };

    const getGradientMap = (id: string) => {
        switch (id) {
            case "gdm": return "from-rose-500 to-pink-500";
            case "preeclampsia": return "from-blue-500 to-indigo-600";
            case "preterm": return "from-amber-400 to-orange-500";
            case "scbu": return "from-cyan-400 to-teal-500";
            default: return "from-slate-500 to-slate-800";
        }
    };

    const getIconGlowMap = (id: string) => {
        switch (id) {
            case "gdm": return "shadow-[0_8px_25px_rgba(244,63,94,0.35)]";
            case "preeclampsia": return "shadow-[0_8px_25px_rgba(79,70,229,0.35)]";
            case "preterm": return "shadow-[0_8px_25px_rgba(249,115,22,0.35)]";
            case "scbu": return "shadow-[0_8px_25px_rgba(6,182,212,0.35)]";
            default: return "shadow-[0_8px_25px_rgba(100,116,139,0.35)]";
        }
    };

    const getCardBgGradientMap = (id: string) => {
        switch (id) {
            case "gdm": return "from-rose-50/[0.45] via-white/50 to-pink-50/[0.25] dark:from-rose-950/15 dark:via-slate-900/60 dark:to-pink-950/10 hover:from-rose-50/[0.7] hover:to-pink-50/[0.5]";
            case "preeclampsia": return "from-indigo-50/[0.45] via-white/50 to-blue-50/[0.25] dark:from-indigo-950/15 dark:via-slate-900/60 dark:to-blue-950/10 hover:from-indigo-50/[0.7] hover:to-blue-50/[0.5]";
            case "preterm": return "from-orange-50/[0.45] via-white/50 to-amber-50/[0.25] dark:from-orange-950/15 dark:via-slate-900/60 dark:to-amber-950/10 hover:from-orange-50/[0.7] hover:to-amber-50/[0.5]";
            case "scbu": return "from-cyan-50/[0.45] via-white/50 to-teal-50/[0.25] dark:from-cyan-950/15 dark:via-slate-900/60 dark:to-teal-950/10 hover:from-cyan-50/[0.7] hover:to-teal-50/[0.5]";
            default: return "from-slate-50/[0.45] via-white/50 to-slate-50/[0.25]";
        }
    };

    const getCardBorderMap = (id: string) => {
        switch (id) {
            case "gdm": return "border-rose-100 hover:border-rose-350 hover:border-rose-300 dark:border-rose-900/40 dark:hover:border-rose-800/60";
            case "preeclampsia": return "border-indigo-100 hover:border-indigo-350 hover:border-indigo-300 dark:border-indigo-900/40 dark:hover:border-indigo-800/60";
            case "preterm": return "border-orange-100 hover:border-orange-350 hover:border-orange-300 dark:border-orange-900/40 dark:hover:border-orange-850/65";
            case "scbu": return "border-cyan-100 hover:border-cyan-350 hover:border-cyan-300 dark:border-cyan-900/40 dark:hover:border-cyan-850/65";
            default: return "border-slate-100 hover:border-slate-300";
        }
    };

    const getCardGlowMap = (id: string) => {
        switch (id) {
            case "gdm": return "hover:shadow-rose-500/5 group-hover:shadow-[0_20px_50px_rgba(244,63,94,0.08)]";
            case "preeclampsia": return "hover:shadow-indigo-500/5 group-hover:shadow-[0_20px_50px_rgba(99,102,241,0.08)]";
            case "preterm": return "hover:shadow-orange-500/5 group-hover:shadow-[0_20px_50px_rgba(249,115,22,0.08)]";
            case "scbu": return "hover:shadow-cyan-500/5 group-hover:shadow-[0_20px_50px_rgba(6,182,212,0.08)]";
            default: return "hover:shadow-slate-500/5";
        }
    };

    const getAccentMap = (id: string) => {
        switch (id) {
            case "gdm": return "bg-rose-500/10";
            case "preeclampsia": return "bg-indigo-500/10";
            case "preterm": return "bg-orange-500/10";
            case "scbu": return "bg-cyan-500/10";
            default: return "bg-slate-500/10";
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <PublicHeader />

            <main className="flex-grow pt-24 pb-12">
                <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 font-primary">

                    {/* Premium Header */}
                    <motion.header
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                    >
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
                            <div>
                                <div className="mb-4 text-right">
                                    <BackButton />
                                </div>
                                <div className="mb-6">
                                    <Breadcrumbs items={[
                                        { label: 'الذكاء الاصطناعي' }
                                    ]} />
                                </div>

                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">مركز الذكاء الاصطناعي</h1>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-base font-medium mr-1 max-w-md">تحليل دقيق وتوصيات صحية مخصصة لحملك باستخدام أحدث نماذج التعلم العميق</p>
                            </div>

                            {isAuthenticated && (
                                <div className="flex flex-col gap-3">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-border/80 shadow-sm"
                                        onClick={() => handleCardClick('history')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="p-2 bg-indigo-50 rounded-xl">
                                            <Clock className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">السجل</p>
                                            <p className="text-xs font-bold text-muted-foreground">التنبؤات السابقة</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-border/80 shadow-sm"
                                    >
                                        <div className="p-2 bg-emerald-50 rounded-xl">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">طبي</p>
                                            <p className="text-xs font-bold text-muted-foreground">معتمدة علمياً</p>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* Subtle divider */}
                        <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent" />
                    </motion.header>

                    {/* Quick Stats Grid */}
                    {isAuthenticated && !isLoading && !isError && hubData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                        >
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">إجمالي التنبؤات</p>
                                    <p className="text-xl font-bold text-slate-900">{hubData.stats.total_predictions}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">تنبيهات عالية الخطورة</p>
                                    <p className="text-xl font-bold text-rose-600">{hubData.stats.high_risk_alerts}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Models Grid */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-[260px] rounded-[2rem] bg-slate-200" />
                            ))
                        ) : isError ? (
                            <div className="col-span-full text-center py-12 text-slate-500 font-medium text-lg">
                                خطأ في جلب بيانات الذكاء الاصطناعي.. يرجى المحاولة مرة أخرى لاحقاً
                            </div>
                        ) : (
                            hubData?.models.map((model) => {
                                const latestPrediction = model.latest;

                                return (
                                    <motion.div key={model.id} variants={item}>
                                        <div
                                            onClick={() => handleCardClick(model.id)}
                                            className={cn(
                                                "group relative rounded-[28px] transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden cursor-pointer",
                                                "border bg-gradient-to-br shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]",
                                                getCardBgGradientMap(model.id),
                                                getCardBorderMap(model.id),
                                                getCardGlowMap(model.id)
                                            )}
                                        >
                                            {/* Full-card glass light sweep animation */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out pointer-events-none z-20" />

                                            {/* Double Glassmorphic Gradient Border */}
                                            <div className="absolute inset-0 rounded-[28px] border border-white/20 dark:border-white/10 pointer-events-none z-10 transition-colors duration-500 group-hover:border-white/45" />

                                            {/* Soft glassmorphism background shapes */}
                                            <div className="absolute inset-0 bg-white/[0.02] dark:bg-black/[0.15] backdrop-blur-[12px] -z-10" />

                                            {/* Multi-layered Neon Blobs (Expand on hover) */}
                                            <div className={cn(
                                                "absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-130 group-hover:opacity-40 animate-pulse",
                                                model.id === "gdm" ? "bg-rose-300" :
                                                    model.id === "preeclampsia" ? "bg-indigo-300" :
                                                        model.id === "scbu" ? "bg-cyan-300" : "bg-orange-300"
                                            )} />
                                            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:-translate-y-8 transition-transform duration-1000" />
                                            <div className={cn(
                                                "absolute right-[10%] bottom-[-5%] w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-35 transition-all duration-700 translate-y-10 group-hover:translate-y-0",
                                                model.id === "gdm" ? "bg-pink-300" :
                                                    model.id === "preeclampsia" ? "bg-blue-300" :
                                                        model.id === "scbu" ? "bg-teal-300" : "bg-amber-300"
                                            )} />

                                            <div className="relative z-10 p-8 flex flex-col min-h-[320px]">
                                                {/* Header Row: Floating Icon Container & Chevron */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={cn(
                                                        "relative p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg",
                                                        "transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                                                        getGradientMap(model.id),
                                                        getIconGlowMap(model.id)
                                                    )}>
                                                        {renderMedicalIcon(model.id)}
                                                    </div>
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 shadow-md hover:bg-slate-100 dark:hover:bg-slate-850">
                                                        <ChevronLeft className="w-5 h-5 text-slate-650 dark:text-slate-300 translate-x-px group-hover:-translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>

                                                {/* Title & Description */}
                                                <div className="mb-auto transform transition-transform duration-500 group-hover:translate-x-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn(
                                                            "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border backdrop-blur-md",
                                                            model.id === "gdm" ? "bg-rose-50/80 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30" :
                                                                model.id === "preeclampsia" ? "bg-indigo-50/80 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30" :
                                                                    model.id === "scbu" ? "bg-cyan-50/80 text-cyan-600 border-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/30" :
                                                                        "bg-orange-50/80 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30"
                                                        )}>
                                                            {model.id === "gdm" ? "فحص السكري" :
                                                                model.id === "preeclampsia" ? "فحص التسمم" :
                                                                    model.id === "scbu" ? "تقييم SCBU" : "فحص الولادة"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">ذكاء اصطناعي</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-850 dark:text-white leading-tight mb-2">{model.name_ar}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold line-clamp-2">{model.description_ar}</p>
                                                </div>

                                                {/* Footer: Status Badges / Date */}
                                                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800/80">
                                                    {!isAuthenticated ? (
                                                        <div className="flex items-center gap-2 text-slate-500">
                                                            <div className="p-1 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1.5 flex-row-reverse backdrop-blur-md">
                                                                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                                                                <span className="text-xs font-bold text-slate-500">يتطلب تسجيل دخول</span>
                                                            </div>
                                                        </div>
                                                    ) : latestPrediction ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">آخر فحص</span>
                                                                <span className="text-xs text-slate-600 dark:text-slate-350 font-extrabold">
                                                                    {format(new Date(latestPrediction.created_at), 'd MMMM yyyy', { locale: ar })}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                {renderRiskStatus(latestPrediction.risk_badge || latestPrediction.risk_level || "")}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between w-full group/btn">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-slate-400 font-semibold">ابدئي التقييم</span>
                                                                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 group-hover/btn:text-indigo-650 transition-colors">لا توجد فحوصات سابقة</span>
                                                            </div>
                                                            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/btn:bg-slate-950 group-hover/btn:text-white transition-all duration-300 shadow-sm">
                                                                <ChevronLeft className="w-4 h-4 translate-x-px group-hover/btn:-translate-x-1 transition-transform" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default AiCenterHub;
