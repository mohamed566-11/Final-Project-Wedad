import React, { useEffect, useState } from "react";
import {
  Search,
  Shield,
  Mail,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit2,
  Loader2,
  UserCog,
  Crown,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import * as adminService from "@/services/adminService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";

interface Role {
  id: number;
  role: string;
  description?: string;
}

const AdminsManagement: React.FC = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<adminService.Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<adminService.Admin | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role_id: "",
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<adminService.Admin | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adminsRes, rolesRes] = await Promise.all([
        adminService.getAdmins({ search: search || undefined }),
        adminService.getRoles(),
      ]);
      setAdmins(adminsRes.data.data.admins || []);
      setRoles(rolesRes.data.data.roles || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingAdmin(null);
    setFormData({ name: "", email: "", password: "", phone: "", role_id: "" });
    setShowModal(true);
  };

  const openEditModal = (admin: adminService.Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      phone: admin.phone || "",
      role_id: String(admin.role.id),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role_id) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error("كلمة المرور مطلوبة");
      return;
    }

    try {
      setFormLoading(true);

      const data: any = {
        name: formData.name,
        email: formData.email,
        role_id: Number(formData.role_id),
      };

      if (formData.phone) data.phone = formData.phone;
      if (formData.password) data.password = formData.password;

      if (editingAdmin) {
        await adminService.updateAdmin(editingAdmin.id, data);
        toast.success("تم تحديث المسؤول بنجاح");
      } else {
        data.password = formData.password;
        await adminService.createAdmin(data);
        toast.success("تم إضافة المسؤول بنجاح");
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const firstErrorKey = Object.keys(error.response.data.errors)[0];
        toast.error(error.response.data.errors[firstErrorKey][0]);
      } else {
        toast.error(error.response?.data?.message || "حدث خطأ");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const toggleAdminStatus = async (admin: adminService.Admin) => {
    if (admin.is_super_admin) {
      toast.error("لا يمكن تغيير حالة المسؤول العام");
      return;
    }

    if (user && admin.id === user.id) {
      toast.error("لا يمكنك إيقاف حسابك بنفسك");
      return;
    }

    try {
      setActionLoading(admin.id);
      await adminService.toggleAdminStatus(admin.id, !admin.is_active);
      toast.success(admin.is_active ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
      loadData();
    } catch (error) {
      toast.error("فشل في تغيير حالة الحساب");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAdmin = (admin: adminService.Admin) => {
    if (admin.is_super_admin) {
      toast.error("لا يمكن حذف المسؤول العام");
      return;
    }

    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteAdmin(adminToDelete.id);
      toast.success("تم حذف المسؤول بنجاح");
      setShowDeleteModal(false);
      setAdminToDelete(null);
      loadData();
    } catch (error) {
      toast.error("فشل في حذف المسؤول");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAdmins = selectedRoleFilter
    ? admins.filter((a) => a.role.id === Number(selectedRoleFilter))
    : admins;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "admin":
        return "bg-gradient-to-r from-violet-500 to-purple-500 text-white";
      default:
        return "bg-muted/50 text-foreground/80";
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المسؤولين</h1>
          <p className="text-muted-foreground">إجمالي {admins.length} مسؤول</p>
        </div>
        <Button variant="admin" icon={Plus} onClick={openAddModal}>
          إضافة مسؤول
        </Button>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث بالاسم أو البريد..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
              />
            </div>
          </form>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none min-w-[150px]"
          >
            <option value="">كل الأدوار</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.role}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Admins Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : filteredAdmins.length === 0 ? (
        <Card variant="elevated" className="p-16 text-center">
          <Shield className="w-16 h-16 text-border mx-auto mb-4" />
          <p className="text-muted-foreground">لا يوجد مسؤولين</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-cyan-100 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Decorative Background Blob */}
              <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-cyan-50 rounded-bl-full opacity-50 group-hover:bg-cyan-100 transition-colors -z-10" />

              <div className="flex items-start gap-4 z-10">
                <div className="relative">
                  <img
                    src={admin.image_url}
                    alt={admin.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm ring-2 ring-transparent group-hover:ring-cyan-100 transition-all"
                  />
                  {admin.is_super_admin && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      <Crown className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="font-bold text-foreground text-lg truncate group-hover:text-cyan-700 transition-colors">
                    {admin.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-4 h-4" /> {admin.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide",
                        getRoleBadgeColor(admin.role.role),
                      )}
                    >
                      {admin.role.role === "super_admin"
                        ? "مسؤول عام"
                        : admin.role.role === "admin"
                          ? "مدير نظام"
                          : admin.role.role}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        admin.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {admin.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                </div>
              </div>

              {!admin.is_super_admin && user?.id !== admin.id && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => openEditModal(admin)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">تعديل</span>
                  </button>
                  <button
                    onClick={() => toggleAdminStatus(admin)}
                    disabled={
                      actionLoading === admin.id ||
                      (user && admin.id === user.id)
                    }
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors",
                      user && admin.id === user.id
                        ? "opacity-50 cursor-not-allowed bg-muted/50 text-muted-foreground"
                        : admin.is_active
                          ? "hover:bg-amber-100 text-amber-600"
                          : "hover:bg-emerald-100 text-emerald-600",
                    )}
                  >
                    {actionLoading === admin.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : admin.is_active ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span className="text-sm">إيقاف</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span className="text-sm">تفعيل</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteAdmin(admin)}
                    disabled={actionLoading === admin.id}
                    className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 pb-8 relative text-white text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                {editingAdmin ? <UserCog className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-white" />}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {editingAdmin ? "تعديل المسؤول" : "إضافة مسؤول جديد"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 -mt-6 bg-white rounded-t-3xl pt-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-1.5 ml-1">
                  الاسم <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                    placeholder="أدخل الاسم الرباعي"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-1.5 ml-1">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  placeholder="admin@widad.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-1.5 ml-1">
                  كلمة المرور {editingAdmin ? <span className="text-muted-foreground font-normal">(اتركها فارغة للإبقاء)</span> : <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-1.5 ml-1">
                  هاتف التواصل
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  placeholder="01x xxxx xxxx"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-1.5 ml-1">
                  المنصب / الصلاحية <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role_id: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled>اختر الدور المناسب</option>
                  {roles
                    .filter((r) => r.role !== "super_admin")
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  variant="admin"
                  type="submit"
                  loading={formLoading}
                  className="flex-1 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {editingAdmin ? "حفظ التعديلات" : "إضافة مسؤول"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="حذف مسؤول"
        message={`هل أنت متأكد من حذف المسؤول ${adminToDelete?.name}؟`}
        loading={isDeleting}
      />
    </div>
  );
};

export default AdminsManagement;
