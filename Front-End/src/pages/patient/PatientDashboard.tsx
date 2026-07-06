import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import {
  User,
  Calendar,
  FileText,
  Activity,
  LogOut,
  Settings,
  Sparkles,
  TrendingUp,
  Bell,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Heart,
  BookOpen,
  Clock,
  ArrowUpRight,
  Zap,
  Video,
  MapPin,
  Leaf,
  Star,
  Eye,
  Pill,
  BrainCircuit,
  TestTube2,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { ROUTES } from "@/utils/constants";
import {
  usePatientDashboardStats,
  usePatientConsultations,
  usePublicArticles,
} from "@/hooks/usePatientQueries";
import { cn } from "@/lib/utils";

/* ─── Animation Helpers ───────────────────────────────────────── */
/** Returns inline motion props for a fade-up entrance. Use with spread: {...fadeIn(delay)} */
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: "easeOut" as const },
});

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  hover: { y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.10)", transition: { duration: 0.25 } },
};

/* ─── Component ──────────────────────────────────────────────── */
const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: statsLoading } = usePatientDashboardStats();
  const { profile, isLoading: profileLoading } = useProfile();

  const essentialMissing = React.useMemo(() => {
    if (!user) return [];
    const missing = [];
    if (!(user as any).life_stage_id) missing.push('life_stage');

    if (profile?.missing_fields && profile.missing_fields.length > 0) {
      missing.push(...profile.missing_fields);
    } else if (!user.profile) {
      missing.push('height', 'weight', 'date_of_birth');
    }
    return missing.filter(k => ['life_stage', 'height', 'weight', 'date_of_birth'].includes(k));
  }, [user, profile]);

  const isProfileIncomplete = !profileLoading && essentialMissing.length >= 1;

  const fieldNamesAr: Record<string, string> = {
    height: 'الطول',
    weight: 'الوزن',
    date_of_birth: 'تاريخ الميلاد',
    life_stage: 'المرحلة الحياتية',
  };
  const missingAr = essentialMissing.map(k => fieldNamesAr[k] || k);
  const uniqueMissingAr = Array.from(new Set(missingAr));

  React.useEffect(() => {
    if (!profileLoading && profile && user) {
      const promptKey = `profilePrompted_${user.id}`;
      const alreadyPrompted = sessionStorage.getItem(promptKey);

      if (!alreadyPrompted) {
        if (isProfileIncomplete) {
          sessionStorage.setItem(promptKey, 'true');
          toast.warning(`تنبيه هام: يرجى استكمال بياناتك الأساسية (مثل: ${uniqueMissingAr.slice(0, 3).join('، ')} إلخ) لضمان دقة الرعاية.`, {
            duration: 8000,
            position: 'top-center'
          });
          navigate('/patient/profile');
        } else {
          sessionStorage.setItem(promptKey, 'true');
        }
      }
    }
  }, [profile, profileLoading, user, isProfileIncomplete, navigate]);
  const { data: upcomingCons, isLoading: consLoading } = usePatientConsultations({
    upcoming: true,
    page: 1,
  });

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  /* ── Next appointment ── */
  const nextAppt =
    upcomingCons?.consultations?.data?.[0] || upcomingCons?.consultations?.[0] || null;

  /* ── Latest article ── */
  const { data: articlesResp } = usePublicArticles({ page: 1, sort_by: "latest" });
  const latestArticle = articlesResp?.articles?.[0] || articlesResp?.featured_articles?.[0] || null;

  /* ── Life stage info ── */
  const lifeStage = (user as any)?.life_stage;

  /* ── Life stage icon/color map with Arabic translations ── */
  const lifeStageConfig: Record<
    string,
    { nameAr: string; gradient: string; icon: React.ElementType; emoji: string; shadow: string; accentBg: string }
  > = {
    "pre-marriage": {
      nameAr: "ما قبل الزواج",
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      icon: Sparkles,
      emoji: "💖",
      shadow: "shadow-purple-500/20",
      accentBg: "bg-purple-500/10 text-purple-600 border-purple-500/20"
    },
    "married-life": {
      nameAr: "الحياة الزوجية",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      icon: Heart,
      emoji: "✨",
      shadow: "shadow-pink-500/20",
      accentBg: "bg-pink-500/10 text-pink-600 border-pink-500/20"
    },
    "motherhood": {
      nameAr: "الأمومة",
      gradient: "from-rose-500 via-fuchsia-500 to-pink-600",
      icon: Heart,
      emoji: "🤰",
      shadow: "shadow-rose-500/20",
      accentBg: "bg-rose-500/10 text-rose-600 border-rose-500/20"
    },
    pregnancy: {
      nameAr: "الحمل",
      gradient: "from-rose-500 via-fuchsia-500 to-pink-600",
      icon: Heart,
      emoji: "🤰",
      shadow: "shadow-rose-500/20",
      accentBg: "bg-rose-500/10 text-rose-600 border-rose-500/20"
    },
    fertility: {
      nameAr: "الخصوبة",
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      icon: Sparkles,
      emoji: "✨",
      shadow: "shadow-purple-500/20",
      accentBg: "bg-purple-500/10 text-purple-600 border-purple-500/20"
    },
    postpartum: {
      nameAr: "النفاس / ما بعد الولادة",
      gradient: "from-amber-400 via-orange-500 to-red-500",
      icon: Leaf,
      emoji: "🌿",
      shadow: "shadow-orange-500/20",
      accentBg: "bg-orange-500/10 text-orange-600 border-orange-500/20"
    },
    menopause: {
      nameAr: "سن الأمل / انقطاع الطمث",
      gradient: "from-indigo-400 via-blue-500 to-sky-600",
      icon: Star,
      emoji: "⭐",
      shadow: "shadow-blue-500/20",
      accentBg: "bg-blue-500/10 text-blue-600 border-blue-500/20"
    },
    default: {
      nameAr: "عامة",
      gradient: "from-primary via-primary-600 to-primary-700",
      icon: Heart,
      emoji: "💗",
      shadow: "shadow-primary/20",
      accentBg: "bg-primary/10 text-primary border-primary/20"
    },
  };
  const stageKey = lifeStage?.slug || "default";
  const stageConf = lifeStageConfig[stageKey] || lifeStageConfig.default;
  const stageNameAr = stageConf.nameAr || lifeStage?.name_ar || lifeStage?.name || "عامة";


  /* ── Intelligent Stats Cards (Genius Suggestion) ── */
  const overviewStats: any[] = [
    {
      label: "مواعيد قادمة",
      value: dashboardData?.upcoming_appointments ?? 0,
      icon: Calendar,
      gradient: "from-blue-500 via-indigo-500 to-blue-600",
      light: "bg-blue-50 text-blue-600 border-blue-100/60",
      accentText: "text-blue-700 bg-blue-50 border border-blue-100",
      trend: "تنبيه موعد",
      path: "/patient/consultations",
      isText: false,
    },
    {
      label: "مرحلتك الصحية",
      value: stageNameAr,
      icon: stageConf.icon as any,
      gradient: stageConf.gradient,
      light: stageConf.accentBg,
      accentText: "text-indigo-700 bg-indigo-50 border border-indigo-100",
      trend: stageConf.emoji + " مخصصة لكِ",
      path: "/patient/profile/basic",
      isText: true,
    },
    {
      label: "الروشتات الطبية",
      value: dashboardData?.active_prescriptions ?? 0,
      icon: Pill,
      gradient: "from-purple-500 via-violet-500 to-purple-600",
      light: "bg-purple-50 text-purple-600 border-purple-100/60",
      accentText: "text-purple-700 bg-purple-50 border border-purple-100",
      trend: "روشتة إلكترونية",
      path: "/patient/consultations/prescriptions",
      isText: false,
    },
  ];


  /* ── Quick actions ── */
  const quickActions = [
    {
      label: "حجز استشارة",
      desc: "أطباء متخصصون",
      icon: Stethoscope,
      path: "/patient/consultations/doctors",
      gradient: "from-primary to-primary-700",
      shadow: "shadow-primary/25",
    },
    {
      label: "مواعيدي",
      desc: "سجل كامل",
      icon: Calendar,
      path: "/patient/consultations",
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/25",
    },
    {
      label: "وصفاتي الطبية",
      desc: "إلكترونية آمنة",
      icon: Pill,
      path: "/patient/consultations/prescriptions",
      gradient: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/25",
    },
    {
      label: "متتبعات الصحة",
      desc: "راقبي صحتكِ",
      icon: Heart,
      path: "/trackers",
      gradient: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-500/25",
    },
    {
      label: "المكتبة الطبية",
      desc: "مقالات موثوقة",
      icon: BookOpen,
      path: "/articles",
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/25",
    },
    {
      label: "ملفي الشخصي",
      desc: "إعداداتك",
      icon: User,
      path: "/patient/profile",
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/25",
    },
    ...(stageKey !== "pre-marriage" ? [{
      label: "طبيب الذكاء الاصطناعي",
      desc: "توقع المخاطر",
      icon: BrainCircuit,
      path: "/patient/ai-center",
      gradient: "from-teal-500 to-emerald-600",
      shadow: "shadow-teal-500/25",
    }] : []),
    {
      label: "قراءة التحاليل",
      desc: "بالذكاء الاصطناعي",
      icon: TestTube2,
      path: "/patient/medical-files/lab-tests",
      gradient: "from-cyan-500 to-blue-600",
      shadow: "shadow-cyan-500/25",
    },
    {
      label: "المساعد الذكي",
      desc: "شات بوت وداد",
      icon: Sparkles,
      path: "/patient/chatbot",
      gradient: "from-fuchsia-500 to-purple-600",
      shadow: "shadow-fuchsia-500/25",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6fa]" dir="rtl">
      <PublicHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full mt-16">

        {/* ── Welcome Banner ─────────────────────────────────────────── */}
        <motion.div
          {...fadeIn(0)}
          className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          {/* Left: Avatar + greeting */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden border-2 border-white">
                {user?.image_url ? (
                  <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white">
                <span className="block w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  مرحباً، {user?.name}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary px-2 py-0.5 rounded-full text-[10px] font-black border border-primary-100">
                  <ShieldCheck className="w-3 h-3" /> موثقة
                </span>
                <span className="text-xs text-muted-foreground font-medium">نتمنى لكِ يوماً رائعاً</span>
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2.5">
            <Link to="/patient/profile">
              <Button variant="outline" className="border-border bg-white hover:bg-muted rounded-xl h-10 px-5 font-black text-xs shadow-sm">
                <Settings className="w-3.5 h-3.5 ml-1.5 text-primary" />
                الإعدادات
              </Button>
            </Link>
            <Link to="/patient/consultations/doctors">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-primary hover:bg-primary-700 rounded-xl h-10 px-5 font-black text-xs shadow-lg shadow-primary/25">
                  <Stethoscope className="w-3.5 h-3.5 ml-1.5" />
                  حجز موعد
                </Button>
              </motion.div>
            </Link>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Persistent Profile Warning ── */}
        {isProfileIncomplete && (
          <motion.div {...fadeIn(0.05)} className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 sm:p-5 shadow-sm border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-800 font-bold text-lg mb-1">ملفك الشخصي غير مكتمل!</h3>
              <p className="text-amber-700/90 text-sm">
                للحصول على تقييمات ذكاء اصطناعي دقيقة وتوصيات صحية مخصصة، يرجى استكمال بياناتك الأساسية:
                <strong className="mx-1">{uniqueMissingAr.join('، ')}</strong>.
              </p>
            </div>
            <Link to="/patient/profile" className="shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20">
                استكمال البيانات الآن
                <ArrowUpRight className="w-4 h-4 mr-1.5" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* ── HERO: Next Appointment Card (full width, top center) ─── */}
        <motion.div {...fadeIn(0.08)} className="mb-6">
          {consLoading ? (
            <div className="h-40 bg-white animate-pulse rounded-3xl border border-border" />
          ) : nextAppt ? (
            <div className="relative bg-gradient-to-l from-primary-700 via-primary to-primary-500 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl shadow-primary/30">
              {/* Decorative blobs */}
              <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary-300/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Icon badge */}
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Bell className="w-8 h-8 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-[11px] font-black uppercase tracking-widest mb-1">موعدك القادم</p>
                  <h2 className="text-white text-xl sm:text-2xl font-black tracking-tight mb-2 truncate">
                    د. {nextAppt?.doctor?.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    {nextAppt?.doctor?.specialization_ar && (
                      <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                        <Stethoscope className="w-3 h-3" />
                        {nextAppt.doctor.specialization_ar}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                      <Calendar className="w-3 h-3" />
                      {nextAppt?.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                      <Clock className="w-3 h-3" />
                      {nextAppt?.time}
                    </span>
                    {nextAppt?.type && (
                      <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                        {nextAppt.type === "video" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {nextAppt.type === "video" ? "فيديو" : "حضوري"}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="shrink-0"
                >
                  <Button
                    onClick={() => navigate(`/patient/consultations/${nextAppt?.id}`)}
                    className="bg-white text-primary hover:bg-primary-50 rounded-2xl h-12 px-8 font-black text-sm shadow-lg shadow-black/10 transition-all"
                  >
                    تفاصيل الموعد
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-border rounded-3xl p-8 text-center flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto sm:mx-0 shrink-0">
                <Calendar className="w-8 h-8 text-border" />
              </div>
              <div className="text-right flex-1">
                <h3 className="font-black text-foreground text-lg mb-1">لا يوجد مواعيد قادمة</h3>
                <p className="text-muted-foreground text-sm font-medium mb-4">احجزي موعدك مع أفضل الأطباء المتخصصين بضغطة واحدة</p>
                <Link to="/patient/consultations/doctors">
                  <Button className="bg-primary hover:bg-primary-700 rounded-xl h-10 px-8 font-black text-xs shadow-lg shadow-primary/25">
                    <Stethoscope className="w-4 h-4 ml-2" /> احجزي موعداً الآن
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left column (8) ─────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {overviewStats.map((stat, idx) => (
                <motion.div key={idx} {...fadeIn(idx * 0.1)}>
                  <motion.div
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    onClick={() => navigate(stat.path)}
                    className={cn(
                      "rounded-[2rem] p-7 relative overflow-hidden h-full flex flex-col justify-between group",
                      "bg-white/80 backdrop-blur-xl border border-white/60 hover:border-transparent shadow-xl hover:shadow-2xl transition-all duration-500 z-10 hover:z-20 cursor-pointer"
                    )}
                  >
                    {/* Glowing backlights */}
                    <div className={cn("absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-[40px] opacity-10 transition-all duration-700 group-hover:opacity-20 group-hover:scale-110", stat.gradient)} />
                    <div className={cn("absolute -top-12 -left-12 w-32 h-32 rounded-full blur-[30px] opacity-5 transition-all duration-700 group-hover:opacity-10", stat.gradient)} />

                    {/* Top Info */}
                    <div className="flex items-start justify-between relative z-10 mb-8 w-full">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-md border", stat.light)}>
                        <stat.icon className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-black px-3 py-1 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-md opacity-90",
                        stat.accentText
                      )}>
                        {stat.trend}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 mt-auto w-full">
                      {statsLoading ? (
                        <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-xl mb-2" />
                      ) : (
                        <h3 className={cn(
                          "font-black tracking-tight mb-1 bg-gradient-to-r bg-clip-text text-transparent group-hover:scale-[1.02] origin-right transition-transform duration-500",
                          idx === 0 ? "from-blue-600 to-indigo-600" :
                            idx === 1 ? "from-violet-600 to-pink-500" :
                              "from-emerald-600 to-teal-500",
                          stat.isText ? "text-xl sm:text-2xl leading-none font-bold" : "text-4xl"
                        )}>
                          {stat.value}
                        </h3>
                      )}
                      <p className="text-[11px] font-extrabold text-slate-400 group-hover:text-slate-600 uppercase tracking-widest mt-1 transition-colors duration-500">
                        {stat.label}
                      </p>

                      {/* Decorative footer details */}
                      <div className="mt-5 pt-3.5 border-t border-slate-100/80 flex items-center justify-between w-full">
                        <span className="text-[10px] text-slate-400 group-hover:text-primary group-hover:translate-x-[-4px] transition-all duration-300 flex items-center gap-1 font-bold">
                          عرض التفاصيل
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </span>
                        {/* Small custom visual indicator */}
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {idx === 0 && (
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-200" />
                            </div>
                          )}
                          {idx === 1 && (
                            <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className={cn("h-full w-2/3 rounded-full bg-gradient-to-r", stat.gradient)} />
                            </div>
                          )}
                          {idx === 2 && (
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              نشطة
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>


            {/* Quick Actions — Premium Grid */}
            <motion.div {...fadeIn(0.4)}>
              <div className="flex items-center justify-between mb-4 px-0.5">
                <div>
                  <h3 className="font-black text-foreground text-base tracking-tight">وصول سريع</h3>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">خدماتك الأساسية بضغطة واحدة</p>
                </div>
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary text-[10px] font-black px-2.5 py-1 rounded-full border border-primary-100">
                  <Zap className="w-3 h-3" /> سريع
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => navigate(action.path)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + idx * 0.07, duration: 0.35 }}
                    whileHover={{ y: -6, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex flex-col items-center gap-3 p-5 bg-white rounded-3xl border border-border/60 hover:border-transparent hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Gradient icon */}
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br transition-transform group-hover:scale-110",
                      action.gradient,
                      action.shadow
                    )}>
                      <action.icon className="w-6 h-6" />
                    </div>

                    <div className="text-center">
                      <span className="block text-[12px] font-black text-foreground">{action.label}</span>
                      <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">{action.desc}</span>
                    </div>

                    {/* Arrow indicator */}
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 absolute top-3 left-3 group-hover:text-primary group-hover:opacity-100 transition-all opacity-0" />

                    {/* Hover glow */}
                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br transition-opacity pointer-events-none", action.gradient)} />
                  </motion.button>
                ))}
              </div>
            </motion.div>

          </div>

          {/* ── Right Sidebar (4) ───────────────────────── */}
          <aside className="lg:col-span-4 space-y-4">

            {/* Health Tip */}
            <motion.div {...fadeIn(0.15)}>
              <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100/60 p-6 rounded-3xl shadow-lg shadow-indigo-100/40">
                <h3 className="font-black text-foreground text-sm flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-rose-500" />
                  نصيحة وداد لليوم
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50 mb-4">
                  <p className="text-foreground/80 font-bold text-xs leading-relaxed mb-3">
                    "التنظيم الجيد لساعات النوم يساعد بشكل كبير في توازن الهرمونات وتقوية مناعة الجسم."
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">توجيه ذكي</span>
                  </div>
                </div>
                <Link
                  to="/articles"
                  className="inline-flex items-center gap-1.5 text-indigo-600 font-black text-[11px] group"
                >
                  استكشفي المزيد
                  <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Recent Consultations mini-list */}
            <motion.div {...fadeIn(0.25)}>
              <div className="bg-white border border-border/60 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    آخر استشاراتك
                  </h3>
                  <Link
                    to="/patient/consultations"
                    className="text-[11px] font-black text-primary hover:underline flex items-center gap-1"
                  >
                    عرض الكل <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {consLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : (upcomingCons?.consultations?.data || upcomingCons?.consultations || []).length > 0 ? (
                  <div className="space-y-2.5">
                    {(upcomingCons?.consultations?.data || upcomingCons?.consultations || [])
                      .slice(0, 3)
                      .map((c: any, i: number) => (
                        <motion.button
                          key={c.id}
                          onClick={() => navigate(`/patient/consultations/${c.id}`)}
                          whileHover={{ x: -3 }}
                          className="w-full flex items-center gap-3 p-3 bg-muted/40 rounded-2xl hover:bg-muted transition-colors text-right"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white border border-border overflow-hidden flex items-center justify-center shrink-0">
                            {c.doctor?.image_url ? (
                              <img src={c.doctor.image_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User className="w-4 h-4 text-border" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-foreground truncate">د. {c.doctor?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{c.date} — {c.time}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-border rotate-180 shrink-0" />
                        </motion.button>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground font-bold py-6">لا توجد سجلات حتى الآن</p>
                )}
              </div>
            </motion.div>

            {/* Support box */}
            <motion.div {...fadeIn(0.35)}>
              <div className="bg-muted rounded-3xl border border-border p-5">
                <h4 className="font-black text-xs text-foreground mb-1">الدعم الفني المباشر</h4>
                <p className="text-[10px] text-muted-foreground font-medium mb-4 leading-relaxed">
                  نحن هنا لمساعدتِك في أي وقت على مدار الساعة.
                </p>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="w-full border-border bg-white text-muted-foreground hover:bg-muted rounded-xl h-10 text-[11px] font-black"
                  >
                    تحدثي معنا
                  </Button>
                </Link>
              </div>
            </motion.div>
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PatientDashboard;
