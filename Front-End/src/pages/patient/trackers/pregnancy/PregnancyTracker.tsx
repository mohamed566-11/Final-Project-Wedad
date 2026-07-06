import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Baby, Calendar as CalendarIcon, Activity,
    Weight as WeightIcon, Heart, Plus, Check, FileText, Archive, Pill, Footprints,
    BookOpen, Droplets, Stethoscope, NotebookPen, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pregnancyService } from '@/services/pregnancyService';
import { StartPregnancyDialog } from './StartPregnancyDialog';
import { PregnancyEntryDialog } from './PregnancyEntryDialog';
import { PregnancyTimelineDialog } from './PregnancyTimelineDialog';
import { PregnancyMedicalFilesDialog } from './PregnancyMedicalFilesDialog';
import { PregnancyWeightDialog } from './PregnancyWeightDialog';
import { PregnancyHistoryDialog } from './PregnancyHistoryDialog';
import { PregnancyMedicationsDialog } from './PregnancyMedicationsDialog';
import { PregnancyKickCounterDialog } from './PregnancyKickCounterDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import AuthRequiredOverlay from '@/components/auth/AuthRequiredOverlay';
import BackButton from '@/components/common/BackButton';

export default function PregnancyTracker() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
    const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
    const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
    const [isFilesDialogOpen, setIsFilesDialogOpen] = useState(false);
    const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isMedsDialogOpen, setIsMedsDialogOpen] = useState(false);
    const [isKickCounterOpen, setIsKickCounterOpen] = useState(false);

    const { data: pregnancy, isLoading, error } = useQuery({
        queryKey: ['currentPregnancy'],
        queryFn: pregnancyService.getCurrentPregnancy,
        retry: false, // Don't retry if 404
        enabled: isAuthenticated,
    });

    // Fetch pregnancy stats (blood pressure, weight, etc.)
    const { data: pregnancyStats } = useQuery({
        queryKey: ['pregnancyStats'],
        queryFn: pregnancyService.getStats,
        enabled: isAuthenticated && !!pregnancy,
    });

    // Fetch weekly info based on current week
    const { data: weekInfo } = useQuery({
        queryKey: ['pregnancyWeekInfo', pregnancy?.current_week],
        queryFn: () => pregnancyService.getWeekInfo(pregnancy!.current_week),
        enabled: isAuthenticated && !!pregnancy?.current_week,
    });

    // Fetch pregnancy entries (diary)
    const { data: entries } = useQuery({
        queryKey: ['pregnancyEntries'],
        queryFn: pregnancyService.getEntries,
        enabled: isAuthenticated && !!pregnancy,
    });

    // Derive display values from latest entry (entries sorted desc)
    const latestEntry = entries?.[0];
    const oldestEntry = entries && entries.length > 1 ? entries[entries.length - 1] : null;
    const latestWeight = latestEntry?.weight ?? pregnancyStats?.weight_stats?.current_weight;
    const startingWeight = oldestEntry?.weight ?? pregnancyStats?.weight_stats?.starting_weight;
    const weightGain = latestWeight && startingWeight ? +(latestWeight - startingWeight).toFixed(1) : 0;
    const latestSys = latestEntry?.blood_pressure_systolic;
    const latestDia = latestEntry?.blood_pressure_diastolic;
    const bpNormal = !!(latestSys && latestSys < 140 && latestDia && latestDia < 90);

    // Delete entry mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => pregnancyService.deleteEntry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pregnancyEntries'] });
            queryClient.invalidateQueries({ queryKey: ['pregnancyStats'] });
            queryClient.invalidateQueries({ queryKey: ['currentPregnancy'] });
        },
    });

    // Show auth overlay for non-authenticated users
    if (!isAuthenticated) {
        return (
            <AuthRequiredOverlay
                feature="متتبع الحمل"
                description="سجلي دخولك لمتابعة رحلة حملك أسبوعاً بأسبوع والحصول على نصائح مخصصة"
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-rose-50/30">
                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Check if error is 404 (No active pregnancy)
    const isNoPregnancy = error && (error as any).response?.status === 404;

    if (isNoPregnancy || !pregnancy) {
        return (
            <div className="min-h-screen bg-rose-50/30 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Baby size={48} className="text-rose-500" />
                </div>
                <h1 className="text-3xl font-black text-foreground mb-2">رحلة أمومة جديدة</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    ابدئي بتسجيل تفاصيل حملك لنقوم بمساعدتك في متابعة نمو طفلك أسبوعاً بأسبوع.
                </p>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsStartDialogOpen(true)}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 rounded-2xl text-lg shadow-lg shadow-rose-200"
                    >
                        <Plus className="ml-2" />
                        بدء متابعة حمل جديد
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsHistoryDialogOpen(true)}
                        className="px-6 py-6 rounded-2xl text-lg border-border hover:bg-muted text-muted-foreground"
                    >
                        <Archive className="ml-2" size={20} />
                        الأرشيف
                    </Button>
                </div>

                <StartPregnancyDialog
                    open={isStartDialogOpen}
                    onOpenChange={setIsStartDialogOpen}
                />
                <PregnancyHistoryDialog
                    open={isHistoryDialogOpen}
                    onOpenChange={setIsHistoryDialogOpen}
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-primary space-y-8 pb-24">
            <div className="text-right">
                <BackButton />
            </div>
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/50 text-rose-600 font-bold text-sm mb-3 border border-rose-100"
                    >
                        <Activity size={16} /> الثلث {pregnancy.trimester === 1 ? 'الأول' : pregnancy.trimester === 2 ? 'الثاني' : 'الثالث'}
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-2">
                        الأسبوع {pregnancy.current_week}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">
                        باقي {pregnancy.days_remaining} يوم على موعد اللقاء المنتظر 👶
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => setIsMedsDialogOpen(true)}
                        className="h-14 px-5 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center justify-center shrink-0 border-0 font-bold gap-2"
                        title="الأدوية"
                    >
                        <Pill size={20} /> الأدوية
                    </Button>
                    <Button
                        onClick={() => setIsTimelineDialogOpen(true)}
                        variant="outline"
                        className="flex-1 md:flex-none h-14 rounded-2xl border-2 border-border text-muted-foreground font-bold hover:border-rose-200 hover:bg-rose-50 transition-all"
                    >
                        <CalendarIcon className="ml-2 w-5 h-5 text-rose-500" /> الجدول
                    </Button>
                    <Button
                        onClick={() => setIsEntryDialogOpen(true)}
                        className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-foreground text-white font-bold shadow-xl hover:bg-foreground transition-all"
                    >
                        <Plus className="ml-2" /> تسجيل يوميات
                    </Button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* Baby Card (Left - Large) */}
                <div className="lg:col-span-8 space-y-6">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[3rem] p-8 sm:p-12 text-white relative overflow-hidden min-h-[400px] flex flex-col justify-between shadow-2xl shadow-rose-200"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold opacity-90 mb-1">حجم طفلك الآن مثل</h2>
                            <div className="text-5xl sm:text-7xl font-black tracking-tight mb-4 drop-shadow-lg">
                                {pregnancy.baby_development?.size_comparison || 'غير محدد'}
                            </div>
                            <div className="flex items-center gap-4 text-rose-100 font-medium">
                                <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                                    الطول: {pregnancy.baby_development?.length_cm} سم
                                </span>
                                <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                                    الوزن: {pregnancy.baby_development?.weight_grams} جم
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar inside Card */}
                        <div className="relative z-10 mt-10">
                            <div className="flex justify-between text-sm font-bold mb-3 opacity-90">
                                <span>بداية الحمل</span>
                                <span>الموعد المتوقع ({pregnancy.due_date && !isNaN(new Date(pregnancy.due_date).getTime()) ? format(new Date(pregnancy.due_date), 'd MMM yyyy', { locale: arEG }) : '--'})</span>
                            </div>
                            <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(pregnancy.days_pregnant / 280) * 100}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                />
                            </div>
                            <div className="mt-3 text-center font-bold bg-white/20 inline-block px-4 py-1 rounded-full text-sm backdrop-blur-md border border-white/10 mx-auto">
                                أنتِ في الأسبوع {pregnancy.current_week} واليوم {pregnancy.current_day}
                            </div>
                        </div>
                    </motion.div>

                    {/* Weekly Tips / Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoCard
                            title="تطور طفلك"
                            icon={<Baby className="text-blue-500" />}
                            bg="bg-blue-50/50"
                            border="border-blue-100"
                            delay={0.1}
                        >
                            {weekInfo?.mother_changes?.length > 0
                                ? weekInfo.mother_changes.join('، ')
                                : 'يتطور طفلك بشكل رائع هذا الأسبوع!'}
                        </InfoCard>
                        <InfoCard
                            title="نصيحة لكِ"
                            icon={<Heart className="text-rose-500" />}
                            bg="bg-rose-50/50"
                            border="border-rose-100"
                            delay={0.2}
                        >
                            {weekInfo?.medical_tips?.length > 0
                                ? weekInfo.medical_tips[0]
                                : 'حافظي على نمط حياة صحي ومتابعة دورية مع طبيبك.'}
                        </InfoCard>
                    </div>
                </div>

                {/* Sidebar Stats (Right) */}
                <div className="lg:col-span-4 space-y-6">
                    <StatCard
                        title="وزنك الحالي"
                        value={`${latestWeight ?? '--'} kg`}
                        subtext={
                            weightGain > 0 ? `+${weightGain} kg منذ البداية`
                            : weightGain < 0 ? `${weightGain} kg منذ البداية`
                            : 'لم يتغير الوزن بعد'
                        }
                        icon={<WeightIcon />}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                        delay={0.3}
                        onClick={() => setIsWeightDialogOpen(true)}
                        className="cursor-pointer hover:shadow-xl hover:scale-[1.02]"
                    />

                    <StatCard
                        title="ضغط الدم"
                        value={latestSys && latestDia ? `${latestSys}/${latestDia}` : 'لم يُسجَّل'}
                        subtext={
                            latestSys
                                ? (bpNormal ? 'المعدل طبيعي' : '⚠️ راجعي طبيبك')
                                : 'سجلي قراءتك في اليوميات'
                        }
                        icon={<Activity />}
                        color="text-purple-600"
                        bg="bg-purple-50"
                        delay={0.4}
                    />

                    <StatCard
                        title="السجلات السابقة"
                        value="الأرشيف"
                        subtext="عرض تاريخ الحمل السابق"
                        icon={<Archive />}
                        color="text-orange-600"
                        bg="bg-orange-50"
                        delay={0.5}
                        onClick={() => setIsHistoryDialogOpen(true)}
                        className="cursor-pointer hover:shadow-xl hover:scale-[1.02]"
                    />

                    <StatCard
                        title="ركلات الجنين"
                        value="ابدأ العد"
                        subtext="تابعي حركة جنينك الآن"
                        icon={<Footprints />}
                        color="text-rose-600"
                        bg="bg-rose-50"
                        delay={0.6}
                        onClick={() => setIsKickCounterOpen(true)}
                        className="cursor-pointer hover:shadow-xl hover:scale-[1.02]"
                    />

                    {/* Checklist Section */}
                    <ChecklistSection />
                </div>
            </div>

            {/* Entries / Diary Section */}
            {entries && entries.length > 0 && (() => {
                const SYMPTOM_LABELS: Record<string, string> = {
                    nausea: 'غثيان 🤢',
                    fatigue: 'تعب وإرهاق 😴',
                    headache: 'صداع 🤕',
                    back_pain: 'ألم ظهر 🦴',
                    heartburn: 'حرقان 🔥',
                    swelling: 'تورم 🦶',
                    cramps: 'تقلصات ⚡',
                    mood_swings: 'تغير مزاج 🎭',
                };
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-teal-200">
                                <NotebookPen size={22} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground">سجل اليوميات</h2>
                                <p className="text-sm text-muted-foreground font-medium">{entries.length} تسجيل</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {entries.slice(0, 5).map((entry: any, idx: number) => {
                                // symptoms can come as JSON string or already as array
                                const symptoms: string[] = Array.isArray(entry.symptoms)
                                    ? entry.symptoms
                                    : (typeof entry.symptoms === 'string' ? JSON.parse(entry.symptoms || '[]') : []);

                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-[2rem] border border-border p-5 shadow-sm hover:shadow-md transition-all"
                                    >
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
                                                    <span className="text-rose-500 font-black text-sm leading-none">أ{entry.week_number}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">الأسبوع {entry.week_number}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(entry.entry_date), 'EEEE، d MMMM yyyy', { locale: arEG })}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => setEntryToDelete(entry.id)}
                                                disabled={deleteMutation.isPending}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 border border-transparent hover:border-red-100 disabled:opacity-40"
                                                title="حذف التسجيل"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Stats chips */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {entry.weight && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                                    <WeightIcon size={13} className="text-emerald-600" />
                                                    <span className="text-xs font-bold text-emerald-700">{entry.weight} كجم</span>
                                                </div>
                                            )}
                                            {entry.blood_pressure_systolic && entry.blood_pressure_diastolic && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-100">
                                                    <Activity size={13} className="text-purple-600" />
                                                    <span className="text-xs font-bold text-purple-700">{entry.blood_pressure_systolic}/{entry.blood_pressure_diastolic} ملم</span>
                                                </div>
                                            )}
                                            {symptoms.map((s: string, sIdx: number) => (
                                                <div key={sIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
                                                    <span className="text-xs font-bold text-amber-700">{SYMPTOM_LABELS[s] ?? s}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Notes */}
                                        {entry.notes && (
                                            <p className="text-sm text-muted-foreground bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                                                {entry.notes}
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })()}

            <StartPregnancyDialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen} />
            <PregnancyEntryDialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen} />
            <PregnancyTimelineDialog open={isTimelineDialogOpen} onOpenChange={setIsTimelineDialogOpen} />
            <PregnancyMedicalFilesDialog open={isFilesDialogOpen} onOpenChange={setIsFilesDialogOpen} />
            <PregnancyWeightDialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen} />
            <PregnancyHistoryDialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} />
            <PregnancyMedicationsDialog open={isMedsDialogOpen} onOpenChange={setIsMedsDialogOpen} />
            <PregnancyKickCounterDialog open={isKickCounterOpen} onOpenChange={setIsKickCounterOpen} />

            {/* Delete Confirmation Popup */}
            <AnimatePresence>
                {entryToDelete !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setEntryToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-red-100">
                                <Trash2 size={28} className="text-red-500" />
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-2">حذف التسجيل</h3>
                            <p className="text-sm text-slate-500 font-medium mb-7 leading-relaxed">
                                هل أنتِ متأكدة من حذف هذا التسجيل؟<br />
                                <span className="text-red-400 font-bold">لا يمكن التراجع عن هذا الإجراء.</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEntryToDelete(null)}
                                    className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={() => {
                                        deleteMutation.mutate(entryToDelete);
                                        setEntryToDelete(null);
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="flex-1 py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleteMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 size={15} />
                                    )}
                                    حذف
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Sub Components ---

const ChecklistSection = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultItems = [
        { id: 'vitamins', label: 'تناول فيتامينات الحمل' },
        { id: 'water', label: 'شرب 8 أكواب ماء' },
        { id: 'walking', label: 'المشي لمدة 20 دقيقة' },
    ];

    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(() => {
        try {
            const saved = localStorage.getItem(`pregnancy_checklist_${today}`);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const toggleItem = (id: string) => {
        const newItems = { ...checkedItems, [id]: !checkedItems[id] };
        setCheckedItems(newItems);
        localStorage.setItem(`pregnancy_checklist_${today}`, JSON.stringify(newItems));
    };

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-[2.5rem] border border-border shadow-xl shadow-muted/50"
        >
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Check size={16} />
                </span>
                قائمة المهام اليومية
            </h3>
            <div className="space-y-4">
                {defaultItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="flex items-center gap-4 group cursor-pointer select-none"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-200",
                            checkedItems[item.id]
                                ? "bg-foreground border-slate-900 text-white scale-110"
                                : "border-border group-hover:border-border bg-muted"
                        )}>
                            <AnimatePresence>
                                {checkedItems[item.id] && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Check size={16} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <span className={cn(
                            "font-bold text-lg transition-all duration-200",
                            checkedItems[item.id] ? "text-border line-through" : "text-foreground/80"
                        )}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const StatCard = ({ title, value, subtext, icon, color, bg, delay, onClick, className }: any) => (
    <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay }}
        onClick={onClick}
        className={cn(
            "bg-white p-6 rounded-[2.5rem] border border-border shadow-lg shadow-muted/50 flex items-center gap-6 group hover:border-border transition-all",
            className
        )}
    >
        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110", bg, color)}>
            {icon}
        </div>
        <div>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-1">{title}</p>
            <div className="text-3xl font-black text-foreground tracking-tight">{value}</div>
            <p className="text-muted-foreground text-sm font-medium mt-1">{subtext}</p>
        </div>
    </motion.div>
);

const InfoCard = ({ title, icon, children, bg, border, delay }: any) => (
    <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay }}
        className={cn("p-8 rounded-[2.5rem] border transition-all hover:shadow-lg cursor-default", bg, border)}
    >
        <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
            <h3 className="font-black text-foreground text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground font-medium leading-relaxed">
            {children}
        </p>
    </motion.div>
);

const PregnancySkeleton = () => (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <div className="h-20 bg-border rounded-3xl w-1/3 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-[400px] bg-border rounded-[3rem]" />
            <div className="lg:col-span-4 space-y-6">
                <div className="h-32 bg-border rounded-[2.5rem]" />
                <div className="h-32 bg-border rounded-[2.5rem]" />
            </div>
        </div>
    </div>
);
