import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorPatientDetails, useAddPatientNote } from '@/hooks/useDoctorPatients';
import { Loader2, ArrowRight, User, Phone, Mail, Calendar, Ruler, Weight, Activity, FileText, Lock, Plus, Video, MapPin, Clock, CalendarClock, X, Download, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Card from '@/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BackButton from '@/components/common/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { doctorService } from '@/services/doctorService';
import { toast } from 'sonner';

const PatientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: response, isLoading } = useDoctorPatientDetails(Number(id));
    const addNoteMutation = useAddPatientNote();

    const [note, setNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);

    const [previewFile, setPreviewFile] = useState<any>(null);

    const handleDownload = async (e: React.MouseEvent, file: any) => {
        e.stopPropagation();
        if (!patient?.id) return;

        try {
            toast.loading('جاري تجهيز الملف للتنزيل...', { id: 'download' });

            // Call our new secure endpoint which passes auth headers and returns Blob directly
            const response = await doctorService.downloadPatientMedicalFile(patient.id, file.id);

            // Axios responseType: 'blob' will handle the data as a Blob
            const blob = new Blob([response.data || response]);
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.file_name || 'medical_file';
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            toast.success('بدأ تنزيل الملف ✓', { id: 'download' });
        } catch (error) {
            toast.error('فشل في تنزيل الملف، يحاول فتح الملف...', { id: 'download' });
            window.open(file.file_url, '_blank');
        }
    };

    const categoryMap: Record<string, string> = {
        'lab_result': 'تحاليل طبية',
        'ultrasound': 'موجات صوتية',
        'x_ray': 'صورة أشعة',
        'prescription': 'روشتة علاجية',
        'medical_report': 'تقرير طبي',
        'other': 'أخرى'
    };


    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
        </div>
    );

    const patient = response?.data?.patient;
    if (!patient) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
            <User className="w-16 h-16 mb-4 opacity-20" />
            <p>لا توجد بيانات للمريض</p>
        </div>
    );

    const medicalProfile = patient.profile || {};
    const history = patient.consultations_history || [];
    const notes = patient.notes || [];
    const files = patient.medical_files || [];

    const handleAddNote = () => {
        if (!note.trim()) return;
        addNoteMutation.mutate({ id: Number(id), note }, {
            onSuccess: () => setNote('')
        });
    }

    // Calculate BMI
    const bmi = medicalProfile.height && medicalProfile.weight
        ? (medicalProfile.weight / ((medicalProfile.height / 100) ** 2)).toFixed(1)
        : null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12" dir="rtl">
            {/* Navigation & Breadcrumb */}
            <div className="flex items-center justify-between bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800">الملف الشخصي للمريض</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">عرض السجل الطبي وتفاصيل المريض الكاملة</p>
                    </div>
                </div>
                <BackButton className="hidden sm:flex text-slate-500 hover:text-slate-800 hover:bg-slate-100" label="العودة" />
            </div>

            {/* Premium Header / Cover */}
            <div className="bg-white rounded-[40px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 w-full">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] overflow-hidden bg-slate-50 ring-8 ring-white shadow-xl relative z-10">
                            {patient.image_url ? (
                                <img src={patient.image_url} alt={patient.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border-4 border-white z-20">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center sm:text-right">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">{patient.name}</h2>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-2xl border border-slate-100 font-bold">
                                <Calendar className="w-4 h-4 text-primary" />
                                {patient.age} سنة
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-2xl border border-slate-100 font-bold">
                                <span>{patient.life_stage?.name_ar || patient.life_stage?.name || 'مرحلة غير محددة'}</span>
                            </div>
                            {patient.has_pregnancy && (
                                <div className="flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-2xl border border-pink-100 font-bold">
                                    <Activity className="w-4 h-4" />
                                    حامل - الأسبوع {Math.round(Number(patient.pregnancy_week)) || 1}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Vitals */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-slate-50 p-6 rounded-3xl border border-slate-100 relative z-10 w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500 border border-slate-100">
                            <Ruler className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-0.5">الطول</p>
                            <p className="font-extrabold text-slate-800 text-lg leading-none">{medicalProfile.height || '-'} <span className="text-xs font-bold text-slate-500">سم</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100">
                            <Weight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-0.5">الوزن</p>
                            <p className="font-extrabold text-slate-800 text-lg leading-none">{medicalProfile.weight || '-'} <span className="text-xs font-bold text-slate-500">كجم</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-red-500 border border-slate-100">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-0.5">فصيلة الدم</p>
                            <p className="font-extrabold text-slate-800 text-lg leading-none" dir="ltr">{medicalProfile.blood_type || '-'}</p>
                        </div>
                    </div>
                    {bmi && (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-500 border border-slate-100">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-0.5">مؤشر كتلة الجسم</p>
                                <p className="font-extrabold text-slate-800 text-lg leading-none">{bmi}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Side Panel: Medical Alerts & Info */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 h-full">
                        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6 text-orange-500" />
                            <h3 className="font-black text-orange-900 text-lg">تنبيهات طبية</h3>
                        </div>
                        <div className="space-y-6 px-1">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> الحالات المزمنة
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {medicalProfile.chronic_diseases?.length > 0 ? (
                                        medicalProfile.chronic_diseases.map((d: string, i: number) => (
                                            <span key={i} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-red-100">{d}</span>
                                        ))
                                    ) : <span className="text-slate-400 font-medium text-sm italic">لا توجد حالات مسجلة</span>}
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-100"></div>
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> حساسية (Allergies)
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {medicalProfile.allergies?.length > 0 ? (
                                        medicalProfile.allergies.map((a: string, i: number) => (
                                            <span key={i} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-amber-100">{a}</span>
                                        ))
                                    ) : <span className="text-slate-400 font-medium text-sm italic">لا توجد حساسية مسجلة</span>}
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-100"></div>
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> الأدوية الحالية
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {medicalProfile.current_medications?.length > 0 ? (
                                        medicalProfile.current_medications.map((m: string, i: number) => (
                                            <span key={i} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-indigo-100">{m}</span>
                                        ))
                                    ) : <span className="text-slate-400 font-medium text-sm italic">لا توجد أدوية مسجلة</span>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 px-1">
                            <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                                    <FileText className="w-4 h-4" />
                                </div>
                                التاريخ المرضي
                            </h3>
                            {medicalProfile.medical_history ? (
                                <p className="text-slate-700 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {medicalProfile.medical_history}
                                </p>
                            ) : (
                                <p className="text-slate-400 font-medium text-sm italic p-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                    لا يوجد تاريخ مرضي مسجل
                                </p>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 px-1">
                            <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                                    <Phone className="w-4 h-4" />
                                </div>
                                جهات الاتصال
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-500 font-medium text-sm">الهاتف</span>
                                    <span className="font-bold text-slate-800" dir="ltr">{patient.phone || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-500 font-medium text-sm">البريد</span>
                                    <span className="font-bold text-slate-800">{patient.email || '-'}</span>
                                </div>
                                {medicalProfile.emergency_contact_phone && (
                                    <div className="mt-4 flex flex-col items-start p-4 rounded-2xl bg-red-50 border border-red-100">
                                        <span className="text-xs font-black text-red-500 mb-1 uppercase tracking-widest">جهة اتصال للطوارئ</span>
                                        <div className="w-full flex justify-between items-center mt-2">
                                            <span className="text-red-900 font-bold text-sm">{medicalProfile.emergency_contact_name}</span>
                                            <span className="font-black text-red-600" dir="ltr">{medicalProfile.emergency_contact_phone}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="history" className="w-full">
                        <TabsList className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm inline-flex mb-6 w-full h-auto gap-2 overflow-x-auto">
                            <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-black font-bold data-[state=active]:shadow-none rounded-xl py-3 whitespace-nowrap">
                                <CalendarClock className="w-5 h-5 ml-2" />
                                سجل الزيارات
                            </TabsTrigger>
                            <TabsTrigger value="files" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-black font-bold data-[state=active]:shadow-none rounded-xl py-3 whitespace-nowrap">
                                <FileText className="w-5 h-5 ml-2" />
                                الملفات الطبية
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-black font-bold data-[state=active]:shadow-none rounded-xl py-3 whitespace-nowrap">
                                <Lock className="w-5 h-5 ml-2" />
                                ملاحظات خاصة
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="history" className="mt-0 space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
                                        <Calendar className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد زيارات سابقة</h3>
                                    <p className="text-slate-500 font-medium">لم يقم هذا المريض بأي استشارات معك حتى الآن</p>
                                </div>
                            ) : (
                                <div className="relative border-r-2 border-slate-100 mr-4 pr-8 space-y-10 py-6">
                                    {history.map((visit: any, index: number) => (
                                        <div key={visit.id} className="relative group">
                                            {/* Timeline dot */}
                                            <div className="absolute -right-[43px] top-8 w-5 h-5 rounded-full bg-primary ring-8 ring-white group-hover:scale-125 transition-transform"></div>

                                            <div onClick={() => navigate(`/doctor/consultations/${visit.id}`)} className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all cursor-pointer">
                                                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${visit.type === 'video' ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {visit.type === 'video' ? <Video className="w-7 h-7" /> : <MapPin className="w-7 h-7" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xl font-black text-slate-800 mb-1 group-hover:text-primary transition-colors">
                                                                {visit.type === 'video' ? 'استشارة فيديو' : 'كشف عيادة'}
                                                            </h4>
                                                            <span className="text-slate-500 font-medium flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                {visit.date} • {visit.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-4 py-2 rounded-2xl text-sm font-bold w-fit flex items-center gap-2 ${visit.status === 'completed' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' :
                                                        visit.status === 'confirmed' ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        <div className={`w-2 h-2 rounded-full ${visit.status === 'completed' ? 'bg-emerald-500' : visit.status === 'confirmed' ? 'bg-primary' : 'bg-slate-400'}`} />
                                                        {visit.status === 'completed' ? 'مكتملة' : visit.status === 'confirmed' ? 'مؤكدة' : visit.status}
                                                    </span>
                                                </div>

                                                {visit.patient_notes && (
                                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-4">
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">شكوى المريض</span>
                                                        <p className="text-slate-700 font-medium leading-relaxed">{visit.patient_notes}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
                                                    <span className="text-primary font-bold flex items-center hover:gap-3 transition-all">
                                                        عرض التفاصيل <ArrowRight className="w-5 h-5 mr-2" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="files" className="mt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {files.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
                                            <FileText className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد ملفات طبية</h3>
                                        <p className="text-slate-500 font-medium">لم يقم المريض برفع أي تحاليل أو ملفات سابقة</p>
                                    </div>
                                ) : (
                                    files.map((file: any) => (
                                        <div key={file.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all flex items-center gap-5 group relative overflow-hidden">
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner shrink-0">
                                                <FileText className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <h4 className="font-extrabold text-slate-800 mb-1 truncate">{file.file_name}</h4>
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{categoryMap[file.category] || file.category || 'ملف طبي'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 flex flex-col gap-2">
                                                <button onClick={(e) => handleDownload(e, file)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors" title="تنزيل الملف">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors" title="معاينة الملف">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-0 bg-white p-6 sm:p-10 rounded-[32px] border border-slate-100 shadow-sm">
                            <div className="space-y-8">
                                <div className="space-y-5 bg-slate-50 p-6 rounded-[24px] border border-slate-100 shadow-inner">
                                    <Label className="text-lg font-black text-slate-800 block">إضافة ملاحظة جديدة</Label>
                                    <Textarea
                                        placeholder="اكتب ملاحظاتك الخاصة هنا (لا تظهر للمريض)..."
                                        className="min-h-[120px] resize-none bg-white border-none rounded-2xl shadow-sm text-base p-4 focus-visible:ring-primary/20"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center space-x-2 space-x-reverse bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                                            <Switch className="data-[state=checked]:bg-amber-500" id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} disabled />
                                            <Label htmlFor="private-mode" className="text-sm text-amber-700 flex items-center gap-2 cursor-pointer font-bold">
                                                <Lock className="w-4 h-4" />
                                                ملاحظة سرية (تلقائي)
                                            </Label>
                                        </div>
                                        <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 font-bold text-base" onClick={handleAddNote} disabled={addNoteMutation.isPending || !note.trim()}>
                                            {addNoteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ الملاحظة'}
                                        </Button>
                                    </div>
                                </div>

                                {notes.length > 0 && <div className="h-px bg-slate-100"></div>}

                                <div className="space-y-5">
                                    {notes.map((n: any) => (
                                        <div key={n.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:shadow-md hover:border-primary/20 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    {n.is_private && (
                                                        <div className="bg-amber-50 text-amber-500 p-2 rounded-xl">
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-700 leading-relaxed font-medium text-lg whitespace-pre-wrap">{n.note}</p>
                                        </div>
                                    ))}
                                    {notes.length === 0 && (
                                        <div className="text-center py-10 opacity-50">
                                            <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-bold">لا توجد ملاحظات سابقة</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[32px] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg sm:text-xl truncate max-w-xs sm:max-w-md">
                                            {previewFile.file_name}
                                        </h3>
                                        <p className="text-slate-500 font-bold text-xs sm:text-sm mt-0.5 uppercase tracking-widest">
                                            {categoryMap[previewFile.category] || previewFile.category || 'ملف طبي'} • {new Date(previewFile.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <button
                                        onClick={(e) => handleDownload(e, previewFile)}
                                        className="h-10 px-4 sm:px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">تنزيل الملف</span>
                                    </button>
                                    <button
                                        onClick={() => setPreviewFile(null)}
                                        className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors border border-red-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 bg-slate-50 p-4 sm:p-8 overflow-hidden flex items-center justify-center relative">
                                {previewFile.file_url?.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={`${previewFile.file_url}#toolbar=0`}
                                        className="w-full h-full rounded-2xl shadow-sm border border-slate-200 bg-white"
                                        title="معاينة PDF"
                                    />
                                ) : previewFile.file_url?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                    <img
                                        src={previewFile.file_url}
                                        alt={previewFile.file_name}
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-sm border border-slate-200 bg-white"
                                    />
                                ) : (
                                    <div className="text-center bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm max-w-sm w-full mx-auto">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ExternalLink className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="font-black text-slate-800 text-xl mb-3">ملف غير مدعوم للمعاينة</h3>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                            لا يمكننا عرض هذا النوع من الملفات داخل المتصفح مباشرة.
                                        </p>
                                        <button
                                            onClick={(e) => handleDownload(e, previewFile)}
                                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-primary/25"
                                        >
                                            <Download className="w-5 h-5" />
                                            تنزيل الملف للكشف عنه
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PatientDetails;
