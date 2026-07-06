import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIotQueries } from '../../../../hooks/useIotQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Footprints, Activity, Unlink, RefreshCw } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring" as const, stiffness: 100 }
    }
};

export default function SmartBand() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { useAuthUrl, useMetrics, connectMutation, disconnectMutation, syncMutation } = useIotQueries();

    const { data: authData, isLoading: authLoading } = useAuthUrl();
    const { data: metricsData, isLoading: metricsLoading } = useMetrics();

    const hasAttemptedConnect = React.useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code && !hasAttemptedConnect.current) {
            hasAttemptedConnect.current = true;
            connectMutation.mutate(code, {
                onSettled: () => {
                    setSearchParams({});
                    navigate('/trackers/smart-band', { replace: true });
                }
            });
        }
    }, [searchParams, connectMutation, navigate, setSearchParams]);

    if (metricsLoading) {
        return (
            <div className="flex bg-slate-50/50 min-h-screen pt-12 pb-24 items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <Loader2 className="h-10 w-10 text-primary" />
                </motion.div>
                <span className="mr-3 text-slate-500 text-lg font-medium">جاري تحميل البيانات الحيوية...</span>
            </div>
        );
    }

    const isConnected = metricsData?.is_connected;

    const CustomTooltip = ({ active, payload, label, unit, color }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-3 rounded-xl shadow-xl">
                    <p className="text-slate-500 text-xs mb-1 font-medium">{new Date(label).toLocaleString('ar-EG')}</p>
                    <p className="text-lg font-bold" style={{ color }}>
                        {payload[0].value} <span className="text-sm font-normal text-slate-400">{unit}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 font-cairo overflow-hidden" dir="rtl">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-24">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    
                    <div className="mb-4 text-right">
                        <BackButton />
                    </div>
                    <div className="mb-6">
                        <Breadcrumbs items={[{ label: 'متتبعات الصحة', path: '/trackers' }, { label: 'السوار الذكي' }]} />
                    </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
                            السوار الذكي
                            <motion.div whileHover={{ scale: 1.05 }}>
                                <Badge variant={isConnected ? "default" : "secondary"} className={`text-sm px-3 py-1 ${isConnected ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg' : ''}`}>
                                    {isConnected ? 'متصل ومفعل' : 'غير متصل'}
                                </Badge>
                            </motion.div>
                        </h1>
                        <p className="text-slate-500 mt-2 text-base md:text-lg">
                            تتبع بيانات صحتك الحيوية مباشرة من سوارك بطريقة حية وتفاعلية.
                        </p>
                    </div>

                    {isConnected && (
                        <div className="flex items-center gap-3">
                            <Button
                                className="bg-white text-slate-700 hover:bg-slate-100 border-slate-200 border shadow-sm transition-all hover:shadow-md"
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                            >
                                <RefreshCw className={`h-4 w-4 ml-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                مزامنة البيانات
                            </Button>
                            <Button
                                variant="destructive"
                                className="shadow-rose-500/20 shadow-lg hover:shadow-xl transition-all"
                                onClick={() => disconnectMutation.mutate()}
                                disabled={disconnectMutation.isPending}
                            >
                                <Unlink className="h-4 w-4 ml-2" />
                                إلغاء الربط
                            </Button>
                        </div>
                    )}
                </motion.div>

                {!isConnected ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="max-w-xl mx-auto mt-12 shadow-2xl border-0 overflow-hidden bg-white/60 backdrop-blur-3xl ring-1 ring-slate-200/50">
                            <CardHeader className="text-center pt-10">
                                <motion.div
                                    className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30 transform rotate-3"
                                    whileHover={{ rotate: 0, scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Activity className="h-10 w-10" />
                                </motion.div>
                                <CardTitle className="text-3xl text-slate-800 font-bold tracking-tight">ابدأ بتتبع صحتك</CardTitle>
                                <CardDescription className="text-slate-500 mt-3 text-lg leading-relaxed px-4">
                                    قم بربط سوار <span className="font-semibold text-slate-700">HONOR</span> أو <span className="font-semibold text-slate-700">Huawei</span> الخاص بك باستخدام Google Fit لنقل قراءاتك الحيوية تلقائياً.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-12 pt-4">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-6 text-lg font-medium shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1"
                                    onClick={() => {
                                        if (authData?.url) window.location.href = authData.url;
                                    }}
                                    disabled={authLoading || !authData?.url}
                                >
                                    المتابعة لتسجيل الدخول عبر Google
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

                        {/* Quick Stats overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                                <Card className="bg-white border-0 shadow-xl shadow-rose-100/50 overflow-hidden relative ring-1 ring-slate-100 h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                                    <CardContent className="p-8 flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-semibold mb-2">النبض المباشر</p>
                                            <div className="flex items-end gap-2">
                                                <h3 className="text-6xl font-black text-slate-800 tracking-tighter">
                                                    {metricsData?.metrics?.latest_heart_rate ? Math.round(metricsData.metrics.latest_heart_rate) : '--'}
                                                </h3>
                                                <span className="text-slate-400 mb-2 font-medium">نبضة/د</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                                <Heart className="h-8 w-8 fill-rose-500 text-rose-500" />
                                            </motion.div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                                <Card className="bg-white border-0 shadow-xl shadow-emerald-100/50 overflow-hidden relative ring-1 ring-slate-100 h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                                    <CardContent className="p-8 flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-semibold mb-2">إجمالي الخطوات</p>
                                            <div className="flex items-end gap-2">
                                                <h3 className="text-6xl font-black text-slate-800 tracking-tighter">
                                                    {metricsData?.metrics?.steps_24h?.toLocaleString() || 0}
                                                </h3>
                                                <span className="text-slate-400 mb-2 font-medium">خطوة</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <Footprints className="h-8 w-8" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Heart Rate Chart */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-0 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 bg-white">
                                <CardHeader className="border-b border-slate-100/50 pb-6 mb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                                        <div className="p-2 bg-rose-100 text-rose-500 rounded-lg">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        معدل نبضات القلب (24 ساعة)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[350px] w-full" dir="ltr">
                                        {metricsData?.charts?.heart_rates && metricsData.charts.heart_rates.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={metricsData.charts.heart_rates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tickFormatter={(val) => new Date(val).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                        stroke="#cbd5e1"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        dy={10}
                                                    />
                                                    <YAxis stroke="#cbd5e1" fontSize={12} domain={['dataMin - 5', 'auto']} tickLine={false} axisLine={false} />
                                                    <Tooltip content={<CustomTooltip unit="bpm" color="#f43f5e" />} cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                                    <Area
                                                        type="monotoneX"
                                                        dataKey="heart_rate_bpm"
                                                        stroke="#f43f5e"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorHr)"
                                                        animationDuration={1500}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <Activity className="h-10 w-10 text-slate-200" />
                                            <p>لا تتوفر بيانات نبض في هذا الوقت</p>
                                        </div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Steps Chart */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-0 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 bg-white">
                                <CardHeader className="border-b border-slate-100/50 pb-6 mb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                                        <div className="p-2 bg-emerald-100 text-emerald-500 rounded-lg">
                                            <Footprints className="h-5 w-5" />
                                        </div>
                                        النشاط الحركي - الخطوات (24 ساعة)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full" dir="ltr">
                                        {metricsData?.charts?.steps && metricsData.charts.steps.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={metricsData.charts.steps} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tickFormatter={(val) => new Date(val).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                        stroke="#cbd5e1"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        dy={10}
                                                    />
                                                    <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip content={<CustomTooltip unit="خطوة" color="#10b981" />} cursor={{ fill: '#f8fafc' }} />
                                                    <Bar
                                                        dataKey="steps"
                                                        fill="url(#colorSteps)"
                                                        radius={[6, 6, 0, 0]}
                                                        animationDuration={1500}
                                                        maxBarSize={50}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <Footprints className="h-10 w-10 text-slate-200" />
                                            <p>لا تتوفر بيانات حركية</p>
                                        </div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                    </motion.div>
                )}
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
