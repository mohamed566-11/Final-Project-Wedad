import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تأكيد الحذف",
  cancelText = "إلغاء",
  variant = "danger",
  loading = false,
}) => {
  if (!isOpen) return null;

  const buttonVariant =
    variant === "danger"
      ? "destructive"
      : variant === "warning"
        ? "outline"
        : "gradient";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-8 text-center">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
              variant === "danger" && "bg-rose-50 text-rose-500",
              variant === "warning" && "bg-amber-50 text-amber-500",
              variant === "primary" && "bg-violet-50 text-violet-500",
            )}
          >
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 leading-relaxed mb-8">{message}</p>

          <div className="flex flex-col gap-3">
            <Button
              variant={buttonVariant}
              className="w-full py-4 rounded-2xl text-lg font-bold"
              onClick={onConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
            <Button
              variant="ghost"
              className="w-full py-4 rounded-2xl text-lg text-slate-500 hover:text-slate-700"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
