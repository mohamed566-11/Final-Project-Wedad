import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTE_PERMISSIONS } from "@/utils/permissions";
import { ShieldX } from "lucide-react";

// Arabic labels for role names
const ROLE_LABELS: Record<string, string> = {
  super_admin: "مسؤول كامل الصلاحيات",
  admin: "مسؤول عام",
  moderator: "مشرف محتوى",
  financial_admin: "مسؤول مالي",
};

interface RequirePermissionProps {
  /** Explicit permissions to check. If provided, ROUTE_PERMISSIONS is ignored. */
  permissions?: string[];
  /** Route path to look up in ROUTE_PERMISSIONS. Used when `permissions` is not provided. */
  route?: string;
  /** Fallback: redirect to this path instead of showing access denied page */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Route-level permission guard for admin pages.
 *
 * Usage:
 *   <RequirePermission permissions={[MANAGE_USERS, VIEW_USERS]}>
 *     <UsersPage />
 *   </RequirePermission>
 *
 *   // Or auto-detect from ROUTE_PERMISSIONS:
 *   <RequirePermission route="/admin/financials">
 *     <FinancialsPage />
 *   </RequirePermission>
 */
const RequirePermission: React.FC<RequirePermissionProps> = ({
  permissions,
  route,
  redirectTo,
  children,
}) => {
  const { isSuperAdmin, hasAnyPermission, userType, user } = useAuth();
  const roleLabel = user?.role?.role
    ? (ROLE_LABELS[user.role.role] ?? user.role.role)
    : "مسؤول";

  // Only applies to admins
  if (userType !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Super admins always pass
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Resolve which permissions to check
  const requiredPermissions =
    permissions || (route ? ROUTE_PERMISSIONS[route] : undefined);

  // If no permissions defined, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check if admin has any of the required permissions
  if (hasAnyPermission(...requiredPermissions)) {
    return <>{children}</>;
  }

  // Access denied
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        لا تملك صلاحية الوصول
      </h2>
      <p className="text-slate-500 mb-2 max-w-md">
        ليس لديك الصلاحيات المطلوبة لعرض هذه الصفحة.
      </p>
      <p className="text-slate-400 text-sm mb-6">
        دورك الحالي:{" "}
        <span className="font-medium text-slate-600">{roleLabel}</span>
      </p>
      <a
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
      >
        العودة للوحة التحكم
      </a>
    </div>
  );
};

export default RequirePermission;
