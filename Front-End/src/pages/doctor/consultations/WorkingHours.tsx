import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Clock, Save, Plus, Trash2, CheckCircle2, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { consultationService } from '@/services/consultationService';
import BackButton from '@/components/common/BackButton';

/* ── Types ── */
interface DaySlots {
    day: string;
    day_ar: string;
    start_times: string[];
}

/* ── Constants ── */
const DAYS_OF_WEEK = [
    { key: 'sunday', label: 'الأحد' },
    { key: 'monday', label: 'الإثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' },
    { key: 'saturday', label: 'السبت' },
];

// Generate every 30-minute mark from 00:00 to 23:30
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

const DAY_ABBR: Record<string, string> = {
    sunday: 'أح', monday: 'إث', tuesday: 'ثل',
    wednesday: 'أر', thursday: 'خم', friday: 'جم', saturday: 'سب',
};

/* ── Component ── */
export const WorkingHours = () => {
    const [schedule, setSchedule] = useState<Record<string, string[]>>(() =>
        Object.fromEntries(DAYS_OF_WEEK.map(d => [d.key, []]))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [newTimeInputs, setNewTimeInputs] = useState<Record<string, string>>(
        () => Object.fromEntries(DAYS_OF_WEEK.map(d => [d.key, '09:00']))
    );

    /* ── Fetch existing slots ── */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await consultationService.getWorkingHours();
                const data: DaySlots[] = res.data || res;
                const built: Record<string, string[]> = Object.fromEntries(
                    DAYS_OF_WEEK.map(d => [d.key, []])
                );
                data.forEach((d: DaySlots) => {
                    if (built[d.day] !== undefined) {
                        built[d.day] = [...d.start_times].sort();
                    }
                });
                setSchedule(built);
            } catch {
                toast.error('تعذّر تحميل ساعات العمل');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Helpers ── */
    const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const addSlot = (day: string) => {
        const time = newTimeInputs[day];
        if (!time) return;

        const newMinutes = timeToMinutes(time);

        // Check for 60-min overlap
        for (const existing of schedule[day]) {
            const existingMinutes = timeToMinutes(existing);
            if (Math.abs(existingMinutes - newMinutes) < 60) {
                toast.warning(`يتعارض مع الموعد (${existing}) — يجب أن يكون الفاصل 60 دقيقة على الأقل`);
                return;
            }
        }

        setSchedule(prev => ({
            ...prev,
            [day]: [...prev[day], time].sort(),
        }));
        setHasChanges(true);
    };

    const removeSlot = (day: string, time: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].filter(t => t !== time),
        }));
        setHasChanges(true);
    };

    const clearDay = (day: string) => {
        setSchedule(prev => ({ ...prev, [day]: [] }));
        setHasChanges(true);
    };

    const totalSlots = Object.values(schedule).reduce((s, arr) => s + arr.length, 0);

    /* ── Save ── */
    const handleSave = async () => {
        // Build flat array [{day, start_time}, ...]
        const payload: { day: string; start_time: string }[] = [];
        for (const [day, times] of Object.entries(schedule)) {
            times.forEach(t => payload.push({ day, start_time: t }));
        }

        setSaving(true);
        try {
            await consultationService.updateWorkingHours(payload as any);
            toast.success('✅ تم حفظ جدول المواعيد بنجاح');
            setHasChanges(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 font-medium">جاري تحميل جدولك...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32" dir="rtl">

            {/* ── Hero ── */}
            <div className="relative h-56 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 overflow-hidden rounded-b-[40px] shadow-2xl">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
                <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />

                <div className="container max-w-3xl mx-auto px-6 h-full flex flex-col justify-center relative z-10">
                    <div className="mb-4">
                        <BackButton className="text-white/80 hover:text-white border-white/20 hover:bg-white/10" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Clock className="w-7 h-7 text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">ساعات العمل والمواعيد</h1>
                            <p className="text-indigo-200 text-sm mt-0.5">مدة كل جلسة: <strong>60 دقيقة</strong></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container max-w-3xl mx-auto px-4 -mt-6 relative z-20 space-y-4">

                {/* ── Summary Card ── */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">إجمالي المواعيد المتاحة</p>
                            <p className="text-sm text-slate-500">ينتشر على {Object.values(schedule).filter(a => a.length > 0).length} أيام هذا الأسبوع</p>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-indigo-600">{totalSlots}</div>
                </div>

                {/* ── Weekly View (mini) ── */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">نظرة أسبوعية سريعة</p>
                    <div className="grid grid-cols-7 gap-1.5">
                        {DAYS_OF_WEEK.map(d => (
                            <button
                                key={d.key}
                                onClick={() => setExpandedDay(prev => prev === d.key ? null : d.key)}
                                className={`flex flex-col items-center p-2 rounded-xl transition-all ${schedule[d.key].length > 0
                                    ? expandedDay === d.key
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                <span className="text-[10px] font-bold">{DAY_ABBR[d.key]}</span>
                                <span className="text-lg font-black mt-0.5">{schedule[d.key].length}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Day Cards ── */}
                <div className="space-y-3">
                    {DAYS_OF_WEEK.map((dayInfo) => {
                        const dayKey = dayInfo.key;
                        const slots = schedule[dayKey];
                        const isOpen = expandedDay === dayKey;
                        const hasSlots = slots.length > 0;

                        return (
                            <div
                                key={dayKey}
                                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${hasSlots ? 'border-indigo-100 shadow-indigo-50' : 'border-slate-100'
                                    }`}
                            >
                                {/* Day Header */}
                                <button
                                    className="w-full flex items-center justify-between p-4 text-right"
                                    onClick={() => setExpandedDay(isOpen ? null : dayKey)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${hasSlots ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {DAY_ABBR[dayKey]}
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-base ${hasSlots ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {dayInfo.label}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {hasSlots ? `${slots.length} موعد متاح` : 'لا مواعيد'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Slot Bubbles preview */}
                                        {slots.slice(0, 3).map(t => (
                                            <span key={t} className="hidden sm:inline-block text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                                                {t}
                                            </span>
                                        ))}
                                        {slots.length > 3 && (
                                            <span className="hidden sm:inline-block text-xs font-bold text-slate-400">
                                                +{slots.length - 3}
                                            </span>
                                        )}
                                        {isOpen
                                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                            : <ChevronDown className="w-4 h-4 text-slate-400" />
                                        }
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isOpen && (
                                    <div className="px-4 pb-4 space-y-4 border-t border-slate-50">

                                        {/* Existing Slots */}
                                        {slots.length > 0 ? (
                                            <div className="pt-3">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">المواعيد المحددة</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {slots.map(time => (
                                                        <div
                                                            key={time}
                                                            className="group flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold text-sm"
                                                        >
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {(() => {
                                                                const [h, m] = time.split(':').map(Number);
                                                                const total = h * 60 + m + 60;
                                                                const end = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                                                                return <span dir="ltr">{time} - {end}</span>;
                                                            })()}
                                                            <button
                                                                onClick={() => removeSlot(dayKey, time)}
                                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity mr-2"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3 text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                لا مواعيد محددة — أضف موعداً من الأسفل
                                            </div>
                                        )}

                                        {/* Add New Slot */}
                                        <div className="flex gap-2">
                                            <select
                                                value={newTimeInputs[dayKey]}
                                                onChange={e => setNewTimeInputs(prev => ({ ...prev, [dayKey]: e.target.value }))}
                                                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                            >
                                                {TIME_OPTIONS.map(t => {
                                                    const isOverlapping = slots.some(existing => Math.abs(timeToMinutes(existing) - timeToMinutes(t)) < 60);
                                                    return (
                                                        <option key={t} value={t} disabled={isOverlapping}>
                                                            {t} {isOverlapping ? '(يتعارض)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <button
                                                onClick={() => addSlot(dayKey)}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm shadow-indigo-200"
                                            >
                                                <Plus className="w-4 h-4" />
                                                إضافة
                                            </button>
                                            {slots.length > 0 && (
                                                <button
                                                    onClick={() => clearDay(dayKey)}
                                                    className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-bold text-sm transition-all"
                                                    title="مسح جميع مواعيد اليوم"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Info Note */}
                <div className="text-center py-2">
                    <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        كل موعد مدته ساعة كاملة — يُعرض للمرضى فور الحفظ
                    </p>
                </div>
            </div>

            {/* ── Floating Save Bar ── */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 z-50 transition-transform duration-500 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] ${hasChanges ? 'translate-y-0' : 'translate-y-full'
                }`}>
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden md:block">
                        <h4 className="font-bold text-slate-800">تغييرات غير محفوظة</h4>
                        <p className="text-xs text-slate-400">اضغط حفظ لتحديث جدول مواعيدك</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 md:flex-none px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 min-w-[160px]"
                        >
                            {saving
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Save className="w-5 h-5" /> حفظ الجدول</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkingHours;
