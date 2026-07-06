import React, { useState, useMemo } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTE_PERMISSIONS } from "@/utils/permissions";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Stethoscope,
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Bell,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  UserPlus,
  HelpCircle,
  Info,
  ClipboardList,
  Bot,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import publicService from "@/services/publicService";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: { path: string; label: string }[];
}

const AdminLayout: React.FC = () => {
  const { user, logout, isSuperAdmin, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const { data: settingsResponse } = useQuery({
    queryKey: ["publicSiteSettings"],
    queryFn: async () => {
      const response = await publicService.getSiteSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const settings = settingsResponse?.data;

  // Close sidebar on route change (mobile mainly)
  // React.useEffect(() => { ... }, [location.pathname]);
  // Sheet handles generic closing on click usually, or we control state.

  const navItems: NavItem[] = [
    { path: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    {
      path: "/admin/users",
      label: "إدارة المستخدمين",
      icon: Users,
      children: [
        { path: "/admin/users/patients", label: "المرضى" },
        { path: "/admin/users/doctors", label: "الأطباء" },
        { path: "/admin/users/admins", label: "المسؤولين" },
      ],
    },
    { path: "/admin/join-requests", label: "طلبات الانضمام", icon: UserPlus },
    { path: "/admin/consultations", label: "الاستشارات", icon: Calendar },
    { path: "/admin/articles", label: "المقالات", icon: FileText },
    {
      path: "/admin/chatbot",
      label: "المساعد الذكي",
      icon: Bot,
      children: [
        { path: "/admin/chatbot/stats", label: "الإحصائيات" },
        { path: "/admin/knowledge-base", label: "قاعدة المعرفة" },
      ],
    },
    { path: "/admin/financials", label: "الماليات", icon: DollarSign },
    { path: "/admin/messages", label: "الرسائل", icon: MessageSquare },
    { path: "/admin/notifications", label: "الإشعارات", icon: Bell },
    { path: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
    { path: "/admin/ai-analytics", label: "تحليلات الذكاء الاصطناعي", icon: Brain },
    { path: "/admin/audit-logs", label: "سجلات التدقيق", icon: ClipboardList },
    { path: "/admin/faqs", label: "الأسئلة الشائعة", icon: HelpCircle },
    { path: "/admin/about", label: "من نحن", icon: Info },
    { path: "/admin/settings", label: "الإعدادات", icon: Settings },
  ];

  // Filter nav items based on current admin's permissions
  const filteredNavItems = useMemo(() => {
    if (isSuperAdmin) return navItems;

    return navItems
      .map((item) => {
        // Check if the route has required permissions
        const requiredPerms = ROUTE_PERMISSIONS[item.path];
        // If no permissions defined for this route, always show it
        if (!requiredPerms) return item;
        // Check if admin has any of the required permissions
        if (!hasAnyPermission(...requiredPerms)) return null;

        // Filter children if present
        if (item.children) {
          const filteredChildren = item.children.filter((child) => {
            const childPerms = ROUTE_PERMISSIONS[child.path];
            if (!childPerms) return true;
            return hasAnyPermission(...childPerms);
          });
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }

        return item;
      })
      .filter(Boolean) as NavItem[];
  }, [isSuperAdmin, hasAnyPermission]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  // Reusable Sidebar Content
  const SidebarContent = ({ isCollapsed = false, isMobile = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-violet-900 via-violet-800 to-indigo-900 text-white">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md rounded-full bg-white p-1" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="font-bold text-white text-lg">{settings?.site_name || "وداد"} - الإدارة</span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white",
              isCollapsed && "mx-auto",
            )}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        {isMobile && (
          // Close button handled by Sheet usually, but here we can have extra custom controls
          <div />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <div key={item.path}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleSubmenu(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                    "text-white/70 hover:text-white hover:bg-white/10",
                    "transition-all duration-200",
                    expandedMenu === item.path && "bg-white/10 text-white",
                    isCollapsed && !isMobile && "justify-center px-0",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon size={20} />
                  {(!isCollapsed || isMobile) && (
                    <>
                      <span className="flex-1 text-right">{item.label}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform",
                          expandedMenu === item.path && "rotate-180",
                        )}
                      />
                    </>
                  )}
                </button>
                {(!isCollapsed || isMobile) && expandedMenu === item.path && (
                  <div className="mr-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-2 rounded-lg text-sm",
                            "transition-all duration-200",
                            isActive
                              ? "bg-white/20 text-white font-medium"
                              : "text-white/60 hover:text-white hover:bg-white/10",
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                    "transition-all duration-200",
                    isActive
                      ? "bg-white/20 text-white font-medium shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                    isCollapsed && !isMobile && "justify-center px-2",
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                {item.badge && (!isCollapsed || isMobile) && (
                  <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && !isMobile && "justify-center",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <NavLink to="/admin/profile" className="block group">
                <p className="text-white font-medium text-sm truncate group-hover:text-violet-200 transition-colors">
                  {user?.name}
                </p>
                <p className="text-white/60 text-xs truncate group-hover:text-white/80 transition-colors">
                  {isSuperAdmin
                    ? "مسؤول كامل الصلاحيات"
                    : user?.role?.role === "admin"
                      ? "مسؤول عام"
                      : user?.role?.role === "moderator"
                        ? "مشرف محتوى"
                        : user?.role?.role === "financial_admin"
                          ? "مسؤول مالي"
                          : (user?.role?.role ?? "مسؤول")}
                </p>
              </NavLink>
            </div>
          )}
          {(!isCollapsed || isMobile) && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col md:flex-row"
      dir="rtl"
    >
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block fixed right-0 top-0 z-40 h-screen",
          "transition-all duration-300 shadow-2xl",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <SidebarContent isCollapsed={!sidebarOpen} />
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          sidebarOpen ? "md:mr-64" : "md:mr-20",
        )}
      >
        {/* Header */}
        <header className="h-16 bg-white shadow-sm sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600"
                  >
                    <Menu size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-64 border-none">
                  <SidebarContent isMobile={true} />
                </SheetContent>
              </Sheet>
            </div>

            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                لوحة تحكم الإدارة
              </h1>
              <p className="text-xs md:text-sm text-slate-500 hidden sm:block">
                مرحباً بك، {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
