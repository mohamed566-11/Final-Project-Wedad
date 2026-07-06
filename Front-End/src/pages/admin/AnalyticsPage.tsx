import React, { useState } from "react";
import {
  Users,
  Stethoscope,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import Card from "@/components/common/Card";
import {
  useAnalyticsOverview,
  useUsersAnalytics,
  useConsultationsAnalytics,
  useFinancialsAnalytics,
  useArticlesAnalytics,
} from "@/hooks/useAdminQueries";
import { cn } from "@/lib/utils";

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "consultations" | "financials" | "articles"
  >("overview");

  // Queries
  const { data: overviewResponse, isLoading: isOverviewLoading } =
    useAnalyticsOverview();
  const { data: usersResponse, isLoading: isUsersLoading } =
    useUsersAnalytics();
  const { data: consultationsResponse, isLoading: isConsultationsLoading } =
    useConsultationsAnalytics();
  const { data: financialsResponse, isLoading: isFinancialsLoading } =
    useFinancialsAnalytics();
  const { data: articlesResponse, isLoading: isArticlesLoading } =
    useArticlesAnalytics();

  const isLoading =
    (activeTab === "overview" && isOverviewLoading) ||
    (activeTab === "users" && isUsersLoading) ||
    (activeTab === "consultations" && isConsultationsLoading) ||
    (activeTab === "financials" && isFinancialsLoading) ||
    (activeTab === "articles" && isArticlesLoading);

  const overview = (overviewResponse as any)?.data || {};
  const totals = overview.totals || {};
  const last30 = overview.last_30_days || {};
  const heatmap = overview.activity_heatmap || {};

  const usersData = (usersResponse as any)?.data || {};
  const consultationsData = (consultationsResponse as any)?.data || {};
  const financialsData = (financialsResponse as any)?.data || {};
  const articlesData = (articlesResponse as any)?.data || {};

  const StatCard = ({
    title,
    value,
    subLabel,
    icon: Icon,
    colorTheme = "violet",
  }: any) => {
    // Determine styles based on colorTheme
    const themes: Record<string, { bg: string; text: string; glow: string }> = {
      violet: {
        bg: "from-violet-400/20 to-violet-500/20",
        text: "text-violet-600 dark:text-violet-400",
        glow: "bg-violet-500/20 dark:bg-violet-500/10",
      },
      emerald: {
        bg: "from-emerald-400/20 to-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        glow: "bg-emerald-500/20 dark:bg-emerald-500/10",
      },
      blue: {
        bg: "from-blue-400/20 to-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        glow: "bg-blue-500/20 dark:bg-blue-500/10",
      },
      amber: {
        bg: "from-amber-400/20 to-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        glow: "bg-amber-500/20 dark:bg-amber-500/10",
      },
      rose: {
        bg: "from-rose-400/20 to-rose-500/20",
        text: "text-rose-600 dark:text-rose-400",
        glow: "bg-rose-500/20 dark:bg-rose-500/10",
      },
    };

    const theme = themes[colorTheme] || themes.violet;

    return (
      <Card
        variant="elevated"
        className="relative p-6 overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl"
      >
        <div
          className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700",
            theme.glow,
          )}
        ></div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-muted-foreground font-medium text-sm mb-2 opacity-80">
              {title}
            </p>
            <h4 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm flex items-end gap-1">
              {typeof value === "number" ? value.toLocaleString() : value || 0}
            </h4>
          </div>
          <div
            className={cn(
              "p-3 rounded-2xl bg-gradient-to-br shadow-inner",
              theme.bg,
              theme.text,
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {subLabel && (
          <div
            className={cn(
              "relative z-10 mt-4 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit",
              colorTheme === "rose"
                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : `bg-${colorTheme}-50 dark:bg-${colorTheme}-500/10 ${theme.text}`,
            )}
          >
            {subLabel.includes("+") ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : subLabel.includes("-") ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            {subLabel}
          </div>
        )}
      </Card>
    );
  };

  const tabsList = [
    { id: "overview", label: "نظرة عامة", icon: Activity },
    { id: "users", label: "المستخدمين", icon: Users },
    { id: "consultations", label: "الاستشارات", icon: Calendar },
    { id: "financials", label: "المالية", icon: DollarSign },
    { id: "articles", label: "المقالات", icon: FileText },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">تحليلات المنصة</h1>
          <p className="text-muted-foreground">
            متابعة أداء المنصة والإحصائيات العامة
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-[1px]">
        {tabsList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-muted-foreground hover:text-foreground/80",
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && Object.keys(overview).length > 0 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="إجمالي المرضى"
                  value={totals.patients}
                  subLabel={`+${last30.new_patients} في آخر 30 يوم`}
                  icon={Users}
                  colorTheme="blue"
                />
                <StatCard
                  title="إجمالي الأطباء"
                  value={totals.doctors}
                  subLabel={`+${last30.new_doctors} في آخر 30 يوم`}
                  icon={Stethoscope}
                  colorTheme="emerald"
                />
                <StatCard
                  title="إجمالي الاستشارات"
                  value={totals.consultations}
                  subLabel={`+${last30.consultations} في آخر 30 يوم`}
                  icon={Calendar}
                  colorTheme="violet"
                />
                <StatCard
                  title="إجمالي الإيرادات"
                  value={
                    <>
                      {totals.revenue?.toLocaleString()}{" "}
                      <span className="text-sm font-medium mr-1 opacity-70">
                        ج.م
                      </span>
                    </>
                  }
                  subLabel={`+${last30.revenue?.toLocaleString()} ج.م في آخر 30 يوم`}
                  icon={DollarSign}
                  colorTheme="amber"
                />
              </div>

              <Card
                variant="elevated"
                className="p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">
                    نشاط آخر 7 أيام
                  </h3>
                  <div className="p-2 bg-muted rounded-xl text-muted-foreground">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right bg-white/40 dark:bg-slate-950/40 rounded-xl overflow-hidden border border-border/50">
                    <thead className="bg-muted/50 border-b border-border/50">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-foreground/80">
                          التاريخ
                        </th>
                        <th className="px-6 py-4 font-semibold text-foreground/80">
                          المستخدمين النشطين
                        </th>
                        <th className="px-6 py-4 font-semibold text-foreground/80">
                          الاستشارات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {Object.entries(heatmap)
                        .reverse()
                        .map(([date, stats]: [string, any], index) => (
                          <tr
                            key={date}
                            className="hover:bg-muted/40 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-muted-foreground" dir="ltr">
                              {date}
                            </td>
                            <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                              {stats.users?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 font-bold text-violet-600 dark:text-violet-400">
                              {stats.consultations?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  variant="elevated"
                  className="p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl"
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-500" />
                    توزيع الأعمار
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(
                      usersData?.demographics?.age_groups || {},
                    ).map(([group, pct]: any) => (
                      <div key={group}>
                        <div className="flex justify-between text-sm mb-1 text-muted-foreground font-medium">
                          <span>{group} سنة</span>
                          <span className="text-foreground font-bold">{pct}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  className="p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl"
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500" />
                    تفاعل المستخدمين
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        متوسط نشاط يومي
                      </span>
                      <span className="text-xl font-bold">
                        {usersData?.growth?.active_users?.daily_average?.toLocaleString()}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          مستخدم
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        وقت الذروة
                      </span>
                      <span className="font-bold text-foreground bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-lg" dir="ltr">
                        {usersData?.growth?.active_users?.peak_time}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* CONSULTATIONS TAB */}
          {activeTab === "consultations" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="معدل الإكمال"
                  value={consultationsData?.completion_rate !== undefined ? `${consultationsData.completion_rate}%` : '0%'}
                  icon={CheckCircle}
                  colorTheme="emerald"
                />
                <StatCard
                  title="معدل الإلغاء"
                  value={consultationsData?.cancellation_rate !== undefined ? `${consultationsData.cancellation_rate}%` : '0%'}
                  icon={XCircle}
                  colorTheme="rose"
                />
                <StatCard
                  title="متوسط التقييم"
                  value={consultationsData?.average_rating !== undefined ? `${consultationsData.average_rating} / 5` : '0 / 5'}
                  icon={ArrowUpRight}
                  colorTheme="amber"
                />
              </div>
              <Card
                variant="elevated"
                className="p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl"
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-violet-500" />
                  الاستشارات حسب التخصص
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
                    consultationsData?.by_specialization || {},
                  ).map(([spec, count]: any) => (
                    <div
                      key={spec}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm flex justify-between items-center"
                    >
                      <span className="font-medium text-muted-foreground">
                        {spec}
                      </span>
                      <span className="text-xl font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-3 py-1 rounded-full">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* FINANCIALS TAB */}
          {activeTab === "financials" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="متوسط دخل الاستشارة"
                  value={
                    <>
                      {financialsData?.average_revenue_per_consultation?.toLocaleString()}{" "}
                      <span className="text-sm font-medium mr-1 opacity-70">
                        ج.م
                      </span>
                    </>
                  }
                  icon={DollarSign}
                  colorTheme="emerald"
                />
                <StatCard
                  title="معدل النمو المالي"
                  value={`${financialsData?.growth?.percentage}%`}
                  subLabel={
                    financialsData?.growth?.percentage > 0
                      ? "+ عن الشهر الماضي"
                      : financialsData?.growth?.percentage < 0
                        ? "- عن الشهر الماضي"
                        : "حفاظ على المستوى"
                  }
                  icon={TrendingUp}
                  colorTheme={
                    financialsData?.growth?.percentage >= 0 ? "blue" : "rose"
                  }
                />
              </div>

              {/* By payment method */}
              <Card
                variant="elevated"
                className="p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl"
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-500" />
                  الإيرادات حسب وسيلة الدفع
                </h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(financialsData?.by_payment_method || {}).map(
                    ([method, total]: any) => (
                      <div
                        key={method}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                      >
                        <span className="font-medium capitalize text-muted-foreground">
                          {method.replace(/_/g, " ")}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {total.toLocaleString()}{" "}
                          <span className="text-xs font-normal">ج.م</span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ARTICLES TAB */}
          {activeTab === "articles" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="إجمالي القراءات"
                  value={articlesData?.total_views}
                  icon={Eye}
                  colorTheme="blue"
                />
                <StatCard
                  title="متوسط القراءة للمقال"
                  value={articlesData?.average_views_per_article}
                  icon={BarChart3}
                  colorTheme="indigo"
                />
              </div>
              <Card
                variant="elevated"
                className="p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl"
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  أكثر المقالات قراءة
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">عنوان المقال</th>
                        <th className="px-4 py-3 font-medium">الكاتب</th>
                        <th className="px-4 py-3 font-medium">المشاهدات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {articlesData?.most_viewed?.map((article: any) => (
                        <tr
                          key={article.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-4 py-4 font-semibold text-foreground">
                            {article.title}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {article.author}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                              <Eye className="w-3.5 h-3.5" />
                              {article.views}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
