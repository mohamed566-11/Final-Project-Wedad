import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDoctorAiStats, useDoctorAiPredictions } from "@/hooks/useDoctorAi";
import Card from "@/components/common/Card";
import { Brain, Activity, HeartPulse, Baby, AlertTriangle, ChevronLeft, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PredictionDetailDialog } from "@/components/doctor/ai-center/PredictionDetailDialog";

export const DoctorAiDashboard: React.FC = () => {
    const [modelFilter, setModelFilter] = useState('');
    const [riskFilter, setRiskFilter] = useState('');

    const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);

    const { data: stats, isLoading: isStatsLoading, refetch: refetchStats, isFetching: isFetchingStats } = useDoctorAiStats();
    const { data: predictionsData, isLoading: isPredictionsLoading, refetch: refetchPredictions, isFetching: isFetchingPredictions } = useDoctorAiPredictions({
        model: modelFilter || undefined,
        risk_level: riskFilter || undefined,
    });

    const handleRefresh = () => {
        refetchStats();
        refetchPredictions();
    };

    const getIconMap = (type: string) => {
        switch (type) {
            case "gestational_diabetes": return Activity;
            case "preeclampsia": return HeartPulse;
            case "preterm_birth": return Baby;
            default: return Brain;
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">الذكاء الاصطناعي - مركز التنبؤات</h1>
                    <p className="text-muted-foreground">
                        متابعة نتائج النماذج التشخيصية لمريضاتك وتحليل مستويات الخطورة.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isFetchingStats || isFetchingPredictions}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${(isFetchingStats || isFetchingPredictions) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isFetchingStats || isFetchingPredictions ? 'جاري التحديث...' : 'تحديث البيانات'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 xl:gap-6">
                {(isStatsLoading && !stats) ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
                ) : (
                    <>
                        <Card variant="elevated" className="p-4 xl:p-6 border border-indigo-100 bg-indigo-50/30">
                            <div className="flex flex-col items-start gap-3">
                                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl"><Brain className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">إجمالي الفحوصات</p>
                                    <p className="text-2xl font-black">{stats?.total_predictions || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="elevated" className="p-4 xl:p-6 border border-rose-100 bg-rose-50/30">
                            <div className="flex flex-col items-start gap-3">
                                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">تنبيهات الخطورة</p>
                                    <p className="text-2xl font-black text-rose-600">{stats?.high_risk_count || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="elevated" className="p-4 xl:p-6 border border-emerald-100 bg-emerald-50/30">
                            <div className="flex flex-col items-start gap-3">
                                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl"><Activity className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">سكري الحمل</p>
                                    <p className="text-2xl font-black">{stats?.by_disease?.gestational_diabetes || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="elevated" className="p-4 xl:p-6 border border-orange-100 bg-orange-50/30">
                            <div className="flex flex-col items-start gap-3">
                                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl"><Baby className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">الولادات المبكرة</p>
                                    <p className="text-2xl font-black">{stats?.by_disease?.preterm_birth || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="elevated" className="p-4 xl:p-6 border border-purple-100 bg-purple-50/30">
                            <div className="flex flex-col items-start gap-3">
                                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><HeartPulse className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">تسمم الحمل</p>
                                    <p className="text-2xl font-black">{stats?.by_disease?.preeclampsia || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card variant="elevated" className="p-4 xl:p-6 border border-cyan-100 bg-cyan-50/30">
                            <div className="flex flex-col items-start gap-3">
                                <div className="p-2.5 bg-cyan-100 text-cyan-600 rounded-xl"><Activity className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">العناية للرضع (SCBU)</p>
                                    <p className="text-2xl font-black">{stats?.by_disease?.scbu || 0}</p>
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>

            {/* Filters and List */}
            <Card variant="elevated" className="p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold">أحدث التنبؤات السريرية</h3>
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                        >
                            <option value="">جميع النماذج</option>
                            <option value="gestational_diabetes">سكري الحمل</option>
                            <option value="preeclampsia">تسمم الحمل</option>
                            <option value="preterm_birth">الولادة المبكرة</option>
                            <option value="scbu">دخول العناية (SCBU)</option>
                        </select>
                        <select
                            className="bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                        >
                            <option value="">جميع مستويات الخطورة</option>
                            <option value="high">عالية الخطورة</option>
                            <option value="moderate">متوسطة الخطورة</option>
                            <option value="low">منخفضة</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-r-lg">المريضة</th>
                                <th className="px-4 py-3 font-medium">النموذج (الفحص)</th>
                                <th className="px-4 py-3 font-medium">مستوى الخطورة</th>
                                <th className="px-4 py-3 font-medium">الثقة / الاحتمالية</th>
                                <th className="px-4 py-3 font-medium">تاريخ الفحص</th>
                                <th className="px-4 py-3 font-medium rounded-l-lg"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {(isPredictionsLoading && !predictionsData) ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">جاري تحميل السجلات...</td>
                                </tr>
                            ) : predictionsData?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        لا توجد فحوصات مطابقة للبحث.
                                    </td>
                                </tr>
                            ) : (
                                predictionsData?.map((item: any) => {
                                    const Icon = getIconMap(item.disease_type);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                        {item.patient?.profile?.avatar ? (
                                                            <img src={item.patient.profile.avatar} alt={item.patient?.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold bg-slate-100">
                                                                {item.patient?.name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{item.patient?.name}</p>
                                                        <p className="text-xs text-slate-500">{item.patient?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium text-slate-700">{item.disease_name_ar}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                                                    item.risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {item.risk_level === 'high' ? 'عالية الخطورة' : item.risk_level === 'moderate' ? 'متوسطة' : 'منخفضة'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold font-sans text-slate-700">
                                                    {(item.confidence_score * 100).toFixed(1)}%
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 text-xs font-sans">
                                                {format(new Date(item.created_at), 'd MMM yyyy, h:mm a', { locale: ar })}
                                            </td>
                                            <td className="px-4 py-4 text-left">
                                                <button
                                                    onClick={() => setSelectedPredictionId(item.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-bold"
                                                >
                                                    التفاصيل
                                                    <ChevronLeft className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <PredictionDetailDialog
                predictionId={selectedPredictionId}
                onClose={() => setSelectedPredictionId(null)}
            />
        </div>
    );
};

export default DoctorAiDashboard;
