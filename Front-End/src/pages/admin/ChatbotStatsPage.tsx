import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MessageCircle, Activity, Users, Database,
    RefreshCw, Power, PowerOff, TrendingUp,
    Shield, CheckCircle2, XCircle, BarChart3,
    Zap, Clock
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { adminChatbotService } from "@/services/adminChatbotService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BOT_TYPES = [
    { id: "public",       name: "وداد العامة",       color: "violet", emoji: "🌐" },
    { id: "pre_marriage", name: "ما قبل الزواج",    color: "blue",   emoji: "💍" },
    { id: "pregnancy",    name: "الحمل",             color: "rose",   emoji: "🤰" },
    { id: "motherhood",   name: "الأمومة",           color: "emerald",emoji: "👶" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string }> = {
    violet:  { bg: "bg-violet-500",  text: "text-violet-600",  border: "border-violet-200", light: "bg-violet-50"  },
    blue:    { bg: "bg-blue-500",    text: "text-blue-600",    border: "border-blue-200",   light: "bg-blue-50"    },
    rose:    { bg: "bg-rose-500",    text: "text-rose-600",    border: "border-rose-200",   light: "bg-rose-50"    },
    emerald: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200",light: "bg-emerald-50" },
};

const StatCard: React.FC<{
    label: string; value: number | string; icon: React.ElementType;
    colorClass: string; sub?: string;
}> = ({ label, value, icon: Icon, colorClass, sub }) => (
    <Card variant="elevated" className="p-5 flex items-center gap-4 hover:shadow-lg transition-shadow duration-200">
        <div className={cn("p-3 rounded-xl flex-shrink-0", colorClass)}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
            <p className="text-sm text-muted-foreground font-medium truncate">{label}</p>
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
    </Card>
);

const SkeletonCard = () => (
    <div className="h-28 bg-muted rounded-xl animate-pulse" />
);

const ChatbotStatsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [togglingBot, setTogglingBot] = useState<string | null>(null);

    // ── Fetch Stats ──────────────────────────────────────────
    const { data: stats, isLoading: statsLoading, refetch } = useQuery({
        queryKey: ["admin_chatbot_stats"],
        queryFn: adminChatbotService.getStats,
        refetchInterval: 60_000, // Auto-refresh every 60s
    });

    // ── Toggle Bot ────────────────────────────────────────────
    const toggleBotMutation = useMutation({
        mutationFn: async (botType: string) => {
            setTogglingBot(botType);
            return adminChatbotService.toggleBot(botType);
        },
        onSuccess: (data) => {
            const isNowEnabled = data.data.status === "enabled";
            toast.success(`تم ${isNowEnabled ? "✅ تشغيل" : "⛔ إيقاف"} البوت بنجاح`);
            queryClient.invalidateQueries({ queryKey: ["admin_chatbot_stats"] });
        },
        onError: () => toast.error("فشل في تغيير حالة البوت"),
        onSettled: () => setTogglingBot(null),
    });

    // ── Clear Cache ────────────────────────────────────────────
    const clearCacheMutation = useMutation({
        mutationFn: adminChatbotService.clearCache,
        onSuccess: (_data, botType) =>
            toast.success(botType === "*" ? "تم مسح الكاش لجميع البوتات" : `تم مسح كاش بوت ${botType}`),
        onError: () => toast.error("فشل مسح الذاكرة المخبأة"),
    });

    const totalMessages  = stats?.total_messages   ?? 0;
    const totalSessions  = stats?.total_sessions   ?? 0;
    const totalUsers     = stats?.total_users       ?? 0;
    const messagesWeek   = stats?.messages_this_week ?? 0;
    const messagesToday  = stats?.messages_today   ?? 0;

    return (
        <div className="space-y-8" dir="rtl">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-violet-600" />
                        إحصائيات المساعد الذكي
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        نظرة شاملة على أداء جميع المساعدات الذكية — يتجدد تلقائياً كل دقيقة
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={statsLoading}
                        className="bg-white gap-1.5"
                    >
                        <RefreshCw className={cn("w-4 h-4", statsLoading && "animate-spin")} />
                        تحديث
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearCacheMutation.mutate("*")}
                        disabled={clearCacheMutation.isPending}
                        className="bg-white text-amber-600 border-amber-200 hover:bg-amber-50 gap-1.5"
                    >
                        <Zap className="w-4 h-4" />
                        مسح Cache الكل
                    </Button>
                </div>
            </div>

            {/* ── Overall Stats Grid ── */}
            {statsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="إجمالي الرسائل"       value={totalMessages.toLocaleString()}  icon={MessageCircle} colorClass="bg-violet-600"  sub="منذ البداية" />
                    <StatCard label="إجمالي الجلسات"        value={totalSessions.toLocaleString()}  icon={Database}      colorClass="bg-blue-600"    sub="جميع البوتات" />
                    <StatCard label="المستخدمون النشطون"    value={totalUsers.toLocaleString()}     icon={Users}         colorClass="bg-emerald-600" sub="فريدون" />
                    <StatCard label="رسائل هذا الأسبوع"    value={messagesWeek.toLocaleString()}   icon={TrendingUp}    colorClass="bg-orange-500"  sub={`اليوم: ${messagesToday}`} />
                </div>
            )}

            {/* ── Section Title ── */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-foreground">تفاصيل كل مساعد</h2>
                <span className="mr-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    آخر تحديث: {new Date().toLocaleTimeString("ar-EG")}
                </span>
            </div>

            {/* ── Per-Bot Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {BOT_TYPES.map(bot => {
                    const colors  = COLOR_MAP[bot.color];
                    const botStat = stats?.per_bot?.[bot.id];
                    const isEnabled = botStat?.is_enabled !== false;
                    const isToggling = togglingBot === bot.id && toggleBotMutation.isPending;

                    return (
                        <Card key={bot.id} variant="elevated" className={cn(
                            "overflow-hidden transition-all duration-200 hover:shadow-xl",
                            !isEnabled && "opacity-80"
                        )}>
                            {/* Card Top Bar */}
                            <div className={cn("h-1.5", colors.bg)} />

                            <div className="p-5">
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{bot.emoji}</span>
                                        <div>
                                            <h3 className="font-bold text-base text-foreground leading-tight">{bot.name}</h3>
                                            <code className="text-[11px] text-muted-foreground font-mono">{bot.id}</code>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Status Badge */}
                                        <span className={cn(
                                            "flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                                            isEnabled
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                        )}>
                                            {isEnabled
                                                ? <CheckCircle2 className="w-3 h-3" />
                                                : <XCircle className="w-3 h-3" />}
                                            {isEnabled ? "يعمل" : "موقوف"}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2.5 mb-5">
                                    {[
                                        { label: "الرسائل",           value: botStat?.total_messages        ?? 0 },
                                        { label: "المستخدمون",        value: botStat?.active_users          ?? 0 },
                                        { label: "رسائل اليوم",       value: botStat?.messages_today        ?? 0 },
                                        { label: "متوسط الجلسة",      value: Number(botStat?.avg_messages_per_session ?? 0).toFixed(1) },
                                    ].map(item => (
                                        <div key={item.label} className="bg-muted/50 border border-border p-3 rounded-xl">
                                            <p className="text-[11px] text-muted-foreground mb-0.5">{item.label}</p>
                                            <p className={cn("font-bold text-xl", colors.text)}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions Row */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn("flex-1 gap-1.5 font-medium", isEnabled
                                            ? "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                                        )}
                                        onClick={() => toggleBotMutation.mutate(bot.id)}
                                        disabled={isToggling}
                                    >
                                        {isToggling ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : isEnabled ? (
                                            <><PowerOff className="w-4 h-4" /> إيقاف</>
                                        ) : (
                                            <><Power className="w-4 h-4" /> تشغيل</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-amber-600 hover:bg-amber-50 gap-1.5 px-3"
                                        onClick={() => clearCacheMutation.mutate(bot.id)}
                                        disabled={clearCacheMutation.isPending}
                                        title="مسح الكاش لهذا البوت"
                                    >
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs">كاش</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-violet-600 hover:bg-violet-50 px-3"
                                        onClick={() => refetch()}
                                        title="تحديث بيانات هذا البوت"
                                    >
                                        <Activity className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatbotStatsPage;
