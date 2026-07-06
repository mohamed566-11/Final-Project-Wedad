import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAiCenterPrefill, usePredictScbu } from "@/hooks/useAiCenter";
import { ScbuInput } from "@/types/aiCenter";
import {
  Activity,
  ChevronLeft,
  ShieldCheck,
  Asterisk,
  UserCog,
  TestTube2,
} from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import BackButton from "@/components/common/BackButton";
import toast from "react-hot-toast";
import { Loader2, AlertTriangle, CheckCircle2, Baby, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── No Active Pregnancy Guard ───────────────────────────────────────────────
const NoPregnancyGuard: React.FC<{ onNavigate: () => void, onSkip: () => void }> = ({ onNavigate, onSkip }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-[2rem] p-10 shadow-xl border border-indigo-100 text-center space-y-6 mt-8"
  >
    <div className="flex justify-center">
      <div className="p-5 bg-indigo-50 rounded-full border-2 border-indigo-200">
        <Baby className="w-14 h-14 text-indigo-500" />
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
      <button onClick={onNavigate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 py-3 shadow-lg shadow-indigo-200">
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

const tabs = [
  { id: "vitals", label: "العلامات الحيوية والقراءات" },
  { id: "lab", label: "التحاليل والفحوصات (اختياري)" },
  { id: "complications", label: "المضاعفات والحالة الصحية" },
];

export const SCBUScreeningPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState("vitals");
  const [skipGuard, setSkipGuard] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const { data: prefillData, isLoading: isPrefillLoading } = useAiCenterPrefill(
    "scbu",
    isAuthenticated,
  );
  const { mutate: predictScbu, isPending } = usePredictScbu();

  const [formData, setFormData] = useState<ScbuInput>({});

  useEffect(() => {
    if (prefillData?.fields) {
      setFormData(prefillData.fields);
    }
  }, [prefillData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    let parsedValue: number | undefined = undefined;
    if (value !== "") {
      parsedValue = parseFloat(value);
    }

    if (name.startsWith("binary_")) {
      const flagName = name.replace("binary_", "");
      setFormData((prev) => ({
        ...prev,
        binary_flags: {
          ...prev.binary_flags,
          [flagName]: parsedValue || 0,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  const handleBinaryClick = (flagName: string) => {
    setFormData((prev) => {
      const currentFlags = prev.binary_flags || {};
      const currentValue = currentFlags[flagName] || 0;
      return {
        ...prev,
        binary_flags: {
          ...currentFlags,
          [flagName]: currentValue === 1 ? 0 : 1,
        },
      };
    });
  };

  const handleTabChange = (newTabId: string) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === newTabId);
    if (newIndex > currentIndex) {
      for (let i = 0; i <= currentIndex; i++) {
        if (!validateTab(tabs[i].id)) return;
      }
    }
    setActiveTab(newTabId);
  };

  const validateTab = (tabId: string): boolean => {
    if (tabId === "vitals") {
      if (formData.maternal_age && (formData.maternal_age < 10 || formData.maternal_age > 60)) { toast.error("عمر الأم يجب أن يكون بين 10 و 60 سنة"); return false; }
      if (formData.weeks_of_gestation && (formData.weeks_of_gestation < 20 || formData.weeks_of_gestation > 45)) { toast.error("أسابيع الحمل يجب أن تكون بين 20 و 45 أسبوعاً"); return false; }
      if (formData.gravida !== undefined && (formData.gravida < 0 || formData.gravida > 20)) { toast.error("عدد الأحمال السابقة يجب أن يكون بين 0 و 20"); return false; }
      if (formData.parity !== undefined && (formData.parity < 0 || formData.parity > 20)) { toast.error("عدد الولادات السابقة يجب أن يكون بين 0 و 20"); return false; }
      if (formData.no_of_previous_csections !== undefined && (formData.no_of_previous_csections < 0 || formData.no_of_previous_csections > 10)) { toast.error("عدد القيصريات السابقة يجب أن يكون بين 0 و 10"); return false; }
      if (formData.contraction_freq !== undefined && (formData.contraction_freq < 0 || formData.contraction_freq > 100)) { toast.error("تردد الانقباضات يجب أن يكون بين 0 و 100"); return false; }
      if (formData.bmi_at_booking && (formData.bmi_at_booking < 10 || formData.bmi_at_booking > 80)) { toast.error("كتلة الجسم يجب أن تكون بين 10 و 80"); return false; }
      if (formData.height && (formData.height < 100 || formData.height > 220)) { toast.error("الطول يجب أن يكون بين 100 و 220 سم"); return false; }
      if (formData.weight_measured && (formData.weight_measured < 30 || formData.weight_measured > 250)) { toast.error("الوزن يجب أن يكون بين 30 و 250 كجم"); return false; }
      if (formData.systolic_bp && (formData.systolic_bp < 50 || formData.systolic_bp > 250)) { toast.error("ضغط الدم الانقباضي يجب أن يكون بين 50 و 250"); return false; }
      if (formData.diastolic_bp && (formData.diastolic_bp < 30 || formData.diastolic_bp > 150)) { toast.error("ضغط الدم الانبساطي يجب أن يكون بين 30 و 150"); return false; }
    } else if (tabId === "lab") {
      if (formData.fasting_glucose && (formData.fasting_glucose < 0 || formData.fasting_glucose > 50)) { toast.error("تحليل سكر الصائم يجب أن يكون بين 0 و 50"); return false; }
      if (formData.hpg_2h && (formData.hpg_2h < 0 || formData.hpg_2h > 50)) { toast.error("تحليل السكر بعد ساعتين يجب أن يكون بين 0 و 50"); return false; }
      if (formData.vitamin_d && (formData.vitamin_d < 0 || formData.vitamin_d > 200)) { toast.error("مستوى فيتامين د يجب أن يكون بين 0 و 200"); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTab("vitals") || !validateTab("lab")) {
      return;
    }

    // Basic validation for vital fields to prevent dummy requests
    if (!formData.maternal_age || !formData.weeks_of_gestation) {
      toast.error("يرجى إدخال العمر وأسابيع الحمل كحد أدنى");
      return;
    }

    predictScbu(formData, {
      onSuccess: (data) => {
        setPredictionResult(data);
        setIsResultOpen(true);
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "حدث خطأ أثناء تقييم الحالة",
        );
      },
    });
  };

  // Render group header
  const GroupHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-100 pb-2 mb-6">
      <Icon className="w-5 h-5 text-indigo-500" />
      <h3 className="text-lg font-bold">{title}</h3>
    </div>
  );

  // Helpers to render 1/0 toggles beautifully
  const BinaryToggle = ({
    id,
    label,
    selected,
  }: {
    id: string;
    label: string;
    selected: boolean;
  }) => (
    <div
      onClick={() => handleBinaryClick(id)}
      className={`cursor-pointer group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 shadow-sm ${selected
        ? "border-indigo-600 bg-indigo-50/50 shadow-indigo-100/50"
        : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50"
        }`}
    >
      <span
        className={`font-semibold transition-colors ${selected ? "text-indigo-900" : "text-slate-700"}`}
      >
        {label}
      </span>
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${selected
          ? "bg-indigo-600 text-white shadow-md"
          : "bg-slate-100 text-transparent group-hover:bg-indigo-50"
          }`}
      >
        <ShieldCheck className="w-4 h-4" />
      </div>
    </div>
  );

  const renderVitalsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <GroupHeader title="البيانات الأساسية والحمل الحالي" icon={UserCog} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center">
              عمر الأم <Asterisk className="w-3 h-3 text-red-500 ml-1" />
            </label>
            <input
              type="number"
              name="maternal_age"
              value={formData.maternal_age || ""}
              onChange={handleChange}
              placeholder="مثال: 28 (بين 10 و 60)"
              min={10}
              max={60}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center">
              أسابيع الحمل <Asterisk className="w-3 h-3 text-red-500 ml-1" />
            </label>
            <input
              type="number"
              name="weeks_of_gestation"
              value={formData.weeks_of_gestation || ""}
              onChange={handleChange}
              placeholder="مثال: 32 (بين 20 و 45)"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              عدد أحمال سابقة (Gravida)
            </label>
            <input
              type="number"
              name="gravida"
              value={formData.gravida || ""}
              onChange={handleChange}
              placeholder="بين 0 و 20"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              عدد ولادات سابقة (Parity)
            </label>
            <input
              type="number"
              name="parity"
              value={formData.parity || ""}
              onChange={handleChange}
              placeholder="بين 0 و 20"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              عدد قيصريات سابقة
            </label>
            <input
              type="number"
              name="no_of_previous_csections"
              value={formData.no_of_previous_csections || ""}
              onChange={handleChange}
              placeholder="بين 0 و 10"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              تردد الانقباضات
            </label>
            <input
              type="number"
              name="contraction_freq"
              value={formData.contraction_freq || ""}
              onChange={handleChange}
              placeholder="بين 0 و 100"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <GroupHeader title="العلامات الحيوية والجسمانية" icon={Activity} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              كتلة الجسم (BMI)
            </label>
            <input
              type="number"
              step="0.1"
              name="bmi_at_booking"
              value={formData.bmi_at_booking || ""}
              onChange={handleChange}
              placeholder="مثال: 26.5 (بين 10 و 80)"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              الطول (سم)
            </label>
            <input
              type="number"
              name="height"
              value={formData.height || ""}
              onChange={handleChange}
              placeholder="مثال: 165 (بين 100 و 220)"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              الوزن (كجم)
            </label>
            <input
              type="number"
              name="weight_measured"
              value={formData.weight_measured || ""}
              onChange={handleChange}
              placeholder="مثال: 68 (بين 30 و 250)"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              ضغط الدم الانقباضي
            </label>
            <input
              type="number"
              name="systolic_bp"
              value={formData.systolic_bp || ""}
              onChange={handleChange}
              placeholder="مثال: 120 (بين 50 و 250)"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              ضغط الدم الانبساطي
            </label>
            <input
              type="number"
              name="diastolic_bp"
              value={formData.diastolic_bp || ""}
              onChange={handleChange}
              placeholder="مثال: 80 (بين 30 و 150)"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderLabTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <GroupHeader title="نتائج التحاليل المخبرية" icon={TestTube2} />
        <p className="text-slate-500 text-sm mb-6 pb-4 border-b border-slate-100 whitespace-pre-line">
          هذه القيم اختيارية ولكن إدخالها يزيد من دقة التقييم. إذا لم تقومي
          بإجراء هذه التحاليل يمكنك تركها فارغة.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              تحليل سكر الدم الصائم (mg/dL)
            </label>
            <input
              type="number"
              step="0.1"
              name="fasting_glucose"
              value={formData.fasting_glucose || ""}
              onChange={handleChange}
              placeholder="بين 0 و 50"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              تحليل السكر بعد ساعتين (2hPG)
            </label>
            <input
              type="number"
              step="0.1"
              name="hpg_2h"
              value={formData.hpg_2h || ""}
              onChange={handleChange}
              placeholder="بين 0 و 50"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              فيتامين د (Vitamin D)
            </label>
            <input
              type="number"
              step="0.1"
              name="vitamin_d"
              value={formData.vitamin_d || ""}
              onChange={handleChange}
              placeholder="بين 0 و 200"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderComplicationsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <p className="text-slate-500 text-sm px-2">
        الرجاء تحديد أي من المضاعفات أو الحالات الصحية التالية إذا كانت تنطبق
        عليكِ:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BinaryToggle
          id="gestational_diabetes"
          label="سكري الحمل"
          selected={!!formData.binary_flags?.gestational_diabetes}
        />
        <BinaryToggle
          id="preeclampsia"
          label="تسمم الحمل"
          selected={!!formData.binary_flags?.preeclampsia}
        />
        <BinaryToggle
          id="hypertension"
          label="ارتفاع ضغط الدم المزمن"
          selected={!!formData.binary_flags?.hypertension}
        />
        <BinaryToggle
          id="twins_or_more"
          label="حمل توأم أو أكثر"
          selected={!!formData.binary_flags?.twins_or_more}
        />
        <BinaryToggle
          id="previous_caesarean"
          label="ولادة قيصرية سابقة"
          selected={!!formData.binary_flags?.previous_caesarean}
        />
        <BinaryToggle
          id="fetal_compromise"
          label="خطر على الجنين (القلب أو غيره)"
          selected={!!formData.binary_flags?.fetal_compromise}
        />
        <BinaryToggle
          id="antepartum_haemorrhage"
          label="نزيف قبل الولادة"
          selected={!!formData.binary_flags?.antepartum_haemorrhage}
        />
        <BinaryToggle
          id="placenta_praevia"
          label="المشيمة المنزاحة"
          selected={!!formData.binary_flags?.placenta_praevia}
        />
        <BinaryToggle
          id="severe_iugr"
          label="قصور شديد في نمو الجنين (IUGR)"
          selected={!!formData.binary_flags?.severe_iugr}
        />
        <BinaryToggle
          id="chorioamnionitis"
          label="التهاب المشيمة والسلى"
          selected={!!formData.binary_flags?.chorioamnionitis}
        />
        <BinaryToggle
          id="diabetes_endocrine_disorder"
          label="أمراض غدد صماء أو سكري مزمن"
          selected={!!formData.binary_flags?.diabetes_endocrine_disorder}
        />
        <BinaryToggle
          id="thyroid_abnormal"
          label="اضطرابات في الغدة الدرقية"
          selected={!!formData.binary_flags?.thyroid_abnormal}
        />
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="h-16 px-10 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin ml-2" />
              جاري تحليل البيانات...
            </>
          ) : (
            "تقييم نسبة قبول الطفل في وحدة SCBU"
          )}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <PublicHeader />

      <main className="flex-grow pt-32 pb-12">
        <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 relative">
            <div className="mb-4">
              <BackButton label="عودة لمركز الذكاء الاصطناعي" />
            </div>
            <Breadcrumbs
              items={[
                { label: "الذكاء الاصطناعي", path: "/patient/ai-center" },
                { label: "تقييم SCBU" },
              ]}
            />

            <div className="mt-8 flex items-start gap-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-indigo-950 mb-2 font-primary tracking-tight">
                  تقييم مخاطر قبول الطفل لوحدة SCBU
                </h1>
                <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed">
                  يستخدم نموذج XGBoost لتحليل 46 مؤشراً صحياً للتنبؤ باحتمالية
                  احتياج طفلك للرعاية في وحدة العناية الخاصة (Special Care Baby
                  Unit) بعد الولادة.
                </p>
              </div>
            </div>
          </div>

          {isPrefillLoading ? (
            <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-indigo-900 font-bold text-lg mb-2">
                جاري استيراد بياناتكِ الطبية
              </p>
              <p className="text-slate-500 text-sm">
                يقوم النظام الأن بتحليل ملفك لجلب البيانات المسبقة
              </p>
            </div>
          ) : !skipGuard && prefillData && prefillData.pregnancy_id === null && !predictionResult ? (
            <NoPregnancyGuard onNavigate={() => navigate('/trackers/pregnancy')} onSkip={() => setSkipGuard(true)} />
          ) : predictionResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100"
            >
              {/* Result Header */}
              <div
                className={`p-8 text-white ${predictionResult.risk_level.includes("high")
                  ? "bg-gradient-to-r from-red-600 to-rose-500"
                  : predictionResult.risk_level.includes("moderate")
                    ? "bg-gradient-to-r from-amber-500 to-orange-400"
                    : "bg-gradient-to-r from-emerald-500 to-teal-400"
                  }`}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                      {predictionResult.risk_level.includes("high") ? (
                        <AlertTriangle className="w-10 h-10" />
                      ) : (
                        <CheckCircle2 className="w-10 h-10" />
                      )}
                    </div>
                    <div>
                      <p className="text-white/80 font-bold uppercase tracking-wider text-sm mb-1">
                        نتيجة تقييم SCBU
                      </p>
                      <h2 className="text-3xl font-black">
                        {predictionResult.risk_badge ||
                          predictionResult.risk_level_ar ||
                          predictionResult.risk_level}
                      </h2>
                    </div>
                  </div>
                  <div className="text-center md:text-left bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                    <p className="text-white/80 text-sm font-bold mb-1">
                      الاحتمالية المؤكدة
                    </p>
                    <p className="text-3xl font-black font-sans tracking-tight">
                      {(predictionResult.risk_score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Result Body */}
              <div className="p-8 space-y-8">
                {predictionResult.api_result?.recommendation_ar && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800">
                      التوصية الطبية المقترحة:
                    </h3>
                    <div className="p-5 bg-slate-50 text-slate-700 leading-relaxed rounded-xl border border-slate-100 text-sm font-medium">
                      {predictionResult.api_result.recommendation_ar}
                    </div>
                  </div>
                )}

                {predictionResult.consultation_suggested && (
                  <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-bold mb-1">
                        يُنصح بالتواصل مع الطبيب
                      </h4>
                      <p className="text-red-700/80 text-sm leading-relaxed mb-3">
                        بناءً على هذا التقييم، يُفضل مراجعة طبيبك المتابع في
                        أقرب وقت لمناقشة الترتيبات اللازمة للولادة ووحدة الرعاية
                        الخاصة (SCBU). لقد قمنا بإرسال إشعار استباقي لطبيبك بهذه
                        النتيجة.
                      </p>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-100 font-bold"
                        onClick={() => navigate("/patient/consultations")}
                      >
                        استعراض الاستشارات
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPredictionResult(null);
                      setIsResultOpen(false);
                    }}
                    className="text-slate-500 font-bold hover:text-slate-800"
                  >
                    إعادة الفحص
                  </Button>
                  <Button
                    onClick={() => navigate("/patient/ai-center")}
                    className="bg-slate-900 text-white rounded-xl font-bold"
                  >
                    العودة للمركز <ChevronLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden font-primary">
              {/* Tabs Navigation */}
              <div className="flex flex-wrap items-center bg-slate-50/50 p-2 gap-2 border-b border-slate-200/60">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 min-w-[200px] py-4 px-6 rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 ${activeTab === tab.id
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 lg:p-10">
                <AnimatePresence mode="wait">
                  {activeTab === "vitals" && (
                    <motion.div key="vitals">{renderVitalsTab()}</motion.div>
                  )}
                  {activeTab === "lab" && (
                    <motion.div key="lab">{renderLabTab()}</motion.div>
                  )}
                  {activeTab === "complications" && (
                    <motion.div key="complications">
                      {renderComplicationsTab()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default SCBUScreeningPage;
