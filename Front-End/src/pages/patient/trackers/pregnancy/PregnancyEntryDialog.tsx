import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Scale, Stethoscope, FileText, Calendar as CalendarIcon, X, Check, ThermometerSun, AlertCircle } from 'lucide-react';
import { pregnancyService } from '@/services/pregnancyService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SYMPTOMS_LIST = [
    { id: 'nausea', label: 'غثيان', icon: '🤢' },
    { id: 'fatigue', label: 'تعب وإرهاق', icon: '😴' },
    { id: 'headache', label: 'صداع', icon: '🤕' },
    { id: 'back_pain', label: 'ألم ظهر', icon: '🦴' },
    { id: 'heartburn', label: 'حرقان', icon: '🔥' },
    { id: 'swelling', label: 'تورم', icon: '🦶' },
    { id: 'cramps', label: 'تقلصات', icon: '⚡' },
    { id: 'mood_swings', label: 'تغير مزاج', icon: '🎭' },
];

export const PregnancyEntryDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            weight: '',
            blood_pressure_systolic: '',
            blood_pressure_diastolic: '',
            entry_date: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
            symptoms: [] as string[]
        }
    });

    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

    const toggleSymptom = (id: string) => {
        setSelectedSymptoms(prev => {
            const newSymptoms = prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id];
            setValue('symptoms', newSymptoms); // Sync with form
            return newSymptoms;
        });
    };

    const entryMutation = useMutation({
        mutationFn: pregnancyService.addEntry,
        onSuccess: (data) => {
            toast.success('تم تسجيل اليوميات بنجاح ✅');
            if (data.alerts && data.alerts.length > 0) {
                setTimeout(() => {
                    data.alerts.forEach((alert: string) => toast.warning(alert, { duration: 6000 }));
                }, 500);
            }
            queryClient.invalidateQueries({ queryKey: ['currentPregnancy'] });
            queryClient.invalidateQueries({ queryKey: ['pregnancyEntries'] });
            queryClient.invalidateQueries({ queryKey: ['pregnancyStats'] });
            onOpenChange(false);
            reset();
            setSelectedSymptoms([]);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ ما'),
    });

    const onSubmit = (data: any) => entryMutation.mutate({
        ...data,
        symptoms: selectedSymptoms // Ensure explicit pass
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-[2.5rem] p-0 border-none font-primary max-h-[90vh] overflow-hidden flex flex-col shadow-2xl bg-muted">

                {/* Modern Header */}
                <div className="relative bg-white px-6 py-6 pb-8 shadow-sm z-20">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                                <Activity size={20} />
                            </div>
                            تسجيل يومياتي
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-muted/50 text-muted-foreground">
                            <X size={24} />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {/* Date Picker Button styling */}
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                type="date"
                                {...register('entry_date')}
                                className="w-full h-12 bg-muted border border-border rounded-xl px-4 font-bold text-muted-foreground outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all text-center"
                            />
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                    {/* Weight Card */}
                    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm relative overflow-hidden group focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[4rem] -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-black text-muted-foreground mb-1">
                                    <Scale className="text-rose-500" size={18} /> الوزن الحالي
                                </label>
                                <p className="text-xs text-muted-foreground font-medium">سجلي وزنك لمتابعة الزيادة الصحية</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="00.0"
                                    {...register('weight')}
                                    className="w-32 text-right text-4xl font-black text-foreground placeholder:text-border border-none outline-none bg-transparent p-0"
                                />
                                <span className="text-lg font-bold text-muted-foreground">kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Blood Pressure Card */}
                    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm relative overflow-hidden group focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110" />

                        <div className="relative z-10 mb-4">
                            <label className="flex items-center gap-2 text-sm font-black text-muted-foreground mb-1">
                                <Stethoscope className="text-blue-500" size={18} /> ضغط الدم
                            </label>
                            <p className="text-xs text-muted-foreground font-medium">مهم جداً لمتابعة صحة القلب (اختياري)</p>
                        </div>

                        <div className="flex items-center justify-center gap-4 relative z-10">
                            <div className="flex-1 bg-muted p-3 rounded-2xl border border-border text-center">
                                <label className="text-[10px] font-bold text-muted-foreground block mb-1">الانقباضي (SYS)</label>
                                <input
                                    type="number"
                                    placeholder="120"
                                    {...register('blood_pressure_systolic')}
                                    className="w-full bg-transparent border-none text-center font-black text-2xl text-foreground/80 outline-none placeholder:text-border"
                                />
                            </div>
                            <span className="text-2xl font-black text-border">/</span>
                            <div className="flex-1 bg-muted p-3 rounded-2xl border border-border text-center">
                                <label className="text-[10px] font-bold text-muted-foreground block mb-1">الانبساطي (DIA)</label>
                                <input
                                    type="number"
                                    placeholder="80"
                                    {...register('blood_pressure_diastolic')}
                                    className="w-full bg-transparent border-none text-center font-black text-2xl text-foreground/80 outline-none placeholder:text-border"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Symptoms Selection */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-black text-muted-foreground px-1">
                            <ThermometerSun className="text-orange-500" size={18} /> بماذا تشعرين اليوم؟
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SYMPTOMS_LIST.map((symptom) => {
                                const isSelected = selectedSymptoms.includes(symptom.id);
                                return (
                                    <button
                                        key={symptom.id}
                                        type="button"
                                        onClick={() => toggleSymptom(symptom.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200",
                                            isSelected
                                                ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200 scale-105"
                                                : "bg-white border-border text-muted-foreground hover:border-rose-200 hover:bg-rose-50"
                                        )}
                                    >
                                        <span>{symptom.icon}</span>
                                        {symptom.label}
                                        {isSelected && <Check size={14} className="animate-in zoom-in" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white p-4 rounded-[1.5rem] border border-border">
                        <textarea
                            placeholder="أي ملاحظات إضافية تودين تسجيلها..."
                            {...register('notes')}
                            className="w-full min-h-[100px] bg-transparent border-none outline-none font-medium text-muted-foreground text-sm resize-none placeholder:text-border"
                        />
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-muted z-20">
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={entryMutation.isPending}
                        className="w-full h-14 rounded-2xl text-lg font-bold bg-foreground text-white shadow-xl hover:bg-foreground hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {entryMutation.isPending ? 'جاري الحفظ...' :
                            <>
                                <Check size={20} /> حفظ اليوميات
                            </>}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};
