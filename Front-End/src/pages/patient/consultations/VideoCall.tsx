import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Video, VideoOff, Mic, MicOff, Phone,
    Clock, User, ExternalLink, Shield, AlertTriangle,
    Loader2, ArrowRight, CheckCircle2, Copy, RefreshCw
} from 'lucide-react';
import { consultationService, Consultation } from '@/services/consultationService';

export const VideoCall = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [meetLink, setMeetLink] = useState<string | null>(null);
    const [canJoin, setCanJoin] = useState(false);

    // Timer state
    const [elapsedTime, setElapsedTime] = useState(0);
    const [inCall, setInCall] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch consultation details
    useEffect(() => {
        const fetchConsultation = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await consultationService.getConsultationDetails(parseInt(id));
                if (response.status && response.data) {
                    const cons = response.data.consultation || response.data;
                    setConsultation(cons);
                    setMeetLink(cons.google_meet_link);
                    setCanJoin(cons.can_join);
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

    const copyMeetLink = () => {
        if (meetLink) {
            navigator.clipboard.writeText(meetLink);
            toast.success('تم نسخ رابط الاجتماع');
        }
    };

    const joinMeeting = () => {
        if (meetLink) {
            setInCall(true);
            window.open(meetLink, '_blank');
        }
    };

    const endCall = () => {
        setInCall(false);
        navigate(`/patient/consultations/${id}`);
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
                        onClick={() => navigate('/patient/consultations')}
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/patient/consultations')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" />
                        رجوع
                    </button>
                    <h1 className="text-2xl font-bold text-white">استشارة فيديو</h1>
                    <div></div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Doctor Info Card */}
                    <div className="bg-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-400" />
                            معلومات الطبيب
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                {consultation?.doctor?.image_url ? (
                                    <img
                                        src={consultation.doctor.image_url}
                                        alt={consultation.doctor.name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {consultation?.doctor?.name?.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-white font-medium">
                                        د. {consultation?.doctor?.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {consultation?.doctor?.specialization_ar}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {consultation?.date && new Date(consultation.date).toLocaleDateString('ar-EG')} - {consultation?.time}
                                </span>
                            </div>

                            {inCall && (
                                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-4 py-2 rounded-xl">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span>مدة المكالمة: {formatTime(elapsedTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meeting Card */}
                    <div className="bg-gray-800 rounded-2xl overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-white" />
                                </div>
                                <p className="text-white font-medium text-lg">Google Meet</p>
                                <p className="text-gray-400 text-sm">استشارة فيديو آمنة</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Meet Link */}
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
                                </div>
                            )}

                            {/* Join Button */}
                            {canJoin ? (
                                <button
                                    onClick={joinMeeting}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-primary-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    انضم للاجتماع
                                </button>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-yellow-400 text-sm mb-2">
                                        ⏰ الاجتماع سيكون متاحاً قبل الموعد بـ 10 دقائق
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        الموعد: {consultation?.date} - {consultation?.time}
                                    </p>
                                </div>
                            )}

                            {/* End Call Button (when in call) */}
                            {inCall && (
                                <button
                                    onClick={endCall}
                                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-5 h-5 rotate-135" />
                                    إنهاء المكالمة
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-gray-800/50 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4">📋 تعليمات مهمة</h3>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            تأكد من اتصال الإنترنت لديك قوي ومستقر
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            تأكد من عمل الكاميرا والميكروفون قبل الانضمام
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            اختر مكاناً هادئاً وإضاءة جيدة
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                            سيفتح Google Meet في نافذة جديدة
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

export default VideoCall;
