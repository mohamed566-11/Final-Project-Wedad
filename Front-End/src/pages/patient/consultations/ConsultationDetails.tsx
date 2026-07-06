import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  FileText,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  MessageCircle,
  Loader2,
  Download,
  Pill,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Share2,
  Printer,
  CalendarDays,
  Timer,
  Wallet,
  Activity,
  Trash2,
  Zap,
  ReceiptText,
  X,
  BadgeCheck,
  Home,
} from "lucide-react";
import {
  consultationService,
  Consultation,
} from "@/services/consultationService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCancelConsultation } from "@/hooks/usePatientQueries";
import BackButton from "@/components/common/BackButton";
import ConsultationAttachments from '@/components/consultations/ConsultationAttachments';
import ConsultationChat from '@/components/chat/ConsultationChat';

const statusConfig: Record<
  string,
  {
    bg: string;
    text: string;
    lightBg: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    border: string;
  }
> = {
  pending: {
    bg: "bg-amber-500",
    text: "text-amber-700",
    lightBg: "bg-amber-50",
    border: "border-amber-100",
    color: "text-amber-500",
    label: "قيد الانتظار",
    icon: <Clock className="w-5 h-5" />,
  },
  confirmed: {
    bg: "bg-primary",
    text: "text-primary-700",
    lightBg: "bg-primary-50",
    border: "border-primary-100",
    color: "text-primary",
    label: "موعد مؤكد",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  in_progress: {
    bg: "bg-blue-500",
    text: "text-blue-700",
    lightBg: "bg-blue-50",
    border: "border-blue-100",
    color: "text-blue-500",
    label: "جارية الآن",
    icon: <Video className="w-5 h-5" />,
  },
  completed: {
    bg: "bg-muted0",
    text: "text-foreground/80",
    lightBg: "bg-muted",
    border: "border-border",
    color: "text-muted-foreground",
    label: "زيارة مكتملة",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  cancelled_by_patient: {
    bg: "bg-red-500",
    text: "text-red-700",
    lightBg: "bg-red-50",
    border: "border-red-100",
    color: "text-red-500",
    label: "ملغاة",
    icon: <XCircle className="w-5 h-5" />,
  },
  cancelled_by_doctor: {
    bg: "bg-red-500",
    text: "text-red-700",
    lightBg: "bg-red-50",
    border: "border-red-100",
    color: "text-red-500",
    label: "ملغاة من الطبيب",
    icon: <XCircle className="w-5 h-5" />,
  },
  no_show: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    lightBg: "bg-orange-50",
    border: "border-orange-100",
    color: "text-orange-500",
    label: "لم يحضر",
    icon: <AlertCircle className="w-5 h-5" />,
  },
};

export const ConsultationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningCall, setJoiningCall] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [walletNumber, setWalletNumber] = useState("");

  const [showReceipt, setShowReceipt] = useState(false);

  const printReceipt = () => {
    const paymentMethod = consultation.payment?.payment_method?.includes('wallet') ? 'محفظة إلكترونية' : 'بطاقة بنكية';
    const paidDate = consultation.payment?.paid_at ? new Date(consultation.payment.paid_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>إيصال الدفع - استشارة #${consultation.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; background: #fff; color: #111; padding: 32px; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px dashed #e5e7eb; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 900; color: #111; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #9ca3af; letter-spacing: 0.15em; text-transform: uppercase; }
          .badge { display: inline-block; background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 900; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          td:first-child { color: #6b7280; font-weight: 700; }
          td:last-child { text-align: left; font-weight: 900; color: #111; }
          .total-box { background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .total-label { font-size: 10px; color: #059669; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px; }
          .total-amount { font-size: 36px; font-weight: 900; color: #064e3b; }
          .total-amount span { font-size: 16px; opacity: 0.6; }
          .footer { text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏥 وداد تك</div>
          <div class="subtitle">Widad Tech — Medical Receipt</div>
          <div class="badge">✓ تم الدفع بنجاح</div>
        </div>
        <table>
          <tr><td>رقم الاستشارة</td><td>#${consultation.id}</td></tr>
          <tr><td>الطبيب</td><td>${consultation.doctor?.name || '—'}</td></tr>
          <tr><td>التخصص</td><td>${consultation.doctor?.specialization_ar || '—'}</td></tr>
          <tr><td>التاريخ</td><td>${consultation.date}</td></tr>
          <tr><td>الوقت</td><td>${consultation.time}</td></tr>
          <tr><td>نوع الجلسة</td><td>${consultation.type_ar}</td></tr>
          <tr><td>طريقة الدفع</td><td>${paymentMethod}</td></tr>
          <tr><td>تاريخ الدفع</td><td>${paidDate}</td></tr>
        </table>
        <div class="total-box">
          <div class="total-label">الإجمالي المدفوع</div>
          <div class="total-amount">${consultation.price} <span>ج.م</span></div>
        </div>
        <div class="footer">هذا الإيصال يُثبت إتمام عملية الدفع بنجاح — Widad Tech © ${new Date().getFullYear()}</div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleRetryPayment = async (method: "paymob_card" | "paymob_wallet") => {
    if (method === "paymob_wallet") {
      const mobileRegex = /^01[0125][0-9]{8}$/;
      if (!mobileRegex.test(walletNumber)) {
        toast.error("يرجى إدخال رقم موبايل مصري صحيح");
        return;
      }
    }

    setIsRetryingPayment(true);
    try {
      const res = await consultationService.retryPayment(consultation!.id, {
        payment_method: method,
        wallet_number: method === "paymob_wallet" ? walletNumber : undefined,
      });

      if (res.status && res.data?.payment) {
        const p = res.data.payment;
        const paymentUrl = p.payment_url || p.redirect_url;

        if (paymentUrl) {
          toast.success("يتم تحويلك لصفحة الدفع...");
          window.location.href = paymentUrl;
        } else {
          if (method === "paymob_wallet") {
            toast.success("تم إرسال طلب الدفع لهاتفك، يرجى تأكيد العملية من المحفظة.", { duration: 8000 });
            setShowWalletInput(false);
            fetchConsultation();
          }
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "حدث خطأ في استخراج رابط الدفع");
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const cancelMutation = useCancelConsultation();

  const fetchConsultation = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await consultationService.getConsultationDetails(
        parseInt(id),
      );
      if (response.status && response.data) {
        const data = response.data;
        const extracted = data.consultation || data.data || data;
        setConsultation(extracted);
      }
    } catch (err) {
      setError("لم نتمكن من جلب تفاصيل الاستشارة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultation();
  }, [id]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");

    if (paymentStatus === "success") {
      toast.success("تم الدفع بنجاح وتأكيد موعد الاستشارة", { duration: 5000 });
      // Remove the query param gracefully
      navigate(location.pathname, { replace: true });
    } else if (paymentStatus === "failed") {
      toast.error("آسفون، فشلت عملية الدفع. يرجى المحاولة مرة أخرى أو اختيار وسيلة دفع أخرى.", { duration: 6000 });
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  const handleJoinCall = async () => {
    if (!consultation) return;
    if (consultation.google_meet_link) {
      window.open(consultation.google_meet_link, "_blank");
      return;
    }
    setJoiningCall(true);
    try {
      navigate(`/patient/consultations/${consultation.id}/video`);
    } catch (err) {
      toast.error("حدث خطأ في الانضمام للمكالمة");
    } finally {
      setJoiningCall(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!consultation || !cancelReason.trim()) return;
    try {
      await cancelMutation.mutateAsync({
        id: consultation.id,
        reason: cancelReason,
      });
      toast.success("تم إلغاء الموعد بنجاح");
      setShowCancelModal(false);
      setCancelReason("");
      fetchConsultation(); // Refresh the data
    } catch (err) {
      toast.error("حدث خطأ أثناء الإلغاء");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-black animate-pulse text-sm tracking-widest">
          تحميل تفاصيل الاستشارة...
        </p>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-border"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">
            عذراً، حدث خطأ
          </h2>
          <p className="text-muted-foreground mb-8 font-bold leading-relaxed">
            {error || "الاستشارة المطلوبة غير موجودة في سجلاتنا"}
          </p>
          <Button
            onClick={() => navigate("/patient/consultations")}
            className="w-full h-14 bg-foreground hover:bg-foreground rounded-2xl font-black text-lg shadow-xl"
          >
            العودة لقائمة الاستشارات
          </Button>
        </motion.div>
      </div>
    );
  }

  const status = statusConfig[consultation.status] || statusConfig.pending;

  // Force show if confirmed or in_progress for video calls
  const canEffectivelyJoin =
    consultation.can_join ||
    (["confirmed", "in_progress"].includes(consultation.status) &&
      consultation.type === "video");

  return (
    <div className="min-h-screen bg-muted pb-32 font-sans" dir="rtl">
      {/* Minimal Sticky Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-xl border-b border-border z-[60] px-4">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          {/* Left side: Receipt + Back buttons */}
          <div className="flex items-center gap-2">
            {consultation.payment?.status === 'completed' && (
              <button
                onClick={() => setShowReceipt(true)}
                className="flex items-center gap-2 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-black rounded-xl px-4 text-xs transition-all group"
              >
                <ReceiptText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                إيصال الدفع
              </button>
            )}
            <button
              onClick={() => navigate('/patient/consultations')}
              className="flex items-center gap-2 h-10 bg-muted hover:bg-border text-muted-foreground border border-border font-black rounded-xl px-4 text-xs transition-all group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              الرئيسية
            </button>
          </div>

          <div className="flex items-center gap-4">
            {canEffectivelyJoin && (
              <Button
                onClick={handleJoinCall}
                disabled={joiningCall}
                className="hidden md:flex h-10 bg-primary hover:bg-primary text-foreground font-black rounded-xl px-6 items-center gap-2 shadow-lg shadow-primary-500/20 text-xs border-t border-white/20"
              >
                {joiningCall ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Video className="w-4 h-4" /> انضمام للجلسة
                  </>
                )}
              </Button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-lg">
                #{consultation.id}
              </span>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase",
                  status.lightBg,
                  status.color,
                  status.border,
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    status.bg.replace("bg-", "bg-"),
                  )}
                />
                {status.label}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Right Column: Doctor & Diagnosis */}
          <div className="lg:col-span-8 space-y-6">
            {/* Premium Doctor Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-[40px] overflow-hidden bg-muted ring-4 ring-white shadow-2xl relative z-10">
                    {consultation.doctor?.image_url ? (
                      <img
                        src={consultation.doctor.image_url}
                        alt={consultation.doctor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-border">
                        <User className="w-12 h-12 text-border" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border-4 border-white z-20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-right">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-foreground">
                      {consultation.doctor?.name}
                    </h2>
                    <div className="flex items-center justify-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-xl border border-amber-100 mx-auto sm:mx-0">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-sm font-black">
                        {consultation.doctor?.rating?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>
                  <p className="text-primary font-extrabold text-lg mb-6">
                    {consultation.doctor?.specialization_ar}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <Link
                      to={`/patient/consultations/doctors/${consultation.doctor?.id}`}
                    >
                      <Button
                        variant="outline"
                        className="rounded-2xl font-black px-6 h-12 border-border hover:bg-foreground hover:text-white transition-all"
                      >
                        زيارة الملف الشخصي
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medical Report / Prescription */}
            <AnimatePresence>
              {(consultation.doctor_notes ||
                consultation.prescription?.medications?.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-foreground rounded-[40px] overflow-hidden shadow-2xl border border-white/5"
                  >
                    <div className="p-8 pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Stethoscope className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-white text-xl font-black">
                            التقرير الجلسة الطبي
                          </h3>
                          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                            Medical Report & Treatment
                          </p>
                        </div>
                      </div>
                      <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl h-12 px-5 font-black text-xs gap-2">
                        <Printer className="w-4 h-4" />
                        طباعة
                      </Button>
                    </div>

                    <div className="p-8 space-y-10">
                      {consultation.doctor_notes && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-white/30">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest px-4">
                              Diagnosis تشخيص الحالة
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                          </div>
                          <div className="bg-white/5 rounded-[30px] p-8 border border-white/5 text-white/90 leading-relaxed font-bold text-lg relative">
                            <Sparkles className="absolute top-4 left-4 w-6 h-6 text-primary/20" />
                            {consultation.doctor_notes}
                          </div>
                        </div>
                      )}

                      {consultation.prescription?.medications?.length > 0 && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-white/30">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest px-4">
                              Prescription الوصفة العلاجية
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {consultation.prescription.medications.map(
                              (med: any, i: number) => (
                                <div
                                  key={i}
                                  className="bg-white/5 rounded-3xl p-6 border border-white/5 hover:bg-white/[0.08] transition-all group/med"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary text-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20 group-hover/med:scale-110 transition-transform">
                                      <Pill className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-white font-black text-lg mb-1 truncate">
                                        {med.name}
                                      </h4>
                                      <p className="text-primary font-bold text-sm">
                                        {med.dosage}
                                      </p>
                                      <div className="mt-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-white/40">
                                        <span className="flex items-center gap-1">
                                          <Timer className="w-3 h-3" />{" "}
                                          {med.frequency}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span>{med.duration}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                          {/* View Full Prescription Button */}
                          <button
                            onClick={() => navigate(`/patient/consultations/${consultation.id}/prescription`)}
                            className="w-full mt-2 border border-white/10 bg-white/5 hover:bg-primary hover:border-primary text-white/70 hover:text-white rounded-2xl h-12 font-black text-sm flex items-center justify-center gap-2 transition-all group/prescbtn"
                          >
                            <Pill className="w-4 h-4 group-hover/prescbtn:animate-bounce" />
                            عرض الوصفة الطبية الكاملة وطباعتها
                            <ChevronLeft className="w-4 h-4 group-hover/prescbtn:-translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Patient Notes */}
            {consultation.patient_notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[40px] p-10 border border-border shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-foreground">
                    ملاحظاتكِ للطبيب
                  </h3>
                </div>
                <div className="text-muted-foreground font-bold text-lg leading-relaxed italic pr-4">
                  "{consultation.patient_notes}"
                </div>
              </motion.div>
            )}

            {/* Attachments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-[40px] overflow-hidden border border-border shadow-sm"
            >
              <div className="px-10 pt-10 pb-6 border-b border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">ملفاتكِ وتحاليلكِ</h3>
                  <p className="text-xs text-muted-foreground font-bold mt-0.5">أرفقي نتائج التحاليل والأشعة قبل الجلسة لتسهيل المتابعة</p>
                </div>
              </div>
              <div className="p-8">
                <ConsultationAttachments
                  consultationId={parseInt(id || '0')}
                  role="patient"
                  canUpload={!['completed', 'cancelled_by_patient', 'cancelled_by_doctor', 'no_show'].includes(consultation.status)}
                  viewerLabel="المريضة"
                />
              </div>
            </motion.div>

            {/* ============================================================
                DOCTOR-PATIENT CHAT SECTION
            ============================================================ */}
            {!['pending', 'cancelled_by_patient', 'cancelled_by_doctor', 'no_show'].includes(consultation.status) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[40px] overflow-hidden border border-border shadow-sm"
              >
                <div className="px-10 pt-10 pb-6 border-b border-border flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">المحادثة مع دكتورتكِ</h3>
                    <p className="text-xs text-muted-foreground font-bold mt-0.5">تواصلي مع الطبيبة مباشرة بالرسائل والصور</p>
                  </div>
                </div>
                <div className="p-4" style={{ height: '520px' }}>
                  <ConsultationChat
                    consultationId={parseInt(id || '0')}
                    consultationStatus={consultation.status}
                    otherPartyName={consultation.doctor?.name || 'الطبيبة'}
                    otherPartyAvatar={consultation.doctor?.image_url}
                    userType="patient"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Left Column: Sidebar Cards */}
          <div className="lg:col-span-4 space-y-6">
            {/* Session Date Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[40px] p-8 shadow-sm border border-border"
            >
              <h3 className="font-black text-foreground mb-8 flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                الموعد المقرر
              </h3>

              <div className="space-y-5">
                <div className="p-6 bg-muted rounded-[30px] border border-border/50 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">
                    اليوم والتاريخ
                  </p>
                  <p className="font-black text-foreground text-xl leading-tight">
                    {new Date(consultation.date).toLocaleDateString("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-primary-50 rounded-[28px] border border-primary-100/50 text-center">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">
                      الوقت
                    </p>
                    <p className="font-black text-primary-700 flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {consultation.time}
                    </p>
                  </div>
                  <div className="p-5 bg-indigo-50 rounded-[28px] border border-indigo-100/50 text-center">
                    <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest mb-2">
                      المدة
                    </p>
                    <p className="font-black text-indigo-700">{consultation.duration_minutes || 60} دقيقة</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-[28px] border border-border flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                        consultation.type === "video"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-emerald-50 text-emerald-500",
                      )}
                    >
                      {consultation.type === "video" ? (
                        <Video size={18} />
                      ) : (
                        <MapPin size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">
                        نوع الجلسة
                      </p>
                      <p className="font-black text-foreground text-sm whitespace-nowrap">
                        {consultation.type_ar}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-border group-hover:-translate-x-1 transition-transform" />
                </div>

                {canEffectivelyJoin && (
                  <Button
                    onClick={handleJoinCall}
                    disabled={joiningCall}
                    className="w-full h-16 bg-foreground hover:bg-foreground text-white font-black rounded-[30px] shadow-xl flex items-center justify-center gap-3 group/btn mt-4 border-t border-white/5"
                  >
                    {joiningCall ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-primary-400 fill-primary-400 animate-pulse" />
                        انضمام للمكالمة الآن
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Payment Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-foreground rounded-[40px] p-8 shadow-2xl relative overflow-hidden text-white"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/[0.02] rounded-full -ml-16 -mt-16" />
              <h3 className="font-black mb-8 flex items-center gap-3 text-lg opacity-90">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary-400">
                  <Wallet className="w-5 h-5" />
                </div>
                ملخص الدفع
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-bold opacity-60">
                  <span>تكلفة الاستشارة</span>
                  <span>{consultation.price} ج.م</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1">
                      Total Paid الإجمالي
                    </p>
                    <p className="text-3xl font-black">
                      {consultation.price}{" "}
                      <span className="text-xs opacity-40">ج.م</span>
                    </p>
                  </div>
                  {consultation.payment?.status === "completed" ? (
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 uppercase">
                      <CheckCircle2 className="w-3 h-3" />
                      Success
                    </div>
                  ) : consultation.status === "pending" && (
                    <div className="bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 uppercase">
                      <Timer className="w-3 h-3" />
                      Pending
                    </div>
                  )}
                </div>

                {consultation.payment?.paid_at && (
                  <div className="pt-4 flex items-center gap-3 text-white/30 text-[9px] font-black uppercase tracking-widest border-t border-white/5">
                    <Activity className="w-3 h-3" />
                    Txn: {consultation.id}8294X7
                  </div>
                )}

                {/* Retry Payment Buttons */}
                {consultation.status === "pending" && consultation.payment?.status !== "completed" && (
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-sm font-bold text-white/70 mb-4 text-center">يرجى إكمال الدفع لتأكيد الحجز.</p>

                    {!showWalletInput ? (
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={() => handleRetryPayment("paymob_card")}
                          disabled={isRetryingPayment}
                          className="bg-primary hover:bg-primary-600 text-white font-black rounded-xl h-12 w-full transition-all"
                        >
                          {isRetryingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : "إكمال الدفع بالبطاقة"}
                        </Button>
                        <Button
                          onClick={() => setShowWalletInput(true)}
                          variant="outline"
                          className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white font-black rounded-xl h-12 w-full transition-all"
                        >
                          الدفع بمحفظة إلكترونية
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                          type="text"
                          placeholder="رقم المحفظة (مثال: 01012345678)"
                          value={walletNumber}
                          onChange={(e) => setWalletNumber(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                          dir="ltr"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRetryPayment("paymob_wallet")}
                            disabled={isRetryingPayment || !walletNumber}
                            className="bg-primary hover:bg-primary-600 text-white font-black flex-1 rounded-xl h-12 transition-all"
                          >
                            {isRetryingPayment ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "تأكيد الدفع"}
                          </Button>
                          <Button
                            onClick={() => setShowWalletInput(false)}
                            variant="ghost"
                            className="text-white border border-white/10 hover:bg-white/5 font-black shrink-0 px-4 rounded-xl h-12"
                          >
                            رجوع
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Review Card — shown for completed consultations */}
            {consultation.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-[40px] p-8 shadow-sm border border-border overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-[24px] bg-amber-50 flex items-center justify-center mx-auto mb-6 shadow-inner text-amber-500">
                    <Star className="w-7 h-7" />
                  </div>

                  {consultation.has_review ? (
                    // Already reviewed
                    <>
                      <h4 className="text-xl font-black text-foreground mb-2">
                        شكراً لتقييمك!
                      </h4>
                      <p className="text-muted-foreground font-bold text-sm mb-4 leading-relaxed px-4">
                        لقد قيّمت هذه الاستشارة مسبقاً. رأيك يساعدنا على التحسين.
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </>
                  ) : (
                    // Not yet reviewed — can_review=true
                    <>
                      <h4 className="text-xl font-black text-foreground mb-2">
                        قيّمي الاستشارة
                      </h4>
                      <p className="text-muted-foreground font-bold text-sm mb-6 leading-relaxed px-4">
                        شاركينا تجربتك مع الطبيب لمساعدة المريضات الأخريات.
                      </p>
                      <Button
                        onClick={() => navigate(`/patient/consultations/${consultation.id}/review`)}
                        className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black transition-all text-base gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <Star className="w-5 h-5" />
                        إضافة تقييم
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Corner - Cancellation */}
            {consultation.can_cancel && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[40px] p-8 shadow-sm border border-border overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-[24px] bg-rose-50 flex items-center justify-center mx-auto mb-6 shadow-inner text-rose-500">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black text-foreground mb-2">
                    إلغاء الموعد؟
                  </h4>
                  <p className="text-muted-foreground font-bold text-sm mb-6 leading-relaxed px-4">
                    إذا كنتِ بحاجة لذلك، يمكنكِ إلغاء الموعد وسنحيط الطبيب
                    علماً.
                  </p>
                  <Button
                    onClick={() => setShowCancelModal(true)}
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-rose-200 text-rose-500 font-black hover:bg-rose-50 hover:border-rose-300 transition-all text-base gap-2"
                  >
                    تأكيد الإلغاء
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* No floating bar as per user request */}

      {/* Cancellation Modal Overlay */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[50px] max-w-lg w-full p-12 relative z-10 shadow-3xl text-right overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="w-20 h-20 rounded-[30px] bg-rose-50 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground">
                    إلغاء الموعد
                  </h3>
                  <p className="text-muted-foreground font-bold mt-1 uppercase text-xs tracking-widest">
                    Cancel Appointment
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground font-bold mb-8 text-lg leading-relaxed">
                هل أنتِ متأكدة من رغبتكِ في إلغاء هذا الموعد؟ سيتم إعلام الطبيب
                فوراً.
              </p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ما هو سبب الإلغاء؟"
                rows={4}
                className="w-full px-8 py-6 bg-muted border border-border rounded-[30px] focus:ring-4 focus:ring-rose-500/10 focus:bg-white focus:border-rose-500 transition-all outline-none font-bold text-foreground/80 resize-none shadow-inner mb-10"
              />

              <div className="flex gap-4 relative z-10">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="flex-1 rounded-2xl h-16 border-border font-black text-muted-foreground text-lg hover:bg-muted"
                >
                  رجوع
                </Button>
                <Button
                  onClick={handleCancelConfirm}
                  disabled={cancelMutation.isPending || !cancelReason.trim()}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-16 font-black shadow-2xl shadow-rose-500/30 disabled:opacity-50 text-lg"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "إلغاء نهائي"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Payment Receipt Modal ─── */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[40px] overflow-hidden shadow-2xl w-full max-w-sm z-10"
            >
              {/* Header */}
              <div className="bg-foreground p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20" />
                <button
                  onClick={() => setShowReceipt(false)}
                  className="absolute top-5 left-5 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-[20px] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <BadgeCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-black text-xl mb-1">إيصال الدفع</h3>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Payment Receipt</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "رقم الاستشارة", value: `#${consultation.id}` },
                    { label: "الطبيب", value: consultation.doctor?.name },
                    { label: "التاريخ", value: consultation.date },
                    { label: "نوع الجلسة", value: consultation.type_ar },
                    { label: "طريقة الدفع", value: consultation.payment?.payment_method?.includes('wallet') ? 'محفظة إلكترونية' : 'بطاقة بنكية' },
                    { label: "رقم المعاملة", value: consultation.payment?.paid_at ? new Date(consultation.payment.paid_at).toLocaleDateString('ar-EG') : '—' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      <span className="text-sm font-black text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="bg-emerald-50 rounded-[24px] p-6 border border-emerald-100 text-center">
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">الإجمالي المدفوع</p>
                  <p className="text-4xl font-black text-emerald-700">
                    {consultation.price} <span className="text-lg opacity-60">ج.م</span>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-emerald-600 text-xs font-black">
                    <CheckCircle2 className="w-4 h-4" />
                    تم الدفع بنجاح
                  </div>
                </div>

                <button
                  onClick={printReceipt}
                  className="w-full h-12 bg-foreground hover:bg-foreground/90 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الإيصال
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsultationDetails;
