import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
    CheckCircle2, FileText, Clock, ArrowRight,
    User, Calendar, Star, Loader2, Plus, Trash2, Pill
} from 'lucide-react';
import { consultationService, Consultation } from '@/services/consultationService';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/common/BackButton";

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
}

export const CompleteConsultation = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    const [doctorNotes, setDoctorNotes] = useState(location.state?.doctorNotes || '');
    const [diagnosis, setDiagnosis] = useState('');
    const [followUp, setFollowUp] = useState<'none' | 'week' | 'two_weeks' | 'month'>('none');

    // Medications State
    const [medications, setMedications] = useState<Medication[]>([]);
    const [newMed, setNewMed] = useState<Medication>({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
    });

    const duration = location.state?.duration || 0;

    useEffect(() => {
        const fetchConsultation = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await consultationService.getConsultationDetails(parseInt(id));
                if (response.status && response.data) {
                    const cons = response.data.consultation || response.data;
                    setConsultation(cons);

                    if (cons.status === 'completed') {
                        setCompleted(true);
                    }
                }
            } catch (err) {
                toast.error('حدث خطأ في جلب بيانات الاستشارة');
            } finally {
                setLoading(false);
            }
        };

        fetchConsultation();
    }, [id]);

    const addMedication = () => {
        if (!newMed.name || !newMed.dosage) {
            toast.error('يرجى إدخال اسم الدواء والجرعة');
            return;
        }
        setMedications([...medications, newMed]);
        setNewMed({ name: '', dosage: '', frequency: '', duration: '', notes: '' });
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleComplete = async () => {
        if (!id) return;

        setSubmitting(true);
        try {
            let follow_up_required = followUp !== 'none';
            let follow_up_after_days = undefined;
            if (followUp === 'week') follow_up_after_days = 7;
            else if (followUp === 'two_weeks') follow_up_after_days = 14;
            else if (followUp === 'month') follow_up_after_days = 30;

            const response = await consultationService.completeConsultation(parseInt(id), {
                doctor_notes: doctorNotes.trim() || "لا توجد ملاحظات إضافية من الطبيب.",
                diagnosis: diagnosis.trim() || undefined,
                medications,
                follow_up_required,
                follow_up_after_days,
            });

            if (response.status) {
                toast.success('تم إنهاء الاستشارة بنجاح');
                setCompleted(true);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'حدث خطأ';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} دقيقة`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4" dir="rtl">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        تم إنهاء الاستشارة بنجاح
                    </h2>
                    <p className="text-gray-500 mb-8">
                        شكراً لك. تم حفظ جميع الملاحظات والتوصيات وارسال الوصفة الطبية.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/doctor/consultations')}
                            className="w-full py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg transition-all"
                        >
                            العودة للاستشارات
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 pb-24" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="mb-4 text-right">
                        <BackButton className="text-white/80 hover:text-white" label="الاستشارات" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8" />
                        إنهاء الاستشارة
                    </h1>
                    <p className="text-white/80">
                        أضف ملاحظاتك، التشخيص، والوصفة الطبية للمريض
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Diagnosis */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                التشخيص
                            </h2>
                            <textarea
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="أضف التشخيص الطبي..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none transition-all"
                            />
                        </div>

                        {/* Prescription */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Pill className="w-5 h-5 text-purple-500" />
                                الوصفة الطبية
                            </h2>

                            {/* Add Medication Form */}
                            <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <Input
                                        placeholder="اسم الدواء"
                                        value={newMed.name}
                                        onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="الجرعة (مثال: 500 ملجم)"
                                        value={newMed.dosage}
                                        onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="التكرار (مثال: 3 مرات يومياً)"
                                        value={newMed.frequency}
                                        onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="المدة (مثال: 7 أيام)"
                                        value={newMed.duration}
                                        onChange={e => setNewMed({ ...newMed, duration: e.target.value })}
                                        className="bg-white"
                                    />
                                </div>
                                <Input
                                    placeholder="ملاحظات إضافية (أو تعليمات الاستخدام)"
                                    value={newMed.notes}
                                    onChange={e => setNewMed({ ...newMed, notes: e.target.value })}
                                    className="bg-white mb-3"
                                />
                                <Button onClick={addMedication} variant="outline" className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50">
                                    <Plus className="w-4 h-4 ml-2" />
                                    إضافة دواء
                                </Button>
                            </div>

                            {/* Medications List */}
                            {medications.length > 0 ? (
                                <div className="space-y-2">
                                    {medications.map((med, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800">{med.name}</span>
                                                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{med.dosage}</span>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {med.frequency} - {med.duration}
                                                    {med.notes && <span className="block text-gray-400 text-xs mt-1">{med.notes}</span>}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeMedication(idx)} className="text-red-400 hover:text-red-500 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    لم تتم إضافة أدوية بعد
                                </div>
                            )}
                        </div>

                        {/* Doctor Notes */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" />
                                ملاحظات خاصة (تظهر لك فقط)
                            </h2>
                            <textarea
                                value={doctorNotes}
                                onChange={(e) => setDoctorNotes(e.target.value)}
                                placeholder="أضف ملاحظاتك الشخصية عن الحالة..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Session Summary */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                ملخص الجلسة
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-sm">مدة الجلسة</span>
                                    <span className="font-bold text-gray-900">{formatDuration(duration)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-sm">التاريخ</span>
                                    <span className="font-bold text-gray-900">
                                        {consultation?.date && new Date(consultation.date).toLocaleDateString('ar-EG')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm">المريض</span>
                                    <span className="font-bold text-gray-900">{consultation?.patient?.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-500" />
                                موعد المتابعة
                            </h2>

                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'none', label: 'لا يلزم' },
                                    { value: 'week', label: 'أسبوع' },
                                    { value: 'two_weeks', label: 'أسبوعين' },
                                    { value: 'month', label: 'شهر' },
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFollowUp(option.value as any)}
                                        className={`p-2 rounded-lg text-sm transition-all border ${followUp === option.value
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={handleComplete}
                        disabled={submitting}
                        className="flex-1 py-3 font-bold text-white bg-gradient-to-r from-green-600 to-primary-700 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                حفظ وإنهاء الاستشارة
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/doctor/consultations')}
                        disabled={submitting}
                        className="px-6 py-3 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompleteConsultation;
