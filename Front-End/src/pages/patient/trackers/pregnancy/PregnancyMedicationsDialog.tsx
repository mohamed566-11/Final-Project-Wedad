
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pregnancyService } from '@/services/pregnancyService';
import { toast } from 'sonner';
import { Pill, Clock, CheckCircle, Plus, Trash2, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';
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

export const PregnancyMedicationsDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [view, setView] = useState<'list' | 'add'>('list');
    const queryClient = useQueryClient();

    // Fetch Medications
    const { data: medications, isLoading } = useQuery({
        queryKey: ['pregnancyMedications'],
        queryFn: pregnancyService.getMedications,
        enabled: open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-white rounded-[2rem] p-0 overflow-hidden font-primary">
                <DialogHeader className="p-6 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                        <Pill className="text-purple-500" />
                        أدويتي وفيتاميناتي
                    </DialogTitle>
                    {view === 'list' && (
                        <Button onClick={() => setView('add')} size="sm" className="bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-xl gap-2">
                            <Plus size={16} /> إضافة
                        </Button>
                    )}
                    {view === 'add' && (
                        <Button onClick={() => setView('list')} variant="ghost" size="sm">
                            إلغاء
                        </Button>
                    )}
                </DialogHeader>

                <div className="p-6 bg-muted min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {view === 'list' ? (
                            <MedicationsList
                                key="list"
                                medications={medications}
                                isLoading={isLoading}
                                queryClient={queryClient}
                            />
                        ) : (
                            <AddMedicationForm
                                key="add"
                                onSuccess={() => {
                                    queryClient.invalidateQueries({ queryKey: ['pregnancyMedications'] });
                                    setView('list');
                                }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MedicationsList = ({ medications, isLoading, queryClient }: any) => {
    const [medicationToDelete, setMedicationToDelete] = useState<number | null>(null);

    const toggleMutation = useMutation({
        mutationFn: pregnancyService.toggleMedication,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['pregnancyMedications'] });
            if (data.last_taken_at) toast.success('تم تسجيل الجرعة 💪');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: pregnancyService.deleteMedication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pregnancyMedications'] });
            toast.success('تم حذف الدواء');
            setMedicationToDelete(null);
        }
    });

    if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>;

    if (!medications?.length) return (
        <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground text-center">
            <Pill size={48} className="mb-4 opacity-20" />
            <p className="font-bold">لا توجد أدوية مسجلة</p>
            <p className="text-xs mt-1">أضيفي الفيتامينات أو الأدوية لتذكيرك بها</p>
        </div>
    );

    return (
        <>
            <div className="space-y-4">
                {medications.map((med: any) => {
                    const lastTakenDate = med.last_taken_at ? new Date(med.last_taken_at.replace(' ', 'T')) : null;
                    const isTakenToday = lastTakenDate && isToday(lastTakenDate);

                    return (
                        <motion.div
                            key={med.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "group bg-white p-4 rounded-2xl border transition-all flex items-center justify-between gap-4",
                                isTakenToday ? "border-emerald-200 bg-emerald-50/30" : "border-border shadow-sm"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    isTakenToday ? "bg-emerald-100 text-emerald-600" : "bg-purple-50 text-purple-500"
                                )}>
                                    {isTakenToday ? <CheckCircle size={24} /> : <Pill size={24} />}
                                </div>
                                <div>
                                    <h4 className={cn("font-bold text-lg", isTakenToday ? "text-emerald-800" : "text-foreground")}>
                                        {med.name}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="bg-muted/50 px-2 py-0.5 rounded-md">{med.dosage || 'بدون جرعة'}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {med.time_of_day ? format(new Date(`2000-01-01T${med.time_of_day}`), 'h:mm a') : 'غير محدد'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={isTakenToday ? "outline" : "default"}
                                    onClick={() => toggleMutation.mutate(med.id)}
                                    className={cn(
                                        "px-4 rounded-xl transition-all",
                                        isTakenToday
                                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                                    )}
                                >
                                    {isTakenToday ? 'تم بنجاح' : 'أخذ الجرعة'}
                                </Button>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-border hover:text-red-500 hover:bg-red-50 rounded-xl"
                                    onClick={() => setMedicationToDelete(med.id)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AlertDialog open={!!medicationToDelete} onOpenChange={() => setMedicationToDelete(null)}>
                <AlertDialogContent className="rounded-[2rem] font-primary">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنتِ متأكدة من حذف هذا الدواء؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            لن يتم تذكيرك بموعد هذا الدواء مرة أخرى، وسيتم حذفه من قائمتك.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction
                            onClick={() => medicationToDelete && deleteMutation.mutate(medicationToDelete)}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                        >
                            نعم، احذفه
                        </AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl border-0 bg-muted/50 hover:bg-border mt-0">تراجع</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

const AddMedicationForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState('');

    const mutation = useMutation({
        mutationFn: pregnancyService.addMedication,
        onSuccess: () => {
            toast.success('تم إضافة الدواء');
            onSuccess();
        },
        onError: () => toast.error('حدث خطأ')
    });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (!name) return;
        mutation.mutate({ name, dosage, time_of_day: time, frequency: 'daily' });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-2xl mb-6">
                    <p className="text-purple-700 text-sm font-medium flex gap-2">
                        <Pill size={18} />
                        أضيفي أدويتك وسنقوم بتذكيرك بمواعيدها
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>اسم الدواء / الفيتامين</Label>
                    <Input
                        placeholder="مثل: حمض الفوليك، حديد"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="bg-white rounded-xl h-12"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>الجرعة (اختياري)</Label>
                        <Input
                            placeholder="قرص واحد، 5 مل"
                            value={dosage}
                            onChange={e => setDosage(e.target.value)}
                            className="bg-white rounded-xl h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>الوقت المفضل (اختياري)</Label>
                        <Input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="bg-white rounded-xl h-12"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg mt-6 shadow-xl shadow-purple-200"
                >
                    {mutation.isPending ? 'جاري الحفظ...' : 'حفظ الدواء'}
                </Button>
            </form>
        </motion.div>
    );
};
