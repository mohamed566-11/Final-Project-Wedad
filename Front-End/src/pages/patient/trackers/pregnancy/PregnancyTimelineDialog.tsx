import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Activity, ArrowRight, Baby, ChevronLeft, Info, Heart, Check } from 'lucide-react';
import { pregnancyService } from '@/services/pregnancyService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const PregnancyTimelineDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    const { data: weeksData, isLoading } = useQuery({
        queryKey: ['pregnancyWeeks'],
        queryFn: pregnancyService.getWeeksInfo,
    });

    // Also get current pregnancy to know which week we are in
    const { data: currentPregnancy } = useQuery({
        queryKey: ['currentPregnancy'],
        queryFn: pregnancyService.getCurrentPregnancy,
    });

    const currentWeek = currentPregnancy?.current_week || 0;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setSelectedWeek(null);
            onOpenChange(val);
        }}>
            <DialogContent className="w-[95vw] sm:max-w-[700px] h-[85vh] rounded-[2.5rem] p-0 border-none font-primary overflow-hidden flex flex-col shadow-2xl bg-white">

                <AnimatePresence mode="wait">
                    {selectedWeek ? (
                        <WeekDetailView
                            key="detail"
                            weekNumber={selectedWeek}
                            onBack={() => setSelectedWeek(null)}
                        />
                    ) : (
                        <WeekListView
                            key="list"
                            weeks={weeksData?.weeks || []}
                            isLoading={isLoading}
                            currentWeek={currentWeek}
                            onSelectWeek={setSelectedWeek}
                            onClose={() => onOpenChange(false)}
                        />
                    )}
                </AnimatePresence>

            </DialogContent>
        </Dialog>
    );
};

const WeekListView = ({ weeks, isLoading, currentWeek, onSelectWeek, onClose }: any) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col h-full"
    >
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 pb-4 border-b border-muted relative z-10 shadow-sm">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50">
                    <ArrowRight className="rotate-180" />
                </Button>
                <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                    جدول الحمل الأسبوعي
                    <span className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                        <Calendar size={20} />
                    </span>
                </DialogTitle>
            </div>
            <p className="text-muted-foreground font-medium text-sm mt-2 text-right">
                اختاري أي أسبوع لمعرفة التفاصيل والتطورات
            </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-muted/50 space-y-4">
            {isLoading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-border rounded-[2rem]" />)}
                </div>
            ) : (
                weeks?.map((week: any) => {
                    const isCurrent = week.week_number === currentWeek;
                    const isPast = week.week_number < currentWeek;

                    return (
                        <motion.div
                            key={week.week_number}
                            onClick={() => onSelectWeek(week.week_number)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "relative border rounded-[2rem] p-5 cursor-pointer flex items-center gap-5 transition-all duration-200",
                                isCurrent
                                    ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-200 border-transparent z-10"
                                    : "bg-white border-border hover:border-rose-200 hover:shadow-lg hover:shadow-rose-50"
                            )}
                        >
                            {/* Week Number */}
                            <div className={cn(
                                "w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black leading-none",
                                isCurrent ? "bg-white/20 text-white shadow-inner" : "bg-muted/50 text-muted-foreground"
                            )}>
                                <span className="text-2xl">{week.week_number}</span>
                                <span className="text-[8px] uppercase tracking-wider opacity-70">أسبوع</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-right">
                                <div className="flex items-center justify-end gap-2 mb-1">
                                    {isCurrent && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full animate-pulse">
                                            <Activity size={10} /> أنتِ هنا
                                        </span>
                                    )}
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        isCurrent ? "bg-white/20 text-white" : "bg-rose-50 text-rose-500"
                                    )}>
                                        الثلث {week.trimester}
                                    </span>
                                </div>
                                <h4 className={cn("text-lg font-bold mb-1", isCurrent ? "text-white" : "text-foreground")}>
                                    طفلكِ بحجم: {week.size_baby}
                                </h4>
                                <div className="flex items-center justify-end gap-1 text-xs opacity-80">
                                    <span>اضغطي للتفاصيل</span>
                                    <ChevronLeft size={14} className={isCurrent ? "text-white" : "text-rose-500"} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
    </motion.div>
);

