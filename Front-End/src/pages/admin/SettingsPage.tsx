import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Settings,
  Globe,
  Shield,
  Loader2,
  Save,
  Upload,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useSiteSettings,
  useUpdateSiteSettings,
  useSettingsRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useSystemSettings,
} from "@/hooks/useAdminQueries";

interface SiteSettings {
  site_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  small_description: string;
  logo: string | null;
  favicon: string | null;
  social_media: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
}

interface Role {
  id: number;
  role: string;
  description: string;
  permissions: string[];
  admins_count?: number;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin;
  const [activeTab, setActiveTab] = useState<
    "site" | "roles" | "system" | "legal"
  >("site");

  // Queries
  // We can conditionally enable queries based on active tab, but usually fetching settings is light.
  // Or we fetch all, or use 'enabled' flag. Let's use 'enabled'.

  const { data: siteSettingsResponse, isLoading: siteLoading } =
    useSiteSettings();

  const { data: rolesResponse, isLoading: rolesLoading } = useSettingsRoles();

  const { data: systemSettingsResponse, isLoading: systemLoading } =
    useSystemSettings();

  // Mutations
  const updateSiteMutation = useUpdateSiteSettings();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Local State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [localSiteSettings, setLocalSiteSettings] =
    useState<SiteSettings | null>(null);

