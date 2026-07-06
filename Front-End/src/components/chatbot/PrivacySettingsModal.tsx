import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    ShieldCheck,
    ShieldOff,
    Activity,
    Brain,
    FileText,
    Stethoscope,
    X,
    Loader2,
    Info,
    Lock,
} from "lucide-react";
import { useChatbotPreferences } from "@/hooks/useChatbotPreferences";

interface PrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PREFERENCE_ITEMS = [
    {
        key: "share_predictions" as const,
        icon: Brain,
        title: "نتائج تقييمات الذكاء الاصطناعي",
        description: "مشاركة تقييمات المخاطر الصحية (سكري الحمل، تسمم الحمل، الولادة المبكرة) مع المساعد الذكي",
        color: "from-violet-500 to-purple-600",
        bgLight: "bg-violet-50",
        textColor: "text-violet-600",
    },
    {
        key: "share_trackers" as const,
        icon: Activity,
        title: "المتتبعات الصحية",
        description: "مشاركة بيانات الوزن والمزاج والمعلومات الصحية مع المساعد الذكي",
        color: "from-emerald-500 to-teal-600",
        bgLight: "bg-emerald-50",
        textColor: "text-emerald-600",
    },
    {
        key: "share_medical_file" as const,
        icon: FileText,
        title: "الملف الطبي",
        description: "مشاركة المعلومات الطبية العامة (الأمراض المزمنة، الحساسية) مع المساعد الذكي",
        color: "from-blue-500 to-indigo-600",
        bgLight: "bg-blue-50",
        textColor: "text-blue-600",
    },
    {
        key: "share_consultations" as const,
        icon: Stethoscope,
        title: "الاستشارات الطبية",
        description: "مشاركة ملخصات الاستشارات السابقة مع المساعد الذكي",
        color: "from-amber-500 to-orange-600",
        bgLight: "bg-amber-50",
        textColor: "text-amber-600",
    },
];

export function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
    const { preferences, isEnabled, isLoading, isSaving, toggleMasterSwitch, updatePreference } =
        useChatbotPreferences();

    const [showConfirm, setShowConfirm] = useState(false);

    const handleMasterToggle = () => {
        if (!isEnabled) {
            setShowConfirm(true);
        } else {
            toggleMasterSwitch();
        }
    };

    const confirmEnable = () => {
        setShowConfirm(false);
        toggleMasterSwitch();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto
                                   bg-white rounded-3xl shadow-2xl border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg rounded-t-3xl border-b border-gray-100">
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center
                                        ${isEnabled ? "bg-gradient-to-br from-primary to-primary-600" : "bg-gray-100"}
                                        transition-colors duration-300`}
                                    >
                                        {isEnabled ? (
                                            <ShieldCheck className="w-5 h-5 text-white" />
                                        ) : (
                                            <Shield className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">إعدادات الخصوصية</h3>
                                        <p className="text-xs text-gray-500">التحكم بالبيانات المشاركة مع المساعد الذكي</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X className="w-4.5 h-4.5 text-gray-500" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-5">
                            {isLoading ? (
                                <div className="flex flex-col items-center py-10 gap-3">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm text-gray-500">جاري تحميل الإعدادات...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Master Switch */}
                                    <div
                                        className={`rounded-2xl p-4 transition-all duration-300 border
                                        ${isEnabled
                                                ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                                                : "bg-gray-50 border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isEnabled ? (
                                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                                ) : (
                                                    <ShieldOff className="w-6 h-6 text-gray-400" />
                                                )}
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">
                                                        {isEnabled ? "مشاركة البيانات مفعّلة" : "مشاركة البيانات معطّلة"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {isEnabled
                                                            ? "المساعد الذكي يستخدم بياناتك لتخصيص ردوده"
                                                            : "المساعد الذكي يعمل بدون بياناتك الشخصية"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleMasterToggle}
                                                disabled={isSaving}
                                                className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0
                                                ${isEnabled ? "bg-primary shadow-md shadow-primary/30" : "bg-gray-300"}
                                                ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                <motion.div
                                                    layout
                                                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                                                    style={{ [isEnabled ? "right" : "left"]: "2px" }}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Security notice */}
                                    <div className="flex items-start gap-2.5 p-3 bg-sky-50 rounded-xl border border-sky-100">
                                        <Lock className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-sky-700 leading-relaxed">
                                            بياناتك تُرسل مشفّرة ومُجهّلة للمساعد الذكي. لا يتم تخزين أي معلومات شخصية على خوادم
                                            الذكاء الاصطناعي.
                                        </p>
                                    </div>

                                    {/* Individual toggles */}
                                    <AnimatePresence>
                                        {isEnabled && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-3 overflow-hidden"
                                            >
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                                                    البيانات المشاركة
                                                </p>
                                                {PREFERENCE_ITEMS.map((item) => {
                                                    const Icon = item.icon;
                                                    const isItemEnabled =
                                                        preferences?.[item.key] ?? true;

                                                    return (
                                                        <motion.div
                                                            key={item.key}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
                                                            ${isItemEnabled
                                                                    ? `${item.bgLight} border-transparent`
                                                                    : "bg-white border-gray-150 opacity-60"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div
                                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                                                    ${isItemEnabled
                                                                            ? `bg-gradient-to-br ${item.color}`
                                                                            : "bg-gray-200"
                                                                        } transition-colors duration-200`}
                                                                >
                                                                    <Icon className="w-4.5 h-4.5 text-white" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                                        {item.title}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    updatePreference(item.key, !isItemEnabled)
                                                                }
                                                                disabled={isSaving}
                                                                className={`relative w-10 h-6 rounded-full transition-all duration-200 shrink-0 ms-3
                                                                ${isItemEnabled ? `bg-gradient-to-r ${item.color}` : "bg-gray-300"}
                                                                ${isSaving ? "opacity-50" : ""}`}
                                                            >
                                                                <motion.div
                                                                    layout
                                                                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                                                                    style={{
                                                                        [isItemEnabled ? "right" : "left"]: "2px",
                                                                    }}
                                                                />
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 rounded-b-3xl">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <Info className="w-3.5 h-3.5" />
                                <span>يمكنك تغيير هذه الإعدادات في أي وقت</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Confirmation dialog */}
                    <AnimatePresence>
                        {showConfirm && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 z-[80] flex items-center justify-center p-6"
                                onClick={() => setShowConfirm(false)}
                            >
                                <div className="absolute inset-0 bg-black/30" />
                                <motion.div
                                    className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                            <ShieldCheck className="w-7 h-7 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1.5">تفعيل مشاركة البيانات؟</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                سيتم مشاركة بياناتك الصحية المحددة مع المساعد الذكي لتخصيص
                                                ردوده. لن يتم تخزين بياناتك الشخصية على خوادم خارجية.
                                            </p>
                                        </div>
                                        <div className="flex gap-3 w-full">
                                            <button
                                                onClick={() => setShowConfirm(false)}
                                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200
                                                         text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                onClick={confirmEnable}
                                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-600
                                                         text-sm font-bold text-white shadow-md shadow-primary/30
                                                         hover:shadow-lg hover:shadow-primary/40 transition-all"
                                            >
                                                تفعيل
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
