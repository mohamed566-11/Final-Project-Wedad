import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Video,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle2,
  User,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Stethoscope,
  Wallet,
} from "lucide-react";
import {
  consultationService,
  DoctorDetails,
  BookingData,
} from "@/services/consultationService";
import { TimeSlotPicker } from "@/components/consultations/TimeSlotPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = "type" | "datetime" | "notes" | "payment" | "confirm";

const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "type", label: "نوع الجلسة", icon: <Video className="w-5 h-5" /> },
  { key: "datetime", label: "الموعد", icon: <Calendar className="w-5 h-5" /> },
  { key: "notes", label: "ملاحظات", icon: <FileText className="w-5 h-5" /> },
  { key: "payment", label: "الدفع", icon: <CreditCard className="w-5 h-5" /> },
  {
    key: "confirm",
    label: "تأكيد",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
];

const paymentMethods = [
  {
    value: "paymob_card",
    label: "بطاقة بنكية",
    icon: <CreditCard className="w-6 h-6" />,
    desc: "Visa / Mastercard",
  },
  {
    value: "paymob_wallet",
    label: "محفظة إلكترونية",
    icon: <Wallet className="w-6 h-6" />,
    desc: "Vodafone, Etisalat, etc.",
  },
  {
    value: "cash",
    label: "دفع عند الزيارة",
    icon: <MapPin className="w-6 h-6" />,
    desc: "نقداً في العيادة",
    offlineOnly: true,
  },
];

