import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fertilityService } from '@/services/fertilityService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Heart, Plus, Thermometer, Baby, Trash2, Calendar as CalendarIcon, Sparkles, Droplets, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AuthRequiredOverlay from '@/components/auth/AuthRequiredOverlay';
import BackButton from '@/components/common/BackButton';

export default function FertilityTracker() {
    const { isAuthenticated } = useAuth();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: entriesData, isLoading: loadingEntries } = useQuery({
        queryKey: ['fertilityEntries'],
        queryFn: () => fertilityService.getEntries(),
        staleTime: 0,
        enabled: isAuthenticated,
    });

    const { data: windowData, isLoading: loadingWindow } = useQuery({
        queryKey: ['fertileWindow'],
        queryFn: () => fertilityService.getFertileWindow(),
        staleTime: 0,
        enabled: isAuthenticated,
    });

    const getEntriesArray = (data: any) => {
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        if (data?.entries && Array.isArray(data.entries)) return data.entries;
        return [];
    };

    const entries = getEntriesArray(entriesData);
    const fertileWindowData = windowData?.data || windowData;

    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: fertilityService.deleteEntry,
        onSuccess: () => {
            toast.success('تم حذف التسجيل بنجاح');
            queryClient.invalidateQueries({ queryKey: ['fertilityEntries'] });
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
                feature="متتبع الخصوبة"
                description="سجلي دخولك لتتبع نافذة خصوبتك والحصول على توقعات ذكية"
            />
        );
    }

    if (loadingEntries && loadingWindow) {
        return <FertilityTrackerSkeleton />;
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
                        <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200">
                            <Baby className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">متتبع الخصوبة</h1>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium mr-2">افهمي دورتكِ الهرمونية وحالة الخصوبة اليومية بدقة</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <FertilityEntryDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
                </motion.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Status Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Fertile Window Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-10 rounded-[3rem] text-white shadow-2xl shadow-purple-200 relative overflow-hidden group"
                    >
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                        <Heart className="w-5 h-5 fill-white" />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-purple-100">حالة الخصوبة اليوم</span>
                                </div>

                                {fertileWindowData?.fertile_window ? (
                                    <>
                                        <h2 className="text-5xl font-black leading-tight">
                                            {fertileWindowData.fertile_window.based_on_entries
                                                ? <>مؤشرات الخصوبة <br /><span className="text-purple-200">إيجابية الآن!</span></>
                                                : <>نافذة الخصوبة <br /><span className="text-purple-200">متاحة الآن!</span></>
                                            }
                                        </h2>
                                        {!fertileWindowData.fertile_window.based_on_entries && fertileWindowData.fertile_window.start_date && (
                                            <div className="flex flex-wrap gap-4">
                                                <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] uppercase font-black text-purple-200 mb-1">من تاريخ</p>
                                                    <p className="text-lg font-bold">{format(parseISO(fertileWindowData.fertile_window.start_date), 'd MMMM', { locale: ar })}</p>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] uppercase font-black text-purple-200 mb-1">إلى تاريخ</p>
                                                    <p className="text-lg font-bold">{format(parseISO(fertileWindowData.fertile_window.end_date!), 'd MMMM', { locale: ar })}</p>
                                                </div>
                                                {fertileWindowData.fertile_window.days_remaining !== null && (
                                                    <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
                                                        <p className="text-[10px] uppercase font-black text-purple-200 mb-1">يوم الذروة</p>
                                                        <p className="text-lg font-bold">{format(parseISO(fertileWindowData.fertile_window.peak_day!), 'd MMMM', { locale: ar })}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {fertileWindowData.fertile_window.based_on_entries && (
                                            <div className="flex flex-wrap gap-3">
                                                {fertileWindowData.ovulation?.indicators?.has_positive_test && (
                                                    <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 text-sm font-bold">✅ اختبار إيجابي</div>
                                                )}
                                                {fertileWindowData.ovulation?.indicators?.has_egg_white_mucus && (
                                                    <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 text-sm font-bold">💧 بياض بيض</div>
                                                )}
                                                {fertileWindowData.ovulation?.indicators?.has_bbt_rise && (
                                                    <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 text-sm font-bold">🌡️ حرارة مرتفعة</div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black leading-tight opacity-90">ننتظر المزيد من البيانات</h2>
                                        <p className="text-purple-100 text-lg max-w-md">سجلي بيانات دورتكِ الشهرية ودرجة حرارة جسمكِ بانتظام لنتمكن من حساب نافذة خصوبتكِ بدقة.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center min-w-[200px]">
                                <p className="text-xs font-black uppercase tracking-widest text-purple-200 mb-2">فرصة الحمل</p>
                                <div className="text-4xl font-black mb-1">
                                    {fertileWindowData?.fertile_window ? 'عالية جداً' : 'عادية'}
                                </div>
                                <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden mt-4">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: fertileWindowData?.fertile_window ? '100%' : '30%' }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recommendations Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-xl shadow-border/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-50 rounded-xl text-yellow-600">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground">نصائح مخصصة</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(fertileWindowData?.recommendations) && fertileWindowData.recommendations.map((rec: string, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 items-start p-5 bg-muted rounded-3xl hover:bg-purple-50 transition-colors group"
                                >
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 group-hover:scale-150 transition-transform" />
                                    <span className="text-foreground/80 text-sm font-bold leading-relaxed">{rec}</span>
                                </motion.div>
                            ))}
                            {(!Array.isArray(fertileWindowData?.recommendations) || fertileWindowData.recommendations.length === 0) && (
                                <div className="col-span-full py-10 text-center text-muted-foreground font-bold border-2 border-dashed border-border rounded-[2rem]">
                                    لا توجد نصائح حالياً. استمري في التسجيل للحصول على إرشادات ذكية.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Logs */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-foreground">سجل القياسات</h2>
                        <span className="text-[10px] font-black uppercase bg-muted/50 text-muted-foreground px-3 py-1 rounded-full">{(entries || []).length} تسجيلات</span>
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {entries?.map((entry: any, idx: number) => (
                                <motion.div
                                    key={entry.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white p-6 rounded-[2rem] border border-border hover:shadow-xl hover:shadow-border transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                                <CalendarIcon size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground">
                                                    {entry.entry_date ? format(parseISO(entry.entry_date), 'd MMMM', { locale: ar }) : '—'}
                                                </p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{entry.entry_date ? format(parseISO(entry.entry_date), 'yyyy') : ''}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(entry.id)}
                                            className="text-border hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {entry.bbt && (
                                            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-black">
                                                <Thermometer size={14} className="text-blue-500" />
                                                {entry.bbt}°
                                            </div>
                                        )}
                                        {entry.intercourse && (
                                            <div className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl text-xs font-black">
                                                <Heart size={14} className="text-pink-500 fill-pink-500" />
                                                لقاء
                                            </div>
                                        )}
                                        {entry.ovulation_test_positive && (
                                            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-black">
                                                <Sparkles size={14} className="text-purple-500" />
                                                إباضة (+)
                                            </div>
                                        )}
                                        {entry.cervical_mucus && (
                                            <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1.5 rounded-xl text-xs font-black">
                                                <Droplets size={14} className="text-muted-foreground" />
                                                {getMucusLabel(entry.cervical_mucus)}
                                            </div>
                                        )}
                                    </div>

                                    {entry.is_fertile_day && (
                                        <div className="mt-3 py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white text-[10px] font-black text-center uppercase tracking-widest">
                                            يوم ذو خصوبة عالية
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {!entries.length && (
                            <div className="py-20 text-center bg-muted rounded-[2.5rem] border-2 border-dashed border-border">
                                <Baby className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="text-muted-foreground font-bold">لا توجد قياسات مسجلة</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Alert */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] font-primary p-10 max-w-md border-none">
                    <AlertDialogHeader>
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center text-foreground mb-2">حذف القياس؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-lg">
                            سيتم حذف هذا التسجيل بشكل نهائي من قاعدة بياناتك الصحية.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-3 mt-8">
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-red-200"
                        >
                            نعم، قم بالحذف
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

function FertilityTrackerSkeleton() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-pulse font-primary">
            <header className="flex justify-between items-center">
                <div className="space-y-4">
                    <Skeleton className="h-14 w-64 rounded-2xl" />
                    <Skeleton className="h-5 w-96 rounded-full" />
                </div>
                <Skeleton className="h-14 w-44 rounded-2xl" />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-8">
                    <Skeleton className="h-[350px] rounded-[3rem]" />
                    <Skeleton className="h-[250px] rounded-[2.5rem]" />
                </div>
                <div className="md:col-span-4 space-y-4">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-40 rounded-[2rem]" />
                    <Skeleton className="h-40 rounded-[2rem]" />
                    <Skeleton className="h-40 rounded-[2rem]" />
                </div>
            </div>
        </div>
    );
}

const FertilityEntryDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();

    const addMutation = useMutation({
        mutationFn: fertilityService.addEntry,
        onSuccess: () => {
            toast.success('تم تسجيل البيانات بنجاح');
            queryClient.invalidateQueries({ queryKey: ['fertilityEntries'] });
            queryClient.invalidateQueries({ queryKey: ['fertileWindow'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            onOpenChange(false);
            reset();
        },
        onError: () => toast.error('حدث خطأ ما أثناء الحفظ'),
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            ovulation_test_positive: data.ovulation_test === 'positive',
            intercourse: !!data.intercourse
        };
        addMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-purple-200 bg-purple-600 hover:bg-purple-700 transition-all hover:scale-105">
                    <Plus className="ml-2" /> إضافة قياس يومي
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] sm:rounded-[3.5rem] p-0 border-none font-primary max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-purple-600 to-indigo-600 opacity-10" />

                <div className="relative p-6 sm:p-10 overflow-y-auto custom-scrollbar">
                    <DialogHeader className="mb-10 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-200 text-white animate-float">
                            <Baby size={40} />
                        </div>
                        <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground text-center tracking-tight">سجل الخصوبة</DialogTitle>
                        <p className="text-center text-muted-foreground mt-3 font-medium text-lg">دقة بياناتكِ تعني توقعات أكثر ذكاءً</p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative">
                        {/* Entry Date Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-purple-200 transition-all"
                        >
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">تاريخ القياس</label>
                            <div className="relative flex items-center">
                                <CalendarIcon className="absolute right-4 text-purple-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="date"
                                    defaultValue={new Date().toLocaleDateString('en-CA')}
                                    {...register('entry_date')}
                                    className="w-full h-14 pr-12 pl-4 rounded-xl bg-white border-2 border-transparent focus:border-purple-200 outline-none font-bold text-foreground/80 shadow-sm transition-all"
                                />
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-right">
                            {/* BBT Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-blue-50/30 p-6 rounded-[2rem] border border-blue-50 group focus-within:border-blue-200 transition-all"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Thermometer className="w-4 h-4 text-blue-500" />
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">الحرارة (BBT)</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="36.5"
                                        {...register('bbt', { valueAsNumber: true })}
                                        className="w-full h-14 p-4 rounded-xl bg-white border-2 border-transparent focus:border-blue-200 outline-none font-mono text-xl font-black text-foreground/80 shadow-sm transition-all"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-border font-bold">°C</span>
                                </div>
                            </motion.div>

                            {/* Ovulation Test */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-purple-50/30 p-6 rounded-[2rem] border border-purple-50 group focus-within:border-purple-200 transition-all"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">اختبار الإباضة</label>
                                </div>
                                <select
                                    {...register('ovulation_test')}
                                    className="w-full h-14 px-4 rounded-xl bg-white border-2 border-transparent focus:border-purple-200 outline-none font-bold text-foreground/80 shadow-sm appearance-none cursor-pointer transition-all"
                                >
                                    <option value="">غير محدد</option>
                                    <option value="negative">سلبي (-)</option>
                                    <option value="positive">إيجابي (+)</option>
                                </select>
                            </motion.div>
                        </div>

                        {/* Cervical Mucus */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-purple-200 transition-all"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Droplets className="w-4 h-4 text-muted-foreground" />
                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">الإفرازات العنقودية</label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'dry', label: 'جاف' },
                                    { id: 'sticky', label: 'لزج' },
                                    { id: 'creamy', label: 'كريمي' },
                                    { id: 'watery', label: 'مائي' },
                                    { id: 'egg_white', label: 'بياض بيض' }
                                ].map((type) => (
                                    <label key={type.id} className="relative cursor-pointer">
                                        <input
                                            type="radio"
                                            value={type.id}
                                            {...register('cervical_mucus')}
                                            className="peer sr-only"
                                        />
                                        <div className="h-12 flex items-center justify-center rounded-xl bg-white border-2 border-transparent peer-checked:border-purple-500 peer-checked:bg-purple-50 text-muted-foreground peer-checked:text-purple-700 font-bold text-xs transition-all shadow-sm">
                                            {type.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </motion.div>

                        {/* Notes Field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-purple-200 transition-all"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="w-4 h-4 text-muted-foreground" />
                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">ملاحظات (اختياري)</label>
                            </div>
                            <textarea
                                {...register('notes')}
                                placeholder="أي ملاحظات إضافية عن حالتكِ اليوم..."
                                maxLength={500}
                                rows={3}
                                className="w-full p-4 rounded-xl bg-white border-2 border-transparent focus:border-purple-200 outline-none font-medium text-foreground/80 shadow-sm transition-all resize-none text-sm"
                            />
                        </motion.div>

                        {/* Intercourse Toggle */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-pink-50/30 p-2 rounded-[2rem] border border-pink-100/50"
                        >
                            <label className="flex items-center gap-4 cursor-pointer p-4 group">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" {...register('intercourse')} className="peer sr-only" />
                                    <div className="w-14 h-8 bg-border rounded-full peer-checked:bg-pink-500 transition-colors duration-300" />
                                    <div className="absolute left-1 peer-checked:left-7 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2">
                                        <Heart size={16} className="text-pink-500 fill-pink-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-black text-foreground/80 leading-none">حدث لقاء بين الزوجين</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-tighter mt-1">يساعد في رفع دقة التوقعات</span>
                                </div>
                            </label>
                        </motion.div>

                        <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-10 px-10 pb-2">
                            <Button
                                type="submit"
                                disabled={addMutation.isPending}
                                className="w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ القياس الآن'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

function getMucusLabel(val: string) {
    const map: any = {
        dry: 'جاف',
        sticky: 'لزج',
        creamy: 'كريمي',
        watery: 'مائي',
        egg_white: 'بياض البيض'
    };
    return map[val] || val || '—';
}
