import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Download,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuditLogs } from "@/hooks/useAdminQueries";

interface AuditLogItem {
  id: number;
  admin_id: number | null;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  action?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  status_code: number;
  ip_address?: string | null;
  user_agent?: string | null;
  request_data?: Record<string, unknown> | null;
  response_message?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  admin?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

const methodOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "كل الطرق" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
];

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "كل الحالات" },
  { value: "200", label: "200 (نجاح)" },
  { value: "201", label: "201 (إنشاء)" },
  { value: "400", label: "400 (طلب غير صالح)" },
  { value: "401", label: "401 (غير مصرح)" },
  { value: "403", label: "403 (ممنوع)" },
  { value: "404", label: "404 (غير موجود)" },
  { value: "422", label: "422 (تحقق)" },
  { value: "500", label: "500 (خطأ خادم)" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
};

const AuditLogsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const page = Number(searchParams.get("page") || 1);
  const per_page = Number(searchParams.get("per_page") || 20);
  const search = searchParams.get("search") || "";
  const method = searchParams.get("method") || "";
  const status_code = searchParams.get("status_code") || "";
  const from_date = searchParams.get("from_date") || "";
  const to_date = searchParams.get("to_date") || "";

  const queryParams = useMemo(
    () => ({
      page,
      per_page,
      search: search || undefined,
      method: (method || undefined) as
        | "POST"
        | "PUT"
        | "PATCH"
        | "DELETE"
        | undefined,
      status_code: status_code ? Number(status_code) : undefined,
      from_date: from_date || undefined,
      to_date: to_date || undefined,
    }),
    [page, per_page, search, method, status_code, from_date, to_date],
  );

  const { data, isLoading, isFetching, refetch } = useAuditLogs(queryParams);

  const logs: AuditLogItem[] = data?.data || [];
  const pagination = data?.pagination?.meta || {
    current_page: page,
    total_pages: 1,
    total: logs.length,
    per_page,
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") {
      next.set("page", "1");
    }
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({ page: "1", per_page: String(per_page) });
  };

  const exportCsv = () => {
    if (!logs.length) return;

    const headers = [
      "ID",
      "الطريقة",
      "المسار",
      "المسؤول",
      "الحالة",
      "الكيان",
      "معرّف الكيان",
      "الرسالة",
      "IP",
      "التاريخ",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.method,
      log.endpoint,
      log.admin?.name || "غير معروف",
      log.status_code,
      log.resource_type || "",
      log.resource_id || "",
      log.response_message || "",
      log.ip_address || "",
      formatDate(log.created_at),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, "-");
    link.href = url;
    link.download = `audit-logs-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pageCount = pagination.total_pages || 1;


  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">سجلات التدقيق</h1>
          <p className="text-muted-foreground">
            متابعة كل عمليات التعديل الحساسة داخل لوحة الإدارة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>
            تحديث
          </Button>
          <Button
            variant="outline"
            icon={Download}
            onClick={exportCsv}
            disabled={!logs.length}
          >
            تصدير CSV
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => updateParam("search", e.target.value)}
              placeholder="بحث بالمسار أو اسم المسؤول"
              className="w-full h-10 rounded-lg border border-border bg-white pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={method}
            onChange={(e) => updateParam("method", e.target.value)}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {methodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status_code}
            onChange={(e) => updateParam("status_code", e.target.value)}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Calendar className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={from_date}
              onChange={(e) => updateParam("from_date", e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-white pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={to_date}
              onChange={(e) => updateParam("to_date", e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-white pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" icon={Filter} onClick={resetFilters}>
            إعادة تعيين الفلاتر
          </Button>
          <p className="text-xs text-muted-foreground">
            {isFetching
              ? "جاري تحديث النتائج..."
              : `إجمالي السجلات: ${pagination.total || 0}`}
          </p>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ShieldCheck className="w-8 h-8" />
            <p>لا توجد سجلات مطابقة للفلاتر الحالية</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-4">
              <table className="w-full border-separate border-spacing-y-2 px-2 text-sm">
                <thead>
                  <tr>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">التاريخ</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">المسؤول</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">الطريقة</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">المسار</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">الحالة</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">الكيان</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs">الرسالة</th>
                    <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-xs text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="bg-white hover:bg-slate-50/80 transition-all rounded-2xl shadow-sm border border-slate-100 group"
                    >
                      <td className="py-4 px-5 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-violet-100 transition-colors text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                        <div className="font-medium text-foreground">
                          {log.admin?.name || "غير معروف"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.admin?.email || "—"}
                        </div>
                      </td>
                      <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                        <span className="inline-flex px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                          {log.method}
                        </span>
                      </td>
                      <td
                        className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors text-foreground/80 max-w-[280px] truncate"
                        title={log.endpoint}
                      >
                        {log.endpoint}
                      </td>
                      <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            log.status_code < 300
                              ? "bg-emerald-100 text-emerald-700"
                              : log.status_code < 400
                                ? "bg-sky-100 text-sky-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {log.status_code}
                        </span>
                      </td>
                      <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors text-muted-foreground whitespace-nowrap">
                        {[log.resource_type, log.resource_id]
                          .filter(Boolean)
                          .join(" #") || "—"}
                      </td>
                      <td
                        className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors text-muted-foreground max-w-[220px] truncate"
                        title={log.response_message || ""}
                      >
                        {log.response_message || "—"}
                      </td>
                      <td className="py-4 px-5 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-violet-100 transition-colors text-center">
                        <Button
                          variant="ghost"
                          className="hover:bg-violet-100 hover:text-violet-700 w-9 h-9 p-0"
                          title="عرض التفاصيل"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted">
              <p className="text-xs text-muted-foreground">
                صفحة {pagination.current_page || 1} من {pageCount} — (
                {pagination.total || 0} سجل)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(pagination.current_page || 1) <= 1}
                  onClick={() =>
                    updateParam(
                      "page",
                      String((pagination.current_page || 1) - 1),
                    )
                  }
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(pagination.current_page || 1) >= pageCount}
                  onClick={() =>
                    updateParam(
                      "page",
                      String((pagination.current_page || 1) + 1),
                    )
                  }
                >
                  التالي
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent
          className="max-w-4xl max-h-[85vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>تفاصيل سجل التدقيق #{selectedLog?.id}</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 bg-muted">
                  <p className="text-muted-foreground">المسؤول</p>
                  <p className="font-medium text-foreground">
                    {selectedLog.admin?.name || "غير معروف"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.admin?.email || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 bg-muted">
                  <p className="text-muted-foreground">الوقت</p>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedLog.created_at)}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 bg-muted">
                  <p className="text-muted-foreground">الطلب</p>
                  <p className="font-medium text-foreground">
                    {selectedLog.method} — {selectedLog.endpoint}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 bg-muted">
                  <p className="text-muted-foreground">الاستجابة</p>
                  <p className="font-medium text-foreground">
                    {selectedLog.status_code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.response_message || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 bg-muted">
                  <p className="text-muted-foreground">الكيان المستهدف</p>
                  <p className="font-medium text-foreground">
                    {[selectedLog.resource_type, selectedLog.resource_id]
                      .filter(Boolean)
                      .join(" #") || "—"}
                  </p>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;
