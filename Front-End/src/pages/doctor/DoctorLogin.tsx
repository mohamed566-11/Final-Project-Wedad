import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stethoscope, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormData } from "@/utils/validation";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES } from "@/utils/constants";
import AuthLayout from "@/components/layout/AuthLayout";
import Input from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import { useEffect } from "react";

const DoctorLogin: React.FC = () => {
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
        "doctor",
      );
      if (response.needsVerification) {
        navigate(ROUTES.VERIFY_EMAIL);
      } else {
        navigate(ROUTES.DOCTOR_DASHBOARD);
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
    <AuthLayout variant="doctor">
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 mb-4">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تسجيل دخول الطبيب
            </h1>
            <p className="text-muted-foreground">
              أدخل بياناتك للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="doctor@email.com"
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
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-muted-foreground">تذكرني</span>
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD + "?type=doctor"}
                className="text-blue-600 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button
              type="submit"
              variant="blue"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              تسجيل الدخول
            </Button>
          </form>

          {/* Test Accounts Segment */}
          <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 mb-3 text-center">حسابات تجريبية للأطباء (الاسم - التخصص)</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "dr.ahmed@widad.health", password: "password123" })}
              >
                <span>د. أحمد السيد</span>
                <span className="opacity-70 font-normal">نساء وتوليد</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "dr.fatma@widad.health", password: "password123" })}
              >
                <span>د. فاطمة حسن</span>
                <span className="opacity-70 font-normal">أمراض نساء</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "dr.mohamed@widad.health", password: "password123" })}
              >
                <span>د. محمد عبدالله</span>
                <span className="opacity-70 font-normal">غدد صماء</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "dr.sara@widad.health", password: "password123" })}
              >
                <span>د. سارة إبراهيم</span>
                <span className="opacity-70 font-normal">خصوبة وعقم</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white justify-between px-4 shadow-sm"
                loading={isSubmitting}
                onClick={() => onSubmit({ email: "dr.khaled@widad.health", password: "password123" })}
              >
                <span>د. خالد رمضان</span>
                <span className="opacity-70 font-normal">نساء وتوليد</span>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground">
              تريد الانضمام كطبيب؟{" "}
              <Link
                to={ROUTES.DOCTOR_REGISTER}
                className="text-blue-600 font-medium hover:underline"
              >
                انضم إلينا
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default DoctorLogin;