export default function BookConsultation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("type");

  // Booking Data
  const [consultationType, setConsultationType] = useState<"video" | "offline">(
    "video",
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || getTodayDate(),
  );
  const [selectedTime, setSelectedTime] = useState(
    searchParams.get("time") || "",
  );
  const [patientNotes, setPatientNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paymob_card");
  const [walletNumber, setWalletNumber] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await consultationService.getDoctorDetails(
          parseInt(id),
        );
        const doc = response.data?.doctor || response.data || response;
        if (doc) {
          setDoctor(doc);
          if (doc.session_type === "offline") setConsultationType("offline");
          else if (doc.session_type === "video") setConsultationType("video");
        }
      } catch (err) {
        toast.error("خطأ في تحميل بيانات الطبيب");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
    window.scrollTo(0, 0);
  }, [id]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "type":
        return true;
      case "datetime":
        return selectedDate && selectedTime;
      case "notes":
        return true;
      case "payment":
        if (consultationType === "offline" && paymentMethod === "cash")
          return true;
        if (paymentMethod === "paymob_wallet")
          return /^01[0125][0-9]{8}$/.test(walletNumber);
        return !!paymentMethod;
      case "confirm":
        return termsAccepted;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    if (!doctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const bookingData: BookingData = {
        doctor_id: doctor.id,
        date: selectedDate,
        time: selectedTime,
        type: consultationType,
        patient_notes: patientNotes || undefined,
        payment_method:
          consultationType === "offline" && paymentMethod === "cash"
            ? undefined
            : paymentMethod === "paymob_wallet"
              ? "wallet"
              : paymentMethod,
        wallet_number:
          paymentMethod === "paymob_wallet" ? walletNumber : undefined,
      };

      const response = await consultationService.bookConsultation(bookingData);
      if (response.status) {

        const paymentData = response.data?.payment;
        const paymentUrl = paymentData?.payment_url || paymentData?.redirect_url;
        const isWallet = paymentMethod === "paymob_wallet";

        if (paymentUrl) {
          toast.success("يتم توجيهك الآن لإتمام الدفع...");
          window.location.href = paymentUrl;
        } else {
          if (isWallet) {
            toast.success("تم الحجز! يرجى مراجعة هاتفك (المحفظة) لتأكيد عملية الدفع للإتمام.", {
              duration: 8000, // Show for 8 seconds to ensure they read it
            });
          } else {
            toast.success("تم الحجز بنجاح!");
          }

          navigate(
            `/patient/consultations/${response.data?.consultation?.id || ""}`,
          );
        }
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "فشل الحجز، يرجى المحاولة مرة أخرى",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-muted font-sans pb-32" dir="rtl">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (currentStepIndex > 0 ? goBack() : navigate(-1))}
              className="hover:bg-muted/50 rounded-xl"
            >
              <ArrowRight className="w-5 h-5 text-foreground/80" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground leading-tight">
                حجز استشارة جديدة
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                خطوة {currentStepIndex + 1} من {steps.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-border flex items-center justify-between overflow-x-auto">
              {steps.map((step, index) => {
                const isActive = step.key === currentStep;
                const isCompleted = index < currentStepIndex;
                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center gap-2 min-w-[60px]"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                          : isCompleted
                            ? "bg-primary-100 text-primary-700"
                            : "bg-muted/50 text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold transition-colors",
                        isActive
                          ? "text-primary-700"
                          : isCompleted
                            ? "text-primary"
                            : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[40px] shadow-xl shadow-border/50 border border-white p-6 md:p-8 min-h-[400px] relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {currentStep === "type" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground">
                          كيف تفضلين مقابلة الطبيب؟
                        </h2>
                        <p className="text-muted-foreground font-medium">
                          اخترنا لكِ أفضل الخيارات المتاحة لهذا الطبيب
                        </p>
                      </div>

                      <div className="grid gap-4">
                        {["video", "both"].includes(doctor.session_type) && (
                          <label
                            className={cn(
                              "relative cursor-pointer group p-6 rounded-3xl border-2 transition-all duration-300 flex items-center gap-6",
                              consultationType === "video"
                                ? "bg-primary-50 border-primary shadow-md"
                                : "bg-white border-border hover:border-primary-200 hover:bg-muted",
                            )}
                          >
                            <input
                              type="radio"
                              name="type"
                              className="hidden"
                              checked={consultationType === "video"}
                              onChange={() => setConsultationType("video")}
                            />
                            <div
                              className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-colors",
                                consultationType === "video"
                                  ? "bg-primary text-white shadow-lg shadow-primary-500/30"
                                  : "bg-muted/50 text-muted-foreground",
                              )}
                            >
                              <Video className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                استشارة أونلاين (فيديو)
                              </h3>
                              <p className="text-muted-foreground text-sm font-medium">
                                تحدثي مع الطبيب فيديو صوت وصورة وأنتي في بيتك
                              </p>
                            </div>
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                consultationType === "video"
                                  ? "border-primary"
                                  : "border-border",
                              )}
                            >
                              {consultationType === "video" && (
                                <div className="w-3 h-3 bg-primary rounded-full" />
                              )}
                            </div>
                          </label>
                        )}

                        {["offline", "both"].includes(doctor.session_type) && (
                          <label
                            className={cn(
                              "relative cursor-pointer group p-6 rounded-3xl border-2 transition-all duration-300 flex items-center gap-6",
                              consultationType === "offline"
                                ? "bg-primary-50 border-primary shadow-md"
                                : "bg-white border-border hover:border-primary-200 hover:bg-muted",
                            )}
                          >
                            <input
                              type="radio"
                              name="type"
                              className="hidden"
                              checked={consultationType === "offline"}
                              onChange={() => setConsultationType("offline")}
                            />
                            <div
                              className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-colors",
                                consultationType === "offline"
                                  ? "bg-primary text-white shadow-lg shadow-primary-500/30"
                                  : "bg-muted/50 text-muted-foreground",
                              )}
                            >
                              <MapPin className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                زيارة العيادة
                              </h3>
                              <p className="text-muted-foreground text-sm font-medium">
                                حجز موعد للكشف في عيادة الطبيب
                              </p>
                            </div>
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                consultationType === "offline"
                                  ? "border-primary"
                                  : "border-border",
                              )}
                            >
                              {consultationType === "offline" && (
                                <div className="w-3 h-3 bg-primary rounded-full" />
                              )}
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === "datetime" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground">
                          اختاري الموعد المناسب
                        </h2>
                        <p className="text-muted-foreground font-medium">
                          المواعيد المتاحة بتوقيت القاهرة
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-3xl border border-border">
                        <TimeSlotPicker
                          doctorId={doctor.id}
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          onDateChange={setSelectedDate}
                          onSelectSlot={setSelectedTime}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === "notes" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground">
                          هل لديكِ أي معلومات إضافية؟
                        </h2>
                        <p className="text-muted-foreground font-medium">
                          اكتبي أي أعراض تشعرين بها أو أسئلة للطبيب (اختياري)
                        </p>
                      </div>
                      <div className="relative">
                        <textarea
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="مثال: أعاني من صداع مستمر منذ يومين..."
                          className="w-full min-h-[200px] p-6 rounded-3xl bg-muted border-2 border-border focus:border-primary focus:ring-0 resize-none text-foreground font-medium text-lg placeholder:text-muted-foreground transition-all"
                          maxLength={1000}
                        />
                        <div className="absolute bottom-4 left-4 text-xs font-bold text-muted-foreground bg-white/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                          {patientNotes.length}/1000
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === "payment" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground">
                          تأكيد طريقة الدفع
                        </h2>
                        <p className="text-muted-foreground font-medium">
                          وسائل دفع آمنة ومشفرة تماماً
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {paymentMethods
                          .filter(
                            (m) =>
                              !m.offlineOnly || consultationType === "offline",
                          )
                          .map((method) => (
                            <label
                              key={method.value}
                              className={cn(
                                "cursor-pointer group p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4",
                                paymentMethod === method.value
                                  ? "bg-primary-50 border-primary"
                                  : "bg-white border-border hover:border-primary-100",
                              )}
                            >
                              <input
                                type="radio"
                                name="payment"
                                checked={paymentMethod === method.value}
                                onChange={() => setPaymentMethod(method.value)}
                                className="hidden"
                              />
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                  paymentMethod === method.value
                                    ? "bg-primary text-white"
                                    : "bg-muted/50 text-muted-foreground",
                                )}
                              >
                                {method.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-foreground">
                                  {method.label}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                  {method.desc}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  paymentMethod === method.value
                                    ? "border-primary"
                                    : "border-border",
                                )}
                              >
                                {paymentMethod === method.value && (
                                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                                )}
                              </div>
                            </label>
                          ))}
                      </div>

                      {paymentMethod === "paymob_wallet" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-muted p-6 rounded-3xl border border-border overflow-hidden"
                        >
                          <label className="block text-sm font-bold text-foreground/80 mb-2">
                            رقم المحفظة الإلكترونية
                          </label>
                          <input
                            type="tel"
                            placeholder="01xxxxxxxxx"
                            value={walletNumber}
                            onChange={(e) => setWalletNumber(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono text-lg"
                            maxLength={11}
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {currentStep === "confirm" && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary-900/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                        <div className="relative z-10 text-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                          </div>
                          <h2 className="text-2xl font-black mb-1">
                            مراجعة الحجز
                          </h2>
                          <p className="text-white/80 font-medium">
                            يرجى مراجعة التفاصيل قبل التأكيد النهائي
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border">
                          <span className="text-muted-foreground font-medium text-sm">
                            نوع الاستشارة
                          </span>
                          <span className="font-bold text-foreground flex items-center gap-2">
                            {consultationType === "video" ? (
                              <Video className="w-4 h-4 text-primary" />
                            ) : (
                              <MapPin className="w-4 h-4 text-primary" />
                            )}
                            {consultationType === "video"
                              ? "أونلاين (فيديو)"
                              : "زيارة عيادة"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border">
                          <span className="text-muted-foreground font-medium text-sm">
                            التاريخ والوقت
                          </span>
                          <div className="text-left">
                            <div className="font-bold text-foreground">
                              {selectedDate}
                            </div>
                            <div className="text-xs text-primary font-bold mt-1">
                              {selectedTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border">
                          <span className="text-muted-foreground font-medium text-sm">
                            قيمة الكشف
                          </span>
                          <span className="font-black text-xl text-foreground">
                            {doctor.consultation_price} جم
                          </span>
                        </div>
                      </div>

                      <label className="flex items-start gap-3 p-4 border-2 border-border rounded-2xl cursor-pointer hover:bg-muted transition-colors">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="w-5 h-5 mt-0.5 rounded text-primary focus:ring-primary border-border"
                        />
                        <div className="text-sm leading-relaxed text-muted-foreground">
                          أوافق على{" "}
                          <span className="text-primary font-bold">
                            شروط الخدمة
                          </span>{" "}
                          و{" "}
                          <span className="text-primary font-bold">
                            سياسة الخصوصية
                          </span>
                          ، وأتعهد بالحضور في الموعد المحدد.
                        </div>
                      </label>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden lg:block space-y-6 sticky top-24">
            <Card className="p-6 rounded-[32px] border-none shadow-xl shadow-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-50 to-white"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg mb-4">
                  {doctor.image_url ? (
                    <img
                      src={doctor.image_url}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                      <User className="w-10 h-10 text-border" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black text-foreground mb-1">
                  {doctor.name}
                </h3>
                <p className="text-primary font-bold text-sm mb-4">
                  {doctor.specialization_ar}
                </p>

                <div className="flex gap-1 mb-6">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          i < Math.floor(doctor.rating || 5)
                            ? "bg-yellow-400"
                            : "bg-border",
                        )}
                      />
                    ))}
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/80 p-3 rounded-2xl">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>طبيب معتمد وموثق</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/80 p-3 rounded-2xl">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    <span>{doctor.years_of_experience} سنوات خبرة</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-primary-900 rounded-3xl p-6 text-white shadow-xl shadow-primary-900/20">
              <div className="flex items-center gap-3 mb-4 opacity-80">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold text-sm">سياسة الإلغاء</span>
              </div>
              <p className="text-xs leading-relaxed opacity-70">
                يمكنك إلغاء الحجز مجاناً قبل 24 ساعة من الموعد. في حالة الإلغاء
                المتأخر قد يتم خصم جزء من المبلغ.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-border p-4 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
              الإجمالي
            </div>
            <div className="text-2xl font-black text-foreground">
              {doctor.consultation_price} جم
            </div>
          </div>

          <div className="flex gap-4 flex-1 md:flex-none justify-end md:w-1/2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={goBack}
                className="rounded-2xl border-border hover:bg-muted text-muted-foreground font-bold px-8 h-12"
              >
                سابق
              </Button>
            )}

            <Button
              size="lg"
              onClick={currentStep === "confirm" ? handleSubmit : goNext}
              disabled={!canProceed() || submitting}
              className={cn(
                "rounded-2xl font-bold px-8 h-12 shadow-lg shadow-primary/20 transition-all flex-1 md:flex-none md:min-w-[200px]",
                "bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-emerald-700 font-black",
                submitting && "opacity-80",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> جاري
                  الحجز...
                </>
              ) : currentStep === "confirm" ? (
                "تأكيد ودفع"
              ) : (
                <span className="flex items-center gap-2">
                  التالي <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
