import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import publicService from "@/services/publicService";

const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { path: "/about", label: "من نحن" },
      { path: "/doctors", label: "الأطباء" },
      { path: "/articles", label: "المقالات" },
    ],
    services: [
      { path: "/trackers", label: "أدوات التتبع" },
      { path: "/patient/consultations/doctors", label: "الاستشارات" },
    ],
    support: [
      { path: "/contact", label: "تواصل/ي معنا" },
      { path: "/join", label: "انضم/ي كطبيب/ة" },
      { path: "/terms", label: "الشروط والأحكام" },
      { path: "/privacy", label: "سياسة الخصوصية" },
    ],
  };

  const { data: settingsResponse } = useQuery({
    queryKey: ["publicSiteSettings"],
    queryFn: async () => {
      const response = await publicService.getSiteSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const settings = settingsResponse?.data;

  const socialLinks = [
    {
      href: "https://facebook.com",
      label: "Facebook",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
        </svg>
      ),
    },
    {
      href: "https://twitter.com",
      label: "Twitter",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
        </svg>
      ),
    },
    {
      href: "https://instagram.com",
      label: "Instagram",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      href: "https://youtube.com",
      label: "YouTube",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
          <polygon
            points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
            fill="#fff"
          />
        </svg>
      ),
    },
  ];

  return (
    <footer
      className="bg-gradient-to-b from-foreground to-foreground/90 text-white pt-16 pb-8 px-6"
      dir="rtl"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name || "وداد"} className="w-24 h-24 object-contain rounded-full bg-white p-1 drop-shadow-md" />
              ) : (
                <span className="text-2xl">💚</span>
              )}
              <span className="text-2xl font-extrabold text-primary">
                {settings?.site_name || "وداد"}
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed text-body-sm mb-5 max-w-xs">
              {settings?.description || "منصة رقمية متكاملة لدعم صحة المرأة المصرية. رفيقك الصحي في كل مرحلة من حياتك."}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s) => {
                const url = settings?.social_media?.[s.label.toLowerCase() as keyof typeof settings.social_media] || s.href;
                if (!url) return null;
                return (
                  <a
                    key={s.label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {s.icon}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-body font-bold mb-4">المنصة</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/70 text-body-sm hover:text-primary hover:pr-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services links */}
          <div>
            <h4 className="text-body font-bold mb-4">الخدمات</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/70 text-body-sm hover:text-primary hover:pr-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-body font-bold mb-4">الدعم</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/70 text-body-sm hover:text-primary hover:pr-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-body font-bold mb-0">تواصلي معنا</h4>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <a
                href={`mailto:${settings?.email || "info@widad.health"}`}
                className="text-white/70 text-body-sm hover:text-primary transition-colors"
                title={settings?.email || "info@widad.health"}
              >
                {settings?.email || "info@widad.health"}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <a
                href={`tel:${settings?.phone || "+201234567890"}`}
                className="text-white/70 text-body-sm hover:text-primary transition-colors"
                dir="ltr"
              >
                {settings?.phone || "+20 123 456 7890"}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-white/70 text-body-sm">
                {settings?.address?.street ? `${settings.address.street}، ` : ""}
                {settings?.address?.city || "القاهرة"}، {settings?.address?.country || "مصر"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/20">
          <p className="text-white/60 text-body-sm">
            © {currentYear} {settings?.site_name || "وداد"} للصحة. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
