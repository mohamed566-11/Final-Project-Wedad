import React from "react";
import { useAdminAiDashboard, useAdminAiModelsStats, useAdminAiRiskDistribution } from "@/hooks/useAdminAi";
import Card from "@/components/common/Card";
import { Brain, Activity, ShieldCheck, HeartPulse, Baby, Users, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from "framer-motion";

export const AdminAiAnalytics: React.FC = () => {
    const { data: dashboard, isLoading: isDashLoading } = useAdminAiDashboard();
    const { data: modelsStats, isLoading: isModelsLoading } = useAdminAiModelsStats();
    const { data: riskDist, isLoading: isRiskLoading } = useAdminAiRiskDistribution();

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    const riskData = riskDist ? [
        { name: 'خطورة منخفضة', value: riskDist.low },
        { name: 'خطورة متوسطة', value: riskDist.moderate },
        { name: 'عالية الخطورة', value: riskDist.high },
    ] : [];

    const getIconMap = (type: string) => {
        switch (type) {
            case "gestational_diabetes": return { icon: Activity, color: "text-rose-600", bg: "bg-rose-100", border: 'border-rose-200' };
            case "preeclampsia": return { icon: HeartPulse, color: "text-indigo-600", bg: "bg-indigo-100", border: 'border-indigo-200' };
            case "preterm_birth": return { icon: Baby, color: "text-amber-600", bg: "bg-amber-100", border: 'border-amber-200' };
            default: return { icon: Brain, color: "text-slate-600", bg: "bg-slate-100", border: 'border-slate-200' };
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8" dir="rtl">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        تحليلات مركز الذكاء الاصطناعي
                    </h1>
                    <p className="text-slate-500 font-medium">
                        مراقبة أداء نماذج التنبؤ، توزيع المخاطر، والتحليلات الشاملة للنظام الطبي الذكي لدعم القرار.
                    </p>
                </div>
            </motion.div>

            {/* Top Level Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isDashLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-[2rem]" />)
                ) : (
                    <>
                        {/* Card 1 */}
                        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-7 border border-indigo-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[1.2rem] group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> شامل
                                </span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-400 mb-1">إجمالي الفحوصات المنفذة</p>
                                <p className="text-4xl font-black text-slate-800">{dashboard?.total_predictions.toLocaleString() || 0}</p>
                            </div>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-7 border border-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -left-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[1.2rem] group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-400 mb-1">المريضات المستفيدات</p>
                                <p className="text-4xl font-black text-slate-800">{dashboard?.unique_patients || 0}</p>
                            </div>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-rose-500 to-red-600 rounded-[2rem] p-7 shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -left-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3.5 bg-white/20 border border-white/30 text-white rounded-[1.2rem] group-hover:scale-110 transition-transform duration-300 shadow-inner backdrop-blur-md">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <span className="bg-white/20 text-white border border-white/20 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md">
                                    عناية مركزة
                                </span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-rose-100 mb-1">الحالات عالية الخطورة</p>
                                <p className="text-4xl font-black text-white">{dashboard?.high_risk_count || 0}</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Models Performance/Stats */}
                <motion.div variants={itemVariants} className="col-span-2">
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-indigo-500" /> كفاءة واستخدام النماذج الطبية
                            </h3>
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                تحديث دوري
                            </span>
                        </div>

                        {isModelsLoading ? (
                            <div className="space-y-5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-[1.5rem]" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {modelsStats?.map((model: any) => {
                                    const { icon: Icon, color, bg, border } = getIconMap(model.disease_type);
                                    return (
                                        <div key={model.disease_type} className="p-5 rounded-[1.5rem] border border-slate-100 bg-white hover:bg-slate-50/80 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-4 rounded-[1.2rem] ${bg} ${color} ${border} border shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg text-slate-800">{model.model_name_ar}</h4>
                                                    <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">{model.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8 divide-x divide-x-reverse divide-slate-200/60 bg-slate-50/50 p-4 rounded-[1.2rem] border border-slate-100/50">
                                                <div className="pl-6 text-center">
                                                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-1">مرات الاستخدام</p>
                                                    <p className="font-black text-xl text-slate-700">{model.usage_count}</p>
                                                </div>
                                                <div className="pr-6 text-center">
                                                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-1">دقة النموذج</p>
                                                    <p className="font-black font-sans text-xl text-indigo-600 px-3 py-0.5 bg-indigo-50 rounded-lg">
                                                        {(model.average_confidence * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Risk Distribution Chart */}
                <motion.div variants={itemVariants}>
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col">
                        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner mb-2 border border-emerald-100">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">توزيع المخاطر العام</h3>
                            <p className="text-xs text-slate-400 font-bold">بناءً على نتائج التحليل الذكي</p>
                        </div>

                        {isRiskLoading ? (
                            <div className="flex-1 flex items-center justify-center min-h-[300px]"><Skeleton className="h-56 w-56 rounded-full" /></div>
                        ) : riskDist && (riskDist.low > 0 || riskDist.moderate > 0 || riskDist.high > 0) ? (
                            <div className="flex-1 flex items-center justify-center min-h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={riskData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={75}
                                            outerRadius={100}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={8}
                                        >
                                            {riskData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `drop-shadow(0px 4px 6px ${COLORS[index % COLORS.length]}40)` }} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [`${value} حالة`, 'العدد']}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px 20px', fontFamily: 'Cairo, sans-serif' }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={48} 
                                            iconType="circle" 
                                            wrapperStyle={{ fontSize: '14px', fontFamily: 'Cairo, sans-serif', fontWeight: '800' }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-10 h-10 text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-500 text-lg">لا توجد حالات حالياً</p>
                                <p className="text-sm">لم يتم تسجيل بيانات كافية للرسم البياني</p>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default AdminAiAnalytics;
