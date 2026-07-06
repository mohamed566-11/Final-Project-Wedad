import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Download,
  Loader2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  AlertCircle,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useFinancialOverview,
  useTransactions,
  usePayoutRequests,
  useProcessPayoutRequest,
} from "@/hooks/useAdminQueries";
import * as adminService from "@/services/adminService";

// Payout Interface
interface PayoutRequest {
  id: number;
  reference_no: string;
  doctor: { id: number; name: string; email: string };
  amount: number;
  method: string;
  details: any;
  status: "pending" | "processed" | "rejected";
  admin_note?: string;
  processed_at?: string;
  created_at: string;
}

const FinancialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "payouts"
  >("overview");

  // Filters
  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || undefined;
  const payment_method = searchParams.get("payment_method") || undefined;
  const date_from = searchParams.get("date_from") || undefined;
  const date_to = searchParams.get("date_to") || undefined;
  const search = searchParams.get("search") || undefined;

  // Queries
  const { data: overviewResponse, isLoading: overviewLoading } =
    useFinancialOverview();

  // Transactions
  const {
    data: transactionsResponse,
    isLoading: transactionsLoading,
    isFetching: transactionsFetching,
  } = useTransactions({
    page,
    status,
    payment_method,
    date_from,
    date_to,
    search,
  });

  // Payout Requests
  const [payoutStatus, setPayoutStatus] = useState<string>("pending");
  const { data: payoutsResponse, isLoading: payoutsLoading } =
    usePayoutRequests({ page, status: payoutStatus });

  // Mutation
  const processPayoutMutation = useProcessPayoutRequest();

  // Local State for Modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(
    null,
  );
  const [processData, setProcessData] = useState({
    status: "processed" as "processed" | "rejected",
    admin_note: "",
    transaction_reference: "",
  });
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Derived Data
  const overview = overviewResponse?.data || null;
  const transactions = transactionsResponse?.data?.transactions || [];
  const transactionsPagination = transactionsResponse?.data?.pagination || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  };

  // Payouts Data (Assuming standard Laravel pagination structure for now, need to verify exact API response shape)
  const payoutRequests = payoutsResponse?.data || [];
  const payoutsPagination = payoutsResponse?.pagination || {
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
  };

  // Handlers
  const handleTransactionsFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const openProcessModal = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setProcessData({
      status: "processed",
      admin_note: "",
      transaction_reference: "",
    });
    setShowProcessModal(true);
  };

  const handleProcessPayout = () => {
    if (!selectedPayout) return;

    processPayoutMutation.mutate(
      {
        id: selectedPayout.id,
        status: processData.status,
        admin_note: processData.admin_note,
        transaction_reference: processData.transaction_reference,
      },
      {
        onSuccess: () => {
          toast.success(
            processData.status === "processed"
              ? "تمت الموافقة على السحب"
              : "تم رفض السحب",
          );
          setShowProcessModal(false);
          setSelectedPayout(null);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "حدث خطأ أثناء المعالجة",
          );
        },
      },
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "processed":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" /> مكتمل
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" /> معلق
          </span>
        );
      case "failed":
      case "rejected":
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
            <XCircle className="w-3 h-3" />{" "}
            {status === "refunded" ? "مسترد" : "مرفوض/فشل"}
          </span>
        );
      default:
        return null;
    }
  };

  const isLoading =
    (activeTab === "overview" && overviewLoading) ||
    (activeTab === "transactions" &&
      transactionsLoading &&
      transactions.length === 0) ||
    (activeTab === "payouts" && payoutsLoading);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإدارة المالية</h1>
          <p className="text-muted-foreground">إدارة المعاملات والمدفوعات</p>
        </div>
        {/* <Button variant="ghost" icon={Download}>تصدير التقرير</Button> */}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "overview", label: "نظرة عامة", icon: TrendingUp },
          { id: "transactions", label: "المعاملات", icon: CreditCard },
          { id: "payouts", label: "طلبات السحب", icon: Banknote },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
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
          {/* Overview Tab Content (Same as before) - Simplified for brevity in this rewrite */}
          {activeTab === "overview" && overview && (
            <div className="space-y-6">
              {/* Overview Cards Code Here - reusing existing UI logic */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  variant="elevated"
                  className="relative p-6 overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(34,197,94,0.1)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(34,197,94,0.15)] rounded-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground font-medium text-sm mb-2 opacity-80">إجمالي الإيرادات</p>
                      <h4 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
                        {overview.total_revenue.toLocaleString()} <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mr-1">ج.م</span>
                      </h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                    <TrendingUp className="w-3.5 h-3.5" /> شاملة عمولات المنصة
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  className="relative p-6 overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.1)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] rounded-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground font-medium text-sm mb-2 opacity-80">إيرادات هذا الشهر</p>
                      <h4 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
                        {overview.revenue_this_month.toLocaleString()} <span className="text-sm font-medium text-blue-600 dark:text-blue-400 mr-1">ج.م</span>
                      </h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-500/20 text-blue-600 dark:text-blue-400 shadow-inner">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div className={cn(
                    "relative z-10 mt-4 flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full w-fit",
                    overview.growth_rate >= 0
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                      : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
                  )}>
                    {overview.growth_rate >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span dir="ltr">{overview.growth_rate > 0 ? "+" : ""}{overview.growth_rate}%</span>
                    <span>عن الشهر الماضي</span>
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  className="relative p-6 overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(139,92,246,0.1)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,92,246,0.15)] rounded-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 dark:bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground font-medium text-sm mb-2 opacity-80">أرباح المنصة (الصافي)</p>
                      <h4 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
                        {overview.platform_earnings.toLocaleString()} <span className="text-sm font-medium text-violet-600 dark:text-violet-400 mr-1">ج.م</span>
                      </h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-400/20 to-violet-500/20 text-violet-600 dark:text-violet-400 shadow-inner">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full w-fit">
                    <ArrowUpRight className="w-3.5 h-3.5" /> يمثل أرباح المنصة فقط
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  className="relative p-6 overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(245,158,11,0.1)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(245,158,11,0.15)] rounded-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground font-medium text-sm mb-2 opacity-80">مدفوعات معلقة (للأطباء)</p>
                      <h4 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">
                        {overview.pending_payouts.toLocaleString()} <span className="text-sm font-medium text-amber-600 dark:text-amber-400 mr-1">ج.م</span>
                      </h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/20 text-amber-600 dark:text-amber-400 shadow-inner">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full w-fit">
                    <AlertCircle className="w-3.5 h-3.5" /> بانتظار صرف الأرباح
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Transactions Tab Content (Same as before) */}
          {activeTab === "transactions" && (
            <div className="space-y-6">
              <Card variant="elevated" className="p-5 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">سجل المعاملات</h3>
                  <select
                    value={status || ""}
                    onChange={(e) =>
                      handleTransactionsFilterChange("status", e.target.value)
                    }
                    className="px-4 py-2.5 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md focus:border-violet-500 outline-none hover:bg-white/80 transition-colors shadow-sm"
                  >
                    <option value="">كل الحالات</option>
                    <option value="completed">مكتمل</option>
                    <option value="pending">معلق</option>
                    <option value="failed">فشل</option>
                  </select>
                </div>
              </Card>
              <Card variant="elevated" className="overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80"># المعاملة</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">المريض</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">المبلغ</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">الحالة</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {transactions.map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-muted/40 transition-colors duration-200"
                        >
                          <td className="py-4 px-6 text-muted-foreground font-mono text-sm font-medium">
                            {tx.transaction_id || <span className="opacity-50">#N/A</span>}
                          </td>
                          <td className="py-4 px-6 font-medium text-foreground">{tx.patient?.name}</td>
                          <td className="py-4 px-6 font-bold text-foreground">{tx.amount} <span className="font-normal text-xs text-muted-foreground">ج.م</span></td>
                          <td className="py-4 px-6">
                            {getStatusBadge(tx.status)}
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {tx.created_at}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Payouts Tab Content (NEW) */}
          {activeTab === "payouts" && (
            <div className="space-y-6">
              <Card variant="elevated" className="overflow-hidden border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl">
                <div className="p-5 border-b border-white/20 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground">طلبات السحب المرفوعة</h3>
                  <div className="flex gap-2">
                    <select
                      value={payoutStatus}
                      className="px-4 py-2 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md outline-none focus:border-violet-500 hover:bg-white/80 transition-colors shadow-sm"
                      onChange={(e) => setPayoutStatus(e.target.value)}
                    >
                      <option value="">كل الحالات</option>
                      <option value="pending">معلق بانتظار الإجراء</option>
                      <option value="processed">تم صرفها</option>
                      <option value="rejected">مرفوضة</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          رقم المرجع
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          الطبيب
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          المبلغ المطلوب
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          طريقة الدفع
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          الحالة
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          تاريخ الطلب
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground/80">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {payoutRequests.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-12 text-muted-foreground bg-white/30 dark:bg-slate-900/30"
                          >
                            <Banknote className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                            لا توجد طلبات سحب بناءً على الفلتر الحالي
                          </td>
                        </tr>
                      ) : (
                        payoutRequests.map((payout: PayoutRequest) => (
                          <tr
                            key={payout.id}
                            className="hover:bg-muted/40 transition-colors duration-200"
                          >
                            <td className="py-4 px-6 font-mono text-sm font-medium text-muted-foreground">
                              #{payout.id}
                            </td>
                            <td className="py-4 px-6 font-medium text-foreground">
                              {payout.doctor?.name}
                            </td>
                            <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400">
                              {payout.amount.toLocaleString()} <span className="font-normal text-xs text-muted-foreground">ج.م</span>
                            </td>
                            <td className="py-4 px-6 text-sm">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">
                                {payout.method === "bank_transfer" || payout.method === "bank"
                                  ? "تحويل بنكي"
                                  : payout.method === "wallet"
                                    ? "محفظة كاش"
                                    : payout.method === "cash"
                                      ? "نقداً"
                                      : payout.method}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {getStatusBadge(payout.status)}
                            </td>
                            <td className="py-4 px-6 text-sm font-medium text-muted-foreground">
                              {new Date(payout.created_at).toLocaleDateString(
                                "ar-EG", { year: 'numeric', month: 'short', day: 'numeric' }
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {payout.status === "pending" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-900 drop-shadow-sm font-medium"
                                  onClick={() => openProcessModal(payout)}
                                >
                                  معالجة الطلب
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground font-medium">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Process Payout Modal */}
      {showProcessModal && selectedPayout && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProcessModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                معالجة طلب السحب
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                للمستخدم:{" "}
                <span className="font-medium text-foreground">
                  {selectedPayout.doctor?.name}
                </span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-muted rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ المطلوب:</span>
                  <span className="font-bold text-foreground">
                    {selectedPayout.amount} ج.م
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">طريقة الدفع:</span>
                  <span className="font-medium">
                    {selectedPayout.method === "bank_transfer" || selectedPayout.method === "bank"
                      ? "تحويل بنكي"
                      : selectedPayout.method === "cash"
                        ? "نقداً"
                        : "محفظة كاش"}
                  </span>
                </div>
                {selectedPayout.details && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="font-medium mb-1">تفاصيل التحويل:</p>
                    <pre className="text-xs bg-white p-2 rounded border border-border overflow-x-auto">
                      {JSON.stringify(selectedPayout.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  الإجراء
                </label>
                <div className="flex bg-muted/50 p-1 rounded-xl">
                  <button
                    onClick={() =>
                      setProcessData((prev) => ({
                        ...prev,
                        status: "processed",
                      }))
                    }
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      processData.status === "processed"
                        ? "bg-white shadow text-emerald-600"
                        : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >
                    موافقة (تم التحويل)
                  </button>
                  <button
                    onClick={() =>
                      setProcessData((prev) => ({
                        ...prev,
                        status: "rejected",
                      }))
                    }
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      processData.status === "rejected"
                        ? "bg-white shadow text-rose-600"
                        : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >
                    رفض الطلب
                  </button>
                </div>
              </div>

              {processData.status === "processed" && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    رقم مرجع التحويل (اختياري)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-violet-500 outline-none"
                    placeholder="مثال: TRX-123456"
                    value={processData.transaction_reference}
                    onChange={(e) =>
                      setProcessData((prev) => ({
                        ...prev,
                        transaction_reference: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  ملاحظات الإدارة
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border border-border focus:border-violet-500 outline-none h-20 resize-none"
                  placeholder="أضف ملاحظات..."
                  value={processData.admin_note}
                  onChange={(e) =>
                    setProcessData((prev) => ({
                      ...prev,
                      admin_note: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowProcessModal(false)}
              >
                إلغاء
              </Button>
              <Button
                variant={
                  processData.status === "processed" ? "default" : "destructive"
                }
                onClick={handleProcessPayout}
                loading={processPayoutMutation.isPending}
              >
                {processData.status === "processed"
                  ? "تأكيد الموافقة"
                  : "تأكيد الرفض"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsPage;
