/**
 * Static content for the landing page.
 * This data doesn't change and doesn't need to be fetched from the API.
 * Keeping it in the frontend makes the page load faster.
 */

import type {
  Feature,
  HowItWorksStep,
  WhyChooseUs,
  AppDownload,
  CtaBanner,
  FAQ,
} from "../services/landingService";

// ==================== Hero Static Content ====================
export const heroStaticContent = {
  title: "رفيقك الصحي في كل مرحلة",
  subtitle: "منصة رقمية متكاملة لدعم صحة المرأة المصرية",
  description:
    "احصلي على استشارات طبية متخصصة، تابعي حملك، واستفيدي من أدوات التتبع الذكية مع أفضل الأطباء المعتمدين.",
  cta_primary: { text: "ابدأي رحلتك الآن", link: "/register" },
  cta_secondary: { text: "تعرفي علينا", link: "/about" },
};

// ==================== Trust Indicator Icons ====================
/** Maps the API 'key' to an icon. Icons live in the frontend only. */
export const trustIndicatorIcons: Record<string, string> = {
  doctors: "👨‍⚕️",
  users: "👩",
  satisfaction: "⭐",
};

// ==================== Features ====================
export const features: Feature[] = [
  {
    icon: "🤰",
    title: "متتبع الحمل",
    description:
      "تابعي حملك أسبوعيًا مع معلومات مفصلة عن تطور الجنين ونصائح طبية متخصصة",
    link: "/trackers/pregnancy",
    color: "pink",
  },
  {
    icon: "👨‍⚕️",
    title: "استشارات طبية",
    description:
      "احجزي مع أفضل الأطباء المتخصصين في صحة المرأة واحصلي على استشارة فورية",
    link: "/doctors",
    color: "blue",
  },
  {
    icon: "📊",
    title: "أدوات التتبع",
    description:
      "تتبعي مزاجك، وزنك، ودورتك الشهرية مع تحليلات ذكية ورسوم بيانية تفاعلية",
    link: "/trackers",
    color: "purple",
  },
  {
    icon: "📚",
    title: "مكتبة طبية",
    description: "مقالات موثوقة ومراجعة من أطباء متخصصين تغطي كل ما تحتاجينه",
    link: "/articles",
    color: "green",
  },
  {
    icon: "🤖",
    title: "تنبؤات الذكاء الاصطناعي",
    description:
      "احصلي على تنبؤات مبكرة للمخاطر الصحية باستخدام تقنيات الذكاء الاصطناعي",
    link: "/patient/ai-center",
    color: "teal",
  },
];

// ==================== How It Works ====================
export const howItWorks: HowItWorksStep[] = [
  {
    step: 1,
    icon: "📝",
    title: "سجلي حساب مجاني",
    description: "إنشاء حساب سريع وآمن في أقل من دقيقة",
  },
  {
    step: 2,
    icon: "🎯",
    title: "اختاري مرحلتك",
    description: "حددي المرحلة الحياتية المناسبة لك للحصول على محتوى مخصص",
  },
  {
    step: 3,
    icon: "👨‍⚕️",
    title: "احجزي استشارة",
    description: "اختاري الطبيب المناسب واحجزي موعدك بسهولة",
  },
  {
    step: 4,
    icon: "💚",
    title: "ابدأي رحلتك الصحية",
    description: "تابعي صحتك واستفيدي من أدواتنا المتقدمة",
  },
];

// ==================== Why Choose Us ====================
export const whyChooseUs: WhyChooseUs[] = [
  {
    icon: "✅",
    title: "أطباء معتمدون",
    description: "جميع الأطباء معتمدون ومتحقق منهم من وزارة الصحة",
  },
  {
    icon: "🔒",
    title: "خصوصية تامة",
    description: "بياناتك محمية بأعلى معايير الأمان والتشفير",
  },
  {
    icon: "📱",
    title: "سهولة الاستخدام",
    description: "واجهة بسيطة وسهلة الاستخدام للجميع",
  },
  {
    icon: "🤖",
    title: "مدعوم بالذكاء الاصطناعي",
    description: "تقنيات حديثة لرعاية صحية أفضل وأدق",
  },
  {
    icon: "💰",
    title: "أسعار مناسبة",
    description: "استشارات بأسعار في المتناول للجميع",
  },
  {
    icon: "⏰",
    title: "متاح 24/7",
    description: "خدماتنا متاحة على مدار الساعة طوال الأسبوع",
  },
];

// ==================== App Download ====================
export const appDownload: AppDownload = {
  title: "حمّلي التطبيق الآن",
  description:
    "احصلي على تجربة أفضل مع تطبيقنا المحمول. إشعارات فورية، وصول سريع، وتجربة محسّنة.",
  features: [
    "إشعارات فورية بمواعيد الاستشارات",
    "وصول سريع لجميع الخدمات",
    "تجربة مستخدم محسّنة",
    "متابعة الحمل أثناء التنقل",
  ],
  app_store_url: "#",
  play_store_url: "#",
  qr_code_url: null,
};

// ==================== CTA Banner ====================
export const ctaBanner: CtaBanner = {
  title: "جاهزة لبدء رحلتك الصحية؟",
  description: "انضمي لآلاف النساء اللاتي يثقن في وداد للعناية بصحتهن",
  button_text: "ابدأي مجانًا الآن",
  button_link: "/register",
  secondary_text: "لا حاجة لبطاقة ائتمان • تسجيل سريع",
};

// ==================== Default FAQs (fallback) ====================
export const defaultFaqs: FAQ[] = [
  {
    id: 1,
    question: "هل الاستشارات سرية تمامًا؟",
    answer:
      "نعم، جميع الاستشارات سرية تمامًا ومحمية بأعلى معايير الأمان والتشفير.",
  },
  {
    id: 2,
    question: "كيف يمكنني حجز استشارة؟",
    answer:
      "يمكنك حجز استشارة بسهولة من خلال اختيار الطبيب المناسب وتحديد الموعد المتاح من صفحة الأطباء.",
  },
  {
    id: 3,
    question: "هل المنصة مجانية؟",
    answer:
      "التسجيل والتصفح مجاني تمامًا. الاستشارات تكون برسوم رمزية تبدأ من 100 جنيه.",
  },
];
