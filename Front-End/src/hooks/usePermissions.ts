import { useAuth } from "@/contexts/AuthContext";
import { ROUTE_PERMISSIONS } from "@/utils/permissions";

/**
 * Hook providing permission utilities for the current admin user.
 *
 * Usage:
 *   const { hasPermission, canAccessRoute, filterNavItems } = usePermissions();
 *   if (hasPermission('manage_users')) { ... }
 */
export function usePermissions() {
  const {
    hasPermission,
    hasAnyPermission,
    isSuperAdmin,
    permissions,
    userType,
  } = useAuth();

  /**
   * Check if the current admin can access a specific route path.
   * Returns true if super_admin, or if the admin has ANY of the required permissions for that route.
   */
  const canAccessRoute = (path: string): boolean => {
    if (userType !== "admin") return false;
    if (isSuperAdmin) return true;

    const requiredPermissions = ROUTE_PERMISSIONS[path];
    if (!requiredPermissions) return true; // No permission requirement = accessible

    return requiredPermissions.some((p) => permissions.includes(p));
  };

  /**
   * Filter navigation items based on the current admin's permissions.
   * Items without a matching ROUTE_PERMISSIONS entry are always shown.
   */
  const filterNavItems = <
    T extends { path: string; children?: { path: string }[] },
  >(
    items: T[],
  ): T[] => {
    if (isSuperAdmin) return items;

    return items
      .filter((item) => canAccessRoute(item.path))
      .map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child) =>
            canAccessRoute(child.path),
          );
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter(Boolean) as T[];
  };

  return {
    hasPermission,
    hasAnyPermission,
    canAccessRoute,
    filterNavItems,
    isSuperAdmin,
    permissions,
  };
}
