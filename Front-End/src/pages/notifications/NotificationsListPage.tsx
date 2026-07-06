import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video,
  Star,
  MessageCircle,
  AlertCircle,
  Megaphone,
  CreditCard,
  FileText,
  UserCheck,
  UserX,
  Filter,
  Loader2,
  Inbox,
  Settings,
} from "lucide-react";
import {
  notificationService,
  Notification,
} from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import BackButton from '@/components/common/BackButton';

const iconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
  consultation_reminder: {
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  consultation_confirmed: {
    icon: <Check className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  consultation_accepted: {
    icon: <Check className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  consultation_cancelled: {
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  consultation_cancelled_by_admin: {
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  consultation_booked: {
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  consultation_new_booking: {
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  new_consultation: {
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  consultation_no_show: {
    icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
    bg: "bg-orange-100",
  },
  consultation: {
    icon: <Check className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  consultation_completed: {
    icon: <Check className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  video_call: {
    icon: <Video className="w-5 h-5 text-purple-600" />,
    bg: "bg-purple-100",
  },
  review_received: {
    icon: <Star className="w-5 h-5 text-yellow-600" />,
    bg: "bg-yellow-100",
  },
  message: {
    icon: <MessageCircle className="w-5 h-5 text-pink-600" />,
    bg: "bg-pink-100",
  },
  payment_success: {
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  financial: {
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  payout_processed: {
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  payout_status: {
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  article_approved: {
    icon: <FileText className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  article_submitted: {
    icon: <FileText className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  article_rejected: {
    icon: <FileText className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  doctor_verified: {
    icon: <UserCheck className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  doctor_verification_rejected: {
    icon: <UserX className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  doctor_deactivated: {
    icon: <UserX className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  patient_deactivated: {
    icon: <UserX className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  join_request_approved: {
    icon: <UserCheck className="w-5 h-5 text-green-600" />,
    bg: "bg-green-100",
  },
  join_request_rejected: {
    icon: <UserX className="w-5 h-5 text-red-600" />,
    bg: "bg-red-100",
  },
  join_request_contacted: {
    icon: <MessageCircle className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  admin_announcement: {
    icon: <Megaphone className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-100",
  },
  admin_update: {
    icon: <Bell className="w-5 h-5 text-cyan-600" />,
    bg: "bg-cyan-100",
  },
  admin_maintenance: {
    icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
    bg: "bg-amber-100",
  },
  admin_promotional: {
    icon: <Megaphone className="w-5 h-5 text-violet-600" />,
    bg: "bg-violet-100",
  },
  default: {
    icon: <Bell className="w-5 h-5 text-gray-600" />,
    bg: "bg-gray-100",
  },
};

const NotificationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        per_page: 15,
      };
      if (filter === "unread") params.unread_only = true;
      const result = await notificationService.getNotifications(params);
      setNotifications(result.notifications);
      setUnreadCount(result.unread_count);
      setTotal(result.total);
      // Calculate last page from total
      setLastPage(Math.max(1, Math.ceil(result.total / 15)));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, read_at: new Date().toISOString() }
            : n,
        ),
      );
    }

    const data = notification.data as Record<string, string> | undefined;
    if (data?.url) {
      navigate(data.url);
    } else if (data?.consultation_id) {
      const prefix = userType === "doctor" ? "/doctor" : "/patient";
      navigate(`${prefix}/consultations/${data.consultation_id}`);
    } else if (data?.article_id) {
      navigate(userType === "doctor" ? "/doctor/articles" : "/articles");
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
    );
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await notificationService.deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setTotal((prev) => prev - 1);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getIcon = (type: string) => iconMap[type] || iconMap.default;

  return (
    <div className="space-y-8 pb-20 animate-fade-in font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-3xl p-8 rounded-[40px] shadow-2xl shadow-primary/5 border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent blur-3xl -z-10" />

        <div className="mb-6">
          <BackButton />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30 relative">
              <Bell className="w-8 h-8 text-white absolute" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 items-center justify-center text-[9px] font-black justify-center text-white border-2 border-white">{unreadCount}</span>
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground mb-1 tracking-tight">الإشعارات</h1>
              <p className="text-sm font-bold text-muted-foreground/80">
                {unreadCount > 0
                  ? `لديك ${unreadCount} تنبيه يرجى مراجعته`
                  : "أنت على اطلاع بكل جديد"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-12 px-6 text-sm font-black text-primary bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                قراءة الكل
              </button>
            )}
            <button
              onClick={() => {
                const settingsPath =
                  userType === "admin" ? "/admin/notifications/settings"
                    : userType === "doctor" ? "/doctor/notifications/settings"
                      : "/patient/notifications/settings";
                navigate(settingsPath);
              }}
              className="flex items-center justify-center gap-2 h-12 w-12 text-muted-foreground bg-muted hover:bg-muted/80 rounded-2xl transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-[20px] p-2 shadow-sm border border-border w-fit mx-auto md:mx-0">
        <button
          onClick={() => { setFilter("all"); setPage(1); }}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300",
            filter === "all"
              ? "bg-foreground text-white shadow-lg shadow-foreground/20"
              : "text-muted-foreground hover:bg-white",
          )}
        >
          الكل ({total})
        </button>
        <button
          onClick={() => { setFilter("unread"); setPage(1); }}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300",
            filter === "unread"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-white",
          )}
        >
          جديدة ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[40px] border border-dashed border-border">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
            <p className="text-muted-foreground font-black text-sm tracking-wide">جاري سحب البيانات...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[40px] border border-dashed border-border shadow-sm">
            <div className="w-24 h-24 rounded-[32px] bg-muted flex items-center justify-center mb-6 shadow-inner">
              <Inbox className="w-10 h-10 text-border" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">
              {filter === "unread" ? "صندوق الإشعارات فارغ" : "لا توجد أي إشعارات"}
            </h3>
            <p className="text-sm font-bold text-muted-foreground max-w-sm text-center leading-relaxed">
              {filter === "unread" ? "لا توجد أية إشعارات غير مقروءة حالياً، لقد تفقدت كل شيء!" : "لم تتوفر لدينا أية إشعارات لعرضها في حسابك حتى الآن."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification, index) => {
              const { icon, bg } = getIcon(notification.type);
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "group relative overflow-hidden flex items-start gap-5 p-5 cursor-pointer rounded-[28px] border transition-all duration-500",
                    isUnread
                      ? "bg-white border-primary/20 shadow-xl shadow-primary/5 hover:-translate-y-1"
                      : "bg-white/60 border-border hover:bg-white hover:shadow-lg hover:-translate-y-1 opacity-80 hover:opacity-100",
                  )}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  {isUnread && (
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-primary to-primary-600" />
                  )}

                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50 relative z-10 transition-transform group-hover:scale-110 duration-500",
                      bg,
                    )}
                  >
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3
                        className={cn(
                          "text-base",
                          isUnread ? "font-black text-foreground" : "font-bold text-foreground/80",
                        )}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[11px] font-bold text-muted-foreground/70 bg-muted px-2.5 py-1 rounded-full whitespace-nowrap">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className={cn("text-sm leading-relaxed line-clamp-2 mt-1", isUnread ? "font-medium text-muted-foreground" : "text-muted-foreground/80")}>
                      {notification.body}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="p-3 text-border hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100 rounded-xl transition-all flex-shrink-0"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stylish Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 h-12 px-6 font-black text-sm text-foreground bg-white border border-border rounded-[20px] hover:bg-muted hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
            السابق
          </button>

          <div className="h-12 px-6 flex items-center justify-center font-black text-sm bg-foreground text-white rounded-[20px] shadow-xl shadow-foreground/20">
            {page} / {lastPage}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="flex items-center gap-2 h-12 px-6 font-black text-sm text-foreground bg-white border border-border rounded-[20px] hover:bg-muted hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all"
          >
            التالي
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsListPage;
