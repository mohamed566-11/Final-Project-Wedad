import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Calendar, Printer, Lock, Shield, ChevronLeft } from "lucide-react";
import publicService, { TermsPrivacy } from "../../services/publicService";
import Loading from "@/components/common/Loading";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import BackButton from "@/components/common/BackButton";
import { cn } from "@/lib/utils";



const DEFAULT_PRIVACY = `
    <h2 id="collection">1. جمع المعلومات</h2>
    <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل واستخدام خدماتنا.</p>

    <h2 id="use">2. استخدام المعلومات</h2>
    <p>نستخدم معلوماتك لتقديم خدماتنا وتحسينها وتخصيص تجربتك على المنصة.</p>

    <h2 id="sharing">3. مشاركة المعلومات</h2>
    <p>لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا بموافقتك أو وفقاً للقانون.</p>

    <h2 id="security">4. أمان البيانات</h2>
    <p>نستخدم أحدث تقنيات التشفير والأمان لحماية بياناتك الشخصية.</p>

    <h2 id="rights">5. حقوقك</h2>
    <p>يحق لك الوصول إلى بياناتك وتعديلها أو حذفها في أي وقت.</p>
`;

const PrivacyPolicy = () => {
  const [privacy, setPrivacy] = useState<TermsPrivacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<{ id: string; heading: string }[]>([]);

  // Cleanup potential markdown blocks user might paste
  const cleanContent = privacy?.content
    ? privacy.content.replace(/```html/g, "").replace(/```/g, "").trim()
    : DEFAULT_PRIVACY;

  const isHtml = /<[a-z][\s\S]*>/i.test(cleanContent);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        const container = document.getElementById("content-container");
        if (container) {
          const headings = container.querySelectorAll("h2, h3");
          const newSections: { id: string; heading: string }[] = [];
          headings.forEach((h, index) => {
            const id = h.id || `section-${index}`;
            h.id = id;
            newSections.push({ id, heading: (h as HTMLElement).innerText });
          });
          setSections(newSections);
        }
      }, 100);
    }
  }, [cleanContent, loading]);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        setLoading(true);
        const response = await publicService.getPrivacy();
        setPrivacy(response.data.data.privacy);
      } catch {
        setPrivacy({
          title: "سياسة الخصوصية",
          content: DEFAULT_PRIVACY,
          last_updated: new Date().toLocaleDateString("ar-EG"),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPrivacy();
  }, []);

  const handlePrint = () => window.print();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading size="lg" text="جاري تحميل سياسة الخصوصية..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>سياسة الخصوصية | منصة وداد الصحية</title>
        <meta name="description" content="سياسة الخصوصية الخاصة بمنصة وداد الصحية" />
      </Helmet>

      <PublicHeader />

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero */}
        <motion.section
          className="relative pt-32 pb-16 px-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/8 rounded-full blur-[100px]" />
          </div>
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="mb-4 text-right">
              <BackButton />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">وثيقة قانونية</p>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">سياسة الخصوصية</h1>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4 text-emerald-500" />
                آخر تحديث:{" "}
                {privacy?.last_updated || new Date().toLocaleDateString("ar-EG")}
              </span>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-500 font-medium bg-muted hover:bg-emerald-500/10 px-4 py-2 rounded-full transition-all"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Content */}
        <section className="pb-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">

              {/* Sidebar TOC */}
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:sticky lg:top-28 hidden lg:block"
              >
                  {sections.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-5">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">المحتويات</p>
                      <ul className="space-y-1">
                        {sections.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => scrollTo(s.id)}
                              className="w-full text-right flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 px-3 py-2 rounded-xl transition-all"
                            >
                              <ChevronLeft className="w-3 h-3 shrink-0" />
                              {s.heading}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <Shield className="w-6 h-6 text-emerald-500 mb-3" />
                  <p className="text-xs font-bold text-foreground mb-1">خصوصيتك أولاً</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    لا نبيع بياناتك ولا نشاركها بدون موافقتك.
                  </p>
                </div>
              </motion.aside>

              {/* Main content */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border rounded-3xl overflow-hidden"
              >
                <div
                  id="content-container"
                  className={cn(
                    "p-8 md:p-12",
                    "prose prose-lg max-w-none",
                    "[&_h2]:text-foreground [&_h2]:font-black [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-3 [&_h2]:border-b [&_h2]:border-border",
                    "[&_h3]:text-foreground [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3",
                    "[&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:text-base [&_p]:mb-4",
                    "[&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_li]:text-base",
                    "[&_strong]:text-foreground [&_a]:text-emerald-500 [&_a:hover]:underline",
                  )}
                  style={{ whiteSpace: isHtml ? "normal" : "pre-wrap" }}
                  dangerouslySetInnerHTML={{ __html: cleanContent }}
                />
              </motion.article>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </>
  );
};

export default PrivacyPolicy;
