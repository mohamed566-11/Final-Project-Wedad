import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import {
  useJoinRequests,
  useUpdateJoinRequestStatus,
} from "@/hooks/useAdminQueries";
import * as adminService from "@/services/adminService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";

const JoinRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] =
    useState<adminService.JoinRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] =
    useState<adminService.JoinRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query params from URL
  const queryParams = useMemo(
    () => ({
      page: Number(searchParams.get("page")) || 1,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    }),
    [searchParams],
  );

  // Use React Query for data fetching
  const {
    data: requestsData,
    isLoading: loading,
    refetch,
    isFetching,
  } = useJoinRequests(queryParams);

  // Use mutation hook for status updates
  const updateStatusMutation = useUpdateJoinRequestStatus();

  const requests = requestsData?.data?.requests || [];
  const pagination = requestsData?.data?.pagination || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) newParams.set("search", searchInput);
    else newParams.delete("search");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(page));
    setSearchParams(newParams);
  };

  const viewRequest = async (request: adminService.JoinRequest) => {
    try {
      const res = await adminService.getJoinRequest(request.id);
      setSelectedRequest(res.data.data.request);
      setShowDetails(true);
    } catch (error) {
      toast.error("فشل في تحميل تفاصيل الطلب");
    }
  };

  const openStatusModal = (
    request: adminService.JoinRequest,
    status: string,
  ) => {
    setSelectedRequest(request);
    setNewStatus(status);
    setStatusNotes("");
    setShowStatusModal(true);
  };

  const updateStatus = async () => {
    if (!selectedRequest) return;

    updateStatusMutation.mutate(
      {
        id: selectedRequest.id,
        status: newStatus,
        notes: statusNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            `تم ${newStatus === "approved" ? "قبول" : newStatus === "rejected" ? "رفض" : "تحديث"} الطلب`,
          );
          setShowStatusModal(false);
          setShowDetails(false);
        },
        onError: () => {
          toast.error("فشل في تحديث حالة الطلب");
        },
      },
    );
  };

  const deleteRequest = (request: adminService.JoinRequest) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteJoinRequest(requestToDelete.id);
      toast.success("تم حذف الطلب");
      setShowDeleteModal(false);
      setRequestToDelete(null);
      refetch();
    } catch (error) {
      toast.error("فشل في حذف الطلب");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string, statusAr: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      contacted: "bg-blue-100 text-blue-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-rose-100 text-rose-700",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      contacted: <Eye className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
    };

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          styles[status] || "bg-muted/50",
        )}
      >
        {icons[status]} {statusAr}
      </span>
    );
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">طلبات الانضمام</h1>
          <p className="text-muted-foreground">
            إجمالي {pagination.total} طلب
            {pendingCount > 0 && (
              <span className="text-amber-600">
                {" "}
                • {pendingCount} بانتظار المراجعة
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="البحث بالاسم أو البريد..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
              />
            </div>
          </form>

          <select
            value={searchParams.get("status") || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none min-w-[150px]"
          >
            <option value="">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="contacted">تم التواصل</option>
            <option value="approved">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card variant="elevated" className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus className="w-16 h-16 text-border mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد طلبات انضمام</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 px-2">
              <thead>
                <tr>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    المتقدم
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التخصص
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التواصل
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    الحالة
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التاريخ
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="bg-white hover:bg-slate-50/80 transition-all rounded-2xl shadow-sm border border-slate-100 group"
                  >
                    <td className="py-4 px-5 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {request.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <span className="px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-700">
                        {request.specialty_ar}
                      </span>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {request.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {request.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      {getStatusBadge(request.status, request.status_ar)}
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {request.submitted_at}
                      </div>
                    </td>
                    <td className="py-4 px-5 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewRequest(request)}
                          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                          title="عرض بالتفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                openStatusModal(request, "approved")
                              }
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="قبول"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                openStatusModal(request, "rejected")
                              }
                              className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                              title="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => deleteRequest(request)}
                          className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              عرض {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
              {Math.min(
                pagination.current_page * pagination.per_page,
                pagination.total,
              )}{" "}
              من {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg font-medium">
                {pagination.current_page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Gradient */}
            <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-8 pb-12 flex-shrink-0">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-5 relative z-10 w-full">
                <div className="w-20 h-20 rounded-full bg-white/20 flex flex-shrink-0 items-center justify-center border-4 border-white/30 shadow-lg">
                  <Stethoscope className="w-10 h-10 text-white" />
                </div>
                <div className="text-white flex-1 pr-2">
                  <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    {selectedRequest.name}
                  </h2>
                  <p className="text-white/80 flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" /> {selectedRequest.email}
                  </p>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                   {getStatusBadge(
                     selectedRequest.status,
                     selectedRequest.status_ar,
                   )}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">التخصص الطبي</p>
                  <p className="font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md inline-block mt-1">{selectedRequest.specialty_ar}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium mt-1">{selectedRequest.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم ترخيص المزاولة</p>
                  <p className="font-medium mt-1">{selectedRequest.license_number || 'غير متوفر'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سعر الاستشارة</p>
                  <p className="font-medium mt-1">{selectedRequest.consultation_price ? `${selectedRequest.consultation_price} ج.م` : 'غير متوفر'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ التقديم</p>
                  <p className="font-medium mt-1 text-sm">{selectedRequest.submitted_at}</p>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-foreground mb-2">ملاحظات إضافية</p>
                  <p className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-foreground/80 leading-relaxed text-sm">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
              <Button variant="ghost" className="hover:bg-slate-200" onClick={() => setShowDetails(false)}>
                إغلاق النافذة
              </Button>
              {selectedRequest.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => openStatusModal(selectedRequest, "rejected")}
                  >
                    رفض الطلب
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={() => openStatusModal(selectedRequest, "approved")}
                  >
                    تأكيد القبول
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {newStatus === "approved" ? "قبول الطلب" : "رفض الطلب"}
              </h2>
              <p className="text-muted-foreground">{selectedRequest.name}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none resize-none h-24"
                placeholder={
                  newStatus === "rejected"
                    ? "سبب الرفض..."
                    : "ملاحظات إضافية..."
                }
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowStatusModal(false)}>
                إلغاء
              </Button>
              <Button
                variant={newStatus === "approved" ? "gradient" : "destructive"}
                onClick={updateStatus}
                loading={updateStatusMutation.isPending}
              >
                {newStatus === "approved" ? "تأكيد القبول" : "تأكيد الرفض"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="حذف طلب انضمام"
        message={`هل أنت متأكد من حذف طلب الانضمام المقدم من ${requestToDelete?.name}؟`}
        loading={isDeleting}
      />
    </div>
  );
};

export default JoinRequestsPage;
