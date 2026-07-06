import { useParams, Link } from "react-router-dom";
import { useAiCenterPredictionDetail } from "@/hooks/useAiCenter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import BackButton from "@/components/common/BackButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { AlertTriangle, CheckCircle2, Stethoscope, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const PredictionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, isError } = useAiCenterPredictionDetail(Number(id));

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50/50">
                <PublicHeader />
                <main className="flex-grow pt-24 pb-12 p-6 max-w-4xl mx-auto w-full"><Skeleton className="h-[600px] w-full rounded-[2rem]" /></main>
            </div>
        );
    }

    if (isError || !data) {
        return <div className="text-center p-20">عذراً، لم نتمكن من الوصول للنتيجة</div>;
    }

    const { history, prediction, disease_name_ar } = data;
    const isHighRisk = prediction.risk_level?.includes('high');

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <PublicHeader />

            <main className="flex-grow pt-24 pb-12">
                <div className="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto font-primary space-y-6">

                    <div>
                        <div className="mb-4 text-right">
                            <BackButton />
                        </div>
                        <Breadcrumbs items={[
                            { label: 'الذكاء الاصطناعي', path: '/patient/ai-center' },
                            { label: 'سجل التنبؤات', path: '/patient/ai-center/history' },
                            { label: 'التفاصيل' }
                        ]} />
                    </div>

                    <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100">
                        {/* Header Content */}
                        <div className={`p-8 md:p-10 text-white ${isHighRisk ? 'bg-gradient-to-r from-red-600 to-rose-500' :
                            prediction.risk_level?.includes('moderate') ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                'bg-gradient-to-r from-emerald-500 to-teal-400'
                            }`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                                        {isHighRisk ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black mb-1">{disease_name_ar}</h1>
                                        <p className="text-white/80 text-sm font-bold opacity-90 font-sans">
                                            {format(new Date(history.created_at), 'd MMMM yyyy, h:mm a', { locale: ar })}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20 text-center min-w-[140px]">
                                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">نسبة الخطر</p>
                                    <p className="text-4xl font-black font-sans">{(history.confidence_score * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 space-y-10">

                            {/* Doctor Feedback section if doctor interacted with this record */}
                            {prediction.doctor_comments && (
                                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between gap-2 border-b border-blue-200/50 pb-3 mb-2">
                                        <div className="flex items-center gap-2 text-blue-800 font-bold">
                                            <Stethoscope className="w-5 h-5" />
                                            تعليق {data.doctor_info ? data.doctor_info.name : 'الطبيب المشرف'}
                                        </div>
                                        {data.doctor_info && (
                                            <Link
                                                to={`/doctors/${data.doctor_info.id}`}
                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 transition-colors bg-blue-100/50 px-2 py-1 rounded-md"
                                                title={`عرض ملف ${data.doctor_info.name}`}
                                            >
                                                عرض الملف <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                    <p className="text-blue-900 text-sm leading-relaxed">{prediction.doctor_comments}</p>
                                </div>
                            )}

                            {/* Recommendations */}
                            {history.recommendation_summary && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-800"></div> تحليل الآلة:
                                    </h3>
                                    <div className="p-6 bg-slate-50 text-slate-700 leading-relaxed rounded-2xl border border-slate-100 text-sm font-medium">
                                        {history.recommendation_summary}
                                    </div>
                                </div>
                            )}

                            {/* Inputs Echo (Optional/Debug) */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 border-b pb-3 border-slate-100">
                                    المدخلات التي تم تقييمها
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(history.input_features).map(([key, val]) => (
                                        <div key={key} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 line-clamp-1" title={key}>{key}</p>
                                            <p className="text-sm font-bold text-slate-700 font-sans">{String(val)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default PredictionDetailPage;
