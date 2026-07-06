import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { useAiCenterPrefill, usePredictPreterm } from "@/hooks/useAiCenter";
import { useOcrPrefillForModel } from "@/hooks/useAiCenter";
import { PretermInput } from "@/types/aiCenter";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Baby, AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck, Info, Droplet, HeartPulse, Activity, ActivitySquare, Scale, CalendarDays, History, AlertCircle, BrainCircuit } from "lucide-react";
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
            <button onClick={onNavigate} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-8 py-3 shadow-lg shadow-orange-200">
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

export const PretermScreeningPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [skipGuard, setSkipGuard] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const { data: prefillData, isLoading: isLoadingPrefill } = useAiCenterPrefill('preterm', isAuthenticated);
    // ✅ OCR Auto-fill: آخر نتيجة تحليل تحتوي على سكر الدم (bs)
    const { data: ocrData, isLoading: isLoadingOcr } = useOcrPrefillForModel('preterm', isAuthenticated);
    // ✅ تتبع الحقول المُعبَّأة من OCR لإظهار بادج مميز
    const [ocrFilledFields, setOcrFilledFields] = useState<string[]>([]);
    const predictMutation = usePredictPreterm();
    const [result, setResult] = useState<any>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PretermInput>({
        defaultValues: {
            age: 0,
            systolic_bp: 0,
            diastolic: 0,
            bs: 0,
            bmi: 0,
            previous_complications: 0,
            preexisting_diabetes: 0,
            gestational_diabetes: 0,
            mental_health: 0,
            heart_rate: 0,
        }
    });

    // Effect 1: تعبئة بيانات البروفيل + IoT heart rate
    useEffect(() => {
        if (prefillData?.fields) {
            reset(prefillData.fields);
        }
    }, [prefillData, reset]);

    // Effect 2: تعبئة حقل سكر الدم (bs) من OCR تلقائياً
    useEffect(() => {
        if (!ocrData?.has_data || !ocrData.fields) return;
        const filled: string[] = [];
        if (ocrData.fields.bs?.value) {
            setValue('bs', ocrData.fields.bs.value, { shouldDirty: false });
            filled.push('bs');
        }
        setOcrFilledFields(filled);
    }, [ocrData, setValue]);

    const onSubmit = (data: PretermInput) => {
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
                    description: "ظهرت نتيجة تقييم مخاطر الولادة المبكرة.",
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
                                    { label: 'فحص الولادة المبكرة' }
                                ]} />
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-orange-200">
                                    <Baby className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-black text-foreground">فحص مبكر لمخاطر الولادة المبكرة</h1>
                            </div>
                            <p className="text-muted-foreground text-base max-w-xl">
                                مسح وقائي لتوقع ومعرفة احتمالية الولادة قبل الأسبوع الـ 37 بناءً على مقاييس صحتك العامة والتاريخ الطبي.
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

                    {!result && (isLoadingPrefill || isLoadingOcr || (prefillData?.pregnancy_id !== null) || skipGuard) ? (
                        <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100">
                            {isLoadingPrefill || isLoadingOcr ? (
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
                                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-orange-800">
                                            <ShieldCheck className="w-5 h-5 shrink-0 text-orange-600" />
                                            <div>
                                                <p className="text-sm font-bold">تعبئة تلقائية من ملفك الصحي</p>
                                                <p className="text-xs text-orange-700/80 leading-relaxed mt-1">
                                                    قمنا بتجهيز {prefillData.auto_filled.length} مدخلات من سجلك لتوفير وقتك.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ✅ Banner: بيانات OCR */}
                                    {ocrData?.has_data && ocrFilledFields.length > 0 && (
                                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex gap-3 text-purple-800">
                                            <Activity className="w-5 h-5 shrink-0 text-purple-600" />
                                            <div>
                                                <p className="text-sm font-bold">تعبئة من تحليلك الأخير 📄</p>
                                                <p className="text-xs text-purple-700/80 leading-relaxed mt-1">
                                                    تم جلب قيمة <strong>سكر الدم (BS)</strong> من تحليلك بتاريخ {ocrData.lab_test_date}. يمكنك تعديلها.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                                        className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-100">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> العلامات الحيوية للسكر والضغط
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <Droplet className="w-4 h-4 text-orange-500" /> سكر الدم (BS)
                                                    {/* ✅ Badge: قيمة من OCR */}
                                                    {ocrFilledFields.includes('bs') && (
                                                        <span className="mr-auto flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                                                            📄 من التحليل — {ocrData?.fields?.bs?.value} {ocrData?.fields?.bs?.unit}
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 90 (بين 3 و 400)" {...register("bs", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 3, message: "الحد الأدنى 3" }, max: { value: 400, message: "الحد الأقصى 400" } })} className={`w-full bg-slate-50 border ${errors.bs ? 'border-red-400 focus:ring-red-400' : ocrFilledFields.includes('bs') ? 'border-purple-300 bg-purple-50/30 focus:ring-purple-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} required />
                                                    {errors.bs && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.bs.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <HeartPulse className="w-4 h-4 text-orange-500" /> نبض القلب (HR)
                                                    {/* ✅ Badge: قيمة من Google Fit */}
                                                    {prefillData?.auto_filled?.includes('heart_rate') && (
                                                        <span className="mr-auto flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                            💓 من Google Fit
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 80 (بين 40 و 250)" {...register("heart_rate", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 40, message: "الحد الأدنى 40" }, max: { value: 250, message: "الحد الأقصى 250" } })} className={`w-full bg-slate-50 border ${errors.heart_rate ? 'border-red-400 focus:ring-red-400' : prefillData?.auto_filled?.includes('heart_rate') ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} required />
                                                    {errors.heart_rate && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.heart_rate.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <Activity className="w-4 h-4 text-orange-500" /> الانقباضي (Sys BP)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 120 (بين 80 و 200)" {...register("systolic_bp", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 80, message: "الحد الأدنى 80" }, max: { value: 200, message: "الحد الأقصى 200" } })} className={`w-full bg-slate-50 border ${errors.systolic_bp ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} required />
                                                    {errors.systolic_bp && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.systolic_bp.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <ActivitySquare className="w-4 h-4 text-orange-500" /> الانبساطي (Dia BP)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 80 (بين 50 و 130)" {...register("diastolic", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 50, message: "الحد الأدنى 50" }, max: { value: 130, message: "الحد الأقصى 130" } })} className={`w-full bg-slate-50 border ${errors.diastolic ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} required />
                                                    {errors.diastolic && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.diastolic.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <Scale className="w-4 h-4 text-orange-500" /> مؤشر الكتلة (BMI)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" step="0.1" placeholder="مثال: 22 (بين 15 و 50)" {...register("bmi", { valueAsNumber: true, required: "الحقل مطلوب", min: { value: 15, message: "الحد الأدنى 15" }, max: { value: 50, message: "الحد الأقصى 50" } })} className={`w-full bg-slate-50 border ${errors.bmi ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} required />
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
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> الأمراض السابقة والمزمنة
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <CalendarDays className="w-4 h-4 text-orange-500" /> العمر (سنوات)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <input type="number" placeholder="مثال: 30 (بين 15 و 60)" {...register("age", { valueAsNumber: true, required: "العمر مطلوب", min: { value: 15, message: "الحد الأدنى 15" }, max: { value: 60, message: "الحد الأقصى 60" } })} className={`w-full bg-slate-50 border ${errors.age ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-orange-500'} px-4 py-3 rounded-xl focus:ring-2 transition-shadow outline-none`} required />
                                                    {errors.age && <p className="text-xs text-red-500 font-bold mt-1.5 absolute">{errors.age.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <History className="w-4 h-4 text-orange-500" /> مضاعفات في حمل سابق
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("previous_complications", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 transition-shadow outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <AlertCircle className="w-4 h-4 text-orange-500" /> سكري قبل الحمل (Preexisting)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("preexisting_diabetes", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 transition-shadow outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <BrainCircuit className="w-4 h-4 text-orange-500" /> سكري حمل (Gestational)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("gestational_diabetes", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 transition-shadow outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
                                                    <BrainCircuit className="w-4 h-4 text-orange-500" /> صحة نفسية ملحوظة (اكتئاب/قلق)
                                                </label>
                                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                                    <select {...register("mental_health", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 transition-shadow outline-none cursor-pointer">
                                                        <option value="0">لا</option>
                                                        <option value="1">نعم (ملحوظ)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <Button
                                        type="submit"
                                        className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-orange-200"
                                        disabled={predictMutation.isPending}
                                    >
                                        {predictMutation.isPending ? "جاري تقييم الولادة المبكرة..." : "فحص مخاطر الولادة المبكرة"}
                                    </Button>

                                    <div className="flex items-center gap-2 justify-center text-slate-400 mt-4">
                                        <Info className="w-4 h-4 shrink-0" />
                                        <span className="text-xs">الموديل لا يستخدم الفحوصات المهبلية في هذه المرحلة من المسح.</span>
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
                                            <p className="text-white/80 font-bold uppercase tracking-wider text-sm mb-1">الولادة المبكرة</p>
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
                                {result.api_result?.note && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-slate-800">ملاحظات التقييم:</h3>
                                        <div className="p-5 bg-slate-50 text-slate-700 leading-relaxed rounded-xl border border-slate-100 text-sm font-medium">
                                            {result.api_result.note}
                                        </div>
                                    </div>
                                )}

                                {result.consultation_suggested && (
                                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-start gap-4">
                                        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-red-800 font-bold mb-1">يُنصح بالمتابعة الطبية المباشرة</h4>
                                            <p className="text-red-700/80 text-sm leading-relaxed mb-3">
                                                المعطيات تشير إلى ضرورة عمل فحوصات أدق عند الطبيب المتابع، ومراقبة أي علامات لانقباضات الرحم وتجنب الإجهاد.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                                    <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500 font-bold hover:text-slate-800">
                                        إعادة الفحص
                                    </Button>
                                    <Button onClick={() => navigate('/patient/ai-center')} className="bg-slate-900 text-white rounded-xl font-bold">
                                        العودة <ChevronRight className="w-4 h-4 ml-2" />
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

export default PretermScreeningPage;
