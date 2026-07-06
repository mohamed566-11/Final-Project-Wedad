import { toast } from "sonner";
import { ERROR_MESSAGES } from "./constants";

interface ApiError {
  response?: {
    status: number;
    data: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
}

interface ErrorResult {
  type: string;
  message: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: ApiError): ErrorResult => {
  if (!error.response) {
    toast.error(ERROR_MESSAGES.network);
    return {
      type: "network",
      message: ERROR_MESSAGES.network,
    };
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      toast.error(data.message || "طلب غير صالح");
      return { type: "bad_request", message: data.message || "طلب غير صالح" };

    case 401:
      toast.error(ERROR_MESSAGES.unauthorized);
      return { type: "unauthorized", message: ERROR_MESSAGES.unauthorized };

    case 403: {
      // Differentiate between permission denied and account locked
      const message403 = data.message || "";
      const isPermissionDenied =
        message403.includes("صلاحية") ||
        message403.includes("permission") ||
        message403.includes("غير مصرح") ||
        message403.includes("التحقق");

      if (isPermissionDenied) {
        toast.error(message403 || "ليس لديك صلاحية للوصول إلى هذا المورد");
        return {
          type: "permission_denied",
          message: message403 || "ليس لديك صلاحية للوصول إلى هذا المورد",
        };
      }
      return { type: "account_locked", message: message403 || "الحساب مغلق" };
    }

    case 404:
      toast.error(ERROR_MESSAGES.notFound);
      return { type: "not_found", message: ERROR_MESSAGES.notFound };

    case 422: {
      // Validation errors
      const errors = data.errors || {};
      const firstError = Object.values(errors)[0]?.[0];
      if (firstError) {
        toast.error(firstError);
      }
      return {
        type: "validation",
        message: firstError || "خطأ في التحقق",
        errors,
      };
    }

    case 429:
      toast.error(data.message || ERROR_MESSAGES.rateLimit);
      return {
        type: "rate_limit",
        message: data.message || ERROR_MESSAGES.rateLimit,
      };

    case 500:
      toast.error(ERROR_MESSAGES.server);
      return { type: "server_error", message: ERROR_MESSAGES.server };

    default:
      toast.error(data.message || ERROR_MESSAGES.unknown);
      return {
        type: "unknown",
        message: data.message || ERROR_MESSAGES.unknown,
      };
  }
};

export const getErrorMessage = (
  error: ErrorResult | null,
  fieldName: string,
): string | null => {
  if (error?.errors && error.errors[fieldName]) {
    return error.errors[fieldName][0];
  }
  return null;
};
