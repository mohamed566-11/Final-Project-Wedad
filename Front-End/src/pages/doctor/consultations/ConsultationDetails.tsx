import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorConsultation, useDoctorPatientHistory } from '@/hooks/useDoctorQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import { Loader2, ArrowRight, User, Calendar, Clock, FileText, Activity, Video, MapPin, AlertCircle, CheckCircle2, Phone, CalendarClock, Plus, Trash2, Save, X, Edit2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Card from '@/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import BackButton from "@/components/common/BackButton";
import { cn } from '@/lib/utils';
import ConsultationAttachments from '@/components/consultations/ConsultationAttachments';
import ConsultationChat from '@/components/chat/ConsultationChat';


const ConsultationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Convert id to number safely
    const consultationId = Number(id);

    const { data: consultationData, isLoading: loadingDetails, isError, error } = useDoctorConsultation(consultationId);
    const { data: historyData, isLoading: loadingHistory } = useDoctorPatientHistory(consultationId);

    const consultation = consultationData?.data;
    const history = historyData?.data;

    // State for editing
    const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
    const [diagnosisText, setDiagnosisText] = useState('');
    const [medications, setMedications] = useState<any[]>([]);
    const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', frequency: '', duration: '' });
    const [medErrors, setMedErrors] = useState<{ name?: string; dosage?: string; frequency?: string; duration?: string }>({});

    // ── Private Notes State ───────────────────────────────────
    const [privateNotes, setPrivateNotes] = useState<any[]>([]);
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
    const [notesLoaded, setNotesLoaded] = useState(false);

    // Initialize state when data loads
    useEffect(() => {
        if (consultation) {
            setDiagnosisText(consultation.doctor_notes || '');
            if (consultation.prescription?.medications) {
                setMedications(consultation.prescription.medications);
            } else {
                setMedications([]);
            }
        }
    }, [consultation]);

    // Load private notes when patient is known
    useEffect(() => {
        if (consultation?.patient?.id && !notesLoaded) {
            setNotesLoaded(true);
            doctorService.getPatientNotes(consultation.patient.id)
                .then((res: any) => {
                    if (res.status) setPrivateNotes(res.data.notes || []);
                })
                .catch(() => { });
        }
    }, [consultation?.patient?.id]);

    const handleSaveNote = async () => {
        if (!noteText.trim() || !consultation?.patient?.id) return;
        setSavingNote(true);
        try {
            const res: any = await doctorService.addPatientNote(consultation.patient.id, noteText.trim());
            if (res.status) {
                setPrivateNotes(prev => [res.data, ...prev]);
                setNoteText('');
                toast.success('تم حفظ الملاحظة بنجاح ✓');
            }
        } catch { toast.error('فشل حفظ الملاحظة'); }
        finally { setSavingNote(false); }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!consultation?.patient?.id) return;
        setDeletingNoteId(noteId);
        try {
            await doctorService.deletePatientNote(consultation.patient.id, noteId);
            setPrivateNotes(prev => prev.filter((n: any) => n.id !== noteId));
            toast.success('تم حذف الملاحظة');
        } catch { toast.error('فشل الحذف'); }
        finally { setDeletingNoteId(null); }
    };

    const updateMutation = useMutation({
        mutationFn: (data: any) => doctorService.updateConsultationNotes(consultationId, data),
        onSuccess: (_data, variables: any) => {
            if (variables.doctor_notes !== undefined) {
                toast.success('تم حفظ التشخيص بنجاح ✓');
                setIsEditingDiagnosis(false);
            } else {
                toast.success('تم حفظ الوصفة الطبية بنجاح ✓');
            }
            queryClient.invalidateQueries({ queryKey: ['doctor-consultation', consultationId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'حدث خطأ أثناء الحفظ، يرجى المحاولة مجدداً');
        }
    });

    const startMutation = useMutation({
        mutationFn: () => doctorService.startConsultation(consultationId),
        onSuccess: () => {
            toast.success('تم بدء الاستشارة');
            queryClient.invalidateQueries({ queryKey: ['doctor-consultation', consultationId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'فشل بدء الاستشارة');
        }
    });

    const completeMutation = useMutation({
        mutationFn: (data: any) => doctorService.completeConsultation(consultationId, data),
        onSuccess: () => {
            toast.success('تم إنهاء الاستشارة بنجاح');
            queryClient.invalidateQueries({ queryKey: ['doctor-consultation', consultationId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'فشل إنهاء الاستشارة');
        }
    });

    const handleSaveDiagnosis = () => {
        if (!diagnosisText.trim()) {
            toast.error('يرجى كتابة التشخيص قبل الحفظ');
            return;
        }
        updateMutation.mutate({ doctor_notes: diagnosisText.trim() });
    };

    // Validate medicine fields and return error map
    const validateMedicine = (med: typeof newMedicine) => {
        const errors: typeof medErrors = {};
        if (!med.name.trim()) errors.name = 'اسم الدواء مطلوب';
        else if (med.name.trim().length < 2) errors.name = 'اسم الدواء قصير جداً';
        if (!med.dosage.trim()) errors.dosage = 'مقدار الجرعة مطلوب';
        if (!med.frequency.trim()) errors.frequency = 'التكرار مطلوب';
        if (!med.duration.trim()) errors.duration = 'المدة مطلوبة';
        return errors;
    };

    const handleAddMedicine = () => {
        const errors = validateMedicine(newMedicine);
        setMedErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error('يرجى تعبئة جميع حقول الدواء');
            return;
        }
        // Add to local state first
        const updatedMeds = [...medications, { ...newMedicine, name: newMedicine.name.trim(), dosage: newMedicine.dosage.trim(), frequency: newMedicine.frequency.trim(), duration: newMedicine.duration.trim() }];
        setMedications(updatedMeds);
        setNewMedicine({ name: '', dosage: '', frequency: '', duration: '' });
        setMedErrors({});
        // Auto-save to backend immediately
        updateMutation.mutate({ medications: updatedMeds });
    };

    const handleRemoveMedicine = (index: number) => {
        const updatedMeds = medications.filter((_, i) => i !== index);
        setMedications(updatedMeds);
        // Auto-save to backend immediately
        updateMutation.mutate({ medications: updatedMeds });
    };

    const handleSavePrescription = () => {
        if (medications.length === 0) {
            toast.error('يرجى إضافة دواء واحد على الأقل');
            return;
        }
        updateMutation.mutate({ medications });
    };

    const handleComplete = () => {
        if (!diagnosisText) {
            toast.error('يرجى إضافة التشخيص أولاً');
            return;
        }
        completeMutation.mutate({
            doctor_notes: diagnosisText,
            medications: medications
        });
    };

    const handleStartMeeting = () => {
        if (consultation.status === 'confirmed') {
            toast.loading('جاري تجهيز غرفة الاجتماع وبدء الجلسة...', { id: 'start-meet' });
            startMutation.mutate(undefined, {
                onSuccess: (res: any) => {
                    toast.dismiss('start-meet');
                    const newLink = res?.data?.google_meet_link || res?.google_meet_link;
                    if (newLink) window.open(newLink, '_blank');
                },
                onError: () => {
                    toast.dismiss('start-meet');
                    window.open(consultation.google_meet_link, '_blank');
                }
            });
        } else {
            window.open(consultation.google_meet_link, '_blank');
        }
    };

    if (loadingDetails) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
        </div>
    );

    if (isError || !consultation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="bg-red-50 p-4 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h3 className="text-base text-slate-800 font-bold text-foreground">عذراً، حدث خطأ</h3>
                    <p className="text-muted-foreground">{(error as any)?.response?.data?.message || 'لم نتمكن من تحميل تفاصيل الاستشارة'}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline">تحديث الصفحة</Button>
            </div>
        );
    }

    const patient = consultation.patient;
    const isVideo = consultation.type === 'video';

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20" dir="rtl">
            {/* Header / Actions Status - Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/20 p-8 flex flex-col items-start gap-6 border border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <BackButton className="bg-white/10 hover:bg-white/20 text-white border-none rounded-2xl" />

                        <div className="h-12 w-px bg-white/10 hidden md:block"></div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-base text-slate-800 font-bold text-white tracking-tight">
                                    استشارة #{id}
                                </h1>
                                <Badge variant={
                                    consultation.status === 'completed' ? 'default' :
                                        consultation.status === 'confirmed' ? 'secondary' : 'outline'
                                } className={cn(
                                    "px-3 py-1 text-xs font-bold shadow-sm",
                                    consultation.status === 'completed' && "bg-emerald-500/20 text-emerald-400 border-none",
                                    consultation.status === 'confirmed' && "bg-blue-500/20 text-blue-400 border-none",
                                    consultation.status === 'pending' && "bg-amber-500/20 text-amber-400 border-none",
                                    consultation.status === 'in_progress' && "bg-indigo-500/20 text-indigo-400 border-none animate-pulse",
                                    consultation.status === 'no_show' && "bg-orange-500/20 text-orange-500 border-none",
                                    consultation.status?.startsWith('cancelled') && "bg-red-500/20 text-red-500 border-none"
                                )}>
                                    {consultation.status === 'completed' ? 'مكتملة' :
                                        consultation.status === 'confirmed' ? 'مؤكدة' :
                                            consultation.status === 'in_progress' ? 'جارية الآن' :
                                                consultation.status === 'no_show' ? 'لم يحضر' :
                                                    consultation.status === 'pending' ? 'بانتظار التأكيد' :
                                                        consultation.status === 'cancelled_by_patient' ? 'ألغيت من المريض' :
                                                            consultation.status === 'cancelled_by_doctor' ? 'ألغيت من قبلك' :
                                                                consultation.status}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-medium">
                                <div className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-full border border-white/5 backdrop-blur-md">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {consultation.date}
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-full border border-white/5 backdrop-blur-md">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {consultation.time}
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-full border border-white/5 backdrop-blur-md">
                                    {isVideo ? <Video className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-emerald-400" />}
                                    {isVideo ? 'استشارة فيديو رقمية' : 'كشف عيادة حضوري'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                        {consultation.status === 'confirmed' ? (
                            <>
                                {isVideo && (
                                    <Button
                                        className="h-12 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl gap-2 flex-1 md:flex-none font-bold"
                                        onClick={handleStartMeeting}
                                        disabled={startMutation.isPending}
                                    >
                                        <Video className="w-5 h-5" />
                                        بدء الاجتماع
                                    </Button>
                                )}
                                <Button
                                    onClick={() => startMutation.mutate()}
                                    disabled={startMutation.isPending}
                                    className="h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl gap-2 flex-1 md:flex-none font-bold"
                                >
                                    {startMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                                    بدء الجلسة
                                </Button>
                            </>
                        ) : consultation.status === 'in_progress' ? (
                            <>
                                {isVideo && (
                                    <Button
                                        variant="outline"
                                        className="h-12 gap-2 flex-1 md:flex-none border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-2xl font-bold bg-slate-900/40 backdrop-blur"
                                        onClick={handleStartMeeting}
                                    >
                                        <Video className="w-5 h-5" />
                                        العودة للاجتماع
                                    </Button>
                                )}
                                <Button
                                    onClick={handleComplete}
                                    disabled={completeMutation.isPending}
                                    className="h-12 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl gap-2 flex-1 md:flex-none shadow-xl shadow-white/10 font-bold"
                                >
                                    {completeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    إنهاء الاستشارة نهائياً
                                </Button>
                            </>
                        ) : consultation.status === 'pending' ? (
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="h-12 rounded-2xl flex-1 text-red-500 hover:text-white hover:bg-red-500 border-red-200 bg-white shadow-sm font-bold transition-all">رفض الموعد</Button>
                                <Button className="h-12 flex-1 rounded-2xl bg-primary hover:bg-primary-600 font-bold shadow-lg shadow-primary/20">تأكيد الموعد</Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Right Sidebar: Patient Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Card variant="elevated" className="p-8 rounded-[32px] border-none shadow-2xl shadow-primary/5 bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2.5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors duration-500" />

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="relative mb-6 group cursor-pointer hover:scale-105 transition-all duration-500">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-24 h-24 rounded-full bg-slate-50 overflow-hidden border-4 border-white shadow-lg relative z-10 flex items-center justify-center">
                                    {patient?.image_url ? (
                                        <img src={patient.image_url} alt={patient.name} className="w-full h-full object-cover rounded-full" />
                                    ) : <User className="w-10 h-10 text-slate-300" />}
                                </div>
                            </div>

                            <h3 className="font-bold text-base text-slate-800 text-slate-900 tracking-tight">{patient?.name}</h3>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-500 mt-2">
                                <span className="bg-slate-100 px-3 py-1 rounded-lg">{patient?.age} سنة</span>
                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                <span dir="ltr" className="bg-slate-100 px-3 py-1 rounded-lg">{patient?.phone}</span>
                            </div>

                            <Button
                                variant="outline"
                                className="mt-8 w-full h-12 rounded-2xl gap-2 font-bold border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm"
                                onClick={() => navigate(`/doctor/patients/${patient?.id}`)}
                            >
                                <User className="w-4 h-4" />
                                عرض الملف الطبي الكامل
                            </Button>
                        </div>

                        <div className="mt-8 space-y-6 relative z-10">
                            {history?.pregnancy && (
                                <div className="bg-pink-50 p-5 rounded-[24px] border border-pink-100 relative overflow-hidden group-hover:border-pink-200 transition-colors">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-100 rounded-full blur-xl" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <div className="flex items-center gap-2 text-pink-700 font-bold">
                                            <div className="p-1.5 bg-pink-500 text-white rounded-lg shadow-sm">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            متابعة الحمل
                                        </div>
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <div className="flex justify-between text-sm py-2 border-b border-pink-200/50">
                                            <span className="text-pink-600/70 font-bold">الأسبوع الحالي</span>
                                            <span className="font-bold text-pink-700">الأسبوع {Math.round(history.pregnancy.current_week) || 1}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b border-transparent">
                                            <span className="text-pink-600/70 font-bold">موعد الولادة</span>
                                            <span className="font-bold text-pink-700">{history.pregnancy.due_date || 'غير محدد'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">السجل الطبي المصغر</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="text-slate-500 font-bold">فصيلة الدم</span>
                                        <span className="font-bold text-slate-900 text-base">{history?.medical_profile?.blood_type || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="text-slate-500 font-bold">الطول / الوزن</span>
                                        <span className="font-bold text-slate-900" dir="ltr">
                                            {history?.medical_profile?.height}cm / {history?.medical_profile?.weight}kg
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {history?.medical_profile?.chronic_diseases?.length > 0 && (
                                <div className="bg-red-50 bg-opacity-70 p-5 rounded-[24px] border border-red-100">
                                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">أمراض مزمنة تم تشخيصها</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {history.medical_profile.chronic_diseases.map((d: string, i: number) => (
                                            <span key={i} className="bg-white text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-100 shadow-sm">{d}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card variant="flat" className="p-0 overflow-hidden bg-white rounded-[32px] border-none shadow-2xl shadow-primary/5">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-800 text-slate-900 flex items-center gap-2">
                                <CalendarClock className="w-5 h-5 text-primary" />
                                سجل الزيارات السابقة
                            </h3>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto p-4 custom-scrollbar">
                            {loadingHistory ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <span className="text-sm font-bold text-slate-400">جاري تحميل السجل...</span>
                                </div>
                            ) : history?.previous_consultations?.length > 0 ? (
                                <div className="space-y-3">
                                    {history.previous_consultations.map((prev: any, i: number) => (
                                        <div
                                            key={prev.id}
                                            className="p-4 bg-slate-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-100 rounded-2xl transition-all duration-300 flex gap-4 group cursor-pointer"
                                            onClick={() => navigate(`/doctor/consultations/${prev.id}`)}
                                        >
                                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                <span className="text-base text-slate-800 font-bold text-slate-700 group-hover:text-primary">{prev.date.split('-')[2]}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(prev.date).toLocaleString('default', { month: 'short' })}</span>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                                                    {prev.type === 'video' ? <Video className="w-3.5 h-3.5 text-blue-500" /> : <MapPin className="w-3.5 h-3.5 text-emerald-500" />}
                                                    {prev.type === 'video' ? 'استشارة رقمية' : 'كشف عيادة'}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-500 line-clamp-1">{prev.diagnosis || 'لم يحدد تشخيص بعد'}</p>
                                            </div>
                                            <div className="flex items-center justify-center pl-2">
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 m-2">
                                    <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                                        <CalendarClock className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm">هذه هي الزيارة الأولى للمريض معاك</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Patient Notes Alert Style */}
                    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-l from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 p-px">
                        <div className="bg-white rounded-[31px] p-8 h-full relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                            <h3 className="font-bold text-base text-slate-800 text-slate-900 mb-5 flex items-center gap-3 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                </div>
                                شكوى و ملاحظات المريض
                            </h3>
                            <div className="text-slate-700 font-bold leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 text-base text-slate-800 relative z-10 shadow-inner">
                                {consultation.patient_notes ? (
                                    <p>{consultation.patient_notes}</p>
                                ) : (
                                    <p className="text-slate-400 italic font-medium">لم يقم المريض بكتابة أي شكوى مسبقة قبل الجلسة.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="diagnosis" className="w-full">
                        <TabsList className="w-full bg-slate-100 p-2 border-none rounded-[24px] h-16 shadow-inner flex overflow-hidden">
                            <TabsTrigger value="diagnosis" className="flex-1 text-base font-bold py-3 rounded-[16px] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300 hover:bg-white/50">
                                التشخيص والعلاج
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="flex-1 text-base font-bold py-3 rounded-[16px] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300 hover:bg-white/50">
                                💬 المحادثة
                            </TabsTrigger>
                            <TabsTrigger value="files" className="flex-1 text-base font-bold py-3 rounded-[16px] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300 hover:bg-white/50">
                                الملفات والتحاليل
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="flex-1 text-base font-bold py-3 rounded-[16px] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300 hover:bg-white/50">
                                الملاحظات الخاصة
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-8 transition-all">
                            <TabsContent value="diagnosis" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                                {/* Diagnosis Section */}
                                <Card variant="elevated" className="p-8 rounded-[32px] border-none shadow-2xl shadow-primary/5 bg-white">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-bold text-base text-slate-800 text-slate-900 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                                <Edit2 className="w-5 h-5" />
                                            </div>
                                            خلاصة التشخيص الطبي
                                        </h3>
                                        {!isEditingDiagnosis && (
                                            <Button size="lg" onClick={() => setIsEditingDiagnosis(true)} className="gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl font-bold transition-all shadow-sm">
                                                <Edit2 className="w-4 h-4" />
                                                {consultation.doctor_notes ? 'تحديث التشخيص' : 'كتابة التشخيص الآن'}
                                            </Button>
                                        )}
                                    </div>

                                    {isEditingDiagnosis ? (
                                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <Textarea
                                                value={diagnosisText}
                                                onChange={(e) => setDiagnosisText(e.target.value)}
                                                placeholder="ابدأ في كتابة نتائج الفحص السريري، وتفاصيل التشخيص النهائي للمريض هنا..."
                                                className="min-h-[160px] bg-white rounded-2xl border-slate-200 text-base text-slate-800 resize-y p-6 font-medium focus-visible:ring-primary/20 shadow-inner"
                                            />
                                            <div className="flex justify-end gap-3 pt-2">
                                                <Button variant="outline" className="h-12 rounded-xl px-6 font-bold hover:bg-slate-100" onClick={() => setIsEditingDiagnosis(false)}>إلغاء الأمر</Button>
                                                <Button onClick={handleSaveDiagnosis} disabled={updateMutation.isPending} className="h-12 rounded-xl px-8 font-bold gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                                                    {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                    حفظ التشخيص في السجل
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        consultation.doctor_notes ? (
                                            <div className="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 leading-loose text-slate-800 font-bold text-base text-slate-800 min-h-[100px] shadow-inner">
                                                {consultation.doctor_notes.split('\n').map((line: string, i: number) => (
                                                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                                    <Edit2 className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-900 font-bold text-base text-slate-800 mb-4">السجل الطبي فارغ</p>
                                                <p className="text-slate-500 font-bold mb-8">لم تقم بإضافة التشخيص النهائي للمريض بعد.</p>
                                                <Button size="lg" className="rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg px-8" onClick={() => setIsEditingDiagnosis(true)}>
                                                    انقر هنا لبدء الكتابة
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </Card>

                                {/* Prescription Section */}
                                <Card variant="elevated" className="p-8 rounded-[32px] border-none shadow-2xl shadow-primary/5 bg-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />

                                    <div className="flex justify-between items-center mb-8 pl-4 pr-2">
                                        <h3 className="font-bold text-base text-slate-800 text-slate-900 flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                                                <Pill className="w-6 h-6" />
                                            </div>
                                            الوصفة الطبية (Electronic Prescription)
                                        </h3>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Add Medicine form */}
                                        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100/80">
                                            <h4 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                                                <Plus className="w-5 h-5 text-purple-500 bg-purple-100 rounded-full p-0.5" />
                                                صرف دواء جديد
                                            </h4>
                                            {/* Error summary banner (shows if any field is invalid after clicking +) */}
                                            {Object.keys(medErrors).length > 0 && (
                                                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    <p className="text-red-600 text-sm font-bold">يرجى تعبئة جميع الحقول المطلوبة المحددة باللون الأحمر</p>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-3">
                                                {/* Row 1: inputs */}
                                                <div className="flex flex-col md:flex-row gap-3">
                                                    {/* Name */}
                                                    <div className="flex-[2]">
                                                        <Label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">الاسم التجاري للدواء <span className="text-red-400">*</span></Label>
                                                        <Input
                                                            placeholder="مثال: Panadol Extra"
                                                            value={newMedicine.name}
                                                            onChange={(e) => { setNewMedicine({ ...newMedicine, name: e.target.value }); if (medErrors.name) setMedErrors(p => ({ ...p, name: undefined })); }}
                                                            className={`h-12 bg-white rounded-xl font-bold px-4 transition-all ${medErrors.name ? 'border-2 border-red-400 bg-red-50/40 focus-visible:ring-red-200' : 'border-slate-200'}`}
                                                        />
                                                        {medErrors.name && <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1"><span>⚠</span> {medErrors.name}</p>}
                                                    </div>
                                                    {/* Dosage */}
                                                    <div className="flex-[1.5]">
                                                        <Label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">مقدار الجرعة <span className="text-red-400">*</span></Label>
                                                        <Input
                                                            placeholder="500mg أو حبة"
                                                            value={newMedicine.dosage}
                                                            onChange={(e) => { setNewMedicine({ ...newMedicine, dosage: e.target.value }); if (medErrors.dosage) setMedErrors(p => ({ ...p, dosage: undefined })); }}
                                                            className={`h-12 bg-white rounded-xl font-bold px-4 transition-all ${medErrors.dosage ? 'border-2 border-red-400 bg-red-50/40 focus-visible:ring-red-200' : 'border-slate-200'}`}
                                                        />
                                                        {medErrors.dosage && <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1"><span>⚠</span> {medErrors.dosage}</p>}
                                                    </div>
                                                    {/* Frequency */}
                                                    <div className="flex-1">
                                                        <Label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">التكرار <span className="text-red-400">*</span></Label>
                                                        <Input
                                                            placeholder="كل 8 ساعات"
                                                            value={newMedicine.frequency}
                                                            onChange={(e) => { setNewMedicine({ ...newMedicine, frequency: e.target.value }); if (medErrors.frequency) setMedErrors(p => ({ ...p, frequency: undefined })); }}
                                                            className={`h-12 bg-white rounded-xl font-bold px-4 transition-all ${medErrors.frequency ? 'border-2 border-red-400 bg-red-50/40 focus-visible:ring-red-200' : 'border-slate-200'}`}
                                                        />
                                                        {medErrors.frequency && <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1"><span>⚠</span> {medErrors.frequency}</p>}
                                                    </div>
                                                    {/* Duration */}
                                                    <div className="flex-1">
                                                        <Label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">المدة <span className="text-red-400">*</span></Label>
                                                        <Input
                                                            placeholder="5 أيام"
                                                            value={newMedicine.duration}
                                                            onChange={(e) => { setNewMedicine({ ...newMedicine, duration: e.target.value }); if (medErrors.duration) setMedErrors(p => ({ ...p, duration: undefined })); }}
                                                            className={`h-12 bg-white rounded-xl font-bold px-4 transition-all ${medErrors.duration ? 'border-2 border-red-400 bg-red-50/40 focus-visible:ring-red-200' : 'border-slate-200'}`}
                                                        />
                                                        {medErrors.duration && <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1"><span>⚠</span> {medErrors.duration}</p>}
                                                    </div>
                                                    {/* Add Button */}
                                                    <div className="flex flex-col justify-start pt-6">
                                                        <Button
                                                            onClick={handleAddMedicine}
                                                            disabled={updateMutation.isPending}
                                                            className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 shrink-0"
                                                        >
                                                            {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medicines List */}
                                        {medications && medications.length > 0 ? (
                                            <div className="space-y-4">
                                                <h4 className="font-bold text-slate-900 mb-4 px-2 text-base text-slate-800">قائمة الأدوية الموصوفة ({medications.length})</h4>
                                                {medications.map((med: any, index: number) => (
                                                    <div key={index} className="flex items-center justify-between p-5 bg-white border md:border-2 border-slate-100 rounded-2xl shadow-sm hover:border-purple-300 hover:shadow-lg transition-all group duration-300">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 flex items-center justify-center text-purple-600 font-bold text-base text-slate-800 border border-purple-100 shadow-inner group-hover:scale-110 transition-transform">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-base text-slate-800 text-slate-900 mb-1.5 flex flex-wrap items-center gap-3">
                                                                    {med.name}
                                                                    <span className="text-sm bg-slate-100 px-3 py-1 rounded-lg text-slate-700 font-bold border border-slate-200 shadow-sm">{med.dosage}</span>
                                                                </div>
                                                                <div className="text-sm font-bold text-slate-500 flex items-center gap-3">
                                                                    {med.frequency && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {med.frequency}</span>}
                                                                    {med.frequency && med.duration && <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-1"></span>}
                                                                    {med.duration && <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-slate-400" /> {med.duration}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="icon" onClick={() => handleRemoveMedicine(index)} className="h-12 w-12 text-red-500 hover:text-white hover:bg-red-500 border-red-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 bg-red-50 hover:scale-110 shadow-sm">
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                <div className="pt-8 flex justify-end mt-8 border-t border-slate-100">
                                                    <Button onClick={handleSavePrescription} disabled={updateMutation.isPending} className="h-16 rounded-2xl px-12 gap-3 bg-purple-600 hover:bg-purple-700 text-white text-base text-slate-800 font-bold shadow-xl shadow-purple-600/30 transition-all hover:-translate-y-1">
                                                        {updateMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                                        اعتماد وصرف الوصفة
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-white rounded-[32px] border-2 border-dashed border-slate-200 mt-6">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                                    <Pill className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-900 font-bold text-base text-slate-800 mb-2">قائمة الأدوية فارغة</p>
                                                <p className="text-slate-500 font-bold">يمكنك إضافة الأدوية وجرعاتها من خلال النموذج أعلاه.</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="chat" className="focus-visible:outline-none focus-visible:ring-0">
                                <div className="bg-white rounded-[32px] p-6 shadow-2xl shadow-primary/5">
                                    <h3 className="font-bold text-xl text-slate-900 mb-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">💬</div>
                                        محادثة مع المريضة
                                    </h3>
                                    <div style={{ height: '500px' }}>
                                        {!['pending', 'cancelled_by_patient', 'cancelled_by_doctor', 'no_show'].includes(consultation.status) ? (
                                            <ConsultationChat
                                                consultationId={consultationId}
                                                consultationStatus={consultation.status}
                                                otherPartyName={patient?.name || 'المريضة'}
                                                otherPartyAvatar={patient?.image_url}
                                                userType="doctor"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400 font-bold">
                                                لا تتوفر محادثة لهذه الاستشارة
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="files" className="focus-visible:outline-none focus-visible:ring-0">
                                <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-primary/5">
                                    <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        الملفات والتحاليل المرفقة
                                    </h3>
                                    <ConsultationAttachments
                                        consultationId={consultationId}
                                        role="doctor"
                                        canUpload={true}
                                        viewerLabel="المريضة"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="notes" className="focus-visible:outline-none focus-visible:ring-0">
                                <div className="bg-white rounded-[32px] shadow-2xl shadow-primary/5 overflow-hidden">
                                    <div className="bg-gradient-to-l from-amber-500 to-orange-500 p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                                <AlertCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-base">ملاحظاتك الخاصة عن هذا المريض</h3>
                                                <p className="text-amber-100 text-xs font-bold mt-0.5">🔒 سرية تامة — لا تظهر للمريض نهائياً</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="bg-amber-50 rounded-3xl border border-amber-100 p-6">
                                            <label className="block text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">إضافة ملاحظة جديدة</label>
                                            <textarea
                                                value={noteText}
                                                onChange={e => setNoteText(e.target.value)}
                                                placeholder="اكتب ملاحظتك الطبية الخاصة هنا... مثلاً: المريضة تعاني من قلق حاد، تحتاج متابعة نفسية..."
                                                rows={4}
                                                className="w-full bg-white rounded-2xl border border-amber-200 px-5 py-4 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none transition-all shadow-inner"
                                            />
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-xs font-bold text-amber-500">{noteText.length} حرف</span>
                                                <Button onClick={handleSaveNote} disabled={savingNote || !noteText.trim()} className="h-12 rounded-2xl px-8 font-bold bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-lg shadow-amber-200 disabled:opacity-50">
                                                    {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                    حفظ الملاحظة
                                                </Button>
                                            </div>
                                        </div>
                                        {privateNotes.length === 0 ? (
                                            <div className="text-center py-14 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                                    <AlertCircle className="w-7 h-7 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-slate-600 mb-1">لا توجد ملاحظات بعد</p>
                                                <p className="text-slate-400 text-sm font-medium">ستظهر ملاحظاتك هنا بعد إضافتها</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{privateNotes.length} ملاحظة محفوظة</p>
                                                {privateNotes.map((note: any) => (
                                                    <div key={note.id} className={cn("bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group", deletingNoteId === note.id && "opacity-50")}>
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-base">📝</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-slate-800 font-medium text-sm leading-relaxed">{note.note}</p>
                                                                <p className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />{note.created_at}
                                                                </p>
                                                            </div>
                                                            <button onClick={() => handleDeleteNote(note.id)} disabled={deletingNoteId === note.id} className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0">
                                                                {deletingNoteId === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default ConsultationDetails;
