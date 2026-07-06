import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
  MapPin,
  Globe,
  Palette,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import publicService from "@/services/publicService";

const PublicHeader: React.FC<{ darkHero?: boolean }> = ({ darkHero = false }) => {
  const { user, userType } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const { data: settingsResponse } = useQuery({
    queryKey: ["publicSiteSettings"],
    queryFn: async () => {
      const response = await publicService.getSiteSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const settings = settingsResponse?.data;

  type ThemeType = "pink" | "teal" | "green" | "green-alt" | "ocean" | "luxe";

  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "legacy") return "teal";
    if (theme === "green") return "green";
    if (theme === "green-alt") return "green-alt";
    if (theme === "ocean") return "ocean";
    if (theme === "luxe") return "luxe";
    return "pink";
  });

  const cycleTheme = () => {
    setCurrentTheme((prev) => {
      if (prev === "pink") {
        document.documentElement.setAttribute("data-theme", "legacy");
        return "teal";
      } else if (prev === "teal") {
        document.documentElement.setAttribute("data-theme", "green");
        return "green";
      } else if (prev === "green") {
        document.documentElement.setAttribute("data-theme", "green-alt");
        return "green-alt";
      } else if (prev === "green-alt") {
        document.documentElement.setAttribute("data-theme", "ocean");
        return "ocean";
      } else if (prev === "ocean") {
        document.documentElement.setAttribute("data-theme", "luxe");
        return "luxe";
      } else {
        document.documentElement.removeAttribute("data-theme");
        return "pink";
      }
    });
  };

  const getThemeLabel = () => {
    if (currentTheme === "pink") return "التصميم الحالي: بينك (الجديد)";
    if (currentTheme === "teal") return "التصميم الحالي: تيل (القديم)";
    if (currentTheme === "green") return "التصميم الحالي: أخضر غامق (الطبي)";
    if (currentTheme === "green-alt") return "التصميم الحالي: أخضر فاتح (البديل)";
    if (currentTheme === "ocean") return "التصميم الحالي: أزرق محيطي (Ocean Blue)";
    return "التصميم الحالي: بنفسجي داكن (Dark Luxe)";
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: "/", label: "الرئيسية" },
    { path: "/about", label: "من نحن" },
    userType === "patient" && user && (user as any).life_stage
      ? (() => {
        const stage = (user as any).life_stage;
        const stageNames: Record<string, string> = {
          "pre-marriage": "مرحلة ما قبل الزواج",
          "married-life": "الحياة الزوجية",
          motherhood: "الأمومة",
        };
        return {
          path: `/life-stages/${stage.slug}`,
          label: stageNames[stage.slug] || stage.name,
        };
      })()
      : { path: "/life-stages", label: "مراحل وداد" },
    { path: "/doctors", label: "الأطباء" },
    { path: "/trackers", label: "الأدوات" },
    ...(userType === "patient" && (user as any)?.life_stage?.slug !== "pre-marriage" ? [{ path: "/patient/ai-center", label: "التشخيص الذكي" }] : []),
    { path: "/articles", label: "المقالات" },
    { path: "/contact", label: "تواصل معنا" },
  ];

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (userType === "doctor") return "/doctor/dashboard";
    if (userType === "admin") return "/admin/dashboard";
    return "/patient/dashboard";
  };

  const isLinkActive = (linkPath: string) => {
    if (location.pathname === linkPath) return true;
    if (linkPath === "/") return false;
    if (linkPath === "/doctors") {
      return (
        location.pathname.startsWith("/doctors") ||
        location.pathname.includes("/consultations") ||
        location.pathname.includes("/doctors/")
      );
    }
    return location.pathname.startsWith(linkPath);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[1000] transition-all duration-500",
        isScrolled ? "py-1.5" : "py-3",
      )}
      dir="rtl"
    >
      {/* Top Bar - Premium Info (Only on Desktop & Not Scrolled & Not Patient) */}
      <AnimatePresence>
        {!isScrolled && userType !== "patient" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 mb-4 hidden lg:flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground"
          >
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                {settings?.description ? settings.description.substring(0, 50) + (settings.description.length > 50 ? "..." : "") : "أول منصة ذكية لصحة المرأة"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {settings?.address?.city || "القاهرة"}، {settings?.address?.country || "مصر"}
              </span>
            </div>
            {!user && (
              <div className="flex items-center gap-8">
                <Link
                  to="/contact"
                  className="hover:text-primary transition-colors"
                >
                  الدعم الفني
                </Link>
                <Link
                  to="/join-as-doctor"
                  className="flex items-center gap-1.5 text-primary hover:text-primary-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  انضم/ي كطبيب/ة
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        <div
          className={cn(
            "relative flex items-center justify-between px-6 py-3 rounded-[24px] transition-all duration-500 border border-transparent",
            isScrolled
              ? "bg-background/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-border"
              : darkHero
                ? "bg-black/10 backdrop-blur-md border-white/10"
                : "bg-background/50 backdrop-blur-sm",
          )}
        >
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name || "وداد"} className="w-16 h-16 object-contain rounded-full bg-white p-1.5 shadow-sm drop-shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/15 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
            )}
            <span className={cn(
              "text-xl font-black tracking-tighter transition-colors",
              darkHero && !isScrolled ? "text-white" : "text-foreground"
            )}>
              {settings?.site_name || "وداد"}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-black transition-all duration-300 uppercase tracking-wide",
                  isLinkActive(link.path)
                    ? "bg-primary text-white shadow-md"
                    : darkHero && !isScrolled
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary-50",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={cycleTheme}
              className={cn(
                "p-2 rounded-xl transition-colors",
                darkHero && !isScrolled
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary-50"
              )}
              title={getThemeLabel()}
            >
              <Palette className="w-5 h-5" />
            </button>
            {user && userType === "patient" && <NotificationBell />}
            {user ? (
              <Link
                to={getDashboardLink()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black text-[13px] shadow-card hover:bg-primary-700 hover:shadow-glow hover:scale-105 active:scale-95 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 border-primary-200 text-primary-700 font-black text-[13px] hover:bg-primary-50 transition-colors rounded-xl"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg bg-primary text-white font-black text-[12px] shadow-card hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all"
                >
                  حساب جديد
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground overflow-hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 mt-3 px-4 z-[2000] max-h-[85vh] overflow-y-auto hide-scrollbar"
          >
            <div className="bg-background rounded-[32px] p-6 md:p-8 shadow-deep border border-border space-y-6 mb-10">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "px-6 py-3 rounded-xl text-lg font-black transition-all",
                      isLinkActive(link.path)
                        ? "bg-primary-50 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={cycleTheme}
                  className="w-full text-right px-6 py-3 rounded-xl text-lg font-black transition-all text-muted-foreground hover:bg-muted flex items-center gap-3"
                >
                  <Palette className="w-5 h-5" />
                  {getThemeLabel()}
                </button>
              </nav>

              <div className="h-px bg-border"></div>

              <div className="flex flex-col gap-3">
                {user ? (
                  <Link
                    to={getDashboardLink()}
                    className="w-full py-5 rounded-xl bg-primary text-white font-black text-center text-lg shadow-card"
                  >
                    لوحة التحكم
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full py-5 rounded-xl bg-foreground text-white font-black text-center text-lg shadow-lg"
                    >
                      إنشاء حساب جديد
                    </Link>
                    <Link
                      to="/login"
                      className="w-full py-5 rounded-xl bg-muted text-foreground font-black text-center text-lg"
                    >
                      تسجيل الدخول
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicHeader;
