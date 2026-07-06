import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  Trash2,
  CheckCircle,
  Circle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MailCheck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import * as adminService from "@/services/adminService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useContactMessages,
  useContactMessage,
  useMarkMessageAsRead,
  useMarkMessageAsUnread,
  useMarkAllMessagesAsRead,
  useDeleteContactMessage,
} from "@/hooks/useAdminQueries";

const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse query params
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || undefined;
  const is_read =
    searchParams.get("is_read") === "1"
      ? true
      : searchParams.get("is_read") === "0"
        ? false
        : undefined;

  // React Query Hooks
  const {
    data: messagesResponse,
    isLoading: loading,
    isFetching,
  } = useContactMessages({
    page,
    search,
    is_read,
  });

  // Mutations
  const markAsReadMutation = useMarkMessageAsRead();
  const markAsUnreadMutation = useMarkMessageAsUnread();
  const markAllAsReadMutation = useMarkAllMessagesAsRead();
  const deleteMutation = useDeleteContactMessage();

  // Local State
  const [searchInput, setSearchInput] = useState(search || "");
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Derived Data
  const messages = messagesResponse?.data?.messages || [];
  const unreadCount = messagesResponse?.data?.unread_count || 0; // Assuming API returns this, or we calculate from list if possible (but list is paginated)
  const pagination = messagesResponse?.data?.pagination || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  };

  // Details Query
  const { data: messageDetailsResponse, isLoading: detailsLoading } =
    useContactMessage(detailsId || 0);
  const selectedMessage = messageDetailsResponse?.data?.message || null;

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) newParams.set("search", searchInput);
    else newParams.delete("search");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const handleViewDetails = (id: number) => {
    setDetailsId(id);
    setShowDetails(true);
    // Mark as read is handled in the effect or logically,
    // but here we might want to trigger it if it's unread.
    // However, we wait for details to load.
    // Or we can optimistic update.
  };

  // Auto mark as read when viewing details
  React.useEffect(() => {
    if (selectedMessage && !selectedMessage.is_read) {
      markAsReadMutation.mutate(selectedMessage.id, {
        onSuccess: () => {
          // Optionally toast or silent
        },
      });
    }
  }, [selectedMessage?.id]);

  const handleToggleReadStatus = (message: adminService.ContactMessage) => {
    if (message.is_read) {
      markAsUnreadMutation.mutate(message.id, {
        onSuccess: () => toast.success("تم تحديد الرسالة كغير مقروءة"),
        onError: () => toast.error("فشل في تحديث الحالة"),
      });
    } else {
      markAsReadMutation.mutate(message.id, {
        onSuccess: () => toast.success("تم تحديد الرسالة كمقروءة"),
        onError: () => toast.error("فشل في تحديث الحالة"),
      });
    }
  };

  const [messageToDelete, setMessageToDelete] =
    useState<adminService.ContactMessage | null>(null);

  const handleDelete = (message: adminService.ContactMessage) => {
    setMessageToDelete(message);
  };

  const confirmDelete = () => {
    if (!messageToDelete) return;

    deleteMutation.mutate(messageToDelete.id, {
      onSuccess: () => {
        toast.success("تم حذف الرسالة");
        if (showDetails && selectedMessage?.id === messageToDelete.id) {
          setShowDetails(false);
          setDetailsId(null);
        }
        setMessageToDelete(null);
      },
      onError: () => toast.error("فشل في حذف الرسالة"),
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => toast.success("تم تحديد جميع الرسائل كمقروءة"),
      onError: () => toast.error("فشل في تحديث الرسائل"),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">رسائل التواصل</h1>
          {/* Note: unreadCount might not be available directly from list response unless backend sends it separately. 
                        If not available, we can omit it or fetch from stats. 
                        For now, I'll assume backend sends it or we rely on dashboard stats if available. 
                        If not, removing it is safer than showing wrong number. 
                    */}
        </div>
        <Button
          variant="ghost"
          icon={MailCheck}
          onClick={handleMarkAllAsRead}
          disabled={markAllAsReadMutation.isPending}
        >
          {markAllAsReadMutation.isPending
            ? "جاري التحديث..."
            : "تحديد الكل كمقروء"}
        </Button>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="البحث بالاسم أو البريد أو الموضوع..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
              />
            </div>
          </form>

          <select
            value={is_read === undefined ? "" : is_read ? "1" : "0"}
            onChange={(e) => handleFilterChange("is_read", e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border focus:border-violet-500 outline-none min-w-[150px]"
          >
            <option value="">كل الرسائل</option>
            <option value="0">غير مقروءة</option>
            <option value="1">مقروءة</option>
          </select>
        </div>
      </Card>

      {/* Messages List */}
      <Card variant="elevated" className="overflow-hidden">
        {loading && !isFetching && messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-border mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="divide-y divide-muted">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={cn(
                  "p-4 hover:bg-muted transition-colors cursor-pointer",
                  !message.is_read && "bg-violet-50/50",
                )}
                onClick={() => handleViewDetails(message.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator */}
                  <div className="pt-1">
                    {message.is_read ? (
                      <Circle className="w-3 h-3 text-border" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-violet-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3
                          className={cn(
                            "font-medium text-foreground truncate",
                            !message.is_read && "font-semibold",
                          )}
                        >
                          {message.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {message.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {message.submitted_at}
                        </span>
                      </div>
                    </div>
                    {message.subject && (
                      <p className="text-sm font-medium text-foreground/80 mt-2">
                        {message.subject}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {message.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleToggleReadStatus(message)}
                      disabled={
                        markAsReadMutation.isPending ||
                        markAsUnreadMutation.isPending
                      }
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        message.is_read
                          ? "hover:bg-amber-100 text-amber-600"
                          : "hover:bg-emerald-100 text-emerald-600",
                      )}
                      title={
                        message.is_read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"
                      }
                    >
                      {message.is_read ? (
                        <Circle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(message)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              عرض {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
              {Math.min(
                pagination.current_page * pagination.per_page,
                pagination.total,
              )}{" "}
              من {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg font-medium">
                {pagination.current_page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Message Details Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailsLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : selectedMessage ? (
              <>
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {selectedMessage.name}
                      </h2>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" /> {selectedMessage.email}
                        </span>
                        {selectedMessage.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />{" "}
                            {selectedMessage.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {selectedMessage.submitted_at}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        selectedMessage.is_read
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {selectedMessage.is_read ? "مقروءة" : "غير مقروءة"}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {selectedMessage.subject && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">الموضوع</p>
                      <p className="font-medium text-foreground">
                        {selectedMessage.subject}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">الرسالة</p>
                    <div className="bg-muted rounded-xl p-4">
                      <p className="text-foreground/80 whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleReadStatus(selectedMessage)}
                      disabled={
                        markAsReadMutation.isPending ||
                        markAsUnreadMutation.isPending
                      }
                    >
                      {selectedMessage.is_read
                        ? "تحديد كغير مقروءة"
                        : "تحديد كمقروءة"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selectedMessage)}
                      disabled={deleteMutation.isPending}
                    >
                      حذف
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={() => setShowDetails(false)}>
                    إغلاق
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                الرسالة غير موجودة
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              هل أنت متأكد من حذف هذه الرسالة؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الرسالة نهائياً من
              النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white hover:bg-rose-700/90"
            >
              حذف الرسالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
