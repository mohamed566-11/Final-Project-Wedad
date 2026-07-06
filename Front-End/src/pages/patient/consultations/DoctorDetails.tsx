import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Star,
  MapPin,
  Video,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Award,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  Share2,
  Languages,
} from "lucide-react";
import {
  consultationService,
  DoctorDetails,
  Review,
} from "@/services/consultationService";
import {
  RatingStars,
  ReviewCard,
} from "@/components/consultations/RatingComponents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import BackButton from "@/components/common/BackButton";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const daysTranslation: Record<string, string> = {
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

export const DoctorDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "schedule" | "reviews">(
    "about",
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await consultationService.getDoctorDetails(
          parseInt(id),
        );
        // Enhanced error handling for different response structures
        const data = response.data?.doctor || response.data || response;
        if (data) {
          setDoctor(data);
        } else {
          setError("بيانات الطبيب غير متوفرة");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "حدث خطأ في تحميل بيانات الطبيب");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchReviews = async (page = 1) => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const response = await consultationService.getDoctorReviews(
        parseInt(id),
        { page },
      );
      if (response.data?.reviews) {
        setReviews(response.data.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews(reviewsPage);
    }
  }, [activeTab, reviewsPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">عفواً</h2>
          <p className="text-muted-foreground mb-6">{error || "الطبيب غير موجود"}</p>
          <Button
            onClick={() => navigate("/patient/consultations/doctors")}
            className="w-full bg-foreground hover:bg-foreground text-white"
          >
            العودة للبحث
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted pb-8 font-sans" dir="rtl">
      <PublicHeader darkHero={true} />
      <main className="flex-1">
        {/* Hero Header */}
        <div className="relative bg-foreground text-white pt-28 pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <BackButton className="text-white hover:bg-white/10 hover:text-white" label="رجوع" />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Doctor Card Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-border/50 p-6 md:p-8 border border-white">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image */}
            <div className="relative mx-auto md:mx-0">
              <div className="w-40 h-40 rounded-[28px] overflow-hidden bg-muted/50 border-4 border-white shadow-lg">
                {doctor.image_url ? (
                  <img
                    src={doctor.image_url}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-border" />
                  </div>
                )}
              </div>
              {doctor.verified_badge && (
                <div className="absolute -bottom-3 -right-3 bg-white p-1.5 rounded-full shadow-md">
                  <div className="bg-blue-500 text-white p-1.5 rounded-full">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right space-y-4">
              <div>
                <h1 className="text-3xl font-black text-foreground mb-2 flex flex-col md:flex-row items-center md:items-baseline gap-3">
                  {doctor.name}
                  {doctor.verified_badge && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs px-2 py-0.5 h-6"
                    >
                      <CheckCircle2 className="w-3 h-3 ml-1" /> موثق
                    </Badge>
                  )}
                </h1>
                <p className="text-lg font-bold text-primary flex items-center justify-center md:justify-start gap-2">
                  <Stethoscope className="w-5 h-5" />
                  {doctor.specialization_ar}
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-foreground">
                    {doctor.rating?.toFixed(1) || "5.0"}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({doctor.total_reviews || 0} تقييم)
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl border border-border">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground/80">
                    {doctor.years_of_experience || 1} سنوات
                  </span>
                  <span className="text-muted-foreground text-sm">خبرة</span>
                </div>
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl border border-border">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground/80">
                    +{doctor.total_consultations || 0}
                  </span>
                  <span className="text-muted-foreground text-sm">استشارة</span>
                </div>
              </div>

              {/* Badges/Tags */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {doctor.languages?.map((lang) => (
                  <Badge
                    key={lang}
                    variant="outline"
                    className="bg-white border-border text-muted-foreground font-medium py-1.5 px-3"
                  >
                    <Languages className="w-3 md:w-4 h-3 md:h-4 ml-1.5" />
                    {lang === "ar"
                      ? "العربية"
                      : lang === "en"
                        ? "الإنجليزية"
                        : lang}
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  className={cn(
                    "py-1.5 px-3 font-medium border-transparent",
                    doctor.session_type === "video"
                      ? "bg-purple-50 text-purple-700"
                      : doctor.session_type === "offline"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-primary-50 text-primary-700",
                  )}
                >
                  {doctor.session_type === "video" && (
                    <>
                      <Video className="w-3.5 h-3.5 ml-1.5" /> استشارة فيديو
                    </>
                  )}
                  {doctor.session_type === "offline" && (
                    <>
                      <MapPin className="w-3.5 h-3.5 ml-1.5" /> زيارة عيادة
                    </>
                  )}
                  {doctor.session_type === "both" && (
                    <>
                      <Video className="w-3.5 h-3.5 ml-1.5" /> فيديو + عيادة
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <span className="text-muted-foreground font-medium text-sm">
                  سعر الكشف يبدأ من
                </span>
                <span className="text-3xl font-black text-foreground">
                  {doctor.consultation_price} جم
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Book Action */}
          <div className="hidden md:flex justify-end mt-8 border-t border-border pt-6">
            <div className="flex gap-4 w-full md:w-auto">
              <Button
                size="lg"
                className="flex-1 md:flex-none md:w-64 h-14 text-lg bg-primary hover:bg-primary-700 rounded-2xl shadow-xl shadow-primary/20 font-bold"
                onClick={() =>
                  navigate(`/patient/consultations/book/${doctor.id}`)
                }
              >
                <Calendar className="w-5 h-5 ml-2" />
                حجز موعد الآن
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: "about", label: "عن الطبيب", icon: User },
            { key: "schedule", label: "مواعيد العمل", icon: Clock },
            { key: "reviews", label: "تقييمات المرضى", icon: Star },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all duration-300",
                activeTab === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-muted-foreground hover:bg-muted border border-transparent hover:border-border",
              )}
            >
              <tab.icon
                className={cn(
                  "w-5 h-5",
                  activeTab === tab.key ? "text-white" : "text-muted-foreground",
                )}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 mb-24">
          {activeTab === "about" && (
            <div className="grid gap-6">
              {doctor.bio && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
                  <h3 className="font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    نبذة تعريفية
                  </h3>
                  <p className="text-muted-foreground leading-loose text-lg font-medium whitespace-pre-line">
                    {doctor.bio}
                  </p>
                </div>
              )}

              {doctor.clinic_address && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
                  <h3 className="font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    عنوان العيادة
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {doctor.clinic_address}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(doctor.clinic_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold hover:underline"
                  >
                    عرض على الخريطة <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Life Stages */}
              {doctor.life_stages && doctor.life_stages.length > 0 && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
                  <h3 className="font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-pink-500" />
                    </div>
                    مجالات التخصص الدقيقة (المراحل المدعومة)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.life_stages.map(stage => (
                      <Badge key={stage.id} variant="secondary" className="px-4 py-2 text-sm bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-xl cursor-default transition-colors">
                        {stage.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="grid gap-6">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
                <h3 className="font-bold text-xl text-foreground mb-6 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  ساعات العمل الأسبوعية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctor.working_hours?.map((wh, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col p-4 rounded-2xl border transition-all",
                        wh.start_times && wh.start_times.length > 0
                          ? "bg-primary-50/50 border-primary-100"
                          : "bg-muted border-border opacity-60",
                      )}
                    >
                      <span className="font-bold text-foreground/80 mb-2">
                        {wh.day_ar || daysTranslation[wh.day]}
                      </span>
                      {wh.start_times && wh.start_times.length > 0 ? (
                        <div className="flex flex-wrap gap-2 align-start">
                          {wh.start_times.map((startTime, idx) => {
                            const [h, m] = startTime.split(':').map(Number);
                            const total = h * 60 + m + 60;
                            const endStr = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                            return (
                              <button key={idx} onClick={() => navigate(`/patient/consultations/book/${doctor.id}?time=${startTime}`)} className="hover:bg-primary hover:text-white transition-colors text-primary-700 font-bold bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm text-xs" dir="ltr">
                                {startTime} - {endStr}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">
                          مغلق
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {doctor.next_available_slots &&
                doctor.next_available_slots.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
                    <h3 className="font-bold text-xl text-foreground mb-6 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      أقرب المواعيد المتاحة للحجز
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {doctor.next_available_slots
                        .slice(0, 10)
                        .map((slot, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              navigate(
                                `/patient/consultations/book/${doctor.id}?date=${slot.date}&time=${slot.time}`,
                              )
                            }
                            disabled={!slot.available}
                            className="group relative bg-white border border-border hover:border-primary hover:shadow-lg hover:shadow-primary-500/10 p-4 rounded-2xl text-center transition-all duration-300"
                          >
                            <div className="text-sm font-bold text-foreground group-hover:text-primary mb-1">
                              {slot.time}
                            </div>
                            {slot.date && (
                              <div className="text-xs font-medium text-muted-foreground group-hover:text-primary/80">
                                {new Date(slot.date).toLocaleDateString(
                                  "ar-EG",
                                  { day: "numeric", month: "short" },
                                )}
                              </div>
                            )}
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"></div>
                          </button>
                        ))}
                    </div>
                    <Button
                      variant="link"
                      onClick={() =>
                        navigate(`/patient/consultations/book/${doctor.id}`)
                      }
                      className="w-full mt-4 text-primary font-bold"
                    >
                      عرض كل المواعيد المتاحة
                    </Button>
                  </div>
                )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {doctor.reviews_summary && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
                  <div className="flex flex-col md:flex-row gap-8 items-center bg-yellow-50/50 p-6 rounded-[24px]">
                    {/* Large Rating */}
                    <div className="text-center md:border-l md:border-yellow-200/50 md:pl-8 md:ml-2">
                      <div className="text-6xl font-black text-foreground mb-2">
                        {doctor.reviews_summary.average_rating.toFixed(1)}
                      </div>
                      <div className="flex justify-center mb-2">
                        <RatingStars
                          rating={doctor.reviews_summary.average_rating}
                          size="lg"
                        />
                      </div>
                      <p className="text-muted-foreground font-medium text-sm">
                        بناءً على {doctor.reviews_summary.total_reviews} تقييم
                      </p>
                    </div>

                    {/* Bars */}
                    <div className="flex-1 w-full space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count =
                          doctor.reviews_summary[
                          `${rating}_star` as keyof typeof doctor.reviews_summary
                          ] || 0;
                        const percentage =
                          doctor.reviews_summary.total_reviews > 0
                            ? (Number(count) /
                              doctor.reviews_summary.total_reviews) *
                            100
                            : 0;

                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <span className="text-sm font-bold text-foreground/80 w-4 flex-shrink-0">
                              {rating}
                            </span>
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-left">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {loadingReviews ? (
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-3xl h-40 animate-pulse border border-border"
                    />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-border" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    لا توجد تقييمات حتى الآن
                  </h3>
                  <p className="text-muted-foreground">
                    كن أول من يقيم هذا الطبيب بعد حجز موعد
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Book Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-border md:hidden z-50">
        <Button
          onClick={() => navigate(`/patient/consultations/book/${doctor.id}`)}
          size="lg"
          className="w-full h-14 text-lg bg-primary hover:bg-primary-700 shadow-xl shadow-primary/20 font-bold rounded-2xl"
        >
          <Calendar className="w-5 h-5 ml-2" />
          احجز موعد - {doctor.consultation_price} جم
        </Button>
      </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default DoctorDetailsPage;
