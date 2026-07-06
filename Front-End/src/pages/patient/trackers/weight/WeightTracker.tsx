import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weightService } from '@/services/weightService';
import { useProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Weight, TrendingDown, TrendingUp, Minus, Trash2, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import AuthRequiredOverlay from '@/components/auth/AuthRequiredOverlay';
import BackButton from '@/components/common/BackButton';

export default function WeightTracker() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { profile } = useProfile();

    const { data: responseData, isLoading } = useQuery({
        queryKey: ['weightEntries'],
        queryFn: () => weightService.getEntries({ limit: 15 }),
        staleTime: 5 * 60 * 1000,
        enabled: isAuthenticated,
    });

    const { data: chartData, isLoading: isLoadingChart } = useQuery({
        queryKey: ['weightChart'],
        queryFn: () => weightService.getChartData('month'),
        staleTime: 5 * 60 * 1000,
        enabled: isAuthenticated,
    });

    // Reliable data extraction based on Laravel API Response shape (from successResponse)
    const stats = responseData?.stats || {};
    const entries = responseData?.entries || [];

    const deleteMutation = useMutation({
        mutationFn: weightService.deleteEntry,
        onSuccess: () => {
            toast.success('تم حذف التسجيل بنجاح');
            queryClient.invalidateQueries({ queryKey: ['weightEntries'] });
            queryClient.invalidateQueries({ queryKey: ['weightChart'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] }); // Sync profile
            setDeleteId(null);
        },
        onError: () => {
            toast.error('فشل في حذف التسجيل');
            setDeleteId(null);
        },
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
                feature="متتبع الوزن الذكي"
                description="سجلي دخولك لمتابعة وزنك وتتبع تقدمك نحو أهدافك الصحية"
            />
        );
    }

    if (isLoading) {
        return <WeightTrackerSkeleton />;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-primary">
            <div className="text-right">
                <BackButton />
            </div>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <Weight className="w-8 h-8" />
                        </div>
                        متتبع الوزن
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">تابعي أهدافك الصحية وحافظي على رشاقتك</p>
                </div>
                <WeightEntryDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Stats Card */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-colors" />

                        <div className="relative z-10">
                            <p className="text-blue-100 font-bold mb-2 uppercase tracking-widest text-xs">الوزن الحالي</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black font-mono tracking-tighter" dir="ltr">
                                    {stats?.current_weight || entries[0]?.weight || profile?.profile?.weight || '--'}
                                </span>
                                <span className="text-2xl font-bold opacity-60">kg</span>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-xl backdrop-blur-md",
                                        stats?.trend === 'decreasing' ? "bg-green-400/20 text-green-300" :
                                            stats?.trend === 'increasing' ? "bg-red-400/20 text-red-300" : "bg-white/10 text-white"
                                    )}>
                                        {stats?.trend === 'decreasing' && <TrendingDown size={20} />}
                                        {stats?.trend === 'increasing' && <TrendingUp size={20} />}
                                        {stats?.trend === 'stable' && <Minus size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-200 font-bold leading-none mb-1">تغير كلي</p>
                                        <p className="text-lg font-black" dir="ltr">
                                            {Math.abs(stats?.total_change || 0)} kg
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-blue-200 font-bold leading-none mb-1">BMI</p>
                                    <p className="text-lg font-black">{entries[0]?.bmi || profile?.profile?.bmi || '--'}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-foreground font-bold">
                            <Info className="w-5 h-5 text-blue-500" />
                            تحليل المؤشرات
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-4 bg-muted rounded-2xl">
                                <p className="text-muted-foreground mb-1 font-bold text-[10px] uppercase">أقل وزن</p>
                                <p className="text-lg font-bold text-foreground/80">
                                    <span dir="ltr">{stats?.min_weight || profile?.profile?.weight || '--'} kg</span>
                                </p>
                            </div>
                            <div className="p-4 bg-muted rounded-2xl">
                                <p className="text-muted-foreground mb-1 font-bold text-[10px] uppercase">أعلى وزن</p>
                                <p className="text-lg font-bold text-foreground/80">
                                    <span dir="ltr">{stats?.max_weight || profile?.profile?.weight || '--'} kg</span>
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl col-span-2">
                                <p className="text-blue-600 mb-1 font-bold text-[10px] uppercase">الوزن المستهدف</p>
                                <p className="text-lg font-bold text-blue-700">
                                    <span dir="ltr">{chartData?.goal || '--'} kg</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Graph Area */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-border shadow-sm relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">بيانات التطور</h3>
                            <p className="text-muted-foreground text-sm">التغيرات خلال آخر 30 يوماً</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" /> الوزن
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {isLoadingChart ? (
                            <Skeleton className="w-full h-full rounded-2xl" />
                        ) : chartData?.chart_data && chartData.chart_data.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.chart_data}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => {
                                            if (!str) return '';
                                            try {
                                                return format(new Date(str), 'd MMM', { locale: ar });
                                            } catch (e) {
                                                return '';
                                            }
                                        }}
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                                        labelFormatter={(date) => {
                                            if (!date) return '';
                                            try {
                                                return format(new Date(date), 'd MMMM yyyy', { locale: ar });
                                            } catch (e) {
                                                return '';
                                            }
                                        }}
                                    />
                                    {chartData?.goal && (
                                        <ReferenceLine y={chartData.goal} stroke="#10b981" strokeDasharray="3 3" />
                                    )}
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-border bg-muted rounded-[2rem] border border-dashed border-border">
                                <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-bold">سجلي وزنين على الأقل لرؤية الرسم البياني</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">السجل التاريخي</h2>
                    <span className="bg-muted/50 text-muted-foreground px-4 py-1.5 rounded-full text-xs font-bold">
                        إجمالي المشاركات: {entries.length}
                    </span>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-black uppercase tracking-[0.1em]">
                                    <th className="p-6 text-right">التاريخ</th>
                                    <th className="p-6 text-center">الوزن</th>
                                    <th className="p-6 text-center">مؤشر الكتلة (BMI)</th>
                                    <th className="p-6 text-right hidden md:table-cell">الحالة</th>
                                    <th className="p-6 text-left">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                                <AnimatePresence mode="popLayout">
                                    {entries.map((entry: any) => (
                                        <motion.tr
                                            key={entry.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        <CalendarIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground/80">{entry.entry_date ? format(parseISO(entry.entry_date), 'd MMMM', { locale: ar }) : '—'}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{entry.entry_date ? format(parseISO(entry.entry_date), 'yyyy') : ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="text-lg font-black text-foreground font-mono" dir="ltr">{entry.weight}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground mr-1">kg</span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-muted/50 text-muted-foreground font-bold text-xs">
                                                    {entry.bmi || '--'}
                                                </div>
                                            </td>
                                            <td className="p-6 hidden md:table-cell">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                                                    entry.bmi_category === 'Normal' ? "bg-green-100 text-green-700" :
                                                        entry.bmi_category === 'Overweight' ? "bg-yellow-100 text-yellow-700" :
                                                            entry.bmi_category === 'Underweight' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {getBMICategoryArabic(entry.bmi_category)}
                                                </span>
                                            </td>
                                            <td className="p-6 text-left">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(entry.id)}
                                                    className="w-10 h-10 rounded-xl text-border hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    {entries.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="inline-flex p-6 bg-muted rounded-full mb-4">
                                <Weight className="w-12 h-12 text-border" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد بيانات مسجلة</h3>
                            <p className="text-muted-foreground">ابدئي بتسجيل وزنكِ اليوم لمتابعة صحتك</p>
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="mt-8 rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
                            >
                                سجل أول وزن الآن
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Delete Alert */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] font-primary p-10 max-w-md border-none">
                    <AlertDialogHeader>
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center text-foreground mb-2">حذف تسجيل الوزن؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-lg leading-relaxed">
                            هل أنتِ متأكدة؟ سيتم حذف هذا السجل بشكل دائم من سجلاتك الصحية.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-3 mt-8">
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-red-200"
                        >
                            {deleteMutation.isPending ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
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

function getBMICategoryArabic(cat: string) {
    const map: any = {
        'Underweight': 'وزن ناقص',
        'Normal': 'وزن مثالي',
        'Overweight': 'وزن زائد',
        'Obese': 'سمنة',
        'Unknown': 'غير معروف'
    };
    return map[cat] || cat;
}

function WeightTrackerSkeleton() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-pulse font-primary">
            <header className="flex justify-between items-center">
                <div className="space-y-3">
                    <Skeleton className="h-12 w-64 rounded-2xl" />
                    <Skeleton className="h-4 w-96 rounded-full" />
                </div>
                <Skeleton className="h-14 w-40 rounded-2xl" />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Skeleton className="h-[300px] rounded-[3rem]" />
                <Skeleton className="h-[300px] md:col-span-2 rounded-[3rem]" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-[3rem]" />
        </div>
    );
}

const WeightEntryDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();
    const { profile } = useProfile();

    const createMutation = useMutation({
        mutationFn: weightService.addEntry,
        onSuccess: () => {
            toast.success('تم تسجيل الوزن بنجاح، استمري في التقدّم!');
            queryClient.invalidateQueries({ queryKey: ['weightEntries'] });
            queryClient.invalidateQueries({ queryKey: ['weightChart'] });
            queryClient.invalidateQueries({ queryKey: ['trackersSummary'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] }); // Sync profile
            onOpenChange(false);
            reset();
        },
        onError: () => toast.error('حدث خطأ أثناء حفظ البيانات'),
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            height: profile?.profile?.height || null,
        };
        createMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
                    <Plus className="ml-2" /> تسجيل وزن جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] sm:rounded-[3.5rem] p-0 border-none font-primary max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-blue-600 to-cyan-500 opacity-10" />

                <div className="relative p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 text-right">
                    <DialogHeader className="mb-10 text-center">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 text-white"
                        >
                            <TrendingUp size={40} />
                        </motion.div>
                        <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-center">أهلاً بكِ مجدداً</DialogTitle>
                        <p className="text-center text-muted-foreground mt-3 font-medium text-lg">كل خطوة صغيرة تقربكِ من هدفكِ المثالي</p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                        {/* Weight Input Section */}
                        <div className="bg-muted/50 p-8 rounded-[3rem] border border-border group focus-within:border-blue-200 transition-all text-center">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-6 block">الوزن الحالي</label>
                            <div className="relative inline-flex items-center justify-center">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    placeholder="00.0"
                                    {...register('weight', { required: true, min: 30, max: 300 })}
                                    className="w-48 h-24 bg-transparent border-none outline-none font-mono text-7xl font-black text-foreground text-center placeholder:text-muted"
                                />
                                <span className="text-2xl font-black text-blue-500 mt-6 ml-2">kg</span>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="bg-muted/50 p-6 rounded-[2rem] border border-border group focus-within:border-blue-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">تاريخ القياس</label>
                            <div className="relative flex items-center">
                                <CalendarIcon className="absolute right-4 text-blue-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="date"
                                    defaultValue={new Date().toLocaleDateString('en-CA')}
                                    {...register('entry_date')}
                                    className="w-full h-14 pr-12 pl-4 rounded-xl bg-white border-2 border-transparent focus:border-blue-200 outline-none font-bold text-foreground/80 shadow-sm transition-all text-center sm:text-right"
                                />
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-muted/50 p-6 rounded-[2.5rem] border border-border group focus-within:border-blue-200 transition-all">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">ملاحظاتكِ</label>
                            <textarea
                                placeholder="كيف تشعرين اليوم؟ هل حققتِ هدفاً معيناً؟"
                                {...register('notes')}
                                className="w-full min-h-[100px] p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-200 outline-none font-bold text-foreground/80 shadow-sm transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-10 px-10 pb-2">
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full h-16 rounded-2xl text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'جاري الحفظ...' : 'تحديث وزني الآن'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
