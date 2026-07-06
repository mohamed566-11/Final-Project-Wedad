import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Stethoscope,
  Shield,
  Heart,
  Calendar,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Card from "@/components/common/Card";
import { ROUTES } from "@/utils/constants";
import { cn } from "@/lib/utils";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const userTypes = [
    {
      type: "patient",
      title: "المريض",
      description: "إدارة مواعيدك الطبية وسجلاتك الصحية",
      icon: User,
      loginPath: ROUTES.PATIENT_LOGIN,
      registerPath: ROUTES.PATIENT_REGISTER,
      gradient: "from-primary to-primary-600",
      bgGradient: "from-primary-50 to-cyan-50",
      shadow: "shadow-primary/20",
      hasRegister: true,
    },
    {
      type: "doctor",
      title: "الطبيب",
      description: "إدارة عيادتك ومتابعة مرضاك",
      icon: Stethoscope,
      loginPath: ROUTES.DOCTOR_LOGIN,
      registerPath: ROUTES.DOCTOR_REGISTER,
      gradient: "from-coral-400 to-coral-500",
      bgGradient: "from-orange-50 to-rose-50",
      shadow: "shadow-coral-400/20",
      hasRegister: true,
    },
    {
      type: "admin",
      title: "الإدارة",
      description: "لوحة تحكم النظام والإحصائيات",
      icon: Shield,
      loginPath: ROUTES.ADMIN_LOGIN,
      registerPath: "",
      gradient: "from-admin to-violet-600",
      bgGradient: "from-violet-50 to-purple-50",
      shadow: "shadow-admin/20",
      hasRegister: false,
    },
  ];

  const features = [
    {
      icon: Heart,
      title: "رعاية صحية متكاملة",
      description: "نظام شامل لإدارة الرعاية الصحية",
    },
    {
      icon: Calendar,
      title: "حجز المواعيد",
      description: "حجز وإدارة المواعيد الطبية بسهولة",
    },
    {
      icon: FileText,
      title: "السجلات الطبية",
      description: "تخزين آمن للسجلات والتقارير الطبية",
    },
    {
      icon: Activity,
      title: "متابعة مستمرة",
      description: "متابعة الحالة الصحية بشكل دوري",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-coral-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-violet-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-glow mb-6">
              <Heart className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-foreground mb-6 leading-tight tracking-tight px-2">
              منصة <span className="text-gradient-primary">وداد</span> الصحية
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-bold leading-relaxed px-4">
              نظام صحي متكامل يجمع بين الطبيبات والمرضى لتقديم أفضل رعاية صحية
              ذكية بلمسة إنسانية.
            </p>
          </div>
        </div>
      </section>

      {/* User Type Cards */}
      <section className="relative py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {userTypes.map((item, index) => (
              <Card
                key={item.type}
                variant="elevated"
                padding="lg"
                hover
                className={cn(
                  "animate-slide-up group flex flex-col items-center text-center md:items-start md:text-right",
                  item.type === "admin" && "sm:col-span-2 lg:col-span-1",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg ${item.shadow}`}
                >
                  <item.icon className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                </div>

                <h3 className="text-2xl font-black text-foreground mb-2 leading-none">
                  {item.title}
                </h3>
                <p className="text-muted-foreground font-bold text-sm mb-8 leading-relaxed max-w-[250px] md:max-w-none">
                  {item.description}
                </p>

                <div className="space-y-3 w-full mt-auto">
                  <Button
                    variant={
                      item.type === "doctor"
                        ? "coral"
                        : item.type === "admin"
                          ? "admin"
                          : "gradient"
                    }
                    fullWidth
                    className="h-12 rounded-xl font-black text-sm"
                    onClick={() => navigate(item.loginPath)}
                  >
                    تسجيل الدخول
                  </Button>

                  {item.hasRegister && (
                    <Button
                      variant="outline"
                      fullWidth
                      className="h-12 rounded-xl border-border font-black text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => navigate(item.registerPath)}
                    >
                      إنشاء حساب جديد
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              لماذا تختار <span className="text-gradient-primary">وداد</span>؟
            </h2>
            <div className="w-20 h-1.5 bg-primary/20 rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center md:text-right p-8 rounded-[32px] bg-white border border-muted hover:border-primary/20 transition-all duration-300 shadow-xl shadow-slate-900/5 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-6 transition-colors">
                  <feature.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-black text-foreground mb-3 text-lg leading-none">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} منصة وداد الصحية. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
