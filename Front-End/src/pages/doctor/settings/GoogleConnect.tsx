import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    CheckCircle2, XCircle, Loader2, Video, Calendar,
    Shield, ArrowRight, ExternalLink, Unlink
} from 'lucide-react';
import { consultationService } from '@/services/consultationService';

export const GoogleConnect = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [googleEmail, setGoogleEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check for OAuth callback
    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError('تم رفض ربط الحساب');
            setLoading(false);
            return;
        }

        if (code && state) {
            handleOAuthCallback(code, state);
        } else {
            checkConnection();
        }
    }, [searchParams]);

    const checkConnection = async () => {
        setLoading(true);
        try {
            const response = await consultationService.checkGoogleConnection();
            if (response.status) {
                setIsConnected(response.data.is_connected);
                if (response.data.google_email) {
                    setGoogleEmail(response.data.google_email);
                }
            }
        } catch (err) {
            console.error('Check connection error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthCallback = async (code: string, state: string) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/doctor/google/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ code, state }),
            });

            const data = await response.json();

            if (data.status) {
                setIsConnected(true);
                toast.success('تم ربط حساب Google بنجاح!');
                // Remove query params
                navigate('/doctor/settings/google-connect', { replace: true });
            } else {
                setError(data.message || 'فشل في ربط الحساب');
            }
        } catch (err) {
            setError('حدث خطأ أثناء ربط الحساب');
        } finally {
            setLoading(false);
        }
    };

    const connectGoogle = async () => {
        setConnecting(true);
        try {
            const response = await consultationService.getGoogleAuthUrl();
            if (response.status && response.data.auth_url) {
                // Redirect to Google OAuth
                window.location.href = response.data.auth_url;
            } else {
                toast.error('فشل في الحصول على رابط الربط');
            }
        } catch (err) {
            toast.error('حدث خطأ أثناء الاتصال');
        } finally {
            setConnecting(false);
        }
    };

    const disconnectGoogle = async () => {
        if (!confirm('هل أنت متأكد من فصل حساب Google؟ لن تتمكن من استخدام Google Meet للاستشارات.')) {
            return;
        }

        setDisconnecting(true);
        try {
            const response = await consultationService.disconnectGoogle();
            if (response.status) {
                setIsConnected(false);
                setGoogleEmail(null);
                toast.success('تم فصل حساب Google');
            } else {
                toast.error(response.message || 'فشل في فصل الحساب');
            }
        } catch (err) {
            toast.error('حدث خطأ أثناء فصل الحساب');
        } finally {
            setDisconnecting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/50 pb-20 animate-fade-in" dir="rtl">
            {/* Hero Section */}
            <div className="relative h-72 md:h-80 bg-foreground rounded-b-[48px] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/40 to-slate-900 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>

                {/* Decorative Elements */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="container max-w-4xl mx-auto px-6 h-full flex flex-col justify-center pt-8 relative z-10">
                    <button
                        onClick={() => navigate('/doctor/consultations')}
                        className="w-10 h-10 mb-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/5"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>

                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3 flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                            <Video className="w-8 h-8 text-blue-300" />
                        </div>
                        ربط حساب Google
                    </h1>
                    <p className="text-border font-medium text-lg max-w-xl leading-relaxed opacity-90">
                        قم بربط حسابك لتفعيل ميزات الاستشارات المرئية عبر Google Meet ومزامنة المواعيد تلقائياً.
                    </p>
                </div>
            </div>

            <div className="container max-w-4xl mx-auto px-6 -mt-8 relative z-20">
                {/* Status Card */}
                <div className="bg-white rounded-[32px] shadow-xl shadow-border/50 border border-border overflow-hidden mb-8 relative group">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500"></div>

                    <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col items-center md:items-start text-center md:text-right">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4 relative z-10">
                                    <svg className="w-14 h-14" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                {isConnected && (
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-md">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-foreground mb-2">
                                {isConnected ? 'حسابك متصل بنجاح' : 'حساب Google غير متصل'}
                            </h2>
                            {isConnected && googleEmail && (
                                <p className="text-blue-600 font-bold mb-2 bg-blue-50 px-3 py-1 rounded-lg inline-block text-sm" dir="ltr">
                                    {googleEmail}
                                </p>
                            )}
                            <p className="text-muted-foreground font-medium max-w-sm">
                                {isConnected
                                    ? 'يمكنك الآن استقبال حجوزات الفيديو وسيتم إنشاؤها تلقائياً على Google Meet.'
                                    : 'يجب ربط الحساب لتتمكن من إجراء الاستشارات الافتراضية مع المرضى.'}
                            </p>
                        </div>

                        <div className="w-full md:w-auto flex flex-col items-center">
                            {isConnected ? (
                                <button
                                    onClick={disconnectGoogle}
                                    disabled={disconnecting}
                                    className="w-full md:w-auto px-8 py-4 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-red-500/5 border border-red-100"
                                >
                                    {disconnecting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            جاري الفصل...
                                        </>
                                    ) : (
                                        <>
                                            <Unlink className="w-5 h-5" />
                                            فصل الحساب
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={connectGoogle}
                                    disabled={connecting}
                                    className="w-full md:w-auto px-8 py-4 bg-foreground text-white hover:bg-foreground font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 group/btn"
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            جاري الاتصال...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-5 h-5 group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
                                            ربط حساب Google الآن
                                        </>
                                    )}
                                </button>
                            )}
                            <p className="text-xs text-muted-foreground mt-4 font-medium text-center">
                                سيتم تحويلك إلى صفحة Google الآمنة
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-shake">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-red-700 font-bold">{error}</p>
                    </div>
                )}

                {/* Features Grid */}
                <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                    مميزات الربط مع Google
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[28px] border border-border shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Video className="w-7 h-7 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-black text-foreground mb-2">استشارات فيديو تلقائية</h4>
                        <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                            سيقوم النظام بإنشاء رابط Google Meet خاص لكل استشارة وحفظه تلقائياً لك وللمريض.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-[28px] border border-border shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all group duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Calendar className="w-7 h-7 text-green-600" />
                        </div>
                        <h4 className="text-lg font-black text-foreground mb-2">تزامن مع التقويم</h4>
                        <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                            لن تفوتك أي مواعيد! سيتم إضافة حجوزات المرضى مباشرة إلى تقويم Google الخاص بك.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-[28px] border border-border shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all group duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Shield className="w-7 h-7 text-purple-600" />
                        </div>
                        <h4 className="text-lg font-black text-foreground mb-2">خصوصية وأمان</h4>
                        <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                            نحن نطلب فقط الصلاحيات الضرورية لإدارة اجتماعاتك، ولا نطلع على بياناتك الشخصية الأخرى.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleConnect;
