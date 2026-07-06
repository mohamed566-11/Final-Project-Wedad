import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  patientRegisterSchema,
  PatientRegisterFormData,
} from "@/utils/validation";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES, IMAGE_CONSTRAINTS } from "@/utils/constants";
import AuthLayout from "@/components/layout/AuthLayout";
import Input from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import PasswordStrength from "@/components/common/PasswordStrength";
import BackButton from "@/components/common/BackButton";

const PatientRegister: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(patientRegisterSchema),
    mode: "onTouched",
  });

  const password = watch("password", "");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > IMAGE_CONSTRAINTS.maxSize) {
        toast.error("حجم الصورة يجب أن لا يزيد عن 2 ميجابايت");
        return;
      }
      if (!IMAGE_CONSTRAINTS.acceptedTypes.includes(file.type)) {
        toast.error(
          "نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, أو GIF",
        );
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PatientRegisterFormData) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name!);
    formData.append("email", data.email!);
    formData.append("password", data.password!);
    formData.append("password_confirmation", data.password_confirmation!);
    formData.append("phone", data.phone!);

    if (data.age) formData.append("age", String(data.age));
    if (imageFile) formData.append("image", imageFile);

    try {
      await registerUser(formData, "patient");
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (error) {
      handleApiError(error as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout variant="patient">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6 text-right">
          <BackButton />
        </div>

        <Card variant="elevated" padding="lg" className="animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-glow mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              إنشاء حساب مريض
            </h1>
            <p className="text-muted-foreground">
              أنشئ حسابك للاستفادة من خدماتنا الصحية
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted border-4 border-card shadow-soft overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="الاسم الكامل"
                placeholder="أدخل اسمك"
                icon={User}
                error={errors.name?.message}
                {...register("name")}
                required
              />

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
                label="رقم الهاتف"
                type="tel"
                placeholder="01xxxxxxxxx"
                icon={Phone}
                helperText="يجب أن يبدأ بـ 010, 011, 012, أو 015"
                error={errors.phone?.message}
                {...register("phone")}
                required
              />

              <Input
                label="العمر"
                type="number"
                placeholder="25"
                icon={Calendar}
                error={errors.age?.message}
                {...register("age")}
              />
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Input
                    label="كلمة المرور"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    icon={Lock}
                    error={errors.password?.message}
                    {...register("password")}
                    required
                  />
                  {password && <PasswordStrength password={password} />}
                </div>

                <Input
                  label="تأكيد كلمة المرور"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  icon={Lock}
                  error={errors.password_confirmation?.message}
                  {...register("password_confirmation")}
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <p className="text-sm text-muted-foreground text-center">
              بإنشاء حساب، أنت توافق على{" "}
              <Link to={ROUTES.TERMS} className="text-primary hover:underline">
                شروط الاستخدام
              </Link>{" "}
              و{" "}
              <Link
                to={ROUTES.PRIVACY}
                className="text-primary hover:underline"
              >
                سياسة الخصوصية
              </Link>
            </p>

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              إنشاء الحساب
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link
                to={ROUTES.PATIENT_LOGIN}
                className="text-primary font-medium hover:underline"
              >
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default PatientRegister;
