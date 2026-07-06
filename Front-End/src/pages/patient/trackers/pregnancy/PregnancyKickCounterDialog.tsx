
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { pregnancyService } from '@/services/pregnancyService';
import { toast } from 'sonner';
import { Footprints, Timer, History, Play, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const PregnancyKickCounterDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [view, setView] = useState<'counter' | 'history'>('counter');
    const [isCounterRunning, setIsCounterRunning] = useState(false);
    const [kicks, setKicks] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const timerRef = useRef<any>(null);
    const queryClient = useQueryClient();

    const { data: history, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['kickSessions'],
        queryFn: pregnancyService.getKickSessions,
        enabled: open && view === 'history',
    });

    const mutation = useMutation({
        mutationFn: pregnancyService.storeKickSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kickSessions'] });
            toast.success('تم حفظ جلسة الركلات بنجاح!');
            resetCounter();
            setView('history');
        },
        onError: () => toast.error('حدث خطأ أثناء الحفظ')
    });

    const startCounter = () => {
        setIsCounterRunning(true);
        setStartTime(new Date());
        timerRef.current = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    };

    const stopCounter = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsCounterRunning(false);
    };

    const resetCounter = () => {
        stopCounter();
        setKicks(0);
        setSeconds(0);
        setStartTime(null);
    };

    const handleKick = () => {
        if (!isCounterRunning) startCounter();
        setKicks(prev => prev + 1);
    };

    const saveSession = () => {
        if (kicks === 0) {
            toast.error('لم يتم تسجيل أي ركلات');
            return;
        }
        mutation.mutate({
            kick_count: kicks,
            duration_seconds: seconds,
            started_at: startTime?.toISOString(),
            ended_at: new Date().toISOString(),
        });
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && isCounterRunning) {
                if (!confirm('سيتم فقدان التقدم الحالي، هل أنت متأكد؟')) return;
                resetCounter();
            }
            onOpenChange(val);
        }}>
            <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-0 overflow-hidden font-primary">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex justify-between items-center w-full">
                        <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                                <Footprints className="text-orange-600" size={24} />
                            </div>
                            عداد الركلات
                        </DialogTitle>
                        <div className="flex bg-muted/50 p-1 rounded-xl">
                            <button
                                onClick={() => setView('counter')}
                                className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", view === 'counter' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}
                            >
                                العداد
                            </button>
                            <button
                                onClick={() => setView('history')}
                                className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", view === 'history' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}
                            >
                                السجل
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 pb-8">
                    <AnimatePresence mode="wait">
                        {view === 'counter' ? (
                            <motion.div
                                key="counter"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="flex flex-col items-center py-6"
                            >
                                {/* Info Box */}
                                <div className="bg-orange-50/50 p-4 rounded-3xl mb-10 w-full text-center">
                                    <p className="text-orange-700 text-sm font-bold leading-relaxed">
                                        يُنصح بحساب الركلات يومياً. الطبيعي هو الشعور بـ 10 ركلات خلال ساعتين أو أقل.
                                    </p>
                                </div>

                                {/* Timer & Kick Display */}
                                <div className="relative mb-12">
                                    <motion.div
                                        className="w-48 h-48 rounded-full border-[12px] border-orange-100 flex flex-col items-center justify-center"
                                        animate={isCounterRunning ? { borderColor: ['#ffedd5', '#fed7aa', '#ffedd5'] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <span className="text-6xl font-black text-foreground">{kicks}</span>
                                        <span className="text-muted-foreground font-bold uppercase text-xs tracking-widest">ركلة</span>
                                    </motion.div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-white px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-border">
                                        <Timer size={16} className="text-orange-400" />
                                        <span className="font-mono text-lg font-black">{formatTime(seconds)}</span>
                                    </div>
                                </div>

                                {/* Controller */}
                                <div className="w-full space-y-4">
                                    <Button
                                        onClick={handleKick}
                                        className="w-full h-20 rounded-[2rem] bg-orange-500 hover:bg-orange-600 text-white text-2xl font-black shadow-2xl shadow-orange-200 transition-all active:scale-95"
                                    >
                                        <Footprints className="ml-3" size={32} />
                                        سجل ركلة الآن!
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={resetCounter}
                                            disabled={!kicks && !seconds}
                                            className="h-14 rounded-2xl border-border text-muted-foreground hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 font-bold"
                                        >
                                            <X size={20} className="ml-2" />
                                            إعادة تعيين
                                        </Button>
                                        <Button
                                            onClick={saveSession}
                                            disabled={!isCounterRunning && kicks === 0}
                                            className="h-14 rounded-2xl bg-foreground text-white hover:bg-foreground font-bold shadow-xl shadow-border"
                                        >
                                            <CheckCircle2 size={20} className="ml-2" />
                                            حفظ الجلسة
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4 pt-4 max-h-[500px] overflow-y-auto custom-scrollbar"
                            >
                                {isHistoryLoading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-3xl animate-pulse" />)
                                ) : !history?.length ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                                        <History size={48} className="mb-4" />
                                        <p className="font-bold">لا توجد جلسات سابقة</p>
                                    </div>
                                ) : (
                                    history.map((session: any) => (
                                        <div key={session.id} className="bg-muted p-5 rounded-3xl border border-border flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-orange-600 font-black text-xl">
                                                    {session.kick_count}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">
                                                        {session.started_at ? format(new Date(session.started_at.replace(' ', 'T')), 'd MMMM', { locale: arEG }) : 'تاريخ غير معروف'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        المدة: {formatTime(session.duration_seconds)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-emerald-500">
                                                <CheckCircle2 size={20} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};
