import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Search,
  Eye,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Stethoscope,
  DollarSign,
  TrendingUp,
  X,
  Phone,
  Mail,
  FileText,
  Star,
  CreditCard,
  Ban,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useConsultations,
  useConsultationStats,
  useCancelConsultation,
  useConsultation,
} from "@/hooks/useAdminQueries";


const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "معلقة" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "مؤكدة" },
  in_progress: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", label: "جارية" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "مكتملة" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "ملغاة" },
  no_show: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", label: "لم يحضر" },
};

const PAYMENT_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700" },
  failed: { bg: "bg-rose-50", text: "text-rose-700" },
  refunded: { bg: "bg-violet-50", text: "text-violet-700" },
};

function StatusBadge({ status, statusAr }: { status: string; statusAr: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {statusAr}
    </span>
  );
}

function PaymentBadge({ status, statusAr }: { status: string; statusAr: string }) {
  const p = PAYMENT_STYLES[status] || PAYMENT_STYLES.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", p.bg, p.text)}>
      <CreditCard className="w-3 h-3" />
      {statusAr}
    </span>
  );
}

const ConsultationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;
  const search = searchParams.get("search") || undefined;

  const [localSearch, setLocalSearch] = useState(search || "");
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefund, setCancelRefund] = useState(true);
  const [selectedForCancel, setSelectedForCancel] = useState<any>(null);

  const { data: consultationsResponse, isLoading: loading, isFetching } = useConsultations({ page, status, type, search });
  const { data: statsResponse } = useConsultationStats();
  const cancelMutation = useCancelConsultation();

  const { data: detailsResponse, isLoading: detailsLoading } = useConsultation(detailsId || 0);

  const consultations = consultationsResponse?.data?.consultations || [];
  const pagination = consultationsResponse?.data?.pagination || { total: 0, per_page: 15, current_page: 1, last_page: 1 };
  // Stats come from the index response (reliable) or stats endpoint
  const inlineStats = consultationsResponse?.data?.stats;
  const stats = inlineStats || statsResponse?.data || null;
  const selectedConsultation = detailsResponse?.data?.consultation || null;
  const activeDetailData = selectedConsultation || selectedRow;

  const handleFilterChange = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.set("page", "1");
    setSearchParams(p);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", localSearch);
  };

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", String(newPage));
    setSearchParams(p);
  };

  const openDetails = (c: any) => {
    setSelectedRow(c);
    setDetailsId(c.id);
    setShowDetails(true);
  };
  const closeDetails = () => {
    setShowDetails(false);
    setDetailsId(null);
    setSelectedRow(null);
  };

  const openCancelModal = (consultation: any) => {
    setSelectedForCancel(consultation);
    setCancelReason("");
    setCancelRefund(true);
    setShowCancelModal(true);
  };

  const handleCancel = () => {
    if (!selectedForCancel || !cancelReason.trim()) {
      toast.error("يرجى إدخال سبب الإلغاء");
      return;
    }
    cancelMutation.mutate(
      { id: selectedForCancel.id, cancellation_reason: cancelReason, refund: cancelRefund },
      {
        onSuccess: () => {
          toast.success("تم إلغاء الاستشارة بنجاح");
          setShowCancelModal(false);
          setSelectedForCancel(null);
          if (showDetails && activeDetailData?.id === selectedForCancel.id) closeDetails();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "فشل في إلغاء الاستشارة"),
      }
    );
  };

  const canBeCancelled = (s: string) => ["pending", "confirmed"].includes(s);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الاستشارات</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            إجمالي <span className="font-semibold text-foreground">{pagination.total}</span> استشارة
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جارٍ التحديث...</span>
          </div>
        )}
      </div>

      {/* ── Stats Cards ───────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { key: "total", label: "الإجمالي", color: "text-foreground", bg: "bg-white", icon: TrendingUp },
            { key: "pending", label: "معلقة", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
            { key: "confirmed", label: "مؤكدة", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle },
            { key: "in_progress", label: "جارية", color: "text-indigo-600", bg: "bg-indigo-50", icon: Video },
            { key: "completed", label: "مكتملة", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
            { key: "cancelled", label: "ملغاة", color: "text-rose-600", bg: "bg-rose-50", icon: Ban },
            { key: "no_show", label: "لم يحضر", color: "text-slate-600", bg: "bg-slate-50", icon: AlertCircle },
          ].map(({ key, label, color, bg, icon: Icon }) => (
            <button
              key={key}
              onClick={() => key !== "total" ? handleFilterChange("status", status === key ? "" : key) : handleFilterChange("status", "")}
              className={cn(
                "group relative rounded-2xl border p-4 text-center transition-all hover:shadow-md cursor-pointer",
                bg,
                status === key ? "ring-2 ring-violet-400 border-violet-300 shadow-md" : "border-border"
              )}
            >
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2", color.replace("text-", "bg-").replace("600", "100").replace("foreground", "slate-100"))}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <p className={cn("text-2xl font-bold", color)}>{(stats as any)[key] || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              {status === key && (
                <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                  <X className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Filters ───────────────────────────────────── */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="ابحث باسم المريض أو الطبيب..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium"
            >
              بحث
            </button>
            {(search || status || type) && (
              <button
                type="button"
                onClick={() => { setLocalSearch(""); setSearchParams(new URLSearchParams()); }}
                className="px-3 py-2.5 border border-border rounded-xl hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                title="إزالة الفلاتر"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="flex gap-3">
            <select
              value={status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none text-sm min-w-[130px]"
            >
              <option value="">كل الحالات</option>
              <option value="pending">معلقة</option>
              <option value="confirmed">مؤكدة</option>
              <option value="in_progress">جارية</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
              <option value="no_show">لم يحضر</option>
            </select>
            <select
              value={type || ""}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none text-sm min-w-[120px]"
            >
              <option value="">كل الأنواع</option>
              <option value="video">فيديو</option>
              <option value="offline">عيادة</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Table ─────────────────────────────────────── */}
      <Card variant="elevated" className="overflow-hidden">
        {loading && consultations.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">لا توجد استشارات</p>
            {(status || type || search) && (
              <p className="text-sm text-muted-foreground/70 mt-1">جرّب تغيير معايير البحث</p>
            )}
          </div>
        ) : (
          <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {["#", "المريض", "الطبيب", "التاريخ والوقت", "النوع", "الحالة", "المبلغ", "الدفع", "الإجراءات"].map((h) => (
                    <th key={h} className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {consultations.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3.5 px-4 text-muted-foreground text-sm font-mono">
                      #{c.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium">{c.patient?.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">د. {c.doctor?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-medium text-foreground">{c.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {c.time}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                        c.type === "video" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
                      )}>
                        {c.type === "video" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {c.type_ar}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} statusAr={c.status_ar} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-semibold text-foreground">{c.price}</span>
                        <span className="text-xs text-muted-foreground">ج.م</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PaymentBadge status={c.payment_status} statusAr={c.payment_status_ar} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetails(c)}
                          className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canBeCancelled(c.status) && (
                          <button
                            onClick={() => openCancelModal(c)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
                            title="إلغاء الاستشارة"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              عرض{" "}
              <span className="font-medium text-foreground">
                {(pagination.current_page - 1) * pagination.per_page + 1}–
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
              </span>{" "}
              من <span className="font-medium text-foreground">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                const p = i + Math.max(1, pagination.current_page - 2);
                if (p > pagination.last_page) return null;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      p === pagination.current_page
                        ? "bg-violet-600 text-white"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Details Modal ─────────────────────────────── */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeDetails}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {activeDetailData ? (
              <>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 rounded-t-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">استشارة</p>
                      <h2 className="text-xl font-bold">#{activeDetailData.id}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={activeDetailData.status} statusAr={activeDetailData.status_ar} />
                      <button onClick={closeDetails} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">المريض</span>
                      </div>
                      <p className="font-semibold text-foreground">{activeDetailData.patient?.name}</p>
                      {activeDetailData.patient?.email && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{activeDetailData.patient.email}</span>
                        </div>
                      )}
                      {activeDetailData.patient?.phone && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{activeDetailData.patient.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-cyan-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Stethoscope className="w-4 h-4 text-cyan-600" />
                        <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">الطبيب</span>
                      </div>
                      <p className="font-semibold text-foreground">د. {activeDetailData.doctor?.name}</p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-slate-50 rounded-xl p-3">
                      <Calendar className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">التاريخ</p>
                      <p className="text-sm font-semibold mt-0.5">{activeDetailData.date}</p>
                    </div>
                    <div className="text-center bg-slate-50 rounded-xl p-3">
                      <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">الوقت</p>
                      <p className="text-sm font-semibold mt-0.5">{activeDetailData.time}</p>
                    </div>
                    <div className="text-center bg-slate-50 rounded-xl p-3">
                      {activeDetailData.type === "video"
                        ? <Video className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                        : <MapPin className="w-5 h-5 text-pink-500 mx-auto mb-1" />}
                      <p className="text-xs text-muted-foreground">النوع</p>
                      <p className="text-sm font-semibold mt-0.5">{activeDetailData.type_ar}</p>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">التفاصيل المالية</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">المبلغ الكلي</p>
                        <p className="text-lg font-bold text-emerald-700">{activeDetailData.price} <span className="text-xs">ج.م</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">عمولة المنصة</p>
                        <p className="text-lg font-bold text-violet-700">{activeDetailData.platform_commission} <span className="text-xs">ج.م</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">حالة الدفع</p>
                        <PaymentBadge status={activeDetailData.payment_status} statusAr={activeDetailData.payment_status_ar} />
                      </div>
                    </div>

                    {/* Loading Details Hint */}
                    {detailsLoading && !activeDetailData?.patient_notes && !activeDetailData?.doctor_notes && !activeDetailData?.payment?.transaction_id && (
                      <div className="mt-3 pt-3 border-t border-emerald-250/30 flex items-center justify-center gap-2 text-xs text-emerald-800/80 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                        <span>جارٍ تحميل البيانات الإضافية (الملاحظات، المعاملة)...</span>
                      </div>
                    )}

                    {activeDetailData?.payment && (
                      <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2 text-sm font-medium">
                        {activeDetailData.payment.transaction_id && (
                          <div className="text-slate-700">
                            <span className="text-muted-foreground">رقم المعاملة: </span>
                            <span className="font-mono">{activeDetailData.payment.transaction_id}</span>
                          </div>
                        )}
                        {activeDetailData.payment.payment_method && (
                          <div className="text-slate-700">
                            <span className="text-muted-foreground">وسيلة الدفع: </span>
                            <span>{activeDetailData.payment.payment_method}</span>
                          </div>
                        )}
                        {activeDetailData.payment.doctor_amount && (
                          <div className="text-slate-700">
                            <span className="text-muted-foreground">نصيب الطبيب: </span>
                            <span className="font-bold text-emerald-700">{activeDetailData.payment.doctor_amount} ج.م</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {activeDetailData && (activeDetailData.patient_notes || activeDetailData.doctor_notes) && (
                    <div className="space-y-3 animate-fadeIn">
                      {activeDetailData.patient_notes && (
                        <div className="bg-amber-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">ملاحظات المريض</span>
                          </div>
                          <p className="text-sm text-foreground">{activeDetailData.patient_notes}</p>
                        </div>
                      )}
                      {activeDetailData.doctor_notes && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">ملاحظات الطبيب</span>
                          </div>
                          <p className="text-sm text-foreground">{activeDetailData.doctor_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review */}
                  {activeDetailData?.review && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-amber-700">الالتقييم</span>
                        <span className="text-lg font-bold text-amber-600">{activeDetailData.review.rating}/5</span>
                      </div>
                      {activeDetailData.review.comment && (
                        <p className="text-sm text-foreground">{activeDetailData.review.comment}</p>
                      )}
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {activeDetailData?.cancellation_reason && (
                    <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2">
                        <Ban className="w-4 h-4 text-rose-600" />
                        <span className="text-sm font-semibold text-rose-700">سبب الإلغاء</span>
                      </div>
                      <p className="text-sm text-foreground">{activeDetailData.cancellation_reason}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/20 rounded-b-2xl">
                  <p className="text-xs text-muted-foreground">
                    تاريخ الإنشاء: {activeDetailData.created_at}
                  </p>
                  <div className="flex gap-2">
                    {canBeCancelled(activeDetailData.status) && (
                      <Button
                        variant="destructive"
                        onClick={() => { closeDetails(); openCancelModal(activeDetailData); }}
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        إلغاء الاستشارة
                      </Button>
                    )}
                    <Button variant="ghost" onClick={closeDetails}>إغلاق</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted" />
                الاستشارة غير موجودة
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel Modal ──────────────────────────────── */}
      {showCancelModal && selectedForCancel && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">إلغاء الاستشارة</h2>
                  <p className="text-sm text-muted-foreground">#{selectedForCancel.id}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">
                  سبب الإلغاء <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none resize-none h-28 text-sm transition-all"
                  placeholder="اكتب سبب إلغاء الاستشارة بوضوح..."
                />
              </div>
              <label className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelRefund}
                  onChange={(e) => setCancelRefund(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <div>
                  <span className="text-sm font-medium text-emerald-800">استرداد المبلغ للمريض</span>
                  <p className="text-xs text-emerald-600 mt-0.5">سيتم إرسال المبلغ المدفوع إلى المريض</p>
                </div>
              </label>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCancelModal(false)}>تراجع</Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                loading={cancelMutation.isPending}
              >
                تأكيد الإلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsPage;
