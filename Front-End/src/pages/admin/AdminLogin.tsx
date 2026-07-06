import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormData } from "@/utils/validation";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES } from "@/utils/constants";
import AuthLayout from "@/components/layout/AuthLayout";
import Input from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import { useEffect } from "react";

const AdminLogin: React.FC = () => {
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
      await login({ email: data.email!, password: data.password! }, "admin");
      navigate(ROUTES.ADMIN_DASHBOARD);
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
    <AuthLayout variant="admin">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>العودة للرئيسية</span>
        </button>

        <Card variant="elevated" padding="lg" className="animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-admin to-violet-600 shadow-glow-admin mb-4">
              <Shield className="w-8 h-8 text-admin-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تسجيل دخول الإدارة
            </h1>
            <p className="text-muted-foreground">
              الوصول الآمن إلى لوحة التحكم
            </p>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground bg-muted rounded-lg py-2 px-4">
            <Shield size={16} className="text-admin" />
            <span>اتصال آمن ومشفر</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="admin@widad.com"
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

            <div className="flex items-center justify-end text-sm">
              <Link
                to={ROUTES.FORGOT_PASSWORD + "?type=admin"}
                className="text-admin hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button
              type="submit"
              variant="admin"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              تسجيل الدخول
            </Button>
          </form>
          {/* Test Accounts Segment */}
          <div className="mt-4 p-4 bg-admin-50/50 rounded-2xl border border-admin-100/30">
            <p className="text-xs font-bold text-admin mb-3 text-center">حسابات تجريبية للإدارة</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-admin border-admin-200/50 hover:bg-admin hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "admin@widad.health", password: "Admin@123456" })}
              >
                <span>أحمد محمد</span>
                <span className="opacity-70 font-normal">Super Admin</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-admin border-admin-200/50 hover:bg-admin hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "finance@widad.health", password: "Admin@123456" })}
              >
                <span>محمود علي</span>
                <span className="opacity-70 font-normal">Finance Admin</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-admin border-admin-200/50 hover:bg-admin hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "content@widad.health", password: "Admin@123456" })}
              >
                <span>سارة أحمد</span>
                <span className="opacity-70 font-normal">Content Admin</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;
