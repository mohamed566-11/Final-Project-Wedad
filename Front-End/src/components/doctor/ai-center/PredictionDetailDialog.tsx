import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDoctorAiPredictionDetail, useDoctorAddAiComment } from "@/hooks/useDoctorAi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, Stethoscope, Save, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface PredictionDetailDialogProps {
    predictionId: number | null;
    onClose: () => void;
}

export const PredictionDetailDialog: React.FC<PredictionDetailDialogProps> = ({ predictionId, onClose }) => {
    const { data: prediction, isLoading, isError } = useDoctorAiPredictionDetail(predictionId || 0);
    const commentMutation = useDoctorAddAiComment();

    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        if (prediction?.predictable?.doctor_comments) {
            setCommentText(prediction.predictable.doctor_comments);
        } else {
            setCommentText("");
        }
    }, [prediction, predictionId]);

    const handleSaveComment = () => {
        if (!commentText.trim() || !predictionId) return;
        commentMutation.mutate({ id: predictionId, comment: commentText }, {
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

    const isOpen = predictionId !== null;

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
            return <div className="space-y-6"><Skeleton className="h-64 w-full rounded-2xl" /></div>;
        }

        if (isError || !prediction) {
            return <div className="p-8 text-center text-slate-500">حدث خطأ في جلب تفاصيل التنبؤ.</div>;
        }

        const history = prediction;
        const predictionRow = prediction.predictable || {};
        const disease_name_ar = prediction.disease_name_ar || history.disease_type;
        const patient = prediction.patient;
        const isHighRisk = history.risk_level === 'high' || predictionRow.risk_level === 'high';

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Sidebar (Patient Info) */}
                <div className="space-y-4">
                    <Card variant="elevated" className="p-5 border border-slate-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden mx-auto mb-3 border-[3px] border-white shadow-sm flex items-center justify-center">
                            {patient?.profile?.avatar ? (
                                <img src={patient.profile.avatar} alt={patient.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-slate-400" />
                            )}
                        </div>
                        <h3 className="font-bold text-base text-slate-800 mb-1">{patient?.name}</h3>
                        <p className="text-xs text-slate-500 mb-4 truncate">{patient?.email}</p>

                        <Link to={`/doctor/patients/${patient.id}`}>
                            <Button variant="outline" size="sm" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                عرض الملف الطبي
                            </Button>
                        </Link>
                    </Card>

                    <Card variant="elevated" className="p-5 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 border-slate-100 mb-3">المدخلات (المقاييس)</h3>
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {Object.entries(history.input_features).map(([key, val]) => (
                                <div key={key} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 truncate" title={key}>{key}</p>
                                    <p className="text-xs font-bold text-slate-800 font-sans">{String(val)}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                    <Card variant="elevated" className={`p-6 border ${isHighRisk ? 'border-red-200' : 'border-indigo-100'} overflow-hidden relative`}>
                        <div className={`absolute top-0 right-0 w-full h-1.5 ${isHighRisk ? 'bg-red-500' : 'bg-indigo-500'}`} />

                        <div className="flex justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h2 className="text-xl font-black text-slate-900">{disease_name_ar}</h2>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isHighRisk ? 'bg-red-100 text-red-700' :
                                        predictionRow.risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {predictionRow.risk_label || (isHighRisk ? 'عالي المخاطر' : 'مخاطر منخفضة')}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 font-sans">
                                    {format(new Date(history.created_at), 'd MMMM yyyy, h:mm a', { locale: ar })}
                                </p>
                            </div>

                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-center flex flex-col justify-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الاحتمالية</p>
                                <p className="text-2xl font-black text-slate-800 font-sans leading-none">{(history.confidence_score * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        {history.recommendation_summary && (
                            <div className="space-y-2 mb-2">
                                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <AlertTriangle className={`w-3.5 h-3.5 ${isHighRisk ? 'text-red-500' : 'text-slate-400'}`} /> تقرير الذكاء الاصطناعي:
                                </h3>
                                <div className={`p-4 rounded-xl border ${isHighRisk ? 'bg-red-50 border-red-100 text-red-900' : 'bg-slate-50 border-slate-100 text-slate-700'} text-xs leading-relaxed font-medium`}>
                                    {history.recommendation_summary}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card variant="elevated" className="p-5 border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-base font-bold text-slate-800">ملاحظات والتوجيهات الطبية</h3>
                            </div>
                            <Link to={`/doctor/ai-center/${predictionId}`} className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-bold">
                                ملء الشاشة <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 block">
                            اكتب ملاحظاتك وتوجيهاتك لكي تراها المريضة في ملفها.
                        </p>
                        <div className="space-y-3">
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-slate-700 h-24"
                                placeholder="اكتب توجيهاتك الطبية هنا..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveComment}
                                    size="sm"
                                    disabled={commentMutation.isPending || !commentText.trim() || commentText === predictionRow?.doctor_comments}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-lg"
                                >
                                    {commentMutation.isPending ? "جاري الحفظ..." : <><Save className="w-3 h-3" /> حفظ</>}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2 border-b pb-3 border-border">
                        تفاصيل التنبؤ السريري
                    </DialogTitle>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};
