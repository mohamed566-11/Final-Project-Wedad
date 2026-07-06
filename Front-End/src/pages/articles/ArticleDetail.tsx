import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Eye,
  Calendar,
  User,
  BookOpen,
  Star,
  Type,
  Bookmark,
  Share2,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { getArticleBySlug, Article } from "@/services/articleService";
import ArticleCard from "@/components/articles/ArticleCard";
import ReadingProgress from "@/components/articles/ReadingProgress";
import ShareButtons from "@/components/articles/ShareButtons";
import SEO from "@/components/common/SEO";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import BackButton from "@/components/common/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/utils";

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(19);

  useEffect(() => {
    if (slug) {
      fetchArticle();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getArticleBySlug(slug!);
      setArticle(response.data.article);
      setRelatedArticles(response.data.related_articles || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "المقال غير موجود");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8"
        dir="rtl"
      >
        <div className="w-full max-w-4xl space-y-8">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-12 w-3/4 rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full rounded-[40px]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div
        className="min-h-screen bg-muted flex items-center justify-center p-4"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-12 rounded-3xl shadow-2xl shadow-slate-900/5"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-rose-300" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || "المقال غير موجود"}
          </h1>
          <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
            عذراً، لم نتمكن من الوصول لهذه الصفحة. قد يكون الرابط خاطئاً أو تم
            نقل المقال.
          </p>
          <Link to="/articles">
            <Button className="bg-primary hover:bg-primary-700 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20">
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة للمقالات العلمية
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      <SEO
        title={article.title}
        description={article.excerpt || article.title}
        image={article.image_url || undefined}
        type="article"
        author={article.doctor?.name}
        publishedTime={article.published_at || undefined}
        modifiedTime={article.updated_at}
      />
      <ReadingProgress />
      <PublicHeader />

      {/* Premium Header / Hero */}
      <header className="relative pt-32 pb-12 bg-gradient-to-b from-primary-50/50 to-transparent">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="mb-4 text-right">
            <BackButton />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-4"
          >
            <div className="mb-2">
              <Breadcrumbs
                items={[
                  { label: "المكتبة الطبية", path: "/articles" },
                  { label: article.title },
                ]}
                className="bg-primary/5 border-primary/10 text-foreground shadow-none text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {article.life_stage && (
                <Badge className="bg-primary border-none text-white px-3 py-1 rounded-lg font-semibold shadow-md shadow-primary/20 text-[10px]">
                  {article.life_stage.name_ar}
                </Badge>
              )}

            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground leading-[1.15] tracking-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-medium text-muted-foreground pt-2">
              {article.doctor && (
                <div className="flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={
                        article.doctor.image_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(article.doctor.name)}`
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>د. {article.doctor.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {article.reading_time_text || `${article.reading_time} دقائق`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{article.published_date_human}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>{article.views_count} مشاهدة</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-4xl pb-32">
        {/* Featured Image Large */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16 relative group"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl transform -rotate-2"></div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 aspect-[21/9]">
            <img
              src={
                article.image_url ||
                `https://picsum.photos/seed/${article.id}/1200/600`
              }
              alt={article.title}
              className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
              style={{ transitionDuration: "10s" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Floating Side Tools (Desktop Only) */}
          <aside className="lg:col-span-1 border-gray-100 sticky top-32 flex flex-col items-center gap-8 order-2 lg:order-1 hidden lg:flex">
            <div className="flex flex-col gap-4 text-border">
              <button className="w-11 h-11 rounded-xl bg-white shadow-md shadow-slate-900/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="w-11 h-11 rounded-xl bg-white shadow-md shadow-slate-900/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300">
                <Share2 className="w-5 h-5" />
              </button>
              <div className="w-px h-12 bg-muted/50 mx-auto"></div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setFontSize((s) => Math.min(26, s + 2))}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary font-bold"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary font-bold"
                >
                  A-
                </button>
              </div>
            </div>
          </aside>

          {/* Article Content Area */}
          <div className="lg:col-span-11 order-1 lg:order-2">
            {/* Premium Excerpt Card */}
            <div className="mb-10 p-8 bg-white border border-primary-50 rounded-3xl shadow-lg shadow-slate-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-primary rounded-full"></div>
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                ملخص المقال
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed italic text-base">
                {article.excerpt}
              </p>
            </div>

            {/* Main Body Content */}
            <article className="prose prose-teal max-w-none">
              <div
                className="article-content-premium text-foreground/80 font-medium leading-[2.1] leading-relaxed"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: article.content || "" }}
              />
            </article>

            {/* Engagement Tools (Mobile & Bottom) */}
            <div className="mt-16 pt-12 border-t border-border flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-muted-foreground text-sm">
                  مشاركة المقال:
                </span>
                <ShareButtons
                  url={`/articles/${article.slug}`}
                  title={article.title}
                />
              </div>
            </div>

            {/* Author Elaborate Card */}
            {article.doctor && (
              <div className="mt-20">
                <Card className="overflow-hidden border-none shadow-lg shadow-slate-900/5 bg-muted rounded-3xl">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-right">
                      <div className="relative shrink-0">
                        <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg ring-1 ring-primary/10">
                          <img
                            src={
                              article.doctor.image_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(article.doctor.name)}&background=random`
                            }
                            alt={article.doctor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -left-2 bg-primary text-white p-2 rounded-xl shadow-md">
                          <Star className="w-3.5 h-3.5 fill-white" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-2xl font-bold text-foreground mb-1">
                          {article.doctor.name}
                        </h4>
                        <p className="text-primary font-semibold text-sm mb-4">
                          {article.doctor.specialization_ar}
                        </p>
                        <p className="text-muted-foreground font-medium mb-6 leading-relaxed max-w-2xl">
                          {article.doctor.bio ||
                            "طبيب متخصص يسعى لنشر الوعي الصحي من خلال مقالات علمية مبسطة ودقيقة."}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mb-6">
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-xs text-muted-foreground font-medium">
                              مشاهدات
                            </span>
                            <span className="text-lg font-bold text-foreground">
                              12k+
                            </span>
                          </div>
                          <div className="w-px h-8 bg-border hidden md:block"></div>
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-xs text-muted-foreground font-medium">
                              سنوات الخبرة
                            </span>
                            <span className="text-lg font-bold text-foreground">
                              {article.doctor.years_of_experience || 10}+
                            </span>
                          </div>
                          <div className="w-px h-8 bg-border hidden md:block"></div>
                          <div className="flex flex-col items-center md:items-start">
                            <span className="text-xs text-muted-foreground font-medium">
                              تقييم المرضى
                            </span>
                            <span className="text-lg font-bold text-foreground">
                              {article.doctor.rating || 4.9}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          <Link to={`/doctors/${article.doctor.id}`}>
                            <Button className="rounded-xl h-12 px-6 bg-white text-primary border-2 border-border hover:border-primary-200 hover:bg-primary-50 font-semibold shadow-md shadow-slate-900/5 transition-all">
                              الملف الطبي الكامل
                            </Button>
                          </Link>
                          <Link
                            to={`/patient/consultations/book/${article.doctor.id}`}
                          >
                            <Button className="rounded-xl h-12 px-8 bg-primary hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary/20 transition-all">
                              حجز استشارة فورية
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Related Articles Section Redesigned */}
        {relatedArticles.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-1 bg-primary rounded-full"></div>
              <h2 className="text-2xl font-bold text-foreground leading-none">
                مقالات <span className="text-primary">ذات صلة</span> تهمك
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Premium Scroll Top Button */}
      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-10 left-10 w-14 h-14 bg-white text-primary rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-center transition-all z-50 border border-border"
      >
        <ArrowRight className="w-6 h-6 rotate-90" />
      </motion.button>

      {/* Article Content Styles Improved */}
      <style>{`
                .article-content-premium h1,
                .article-content-premium h2,
                .article-content-premium h3,
                .article-content-premium h4 {
                  color: hsl(var(--foreground));
                  margin-top: 3.5rem;
                  margin-bottom: 1.5rem;
                  font-weight: 900;
                  line-height: 1.25;
                }
                .article-content-premium h2 { font-size: 2.25rem; border-right: 6px solid hsl(var(--primary-400)); padding-right: 1.25rem; }
                .article-content-premium h3 { font-size: 1.75rem; }
                .article-content-premium p {
                  margin-bottom: 2rem;
                  color: hsl(var(--muted-foreground));
                }
                .article-content-premium ul,
                .article-content-premium ol {
                  margin: 2rem 0;
                  padding-right: 2rem;
                  list-style-type: none;
                }
                .article-content-premium li {
                  margin-bottom: 1rem;
                  position: relative;
                }
                .article-content-premium ul li::before {
                  content: "";
                  position: absolute;
                  right: -1.75rem;
                  top: 0.75rem;
                  width: 8px;
                  height: 8px;
                  background-color: hsl(var(--primary-400));
                  border-radius: 4px;
                }
                .article-content-premium blockquote {
                  background: hsl(var(--primary-50));
                  border-right: 8px solid hsl(var(--primary));
                  font-size: 1.5rem;
                  font-weight: 700;
                  font-style: italic;
                  padding: 2.5rem;
                  margin: 4rem 0;
                  border-radius: 2rem;
                  color: hsl(var(--primary-900));
                }
                .article-content-premium img {
                  border-radius: 2.5rem;
                  margin: 3.5rem auto;
                  max-width: 100%;
                  box-shadow: 0 25px 50px -12px hsl(var(--primary) / 0.1);
                }
                .article-content-premium a {
                  color: hsl(var(--primary));
                  font-weight: 800;
                  text-decoration-thickness: 2px;
                  text-underline-offset: 4px;
                  border-bottom: 2px solid hsl(var(--primary-200));
                  transition: all 0.2s;
                }
                .article-content-premium a:hover {
                  background: hsl(var(--primary-50));
                  border-bottom-color: hsl(var(--primary));
                }
            `}</style>
      <PublicFooter />
    </div>
  );
};

export default ArticleDetail;
