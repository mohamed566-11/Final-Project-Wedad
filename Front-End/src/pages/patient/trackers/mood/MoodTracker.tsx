import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodService } from '@/services/moodService';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Smile, Moon, Zap, Users, Trash2, Calendar as CalendarIcon, TrendingUp, Sparkles, Brain, Clock, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AuthRequiredOverlay from '@/components/auth/AuthRequiredOverlay';
import BackButton from '@/components/common/BackButton';

export default function MoodTracker() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: entriesData, isLoading: loadingEntries } = useQuery({
        queryKey: ['moodEntries'],
        queryFn: () => moodService.getEntries({ limit: 15 }),
        staleTime: 5 * 60 * 1000,
        enabled: isAuthenticated, // Only fetch if authenticated
    });

    const { data: analytics, isLoading: loadingAnalytics } = useQuery({
        queryKey: ['moodAnalytics'],
        queryFn: () => moodService.getAnalytics('month'),
        staleTime: 5 * 60 * 1000,
        enabled: isAuthenticated, // Only fetch if authenticated
    });

    const entries = Array.isArray(entriesData) ? entriesData : [];

    const deleteMutation = useMutation({
        mutationFn: moodService.deleteEntry,
        onSuccess: () => {
            toast.success('تم حذف التسجيل بنجاح');
            queryClient.invalidateQueries({ queryKey: ['moodEntries'] });
            queryClient.invalidateQueries({ queryKey: ['moodAnalytics'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            setDeleteId(null);
        },
        onError: () => toast.error('فشل في حذف التسجيل'),
    });

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId);
        }
    };

    // Show auth overlay for non-authenticated users
    if (!isAuthenticated) {
        return (
            <AuthRequiredOverlay
                feature="متتبع المزاج اليومي"
                description="سجلي دخولك لتتبع حالتك المزاجية والحصول على تحليلات ذكية لمشاعرك"
            />
        );
    }

    if (loadingEntries && loadingAnalytics) {
        return <MoodTrackerSkeleton />;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-primary">
            <div className="text-right">
                <BackButton />
            </div>
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-yellow-500 rounded-2xl text-white shadow-lg shadow-yellow-200">
                            <Smile className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">متتبع المزاج</h1>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium mr-2">رافقي رحلتك النفسية وتعرفي على أنماط مشاعرك</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <MoodEntryDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
                </motion.div>
            </header>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-4 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group"
                >
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-8 opacity-60">
                            <Brain className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">المزاج الغالب</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-7xl group-hover:scale-110 transition-transform duration-500 filter drop-shadow-xl">
                                {getMoodEmoji(analytics?.most_common_mood)}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black">{getMoodLabel(analytics?.most_common_mood)}</h3>
                                <p className="text-indigo-200 font-bold opacity-80 mt-1">هذا الشهر</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-4 bg-white p-8 rounded-[2.5rem] border border-border shadow-xl shadow-border/50 flex flex-col justify-between group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:rotate-12 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">معدل العافية</span>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-foreground">{analytics?.average_mood_score || 0}</span>
                            <span className="text-xl font-bold text-muted-foreground">/ 5</span>
                        </div>
                        <p className="text-emerald-500 font-bold mt-2 flex items-center gap-1">
                            {analytics?.mood_trend === 'improving' ? (
                                <><TrendingUp size={16} /> في تحسن مستمر</>
                            ) : (
                                <><Sparkles size={16} /> حالة نفسية مستقرة</>
                            )}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-4 bg-foreground p-8 rounded-[2.5rem] text-white shadow-2xl shadow-border relative overflow-hidden group"
                >
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/10 rounded-2xl text-yellow-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">نشاط التسجيل</span>
                        </div>
                        <div>
                            <span className="text-5xl font-black text-white">
                                {analytics?.total_count ?? (analytics?.mood_distribution ? Object.values(analytics.mood_distribution).reduce((a: any, b: any) => a + b, 0) : 0)}
                            </span>
                            <p className="text-muted-foreground font-bold mt-1">إجمالي الحالات المسجلة</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Timeline */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-foreground">يوميات مشاعركِ</h2>
                        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">آخر 15 تسجيل</div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {entries?.map((entry: any, idx: number) => (
                                <motion.div
                                    key={entry.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:shadow-border transition-all group relative overflow-hidden"
                                >
                                    <div className="flex gap-6 items-start relative z-10">
                                        <div className="text-5xl bg-muted w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 filter drop-shadow-sm">
                                            {entry.mood_emoji}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-xl font-black text-foreground">{entry.mood_label}</h4>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1 uppercase tracking-tighter">
                                                        <CalendarIcon size={12} className="text-border" />
                                                        {entry.entry_date ? format(new Date(entry.entry_date), 'EEEE d MMMM', { locale: ar }) : '—'}
                                                        <span className="mx-1">•</span>
                                                        <Clock size={12} className="text-border" />
                                                        {entry.entry_time || '—'}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(entry.id)}
                                                    className="text-border hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>

                                            {entry.notes && (
                                                <p className="text-muted-foreground mt-4 text-sm font-medium leading-relaxed bg-muted/50 p-4 rounded-2xl border border-muted italic">
                                                    " {entry.notes} "
                                                </p>
                                            )}

                                            {/* Factors */}
                                            <div className="flex gap-2 mt-4 flex-wrap">
                                                {entry.factors?.sleep && <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl flex items-center gap-1.5 border border-indigo-100/50"><Moon size={12} /> نوم كافٍ</span>}
                                                {entry.factors?.exercise && <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-1.5 border border-emerald-100/50"><Zap size={12} /> نشاط بدني</span>}
                                                {entry.factors?.social && <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl flex items-center gap-1.5 border border-pink-100/50"><Users size={12} /> لقاء اجتماعي</span>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {!entries.length && (
                            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-border">
                                <Smile className="w-20 h-20 mx-auto mb-6 opacity-10 text-muted-foreground" />
                                <h3 className="text-2xl font-bold text-border">لم يتم تسجيل أي ذكريات بعد</h3>
                                <p className="text-muted-foreground mt-2 font-medium">ابدئي بتسجيل حالتكِ لنتتبع رحلتكِ معاً</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Insights & Distribution */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-muted p-8 rounded-[3rem] border-2 border-dashed border-border">
                        <div className="flex items-center gap-3 mb-4 text-foreground font-black">
                            <Sparkles className="w-6 h-6 text-yellow-500" />
                            نظرة ذكية
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-bold">
                            {analytics?.mood_trend === 'improving'
                                ? "نلاحظ تحسناً رائعاً في مزاجكِ مؤخراً! أسلوب حياتك كان عاملاً أساسياً في ذلك. استمري في عاداتكِ الإيجابية."
                                : "تبدو مشاعركِ مستقرة بشكل عام. تذكري أن تقلب المزاج البسيط جزء طبيعي من رحلتكِ الصحية والنفسية."}
                        </p>
                    </div>

                    <MoodTips mostCommonMood={analytics?.most_common_mood} />

                    <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl shadow-border/50">
                        <h3 className="text-lg font-black text-foreground mb-6">توزيع المشاعر</h3>
                        <div className="space-y-5">
                            {analytics?.mood_distribution && Object.entries(analytics.mood_distribution).map(([mood, count]: any) => (
                                <div key={mood} className="space-y-2">
                                    <div className="flex justify-between text-xs font-black">
                                        <span className="flex items-center gap-2">
                                            {getMoodEmoji(mood)} {getMoodLabel(mood)}
                                        </span>
                                        <span className="text-muted-foreground">{count} تسجيلات</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / (analytics.total_count || 1)) * 100}%` }}
                                            className={cn(
                                                "h-full rounded-full",
                                                mood === 'very_good' && "bg-emerald-400",
                                                mood === 'good' && "bg-blue-400",
                                                mood === 'neutral' && "bg-muted-foreground",
                                                mood === 'bad' && "bg-orange-400",
                                                mood === 'very_bad' && "bg-red-400"
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] font-primary p-10 max-w-md border-none">
                    <AlertDialogHeader>
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center text-foreground mb-2">حذف الذكرى؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-lg">
                            سيتم إزالة هذا التسجيل من تقريركِ النفسي والتحليلات بشكل دائم.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-3 mt-8">
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-red-200"
                        >
                            نعم، احذف السجل
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-14 rounded-2xl border-border text-muted-foreground font-bold hover:bg-muted">
                            إلغاء العملية
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function MoodTrackerSkeleton() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-pulse font-primary">
            <header className="flex justify-between items-end">
                <div className="space-y-4">
                    <Skeleton className="h-16 w-64 rounded-2xl" />
                    <Skeleton className="h-6 w-96 rounded-full" />
                </div>
                <Skeleton className="h-14 w-44 rounded-2xl" />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-40 rounded-[2.5rem]" />
                <Skeleton className="h-40 rounded-[2.5rem]" />
                <Skeleton className="h-40 rounded-[2.5rem]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-4">
                    <Skeleton className="h-32 rounded-[2.5rem]" />
                    <Skeleton className="h-32 rounded-[2.5rem]" />
                </div>
                <div className="lg:col-span-4">
                    <Skeleton className="h-96 rounded-[3rem]" />
                </div>
            </div>
        </div>
    );
}

const MoodEntryDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();
    const [selectedMood, setSelectedMood] = useState<string>('');

    const moods = [
        { value: 'very_good', emoji: '😄', label: 'ممتاز' },
        { value: 'good', emoji: '😊', label: 'جيد' },
        { value: 'neutral', emoji: '😐', label: 'متوسط' },
        { value: 'bad', emoji: '😞', label: 'سيئ' },
        { value: 'very_bad', emoji: '😢', label: 'سيئ جداً' },
    ];

    const createMutation = useMutation({
        mutationFn: moodService.addEntry,
        onSuccess: () => {
            toast.success('تم تسجيل حالتك المزاجية بنجاح');
            queryClient.invalidateQueries({ queryKey: ['moodEntries'] });
            queryClient.invalidateQueries({ queryKey: ['moodAnalytics'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            onOpenChange(false);
            reset();
            setSelectedMood('');
        },
        onError: () => toast.error('حدث خطأ ما أثناء الحفظ'),
    });

    const onSubmit = (data: any) => {
        if (!selectedMood) return toast.error('أرينا كيف تشعرين أولاً باختيار وجه يعبر عنك');

        const payload = {
            ...data,
            mood: selectedMood,
            factors: {
                sleep: data.sleep,
                exercise: data.exercise,
                social: data.social,
                stress: data.stress,
            }
        };
        createMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-yellow-200 bg-yellow-500 hover:bg-yellow-600 transition-all hover:scale-105 text-white">
                    <Plus className="ml-2" /> تسجيل مشاعر اليوم
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] sm:rounded-[3.5rem] p-0 border-none font-primary max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-10" />

                <div className="relative p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
                    <DialogHeader className="mb-10 text-center">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-200 text-white"
                        >
                            <Smile size={40} />
                        </motion.div>
                        <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">كيف تشعرين الآن؟</DialogTitle>
                        <p className="text-center text-muted-foreground mt-3 font-medium text-lg">وداد تهتم بمشاعركِ وتسمعكِ دائماً</p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                        {/* Mood Selection Section */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 block text-center">اختر الحالة المزاجية</label>
                            <div className="grid grid-cols-5 gap-2 sm:gap-4 bg-muted/50 p-4 rounded-[2.5rem] border border-border">
                                {moods.map((m) => (
                                    <motion.button
                                        key={m.value}
                                        type="button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedMood(m.value)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300",
                                            selectedMood === m.value
                                                ? "bg-white shadow-xl shadow-yellow-200/50 scale-110 ring-2 ring-yellow-400"
                                                : "hover:bg-white/50 opacity-40 hover:opacity-80"
                                        )}
                                    >
                                        <span className="text-3xl sm:text-4xl filter drop-shadow-sm">{m.emoji}</span>
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter whitespace-nowrap">{m.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-yellow-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">تاريخ القياس</label>
                            <div className="relative flex items-center">
                                <CalendarIcon className="absolute right-4 text-yellow-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="date"
                                    defaultValue={new Date().toLocaleDateString('en-CA')}
                                    {...register('entry_date')}
                                    className="w-full h-14 pr-12 pl-4 rounded-xl bg-white border-2 border-transparent focus:border-yellow-200 outline-none font-bold text-foreground/80 shadow-sm transition-all text-center sm:text-right"
                                />
                            </div>
                        </div>

                        {/* Factors Section */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 block">ماذا جرى اليوم؟ (اختياري)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'sleep', icon: Moon, label: 'نوم كافٍ', color: 'indigo' },
                                    { id: 'exercise', icon: Zap, label: 'رياضة ممتعة', color: 'emerald' },
                                    { id: 'social', icon: Users, label: 'نشاط اجتماعي', color: 'pink' }
                                ].map((factor) => (
                                    <label key={factor.id} className="cursor-pointer group">
                                        <input type="checkbox" {...register(factor.id)} className="peer sr-only" />
                                        <div className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-transparent bg-muted/50 transition-all duration-300 gap-2",
                                            "group-hover:bg-white group-hover:border-border peer-checked:bg-white peer-checked:shadow-lg peer-checked:border-border"
                                        )}>
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                factor.color === 'indigo' ? "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white" :
                                                    factor.color === 'emerald' ? "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" :
                                                        "bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white"
                                            )}>
                                                <factor.icon size={20} />
                                            </div>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{factor.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-muted/50 p-6 rounded-[2.5rem] border border-border group focus-within:border-yellow-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">ملاحظاتكِ الخاصة</label>
                            <textarea
                                placeholder="اكتبي ما يجول في خاطركِ..."
                                {...register('notes')}
                                className="w-full min-h-[120px] p-4 rounded-2xl bg-white border-2 border-transparent focus:border-yellow-500/20 outline-none font-bold text-foreground/80 shadow-sm transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-10 px-10 pb-2">
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-xl shadow-yellow-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ مشاعري للمستقبل'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

function getMoodEmoji(mood: string) {
    const map: any = { very_good: '😄', good: '😊', neutral: '😐', bad: '😞', very_bad: '😢' };
    return map[mood] || '😐';
}
function getMoodLabel(mood: string) {
    const map: any = { very_good: 'ممتاز', good: 'جيد', neutral: 'متوسط', bad: 'سيئ', very_bad: 'سيئ جداً' };
    return map[mood] || '—';
}

const MOOD_TIPS: Record<string, string[]> = {
    very_good: [
        "استمري في روتينك الإيجابي، فالانتظام سر السعادة الدائمة",
        "شاركي طاقتكِ الجميلة مع من حولكِ اليوم",
        "هذا وقت رائع لتضعي هدفاً جديداً لنفسكِ"
    ],
    good: [
        "يوم جيد هو بداية أسبوع رائع، حافظي على هذا الزخم",
        "خذي لحظة لتشكري نفسكِ على كل ما أنجزتِه",
        "النوم الجيد الليلة سيجعل غدكِ أفضل"
    ],
    neutral: [
        "لحظات الهدوء فرصة للتأمل والتجديد الداخلي",
        "جربي نشاطاً بسيطاً تحبينه لرفع طاقتكِ",
        "التنفس العميق لخمس دقائق يصنع فرقاً حقيقياً"
    ],
    bad: [
        "من الطبيعي أن يكون لدينا أيام صعبة، أنتِ لستِ وحدكِ",
        "تواصلي مع شخص تثقين به وشاركيه مشاعركِ",
        "جسمكِ يحتاج للراحة، اسمحي لنفسكِ بذلك"
    ],
    very_bad: [
        "مشاعركِ صحيحة وتستحق الاهتمام، لا تتجاهليها",
        "تحدثي مع طبيبتكِ إذا شعرتِ أن الأمر يتجاوز طاقتكِ",
        "خطوة واحدة صغيرة كافية الآن، لا تحتاجين لأكثر من ذلك"
    ]
};

function MoodTips({ mostCommonMood }: { mostCommonMood: string | null }) {
    const tipsForMood = mostCommonMood && MOOD_TIPS[mostCommonMood] ? MOOD_TIPS[mostCommonMood] : [
        "سجلي حالتك المزاجية يومياً، لنتمكن من تقديم نصائح ملهمة تتناسب مع يومكِ!"
    ];

    const [tipIndex, setTipIndex] = useState(Math.floor(Math.random() * tipsForMood.length));

    React.useEffect(() => {
        setTipIndex(Math.floor(Math.random() * tipsForMood.length));
    }, [mostCommonMood, tipsForMood.length]);

    const nextTip = () => {
        if (tipsForMood.length <= 1) return;
        let next;
        do {
            next = Math.floor(Math.random() * tipsForMood.length);
        } while (next === tipIndex);
        setTipIndex(next);
    };

    const hasMultiple = tipsForMood.length > 1;

    return (
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="text-5xl filter drop-shadow-md transition-transform hover:scale-110 duration-300">
                        {mostCommonMood ? getMoodEmoji(mostCommonMood) : '✨'}
                    </div>
                </div>
                {hasMultiple && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextTip}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                        title="نصيحة أخرى"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </Button>
                )}
            </div>

            <div className="relative z-10 min-h-[6rem] flex items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tipIndex}
                        initial={{ opacity: 0, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(4px)' }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">همسة لكِ اليوم</p>
                        <p className="text-foreground font-bold text-xl leading-relaxed">
                            "{tipsForMood[tipIndex]}"
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
