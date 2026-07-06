import React, { useState } from 'react';
import { useDoctorConsultationsCalendar } from '@/hooks/useDoctorQueries';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, Video, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

const ConsultationCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const monthStr = format(currentMonth, 'yyyy-MM');
    const { data: calendarData, isLoading } = useDoctorConsultationsCalendar(monthStr);
    const navigate = useNavigate();

    const consultationsByDate = calendarData?.data?.consultations_by_date || {};

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ar }); // Start from Saturday
    const endDate = endOfWeek(monthEnd, { locale: ar });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">
                    {format(currentMonth, 'MMMM yyyy', { locale: ar })}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}><ChevronLeft className="w-4 h-4" /></Button>
                </div>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 text-center mb-2 border-b pb-2">
                        {weekDays.map(d => <div key={d} className="font-bold text-muted-foreground text-sm">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayConsultations = consultationsByDate[dateKey] || [];
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "min-h-[120px] border rounded-lg p-1 transition-colors hover:bg-muted relative",
                                        !isCurrentMonth && "bg-muted text-border",
                                        isToday && "border-blue-500 bg-blue-50/30"
                                    )}
                                >
                                    <div className={cn(
                                        "text-right text-sm font-medium mb-1 px-1",
                                        isToday ? "text-blue-600" : "text-foreground/80"
                                    )}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                                        {dayConsultations.map((c: any) => (
                                            <TooltipProvider key={c.id}>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() => navigate(`/doctor/consultations/${c.id}`)}
                                                            className={cn(
                                                                "text-[10px] p-1.5 rounded cursor-pointer truncate flex items-center gap-1.5 transition-opacity hover:opacity-80",
                                                                c.type === 'video' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700",
                                                                getStatusStyle(c.status)
                                                            )}
                                                        >
                                                            {c.type === 'video' ? <Video size={10} /> : <Users size={10} />}
                                                            <span className="truncate">{c.time} - {c.patient}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="text-right">
                                                        <p className="font-bold">{c.patient}</p>
                                                        <p className="text-xs">{c.time} | {getStatusLabel(c.status)}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'confirmed': return "border-l-2 border-l-emerald-500";
        case 'pending': return "border-l-2 border-l-amber-500";
        case 'completed': return "border-l-2 border-l-muted-foreground opacity-75";
        default: return "";
    }
}

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'confirmed': return "مؤكد";
        case 'pending': return "انتظار";
        case 'completed': return "مكتمل";
        default: return status;
    }
}

export default ConsultationCalendar;
