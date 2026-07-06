import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodService } from '@/services/periodService';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Droplet, Calendar as CalendarIcon, AlertCircle, Trash2, TrendingUp, Sparkles, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import AuthRequiredOverlay from '@/components/auth/AuthRequiredOverlay';
import BackButton from '@/components/common/BackButton';

export default function PeriodTracker() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: cyclesData, isLoading: loadingCycles } = useQuery({
        queryKey: ['periodCycles'],
        queryFn: () => periodService.getCycles({ limit: 12 }),
        staleTime: 0,
        enabled: isAuthenticated,
    });

    const { data: predictions, isLoading: loadingPredictions } = useQuery({
        queryKey: ['periodPredictions'],
        queryFn: () => periodService.getPredictions(),
        staleTime: 0,
        enabled: isAuthenticated,
    });

    const { data: analyticsData } = useQuery({
        queryKey: ['periodAnalytics'],
        queryFn: () => periodService.getAnalytics(),
        staleTime: 0,
        enabled: isAuthenticated,
    });

    const currentCycle = cyclesData?.current_cycle;
    const stats = cyclesData?.stats;
    const items = cyclesData?.cycles || cyclesData?.data || (Array.isArray(cyclesData) ? cyclesData : []);
    const entries = Array.isArray(items) ? items : (items?.data || []);

    const isPeriodActive = !!currentCycle && !currentCycle.end_date;

    const deleteMutation = useMutation({
        mutationFn: periodService.deleteEntry,
        onSuccess: () => {
            toast.success('تم حذف السجل بنجاح');
            queryClient.invalidateQueries({ queryKey: ['periodCycles'] });
            queryClient.invalidateQueries({ queryKey: ['periodPredictions'] });
            queryClient.invalidateQueries({ queryKey: ['periodAnalytics'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            setDeleteId(null);
        },
        onError: () => toast.error('فشل في حذف السجل'),
    });

    const handleDelete = useCallback(() => {
        if (deleteId !== null) deleteMutation.mutate(deleteId);
    }, [deleteId, deleteMutation]);

    // TASK 10 — memoize heavy date-loop computations
    const periodDays = useMemo(() => {
        const days: Date[] = [];
        entries?.forEach((c: any) => {
            if (c.start_date && c.end_date) {
                try {
                    let curr = parseISO(c.start_date);
                    const end = parseISO(c.end_date);
                    while (curr <= end) { days.push(new Date(curr)); curr = addDays(curr, 1); }
                } catch { }
            } else if (c.start_date) {
                try { days.push(parseISO(c.start_date)); } catch { }
            }
        });
        return days;
    }, [entries]);

    const predictedDays = useMemo(() => {
        const days: Date[] = [];
        predictions?.next_periods?.forEach((p: any) => {
            if (p.predicted_start && p.predicted_end) {
                try {
                    let curr = parseISO(p.predicted_start);
                    const end = parseISO(p.predicted_end);
                    while (curr <= end) { days.push(new Date(curr)); curr = addDays(curr, 1); }
                } catch { }
            }
        });
        return days;
    }, [predictions]);

    const fertileDays = useMemo(() => {
        const days: Date[] = [];
        predictions?.next_periods?.forEach((p: any) => {
            if (p.ovulation_window?.start && p.ovulation_window?.end) {
                try {
                    let curr = parseISO(p.ovulation_window.start);
                    const end = parseISO(p.ovulation_window.end);
                    while (curr <= end) { days.push(new Date(curr)); curr = addDays(curr, 1); }
                } catch { }
            }
        });
        return days;
    }, [predictions]);

    // Show auth overlay for non-authenticated users
    if (!isAuthenticated) {
        return (
            <AuthRequiredOverlay
                feature="متتبع الدورة الشهرية"
                description="سجلي دخولك لتتبع دورتك الشهرية والحصول على توقعات دقيقة"
            />
        );
    }

    if (loadingCycles && loadingPredictions) {
        return <PeriodTrackerSkeleton />;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-primary">
            <div className="text-right">
                <BackButton />
            </div>
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className="p-2 sm:p-3 bg-pink-500 rounded-2xl text-white shadow-lg shadow-pink-200">
                            <Droplet className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">متتبع الدورة</h1>
                    </div>
                    <p className="text-muted-foreground text-base sm:text-lg font-medium mr-2">رحلتكِ الشهرية تحت السيطرة وبدقة عالية</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3"
                >
                    {isPeriodActive ? (
                        <EndPeriodDialog cycleId={currentCycle.id} open={isEndOpen} onOpenChange={setIsEndOpen} />
                    ) : (
                        <StartPeriodDialog open={isStartOpen} onOpenChange={setIsStartOpen} />
                    )}
                </motion.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Status and Stats Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Current Status Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border-none",
                            isPeriodActive
                                ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-200"
                                : "bg-gradient-to-br from-foreground to-slate-900 text-white shadow-border"
                        )}
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <Clock className="w-4 h-4 opacity-60" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">الحالة الآن</span>
                            </div>

                            {isPeriodActive ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-pink-50 font-medium mb-1">يوم الحيض</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black tracking-tighter">
                                                {currentCycle?.start_date ? Math.floor((new Date().getTime() - new Date(currentCycle.start_date).getTime()) / (1000 * 3600 * 24)) + 1 : 1}
                                            </span>
                                            <span className="text-xl font-bold opacity-60">من {stats?.average_period_length || 5}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                        <p className="text-xs opacity-80 mb-1 font-bold">بدأت في</p>
                                        <p className="font-bold">{currentCycle?.start_date ? format(new Date(currentCycle.start_date), 'EEEE, d MMMM', { locale: ar }) : '—'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {predictions?.next_periods?.[0] ? (
                                        <>
                                            <div>
                                                <p className="text-muted-foreground font-medium mb-1">الموعد المتوقع</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-black tracking-tighter">
                                                        {predictions?.next_periods?.[0]?.predicted_start ? format(parseISO(predictions.next_periods[0].predicted_start), 'd MMM', { locale: ar }) : '—'}
                                                    </span>
                                                    <span className="text-lg font-bold text-pink-400">
                                                        بعد {predictions?.next_periods?.[0]?.predicted_start ? Math.ceil((new Date(predictions.next_periods[0].predicted_start).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : '—'} يوم
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <p className="text-xs text-muted-foreground mb-1 font-bold">الدورة القادمة</p>
                                                <p className="font-bold text-border">تستمر حوالي {stats?.average_period_length || 5} أيام</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-4 opacity-60">لا توجد بيانات كافية للتوقع حالياً</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-5 group hover:border-pink-100 transition-all"
                        >
                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">متوسط الدورة</p>
                                <p className="text-2xl font-black text-foreground">{stats?.average_cycle_length || 28} <span className="text-sm font-bold opacity-40">يوم</span></p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-5 group hover:border-purple-100 transition-all"
                        >
                            <div
                            className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">انتظام الدورة</p>
                                <p className={`text-xl font-black ${
                                    stats?.cycle_regularity === 'very_regular' ? 'text-green-600' :
                                    stats?.cycle_regularity === 'irregular' ? 'text-red-500' :
                                    'text-foreground'
                                }`}>
                                    {stats?.cycle_regularity === 'very_regular' ? 'منتظمة جداً' :
                                     stats?.cycle_regularity === 'regular' ? 'منتظمة' :
                                     stats?.cycle_regularity === 'irregular' ? 'غير منتظمة ⚠️' :
                                     stats?.cycle_regularity === 'insufficient_data' ? 'بيانات غير كافية' :
                                     'لا توجد بيانات'}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* TASK 8 — Analytics Scores */}
                    {analyticsData && (
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { label: 'صحة الدورة', score: analyticsData.scores.health_score, color: analyticsData.scores.health_score >= 70 ? '#22c55e' : analyticsData.scores.health_score >= 50 ? '#f59e0b' : '#ef4444' },
                                { label: 'الخصوبة', score: analyticsData.scores.fertility_score, color: analyticsData.scores.fertility_score >= 70 ? '#8b5cf6' : '#a78bfa' },
                            ] as const).map((item, i) => (
                                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                                    className="bg-white p-5 rounded-[2rem] border border-border shadow-sm flex flex-col items-center gap-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                    <div className="relative w-16 h-16">
                                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15" fill="none" stroke={item.color} strokeWidth="3"
                                                strokeDasharray={`${(item.score / 100) * 94} 94`} strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black">{item.score}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-bold">{analyticsData.scores.confidence.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* AI Insight Card */}
                    <div className="bg-muted p-6 rounded-[2rem] border-2 border-dashed border-border">
                        <div className="flex items-center gap-2 mb-3 text-foreground font-bold">
                            <Info className="w-5 h-5 text-blue-500" />
                            تنبيه صحي
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                            {isPeriodActive
                                ? (currentCycle?.flow === 'heavy'
                                    ? 'دورتكِ غزيرة — احرصي على شرب السوائل والراحة، وتناولي الحديد. إذا استمر أكثر من 7 أيام راجعي طبيبك.'
                                    : 'يُنصح بشرب السوائل الدافئة والراحة الكافية خلال هذه الأيام. إذا شعرت بألم حاد غير معتاد، استشيري طبيبك.')
                                : stats?.cycle_regularity === 'irregular'
                                    ? '⚠️ لاحظنا عدم انتظام في دورتكِ — ننصحك بمراجعة الطبيب للاطمئنان.'
                                    : stats?.cycle_regularity === 'no_data' || stats?.cycle_regularity === 'insufficient_data'
                                        ? 'ابدئي بتسجيل دورتكِ الشهرية لتحصلي على توقعات دقيقة ونصائح مخصصة.'
                                        : 'دورتكِ منتظمة ✅ — استمري في التسجيل للحصول على توقعات أدق لرحلة خصوبتكِ.'}
                        </p>
                    </div>
                </div>

                {/* Calendar Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-border shadow-xl shadow-border/50"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-foreground px-2">تقويم الدورة</h3>
                            <p className="text-muted-foreground text-sm px-2">تابعي أيام الحيض ونافذة الخصوبة بوضوح</p>
                        </div>
                        <div className="flex flex-wrap gap-3 bg-muted/80 backdrop-blur-sm p-3 rounded-[1.5rem] border border-border">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-pink-50">
                                <div className="w-2.5 h-2.5 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.4)]" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">حيض</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-purple-50">
                                <div className="w-2.5 h-2.5 bg-purple-200 rounded-full" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">خصوبة</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-pink-50">
                                <div className="w-2.5 h-2.5 border-2 border-pink-200 border-dashed rounded-full" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">متوقع</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center period-calendar-container overflow-hidden pt-4 pb-8">
                        <Calendar
                            mode="multiple"
                            locale={ar}
                            selected={[...periodDays, ...predictedDays, ...fertileDays]}
                            modifiers={{
                                period: periodDays,
                                predicted: predictedDays,
                                fertile: fertileDays
                            }}
                            className="bg-white"
                            classNames={{
                                months: "flex flex-col space-y-4",
                                month: "space-y-6 w-full flex flex-col items-center",
                                caption: "flex justify-center pt-2 relative items-center mb-8",
                                caption_label: "text-xl font-black text-foreground",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-10 w-10 bg-muted border-none rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-center",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                // v9 names
                                month_grid: "w-full border-collapse select-none",
                                weekdays: "flex w-full justify-between mb-4",
                                weekday: "text-muted-foreground font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-center w-11 sm:w-14",
                                weeks: "w-full space-y-2",
                                week: "flex w-full justify-between",
                                day: "h-9 w-9 sm:h-12 sm:w-12 p-0 font-bold rounded-2xl transition-all hover:bg-muted flex items-center justify-center text-xs sm:text-sm",
                                day_today: "bg-muted/50 text-foreground border-2 border-white shadow-sm",
                                day_outside: "text-border opacity-50",
                                // v8 names for compatibility
                                table: "w-full border-collapse select-none",
                                head_row: "flex w-full justify-between mb-4",
                                head_cell: "text-muted-foreground font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-center w-11 sm:w-14",
                                row: "flex w-full justify-between",
                                cell: "h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center relative p-0 overflow-hidden",
                            }}
                            modifiersStyles={{
                                period: {
                                    backgroundColor: '#ec4899',
                                    color: 'white',
                                    borderRadius: '1.2rem',
                                    fontWeight: '900',
                                    boxShadow: '0 8px 16px -4px rgba(236, 72, 153, 0.4)'
                                },
                                predicted: {
                                    border: '2px dashed #fbcfe8',
                                    borderRadius: '1.2rem',
                                    color: '#db2777',
                                    backgroundColor: 'rgba(251, 207, 232, 0.1)'
                                },
                                fertile: {
                                    backgroundColor: '#e9d5ff',
                                    color: '#7e22ce',
                                    borderRadius: '1.2rem',
                                    fontWeight: '700'
                                }
                            }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* History Section */}
            <div className="pt-10 space-y-8">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-3xl font-black text-foreground">السجل التاريخي</h2>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-4 py-2 rounded-full border border-border">
                        {entries.length} دورات سابقة
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {entries?.map((cycle: any, idx: number) => (
                            <motion.div
                                key={cycle.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:shadow-border transition-all group relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 w-24 h-24 bg-pink-50 rounded-bl-[3rem] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-all duration-500" />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-pink-100 group-hover:text-pink-500 transition-colors">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteId(cycle.id)}
                                        className="text-border hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <h4 className="text-xl font-black text-foreground leading-tight">
                                        {cycle.start_date ? format(parseISO(cycle.start_date), 'd MMMM', { locale: ar }) : '—'}
                                        <span className="mx-2 text-border">←</span>
                                        {cycle.end_date ? format(parseISO(cycle.end_date), 'd MMMM', { locale: ar }) : '...'}
                                    </h4>

                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-muted rounded-2xl">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">المدة</p>
                                            <p className="font-bold text-foreground/80">{cycle.period_length} أيام</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-muted rounded-2xl">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mb-1">التدفق</p>
                                            <p className="font-bold text-foreground/80">{getFlowLabel(cycle.flow)}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {!entries.length && (
                        <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-border text-border">
                            <CalendarIcon className="w-20 h-20 mx-auto mb-6 opacity-20" />
                            <h3 className="text-2xl font-bold opacity-40">لا توجد سجلات مسجلة حالياً</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] font-primary p-10 max-w-md border-none">
                    <AlertDialogHeader>
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center text-foreground mb-2">حذف هذا السجل؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-lg">
                            سيتم حذف هذا السجل بشكل نهائي ولن تتمكني من استعادته.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-3 mt-8">
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-red-200"
                        >
                            تأكيد الحذف
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-14 rounded-2xl border-border text-muted-foreground font-bold hover:bg-muted">
                            إلغاء التراجع
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function PeriodTrackerSkeleton() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-pulse font-primary">
            <header className="flex justify-between items-center">
                <div className="space-y-4">
                    <Skeleton className="h-16 w-64 rounded-2xl" />
                    <Skeleton className="h-5 w-96 rounded-full" />
                </div>
                <Skeleton className="h-14 w-48 rounded-2xl" />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-4">
                    <Skeleton className="h-[300px] rounded-[3rem]" />
                    <Skeleton className="h-24 rounded-[2rem]" />
                    <Skeleton className="h-24 rounded-[2rem]" />
                </div>
                <Skeleton className="md:col-span-8 h-[500px] rounded-[3rem]" />
            </div>
        </div>
    );
}

const StartPeriodDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();

    const startMutation = useMutation({
        mutationFn: periodService.startCycle,
        onSuccess: () => {
            toast.success('بدأت دورتكِ، نتمنى لكِ الراحة');
            queryClient.invalidateQueries({ queryKey: ['periodCycles'] });
            queryClient.invalidateQueries({ queryKey: ['periodPredictions'] });
            queryClient.invalidateQueries({ queryKey: ['periodAnalytics'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            onOpenChange(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ ما'),
    });

    const onSubmit = (data: any) => startMutation.mutate(data);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-pink-200 bg-pink-600 hover:bg-pink-700 transition-all hover:scale-105">
                    <Droplet className="ml-2" /> تسجيل بدء الدورة
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2.5rem] sm:rounded-[3.5rem] p-0 border-none font-primary max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-pink-600 to-rose-500 opacity-10" />

                <div className="relative p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 text-right">
                    <DialogHeader className="mb-8 text-center">
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-pink-200 text-white"
                        >
                            <Droplet size={40} />
                        </motion.div>
                        <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-center">دورة جديدة</DialogTitle>
                        <p className="text-center text-muted-foreground mt-3 font-medium text-lg">سجلي التاريخ بعناية لأدق التوقعات</p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-pink-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">تاريخ البدء</label>
                            <div className="relative flex items-center">
                                <CalendarIcon className="absolute right-4 text-pink-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="date"
                                    defaultValue={new Date().toLocaleDateString('en-CA')}
                                    {...register('start_date')}
                                    className="w-full h-14 pr-12 pl-4 rounded-xl bg-white border-2 border-transparent focus:border-pink-200 outline-none font-bold text-foreground/80 shadow-sm transition-all text-center sm:text-right"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 block">مستوى التدفق</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { val: 'light', label: 'خفيف' },
                                    { val: 'medium', label: 'متوسط' },
                                    { val: 'heavy', label: 'غزير' }
                                ].map((f) => (
                                    <label key={f.val} className="cursor-pointer group">
                                        <input type="radio" value={f.val} className="peer sr-only" {...register('flow')} defaultChecked={f.val === 'medium'} />
                                        <div className="h-14 flex items-center justify-center rounded-2xl bg-white border-2 border-muted text-muted-foreground font-bold text-sm peer-checked:bg-pink-600 peer-checked:text-white peer-checked:border-pink-600 peer-checked:shadow-lg peer-checked:shadow-pink-100 transition-all group-hover:border-pink-100">
                                            {f.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 block">الأعراض (اختياري)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { val: 'cramps', label: '😣 تقلصات' },
                                    { val: 'headache', label: '🤕 صداع' },
                                    { val: 'bloating', label: '🫀 انتفاخ' },
                                    { val: 'fatigue', label: '😴 تعب' },
                                    { val: 'mood_swings', label: '😤 تقلبات مزاجية' },
                                    { val: 'backache', label: '🔙 آلام الظهر' },
                                ].map((s) => (
                                    <label key={s.val} className="relative cursor-pointer">
                                        <input type="checkbox" value={s.val} {...register('symptoms')} className="peer sr-only" />
                                        <div className="h-12 flex items-center justify-center rounded-xl bg-white border-2 border-muted text-muted-foreground font-bold text-xs peer-checked:border-pink-400 peer-checked:bg-pink-50 peer-checked:text-pink-700 transition-all">
                                            {s.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-pink-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">ملاحظات (اختياري)</label>
                            <textarea
                                {...register('notes')}
                                placeholder="أي ملاحظات إضافية عن هذه الدورة..."
                                maxLength={1000}
                                rows={3}
                                className="w-full p-4 rounded-xl bg-white border-2 border-transparent focus:border-pink-200 outline-none font-medium text-foreground/80 shadow-sm transition-all resize-none text-sm"
                            />
                        </div>

                        <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-10 px-10 pb-2">
                            <Button
                                type="submit"
                                disabled={startMutation.isPending}
                                className="w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white shadow-xl shadow-pink-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {startMutation.isPending ? 'جاري التسجيل...' : 'تأكيد البدء الآن'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const EndPeriodDialog = ({ cycleId, open, onOpenChange }: { cycleId: number, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();

    const endMutation = useMutation({
        mutationFn: (data: any) => periodService.endCycle(cycleId, data.end_date),
        onSuccess: () => {
            toast.success('تم تسجيل انتهاء الدورة بنجاح');
            queryClient.invalidateQueries({ queryKey: ['periodCycles'] });
            queryClient.invalidateQueries({ queryKey: ['periodPredictions'] });
            queryClient.invalidateQueries({ queryKey: ['periodAnalytics'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            onOpenChange(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ ما'),
    });

    const onSubmit = (data: any) => endMutation.mutate(data);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-2xl h-14 border-pink-200 text-pink-600 hover:bg-pink-50 font-bold px-8 transition-all active:scale-95 shadow-sm">
                    إنهاء الدورة الحالية
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2.5rem] sm:rounded-[3.5rem] p-0 border-none font-primary max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-pink-600 to-rose-500 opacity-10" />

                <div className="relative p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 text-right">
                    <DialogHeader className="mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-pink-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-pink-600 shadow-inner"
                        >
                            <CalendarIcon size={40} />
                        </motion.div>
                        <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-center">انتهاء الدورة</DialogTitle>
                        <p className="text-center text-muted-foreground mt-3 font-medium text-lg">متى توقف التدفق تماماً؟</p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                        <div className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-pink-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">تاريخ الانتهاء</label>
                            <div className="relative flex items-center">
                                <CalendarIcon className="absolute right-4 text-pink-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="date"
                                    defaultValue={new Date().toLocaleDateString('en-CA')}
                                    {...register('end_date')}
                                    className="w-full h-14 pr-12 pl-4 rounded-xl bg-white border-2 border-transparent focus:border-pink-200 outline-none font-bold text-foreground/80 shadow-sm transition-all text-center sm:text-right"
                                />
                            </div>
                        </div>

                        <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-10 px-10 pb-2">
                            <Button
                                type="submit"
                                disabled={endMutation.isPending}
                                className="w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white shadow-xl shadow-pink-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {endMutation.isPending ? 'جاري التسجيل...' : 'تأكيد الانتهاء الآن'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

function getFlowLabel(flow: string) {
    const map: any = { light: 'خفيف', medium: 'متوسط', heavy: 'غزير' };
    return map[flow] || flow || 'غير محدد';
}
