import React, { useState, useEffect } from "react";
import { UserCog, Mail, Shield } from "lucide-react";
import Card from "@/components/common/Card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as adminService from "@/services/adminService";

const AdminProfilePage: React.FC = () => {
    const { user, fetchUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                phone: user.phone || "",
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await adminService.updateAdminProfile(formData);
            await fetchUserData(); // Refresh global user object
            toast.success("تم تحديث الملف الشخصي بنجاح");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "فشل في تحديث الملف الشخصي");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">الملف الشخصي</h1>
                <p className="text-muted-foreground">إدارة معلوماتك الشخصية وبيانات التواصل الخاص بك.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Details Sidebar */}
                <div className="md:col-span-1">
                    <Card variant="elevated" className="p-6 text-center">
                        <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                            <UserCog className="w-10 h-10 text-violet-600" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-1">
                            {user.name}
                        </h2>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-sm font-medium mb-4">
                            <Shield className="w-3.5 h-3.5" />
                            {user.role?.role === "super_admin"
                                ? "مسؤول كامل الصلاحيات"
                                : user.role?.role === "admin"
                                    ? "مسؤول عام"
                                    : user.role?.role === "moderator"
                                        ? "مشرف محتوى"
                                        : "مسؤول مالي"}
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-3 mt-2">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <span className="text-emerald-600 font-medium">الحساب نشط</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Edit Form Main Column */}
                <div className="md:col-span-2">
                    <Card variant="elevated" className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-violet-600 rounded-full inline-block"></span>
                            تحديث البيانات
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                        الاسم الكامل <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="tel"
                                        dir="ltr"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-left"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-50 opacity-60 cursor-not-allowed rounded-xl border border-slate-200 outline-none text-left"
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        * لا يمكن تعديل البريد لأسباب أمنية.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:bg-violet-800 transition-colors font-medium flex items-center justify-center min-w-[140px] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        "حفظ التعديلات"
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminProfilePage;
