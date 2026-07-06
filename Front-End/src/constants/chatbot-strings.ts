/**
 * chatbot-strings.ts
 * نصوص واجهة الشات بوت مركزيّة - تسهيل التعديل والترجمة مستقبلاً
 */

export const CHATBOT_UI = {
  // مربع الإدخال
  placeholder: "اكتبي رسالتك هنا...",
  placeholderLoading: "جاري المعالجة...",
  send: "إرسال",
  sending: "جارٍ الإرسال...",
  charCount: (n: number) => `${n}/1000`,

  // حالات البوت
  typing: "وداد تكتب...",
  connected: "متصل الآن",

  // أزرار
  retry: "إعادة المحاولة",
  clearChat: "محادثة جديدة",
  openChat: "فتح نافذة المحادثة",
  closeChat: "إغلاق نافذة المحادثة",

  // رسائل الخطأ
  errorGeneral: "حدث خطأ في الاتصال. حاولي مرة أخرى.",
  errorTimeout: "انتهت مهلة الانتظار. حاولي مرة أخرى.",
  errorProcessing: "حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.",

  // إخلاء المسؤولية الطبي
  disclaimer: "المساعد الذكي يقدم معلومات إرشادية. في الطوارئ يرجى الاتصال بالإسعاف فوراً.",

  // طوارئ
  emergency: {
    title: "⚠️ يبدو أنكِ تمرّين بموقف طارئ",
    description: "لا تترددي في طلب المساعدة الفورية",
    callAmbulance: "اتصلي بالإسعاف الآن",
    bookConsultation: "احجزي استشارة عاجلة",
    contactSupport: "تواصلي مع الدعم",
    disclaimer: "هذا المساعد لا يغني عن رأي الطبيب في الحالات الطارئة.",
  },

  // أسئلة مقترحة
  suggestedQuestionsLabel: "أسئلة مقترحة:",

  // المحادثة
  userRole: "رسالتكِ",
  botRole: "رد المساعد",

  // ARIA
  chatDialogLabel: "نافذة المحادثة مع وداد",
  chatLogLabel: "سجل المحادثة",
  messageFormLabel: "نموذج إرسال رسالة",
  typingLabel: "المساعد يكتب",
} as const;

/** أسماء البوتات المركزية */
export const BOT_NAMES = {
  default: "وداد",
  public: "وداد - المساعد العام",
  authenticated_default: "وداد",
} as const;

/** الكلمات التي تُشير لحالة طوارئ (trigger Emergency Escalation) */
export const EMERGENCY_KEYWORDS = [
  "نزيف شديد",
  "نزيف حاد",
  "دم كثير",
  "لا أستطيع التنفس",
  "صعوبة تنفس",
  "ألم حاد مفاجئ",
  "إغماء",
  "فقدان الوعي",
  "تشنجات",
  "ولادة مبكرة",
  "الطفل لا يتحرك",
  "حرق شديد",
  "إيذاء نفسي",
  "أفكار انتحارية",
  "أريد إيذاء نفسي",
] as const;