const WeekDetailView = ({ weekNumber, onBack }: { weekNumber: number, onBack: () => void }) => {
    // Fetch specific week details
    const { data: weekInfo, isLoading } = useQuery({
        queryKey: ['weekInfo', weekNumber],
        queryFn: () => pregnancyService.getWeekInfo(weekNumber),
    });

    if (isLoading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full bg-muted"
        >
            {/* Header Image Area */}
            <div className="relative h-48 bg-rose-100 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-600 opacity-90" />
                <div className="relative z-10 text-center text-white">
                    <span className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 block">الأسبوع</span>
                    <h2 className="text-6xl font-black">{weekNumber}</h2>
                    <p className="opacity-90 font-medium mt-2">الثلث {weekInfo?.trimester}</p>
                </div>

                <Button
                    onClick={onBack}
                    variant="ghost"
                    className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-20"
                >
                    <ArrowRight size={24} />
                </Button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 -mt-6 rounded-t-[2.5rem] bg-white relative z-10 shadow-lg space-y-8 pb-20">

                {/* Baby Info */}
                <section className="text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-sm border border-rose-100">
                        <Baby size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-2">تطور الجنين</h3>
                    <div className="text-3xl font-bold text-rose-500 mb-6">{weekInfo?.baby_development?.size_comparison || 'ينمو بسرعة'}</div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-4 rounded-2xl border border-border">
                            <label className="text-xs font-bold text-muted-foreground block mb-1">الوزن التقريبي</label>
                            <div className="text-xl font-black text-foreground/80">{weekInfo?.baby_development?.weight_grams} جم</div>
                        </div>
                        <div className="bg-muted p-4 rounded-2xl border border-border">
                            <label className="text-xs font-bold text-muted-foreground block mb-1">الطول التقريبي</label>
                            <div className="text-xl font-black text-foreground/80">{weekInfo?.baby_development?.length_cm} سم</div>
                        </div>
                    </div>
                </section>

                {/* Mother Info */}
                <ContentSection title="جسمكِ هذا الأسبوع" icon={<Heart size={18} />} color="pink">
                    <ul className="space-y-3">
                        {weekInfo?.mother_changes?.map((change: string, idx: number) => (
                            <li key={idx} className="flex gap-3 text-muted-foreground font-medium text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0" />
                                {change}
                            </li>
                        ))}
                    </ul>
                </ContentSection>

                {/* Symptoms */}
                <ContentSection title="أعراض متوقعة" icon={<Activity size={18} />} color="purple">
                    <div className="flex flex-wrap gap-2">
                        {weekInfo?.symptoms_to_expect?.map((symptom: string, idx: number) => (
                            <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-purple-100">
                                {symptom}
                            </span>
                        ))}
                    </div>
                </ContentSection>

                {/* Tips Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ContentSection title="نصائح طبية" icon={<Info size={18} />} color="blue" className="h-full">
                        <ul className="space-y-2">
                            {weekInfo?.medical_tips?.map((tip: string, idx: number) => (
                                <li key={idx} className="text-xs text-muted-foreground font-medium list-disc list-inside marker:text-blue-400">
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </ContentSection>
                    <ContentSection title="تغذية وتمارين" icon={<ChevronDown size={18} />} color="emerald" className="h-full">
                        <ul className="space-y-2">
                            {weekInfo?.nutrition_tips?.map((tip: string, idx: number) => (
                                <li key={idx} className="text-xs text-muted-foreground font-medium list-disc list-inside marker:text-emerald-400">
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </ContentSection>
                </div>

                {/* Warning Signs */}
                {weekInfo?.warning_signs?.length > 0 && (
                    <div className="bg-red-50 border border-red-100 p-5 rounded-2xl">
                        <h4 className="flex items-center gap-2 text-red-600 font-black mb-3 text-sm">
                            <Info size={16} /> علامات تستدعي الانتباه
                        </h4>
                        <ul className="space-y-2">
                            {weekInfo?.warning_signs?.map((sign: string, idx: number) => (
                                <li key={idx} className="text-sm text-red-800 font-medium flex gap-2">
                                    <span>⚠️</span> {sign}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Checklist */}
                {weekInfo?.checklist?.length > 0 && (
                    <ContentSection title="قائمة المهام المقترحة" icon={<Calendar size={18} />} color="yellow">
                        <div className="space-y-3">
                            {weekInfo?.checklist?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center mt-0.5",
                                        item.is_due ? "bg-yellow-400 border-yellow-400 text-white" : "border-yellow-300"
                                    )}>
                                        {item.is_due && <Check size={12} strokeWidth={4} />}
                                    </div>
                                    <div>
                                        <p className="text-foreground/80 font-bold text-sm">{item.item}</p>
                                        {item.is_due && <span className="text-[10px] text-yellow-600 font-bold bg-yellow-100 px-1.5 py-0.5 rounded">مطلوب هذا الأسبوع</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ContentSection>
                )}

            </div>
        </motion.div>
    );
};

const ContentSection = ({ title, icon, color, children, className }: any) => {
    const colors: any = {
        pink: "bg-pink-100 text-pink-600",
        purple: "bg-purple-100 text-purple-600",
        blue: "bg-blue-100 text-blue-600",
        emerald: "bg-emerald-100 text-emerald-600",
        yellow: "bg-yellow-100 text-yellow-600",
    };

    return (
        <section className={className}>
            <h4 className="flex items-center gap-2 text-lg font-black text-foreground mb-4 px-2">
                <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors[color])}>
                    {icon}
                </span>
                {title}
            </h4>
            <div className="bg-muted p-5 rounded-2xl border border-border">
                {children}
            </div>
        </section>
    );
};
