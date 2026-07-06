import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bell,
  Send,
  History,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Megaphone,
  Loader2,
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useSendNotification,
  useNotificationHistory,
} from "@/hooks/useAdminQueries";

const NotificationsPage: React.FC = () => {
  // Hooks
  const sendNotificationMutation = useSendNotification();
  const [page, setPage] = useState(1);
  const { data: historyResponse, isLoading: historyLoading } =
    useNotificationHistory(page);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement" as
      | "announcement"
      | "update"
      | "maintenance"
      | "promotional",
    target: "all" as "all" | "patients" | "doctors",
    scheduled_at: "",
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    sendNotificationMutation.mutate(
      {
        ...formData,
        scheduled_at: formData.scheduled_at || undefined,
      },
      {
        onSuccess: () => {
          toast.success("تم إرسال الإشعار بنجاح");
          setFormData({
            title: "",
            message: "",
            type: "announcement",
            target: "all",
            scheduled_at: "",
          });
        },
        onError: () => {
          toast.error("فشل في إرسال الإشعار");
        },
      },
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-5 h-5 text-blue-500" />;
      case "update":
        return <Info className="w-5 h-5 text-cyan-500" />;
      case "maintenance":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "promotional":
        return <Bell className="w-5 h-5 text-violet-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case "all":
        return "جميع المستخدمين";
      case "patients":
        return "المرضى فقط";
      case "doctors":
        return "الأطباء فقط";
      default:
        return target;
    }
  };

  const apiData = (historyResponse as any)?.data || {};
  const notificationsList = apiData.history || [];
  const pagination = apiData.pagination || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Bell className="w-8 h-8 text-violet-600" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">نظام الإشعارات</h1>
          <p className="text-muted-foreground">إرسال وتتبع الإشعارات للنظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <div className="lg:col-span-1">
          <Card variant="elevated" className="p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Send className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-bold text-foreground">
                إرسال إشعار جديد
              </h2>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  عنوان الإشعار <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none"
                  placeholder="مثال: تحديث جديد للنظام"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  نص الإشعار <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none h-32 resize-none"
                  placeholder="اكتب رسالتك هنا..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    النوع
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none"
                  >
                    <option value="announcement">إعلان عام</option>
                    <option value="update">تحديث</option>
                    <option value="maintenance">صيانة</option>
                    <option value="promotional">تويجي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    المستهدفين
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        target: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none"
                  >
                    <option value="all">الكل</option>
                    <option value="patients">المرضى</option>
                    <option value="doctors">الأطباء</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  جدولة (اختياري)
                </label>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_at: e.target.value,
                      }))
                    }
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  اتركه فارغاً للإرسال الفوري
                </p>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                loading={sendNotificationMutation.isPending}
                icon={Send}
              >
                إرسال الإشعار
              </Button>
            </form>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">
                  سجل الإشعارات
                </h2>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد إشعارات سابقة
              </div>
            ) : (
              <div className="divide-y divide-muted">
                {notificationsList.map((notification: any) => (
                  <div
                    key={notification.id}
                    className="p-6 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted/50 rounded-full">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-foreground">
                            {notification.title}
                          </h3>
                          <span
                            className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"
                            dir="ltr"
                          >
                            {notification.sent_at
                              ? new Date(
                                  notification.sent_at,
                                ).toLocaleDateString("ar-EG")
                              : "الآن"}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                            <Users className="w-3.5 h-3.5" />
                            {getTargetLabel(notification.target)}
                          </div>

                          {notification.scheduled_at && (
                            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-xs font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              مجدول: {notification.scheduled_at}
                            </div>
                          )}

                          {/* If we had stats like 'read count', show here */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination if needed */}
            {pagination.last_page > 1 && (
              <div className="p-4 border-t border-border flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.current_page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <span className="px-3 py-1 bg-muted/50 rounded-lg text-sm flex items-center">
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