  // Sync local site settings with fetched data
  React.useEffect(() => {
    if (siteSettingsResponse?.data) {
      const data = siteSettingsResponse.data as any;
      setLocalSiteSettings(data);
      if (data.terms_content) setTermsContent(data.terms_content);
      if (data.privacy_content) setPrivacyContent(data.privacy_content);
    }
  }, [siteSettingsResponse]);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    role: "",
    description: "",
    permissions: [] as string[],
  });

  // Terms & Privacy State
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [savingLegal, setSavingLegal] = useState(false);

  // Derived Data
  const roles = rolesResponse?.data?.roles || [];
  const availablePermissions = rolesResponse?.data?.available_permissions || {};
  const systemSettings = systemSettingsResponse?.data || null;

  const isLoading =
    (activeTab === "site" && siteLoading) ||
    (activeTab === "roles" && rolesLoading) ||
    (activeTab === "system" && systemLoading);

  // Handlers
  const saveSiteSettings = () => {
    if (!localSiteSettings) return;

    const formData = new FormData();

    formData.append("name", localSiteSettings.site_name);
    formData.append("email", localSiteSettings.email);
    if (localSiteSettings.phone)
      formData.append("phone", localSiteSettings.phone);
    if (localSiteSettings.country)
      formData.append("country", localSiteSettings.country);
    if (localSiteSettings.city) formData.append("city", localSiteSettings.city);
    if (localSiteSettings.street)
      formData.append("street", localSiteSettings.street);
    if (localSiteSettings.small_description)
      formData.append("small_description", localSiteSettings.small_description);
    if (localSiteSettings.social_media.facebook)
      formData.append("facebook_url", localSiteSettings.social_media.facebook);
    if (localSiteSettings.social_media.twitter)
      formData.append("twitter_url", localSiteSettings.social_media.twitter);
    if (localSiteSettings.social_media.instagram)
      formData.append(
        "instagram_url",
        localSiteSettings.social_media.instagram,
      );
    if (localSiteSettings.social_media.youtube)
      formData.append("youtube_url", localSiteSettings.social_media.youtube);

    if (logoFile) formData.append("logo", logoFile);
    if (faviconFile) formData.append("favicon", faviconFile);

    updateSiteMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("تم حفظ الإعدادات بنجاح");
        setLogoFile(null);
        setFaviconFile(null);
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        if (errorData?.errors) {
          Object.values(errorData.errors).forEach((errArray: any) => {
            if (Array.isArray(errArray)) {
              errArray.forEach((msg: string) => toast.error(msg));
            }
          });
        } else {
          toast.error(errorData?.message || "فشل في حفظ الإعدادات، تأكد من صحة البيانات المدخلة");
        }
      },
    });
  };

  const openRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        role: role.role,
        description: role.description || "",
        permissions: role.permissions || [],
      });
    } else {
      setEditingRole(null);
      setRoleForm({ role: "", description: "", permissions: [] });
    }
    setShowRoleModal(true);
  };

  const saveRole = () => {
    if (!roleForm.role || roleForm.permissions.length === 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate(
        {
          id: editingRole.id,
          data: {
            description: roleForm.description,
            permissions: roleForm.permissions,
          },
        },
        {
          onSuccess: () => {
            toast.success("تم تحديث الدور بنجاح");
            setShowRoleModal(false);
          },
          onError: () => toast.error("فشل في حفظ الدور"),
        },
      );
    } else {
      createRoleMutation.mutate(roleForm, {
        onSuccess: () => {
          toast.success("تم إنشاء الدور بنجاح");
          setShowRoleModal(false);
        },
        onError: () => toast.error("فشل في حفظ الدور"),
      });
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.role === "super_admin" || role.role === "admin") {
      toast.error("لا يمكن حذف هذا الدور");
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف الدور "${role.role}"؟`)) return;

    deleteRoleMutation.mutate(role.id, {
      onSuccess: () => toast.success("تم حذف الدور"),
      onError: () => toast.error("فشل في حذف الدور"),
    });
  };

  const togglePermission = (permission: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات المنصة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "site", label: "إعدادات الموقع", icon: Globe },
          { id: "roles", label: "الأدوار والصلاحيات", icon: Shield },
          { id: "legal", label: "الشروط والخصوصية", icon: FileText },
          { id: "system", label: "معلومات النظام", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary-500 text-primary-600"
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
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Site Settings Tab */}
          {activeTab === "site" && localSiteSettings && (
            <div className="space-y-6">
              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      اسم الموقع
                    </label>
                    <input
                      type="text"
                      value={localSiteSettings.site_name}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev ? { ...prev, site_name: e.target.value } : prev,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={localSiteSettings.email}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev ? { ...prev, email: e.target.value } : prev,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      الهاتف
                    </label>
                    <input
                      type="tel"
                      value={localSiteSettings.phone}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev ? { ...prev, phone: e.target.value } : prev,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      البلد
                    </label>
                    <input
                      type="text"
                      value={localSiteSettings.country}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev ? { ...prev, country: e.target.value } : prev,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      المدينة
                    </label>
                    <input
                      type="text"
                      value={localSiteSettings.city}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev ? { ...prev, city: e.target.value } : prev,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={localSiteSettings.street}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev ? { ...prev, street: e.target.value } : prev,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    وصف مختصر
                  </label>
                  <textarea
                    value={localSiteSettings.small_description}
                    onChange={(e) =>
                      setLocalSiteSettings((prev) =>
                        prev
                          ? { ...prev, small_description: e.target.value }
                          : prev,
                      )
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none resize-none h-24"
                  />
                </div>
              </Card>

              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  الشعار والأيقونة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      الشعار (Logo)
                    </label>
                    <div className="flex items-center gap-4">
                      {(localSiteSettings.logo || logoFile) && (
                        <img
                          src={
                            logoFile
                              ? URL.createObjectURL(logoFile)
                              : localSiteSettings.logo!
                          }
                          alt="Logo"
                          className="w-20 h-20 object-contain bg-white rounded-full shadow-md border-2 border-primary/20 p-2"
                        />
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-border rounded-xl cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">تحميل شعار</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setLogoFile(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      أيقونة الموقع (Favicon)
                    </label>
                    <div className="flex items-center gap-4">
                      {(localSiteSettings.favicon || faviconFile) && (
                        <img
                          src={
                            faviconFile
                              ? URL.createObjectURL(faviconFile)
                              : localSiteSettings.favicon!
                          }
                          alt="Favicon"
                          className="w-12 h-12 object-contain bg-white rounded-full shadow-md border-2 border-primary/20 p-1.5"
                        />
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-border rounded-xl cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">تحميل أيقونة</span>
                        <input
                          type="file"
                          accept="image/png,image/x-icon"
                          className="hidden"
                          onChange={(e) =>
                            setFaviconFile(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </Card>

              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  وسائل التواصل الاجتماعي
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={localSiteSettings.social_media.facebook}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                social_media: {
                                  ...prev.social_media,
                                  facebook: e.target.value,
                                },
                              }
                            : prev,
                        )
                      }
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={localSiteSettings.social_media.twitter}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                social_media: {
                                  ...prev.social_media,
                                  twitter: e.target.value,
                                },
                              }
                            : prev,
                        )
                      }
                      placeholder="https://twitter.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={localSiteSettings.social_media.instagram}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                social_media: {
                                  ...prev.social_media,
                                  instagram: e.target.value,
                                },
                              }
                            : prev,
                        )
                      }
                      placeholder="https://instagram.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      YouTube
                    </label>
                    <input
                      type="url"
                      value={localSiteSettings.social_media.youtube}
                      onChange={(e) =>
                        setLocalSiteSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                social_media: {
                                  ...prev.social_media,
                                  youtube: e.target.value,
                                },
                              }
                            : prev,
                        )
                      }
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  variant="admin"
                  icon={Save}
                  onClick={saveSiteSettings}
                  loading={updateSiteMutation.isPending}
                >
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                {isSuperAdmin && (
                  <Button
                    variant="admin"
                    icon={Plus}
                    onClick={() => openRoleModal()}
                  >
                    إضافة دور جديد
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role: Role) => (
                  <Card key={role.id} variant="elevated" className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {role.role}
                        </h3>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                      {role.admins_count !== undefined && (
                        <span className="px-2 py-1 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                          {role.admins_count} مسؤول
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {role.permissions.slice(0, 3).map((perm: string) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs"
                        >
                          {availablePermissions[perm] || perm}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-full text-xs">
                          +{role.permissions.length - 3}
                        </span>
                      )}
                    </div>

                    {isSuperAdmin && role.role !== "super_admin" && (
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <button
                          onClick={() => openRoleModal(role)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors text-sm"
                        >
                          <Edit2 className="w-4 h-4" /> تعديل
                        </button>
                        {role.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && systemSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="elevated" className="p-5">
                <h3 className="font-semibold text-foreground mb-4">
                  معلومات التطبيق
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">الاسم</span>
                    <span className="font-medium">
                      {systemSettings.app?.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">البيئة</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        systemSettings.app?.environment === "production"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {systemSettings.app?.environment}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">وضع التصحيح</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        systemSettings.app?.debug
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {systemSettings.app?.debug ? "مفعل" : "معطل"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">رابط التطبيق</span>
                    <span className="font-medium text-sm">
                      {systemSettings.app?.url}
                    </span>
                  </div>
                </div>
              </Card>

              <Card variant="elevated" className="p-5">
                <h3 className="font-semibold text-foreground mb-4">
                  الخدمات المتصلة
                </h3>
                <div className="space-y-3">
                  {Object.entries(systemSettings.services || {}).map(
                    ([key, value]: [string, any]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2 border-b border-border last:border-0"
                      >
                        <span className="text-muted-foreground capitalize">
                          {key.replace("_", " ")}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            value.configured
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted/50 text-muted-foreground",
                          )}
                        >
                          {value.configured ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> متصل
                            </>
                          ) : (
                            "غير متصل"
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </Card>


            </div>
          )}

          {/* Terms & Privacy Tab */}
          {activeTab === "legal" && (
            <div className="space-y-6">
              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  الشروط والأحكام
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  المحتوى الذي سيظهر في صفحة الشروط والأحكام. يمكنك استخدام HTML
                  للتنسيق.
                </p>
                <textarea
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary-500 outline-none resize-y min-h-[200px] font-mono text-sm"
                  placeholder="أدخل محتوى الشروط والأحكام هنا..."
                  dir="rtl"
                />
              </Card>

              <Card variant="elevated" className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  سياسة الخصوصية
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  المحتوى الذي سيظهر في صفحة سياسة الخصوصية. يمكنك استخدام HTML
                  للتنسيق.
                </p>
                <textarea
                  value={privacyContent}
                  onChange={(e) => setPrivacyContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary-500 outline-none resize-y min-h-[200px] font-mono text-sm"
                  placeholder="أدخل محتوى سياسة الخصوصية هنا..."
                  dir="rtl"
                />
              </Card>

              <div className="flex justify-end">
                <Button
                  variant="admin"
                  icon={Save}
                  loading={savingLegal}
                  onClick={async () => {
                    setSavingLegal(true);
                    try {
                      const formData = new FormData();
                      formData.append("terms_content", termsContent);
                      formData.append("privacy_content", privacyContent);
                      await updateSiteMutation.mutateAsync(formData);
                      toast.success("تم حفظ الشروط والخصوصية بنجاح");
                    } catch (error) {
                      toast.error("فشل في حفظ الإعدادات");
                    } finally {
                      setSavingLegal(false);
                    }
                  }}
                >
                  حفظ الشروط والخصوصية
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRoleModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {editingRole ? "تعديل الدور" : "إضافة دور جديد"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  اسم الدور
                </label>
                <input
                  type="text"
                  value={roleForm.role}
                  onChange={(e) =>
                    setRoleForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  disabled={!!editingRole}
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none disabled:bg-muted/50"
                  placeholder="مثال: content_manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  الوصف
                </label>
                <input
                  type="text"
                  value={roleForm.description}
                  onChange={(e) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-500 outline-none"
                  placeholder="وصف مختصر للدور"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  الصلاحيات
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-muted rounded-xl">
                  {Object.entries(availablePermissions).map(
                    ([key, label]: [string, any]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                          roleForm.permissions.includes(key)
                            ? "bg-primary-100"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(key)}
                          onChange={() => togglePermission(key)}
                          className="rounded text-primary-500"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowRoleModal(false)}>
                إلغاء
              </Button>
              <Button
                variant="admin"
                onClick={saveRole}
                loading={
                  createRoleMutation.isPending || updateRoleMutation.isPending
                }
              >
                {editingRole ? "حفظ التعديلات" : "إنشاء"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
