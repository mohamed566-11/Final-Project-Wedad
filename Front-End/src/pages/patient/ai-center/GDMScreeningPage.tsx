import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { useAiCenterPrefill, usePredictGdm } from "@/hooks/useAiCenter";
import { GdmInput } from "@/types/aiCenter";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Info, ShieldCheck, CalendarDays, Ruler, Scale, Baby, Users, AlertCircle, Coffee, ShieldAlert, HeartPulse } from "lucide-react";
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
            <Button
                onClick={onNavigate}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl px-8 py-3 shadow-lg shadow-rose-200"
            >
                <Baby className="w-4 h-4 ml-2" />
                الانتقال لتسجيل الحمل
            </Button>
            <Button
                variant="outline"
                onClick={onSkip}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl px-8"
            >
                تخطي ومتابعة الفحص
            </Button>
            <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="font-bold rounded-xl px-8"
            >
                العودة للخلف
            </Button>
        </div>
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5" />
            بعد تسجيل الحمل، ارجعي لهذه الصفحة وستجدين البيانات تعبأ تلقائياً
        </p>
    </motion.div>
);

export const GDMScreeningPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [skipGuard, setSkipGuard] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const { data: prefillData, isLoading: isLoadingPrefill } = useAiCenterPrefill('gdm', isAuthenticated);
    const predictMutation = usePredictGdm();

    const [result, setResult] = useState<any>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<GdmInput>({
        defaultValues: {
            age: 0,
            height_cm: 0,
            weight_kg: 0,
            no_of_pregnancy: 0,
            family_history: 0,
            pcos: 0,
            sedentary_lifestyle: 0,
            prediabetes: 0,
            unexplained_prenatal_loss: 0,
            large_child_or_birth_default: 0,
            gestation_in_previous_pregnancy: 0,
        }
    });

    // Populate prefill data
    useEffect(() => {
        if (prefillData?.fields) {
            reset(prefillData.fields);
        }
    }, [prefillData, reset]);

    const onSubmit = (data: GdmInput) => {
        predictMutation.mutate(data, {
            onSuccess: (res) => {
                if (!res || !res.risk_level) {
                    toast({
                        title: "خطأ في البيانات",
                        description: "لم تُرجع الخدمة نتيجة صالحة. تأكدي من تسجيل حمل نشط أولاً.",
                        variant: "destructive",
                    });
                    return;
                }
                setResult(res);
                toast({
                    title: "تم التحليل بنجاح",
                    description: "ظهرت نتيجة تقييم مخاطر سكري الحمل.",
                    variant: "default",
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
                                    { label: 'فحص سكري الحمل' }
                                ]} />
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-gradient-to-br from-rose-500 to-fuchsia-600 rounded-2xl text-white shadow-lg shadow-rose-200">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-black text-foreground">فحص مبكر لسكري الحمل</h1>
                            </div>
                            <p className="text-muted-foreground text-base max-w-xl">
                                تقييم احتمالية الإصابة بسكري الحمل باستخدام 11 مؤشراً حيوياً وتاريخك الطبي، بدون تحاليل مخبرية.
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
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                </div>
                            ) : (
                                <form noValidate onSubmit={handleSubmit(onSubmit, (errs) => {
                                    toast({
                                        title: "بيانات ناقصة أو غير صحيحة",
                                        description: "يرجى مراجعة الحقول وتمييز الأخطاء باللون الأحمر.",
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
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 text-emerald-800">
                                            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold">تم تعبئة بعض الحقول تلقائياً</p>
                                                <p className="text-xs text-emerald-700 leading-relaxed">
                                                    تم جلب {prefillData.auto_filled.length} حقول من ملفك الطبي لضمان أعلى مستويات الدقة. يمكنك تعديلها إذا دعت الحاجة.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                                        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> القياسات الحيوية الأساسية
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <CalendarDays className="w-4 h-4 text-rose-500" /> العمر (سنوات)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" placeholder="مثال: 25 (بين 15 و 55)" {...register("age", { valueAsNumber: true, required: "العمر مطلوب", min: { value: 15, message: "الحد الأدنى 15" }, max: { value: 55, message: "الحد الأقصى 55" } })} className={`w-full bg-slate-50 border ${errors.age ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-rose-500 focus:border-rose-500'} px-4 py-3 rounded-xl focus:ring-2 transition-all font-sans outline-none`} />
                                                    {errors.age && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.age.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <Ruler className="w-4 h-4 text-rose-500" /> الطول (سم)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 165 (بين 130 و 210)" {...register("height_cm", { valueAsNumber: true, required: "الطول مطلوب", min: { value: 130, message: "الحد الأدنى 130 سم" }, max: { value: 210, message: "الحد الأقصى 210 سم" } })} className={`w-full bg-slate-50 border ${errors.height_cm ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-rose-500'} px-4 py-3 rounded-xl focus:ring-2 transition-all font-sans outline-none`} />
                                                    {errors.height_cm && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.height_cm.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <Scale className="w-4 h-4 text-rose-500" /> الوزن (كجم)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 70 (بين 35 و 200)" {...register("weight_kg", { valueAsNumber: true, required: "الوزن مطلوب", min: { value: 35, message: "الحد الأدنى 35 كجم" }, max: { value: 200, message: "الحد الأقصى 200 كجم" } })} className={`w-full bg-slate-50 border ${errors.weight_kg ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-rose-500'} px-4 py-3 rounded-xl focus:ring-2 transition-all font-sans outline-none`} />
                                                    {errors.weight_kg && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.weight_kg.message}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                                        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> السجل الطبي
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <Baby className="w-4 h-4 text-rose-500" /> عدد الأحمال السابقة
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" placeholder="مثال: 1 (الحد الأقصى 15)" {...register("no_of_pregnancy", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 0, message: "لا يمكن أن يكون بالسالب" }, max: { value: 15, message: "الحد الأقصى 15" } })} className={`w-full bg-slate-50 border ${errors.no_of_pregnancy ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-rose-500'} px-4 py-3 rounded-xl focus:ring-2 transition-all font-sans outline-none`} />
                                                    {errors.no_of_pregnancy && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.no_of_pregnancy.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <Users className="w-4 h-4 text-rose-500" /> تاريخ عائلي للسكري
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("family_history", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <AlertCircle className="w-4 h-4 text-rose-500" /> تكيس المبايض (PCOS)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("pcos", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <Activity className="w-4 h-4 text-rose-500" /> مرحلة ما قبل السكري (Prediabetes)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("prediabetes", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                                        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> تفاصيل الحمل السابق / نمط الحياة
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <Coffee className="w-4 h-4 text-rose-500" /> نمط حياة خامل (Sedentary)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("sedentary_lifestyle", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <HeartPulse className="w-4 h-4 text-rose-500" /> فقدان حمل غير مبرر سابقاً
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("unexplained_prenatal_loss", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <ShieldAlert className="w-4 h-4 text-rose-500" /> ولادة طفل كبير/عيوب خلقية سابقاً
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("large_child_or_birth_default", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-rose-600">
                                                    <AlertTriangle className="w-4 h-4 text-rose-500" /> سكري حمل في حمل سابق
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("gestation_in_previous_pregnancy", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <Button
                                        type="submit"
                                        className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-rose-200"
                                        disabled={predictMutation.isPending}
                                    >
                                        {predictMutation.isPending ? "جاري تقييم سكري الحمل..." : "بدء تحليل المخاطر"}
                                    </Button>

                                    <div className="flex items-center gap-2 justify-center text-slate-400 mt-4">
                                        <Info className="w-4 h-4" />
                                        <span className="text-xs">هذا التحليل لا يغني عن الاستشارة الطبية الدقيقة وتحليل OGTT.</span>
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
                            {/* Result Header */}
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
                                            <p className="text-white/80 font-bold uppercase tracking-wider text-sm mb-1">نتيجة التقييم</p>
                                            <h2 className="text-3xl font-black">{result.risk_badge || result.risk_level}</h2>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                                        <p className="text-white/80 text-sm font-bold mb-1">الاحتمالية</p>
                                        <p className="text-3xl font-black font-sans tracking-tight">{(result.risk_score * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Result Body */}
                            <div className="p-8 space-y-8">
                                {result.api_result?.recommendation_ar && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-slate-800">التوصية الطبية المقترحة:</h3>
                                        <div className="p-5 bg-slate-50 text-slate-700 leading-relaxed rounded-xl border border-slate-100 text-sm font-medium">
                                            {result.api_result.recommendation_ar}
                                        </div>
                                    </div>
                                )}

                                {result.consultation_suggested && (
                                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-start gap-4">
                                        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-red-800 font-bold mb-1">يُنصح بالتواصل مع الطبيب</h4>
                                            <p className="text-red-700/80 text-sm leading-relaxed mb-3">
                                                بناءً على هذا التقييم، يُفضل مراجعة طبيبك المتابع في أقرب وقت لإجراء فحص OGTT والاطمئنان.
                                                لقد قمنا بإرسال إشعار استباقي لطبيبك بهذه النتيجة.
                                            </p>
                                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-100 font-bold" onClick={() => navigate('/patient/consultations/book')}>
                                                حجز استشارة الآن
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                                    <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500 font-bold hover:text-slate-800">
                                        إعادة الفحص
                                    </Button>
                                    <Button onClick={() => navigate('/patient/ai-center')} className="bg-slate-900 text-white rounded-xl font-bold">
                                        العودة للمركز <ChevronRight className="w-4 h-4 ml-2" />
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

export default GDMScreeningPage;
