
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { pregnancyService } from '@/services/pregnancyService';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { Archive, Calendar, Baby, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const PregnancyHistoryDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const { data: history, isLoading } = useQuery({
        queryKey: ['pregnancyHistory'],
        queryFn: pregnancyService.getHistory,
        enabled: open,
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { label: 'ولادة تامة', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle };
            case 'miscarriage':
                return { label: 'إجهاض', color: 'bg-red-100 text-red-600', icon: AlertCircle };
            case 'terminated':
                return { label: 'إنهاء الحمل', color: 'bg-orange-100 text-orange-600', icon: XCircle };
            default:
                return { label: 'غير محدد', color: 'bg-muted/50 text-muted-foreground', icon: Archive };
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-0 overflow-hidden font-primary">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                        <Archive className="text-rose-500" />
                        سجل الحمل السابق
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-muted min-h-[300px]">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
                        </div>
                    ) : history?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                            <Archive size={48} className="mb-4 opacity-20" />
                            <p>لا يوجد سجلات سابقة</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history?.map((record: any, idx: number) => {
                                const status = getStatusConfig(record.pregnancy_status);
                                const StatusIcon = status.icon;

                                return (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-start gap-4"
                                    >
                                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", status.color)}>
                                            <StatusIcon size={24} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-foreground text-lg">
                                                    {status.label}
                                                </h4>
                                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                                                    {record.entries_count} تدوينة
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar size={14} className="text-muted-foreground" />
                                                    <span className="text-muted-foreground text-xs ml-1">البداية:</span>
                                                    <span className="font-bold">
                                                        {format(new Date(record.created_at || record.last_menstrual_period), 'yyyy/MM/dd', { locale: arEG })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar size={14} className="text-muted-foreground" />
                                                    <span className="text-muted-foreground text-xs ml-1">النهاية:</span>
                                                    <span className="font-bold">
                                                        {format(new Date(record.updated_at), 'yyyy/MM/dd', { locale: arEG })}
                                                    </span>
                                                </div>
                                            </div>

                                            {record.notes && (
                                                <div className="mt-4 bg-muted p-3 rounded-xl">
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{record.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
