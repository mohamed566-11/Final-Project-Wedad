import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { User, Mail, Lock, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormData } from "@/utils/validation";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES } from "@/utils/constants";
import AuthLayout from "@/components/layout/AuthLayout";
import Input from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import BackButton from "@/components/common/BackButton";
import { useEffect } from "react";

const PatientLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear existing session on mount
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await login(
        { email: data.email!, password: data.password! },
        "patient",
      );
      if (response.needsVerification) {
        navigate(ROUTES.VERIFY_EMAIL);
      } else {
        navigate(ROUTES.PATIENT_DASHBOARD);
      }
    } catch (error) {
      const result = handleApiError(error as any);
      if (result.type === "account_locked") {
        navigate(ROUTES.ACCOUNT_LOCKED);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout variant="patient">
      <div className="max-w-md mx-auto">
        {/* Navigation Buttons */}
        <div className="mb-6 flex justify-between items-center bg-white/50 p-2 rounded-xl border border-border/50">
          <BackButton />
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors hover:bg-primary/5 px-4 py-2 rounded-lg"
          >
            الرئيسية
            <Home className="w-4 h-4" />
          </Link>
        </div>

        <Card variant="elevated" padding="lg" className="animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-glow mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تسجيل دخول المريض
            </h1>
            <p className="text-muted-foreground">
              أدخل بياناتك للوصول إلى حسابك
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@email.com"
              icon={Mail}
              error={errors.email?.message}
              {...register("email")}
              required
            />

            <Input
              label="كلمة المرور"
              type="password"
              placeholder="أدخل كلمة المرور"
              icon={Lock}
              error={errors.password?.message}
              {...register("password")}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-muted-foreground">تذكرني</span>
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD + "?type=patient"}
                className="text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              تسجيل الدخول
            </Button>
          </form>

          {/* Test Accounts Segment */}
          <div className="mt-4 p-4 bg-primary-50/50 rounded-2xl border border-primary-100">
            <p className="text-xs font-bold text-primary mb-3 text-center">حسابات تجريبية للمرضى (الاسم - المرحلة)</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-primary border-primary-200 hover:bg-primary hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "sara@example.com", password: "Patient@123456" })}
              >
                <span>سارة أحمد</span>
                <span className="opacity-70 font-normal">مرحلة الأمومة</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-primary border-primary-200 hover:bg-primary hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "amira@example.com", password: "Patient@123456" })}
              >
                <span>أميرة خالد</span>
                <span className="opacity-70 font-normal">مرحلة ما قبل الزواج</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-primary border-primary-200 hover:bg-primary hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "yasmin@example.com", password: "Patient@123456" })}
              >
                <span>ياسمين محمد</span>
                <span className="opacity-70 font-normal">مرحلة الحياة الزوجية</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-primary border-primary-200 hover:bg-primary hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "nour@example.com", password: "Patient@123456" })}
              >
                <span>نور الهدى حسين</span>
                <span className="opacity-70 font-normal">مرحلة الأمومة</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-primary border-primary-200 hover:bg-primary hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "heba@example.com", password: "Patient@123456" })}
              >
                <span>هبة إبراهيم</span>
                <span className="opacity-70 font-normal">مرحلة الأمومة</span>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                to={ROUTES.PATIENT_REGISTER}
                className="text-primary font-medium hover:underline"
              >
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default PatientLogin;
