import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import * as adminService from "@/services/adminService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  usePatients,
  useLifeStages,
  useTogglePatientStatus,
  useDeletePatient,
  usePatient,
} from "@/hooks/useAdminQueries";
import ConfirmModal from "@/components/common/ConfirmModal";

const PatientsManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse query params
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const is_active = searchParams.get("is_active")
    ? searchParams.get("is_active") === "1"
    : undefined;
  const is_verified = searchParams.get("is_verified")
    ? searchParams.get("is_verified") === "1"
    : undefined;
  const life_stage_id = searchParams.get("life_stage_id")
    ? parseInt(searchParams.get("life_stage_id")!)
    : undefined;

  // React Query Hooks
  const {
    data: patientsResponse,
    isLoading: loading,
    isFetching,
  } = usePatients({
    page,
    search,
    is_active,
    is_verified,
    life_stage_id,
  });

  const { data: lifeStagesResponse } = useLifeStages();

  // Mutations
  const toggleStatusMutation = useTogglePatientStatus();
  const deleteMutation = useDeletePatient();

  // Local State
  const [searchInput, setSearchInput] = useState(search);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [tempPatient, setTempPatient] = useState<any>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [selectedPatientForDeactivate, setSelectedPatientForDeactivate] =
    useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatientForDelete, setSelectedPatientForDelete] =
    useState<adminService.Patient | null>(null);

  // Derived Data
  const patients = patientsResponse?.data?.patients || [];
  const pagination = patientsResponse?.data?.pagination || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  };
  const lifeStages = lifeStagesResponse?.data?.life_stages || [];

  // Details Query
  const { data: patientDetailsResponse, isFetching: detailsLoading } =
    usePatient(detailsId || 0);
  const selectedPatient = patientDetailsResponse?.data?.patient || tempPatient;
  const patientStats = patientDetailsResponse?.data || null;

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

  const handleToggleStatus = (patient: adminService.Patient) => {
    if (patient.is_active) {
      // Deactivating requires reason
      setSelectedPatientForDeactivate(patient);
      setDeactivateReason("");
      setShowDeactivateModal(true);
    } else {
      // Activating doesn't require reason
      toggleStatusMutation.mutate(
        { id: patient.id, is_active: true },
        {
          onSuccess: () => toast.success("تم تفعيل الحساب بنجاح"),
          onError: () => toast.error("فشل في تفعيل الحساب"),
        },
      );
    }
  };

  const confirmDeactivate = () => {
    if (!selectedPatientForDeactivate || !deactivateReason.trim()) {
      toast.error("يرجى إدخال سبب الإيقاف");
      return;
    }

    toggleStatusMutation.mutate(
      {
        id: selectedPatientForDeactivate.id,
        is_active: false,
        reason: deactivateReason,
      },
      {
        onSuccess: () => {
          toast.success("تم إيقاف الحساب بنجاح");
          setShowDeactivateModal(false);
          setSelectedPatientForDeactivate(null);
        },
        onError: (error: any) => {
          const message =
            error.response?.data?.message || "فشل في إيقاف الحساب";
          toast.error(message);
        },
      },
    );
  };

  const handleDelete = (patient: adminService.Patient) => {
    setSelectedPatientForDelete(patient);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedPatientForDelete) return;

    deleteMutation.mutate(selectedPatientForDelete.id, {
      onSuccess: () => {
        toast.success("تم حذف المريض بنجاح");
        setShowDeleteModal(false);
        setSelectedPatientForDelete(null);
      },
      onError: () => toast.error("فشل في حذف المريض"),
    });
  };

  const handleViewDetails = (patient: any) => {
    setTempPatient(patient);
    setDetailsId(patient.id);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المرضى</h1>
          <p className="text-muted-foreground">إجمالي {pagination.total} مريض</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="البحث بالاسم أو البريد أو الهاتف..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={is_active === undefined ? "" : is_active ? "1" : "0"}
            onChange={(e) => handleFilterChange("is_active", e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none min-w-[150px]"
          >
            <option value="">كل الحالات</option>
            <option value="1">نشط</option>
            <option value="0">غير نشط</option>
          </select>

          {/* Verified Filter */}
          <select
            value={is_verified === undefined ? "" : is_verified ? "1" : "0"}
            onChange={(e) => handleFilterChange("is_verified", e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none min-w-[150px]"
          >
            <option value="">التحقق</option>
            <option value="1">تم التحقق</option>
            <option value="0">لم يتم التحقق</option>
          </select>

          {/* Life Stage Filter */}
          <select
            value={life_stage_id || ""}
            onChange={(e) =>
              handleFilterChange("life_stage_id", e.target.value)
            }
            className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none min-w-[150px]"
          >
            <option value="">كل المراحل</option>
            {lifeStages.map((stage: any) => (
              <option key={stage.id} value={stage.id}>
                {stage.display_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card variant="elevated" className="overflow-hidden">
        {loading && !isFetching && patients.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-16 h-16 text-border mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد مرضى</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-y-2 px-2">
              <thead>
                <tr>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    المريض
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التواصل
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    المرحلة
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    الحالة
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    التسجيل
                  </th>
                  <th className="text-right py-4 px-5 font-semibold text-foreground/70 text-sm">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient: any) => (
                  <tr
                    key={patient.id}
                    className="bg-white hover:bg-slate-50/80 transition-all rounded-2xl shadow-sm border border-slate-100 group"
                  >
                    <td className="py-4 px-5 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={patient.image_url}
                          alt={patient.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            {patient.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} سنة
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {patient.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {patient.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <span className="px-3 py-1 rounded-full text-sm bg-violet-100 text-violet-700">
                        {patient.life_stage?.display_name || "غير محدد"}
                      </span>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                            patient.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700",
                          )}
                        >
                          {patient.is_active ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {patient.is_active ? "نشط" : "غير نشط"}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                            patient.is_verified
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {patient.is_verified ? "تم التحقق" : "لم يتم التحقق"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {patient.joined_at}
                      </div>
                    </td>
                    <td className="py-4 px-5 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(patient)}
                          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(patient)}
                          disabled={
                            toggleStatusMutation.isPending &&
                            toggleStatusMutation.variables?.id === patient.id
                          }
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            patient.is_active
                              ? "hover:bg-amber-100 text-amber-600"
                              : "hover:bg-emerald-100 text-emerald-600",
                          )}
                          title={patient.is_active ? "إيقاف" : "تفعيل"}
                        >
                          {toggleStatusMutation.isPending &&
                            toggleStatusMutation.variables?.id === patient.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : patient.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(patient)}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === patient.id
                          }
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

      {/* Patient Details Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {!selectedPatient && detailsLoading ? (
              <div className="flex justify-center p-16">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
              </div>
            ) : selectedPatient ? (
              <>
                {/* Modal Header with Gradient */}
                <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-8 pb-12 flex-shrink-0">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-5 relative z-10">
                    <img
                      src={selectedPatient.image_url}
                      alt={selectedPatient.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
                    />
                    <div className="text-white">
                      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        {selectedPatient.name}
                        {detailsLoading && <Loader2 className="w-4 h-4 animate-spin text-white/70" />}
                      </h2>
                      <p className="text-white/80 flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" /> {selectedPatient.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">العمر</p>
                      <p className="font-medium">{selectedPatient.age} سنة</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المرحلة</p>
                      <p className="font-medium">
                        {selectedPatient.life_stage?.display_name || "غير محدد"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                      <p className="font-medium">{selectedPatient.joined_at}</p>
                    </div>
                  </div>

                  {selectedPatient.profile && (
                    <>
                      <h3 className="font-semibold text-foreground mt-6">
                        المعلومات الطبية
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">الطول</p>
                          <p className="font-medium">
                            {selectedPatient.profile.height || "-"} سم
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الوزن</p>
                          <p className="font-medium">
                            {selectedPatient.profile.weight || "-"} كجم
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">فصيلة الدم</p>
                          <p className="font-medium">
                            {selectedPatient.profile.blood_type || "-"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4 border-t border-border flex justify-end">
                  <Button variant="ghost" onClick={() => setShowDetails(false)}>
                    إغلاق
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                المريض غير موجود
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && selectedPatientForDeactivate && (
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
                إيقاف حساب المريض
              </h2>
              <p className="text-muted-foreground mt-1">
                هل أنت متأكد من إيقاف حساب {selectedPatientForDeactivate.name}؟
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
        title="حذف مريض"
        message={`هل أنت متأكد من حذف المريض ${selectedPatientForDelete?.name}؟ سيؤدي هذا للتأثير على كافة البيانات المرتبطة به.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PatientsManagement;
