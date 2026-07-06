import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDoctorAiPredictionDetail, useDoctorAddAiComment } from "@/hooks/useDoctorAi";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ChevronRight, User, Stethoscope, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export const DoctorAiPredictionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: prediction, isLoading, isError } = useDoctorAiPredictionDetail(Number(id));
    const commentMutation = useDoctorAddAiComment();

    const [commentText, setCommentText] = useState("");

    React.useEffect(() => {
        if (prediction?.predictable?.doctor_comments) {
            setCommentText(prediction.predictable.doctor_comments);
        }
    }, [prediction]);

    if (isLoading) {
        return <div className="space-y-6"><Skeleton className="h-96 w-full" /></div>;
    }

    if (isError || !prediction) {
        return <div className="p-12 text-center text-slate-500">حدث خطأ في جلب تفاصيل التنبؤ.</div>;
    }

    const history = prediction;
    const predictionRow = prediction.predictable || {};
    const disease_name_ar = prediction.disease_name_ar || history.disease_type;
    const patient = prediction.patient;
    const isHighRisk = history.risk_level === 'high' || predictionRow.risk_level === 'high';

    const handleSaveComment = () => {
        if (!commentText.trim()) return;
        commentMutation.mutate({ id: Number(id), comment: commentText }, {
            onSuccess: () => {
                toast({
                    title: "تم الحفظ",
                    description: "تم إضافة ملاحظتك الطبية بنجاح.",
                });
            },
            onError: () => {
                toast({
                    title: "خطأ",
                    description: "لم نتمكن من حفظ التعليق.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-500 gap-2" onClick={() => navigate('/doctor/ai-center')}>
                    <ChevronRight className="w-4 h-4" /> العودة للمركز
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card variant="elevated" className={`p-8 border ${isHighRisk ? 'border-red-200' : 'border-indigo-100'} overflow-hidden relative`}>
                        <div className={`absolute top-0 right-0 w-full h-2 ${isHighRisk ? 'bg-red-500' : 'bg-indigo-500'}`} />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-black text-slate-900">{disease_name_ar}</h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isHighRisk ? 'bg-red-100 text-red-700' :
                                        predictionRow.risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {predictionRow.risk_label || (isHighRisk ? 'عالي المخاطر' : 'مخاطر منخفضة')}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-500 font-sans mt-1">
                                    {format(new Date(history.created_at), 'd MMMM yyyy, h:mm a', { locale: ar })}
                                </p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[120px]">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">الاحتمالية</p>
                                <p className="text-3xl font-black text-slate-800 font-sans">{(history.confidence_score * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        {history.recommendation_summary && (
                            <div className="space-y-3 mb-8">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <AlertTriangle className={`w-4 h-4 ${isHighRisk ? 'text-red-500' : 'text-slate-400'}`} /> تقرير الذكاء الاصطناعي:
                                </h3>
                                <div className={`p-5 rounded-xl border ${isHighRisk ? 'bg-red-50 border-red-100 text-red-900' : 'bg-slate-50 border-slate-100 text-slate-700'} text-sm leading-relaxed font-medium`}>
                                    {history.recommendation_summary}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 border-slate-100">المدخلات (المقاييس السريرية)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(history.input_features).map(([key, val]) => (
                                    <div key={key} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 line-clamp-1" title={key}>{key}</p>
                                        <p className="text-sm font-bold text-slate-800 font-sans">{String(val)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Doctor Feedback Section */}
                    <Card variant="elevated" className="p-6 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Stethoscope className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-slate-800">ملاحظات الطبيب وتوجيهاته</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            هذه الملاحظة ستكون مرئية للمريضة. يمكنك استخدامها لتوجيه المريضة لإجراء مزيد من الفحوصات أو طمأنتها.
                        </p>
                        <div className="space-y-4">
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-slate-700"
                                placeholder="اكتب توجيهاتك الطبية هنا..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveComment}
                                    disabled={commentMutation.isPending || !commentText.trim() || commentText === predictionRow?.doctor_comments}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl"
                                >
                                    {commentMutation.isPending ? "جاري الحفظ..." : <><Save className="w-4 h-4" /> حفظ وإرسال للمريضة</>}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar (Patient Info) */}
                <div className="space-y-6">
                    <Card variant="elevated" className="p-6 border border-slate-100 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden mx-auto mb-4 border-4 border-white shadow-sm flex items-center justify-center">
                            {patient?.profile?.avatar ? (
                                <img src={patient.profile.avatar} alt={patient.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-slate-400" />
                            )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-1">{patient?.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">{patient?.email}</p>

                        <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => navigate(`/doctor/patients/${patient.id}`)}>
                            عـرض المـلـف الـطـبـي
                        </Button>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default DoctorAiPredictionDetail;
