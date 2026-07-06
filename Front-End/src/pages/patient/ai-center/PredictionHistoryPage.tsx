import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAiCenterHistory } from "@/hooks/useAiCenter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import BackButton from "@/components/common/BackButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { ChevronLeft, Brain, Activity, HeartPulse, Baby } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const PredictionHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: historyData, isLoading, isError } = useAiCenterHistory();

    const getIconInfo = (type: string) => {
        switch (type) {
            case 'gestational_diabetes': return { icon: Activity, color: "text-rose-500", bg: "bg-rose-50" };
            case 'preeclampsia': return { icon: HeartPulse, color: "text-indigo-500", bg: "bg-indigo-50" };
            case 'preterm_birth': return { icon: Baby, color: "text-orange-500", bg: "bg-orange-50" };
            default: return { icon: Brain, color: "text-slate-500", bg: "bg-slate-50" };
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <PublicHeader />

            <main className="flex-grow pt-24 pb-12">
                <div className="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto font-primary space-y-8">

                    <div>
                        <div className="mb-4 text-right">
                            <BackButton />
                        </div>
                        <div className="mb-6">
                            <Breadcrumbs items={[
                                { label: 'الذكاء الاصطناعي', path: '/patient/ai-center' },
                                { label: 'سجل التنبؤات' }
                            ]} />
                        </div>

                        <h1 className="text-3xl font-black text-foreground mb-2">سجل الفحوصات</h1>
                        <p className="text-muted-foreground text-sm">جميع الفحوصات الطبية الذكية السابقة التي قمتِ بها.</p>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="p-12 text-center text-slate-500 font-medium">خطأ في جلب السجل.</div>
                        ) : Array.isArray(historyData) && historyData.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {historyData.map((entry: any) => {
                                    const { icon: Icon, color, bg } = getIconInfo(entry.disease_type);
                                    
                                    const renderRiskBadge = (level: string) => {
                                        if (!level) return null;
                                        if (level.includes('high')) {
                                            return <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">خطورة عالية</span>;
                                        }
                                        if (level.includes('medium') || level.includes('moderate')) {
                                            return <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">خطورة متوسطة</span>;
                                        }
                                        if (level.includes('low') || level.includes('normal')) {
                                            return <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">خطورة منخفضة</span>;
                                        }
                                        return null;
                                    };

                                    return (
                                        <div
                                            key={entry.id}
                                            onClick={() => navigate(`/patient/ai-center/history/${entry.id}`)}
                                            className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-3 rounded-2xl", bg, color)}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-slate-800">{entry.disease_name_ar}</h3>
                                                        {renderRiskBadge(entry.risk_level)}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 font-sans">
                                                        {format(new Date(entry.created_at), 'd MMMM yyyy, h:mm a', { locale: ar })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-left hidden sm:block">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الاحتساب</p>
                                                    <p className="font-bold font-sans text-slate-700">{(entry.confidence_score * 100).toFixed(1)}%</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-slate-200 transition-colors">
                                                    <ChevronLeft className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-16 text-center text-slate-500">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Brain className="w-10 h-10" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-700 mb-1">لا يوجد سجل</h3>
                                <p className="text-sm">لم تقومي بأي فحوصات عبر الذكاء الاصطناعي حتى الآن.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default PredictionHistoryPage;
