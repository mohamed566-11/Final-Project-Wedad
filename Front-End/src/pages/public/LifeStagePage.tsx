import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    Check,
    Star,
    Clock,
    ArrowLeft,
    ChevronLeft,
    Heart,
    Link as LinkIcon,
    Baby,
    Sparkles,
    ShieldCheck,
    Users,
    Zap,
    ExternalLink,
    Award,
    BookOpen,
    User,
    Loader2,
    Stethoscope,
    Activity,
    Calendar,
    Briefcase,
    CreditCard,
    CheckCircle2
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import publicService, { LifeStage } from '../../services/publicService';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import BackButton from '@/components/common/BackButton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';



const LifeStagePage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, userType } = useAuth();
    const isLoggedIn = !!user && userType === 'patient';
    const [stage, setStage] = useState<LifeStage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Theme Configuration based on slug
    const getTheme = (slug: string) => {
        switch (slug) {
            case 'pre-marriage':
                return {
                    id: 'pre-marriage',
                    primary: 'emerald',
                    accent: 'teal',
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                    badge: 'bg-emerald-100/50 text-emerald-700',
                    button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
                    icon: <Heart className="w-10 h-10" />,
                    gradient: 'from-emerald-50/50 via-white to-white',
                    cardIcon: <Sparkles className="w-6 h-6 text-emerald-500" />
                };
            case 'married-life':
                return {
                    id: 'married-life',
                    primary: 'blue',
                    accent: 'cyan',
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    badge: 'bg-blue-100/50 text-blue-700',
                    button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
                    icon: <Zap className="w-10 h-10" />,
                    gradient: 'from-blue-50/50 via-white to-white',
                    cardIcon: <Heart className="w-6 h-6 text-blue-500" />
                };
            case 'motherhood':
                return {
                    id: 'motherhood',
                    primary: 'rose',
                    accent: 'pink',
                    color: 'text-rose-600',
                    bg: 'bg-rose-50',
                    border: 'border-rose-100',
                    badge: 'bg-rose-100/50 text-rose-700',
                    button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
                    icon: <Baby className="w-10 h-10" />,
                    gradient: 'from-rose-50/50 via-white to-white',
                    cardIcon: <Baby className="w-6 h-6 text-rose-500" />
                };
            default:
                return {
                    id: 'default',
                    primary: 'emerald',
                    accent: 'teal',
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                    badge: 'bg-emerald-100/50 text-emerald-700',
                    button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
                    icon: <Star className="w-10 h-10" />,
                    gradient: 'from-emerald-50/50 via-white to-white',
                    cardIcon: <Check className="w-6 h-6 text-emerald-500" />
                };
        }
    };

    const theme = getTheme(slug || '');

    useEffect(() => {
        const fetchStage = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const response = await publicService.getLifeStage(slug);
                setStage(response.data.data.life_stage);
            } catch (err) {
                setError('حدث خطأ في تحميل البيانات');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStage();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <PublicHeader />
                <div className="flex-grow flex flex-col justify-center items-center">
                    <div className="relative">
                        <Loader2 className={`w-16 h-16 animate-spin ${theme.color} opacity-20`} />
                        <Loader2 className={`w-16 h-16 animate-spin ${theme.color} absolute inset-0 [animation-delay:-0.3s]`} />
                    </div>
                </div>
                <PublicFooter />
            </div>
        );
    }

    if (error || !stage) {
        return (
            <div className="min-h-screen bg-muted flex flex-col">
                <PublicHeader />
                <div className="flex-grow flex flex-col justify-center items-center text-center px-4">
                    <ShieldCheck className="w-16 h-16 text-red-500 mb-6" />
                    <h2 className="text-3xl font-black text-foreground mb-4">{error || 'الصفحة غير موجودة'}</h2>
                    <Link to="/" className={`px-8 py-3 rounded-full text-white font-bold transition-all ${theme.button}`}>
                        العودة للرئيسية
                    </Link>
                </div>
                <PublicFooter />
            </div>
        );
    }

    const displayFeatures = stage.features ?? [];
    const displayArticles = (stage.related_articles ?? []).slice(0, 3);
    const displayDoctors = stage.available_doctors ?? [];

    return (
        <div className="min-h-screen bg-white font-sans text-foreground flex flex-col selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
            <Helmet>
                <title>{stage.name_ar} | منصة وداد الصحية</title>
                <meta name="description" content={stage.description} />
            </Helmet>

            <PublicHeader />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className={cn("relative pt-32 pb-16 px-4 overflow-hidden bg-gradient-to-b", theme.gradient)}>
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className={cn("absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-20", theme.bg)}></div>
                        <div className={cn("absolute top-1/2 -left-24 w-72 h-72 rounded-full blur-[100px] opacity-10", theme.bg)}></div>
                    </div>

                    <div className="container mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                            <div className="mb-4 w-full text-right">
                                <BackButton />
                            </div>
                            <Breadcrumbs
                                items={[
                                    { label: 'المراحل الحياتية', path: '/life-stages' },
                                    { label: stage.name_ar }
                                ]}
                            />

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl bg-white border border-white relative group", theme.border)}
                            >
                                <div className={cn("absolute inset-2 rounded-[28px] opacity-10 group-hover:opacity-20 transition-opacity", theme.bg)}></div>
                                <div className={theme.color}>{theme.icon}</div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-muted">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </div>
                            </motion.div>

                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight tracking-tight"
                            >
                                {stage.name_ar}
                            </motion.h1>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium max-w-xl"
                            >
                                {stage.description}
                            </motion.p>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-10 flex flex-wrap justify-center gap-4"
                            >
                                {isLoggedIn ? (
                                    <Link to="/patient/dashboard" className={cn("px-8 py-3 rounded-lg text-white font-black text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl", theme.button)}>
                                        لوحة التحكم
                                        <ArrowLeft className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <Link to="/register" className={cn("px-8 py-3 rounded-lg text-white font-black text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl", theme.button)}>
                                        ابدئي الآن
                                        <ArrowLeft className="w-4 h-4" />
                                    </Link>
                                )}
                                <Link to="/doctors" className="px-8 py-3 rounded-lg bg-white text-foreground font-black text-base border-2 border-border hover:border-primary-200 transition-all shadow-sm hover:shadow-xl active:scale-95">
                                    تحدثي مع طبيب
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Offerings Grid - REVOLUTIONIZED DESIGN */}
                <section className="py-16 px-4 bg-white relative">
                    <div className="container mx-auto">
                        <div className="flex flex-col items-center text-center mb-12">
                            <span className={cn("inline-block py-1 px-4 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border", theme.badge, theme.border)}>
                                الرحلة العلاجية
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4 tracking-tight">ماذا نقدم لكِ في هذه المرحلة؟</h2>
                            <p className="text-muted-foreground text-base font-medium max-w-2xl">خدمات طبية وتوعوية عالية المستوى تم تصميمها بأيدي خبراء لتناسب خصوصية رحلتك.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                            {displayFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ y: 40, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative h-full"
                                >
                                    <div className="absolute inset-0 bg-muted rounded-[48px] group-hover:bg-white transition-all duration-500 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] group-hover:scale-[1.05] border border-transparent group-hover:border-primary-50"></div>
                                    <div className="relative p-10 flex flex-col h-full z-10">
                                        <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-inner", theme.bg)}>
                                            <div className={theme.color}>
                                                {index === 0 ? <Stethoscope className="w-10 h-10" /> :
                                                    index === 1 ? <Activity className="w-10 h-10" /> :
                                                        index === 2 ? <Award className="w-10 h-10" /> :
                                                            <Users className="w-10 h-10" />}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-foreground mb-6 leading-tight group-hover:text-primary transition-colors">
                                            {feature}
                                        </h3>

                                        <p className="text-muted-foreground leading-relaxed font-medium mb-10 flex-grow group-hover:text-muted-foreground transition-colors">
                                            نقدم لكِ الرعاية الكاملة من خلال برامج متخصصة تضمن لكِ تجربة صحية آمنة ومريحة.
                                        </p>

                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            <ArrowLeft className="w-6 h-6" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Intelligent Tools Section */}
                {stage.tools && stage.tools.length > 0 && (
                    <section className="py-12 px-4 bg-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/5 to-transparent pointer-events-none"></div>
                        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                        <div className="container mx-auto relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 text-center md:text-right">
                                <div className="max-w-xl">
                                    <span className="text-primary-400 font-black uppercase tracking-widest text-[9px] mb-3 inline-block">الأدوات الرقمية المعتمدة</span>
                                    <h2 className="text-xl md:text-3xl font-black text-white mb-4 tracking-tight">صحّتك، بإدارة ذكية من قبلك</h2>
                                    <p className="text-muted-foreground text-base font-medium leading-relaxed">اكتشفي أدواتنا المتطورة التي تساعدك على مراقبة مؤشراتك الحيوية وتنظيم رحلتك الصحية بدقة متناهية.</p>
                                </div>
                                <div className="p-1.5 bg-foreground rounded-2xl border border-foreground shadow-2xl flex gap-1">
                                    <div className="w-16 h-16 rounded-xl bg-foreground/50 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-primary-400" />
                                    </div>
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Activity className="w-8 h-8 text-primary" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {stage.tools.map((tool, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group bg-foreground/40 backdrop-blur-3xl rounded-[40px] p-8 border border-foreground/50 hover:border-primary/40 transition-all duration-700 flex flex-col h-full hover:shadow-[0_20px_60px_-10px_rgba(20,184,166,0.15)]"
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-16 h-16 rounded-[24px] bg-foreground border-2 border-foreground flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                                {tool.icon}
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-primary/20">
                                                <ExternalLink className="w-5 h-5 text-primary-400" />
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-white mb-4 group-hover:text-primary-400 transition-colors">
                                            {tool.title}
                                        </h3>

                                        <p className="text-muted-foreground leading-relaxed text-base mb-8 flex-grow font-medium">
                                            {tool.description}
                                        </p>

                                        <Link
                                            to={tool.url}
                                            className="inline-flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-primary text-white font-black text-lg transition-all hover:bg-primary hover:scale-[1.03] active:scale-95 shadow-2xl shadow-primary-900/40"
                                        >
                                            جربي الأداة الآن
                                            <ArrowLeft className="w-5 h-5" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Articles Section - PREMIUM CARD DESIGN */}
                <section className="py-16 px-4 bg-white relative">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                            <div className="max-w-2xl">
                                <span className={cn("inline-block py-1.5 px-5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border shadow-sm", theme.badge, theme.border)}>
                                    المعرفة هي القوة
                                </span>
                                <h2 className="text-xl md:text-3xl font-black text-foreground mb-4 tracking-tight leading-tight">مقالات مختارة لرفع مستوى وعيك الصحي</h2>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">استكشفي أحدث النصائح العلمية والمقالات الموثوقة التي تم إعدادها خصيصاً لمرحلتك الحالية.</p>
                            </div>
                            <Link to="/articles" className={cn("group flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted text-base font-black transition-all hover:bg-primary hover:text-white mb-4 shadow-sm", theme.color.replace('text-', 'hover:text-').replace('text-', 'text-'))}>
                                كافة المقالات
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {displayArticles.length === 0 ? (
                                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                                    <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-4", theme.bg)}>
                                        <BookOpen className={cn("w-8 h-8", theme.color)} />
                                    </div>
                                    <h3 className="font-black text-foreground text-xl mb-2">لا توجد مقالات بعد</h3>
                                    <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                                        سيتم إضافة مقالات متخصصة لهذه المرحلة قريباً. يمكنك الاطلاع على جميع المقالات الآن.
                                    </p>
                                    <Link to="/articles" className={cn("px-6 py-3 rounded-xl text-white font-bold text-sm", theme.button)}>
                                        تصفحي كل المقالات
                                    </Link>
                                </div>
                            ) : (
                                displayArticles.map((article, index) => (
                                    <Link to={`/articles/${article.slug || article.id}`} key={article.id} className="group h-full">
                                        <article className="bg-white rounded-[40px] overflow-hidden border border-border group-hover:border-primary-50 shadow-sm group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] transition-all duration-700 flex flex-col h-full transform group-hover:-translate-y-3">
                                            <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                                                {article.image_url && !article.image_url.includes('default-aericle.png') && !article.image_url.includes('default-article.png') ? (
                                                    <img
                                                        src={article.image_url}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-primary-50/20">
                                                        <BookOpen className="w-12 h-12 mb-3 text-primary opacity-20" />
                                                        <Sparkles className="w-6 h-6 text-primary-300 opacity-30" />
                                                    </div>
                                                )}
                                                <div className="absolute top-6 right-6">
                                                    <div className="bg-white/95 backdrop-blur-xl px-4 py-2 rounded-xl text-[9px] font-black text-foreground shadow-xl border border-white/50 flex items-center gap-2 uppercase tracking-widest">
                                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                                        {article.reading_time} دقائق
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 flex-grow flex flex-col">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shadow-sm" />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground pt-0.5">مراجعة من قبل الخبراء</span>
                                                </div>

                                                <h3 className="text-xl font-black text-foreground mb-4 group-hover:text-primary transition-colors leading-[1.3] line-clamp-2">
                                                    {article.title}
                                                </h3>

                                                <p className="text-muted-foreground text-sm mb-8 line-clamp-3 leading-relaxed flex-grow font-medium">
                                                    {article.excerpt}
                                                </p>

                                                <div className="flex items-center justify-between pt-8 border-t border-muted mt-auto">
                                                    <span className="text-base font-black text-foreground flex items-center gap-3 group-hover:text-primary transition-colors">
                                                        اقرئي الآن
                                                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                                    </span>
                                                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary-50 transition-colors shadow-inner">
                                                        <Sparkles className="w-5 h-5 text-primary opacity-10 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                )))}
                        </div>
                    </div>
                </section>

                {/* Consultants Section - REIMAGINED */}
                <section className={cn("py-16 px-4 relative overflow-hidden", theme.bg, "bg-opacity-10")}>
                    <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white to-transparent"></div>

                    <div className="container mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center mb-16">
                            <span className={cn("inline-block py-1.5 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border shadow-sm", theme.badge, theme.border)}>
                                الشركاء في صحتك
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4 tracking-tight">استشاريون معتمدون لخدمتك</h2>
                            <p className="text-base text-muted-foreground font-medium max-w-2xl leading-relaxed">نخبة مختارة بعناية من أفضل الكوادر الطبية المتخصصة لضمان حصولك على أدق الاستشارات.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayDoctors.length === 0 ? (
                                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                                    <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-4", theme.bg)}>
                                        <Stethoscope className={cn("w-8 h-8", theme.color)} />
                                    </div>
                                    <h3 className="font-black text-foreground text-xl mb-2">جارٍ إضافة الاستشاريين</h3>
                                    <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                                        سيتوفر أطباء متخصصون في هذه المرحلة قريباً. يمكنك الاطلاع على قائمة أطبائنا الآن.
                                    </p>
                                    <Link to="/doctors" className={cn("px-6 py-3 rounded-xl text-white font-bold text-sm", theme.button)}>
                                        استعرضي كل الأطباء
                                    </Link>
                                </div>
                            ) : (
                                displayDoctors.map((doctor, index) => (
                                    <motion.div
                                        key={doctor.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group h-full"
                                    >
                                        <div className="relative bg-white rounded-[32px] overflow-hidden border border-border/50 hover:border-primary-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full">
                                            {/* Header Pattern */}
                                            <div className={cn("h-24 relative overflow-hidden", theme.bg)}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"></div>
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]"></div>
                                                {/* Availability Badge */}
                                                {'is_available' in doctor && (
                                                    <div className="absolute top-4 right-4 z-10">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border shadow-sm backdrop-blur-md",
                                                            doctor.is_available
                                                                ? "bg-emerald-50/90 text-emerald-700 border-emerald-200/50"
                                                                : "bg-slate-50/90 text-slate-500 border-slate-200/50"
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", doctor.is_available ? "bg-emerald-500 animate-pulse" : "bg-slate-400")}></div>
                                                            {doctor.is_available ? 'متاحة الآن' : 'غير متاحة'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Avatar */}
                                            <div className="flex justify-center -mt-14 relative z-10 px-6">
                                                <div className={cn("w-28 h-28 rounded-[28px] overflow-hidden border-[5px] border-white shadow-xl transition-all group-hover:scale-105 group-hover:shadow-2xl duration-500", theme.bg)}>
                                                    {doctor.image_url && !doctor.image_url.includes('default-doctor.png') ? (
                                                        <img src={doctor.image_url} alt={doctor.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br", theme.bg)}>
                                                            <span className={cn("text-3xl font-black", theme.color)}>{doctor.name.charAt(0)}</span>
                                                            <User className={cn("w-5 h-5 mt-0.5 opacity-20", theme.color)} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="px-6 pt-5 pb-6 flex flex-col flex-grow text-center">
                                                {/* Verified Badge */}
                                                <div className="flex justify-center mb-2">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-100/50">
                                                        <CheckCircle2 className="w-3 h-3 fill-emerald-600 text-white" />
                                                        طبيب معتمد
                                                    </span>
                                                </div>

                                                <h4 className="font-black text-foreground text-xl mb-1.5 leading-tight tracking-tight group-hover:text-primary transition-colors">{doctor.name}</h4>
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mx-auto mb-4", theme.badge)}>{doctor.specialization_ar}</p>

                                                {/* Rating */}
                                                <div className="flex items-center justify-center gap-2 mb-5">
                                                    <div className="flex items-center gap-1 bg-slate-900 text-white pl-3 pr-2.5 py-1.5 rounded-xl shadow-lg">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                        <span className="text-sm font-black">{doctor.rating.toFixed(1)}</span>
                                                    </div>
                                                    {'total_consultations' in doctor && (
                                                        <span className="text-[10px] font-bold text-muted-foreground">({doctor.total_consultations} استشارة)</span>
                                                    )}
                                                </div>

                                                {/* Stats Grid */}
                                                {'years_of_experience' in doctor && (
                                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50">
                                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                                                                <Briefcase className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-black text-foreground leading-none">{doctor.years_of_experience}</div>
                                                                <div className="text-[9px] font-bold text-muted-foreground">سنة خبرة</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50">
                                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                                                                <Clock className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-black text-foreground leading-none">{doctor.total_consultations}</div>
                                                                <div className="text-[9px] font-bold text-muted-foreground">استشارة</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Price + Booking */}
                                                <div className="mt-auto space-y-3">
                                                    {'consultation_price' in doctor && doctor.consultation_price > 0 && (
                                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                                                    <CreditCard className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-muted-foreground">سعر الاستشارة</span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-lg font-black text-foreground">{doctor.consultation_price}</span>
                                                                <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => navigate(`/patient/consultations/book/${doctor.id}`)}
                                                        className={cn("w-full inline-flex items-center justify-center gap-3 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-[1.02] active:scale-95 shadow-xl group/btn", theme.button)}
                                                    >
                                                        حجز استشارة
                                                        <ArrowLeft className="w-5 h-5 group-hover/btn:-translate-x-2 transition-transform" />
                                                    </button>
                                                    <Link
                                                        to={`/doctors/${doctor.id}`}
                                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-muted-foreground font-black text-xs hover:bg-muted hover:border-primary-100 transition-all"
                                                    >
                                                        الملف الطبي الكامل
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )))}
                        </div>

                        <div className="flex justify-center mt-14">
                            <Link to="/doctors" className={cn("inline-flex items-center gap-4 px-12 py-5 rounded-[24px] border-2 font-black text-xl transition-all shadow-xl hover:shadow-2xl active:scale-95", theme.border, theme.color, "bg-white hover:bg-primary hover:text-white hover:border-primary")}>
                                استعرضي كافة المختصين
                                <ChevronLeft className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Final Master CTA - Hidden for logged-in users */}
                {!isLoggedIn && (
                    <section className="py-12 px-4 relative overflow-hidden bg-white">
                        <div className="container mx-auto">
                            <div className={cn("relative rounded-[32px] p-10 md:p-14 overflow-hidden text-center", theme.bg)}>
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-white rounded-full blur-[150px] opacity-30"></div>
                                    <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-white rounded-full blur-[150px] opacity-30"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/patterns/circuit.png')] opacity-5"></div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="relative z-10"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mx-auto mb-8 text-2xl border border-muted">
                                        <Zap className={theme.color} />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground mb-4 tracking-tight leading-tight max-w-2xl mx-auto">
                                        رحلتك الصحية تبدأ بلمسة واحدة
                                    </h2>
                                    <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-lg mx-auto font-medium leading-relaxed">
                                        انضمي إلى آلاف النساء اللواتي اخترن منصة وداد كشريك موثوق في رحلتهن نحو حياة أكثر صحة وسعادة.
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        <Link
                                            to="/register"
                                            className={cn("px-8 py-4 rounded-xl text-white font-black text-lg shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group w-full sm:w-auto", theme.button)}
                                        >
                                            انضمي الآن مجاناً
                                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                        </Link>
                                        <Link
                                            to="/contact"
                                            className="px-8 py-4 rounded-xl bg-white text-foreground font-black text-lg border-2 border-border hover:border-primary-200 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto"
                                        >
                                            تحدثي معنا
                                            <Users className="w-5 h-5 opacity-20" />
                                        </Link>
                                    </div>

                                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 grayscale opacity-40 scale-90">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                                            <span className="font-black uppercase tracking-widest text-[11px]">أمان تام</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-8 h-8 text-muted-foreground" />
                                            <span className="font-black uppercase tracking-widest text-[11px]">جودة عالية</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Award className="w-8 h-8 text-muted-foreground" />
                                            <span className="font-black uppercase tracking-widest text-[11px]">مختصون معتمدون</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <PublicFooter />
        </div>
    );
};

export default LifeStagePage;
