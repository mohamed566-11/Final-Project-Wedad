import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Search,
  Filter,
  BookOpen,
  TrendingUp,
  Clock,
  ArrowLeft,
  ArrowRight,
  Zap,
  Calendar,
  Sparkles,
  X,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import ArticleCard from "@/components/articles/ArticleCard";
import ArticleCardSkeleton from "@/components/articles/ArticleCardSkeleton";
import SEO from "@/components/common/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/common/BackButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePublicArticles,
  useLifeStages,
} from "@/hooks/usePatientQueries";
import { cn } from "@/lib/utils";

const ArticlesList = () => {
  const { tag } = useParams<{ tag: string }>();
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Actual term sent to API
  const [lifeStageId, setLifeStageId] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "reading_time">(
    "latest",
  );
  const [currentPage, setCurrentPage] = useState(1);

  // React Query Hooks
  const {
    data: articlesResponse,
    isLoading: loading,
    isPlaceholderData,
  } = usePublicArticles({
    page: currentPage,
    life_stage_id: lifeStageId ? parseInt(lifeStageId) : undefined,
    sort_by: sortBy,
    search: searchTerm || undefined,
    tag: tag || undefined,
  });

  const { data: lifeStagesResponse } = useLifeStages();

  const articles = articlesResponse?.articles || [];
  const featuredArticles = articlesResponse?.featured_articles || [];
  const pagination = articlesResponse?.pagination || { last_page: 1 };
  const lifeStages = lifeStagesResponse?.life_stages || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchTerm(search);
  };

  const handleLifeStageChange = (value: string) => {
    setLifeStageId(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      <SEO
        title={
          searchTerm
            ? `نتائج البحث عن ${searchTerm}`
            : tag
              ? `مقالات # ${tag}`
              : "المكتبة الطبية - مقالات وداد"
        }
        description="تصفحي أحدث المقالات الطبية الموثوقة من أطباء متخصصين في صحة المرأة والطفل والأسرة."
      />

      <PublicHeader darkHero />

      {/* Hero Section */}
      <div className="relative bg-foreground overflow-hidden pt-32 pb-24">
        {/* Visual Decorations */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -mr-36 -mt-36 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -ml-24 -mb-24 opacity-60"></div>

        <div className="container max-w-5xl mx-auto px-6 relative z-10">
          <div className="mb-4 text-right">
            <BackButton className="text-white/80 hover:text-white" />
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6"
            >
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-bold text-border uppercase tracking-widest leading-none">
                المكتبة الطبية
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight text-white tracking-tight"
            >
              دليلِك المعرفي لـ{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-100">
                حياة صحية
              </span>{" "}
              أفضل
            </motion.h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              تصفحي أحدث المقالات الطبية الموثوقة من أطباء متخصصين في صحة المرأة
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
              <div className="relative flex items-center bg-white rounded-[24px] p-2 shadow-xl shadow-primary/10 border border-white/20">
                <Search className="w-5 h-5 text-muted-foreground mr-4 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحثي عن موضوع طبي، مرض، أو نصيحة..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder-muted-foreground font-bold px-2 h-12 text-base outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchTerm("");
                    }}
                    className="p-2 text-border hover:text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  className="rounded-[18px] bg-foreground hover:bg-foreground text-white px-8 h-12 text-base font-bold transition-all shrink-0 hover:shadow-lg hover:shadow-slate-900/20"
                >
                  بحث
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-6 pb-20 -mt-8 relative z-20">
        {/* Filter & Sort Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-lg shadow-border/50 border border-border p-2 pl-3 mb-10 flex flex-col lg:flex-row gap-3 items-center justify-between sticky top-24 z-40 transition-all duration-300"
        >
          <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar scroll-smooth p-1">
            <div className="flex items-center gap-2 text-primary px-4 bg-primary-50 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider">
              <Filter className="w-4 h-4" />
              <span>تصفية</span>
            </div>
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => handleLifeStageChange("")}
                className={cn(
                  "px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300",
                  lifeStageId === ""
                    ? "bg-foreground text-white shadow-md shadow-slate-900/20"
                    : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                الكل
              </button>
              {lifeStages.map((stage: any) => (
                <button
                  key={stage.id}
                  onClick={() => handleLifeStageChange(String(stage.id))}
                  className={cn(
                    "px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap",
                    lifeStageId === String(stage.id)
                      ? "bg-foreground text-white shadow-md shadow-slate-900/20"
                      : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {stage.name_ar}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto shrink-0">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as typeof sortBy)}
            >
              <SelectTrigger className="w-full lg:w-[220px] rounded-2xl border-border bg-muted transition-colors h-12 font-bold text-foreground/80 hover:bg-white hover:border-border">
                <SelectValue placeholder="الفلترة والترتيب" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border shadow-xl p-2">
                <SelectItem
                  value="latest"
                  className="rounded-xl py-3 cursor-pointer focus:bg-primary-50 focus:text-primary-700 font-medium"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>الأحدث أولاً</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="popular"
                  className="rounded-xl py-3 cursor-pointer focus:bg-primary-50 focus:text-primary-700 font-medium"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>الأكثر قراءة</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="reading_time"
                  className="rounded-xl py-3 cursor-pointer focus:bg-primary-50 focus:text-primary-700 font-medium"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>وقت القراءة</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <div className="w-full">
          {/* Main Content Column */}
          <div className="w-full">
            {/* Featured Section Redesigned */}
            <AnimatePresence mode="wait">
              {featuredArticles.length > 0 &&
                currentPage === 1 &&
                !searchTerm &&
                !tag && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-10"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-foreground leading-none mb-1">
                          مقالات مختارة
                        </h2>
                        <p className="text-sm text-muted-foreground font-bold mt-1">
                          قصص ونصائح تهمك اليوم
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {featuredArticles
                        .slice(0, 2)
                        .map((article: any, idx: number) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            variant="featured"
                          />
                        ))}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Articles Grid Overview */}
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-black text-foreground leading-tight mb-2">
                    {searchTerm
                      ? `نتائج البحث عن "${searchTerm}"`
                      : "أحدث المقالات"}
                  </h2>
                  <p className="text-muted-foreground font-bold">
                    تصفحي مكتبتنا الطبية المتجددة
                  </p>
                </div>
                {pagination.total > 0 && (
                  <span className="text-muted-foreground font-bold text-sm bg-muted/50 px-5 py-2.5 rounded-2xl border border-border">
                    {pagination.total} مقال متاح
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-white rounded-xl h-[320px]"
                    ></div>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {articles.map((article: any, idx: number) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (idx % 3) * 0.1 }}
                      >
                        <ArticleCard article={article} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Premium Pagination */}
                  {pagination.last_page > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-16">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1 || isPlaceholderData}
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          window.scrollTo(0, 0);
                        }}
                        className="w-12 h-12 rounded-2xl border-none bg-white shadow-lg hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                      >
                        <ArrowRight className="w-5 h-5 translate-x-1" />
                      </Button>

                      <div className="px-6 py-2.5 bg-white rounded-2xl shadow-sm font-semibold text-foreground/80 flex items-center gap-2">
                        <span className="text-primary">{currentPage}</span>
                        <span className="text-border">/</span>
                        <span>{pagination.last_page}</span>
                      </div>

                      <Button
                        variant="outline"
                        disabled={
                          currentPage === pagination.last_page ||
                          isPlaceholderData
                        }
                        onClick={() => {
                          setCurrentPage((p) => p + 1);
                          window.scrollTo(0, 0);
                        }}
                        className="w-12 h-12 rounded-2xl border-none bg-white shadow-lg hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                      >
                        <ArrowLeft className="w-5 h-5 -translate-x-1" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-border"
                >
                  <div className="bg-muted w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Search className="w-8 h-8 text-border" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    لم يتم العثور على نتائج
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto font-medium">
                    {searchTerm
                      ? `للأسف لم نجد أي مقالة تتحدث عن موضوعك، جربي البحث بكلمات أخرى للوصول لنتائج أفضل.`
                      : "لم يتم نشر أي مقالات في هذا القسم بعد، تابعينا للجديد قريباً!"}
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => {
                        setSearch("");
                        setSearchTerm("");
                        window.location.href = "/articles";
                      }}
                      className="rounded-xl bg-primary hover:bg-primary-700 px-8 h-11 font-semibold"
                    >
                      عرض كل المقالات
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>


        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default ArticlesList;
