import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { useAiCenterPrefill, usePredictPreeclampsia } from "@/hooks/useAiCenter";
import { PreeclampsiaInput } from "@/types/aiCenter";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { HeartPulse, AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck, Info, Activity, ActivitySquare, Droplet, FlaskConical, Scale, CalendarDays, BadgePlus, Baby, Clock, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

// ─── No Active Pregnancy Guard ───────────────────────────────────────────────
const NoPregnancyGuard: React.FC<{ onNavigate: () => void, onSkip: () => void }> = ({ onNavigate, onSkip }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-10 shadow-xl border border-amber-100 text-center space-y-6"
    >
        <div className="flex justify-center">
            <div className="p-5 bg-amber-50 rounded-full border-2 border-amber-200">
                <Baby className="w-14 h-14 text-amber-500" />
            </div>
        </div>
        <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">مطلوب حمل نشط أولاً</h2>
            <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                نماذج الذكاء الاصطناعي مرتبطة بحملك الحالي لضمان دقة النتائج.
                يرجى تسجيل حملك النشط في تتبع الحمل أولاً ثم العودة هنا.
            </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button onClick={onNavigate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 py-3 shadow-lg">
                الانتقال لتسجيل الحمل
            </button>
            <button onClick={onSkip} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl px-8 py-3">
                تخطي ومتابعة الفحص
            </button>
            <button onClick={() => window.history.back()} className="border border-slate-200 font-bold rounded-xl px-8 py-3 hover:bg-slate-50">
                العودة للخلف
            </button>
        </div>
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5" />
            بعد تسجيل الحمل، ارجعي لهذه الصفحة وستجدين البيانات تعبأ تلقائياً
        </p>
    </motion.div>
);

export const PreeclampsiaScreeningPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [skipGuard, setSkipGuard] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const { data: prefillData, isLoading: isLoadingPrefill } = useAiCenterPrefill('preeclampsia', isAuthenticated);
    const predictMutation = usePredictPreeclampsia();
    const [result, setResult] = useState<any>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PreeclampsiaInput>({
        defaultValues: {
            gravida: 0,
            parity: 0,
            gest_age: 0,
            age: 0,
            bmi: 0,
            diabetes: 0,
            htn: 0,
            sysbp: 0,
            diabp: 0,
            hb: 0,
            proteinuria: 0,
        }
    });

    useEffect(() => {
        if (prefillData?.fields) {
            reset(prefillData.fields);
        }
    }, [prefillData, reset]);

    const onSubmit = (data: PreeclampsiaInput) => {
        predictMutation.mutate(data, {
            onSuccess: (res) => {
                if (!res || !res.risk_level) {
                    toast({
                        title: "إشعار",
                        description: "عذراً، هذا النموذج موقوف مؤقتاً.",
                        variant: "destructive",
                    });
                    return;
                }
                setResult(res);
                toast({
                    title: "تم التحليل بنجاح",
                    description: "ظهرت نتيجة تقييم مخاطر تسمم الحمل.",
                });
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || "حدث خطأ أثناء الاتصال بالخدمة. حاولي مرة أخرى.";
                toast({
                    title: "خطأ في التحليل",
                    description: msg,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <PublicHeader />

            <main className="flex-grow pt-24 pb-12">
                <div className="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto font-primary space-y-8">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="mb-4 text-right">
                                <BackButton />
                            </div>
                            <div className="mb-6">
                                <Breadcrumbs items={[
                                    { label: 'الذكاء الاصطناعي', path: '/patient/ai-center' },
                                    { label: 'فحص تسمم الحمل' }
                                ]} />
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                                    <HeartPulse className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-black text-foreground">فحص مبكر لتسمم الحمل (Preeclampsia)</h1>
                            </div>
                            <p className="text-muted-foreground text-base max-w-xl">
                                تقييم دقيق يعتمد على قراءات ضغط الدم، التاريخ الطبي، ومستوى البروتين لتقدير مخاطر تسمم الحمل.
                            </p>
                        </div>
                    </div>

                    {/* No Active Pregnancy Guard */}
                    {!skipGuard && !isLoadingPrefill && prefillData && prefillData.pregnancy_id === null && !result && (
                        <NoPregnancyGuard
                            onNavigate={() => navigate('/trackers/pregnancy')}
                            onSkip={() => setSkipGuard(true)}
                        />
                    )}

                    {!result && (isLoadingPrefill || (prefillData?.pregnancy_id !== null) || skipGuard) ? (
                        <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100">
                            {isLoadingPrefill ? (
                                <div className="space-y-6">
                                    <Skeleton className="h-8 w-1/3" />
                                    <Skeleton className="h-20 w-full" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                </div>
                            ) : (
                                <form noValidate onSubmit={handleSubmit(onSubmit, () => {
                                    toast({
                                        title: "بيانات الإدخال غير مكتملة",
                                        description: "يوجد حقول ناقصة أو غير صحيحة. يرجى التمرير لأعلى ومراجعة الحقول المحددة باللون الأحمر.",
                                        variant: "destructive"
                                    });
                                })} className="space-y-10">

                                    {Object.keys(errors).length > 0 && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
                                            <AlertTriangle className="w-5 h-5 shrink-0" />
                                            <p className="font-bold text-sm">هناك بعض الحقول غير مكتملة. يرجى مراجعتها وتصحيحها.</p>
                                        </div>
                                    )}

                                    {prefillData?.auto_filled && prefillData.auto_filled.length > 0 && (
                                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800">
                                            <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600" />
                                            <div>
                                                <p className="text-sm font-bold">تعبئة ذكية</p>
                                                <p className="text-xs text-indigo-700/80 leading-relaxed mt-1">
                                                    تم جلب {prefillData.auto_filled.length} بيانات من بروفايلك وسجلات ممرضتك الخاصة.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                                        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> القياسات السريرية (العلامات الحيوية)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <Activity className="w-4 h-4 text-indigo-500" /> ضغط الدم الانقباضي (Systolic BP)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 120 (بين 80 و 250)" {...register("sysbp", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 80, message: "الحد الأدنى 80" }, max: { value: 250, message: "الحد الأقصى 250" } })} className={`w-full bg-slate-50 border ${errors.sysbp ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.sysbp && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.sysbp.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <ActivitySquare className="w-4 h-4 text-indigo-500" /> ضغط الدم الانبساطي (Diastolic BP)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 80 (بين 40 و 160)" {...register("diabp", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 40, message: "الحد الأدنى 40" }, max: { value: 160, message: "الحد الأقصى 160" } })} className={`w-full bg-slate-50 border ${errors.diabp ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.diabp && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.diabp.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <Droplet className="w-4 h-4 text-indigo-500" /> مستوى الهيموجلوبين (Hb)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 12.5 (بين 5 و 20)" {...register("hb", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 5, message: "الحد الأدنى 5" }, max: { value: 20, message: "الحد الأقصى 20" } })} className={`w-full bg-slate-50 border ${errors.hb ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.hb && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.hb.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <FlaskConical className="w-4 h-4 text-indigo-500" /> بروتين في البول (Proteinuria)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("proteinuria", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow cursor-pointer">
                                                        <option value="0">سلبي (Negative / Trace)</option>
                                                        <option value="1">إيجابي (Positive)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <Scale className="w-4 h-4 text-indigo-500" /> مؤشر كتلة الجسم (BMI)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 24 (بين 10 و 60)" {...register("bmi", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 10, message: "الحد الأدنى 10" }, max: { value: 60, message: "الحد الأقصى 60" } })} className={`w-full bg-slate-50 border ${errors.bmi ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.bmi && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.bmi.message}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                                        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> تاريخ الحمل والمريضة
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <CalendarDays className="w-4 h-4 text-indigo-500" /> العمر
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" placeholder="مثال: 30 (بين 15 و 60)" {...register("age", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 15, message: "الحد الأدنى 15" }, max: { value: 60, message: "الحد الأقصى 60" } })} className={`w-full bg-slate-50 border ${errors.age ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.age && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.age.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <BadgePlus className="w-4 h-4 text-indigo-500" /> عدد أحمال سابقة (Gravida)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" placeholder="مثال: 2 (الحد الأقصى 20)" {...register("gravida", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 0, message: "لا يمكن أن يكون سالب" }, max: { value: 20, message: "الحد الأقصى 20" } })} className={`w-full bg-slate-50 border ${errors.gravida ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.gravida && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.gravida.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <Baby className="w-4 h-4 text-indigo-500" /> عدد ولادات حية (Parity)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" placeholder="مثال: 1 (الحد الأقصى 15)" {...register("parity", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 0, message: "لا يمكن أن يكون سالب" }, max: { value: 15, message: "الحد الأقصى 15" } })} className={`w-full bg-slate-50 border ${errors.parity ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.parity && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.parity.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <Clock className="w-4 h-4 text-indigo-500" /> عمر الحمل الحالي
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 32 (الحد الأقصى 42)" {...register("gest_age", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 0, message: "الحد الأدنى 0" }, max: { value: 42, message: "الحد الأقصى 42 أسبوع" } })} className={`w-full bg-slate-50 border ${errors.gest_age ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'} px-4 py-3 rounded-xl focus:ring-2 outline-none transition-shadow`} required />
                                                    {errors.gest_age && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.gest_age.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <HeartPulse className="w-4 h-4 text-indigo-500" /> ضغط مزمن (HTN)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("htn", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
                                                    <ShieldAlert className="w-4 h-4 text-indigo-500" /> سكري مزمن (Diabetes)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("diabetes", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <Button
                                        type="submit"
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-indigo-200"
                                        disabled={predictMutation.isPending}
                                    >
                                        {predictMutation.isPending ? "جاري الفحص السريري الذكي..." : "تقييم مخاطر تسمم الحمل"}
                                    </Button>

                                    <div className="flex items-center gap-2 justify-center text-slate-400 mt-4">
                                        <Info className="w-4 h-4 shrink-0" />
                                        <span className="text-xs">تنبيه: التقييم يُستخدم كأداة للفرز المبكر ولا يحل محل التشخيص الطبي.</span>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : result ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100"
                        >
                            <div className={`p-8 text-white ${result.risk_level.includes('high') ? 'bg-gradient-to-r from-red-600 to-rose-500' :
                                result.risk_level.includes('moderate') ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                    'bg-gradient-to-r from-emerald-500 to-teal-400'
                                }`}>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                                            {result.risk_level.includes('high') ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
                                        </div>
                                        <div>
                                            <p className="text-white/80 font-bold uppercase tracking-wider text-sm mb-1">خطورة تسمم الحمل</p>
                                            <h2 className="text-3xl font-black">{result.risk_badge || result.risk_level}</h2>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                                        <p className="text-white/80 text-sm font-bold mb-1">نسبة الاحتساب</p>
                                        <p className="text-3xl font-black font-sans tracking-tight">{(result.risk_score * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {result.consultation_suggested && (
                                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-start gap-4">
                                        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-red-800 font-bold mb-1">تحذير طبي عاجل</h4>
                                            <p className="text-red-700/80 text-sm leading-relaxed mb-3">
                                                تشير البيانات إلى ارتفاع ملحوظ في مؤشرات الخطر. يجب التوجه لطبيبك فوراً أو لأقرب طوارئ لمتابعة ضغط الدم ومستويات البروتين.
                                                لقد تم التنبيه على النظام.
                                            </p>
                                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-100 font-bold" onClick={() => navigate('/patient/consultations/book')}>
                                                حجز استشارة عاجلة
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                                    <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500 font-bold hover:text-slate-800">
                                        إعادة الفحص
                                    </Button>
                                    <Button onClick={() => navigate('/patient/ai-center')} className="bg-slate-900 text-white rounded-xl font-bold">
                                        إنهاء ومغادرة <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default PreeclampsiaScreeningPage;
