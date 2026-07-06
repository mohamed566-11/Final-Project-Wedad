import React, { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Star,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Stethoscope,
  User,
  Bell,
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

const DoctorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const navItems: NavItem[] = [
    { path: "/doctor/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { path: "/doctor/consultations", label: "الاستشارات", icon: Calendar },
    { path: "/doctor/patients", label: "المرضى", icon: Users },
    { path: "/doctor/articles", label: "المقالات", icon: FileText },
    { path: "/doctor/financials", label: "الأرباح", icon: DollarSign },
    { path: "/doctor/reviews", label: "التقييمات", icon: Star },
    { path: "/doctor/ai-center", label: "التنبؤات الذكية", icon: Brain },
    { path: "/doctor/notifications", label: "الإشعارات", icon: Bell },
    {
      path: "/doctor/profile",
      label: "الملف الشخصي",
      icon: User,
      children: [
        { path: "/doctor/profile", label: "عرض الملف" },
        { path: "/doctor/working-hours", label: "ساعات العمل" },
        { path: "/doctor/settings/google-connect", label: "ربط Google Meet" },
        { path: "/doctor/change-password", label: "تغيير كلمة السر" },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  const SidebarContent = ({ isCollapsed = false, isMobile = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-cyan-800 to-blue-900 text-white">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md rounded-full bg-white p-1" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="font-bold text-white text-lg">{settings?.site_name || "وداد"} - الأطباء</span>
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
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
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
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && !isMobile && "justify-center",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {user?.image_url ? (
              <img
                src={user.image_url}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.name}
              </p>
              <p className="text-white/60 text-xs">طبيب</p>
            </div>
          )}
          {(!isCollapsed || isMobile) && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
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
      <aside
        className={cn(
          "hidden md:block fixed right-0 top-0 z-40 h-screen",
          "transition-all duration-300 shadow-2xl",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <SidebarContent isCollapsed={!sidebarOpen} />
      </aside>

      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen layout-content",
          sidebarOpen ? "md:mr-64" : "md:mr-20",
        )}
      >
        <header className="h-16 bg-white shadow-sm sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
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
                لوحة الطبيب
              </h1>
              <p className="text-xs md:text-sm text-slate-500 hidden sm:block">
                مرحباً بك، {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <div className="p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout;
