import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Stethoscope,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Star,
  BadgeCheck,
  FileText,
  Ban,
  Trash2,
  ToggleRight,
  ToggleLeft,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import * as adminService from "@/services/adminService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useDoctors,
  useSpecializations,
  useVerifyDoctor,
  useRejectDoctor,
  useToggleDoctorStatus,
  useDeleteDoctor,
  useDoctor,
} from "@/hooks/useAdminQueries";
import ConfirmModal from "@/components/common/ConfirmModal";

const DoctorsManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse query params
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const verification_status =
    searchParams.get("verification_status") || undefined;
  const is_active = searchParams.get("is_active")
    ? searchParams.get("is_active") === "1"
    : undefined;
  const specialization = searchParams.get("specialization") || undefined;

  // React Query Hooks
  const {
    data: doctorsResponse,
    isLoading: loading,
    isFetching,
  } = useDoctors({
    page,
    search,
    verification_status,
    is_active,
    specialization,
  });

  const { data: specializationsResponse } = useSpecializations();

  // Mutations
  const verifyMutation = useVerifyDoctor();
  const rejectMutation = useRejectDoctor();
  const toggleStatusMutation = useToggleDoctorStatus();
  const deleteMutation = useDeleteDoctor();

  // Local State
  const [searchInput, setSearchInput] = useState(search);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [tempDoctor, setTempDoctor] = useState<any>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [selectedDoctorForAction, setSelectedDoctorForAction] = useState<any>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctorForDelete, setSelectedDoctorForDelete] =
    useState<adminService.Doctor | null>(null);

  // Derived Data
  const doctors = doctorsResponse?.data?.doctors || [];
  const pagination = doctorsResponse?.data?.pagination || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  };
  const specializations = specializationsResponse?.data?.specializations || [];

  // Details Query
  const { data: doctorDetailsResponse, isFetching: detailsLoading } =
    useDoctor(detailsId || 0);
  const selectedDoctor = doctorDetailsResponse?.data?.doctor || tempDoctor;

  // Handlers
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

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const handleViewDetails = (doctor: any) => {
    setTempDoctor(doctor);
    setDetailsId(doctor.id);
    setShowDetails(true);
  };

  const handleVerify = (id: number) => {
    verifyMutation.mutate(id, {
      onSuccess: () => {
        toast.success("تم توثيق الطبيب بنجاح");
      },
      onError: () => toast.error("فشل في توثيق الطبيب"),
    });
  };

  const openRejectModal = (doctor: adminService.Doctor) => {
    setSelectedDoctorForAction(doctor);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!selectedDoctorForAction || !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    rejectMutation.mutate(
      {
        id: selectedDoctorForAction.id,
        rejection_reason: rejectionReason,
      },
      {
        onSuccess: () => {
          toast.success("تم رفض الطبيب بنجاح");
          setShowRejectModal(false);
          setSelectedDoctorForAction(null);
        },
        onError: () => toast.error("فشل في رفض الطبيب"),
      },
    );
  };

  const handleToggleStatus = (doctor: adminService.Doctor) => {
    if (doctor.is_active) {
      setSelectedDoctorForAction(doctor);
      setDeactivateReason("");
      setShowDeactivateModal(true);
    } else {
      toggleStatusMutation.mutate(
        { id: doctor.id, is_active: true },
        {
          onSuccess: () => toast.success("تم تفعيل الحساب بنجاح"),
          onError: () => toast.error("فشل في تفعيل الحساب"),
        },
      );
    }
  };

  const confirmDeactivate = () => {
    if (!selectedDoctorForAction || !deactivateReason.trim()) {
      toast.error("يرجى إدخال سبب الإيقاف");
      return;
    }

    toggleStatusMutation.mutate(
      {
        id: selectedDoctorForAction.id,
        is_active: false,
        reason: deactivateReason,
      },
      {
        onSuccess: () => {
          toast.success("تم إيقاف الحساب بنجاح");
          setShowDeactivateModal(false);
          setSelectedDoctorForAction(null);
        },
        onError: () => toast.error("فشل في إيقاف الحساب"),
      },
    );
  };

  const handleDelete = (doctor: adminService.Doctor) => {
    setSelectedDoctorForDelete(doctor);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedDoctorForDelete) return;

    deleteMutation.mutate(selectedDoctorForDelete.id, {
      onSuccess: () => {
        toast.success("تم حذف الطبيب بنجاح");
        setShowDeleteModal(false);
        setSelectedDoctorForDelete(null);
      },
      onError: () => toast.error("فشل في حذف الطبيب"),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 w-fit">
            <CheckCircle className="w-3 h-3" /> تم التحقق
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
            <UserCheck className="w-3 h-3" /> قيد المراجعة
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 w-fit">
            <XCircle className="w-3 h-3" /> مرفوض
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الأطباء</h1>
          <p className="text-muted-foreground">إجمالي {pagination.total} طبيب</p>
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
                placeholder="البحث بالاسم أو البريد أو الهاتف..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
              />
            </div>
          </form>

          <select
            value={verification_status || ""}
            onChange={(e) =>
              handleFilterChange("verification_status", e.target.value)
            }
            className="px-4 py-2.5 rounded-xl border border-border focus:border-cyan-500 outline-none min-w-[150px]"
          >
            <option value="">حالة التحقق (الكل)</option>
            <option value="pending">قيد المراجعة</option>
            <option value="verified">تم التحقق</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select
            value={specialization || ""}
            onChange={(e) => handleFilterChange("specialization", e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-cyan-500 outline-none min-w-[150px]"
          >
            <option value="">كل التخصصات</option>
            {specializations.map((spec: any) => (
              <option key={spec.value} value={spec.value}>
                {spec.label}
              </option>
            ))}
          </select>

          <select
            value={is_active === undefined ? "" : is_active ? "1" : "0"}
            onChange={(e) => handleFilterChange("is_active", e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-cyan-500 outline-none min-w-[150px]"
          >
            <option value="">حالة الحساب (الكل)</option>
            <option value="1">نشط</option>
            <option value="0">غير نشط</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card variant="elevated" className="overflow-hidden">
        {loading && !isFetching && doctors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="w-16 h-16 text-border mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد أطباء</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-y-2 px-2">
              <thead>
                <tr>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    الطبيب
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التخصص
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التحقق
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التقييم
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    السعر
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor: any) => (
                  <tr
                    key={doctor.id}
                    className="bg-white hover:bg-slate-50/80 transition-all rounded-2xl shadow-sm border border-slate-100 group"
                  >
                    <td className="py-4 px-5 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-cyan-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={doctor.image_url}
                          alt={doctor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            د. {doctor.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {doctor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-cyan-100 transition-colors">
                      <span className="px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-700">
                        {doctor.specialization_ar}
                      </span>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-cyan-100 transition-colors">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(doctor.verification_status)}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                            doctor.is_active
                              ? "bg-blue-100 text-blue-700"
                              : "bg-muted/50 text-muted-foreground",
                          )}
                        >
                          {doctor.is_active ? "نشط" : "غير نشط"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-cyan-100 transition-colors">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">
                          {doctor.rating || 0}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({doctor.total_reviews || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-cyan-100 transition-colors">
                      <span className="font-medium">
                        {doctor.consultation_price} ج.م
                      </span>
                    </td>
                    <td className="py-4 px-5 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-cyan-100 transition-colors">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(doctor)}
                          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {doctor.verification_status === "pending" && (
                          <>
                            <button
                              onClick={() => handleVerify(doctor.id)}
                              disabled={
                                verifyMutation.isPending &&
                                verifyMutation.variables === doctor.id
                              }
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="قبول وتوثيق"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(doctor)}
                              className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                              title="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleToggleStatus(doctor)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            doctor.is_active
                              ? "hover:bg-amber-100 text-amber-600"
                              : "hover:bg-emerald-100 text-emerald-600",
                          )}
                          title={doctor.is_active ? "إيقاف الحساب" : "تفعيل الحساب"}
                        >
                          {doctor.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(doctor)}
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

      {/* Doctor Details Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {!selectedDoctor && detailsLoading ? (
              <div className="flex justify-center p-16">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
              </div>
            ) : selectedDoctor ? (
              <>
                <div className="relative bg-gradient-to-r from-cyan-600 to-blue-600 p-8 pb-12 flex-shrink-0">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <div className="flex items-start gap-5 relative z-10">
                    <img
                      src={selectedDoctor.image_url}
                      alt={selectedDoctor.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
                    />
                    <div className="flex-1 text-white">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            د. {selectedDoctor.name}
                          </h2>
                          <p className="text-white/90 font-medium">
                            {selectedDoctor.specialization_ar}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
                            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />{" "}
                            {selectedDoctor.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        البريد الإلكتروني
                      </p>
                      <p className="font-medium">{selectedDoctor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-medium" dir="ltr">{selectedDoctor.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الترخيص</p>
                      <p className="font-medium">
                        {selectedDoctor.license_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">سنوات الخبرة</p>
                      <p className="font-medium">
                        {selectedDoctor.years_of_experience} سنوات
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">سعر الاستشارة</p>
                      <p className="font-medium">
                        {selectedDoctor.consultation_price} ج.م
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">نوع الجلسة</p>
                      <p className="font-medium">
                        {selectedDoctor.session_type === "video"
                          ? "فيديو"
                          : selectedDoctor.session_type === "offline"
                            ? "عيادة"
                            : "كلاهما"}
                      </p>
                    </div>
                  </div>

                  {selectedDoctor.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">نبذة</p>
                      <p className="text-foreground/80">{selectedDoctor.bio}</p>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedDoctor.documents && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">المستندات</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.documents.license_document && (
                          <a
                            href={selectedDoctor.documents.license_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-border transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">رخصة مزاولة المهنة</span>
                          </a>
                        )}
                        {selectedDoctor.documents.id_document && (
                          <a
                            href={selectedDoctor.documents.id_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-border transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">بطاقة الهوية</span>
                          </a>
                        )}
                        {selectedDoctor.documents.certificate && (
                          <a
                            href={selectedDoctor.documents.certificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-border transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">شهادة التخصص</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-border flex justify-end gap-2">
                  {selectedDoctor.verification_status === "pending" && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDetails(false);
                          openRejectModal(selectedDoctor);
                        }}
                      >
                        رفض
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          handleVerify(selectedDoctor.id);
                          setShowDetails(false);
                        }}
                      >
                        قبول الطبيب
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => setShowDetails(false)}>
                    إغلاق
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                الطبيب غير موجود
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDoctorForAction && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">رفض الطبيب</h2>
              <p className="text-muted-foreground">
                د. {selectedDoctorForAction.name}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                سبب الرفض
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب الرفض هنا..."
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none resize-none h-32"
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                loading={rejectMutation.isPending}
              >
                تأكيد الرفض
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && selectedDoctorForAction && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                إيقاف حساب الطبيب
              </h2>
              <p className="text-muted-foreground mt-1">
                هل أنت متأكد من إيقاف الحساب؟
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                سبب الإيقاف <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-500 outline-none h-32 resize-none"
                placeholder="اكتب سبب إيقاف الحساب..."
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeactivateModal(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeactivate}
                loading={toggleStatusMutation.isPending}
              >
                تأكيد الإيقاف
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
        title="حذف طبيب"
        message={`هل أنت متأكد من حذف د. ${selectedDoctorForDelete?.name}؟ سيؤدي هذا للتأثير على كافة البيانات والجدول المرتبط به.`}
        loading={deleteMutation.isPending}
      />
    </div >
  );
};

export default DoctorsManagement;
