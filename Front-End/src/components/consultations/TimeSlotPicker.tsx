import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { consultationService, TimeSlot } from '@/services/consultationService';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
    doctorId: number;
    selectedDate: string;
    selectedTime?: string;
    onSelectSlot: (time: string) => void;
    onDateChange: (date: string) => void;
}

const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export const TimeSlotPicker = ({ doctorId, selectedDate, selectedTime, onSelectSlot, onDateChange }: TimeSlotPickerProps) => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    // Generate dates for the current week view
    const getCurrentWeekDates = () => {
        const dates = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + (weekOffset * 7));

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const weekDates = getCurrentWeekDates();

    // Fetch slots when date changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!doctorId || !selectedDate) return;

            setLoading(true);
            setError(null);

            try {
                const response = await consultationService.getAvailableSlots(doctorId, selectedDate);
                const data = response.data || response; // Handle different response structures
                if (data) {
                    setSlots(data.slots || []);
                }
            } catch (err) {
                console.error(err);
                setError('حدث خطأ في جلب الأوقات المتاحة');
                setSlots([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
    }, [doctorId, selectedDate]);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return formatDate(date) === formatDate(today);
    };

    const isPast = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    const availableSlots = slots.filter(s => s.available);

    return (
        <div className="space-y-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <button
                    onClick={() => setWeekOffset(prev => Math.max(prev - 1, 0))}
                    disabled={weekOffset === 0}
                    className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h3 className="font-bold text-slate-900">
                        {monthsAr[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
                    </h3>
                </div>
                <button
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    disabled={weekOffset >= 4}
                    className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                    const dateStr = formatDate(date);
                    const isSelected = dateStr === selectedDate;
                    const past = isPast(date);
                    const today = isToday(date);

                    return (
                        <button
                            key={index}
                            onClick={() => !past && onDateChange(dateStr)}
                            disabled={past}
                            className={cn(
                                "relative p-2 py-3 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-1",
                                isSelected
                                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105"
                                    : past
                                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                        : "bg-white border border-slate-100 text-slate-700 hover:border-teal-200 hover:bg-teal-50"
                            )}
                        >
                            <span className="text-[10px] font-medium opacity-80">
                                {daysOfWeek[date.getDay()]}
                            </span>
                            <span className="text-lg font-black leading-none">
                                {date.getDate()}
                            </span>
                            {today && !isSelected && (
                                <span className="text-[10px] text-teal-600 font-bold">اليوم</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <h4 className="font-bold text-slate-900">المواعيد المتاحة</h4>
                    {availableSlots.length > 0 && (
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full mr-auto">
                            {availableSlots.length} موعد
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500 bg-red-50 rounded-2xl border border-red-100">
                        <XCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">لا توجد مواعيد متاحة في هذا اليوم</p>
                        <button
                            onClick={() => {
                                const nextDay = new Date(selectedDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                onDateChange(formatDate(nextDay));
                            }}
                            className="text-teal-600 font-bold text-sm mt-2 hover:underline"
                        >
                            جرب اليوم التالي
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 flex-wrap sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {slots.map((slot, index) => {
                            const [h, m] = slot.time.split(':').map(Number);
                            const total = h * 60 + m + 60;
                            const endStr = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                            return (
                                <button
                                    key={index}
                                    onClick={() => slot.available && onSelectSlot(slot.time)}
                                    disabled={!slot.available}
                                    dir="ltr"
                                    className={cn(
                                        "relative px-2 py-3 rounded-xl text-sm font-bold transition-all border-2",
                                        selectedTime === slot.time
                                            ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105 z-10"
                                            : slot.available
                                                ? "bg-white border-slate-100 text-slate-700 hover:border-teal-200 hover:bg-teal-50"
                                                : "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed decoration-slate-300"
                                    )}
                                >
                                    {slot.time} - {endStr}
                                    {selectedTime === slot.time && (
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5" dir="rtl">
                                            <CheckCircle2 className="w-4 h-4 text-teal-600 fill-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeSlotPicker;
