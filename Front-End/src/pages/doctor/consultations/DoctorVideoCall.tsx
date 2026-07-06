import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Video, Clock, User, ExternalLink, Shield, AlertTriangle,
    Loader2, ArrowRight, FileText, Copy, CheckCircle2, Phone
} from 'lucide-react';
import { consultationService, Consultation } from '@/services/consultationService';

export const DoctorVideoCall = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meetLink, setMeetLink] = useState<string | null>(null);
    const [showNotes, setShowNotes] = useState(false);
    const [doctorNotes, setDoctorNotes] = useState('');

    // Timer
    const [elapsedTime, setElapsedTime] = useState(0);
    const [inCall, setInCall] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch consultation details
    useEffect(() => {
        const fetchConsultation = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await consultationService.getDoctorConsultationDetails(parseInt(id));
                if (response.status && response.data) {
                    const cons = response.data.consultation || response.data;
                    setConsultation(cons);
                    setMeetLink(cons.google_meet_link);
                }
            } catch (err) {
                setError('حدث خطأ في جلب بيانات الاستشارة');
            } finally {
                setLoading(false);
            }
        };

        fetchConsultation();
    }, [id]);

    // Timer effect
    useEffect(() => {
        if (inCall) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [inCall]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Start consultation and create Google Meet
    const startMeeting = async () => {
        if (!id || !consultation) return;

        setStarting(true);
        try {
            // Start the consultation (creates Google Meet)
            const response = await consultationService.startConsultation(parseInt(id));

            if (response.status && response.data) {
                const link = response.data.google_meet_link || response.data.meet_link;
                setMeetLink(link);
                setInCall(true);

                // Open Meet in new tab
                if (link) {
                    window.open(link, '_blank');
                    toast.success('تم بدء الاستشارة بنجاح');
                }
            } else {
                throw new Error(response.message || 'فشل في بدء الاستشارة');
            }
        } catch (err: any) {
            console.error('Start meeting error:', err);

            // Check if doctor needs to connect Google account
            if (err.response?.data?.needs_auth) {
                toast.error('يجب ربط حساب Google أولاً');
                navigate('/doctor/settings/google-connect');
                return;
            }

            setError(err.message || 'حدث خطأ أثناء بدء الاستشارة');
        } finally {
            setStarting(false);
        }
    };

    const copyMeetLink = () => {
        if (meetLink) {
            navigator.clipboard.writeText(meetLink);
            toast.success('تم نسخ رابط الاجتماع');
        }
    };

    const openMeeting = () => {
        if (meetLink) {
            window.open(meetLink, '_blank');
        }
    };

    const endCall = () => {
        setInCall(false);
        // Navigate to complete consultation page
        navigate(`/doctor/consultations/${id}/complete`, {
            state: {
                doctorNotes,
                duration: elapsedTime
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
                    <button
                        onClick={() => navigate('/doctor/consultations')}
                        className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    >
                        العودة للاستشارات
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/doctor/consultations')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" />
                        رجوع
                    </button>
                    <h1 className="text-2xl font-bold text-white">إدارة الاستشارة</h1>
                    {inCall && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="font-mono">{formatTime(elapsedTime)}</span>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Patient Info Card */}
                    <div className="bg-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-400" />
                            معلومات المريض
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                                    م
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">اسم المريض</h3>
                                    <p className="text-gray-400 text-sm">مريض</p>
                                </div>
                            </div>

                            {consultation?.patient_notes && (
                                <div className="p-4 bg-gray-700/50 rounded-xl">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">ملاحظات المريض:</h4>
                                    <p className="text-gray-400 text-sm">{consultation.patient_notes}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {consultation?.date && new Date(consultation.date).toLocaleDateString('ar-EG')} - {consultation?.time}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Meeting Card */}
                    <div className="md:col-span-2 bg-gray-800 rounded-2xl overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-green-600/20 to-primary-700/20 flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-white" />
                                </div>
                                <p className="text-white font-medium text-lg">Google Meet</p>
                                <p className="text-gray-400 text-sm">
                                    {inCall ? 'الاستشارة جارية...' : 'جاهز لبدء الاستشارة'}
                                </p>
                            </div>

                            {/* Timer overlay when in call */}
                            {inCall && (
                                <div className="absolute top-4 right-4 bg-black/50 px-4 py-2 rounded-full flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-white font-mono">{formatTime(elapsedTime)}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Meet Link (if available) */}
                            {meetLink && (
                                <div className="flex items-center gap-2 bg-gray-700/50 p-3 rounded-xl">
                                    <input
                                        type="text"
                                        value={meetLink}
                                        readOnly
                                        className="flex-1 bg-transparent text-gray-300 text-sm outline-none"
                                    />
                                    <button
                                        onClick={copyMeetLink}
                                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                                        title="نسخ الرابط"
                                    >
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={openMeeting}
                                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                                        title="فتح الاجتماع"
                                    >
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {!inCall ? (
                                    <button
                                        onClick={startMeeting}
                                        disabled={starting}
                                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-primary-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {starting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                جاري البدء...
                                            </>
                                        ) : (
                                            <>
                                                <Video className="w-5 h-5" />
                                                بدء الاستشارة
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowNotes(!showNotes)}
                                            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileText className="w-5 h-5" />
                                            الملاحظات
                                        </button>
                                        <button
                                            onClick={openMeeting}
                                            className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                            فتح Meet
                                        </button>
                                        <button
                                            onClick={endCall}
                                            className="py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-5 h-5 rotate-135" />
                                            إنهاء
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Panel */}
                {showNotes && (
                    <div className="mt-6 bg-gray-800 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            ملاحظات الجلسة
                        </h3>
                        <textarea
                            value={doctorNotes}
                            onChange={(e) => setDoctorNotes(e.target.value)}
                            placeholder="اكتب ملاحظاتك هنا أثناء الاستشارة..."
                            className="w-full h-40 p-4 bg-gray-700 text-white rounded-xl border-0 resize-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 bg-gray-800/50 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4">📋 تعليمات للطبيب</h3>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            اضغط على "بدء الاستشارة" لإنشاء رابط Google Meet تلقائياً
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            سيتم إرسال الرابط للمريض تلقائياً عبر البريد والإشعارات
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            يمكنك كتابة الملاحظات أثناء الاستشارة
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            عند انتهاء الاستشارة، اضغط "إنهاء" لإضافة التشخيص والوصفة
                        </li>
                    </ul>
                </div>

                {/* Security Info */}
                <div className="mt-4 p-4 bg-gray-800/50 rounded-xl flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-gray-400 text-sm">
                        جميع المكالمات مشفرة ومحمية عبر Google Meet
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DoctorVideoCall;
