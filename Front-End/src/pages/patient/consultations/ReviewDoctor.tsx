import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { consultationService, Consultation } from '@/services/consultationService';
import { ReviewForm } from '@/components/consultations/RatingComponents';

export const ReviewDoctor = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchConsultation = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await consultationService.getConsultationDetails(parseInt(id));
                if (response.status && response.data) {
                    const cons = response.data.consultation || response.data;
                    setConsultation(cons);

                    // Check if already reviewed
                    if (cons.has_review) {
                        setSubmitted(true);
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

    const handleSubmit = async (data: { rating: number; comment: string; is_anonymous: boolean }) => {
        if (!id) return;

        setSubmitting(true);
        try {
            const response = await consultationService.reviewConsultation(parseInt(id), data);

            if (response.status) {
                toast.success('تم إرسال التقييم بنجاح!');
                setSubmitted(true);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'حدث خطأ أثناء إرسال التقييم';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate(`/patient/consultations/${id}`)}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
                    >
                        <ArrowRight className="w-5 h-5" />
                        تفاصيل الاستشارة
                    </button>

                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        <Star className="w-8 h-8" />
                        تقييم الاستشارة
                    </h1>
                    {consultation && (
                        <p className="text-white/80">مع {consultation.doctor?.name}</p>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {submitted ? (
                    // Success State
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">شكراً لك!</h2>
                        <p className="text-gray-600 mb-6">
                            تم إرسال تقييمك بنجاح. رأيك يساعدنا في تحسين خدماتنا.
                        </p>
                        <button
                            onClick={() => navigate('/patient/consultations')}
                            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                            العودة لاستشاراتي
                        </button>
                    </div>
                ) : (
                    // Review Form
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        {consultation && consultation.doctor && (
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
                                    {consultation.doctor.image_url ? (
                                        <img
                                            src={consultation.doctor.image_url}
                                            alt={consultation.doctor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            👨‍⚕️
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{consultation.doctor.name}</h3>
                                    <p className="text-gray-500">{consultation.doctor.specialization_ar}</p>
                                    <p className="text-sm text-gray-400">
                                        {new Date(consultation.date).toLocaleDateString('ar-EG')}
                                    </p>
                                </div>
                            </div>
                        )}

                        <ReviewForm onSubmit={handleSubmit} loading={submitting} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewDoctor;
