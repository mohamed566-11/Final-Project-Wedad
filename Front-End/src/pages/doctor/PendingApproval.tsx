import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, ArrowRight } from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/layout/AuthLayout";
import { ROUTES } from "@/utils/constants";

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout variant="doctor">
      <div className="max-w-md mx-auto">
        <Card
          variant="elevated"
          padding="lg"
          className="animate-slide-up text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-pulse-slow">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            طلبك قيد المراجعة
          </h1>

          <p className="text-muted-foreground mb-8 text-lg">
            شكراً لتسجيلك في منصة وداد.
            <br />
            <span className="font-medium text-foreground block mt-2">
              سيتم مراجعة طلبك من قبل الإدارة والتأكيد قريباً.
            </span>
          </p>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
              سوف يصلك بريد إلكتروني فور الموافقة على طلبك وتفعيل حسابك لتتمكن
              من الدخول.
            </div>

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

export default PendingApproval;
