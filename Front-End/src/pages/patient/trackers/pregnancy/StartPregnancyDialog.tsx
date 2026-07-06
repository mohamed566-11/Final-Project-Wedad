import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CalendarIcon, Baby, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pregnancyService } from '@/services/pregnancyService';

export const StartPregnancyDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, watch, reset } = useForm();
    const lmp = watch('last_menstrual_period');

    const startMutation = useMutation({
        mutationFn: pregnancyService.startPregnancy,
        onSuccess: () => {
            toast.success('مبارك! تم بدء رحلة الحمل بنجاح 🎉');
            queryClient.invalidateQueries({ queryKey: ['currentPregnancy'] });
            onOpenChange(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ ما'),
    });

    const onSubmit = (data: any) => startMutation.mutate(data);

    // Calculate approx due date for display
    const dueDateDisplay = lmp ? new Date(new Date(lmp).getTime() + 280 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG') : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-[2.5rem] p-0 border-none font-primary max-h-[92vh] overflow-hidden flex flex-col shadow-2xl bg-white">
                {/* Decorative Header */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-rose-400 to-pink-300 opacity-20" />

                <div className="relative p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 text-right">
                    <DialogHeader className="mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-200 text-white"
                        >
                            <Baby size={48} />
                        </motion.div>
                        <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-center">رحلة جديدة</DialogTitle>
                        <p className="text-center text-muted-foreground mt-3 font-medium text-lg leading-relaxed">
                            ألف مبروك! سجلي بياناتك لنبدأ في متابعة نمو طفلك أسبوعاً بأسبوع
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* LMP Section */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-muted/80 p-6 rounded-[2rem] border border-border focus-within:border-rose-300 focus-within:bg-rose-50/30 transition-all duration-300"
                        >
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">تاريخ آخر دورة شهرية (LMP)</label>
                            <div className="relative flex items-center">
                                <CalendarIcon className="absolute right-4 text-rose-500 w-6 h-6 pointer-events-none" />
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    {...register('last_menstrual_period', { required: true })}
                                    className="w-full h-16 pr-14 pl-4 rounded-2xl bg-white border-2 border-transparent focus:border-rose-200 outline-none font-bold text-foreground/80 text-lg shadow-sm transition-all text-center sm:text-right cursor-pointer"
                                />
                            </div>
                            {dueDateDisplay && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-rose-100"
                                >
                                    <Info className="text-rose-400 w-5 h-5 mt-0.5 shrink-0" />
                                    <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        بناءً على هذا التاريخ، موعد ولادتك المتوقع هو تقريباً <span className="text-rose-600 font-bold">{dueDateDisplay}</span>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Optional Date Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-muted/80 p-5 rounded-[2rem] border border-border focus-within:border-rose-300 transition-all"
                            >
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-2 block">تاريخ الإخصاب (اختياري)</label>
                                <input
                                    type="date"
                                    {...register('conception_date')}
                                    className="w-full h-12 px-4 rounded-xl bg-white border border-transparent focus:border-rose-200 outline-none font-bold text-foreground/80 shadow-sm text-center"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-muted/80 p-5 rounded-[2rem] border border-border focus-within:border-rose-300 transition-all"
                            >
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-2 block">موعد الولادة (إذا حدده الطبيب)</label>
                                <input
                                    type="date"
                                    {...register('due_date')}
                                    className="w-full h-12 px-4 rounded-xl bg-white border border-transparent focus:border-rose-200 outline-none font-bold text-foreground/80 shadow-sm text-center"
                                />
                            </motion.div>
                        </div>

                        {/* Notes */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-muted/80 p-6 rounded-[2rem] border border-border focus-within:border-rose-300 transition-all"
                        >
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-2 mb-3 block">ملاحظات إضافية</label>
                            <textarea
                                placeholder="أي شيء تودين تذكره..."
                                {...register('notes')}
                                className="w-full min-h-[100px] p-4 rounded-2xl bg-white border-2 border-transparent focus:border-rose-200 outline-none font-bold text-foreground/80 shadow-sm transition-all resize-none"
                            />
                        </motion.div>

                        <div className="pt-6 sticky bottom-0 bg-white/90 backdrop-blur-lg -mx-10 px-10 pb-4 border-t border-muted">
                            <Button
                                type="submit"
                                disabled={!lmp || startMutation.isPending}
                                className="w-full h-16 rounded-[1.5rem] text-xl font-black bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl shadow-rose-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {startMutation.isPending ? 'جاري التحضير...' : 'بدء المتابعة الآن ✨'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
