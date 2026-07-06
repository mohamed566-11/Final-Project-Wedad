import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { trackerService } from "@/services/trackerService";
import { Smile, Weight, Calendar, Heart, ChevronLeft, Activity, ShieldCheck, Baby } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { cn } from "@/lib/utils";

interface TrackersSummaryData {
    life_stage_slug?: string;
    available_trackers?: string[];
    period?: { is_active: boolean; days_until_next: number | null };
    fertility?: { in_fertile_window: boolean };
    mood?: { latest_entry: { mood_emoji: string; mood_label: string } | null };
    weight?: { current: number | null; change: number | null };
    pregnancy?: { is_active: boolean; week: number | null };
}

export const TrackersHub: React.FC = () => {
    const { data: summary, isLoading, isError } = useQuery<any>({
        queryKey: ["trackersSummary"],
        queryFn: trackerService.getSummary,
        staleTime: 10 * 1000,
        refetchOnWindowFocus: true,
    });

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

    const cards = [
        {
            id: "pregnancy",
            title: "الحمل",
            subtitle: "رحلة الأمومة",
            icon: Baby,
            path: "pregnancy",
            gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
            glowColor: "shadow-rose-200/60",
            accentBg: "bg-rose-400/20",
            data: summary?.pregnancy,
            render: (data: any) => (
                <div className="space-y-1.5">
                    <div className="text-2xl font-black text-white">
                        {data?.is_active ? `الأسبوع ${data.week}` : "ابدأي الرحلة"}
                    </div>
                    <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                        {data?.is_active ? "متابعة الحمل" : "تسجيل حمل جديد"}
                    </p>
                </div>
            ),
        },
        {
            id: "period",
            title: "الدورة الشهرية",
            subtitle: "صحتكِ الإنجابية",
            icon: Calendar,
            path: "period",
            gradient: "from-pink-500 via-rose-500 to-red-400",
            glowColor: "shadow-pink-200/60",
            accentBg: "bg-pink-400/20",
            data: summary?.period,
            render: (data: any) => (
                <div className="space-y-1.5">
                    <div className="text-2xl font-black text-white">
                        {data?.is_active ? "دورة نشطة" : (data?.days_until_next != null ? `باقي ${data.days_until_next} يوم` : "—")}
                    </div>
                    <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                        {data?.is_active ? "سجلي التقدم الآن" : "للموعد القادم"}
                    </p>
                </div>
            ),
        },
        {
            id: "fertility",
            title: "الخصوبة",
            subtitle: "نافذة الفرص",
            icon: Heart,
            path: "fertility",
            gradient: "from-violet-500 via-purple-500 to-indigo-600",
            glowColor: "shadow-purple-200/60",
            accentBg: "bg-purple-400/20",
            data: summary?.fertility,
            render: (data: any) => (
                <div className="space-y-1.5">
                    <div className="text-2xl font-black text-white">
                        {data?.in_fertile_window ? "خصوبة عالية" : "فرصة عادية"}
                    </div>
                    <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                        {data?.in_fertile_window ? "فرصة حمل مرتفعة" : "خارج نافذة الإباضة"}
                    </p>
                </div>
            ),
        },
        {
            id: "mood",
            title: "المزاج اليومي",
            subtitle: "رحلتكِ النفسية",
            icon: Smile,
            path: "mood",
            gradient: "from-amber-400 via-orange-500 to-red-400",
            glowColor: "shadow-orange-200/60",
            accentBg: "bg-amber-400/20",
            data: summary?.mood,
            render: (data: any) => {
                const latest = data?.latest_entry || data?.latest || (Array.isArray(data?.entries) ? data.entries[0] : null);
                return (
                    <div className="space-y-1.5">
                        <div className="text-2xl font-black text-white flex items-center gap-2">
                            {latest?.mood_emoji || "—"}
                            <span className="text-base opacity-90">{latest?.mood_label || "لا قياس"}</span>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">آخر حالة مسجلة</p>
                    </div>
                );
            },
        },
        {
            id: "weight",
            title: "متتبع الوزن",
            subtitle: "لياقتكِ البدنية",
            icon: Weight,
            path: "weight",
            gradient: "from-sky-500 via-blue-500 to-indigo-500",
            glowColor: "shadow-blue-200/60",
            accentBg: "bg-sky-400/20",
            data: summary?.weight,
            render: (data: any) => {
                const current = data?.current ?? data?.current_weight ?? "--";
                const change = data?.change ?? data?.weight_change ?? 0;
                return (
                    <div className="space-y-1.5" dir="ltr">
                        <div className="text-2xl font-black text-white flex items-baseline gap-2">
                            {current}
                            <span className="text-sm font-bold opacity-60">KG</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {change !== 0 && (
                                <span className={cn(
                                    "text-[10px] font-black px-2.5 py-0.5 rounded-full",
                                    change > 0 ? "bg-white/20 text-white" : "bg-emerald-400/20 text-emerald-200"
                                )}>
                                    {change > 0 ? "+" : ""}{change} kg
                                </span>
                            )}
                            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">الوزن الحالي</span>
                        </div>
                    </div>
                );
            },
        },
    ];

    // Filter cards based on available trackers from API (life stage based)
    const availableTrackers = summary?.available_trackers;
    const filteredCards = availableTrackers
        ? cards.filter(card => availableTrackers.includes(card.id))
        : cards;

    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleCardClick = (path: string) => {
        navigate(`/trackers/${path}`);
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
                                    <Breadcrumbs items={[{ label: 'متتبعات الصحة' }]} />
                                </div>

                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-gradient-to-br from-foreground to-slate-900 rounded-2xl text-white shadow-lg shadow-border">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">مركز المتابعة</h1>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-base font-medium mr-1 max-w-md">تابعي مؤشراتكِ الصحية بدقة ذكاء وداد الاصطناعي</p>
                            </div>

                            {isAuthenticated && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-border/80 shadow-sm"
                                >
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">حالة البيانات</p>
                                        <p className="text-xs font-bold text-muted-foreground">محدثة وآمنة</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Subtle divider */}
                        <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent" />
                    </motion.header>

                    {/* Tracker Cards Grid — 3 per row */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredCards.map((card) => (
                            <motion.div key={card.id} variants={item}>
                                <div
                                    onClick={() => handleCardClick(card.path)}
                                    className={cn(
                                        "group relative rounded-[2rem] transition-all duration-500 hover:-translate-y-2 overflow-hidden cursor-pointer",
                                        "shadow-xl hover:shadow-2xl",
                                        card.glowColor
                                    )}
                                >
                                    {/* Gradient Background */}
                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", card.gradient)} />

                                    {/* Glass Overlay Pattern */}
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />

                                    {/* Floating glow */}
                                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
                                    <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

                                    {/* Large background icon */}
                                    <div className="absolute left-[-5%] bottom-[-15%] opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-700 group-hover:scale-110 transform">
                                        <card.icon size={200} strokeWidth={0.8} />
                                    </div>

                                    {/* Card Content */}
                                    <div className="relative z-10 p-7 flex flex-col min-h-[230px]">
                                        {/* Top Row: Icon + Arrow */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={cn(
                                                "p-3.5 rounded-2xl border border-white/20 backdrop-blur-sm",
                                                "group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                                                card.accentBg
                                            )}>
                                                <card.icon className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-400">
                                                <ChevronLeft className="w-5 h-5 text-white" />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="mb-auto">
                                            <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">{card.subtitle}</span>
                                            <h3 className="text-xl font-black text-white leading-tight">{card.title}</h3>
                                        </div>

                                        {/* Data Section */}
                                        <div className="pt-5 mt-4 border-t border-white/15">
                                            {isLoading && isAuthenticated ? (
                                                <div className="space-y-2.5">
                                                    <Skeleton className="h-8 w-28 bg-white/15 rounded-xl" />
                                                    <Skeleton className="h-3 w-20 bg-white/10 rounded-full" />
                                                </div>
                                            ) : !isAuthenticated ? (
                                                <div className="flex items-center gap-2 text-white/70">
                                                    <div className="p-1 bg-white/15 rounded-lg">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-xs font-bold">يتطلب تسجيل دخول</span>
                                                </div>
                                            ) : isError ? (
                                                <div className="text-xs font-bold text-white/50">خطأ في جلب البيانات</div>
                                            ) : (
                                                card.render(card.data)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default TrackersHub;
