import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Stethoscope,
  Award,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import landingService, { LandingPageStats } from "@/services/landingService";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { DoctorCard } from "@/components/consultations/DoctorCard";
import { Doctor } from "@/services/consultationService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLifeStages } from "@/hooks/usePatientQueries";
import BackButton from "@/components/common/BackButton";

const DoctorsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LandingPageStats | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: lifeStagesResponse } = useLifeStages();
  const lifeStages = lifeStagesResponse?.life_stages || [];

  const currentFilter = searchParams.get("life_stage") || "all";
  const currentSort = searchParams.get("sort") || "rating";
  const currentSearch = searchParams.get("search") || "";

  useEffect(() => {
    setSearchTerm(currentSearch);
    fetchDoctors();
    fetchStats();
  }, [searchParams]);

  const fetchStats = async () => {
    try {
      const response = await landingService.getStats();
      setStats(response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await landingService.getAllDoctors({
        life_stage_id: currentFilter === "all" ? undefined : currentFilter,
        sort: currentSort,
        search: currentSearch || undefined,
        page: parseInt(searchParams.get("page") || "1"),
      });

      const mappedDoctors: Doctor[] = response.doctors.map((doc: any) => ({
        ...doc,
        verified_badge:
          doc.verification_status === "verified" ||
          doc.verification_status === "approved",
      }));

      setDoctors(mappedDoctors);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm) newParams.set("search", searchTerm);
    else newParams.delete("search");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") newParams.set(key, value);
    else newParams.delete(key);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-muted/50" dir="rtl">
      <Helmet>
        <title>أطباؤنا | وداد للصحة</title>
        <meta
          name="description"
          content="تصفحي قائمة أطبائنا المعتمدين واحجزي استشارتك الآن."
        />
      </Helmet>

      <PublicHeader darkHero />

      {/* Hero Section - More Compact & Premium */}
      <div className="relative bg-foreground pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
        </div>

        <div className="container max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="mb-4 text-right">
            <BackButton />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-semibold text-border uppercase tracking-widest leading-none">
              نخبة من الأطباء المعتمدين
            </span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
            استشارات طبية بمستوى <span className="text-primary">عالمي</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            اختاري من بين أفضل الأطباء المعتمدين في مختلف التخصصات الطبية،
            واحجزي استشارتك بكل سهولة وأمان
          </p>

          {/* Search Bar - Sleek */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <div className="relative flex items-center bg-white rounded-[24px] p-2 shadow-2xl shadow-primary/10">
              <Search className="w-5 h-5 text-muted-foreground mr-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحثي باسم الطبيب أو التخصص..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder-border font-medium px-2 h-12 outline-none"
              />
              <Button
                type="submit"
                className="rounded-2xl bg-foreground hover:bg-foreground text-white px-8 h-12 font-bold transition-all"
              >
                بحث
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 pb-24 -mt-10 relative z-20">
        {/* Stats Section - More Integrated */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: Award,
              label: "طبيب معتمد",
              value: stats ? `+${stats.doctors.verified}` : "...",
            },
            {
              icon: HeartPulse,
              label: "استشارة ناجحة",
              value: stats ? `+${stats.consultations.total}` : "...",
            },
            {
              icon: Stethoscope,
              label: "تخصص طبي",
              value: stats
                ? (stats as any).specializations?.total || "15"
                : "...",
              className: "hidden md:flex",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={cn(
                "bg-white p-5 rounded-2xl shadow-sm border border-border items-center gap-4",
                stat.className || "flex",
              )}
            >
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
                <stat.icon size={22} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Row - Compact & Modern */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 w-full md:w-auto no-scrollbar">
            <button
              onClick={() => handleFilterChange("life_stage", "all")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                currentFilter === "all"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white text-muted-foreground hover:bg-muted border border-border",
              )}
            >
              الكل
            </button>
            {lifeStages.map((stage: any) => (
              <button
                key={stage.id}
                onClick={() =>
                  handleFilterChange("life_stage", String(stage.id))
                }
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                  currentFilter === String(stage.id)
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white text-muted-foreground hover:bg-muted border border-border",
                )}
              >
                {stage.name_ar}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select
              value={currentSort}
              onValueChange={(v) => handleFilterChange("sort", v)}
            >
              <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl border-border bg-white font-medium shadow-sm">
                <SelectValue placeholder="رتب حسب" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="rating" className="font-medium">
                  الأعلى تقييماً
                </SelectItem>
                <SelectItem value="consultations" className="font-medium">
                  الأكثر استشارات
                </SelectItem>
                <SelectItem value="experience" className="font-medium">
                  الأكثر خبرة
                </SelectItem>
                <SelectItem value="price_low" className="font-medium">
                  الأقل سعراً
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 h-80 animate-pulse border border-border"
              >
                <div className="h-20 bg-muted rounded-xl mb-6"></div>
                <div className="h-4 bg-muted rounded-full w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded-full w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doctor, idx) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: idx * 0.1,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                >
                  <DoctorCard doctor={doctor} isPublic={true} />
                </motion.div>
              ))}
            </div>

            {/* Pagination - Simplified */}
            {pagination.last_page > 1 && (
              <div className="flex justify-center gap-3 mt-16">
                <Button
                  variant="outline"
                  disabled={pagination.current_page === 1}
                  onClick={() =>
                    handleFilterChange(
                      "page",
                      String(pagination.current_page - 1),
                    )
                  }
                  className="rounded-2xl h-12 border-border font-bold"
                >
                  السابق
                </Button>
                <div className="flex items-center px-6 bg-white rounded-2xl border border-border font-semibold text-sm">
                  صفحة {pagination.current_page} من {pagination.last_page}
                </div>
                <Button
                  variant="outline"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() =>
                    handleFilterChange(
                      "page",
                      String(pagination.current_page + 1),
                    )
                  }
                  className="rounded-2xl h-12 border-border font-bold"
                >
                  التالي
                </Button>
              </div>
            )}
          </>
        )}

        {doctors.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6 text-border">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              لا توجد نتائج مطابقة
            </h3>
            <p className="text-muted-foreground font-medium mb-6">
              حاولي تغيير معايير البحث أو مسح الفلاتر
            </p>
            <Button
              onClick={() => {
                setSearchParams(new URLSearchParams());
                setSearchTerm("");
              }}
              className="rounded-xl h-11 px-8 bg-foreground font-semibold"
            >
              مسح الفلاتر
            </Button>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
};

export default DoctorsListPage;
