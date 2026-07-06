import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  UserPlus,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useRecentActivity } from "@/hooks/useAdminQueries";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color: "primary" | "success" | "warning" | "danger" | "info" | "violet";
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  onClick,
}) => {
  const colorClasses = {
    primary: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white",
    success: "bg-gradient-to-br from-emerald-500 to-primary-700 text-white",
    warning: "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
    danger: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
    info: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    violet: "bg-gradient-to-br from-violet-500 to-violet-600 text-white",
  };

  const iconBg = {
    primary: "bg-white/20",
    success: "bg-white/20",
    warning: "bg-white/20",
    danger: "bg-white/20",
    info: "bg-white/20",
    violet: "bg-white/20",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl p-5 transition-all duration-300 cursor-pointer",
        "hover:shadow-xl hover:-translate-y-1",
        colorClasses[color],
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconBg[color],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-white/80" />
          ) : (
            <TrendingDown className="w-4 h-4 text-white/80" />
          )}
          <span className="text-sm text-white/80">
            {trend.isPositive ? "+" : ""}
            {trend.value}% عن الشهر الماضي
          </span>
        </div>
      )}
    </div>
  );
};

const AdminDashboardNew: React.FC = () => {
  const navigate = useNavigate();

  // Use React Query hooks for automatic caching and refetching
  const {
    data: statsResponse,
    isLoading: statsLoading,
    refetch: refetchStats,
    isFetching: statsFetching,
  } = useDashboardStats();

  const { data: activityResponse, isLoading: activityLoading } =
    useRecentActivity();

  const stats = statsResponse?.data;
  const activity = activityResponse?.data;
  const loading = statsLoading || activityLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const alerts = activity?.alerts || {
    pending_articles: 0,
    pending_doctor_verifications: 0,
    unread_contact_messages: 0,
    pending_join_requests: 0,
  };

  const totalAlerts =
    (alerts.pending_articles || 0) +
    (alerts.pending_doctor_verifications || 0) +
    (alerts.unread_contact_messages || 0) +
    (alerts.pending_join_requests || 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Alerts Banner */}
      {totalAlerts > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                لديك {totalAlerts} تنبيهات تحتاج انتباهك
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-amber-700">
                {alerts.pending_doctor_verifications > 0 && (
                  <span>
                    • {alerts.pending_doctor_verifications} طبيب بانتظار التحقق
                  </span>
                )}
                {alerts.pending_articles > 0 && (
                  <span>• {alerts.pending_articles} مقال بانتظار المراجعة</span>
                )}
                {alerts.unread_contact_messages > 0 && (
                  <span>
                    • {alerts.unread_contact_messages} رسالة غير مقروءة
                  </span>
                )}
                {alerts.pending_join_requests > 0 && (
                  <span>• {alerts.pending_join_requests} طلب انضمام معلق</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المرضى"
          value={stats?.users_overview?.patients?.total || 0}
          subtitle={`${stats?.users_overview?.patients?.new_this_month || 0} جديد هذا الشهر`}
          icon={Users}
          trend={{
            value: stats?.users_overview?.patients?.growth || 0,
            isPositive: (stats?.users_overview?.patients?.growth || 0) >= 0,
          }}
          color="primary"
          onClick={() => navigate("/admin/users/patients")}
        />
        <StatCard
          title="إجمالي الأطباء"
          value={stats?.users_overview?.doctors?.total || 0}
          subtitle={`${stats?.users_overview?.doctors?.pending_verification || 0} بانتظار التحقق`}
          icon={Stethoscope}
          color="success"
          onClick={() => navigate("/admin/users/doctors")}
        />
        <StatCard
          title="الاستشارات"
          value={stats?.consultations?.total || 0}
          subtitle={`${stats?.consultations?.this_month || 0} هذا الشهر`}
          icon={Calendar}
          color="violet"
          onClick={() => navigate("/admin/consultations")}
        />
        <StatCard
          title="الإيرادات"
          value={`${(stats?.financials?.total_revenue || 0).toLocaleString()} ج.م`}
          subtitle={`${(stats?.financials?.revenue_this_month || 0).toLocaleString()} ج.م هذا الشهر`}
          icon={DollarSign}
          trend={{
            value: stats?.financials?.revenue_growth || 0,
            isPositive: (stats?.financials?.revenue_growth || 0) >= 0,
          }}
          color="warning"
          onClick={() => navigate("/admin/financials")}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="elevated" className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">المقالات</h3>
            <FileText className="w-5 h-5 text-violet-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="font-semibold">
                {stats?.articles?.total || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-500" /> بانتظار المراجعة
              </span>
              <span className="font-semibold text-amber-600">
                {stats?.articles?.pending_review || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> معتمدة
              </span>
              <span className="font-semibold text-emerald-600">
                {stats?.articles?.approved || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <XCircle className="w-4 h-4 text-rose-500" /> مرفوضة
              </span>
              <span className="font-semibold text-rose-600">
                {stats?.articles?.rejected || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Eye className="w-4 h-4 text-blue-500" /> المشاهدات
              </span>
              <span className="font-semibold text-blue-600">
                {(stats?.articles?.total_views || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            fullWidth
            className="mt-4"
            onClick={() => navigate("/admin/articles")}
          >
            عرض المقالات <ArrowUpRight className="w-4 h-4 mr-1" />
          </Button>
        </Card>

        <Card variant="elevated" className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">التحقق من الأطباء</h3>
            <Stethoscope className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-500" /> معلق
              </span>
              <span className="font-semibold text-amber-600">
                {stats?.doctors_verification?.pending_verification || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> تم التحقق
              </span>
              <span className="font-semibold text-emerald-600">
                {stats?.doctors_verification?.verified || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <XCircle className="w-4 h-4 text-rose-500" /> مرفوض
              </span>
              <span className="font-semibold text-rose-600">
                {stats?.doctors_verification?.rejected || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">متوسط التقييم</span>
              <span className="font-semibold">
                ⭐ {stats?.doctors_verification?.average_rating || 0}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            fullWidth
            className="mt-4"
            onClick={() => navigate("/admin/users/doctors")}
          >
            إدارة الأطباء <ArrowUpRight className="w-4 h-4 mr-1" />
          </Button>
        </Card>

        <Card variant="elevated" className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">الماليات</h3>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إيرادات المنصة</span>
              <span className="font-semibold text-emerald-600">
                {(stats?.financials?.platform_earnings || 0).toLocaleString()}{" "}
                ج.م
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">أرباح الأطباء</span>
              <span className="font-semibold">
                {(stats?.financials?.doctors_earnings || 0).toLocaleString()}{" "}
                ج.م
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">المدفوعات المعلقة</span>
              <span className="font-semibold text-amber-600">
                {(stats?.financials?.pending_payouts || 0).toLocaleString()} ج.م
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            fullWidth
            className="mt-4"
            onClick={() => navigate("/admin/financials")}
          >
            التقرير المالي <ArrowUpRight className="w-4 h-4 mr-1" />
          </Button>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="elevated" className="p-5">
          <h3 className="font-semibold text-foreground mb-4">النشاط الأخير</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {activity?.activities && activity.activities.length > 0 ? (
              activity.activities.slice(0, 8).map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                >
                  <div className="relative flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          item.type === "user_registered" &&
                          "bg-cyan-100 text-cyan-600",
                          item.type === "doctor_registered" &&
                          "bg-emerald-100 text-emerald-600",
                          item.type === "article_submitted" &&
                          "bg-violet-100 text-violet-600",
                          item.type === "consultation_completed" &&
                          "bg-blue-100 text-blue-600",
                          item.type === "contact_message" &&
                          "bg-amber-100 text-amber-600",
                        )}
                      >
                        {item.type === "user_registered" && (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {item.type === "doctor_registered" && (
                          <Stethoscope className="w-4 h-4" />
                        )}
                        {item.type === "article_submitted" && (
                          <FileText className="w-4 h-4" />
                        )}
                        {item.type === "consultation_completed" && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {item.type === "contact_message" && (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>
                    )}
                    {/* Status Badge overlay */}
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                        item.type === "user_registered" && "bg-cyan-500",
                        item.type === "doctor_registered" && "bg-emerald-500",
                        item.type === "article_submitted" && "bg-violet-500",
                        item.type === "consultation_completed" && "bg-blue-500",
                        item.type === "contact_message" && "bg-amber-500",
                      )}
                    >
                      {item.type === "user_registered" && (
                        <UserPlus className="w-2 h-2 text-white" />
                      )}
                      {item.type === "doctor_registered" && (
                        <Stethoscope className="w-2 h-2 text-white" />
                      )}
                      {item.type === "article_submitted" && (
                        <FileText className="w-2 h-2 text-white" />
                      )}
                      {item.type === "consultation_completed" && (
                        <CheckCircle className="w-2 h-2 text-white" />
                      )}
                      {item.type === "contact_message" && (
                        <MessageSquare className="w-2 h-2 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80 font-medium">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                لا يوجد نشاط حديث
              </p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated" className="p-5">
          <h3 className="font-semibold text-foreground mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                navigate("/admin/users/doctors?verification_status=pending")
              }
              className="p-3 rounded-xl bg-amber-50/50 hover:bg-amber-100/70 border border-amber-100/50 transition-all text-right group"
            >
              <Stethoscope className="w-5 h-5 text-amber-600 mb-2 transition-transform group-hover:scale-110" />
              <p className="font-bold text-foreground text-sm">مراجعة الأطباء</p>
              <p className="text-xs text-muted-foreground">
                {stats?.doctors_verification?.pending_verification || 0} بانتظار
              </p>
            </button>
            <button
              onClick={() => navigate("/admin/articles?status=pending_review")}
              className="p-3 rounded-xl bg-violet-50/50 hover:bg-violet-100/70 border border-violet-100/50 transition-all text-right group"
            >
              <FileText className="w-5 h-5 text-violet-600 mb-2 transition-transform group-hover:scale-110" />
              <p className="font-bold text-foreground text-sm">
                مراجعة المقالات
              </p>
              <p className="text-xs text-muted-foreground">
                {stats?.articles?.pending_review || 0} بانتظار
              </p>
            </button>
            <button
              onClick={() => navigate("/admin/messages")}
              className="p-3 rounded-xl bg-blue-50/50 hover:bg-blue-100/70 border border-blue-100/50 transition-all text-right group"
            >
              <MessageSquare className="w-5 h-5 text-blue-600 mb-2 transition-transform group-hover:scale-110" />
              <p className="font-bold text-foreground text-sm">رسائل التواصل</p>
              <p className="text-xs text-muted-foreground">
                {alerts.unread_contact_messages || 0} غير مقروءة
              </p>
            </button>
            <button
              onClick={() => navigate("/admin/join-requests")}
              className="p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-100/50 transition-all text-right group"
            >
              <UserPlus className="w-5 h-5 text-emerald-600 mb-2 transition-transform group-hover:scale-110" />
              <p className="font-bold text-foreground text-sm">طلبات الانضمام</p>
              <p className="text-xs text-muted-foreground">
                {alerts.pending_join_requests || 0} معلق
              </p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardNew;
