import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import landingService, {
  LandingPageData,
  LandingPageDynamicData,
  FAQ,
} from "../../services/landingService";
import {
  heroStaticContent,
  features,
  howItWorks,
  whyChooseUs,
  appDownload,
  ctaBanner,
  defaultFaqs,
  trustIndicatorIcons,
} from "../../data/landingPageStaticData";
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  LifeStagesSection,
  HowItWorksSection,
  WhyChooseUsSection,
  DoctorsSection,
  TestimonialsSection,
  ArticlesSection,
  CtaSection,
  FaqSection,
} from "../../components/landing";
import PublicHeader from "../../components/layout/PublicHeader";
import PublicFooter from "../../components/layout/PublicFooter";
import "./LandingPage.css";

/**
 * Merge static content with dynamic API data
 */
const buildPageData = (apiData: LandingPageDynamicData): LandingPageData => ({
  hero: {
    ...heroStaticContent,
    description: apiData.hero.description || heroStaticContent.description,
    image_url: apiData.hero.image_url,
    video_url: apiData.hero.video_url,
    trust_indicators: apiData.hero.trust_indicators.map((t) => ({
      icon: trustIndicatorIcons[t.key] || "ℹ️",
      value: t.value,
      label: t.label,
    })),
  },
  stats: apiData.stats,
  features,
  life_stages: apiData.life_stages,
  how_it_works: howItWorks,
  why_choose_us: whyChooseUs,
  featured_doctors: apiData.featured_doctors,
  testimonials: apiData.testimonials,
  recent_articles: apiData.recent_articles,
  app_download: appDownload,
  cta_banner: ctaBanner,
});

const LandingPage: React.FC = () => {
  const [data, setData] = useState<LandingPageData | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [apiData, faqsData] = await Promise.all([
          landingService.getLandingPageData(),
          landingService.getFaqs(),
        ]);
        setData(buildPageData(apiData));
        setFaqs(faqsData);
      } catch (err) {
        console.error("Error fetching landing page data:", err);
        setError("حدث خطأ في تحميل البيانات");
        // Use static data with empty dynamic sections as fallback
        setData(getDefaultData());
        setFaqs(defaultFaqs);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="landing-loading" dir="rtl">
        <div className="loading-spinner"></div>
        <p>جاري تحميل المنصة...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="landing-error" dir="rtl">
        <p>{error || "حدث خطأ غير متوقع"}</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>وداد - منصة صحة المرأة المصرية | رفيقك الصحي في كل مرحلة</title>
        <meta
          name="description"
          content="منصة رقمية متكاملة لدعم صحة المرأة المصرية. استشارات طبية متخصصة، متتبع الحمل، أدوات ذكية، ومقالات موثوقة من أفضل الأطباء."
        />
        <meta
          name="keywords"
          content="صحة المرأة, استشارات طبية, متتبع الحمل, أطباء نساء وتوليد, تتبع الدورة الشهرية, صحة الحامل"
        />
        <meta property="og:title" content="وداد - منصة صحة المرأة المصرية" />
        <meta
          property="og:description"
          content="رفيقك الصحي في كل مرحلة من حياتك. استشارات، متابعة، ومعلومات طبية موثوقة."
        />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ar_EG" />
        <link rel="canonical" href="https://widad.health" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            name: "وداد للصحة",
            description: "منصة رقمية متكاملة لدعم صحة المرأة المصرية",
            url: "https://widad.health",
            logo: "https://widad.health/logo.png",
            address: {
              "@type": "PostalAddress",
              addressCountry: "EG",
              addressLocality: "Cairo",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: ["Arabic", "English"],
            },
          })}
        </script>
      </Helmet>

      <div className="landing-page">
        <PublicHeader />

        <main>
          {/* Hero Section */}
          {data.hero && <HeroSection data={data.hero} />}

          {/* Stats Section */}
          {data.stats && <StatsSection data={data.stats} />}

          {/* Features Section */}
          {data.features && <FeaturesSection data={data.features} />}

          {/* Life Stages Section */}
          {data.life_stages && <LifeStagesSection data={data.life_stages} />}

          {/* How It Works Section */}
          {data.how_it_works && <HowItWorksSection data={data.how_it_works} />}

          {/* Why Choose Us Section */}
          {data.why_choose_us && (
            <WhyChooseUsSection data={data.why_choose_us} />
          )}

          {/* Featured Doctors Section */}
          {data.featured_doctors?.length > 0 && (
            <DoctorsSection data={data.featured_doctors} />
          )}

          {/* Testimonials Section */}
          {data.testimonials?.length > 0 && (
            <TestimonialsSection data={data.testimonials} />
          )}

          {/* Recent Articles Section */}
          {data.recent_articles?.length > 0 && (
            <ArticlesSection data={data.recent_articles} />
          )}

          {/* FAQ Section */}
          {faqs?.length > 0 && <FaqSection data={faqs} />}

          {/* CTA Section */}
          {data.cta_banner && <CtaSection data={data.cta_banner} />}
        </main>

        <PublicFooter />
      </div>
    </>
  );
};

// Fallback data when API is unreachable (static + empty dynamic)
const getDefaultData = (): LandingPageData => ({
  hero: {
    ...heroStaticContent,
    image_url: null,
    video_url: null,
    trust_indicators: [
      { icon: "👨‍⚕️", value: 0, label: "طبيب معتمد" },
      { icon: "👩", value: 0, label: "مستخدمة" },
      { icon: "⭐", value: "0%", label: "نسبة الرضا" },
    ],
  },
  stats: {
    total_users: 0,
    total_doctors: 0,
    total_consultations: 0,
    satisfaction_rate: 0,
    total_articles: 0,
  },
  features,
  life_stages: [],
  how_it_works: howItWorks,
  why_choose_us: whyChooseUs,
  featured_doctors: [],
  testimonials: [],
  recent_articles: [],
  app_download: appDownload,
  cta_banner: ctaBanner,
});

export default LandingPage;
