import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { handleApiError } from "@/utils/errorHandler";
import { ROUTES } from "@/utils/constants";
import AuthLayout from "@/components/layout/AuthLayout";
import OTPInput from "@/components/auth/OTPInput";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const { user, userType, verifyEmail, resendOTP, isVerified } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isVerified) {
      const dashboard =
        userType === "doctor"
          ? ROUTES.DOCTOR_DASHBOARD
          : ROUTES.PATIENT_DASHBOARD;
      navigate(dashboard);
    }
  }, [isVerified, userType, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 5) {
      setError("يرجى إدخال كود التحقق كاملاً");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await verifyEmail(otp);
      const dashboard =
        userType === "doctor"
          ? ROUTES.DOCTOR_DASHBOARD
          : ROUTES.PATIENT_DASHBOARD;
      navigate(dashboard);
    } catch (err) {
      handleApiError(err as any);
      setError("كود التحقق غير صحيح");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP();
      setCountdown(60);
      setCanResend(false);
      setOtp("");
      setError("");
    } catch (err) {
      handleApiError(err as any);
    }
  };

  return (
    <AuthLayout variant={userType === "doctor" ? "doctor" : "patient"}>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>العودة للرئيسية</span>
        </button>

        <Card variant="elevated" padding="lg" className="animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-glow mb-4 animate-pulse-soft">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تحقق من بريدك الإلكتروني
            </h1>
            <p className="text-muted-foreground">أرسلنا كود تحقق إلى</p>
            <p className="text-primary font-medium mt-1" dir="ltr">
              {user?.email}
            </p>
          </div>

          <div className="space-y-6">
            <OTPInput length={5} value={otp} onChange={setOtp} error={error} />

            <Button
              variant="gradient"
              fullWidth
              size="lg"
              loading={isVerifying}
              disabled={otp.length !== 5}
              icon={CheckCircle}
              onClick={handleVerify}
            >
              تأكيد
            </Button>

            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <RefreshCw size={16} />
                  إعادة إرسال الكود
                </button>
              ) : (
                <p className="text-muted-foreground text-sm">
                  يمكنك إعادة الإرسال بعد {countdown} ثانية
                </p>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              تحقق من مجلد البريد العشوائي (Spam) إذا لم تجد الرسالة
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
