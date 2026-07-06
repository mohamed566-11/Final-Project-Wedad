import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, Lock, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import Input from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import OTPInput from "@/components/auth/OTPInput";
import PasswordStrength from "@/components/common/PasswordStrength";
import { resetPasswordSchema, ResetPasswordFormData } from "@/utils/validation";
import { authService } from "@/services/authService";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES, UserType } from "@/utils/constants";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get("type") as UserType) || "patient";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const storedEmail = localStorage.getItem("resetEmail") || "";
  const [email, setEmail] = useState(storedEmail);
  const [emailError, setEmailError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
    },
  });

  const password = watch("password", "");

  // No longer auto-redirect - allow manual email entry

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetUserType");
      navigate(getLoginPath());
    }
  }, [success, countdown, navigate]);

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

  const onSubmit = async (data: ResetPasswordFormData) => {
    // Validate email
    if (!email || !email.includes("@")) {
      setEmailError("البريد الإلكتروني مطلوب");
      return;
    }
    setEmailError("");

    if (otp.length !== 5) {
      setOtpError("الرجاء إدخال رمز التحقق كاملاً");
      return;
    }

    setLoading(true);
    try {
      await authService[userType].resetPassword({
        email,
        code: otp,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      setSuccess(true);
      toast.success("تم إعادة تعيين كلمة المرور بنجاح");
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={`min-h-screen ${theme.bgGradient} flex items-center justify-center p-4`}
      >
        <Card
          variant="elevated"
          padding="lg"
          className="w-full max-w-md text-center animate-scale-in"
        >
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تم بنجاح!</h1>
          <p className="text-muted-foreground mb-6">
            تم إعادة تعيين كلمة المرور بنجاح.
            <br />
            سيتم توجيهك لتسجيل الدخول خلال {countdown} ثوانٍ...
          </p>
          <p className="text-sm text-warning">
            ملاحظة: تم تسجيل خروجك من جميع الأجهزة الأخرى
          </p>
        </Card>
      </div>
    );
  }

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
            <ShieldCheck className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-muted-foreground">
            أدخل رمز التحقق وكلمة المرور الجديدة
          </p>
        </div>

        {/* Email Input/Display */}
        {storedEmail ? (
          <div className={`p-3 rounded-xl ${theme.iconBg} mb-6`}>
            <p className="text-sm text-muted-foreground text-center">
              البريد الإلكتروني
            </p>
            <p className="text-foreground font-medium text-center" dir="ltr">
              {email}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <Input
              label="البريد الإلكتروني"
              type="email"
              icon={Mail}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              error={emailError}
              required
            />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3 text-center">
              رمز التحقق (5 أرقام)
            </label>
            <OTPInput
              length={5}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setOtpError("");
              }}
              error={otpError}
            />
          </div>

          {/* Password Fields */}
          <div className="space-y-4">
            <div>
              <Input
                label="كلمة المرور الجديدة"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                error={errors.password?.message}
                helperText="يجب أن تكون 8 أحرف على الأقل"
                required
                {...register("password")}
              />
              {password && <PasswordStrength password={password} />}
            </div>

            <Input
              label="تأكيد كلمة المرور"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password_confirmation?.message}
              required
              {...register("password_confirmation")}
            />
          </div>

          <Button
            type="submit"
            variant={theme.buttonVariant}
            fullWidth
            loading={loading}
            icon={ShieldCheck}
          >
            إعادة تعيين كلمة المرور
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to={`/forgot-password?type=${userType}`}
            className={`text-sm ${theme.iconColor} hover:underline`}
          >
            إعادة إرسال رمز التحقق
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
