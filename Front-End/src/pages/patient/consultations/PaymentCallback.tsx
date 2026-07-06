import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2, XCircle, Loader2, Calendar,
    Home, RotateCcw
} from 'lucide-react';

export const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

    useEffect(() => {
        // Give time for backend to process the payment
        const timer = setTimeout(() => {
            const success = searchParams.get('success');
            const orderId = searchParams.get('order');
            const consultationId = searchParams.get('consultation_id');

            if (success === 'true') {
                setStatus('success');
            } else {
                setStatus('failed');
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [searchParams]);

    const consultationId = searchParams.get('consultation_id') || searchParams.get('order');

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {status === 'loading' && (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            جاري التحقق من الدفع
                        </h2>
                        <p className="text-gray-500">
                            يرجى الانتظار...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            تم الدفع بنجاح! 🎉
                        </h2>
                        <p className="text-gray-500 mb-8">
                            تم حجز استشارتك بنجاح. ستصلك رسالة تأكيد قريباً.
                        </p>

                        <div className="space-y-3">
                            {consultationId && (
                                <button
                                    onClick={() => navigate(`/patient/consultations/${consultationId}`)}
                                    className="w-full py-4 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Calendar className="w-5 h-5" />
                                    عرض تفاصيل الاستشارة
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/patient/consultations')}
                                className="w-full py-4 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                العودة لاستشاراتي
                            </button>
                        </div>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            فشل الدفع
                        </h2>
                        <p className="text-gray-500 mb-8">
                            عذراً، لم نتمكن من إتمام عملية الدفع. يرجى المحاولة مرة أخرى.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-full py-4 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={() => navigate('/patient/consultations/doctors')}
                                className="w-full py-4 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                العودة للبحث
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                            <p>إذا استمرت المشكلة، تواصل مع الدعم الفني</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
