import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
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
} from "lucide-react";
import {
  notificationService,
  Notification,
} from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";

const iconMap: Record<string, React.ReactNode> = {
  // Consultation types
  consultation_reminder: <Calendar className="w-5 h-5 text-blue-500" />,
  consultation_confirmed: <Check className="w-5 h-5 text-green-500" />,
  consultation_accepted: <Check className="w-5 h-5 text-green-500" />,
  consultation_cancelled: <X className="w-5 h-5 text-red-500" />,
  consultation_cancelled_by_admin: <X className="w-5 h-5 text-red-500" />,
  consultation_booked: <Calendar className="w-5 h-5 text-blue-500" />,
  consultation_new_booking: <Calendar className="w-5 h-5 text-blue-500" />,
  new_consultation: <Calendar className="w-5 h-5 text-blue-500" />,
  consultation_no_show: <AlertCircle className="w-5 h-5 text-orange-500" />,
  consultation: <Check className="w-5 h-5 text-green-500" />,
  consultation_completed: <Check className="w-5 h-5 text-green-500" />,
  video_call: <Video className="w-5 h-5 text-purple-500" />,
  // Review & Message types
  review_received: <Star className="w-5 h-5 text-yellow-500" />,
  message: <MessageCircle className="w-5 h-5 text-pink-500" />,
  // Payment & Financial types
  payment_success: <CreditCard className="w-5 h-5 text-green-500" />,
  financial: <CreditCard className="w-5 h-5 text-green-500" />,
  payout_processed: <CreditCard className="w-5 h-5 text-green-500" />,
  payout_status: <CreditCard className="w-5 h-5 text-green-500" />,
  // Article types
  article_approved: <FileText className="w-5 h-5 text-green-500" />,
  article_submitted: <FileText className="w-5 h-5 text-blue-500" />,
  article_rejected: <FileText className="w-5 h-5 text-red-500" />,
  // Doctor/User account types
  doctor_verified: <UserCheck className="w-5 h-5 text-green-500" />,
  doctor_verification_rejected: <UserX className="w-5 h-5 text-red-500" />,
  doctor_deactivated: <UserX className="w-5 h-5 text-red-500" />,
  patient_deactivated: <UserX className="w-5 h-5 text-red-500" />,
  join_request_approved: <UserCheck className="w-5 h-5 text-green-500" />,
  join_request_rejected: <UserX className="w-5 h-5 text-red-500" />,
  join_request_contacted: <MessageCircle className="w-5 h-5 text-blue-500" />,
  // Admin broadcast types
  admin_announcement: <Megaphone className="w-5 h-5 text-blue-500" />,
  admin_update: <Bell className="w-5 h-5 text-cyan-500" />,
  admin_maintenance: <AlertCircle className="w-5 h-5 text-amber-500" />,
  admin_promotional: <Megaphone className="w-5 h-5 text-violet-500" />,
  // Default
  default: <Bell className="w-5 h-5 text-gray-500" />,
};

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className = "" }: NotificationBellProps) => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        per_page: 10,
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
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

    // Navigate based on notification type
    const data = notification.data as Record<string, string> | undefined;
    if (data?.url) {
      navigate(data.url);
    } else if (data?.consultation_id) {
      const prefix = userType === "doctor" ? "/doctor" : "/patient";
      navigate(`${prefix}/consultations/${data.consultation_id}`);
    } else if (data?.article_id) {
      navigate(userType === "doctor" ? "/doctor/articles" : "/articles");
    }

    setIsOpen(false);
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
    return date.toLocaleDateString("ar-EG");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  const settingsPath =
                    userType === "admin"
                      ? "/admin/notifications/settings"
                      : userType === "doctor"
                        ? "/doctor/notifications/settings"
                        : "/patient/notifications/settings";
                  navigate(settingsPath);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="إعدادات الإشعارات"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read_at ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {iconMap[notification.type] || iconMap.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm ${!notification.read_at ? "font-bold" : "font-medium"} text-gray-900 truncate`}
                        >
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {notification.body}
                      </p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  const notificationsPath =
                    userType === "admin"
                      ? "/admin/my-notifications"
                      : userType === "doctor"
                        ? "/doctor/notifications"
                        : "/patient/notifications";
                  navigate(notificationsPath);
                  setIsOpen(false);
                }}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                عرض كل الإشعارات
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
