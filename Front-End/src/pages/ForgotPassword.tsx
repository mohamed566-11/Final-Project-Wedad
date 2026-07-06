import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Key, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Input from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "@/utils/validation";
import { authService } from "@/services/authService";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES, UserType } from "@/utils/constants";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get("type") as UserType) || "patient";
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const getThemeColors = () => {
    switch (userType) {
      case "doctor":
        return {
          gradient: "from-coral-400 to-coral-500",
          bgGradient: "bg-gradient-coral",
          iconBg: "bg-coral-400/10",
          iconColor: "text-coral-500",
          buttonVariant: "coral" as const,
        };
      case "admin":
        return {
          gradient: "from-admin to-violet-600",
          bgGradient: "bg-gradient-admin",
          iconBg: "bg-admin/10",
          iconColor: "text-admin",
          buttonVariant: "admin" as const,
        };
      default:
        return {
          gradient: "from-primary to-primary-600",
          bgGradient: "bg-gradient-primary",
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
          buttonVariant: "gradient" as const,
        };
    }
  };

  const theme = getThemeColors();

  const getUserTypeLabel = () => {
    switch (userType) {
      case "doctor":
        return "الطبيب";
      case "admin":
        return "الإدارة";
      default:
        return "المريض";
    }
  };

  const getLoginPath = () => {
    switch (userType) {
      case "doctor":
        return ROUTES.DOCTOR_LOGIN;
      case "admin":
        return ROUTES.ADMIN_LOGIN;
      default:
        return ROUTES.PATIENT_LOGIN;
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await authService[userType].forgotPassword(data.email);
      localStorage.setItem("resetEmail", data.email);
      localStorage.setItem("resetUserType", userType);
      setEmailSent(true);
      toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate(`/reset-password?type=${userType}`);
  };

  return (
    <div
      className={`min-h-screen ${theme.bgGradient} flex items-center justify-center p-4`}
    >
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 right-0 w-[400px] h-[400px] ${theme.iconBg} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}
        />
        <div
          className={`absolute bottom-0 left-0 w-[300px] h-[300px] ${theme.iconBg} rounded-full blur-3xl translate-y-1/2 -translate-x-1/2`}
        />
      </div>

      <Card
        variant="elevated"
        padding="lg"
        className="w-full max-w-md relative animate-slide-up"
      >
        <div className="text-center mb-8">
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}
          >
            <Key className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            نسيت كلمة المرور؟
          </h1>
          <p className="text-muted-foreground">
            {emailSent
              ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
              : `أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق`}
          </p>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${theme.iconBg} ${theme.iconColor}`}
          >
            {getUserTypeLabel()}
          </span>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="البريد الإلكتروني"
              type="email"
              icon={Mail}
              placeholder="example@email.com"
              error={errors.email?.message}
              required
              {...register("email")}
            />

            <Button
              type="submit"
              variant={theme.buttonVariant}
              fullWidth
              loading={loading}
              icon={ArrowRight}
              iconPosition="left"
            >
              إرسال رمز التحقق
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl ${theme.iconBg} text-center`}>
              <p className={`font-medium ${theme.iconColor}`}>
                تم إرسال الرمز إلى:
              </p>
              <p className="text-foreground font-bold mt-1" dir="ltr">
                {getValues("email")}
              </p>
            </div>

            <Button
              variant={theme.buttonVariant}
              fullWidth
              onClick={handleContinue}
              icon={ArrowRight}
              iconPosition="left"
            >
              متابعة لإعادة التعيين
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={() => setEmailSent(false)}
            >
              إعادة إرسال الرمز
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            تذكرت كلمة المرور؟{" "}
            <Link
              to={getLoginPath()}
              className={`font-medium ${theme.iconColor} hover:underline`}
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
