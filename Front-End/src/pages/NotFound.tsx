import { useNavigate } from "react-router-dom";
import { Home, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-coral-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative text-center max-w-md animate-fade-in">
        {/* 404 Display */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold text-primary/10 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-soft">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          عذراً، لا يمكننا العثور على الصفحة التي تبحث عنها.
          <br />
          ربما تم نقلها أو حذفها.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gradient" icon={Home} onClick={() => navigate("/")}>
            الصفحة الرئيسية
          </Button>
          <Button
            variant="outline"
            icon={ArrowRight}
            iconPosition="left"
            onClick={() => navigate(-1)}
          >
            العودة للخلف
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
