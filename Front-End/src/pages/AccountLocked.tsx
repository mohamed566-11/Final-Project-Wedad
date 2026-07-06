import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowRight, Mail } from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/layout/AuthLayout";
import { ROUTES } from "@/utils/constants";

const AccountLocked: React.FC = () => {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    window.location.href =
      "mailto:support@widad.health?subject=Account Activation Request";
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        <Card
          variant="elevated"
          padding="lg"
          className="animate-slide-up text-center border-red-100"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse-slow">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            الحساب مغلق مؤقتاً
          </h1>

          <p className="text-muted-foreground mb-8 text-lg">
            تم تعطيل هذا الحساب.
            <br />
            <span className="font-medium text-foreground block mt-2">
              يرجى التواصل مع إدارة النظام لإعادة تفعيل حسابك.
            </span>
          </p>

          <div className="space-y-4">
            <Button
              variant="gradient"
              fullWidth
              onClick={handleContactSupport}
              icon={Mail}
              className="bg-primary hover:bg-primary/90"
            >
              تواصل مع الدعم الفني
            </Button>

            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(ROUTES.HOME)}
              icon={ArrowRight}
            >
              العودة للرئيسية
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default AccountLocked;
