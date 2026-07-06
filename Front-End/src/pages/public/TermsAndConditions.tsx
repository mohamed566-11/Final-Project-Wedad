import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Calendar, Printer, FileText, Shield, ChevronLeft } from "lucide-react";
import publicService, { TermsPrivacy } from "../../services/publicService";
import Loading from "@/components/common/Loading";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import BackButton from "@/components/common/BackButton";
import { cn } from "@/lib/utils";



const DEFAULT_TERMS = `
    <h2 id="acceptance">1. القبول بالشروط</h2>
    <p>باستخدامك لمنصة وداد الصحية، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>

    <h2 id="usage">2. استخدام المنصة</h2>
    <p>يجب أن يكون عمرك 18 سنة على الأقل لاستخدام خدماتنا. أنت مسؤول عن الحفاظ على سرية حسابك.</p>

    <h2 id="consultations">3. الاستشارات الطبية</h2>
    <p>الاستشارات المقدمة عبر المنصة هي للإرشاد العام ولا تغني عن الفحص الطبي المباشر.</p>

    <h2 id="privacy">4. الخصوصية والبيانات</h2>
    <p>نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية وفقاً لسياسة الخصوصية الخاصة بنا.</p>

    <h2 id="ip">5. حقوق الملكية الفكرية</h2>
    <p>جميع المحتويات المنشورة على المنصة محمية بحقوق الملكية الفكرية.</p>
`;

const TermsAndConditions = () => {
  const [terms, setTerms] = useState<TermsPrivacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<{ id: string; heading: string }[]>([]);

  // Cleanup potential markdown blocks user might paste
  const cleanContent = terms?.content
    ? terms.content.replace(/```html/g, "").replace(/```/g, "").trim()
    : DEFAULT_TERMS;

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
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const response = await publicService.getTerms();
        setTerms(response.data.data.terms);
      } catch {
        setTerms({
          title: "الشروط والأحكام",
          content: DEFAULT_TERMS,
          last_updated: new Date().toLocaleDateString("ar-EG"),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handlePrint = () => window.print();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading size="lg" text="جاري تحميل الشروط والأحكام..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>الشروط والأحكام | منصة وداد الصحية</title>
        <meta name="description" content="الشروط والأحكام الخاصة باستخدام منصة وداد الصحية" />
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
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/8 rounded-full blur-[100px]" />
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
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-widest">وثيقة قانونية</p>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">الشروط والأحكام</h1>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4 text-primary" />
                آخر تحديث:{" "}
                {terms?.last_updated || new Date().toLocaleDateString("ar-EG")}
              </span>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium bg-muted hover:bg-primary/10 px-4 py-2 rounded-full transition-all"
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
                              className="w-full text-right flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-xl transition-all"
                            >
                              <ChevronLeft className="w-3 h-3 shrink-0" />
                              {s.heading}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                <div className="mt-4 bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <Shield className="w-6 h-6 text-primary mb-3" />
                  <p className="text-xs font-bold text-foreground mb-1">بياناتك محمية</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    نلتزم بحماية خصوصيتك وفق أعلى معايير الأمان.
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
                    // Theme-safe typography overrides
                    "[&_h2]:text-foreground [&_h2]:font-black [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-3 [&_h2]:border-b [&_h2]:border-border",
                    "[&_h3]:text-foreground [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3",
                    "[&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:text-base [&_p]:mb-4",
                    "[&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_li]:text-base",
                    "[&_strong]:text-foreground [&_a]:text-primary [&_a:hover]:underline",
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

export default TermsAndConditions;
