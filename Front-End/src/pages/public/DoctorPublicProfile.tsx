import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
    Star, Clock, User, Calendar,
    CreditCard, ArrowLeft, ArrowRight,
    MapPin, GraduationCap, Briefcase,
    MessageSquare, BookOpen, CheckCircle2,
    Video, ExternalLink, ChevronLeft,
    ShieldCheck, Award, Sparkles
} from 'lucide-react';
import BackButton from "@/components/common/BackButton";
import landingService from '../../services/landingService';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import './DoctorPublicProfile.css';

interface DoctorData {
    id: number;
    name: string;
    title: string;
    specialization: string;
    specialization_ar: string;
    image_url: string | null;
    bio: string;
    qualifications: string;
    years_of_experience: number;
    rating: number;
    total_consultations: number;
    total_reviews: number;
    consultation_price: number;
    consultation_duration: number;
    is_available: boolean;
    life_stages: { id: number; name: string; name_ar: string; slug: string }[];
    working_hours: { day: string; day_ar: string; start_times: string[] }[];
}

interface Review {
    id: number;
    rating: number;
    comment: string;
    patient_name: string;
    date: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    image_url: string | null;
}

interface DoctorProfileData {
    doctor: DoctorData;
    reviews: Review[];
    articles: Article[];
    rating_breakdown: Record<string, number>;
    cta: { title: string; button_text: string; button_link: string; note: string };
}

const DoctorPublicProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<DoctorProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDoctor = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await landingService.getDoctorProfile(id);
                setData(response);
            } catch (err) {
                console.error('Error fetching doctor:', err);
                setError('حدث خطأ في تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
        window.scrollTo(0, 0);
    }, [id]);

    const renderStars = (rating: number, size = 16) => {
        return (
            <div className="flex gap-0.5" dir="ltr">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={i}
                        size={size}
                        className={cn(
                            i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-border fill-border"
                        )}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50" dir="rtl">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">جاري التحميل...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-4" dir="rtl">
                <Card className="p-8 rounded-[32px] shadow-2xl shadow-border border-none text-center max-w-md">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                        ⚠️
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-2">عذراً، حدث خطأ</h2>
                    <p className="text-muted-foreground font-bold mb-8 leading-relaxed">{error || 'لم نتمكن من العثور على بيانات هذا الطبيب حالياً.'}</p>
                    <Button asChild className="bg-foreground hover:bg-foreground rounded-2xl h-12 w-full font-black">
                        <Link to="/doctors">
                            <ArrowRight className="ml-2 w-4 h-4" />
                            العودة للأطباء
                        </Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const { doctor, reviews, articles, rating_breakdown, cta } = data;

    return (
        <div className="bg-muted/50 min-h-screen" dir="rtl">
            <Helmet>
                <title>{doctor.name} - {doctor.specialization_ar} | وداد</title>
                <meta name="description" content={doctor.bio?.slice(0, 155)} />
            </Helmet>

            <PublicHeader />

            {/* Compact Header Section */}
            <div className="relative bg-foreground pt-32 pb-40 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
                </div>

                <div className="container max-w-6xl mx-auto px-6 relative z-10">
                    <div className="mb-4 text-right">
                        <BackButton />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-4">
                        <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                        <ChevronLeft size={10} />
                        <Link to="/doctors" className="hover:text-primary transition-colors">الأطباء</Link>
                        <ChevronLeft size={10} />
                        <span className="text-white">{doctor.name}</span>
                    </div>
                </div>
            </div>

            <div className="container max-w-6xl mx-auto px-6 relative -mt-32 pb-24 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Sidebar: Mobile - Order 1, Desktop - Order 2 */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="overflow-hidden border-none shadow-2xl shadow-slate-900/10 rounded-[40px] bg-white p-6">
                                <div className="relative mb-6">
                                    <div className="w-full aspect-square rounded-[32px] overflow-hidden bg-muted shadow-inner group">
                                        {doctor.image_url ? (
                                            <img
                                                src={doctor.image_url}
                                                alt={doctor.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random&size=256`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-border">
                                                <User size={80} />
                                            </div>
                                        )}
                                    </div>
                                    {doctor.is_available && (
                                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-2xl text-[10px] font-black border border-emerald-100/50 shadow-sm backdrop-blur-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span>متاح للحجز</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center space-y-3 mb-8">
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black border border-border uppercase tracking-wider">
                                        <ShieldCheck size={12} className="text-primary" />
                                        طبيب معتمد
                                    </div>
                                    <h1 className="text-2xl font-black text-foreground leading-tight">
                                        {doctor.name}
                                    </h1>
                                    <p className="text-muted-foreground font-bold text-sm">
                                        {doctor.specialization_ar}
                                    </p>

                                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-muted">
                                        <div className="text-center">
                                            <div className="text-lg font-black text-foreground">{doctor.rating.toFixed(1)}</div>
                                            <div className="text-[8px] font-black text-border uppercase tracking-tighter">التقييم</div>
                                        </div>
                                        <div className="w-px h-8 bg-muted/50"></div>
                                        <div className="text-center">
                                            <div className="text-lg font-black text-foreground">{doctor.total_consultations}</div>
                                            <div className="text-[8px] font-black text-border uppercase tracking-tighter">استشارة</div>
                                        </div>
                                        <div className="w-px h-8 bg-muted/50"></div>
                                        <div className="text-center">
                                            <div className="text-lg font-black text-foreground">{doctor.years_of_experience}</div>
                                            <div className="text-[8px] font-black text-border uppercase tracking-tighter">سنة خبرة</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/80 border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                                <CreditCard size={14} />
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground">سعر الاستشارة</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-foreground">{doctor.consultation_price}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
                                        </div>
                                    </div>

                                    <Link
                                        to={cta?.button_link || `/patient/consultations/book/${doctor.id}`}
                                        className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary-600 text-white rounded-[24px] h-14 text-lg font-black shadow-xl shadow-primary/20 group scale-100 hover:scale-[1.02] transition-all"
                                    >
                                        احجزي موعدك الآن
                                        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                                    </Link>
                                    <p className="text-center text-[9px] text-muted-foreground leading-relaxed font-bold">
                                        سيتم نقلك إلى صفحة اختيار الموعد المتاح للطبيب
                                    </p>
                                </div>
                            </Card>
                        </motion.div>

                        <Card className="p-6 rounded-[40px] border-none shadow-xl shadow-border bg-white flex flex-col">
                            <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                مواعيد العمل
                            </h3>
                            <Link
                                to={`/patient/consultations/book/${doctor.id}`}
                                className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary-600 text-white rounded-2xl h-12 font-black shadow-lg shadow-primary/20 transition-all mb-6"
                            >
                                <Calendar className="ml-2 w-4 h-4" />
                                احجزي الموعد المناسب لكِ
                            </Link>
                            <div className="space-y-3">
                                {doctor.working_hours.map((wh, index) => (
                                    <div key={index} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-muted/50 border border-border">
                                        <span className="font-black text-xs text-foreground/80">{wh.day_ar}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {wh.start_times.map((startTime, idx) => {
                                                const [h, m] = startTime.split(':').map(Number);
                                                const total = h * 60 + m + 60;
                                                const endStr = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                                                return (
                                                    <Link key={idx} to={`/patient/consultations/book/${doctor.id}`} className="hover:bg-primary hover:text-white transition-colors text-[11px] font-black text-primary px-3 py-1 bg-white rounded-lg shadow-sm border border-border" dir="ltr">
                                                        {startTime} - {endStr}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Content Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Bio & Qualifications */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <Card className="p-8 md:p-10 rounded-[48px] border-none shadow-2xl shadow-border bg-white">
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Sparkles size={20} />
                                            </div>
                                            <h2 className="text-xl font-black text-foreground">نبذة عن الطبيب</h2>
                                        </div>
                                        <div className="text-muted-foreground leading-[1.8] text-sm md:text-base font-bold whitespace-pre-wrap">
                                            {doctor.bio || 'لم يتم إضافة نبذة تفصيلية بعد.'}
                                        </div>
                                    </div>

                                    {doctor.qualifications && (
                                        <div className="pt-10 border-t border-muted space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Award size={20} />
                                                </div>
                                                <h2 className="text-xl font-black text-foreground">المؤهلات العلمية</h2>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-muted/50 border border-border text-muted-foreground text-sm font-bold leading-relaxed">
                                                {doctor.qualifications}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-10 border-t border-muted space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <MapPin size={20} />
                                            </div>
                                            <h2 className="text-xl font-black text-foreground">نطاق التغطية والمراحل الحياتية</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {doctor.life_stages.map((stage) => (
                                                <Link
                                                    key={stage.id}
                                                    to={`/life-stages/${stage.slug}`}
                                                    className="px-5 py-2.5 rounded-2xl bg-white border border-border text-muted-foreground font-black text-xs hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-300 flex items-center gap-2 shadow-sm"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                    {stage.name_ar}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Stats & Reviews Section */}
                        {reviews.length > 0 && (
                            <section className="space-y-6">
                                {/* Section title */}
                                <div className="px-1 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                            <MessageSquare size={18} className="text-amber-500" />
                                        </div>
                                        تقييمات المريضات
                                    </h2>
                                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-black px-3 py-1.5 rounded-full">
                                        <Star size={11} className="fill-amber-500 text-amber-500" />
                                        {doctor.total_reviews} تقييم
                                    </span>
                                </div>

                                <Card className="p-8 md:p-10 rounded-[48px] border-none shadow-2xl shadow-border bg-white overflow-hidden">

                                    {/* Rating summary row */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch mb-10 pb-10 border-b border-muted">

                                        {/* Big rating number */}
                                        <div className="md:col-span-4 flex flex-col items-center justify-center gap-3 text-center">
                                            <div className="text-8xl font-black text-foreground leading-none tabular-nums">
                                                {doctor.rating.toFixed(1)}
                                            </div>
                                            <div className="flex justify-center gap-0.5" dir="ltr">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={22}
                                                        className={i < Math.round(doctor.rating)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'fill-muted text-muted'}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                                                المعدل الإجمالي
                                            </p>
                                        </div>

                                        {/* Divider — vertical on md */}
                                        <div className="hidden md:flex md:col-span-1 items-center justify-center">
                                            <div className="w-px h-full bg-muted" />
                                        </div>

                                        {/* Breakdown bars */}
                                        <div className="md:col-span-7 flex flex-col justify-center space-y-3">
                                            {([5, 4, 3, 2, 1] as const).map((star) => {
                                                const pct = rating_breakdown[String(star)] ?? 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        {/* Star label */}
                                                        <div className="flex items-center gap-1 w-10 shrink-0 justify-end">
                                                            <span className="text-sm font-black text-foreground tabular-nums">{star}</span>
                                                            <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                                                        </div>
                                                        {/* Bar */}
                                                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                                            <motion.div
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    star === 5 ? "bg-amber-400" :
                                                                        star === 4 ? "bg-amber-300" :
                                                                            star === 3 ? "bg-yellow-300" :
                                                                                star === 2 ? "bg-orange-300" :
                                                                                    "bg-red-300"
                                                                )}
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: `${pct}%` }}
                                                                viewport={{ once: true }}
                                                                transition={{ duration: 0.9, ease: "easeOut", delay: (5 - star) * 0.05 }}
                                                            />
                                                        </div>
                                                        {/* Percentage */}
                                                        <span className="w-10 text-sm font-black text-foreground tabular-nums shrink-0">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Review cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                className="p-6 rounded-[28px] bg-muted/40 border border-border/60 hover:bg-white hover:shadow-xl hover:shadow-border/40 hover:border-amber-100 transition-all duration-500 group"
                                            >
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 flex items-center justify-center text-xl shadow-sm shrink-0">
                                                            👩
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-foreground leading-tight">
                                                                {review.patient_name}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground font-bold mt-0.5">
                                                                {review.date}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Stars badge */}
                                                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl">
                                                        <span className="text-sm font-black text-amber-700 tabular-nums">{review.rating}</span>
                                                        <Star size={12} className="fill-amber-500 text-amber-500" />
                                                    </div>
                                                </div>

                                                {/* Mini star row */}
                                                <div className="flex gap-0.5 mb-3" dir="ltr">
                                                    {Array.from({ length: 5 }, (_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={13}
                                                            className={i < review.rating
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'fill-border text-border'}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Comment */}
                                                {review.comment ? (
                                                    <p className="text-muted-foreground leading-relaxed text-sm font-bold italic border-r-2 border-amber-200 pr-3">
                                                        "{review.comment}"
                                                    </p>
                                                ) : (
                                                    <p className="text-muted-foreground/50 text-xs font-bold italic">
                                                        لم يترك المريض تعليقاً
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </section>
                        )}

                        {/* Articles Section */}
                        {articles.length > 0 && (
                            <section className="space-y-6">
                                <div className="px-4 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                                        <BookOpen size={20} className="text-primary" />
                                        مقالات طبية
                                    </h2>
                                    <Link to="/articles" className="text-primary font-black text-xs hover:underline flex items-center gap-1">
                                        عرض الكل
                                        <ChevronLeft size={14} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {articles.map((article) => (
                                        <Link key={article.id} to={`/articles/${article.slug}`} className="group">
                                            <Card className="overflow-hidden border-none shadow-xl shadow-border rounded-[32px] bg-white h-full hover:shadow-2xl transition-all duration-500 flex flex-col">
                                                <div className="h-40 overflow-hidden relative">
                                                    {article.image_url ? (
                                                        <img
                                                            src={article.image_url}
                                                            alt={article.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-muted flex items-center justify-center text-border">
                                                            <BookOpen size={40} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="text-sm font-black text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-4">
                                                        {article.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                        مقال طبي
                                                        <div className="w-1 h-1 rounded-full bg-border"></div>
                                                        <Clock size={10} />
                                                        <span>5 دقائق قراءة</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <PublicFooter />
        </div>
    );
};

export default DoctorPublicProfile;

