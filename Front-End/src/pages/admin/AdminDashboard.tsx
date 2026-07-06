import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Activity, LogOut } from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <header className="bg-card shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-admin/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-admin" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">{user?.name}</h1>
              <p className="text-sm text-muted-foreground">لوحة تحكم الإدارة</p>
            </div>
          </div>
          <Button variant="ghost" icon={LogOut} onClick={handleLogout}>
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-admin/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-admin" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">1,234</p>
                <p className="text-muted-foreground">إجمالي المستخدمين</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center">
                <Activity className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">98%</p>
                <p className="text-muted-foreground">نسبة النشاط</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
