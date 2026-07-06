import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLabTests } from '../../../hooks/useLabTests';
import type { LabTest } from '../../../types/labTest';
import { Beaker, FileText, User as UserIcon, Building2, Fingerprint, ArrowRight, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import PublicHeader from '@/components/layout/PublicHeader';
/* --- Animation variants --- */
const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function LabTestResultDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { labTests, isLoading } = useLabTests();

    const [test, setTest] = useState<LabTest | null>(location.state?.test || null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        // Fallback if accessed via direct URL without location state
        if (!test && labTests && labTests.length > 0 && id) {
            const found = labTests.find((t) => t.id === Number(id));
            if (found) setTest(found);
        }
    }, [id, labTests, test]);

    if (isLoading && !test) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isLoading && !test) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f6fa] p-4 text-center">
                <FileText className="w-20 h-20 text-slate-300 mb-6" />
                <h2 className="text-2xl font-black text-slate-800 mb-2">التقرير غير موجود</h2>
                <p className="text-slate-500 mb-6">يبدو أن تقرير التحليل الذي تبحث عنه قد تم حذفه أو أن الرابط غير صحيح.</p>
                <button
                    onClick={() => navigate('/patient/medical-files/lab-tests')}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-700 transition"
                >
                    العودة لسجل التحاليل
                </button>
            </div>
        );
    }

    const results = test?.results;
    const metrics = results?.tests || [];

    return (
        <div dir="rtl" className="min-h-screen flex flex-col bg-[#f5f6fa] pb-20">
            <PublicHeader />

            <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full mt-16 font-sans">

                {/* Navigation & Header */}
                <motion.div initial="hidden" animate="show" variants={fadeInUp} className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/patient/medical-files/lab-tests')}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-primary-50 hover:text-primary transition-all shadow-sm group"
                        >
                            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                نتيجة التحليل المدعومة بالذكاء الاصطناعي
                                <Sparkles className="w-6 h-6 text-amber-500" />
                            </h1>
                            <p className="text-slate-500 text-sm mt-1 font-medium">تم استخراج البيانات بذكاء لتحليل حالتك بدقة</p>
                        </div>
                    </div>
                </motion.div>

                {/* Global Summary Cards */}
                {results && (results.patient_info?.name || results.lab_info?.lab_name) && (
                    <motion.div initial="hidden" animate="show" variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* Patient Info Card */}
                        {results.patient_info?.name && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <UserIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">اسم المريضة في التقرير</p>
                                    <h3 className="text-lg font-black text-slate-800">{results.patient_info.name}</h3>
                                </div>
                            </div>
                        )}

                        {/* Lab Info Card */}
                        {results.lab_info?.lab_name && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                                    <Building2 className="w-6 h-6 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">جهة التحليل (المعمل)</p>
                                    <h3 className="text-lg font-black text-slate-800">{results.lab_info.lab_name}</h3>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Extracted Metrics Grid */}
                <div className="mb-4 flex items-center gap-2 px-2">
                    <Beaker className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-slate-800">مؤشرات التحليل</h2>
                </div>

                {metrics.length > 0 ? (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 ml:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                        {metrics.map((metric, idx) => {
                            return (
                                <motion.div
                                    key={idx}
                                    variants={fadeInUp}
                                    className="relative bg-white p-6 rounded-3xl border border-slate-200 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400 group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none -mr-16 -mt-16"></div>

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold mb-3 uppercase tracking-wide text-slate-500 line-clamp-2 relative z-10" title={metric.test_name}>
                                        {metric.test_name}
                                    </h3>

                                    <div className="flex items-baseline gap-1.5 mb-3 relative z-10">
                                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tighter break-all">
                                            {metric.value}
                                        </span>
                                        {metric.unit && (
                                            <span className="text-xs sm:text-sm font-bold text-slate-400">
                                                {metric.unit}
                                            </span>
                                        )}
                                    </div>

                                    {metric.reference_range && metric.reference_range.trim() !== '' && (
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                                            <span className="text-[11px] font-bold text-slate-400">النطاق المرجعي:</span>
                                            <span dir="ltr" className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md font-mono">
                                                {metric.reference_range}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                        <Fingerprint className="w-16 h-16 text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">لم يقرأ الذكاء الاصطناعي أية قيم واضحة</h3>
                        <p className="text-slate-500 max-w-sm">يبدو أن الصورة المرفوعة غير واضحة كفاية أو لا تحتوي على نتائج في هيئة نصوص قياسية. يرجى المحاولة بصورة ذات جودة أعلى.</p>
                    </div>
                )}

            </main>
        </div>
    );
}
