import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Stethoscope,
    Coins,
    Clock,
    ShieldCheck,
    Calendar,
    TrendingUp,
    CheckCircle2,
    ArrowLeft,
    Sparkles,
    Users,
    ArrowRight,
    Lock,
    CreditCard,
    FileText,
    Mail,
    Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { publicService, JoinFormData } from '../../services/publicService';
import BackButton from '@/components/common/BackButton';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { cn } from '@/lib/utils';
import './PublicPages.css';

const SPECIALTIES = [
    { value: 'gynecology', label: 'أمراض نساء وتوليد' },
    { value: 'obstetrics', label: 'توليد' },
    { value: 'fertility', label: 'علاج العقم' },
    { value: 'endocrinology', label: 'غدد صماء' },
    { value: 'general_practitioner', label: 'ممارس عام' },
    { value: 'pediatrics', label: 'أطفال' },
    { value: 'nutrition', label: 'تغذية' },
    { value: 'other', label: 'تخصص آخر' },
];

const BENEFITS = [
    {
        icon: <Coins className="w-5 h-5" />,
        title: 'دخل إضافي مجزي',
        description: 'احصلي على دخل إضافي من خلال تقديم استشارات مرنة عن بُعد.',
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    },
    {
        icon: <Clock className="w-5 h-5" />,
        title: 'مرونة تامة',
        description: 'حددي ساعات عملك بما يناسب جدولك الخاص والتزاماتك الأخرى.',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        icon: <ShieldCheck className="w-5 h-5" />,
        title: 'أمان وخصوصية',
        description: 'أعلى معايير الأمان لحماية بياناتك وبيانات مراجعاتك.',
        color: 'text-primary',
        bg: 'bg-primary-50'
    },
    {
        icon: <Calendar className="w-5 h-5" />,
        title: 'إدارة ذكية',
        description: 'نظام متكامل لإدارة الحجوزات، المواعيد، والسجلات الطبية.',
        color: 'text-rose-600',
        bg: 'bg-rose-50'
    },
    {
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'نمو مهني',
        description: 'وسعي قاعدة مراجعاتك واصنعي اسماً قوياً في الرعاية الصحية الرقمية.',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
    },
    {
        icon: <Users className="w-5 h-5" />,
        title: 'مجتمع متميز',
        description: 'انضمي لنخبة من أفضل الطبيبات والأخصائيات في الوطن العربي.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
];

const STEPS = [
    { title: 'تقديم الطلب', description: 'املئي نموذج الانضمام الأولي ببياناتك.' },
    { title: 'المراجعة', description: 'سيقوم فريقنا بمراجعة طلبك وتفعيل حسابك.' },
    { title: 'التوثيق', description: 'إرسال الشهادات والمستندات من داخل لوحة التحكم.' },
    { title: 'الانطلاق', description: 'بدء استقبال المراجعات وتقديم الاستشارات.' },
];

const JoinAsDoctor = () => {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<JoinFormData>({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: '',
        consultation_price: ''
    });

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
        if (!formData.email.trim()) {
            errors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'البريد الإلكتروني غير صحيح';
        }
        if (!formData.phone.trim()) {
            errors.phone = 'رقم الهاتف مطلوب';
        } else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
            errors.phone = 'رقم الهاتف غير صحيح';
        }
        if (!formData.specialty) errors.specialty = 'التخصص مطلوب';
        if (!formData.license_number.trim()) errors.license_number = 'رقم الترخيص مطلوب';
        if (!formData.consultation_price.trim()) errors.consultation_price = 'سعر الاستشارة مطلوب';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            setSubmitting(true);
            setError(null);
            await publicService.submitJoinRequest(formData);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="min-h-screen bg-white font-sans text-foreground selection:bg-primary-100 selection:text-primary-900" dir="rtl">
            <Helmet>
                <title>انضم/ي كطبيب/ة | منصة وداد الصحية</title>
                <meta name="description" content="انضمي لفريق أطباء منصة وداد الصحية وابدئي تقديم الاستشارات الطبية عن بُعد" />
            </Helmet>

            <PublicHeader />

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 pb-16 px-4 overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-50 rounded-full blur-[100px] opacity-30"></div>
                    </div>

                    <div className="container mx-auto relative z-10 text-center">
                        <div className="mb-4 text-right">
                            <BackButton />
                        </div>
                        <Breadcrumbs items={[{ label: 'شريك النجاح' }]} />

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight tracking-tighter"
                        >
                            انطلقي بممارستك الطبية <br />
                            <span className="text-primary">نحو المستقبل الرقمي</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-base text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed"
                        >
                            انضمي إلى أكبر شبكة طبية متخصصة في صحة المرأة العربية، وقدمي خدماتك لآلاف المراجعات اللواتي يبحثن عن خبرتك.
                        </motion.p>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section className="py-16 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4 underline decoration-primary-100/30 italic">لماذا وداد؟</h2>
                            <p className="text-base text-muted-foreground font-medium">نحن لا نقدم مجرد منصة، بل نبني لكِ بيئة عمل احترافية متكاملة.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {BENEFITS.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-6 rounded-[32px] border border-border hover:border-primary-200 hover:shadow-lg transition-all duration-500 group"
                                >
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner", benefit.bg, benefit.color)}>
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-3">{benefit.title}</h3>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{benefit.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integration Form & Workflow */}
                <section className="py-20 px-4">
                    <div className="container mx-auto max-w-6xl">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            {/* Left: Steps Timeline */}
                            <div className="lg:col-span-5 pt-8">
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-4 block">رحلة الانضمام</span>
                                <h2 className="text-2xl md:text-4xl font-black text-foreground mb-8 leading-tight">بساطة في الخطوات، <br /> دقة في التنفيذ</h2>

                                <div className="space-y-8 relative before:absolute before:right-5 before:top-2 before:bottom-2 before:w-px before:bg-muted/50">
                                    {STEPS.map((step, index) => (
                                        <div key={index} className="relative pr-14 group">
                                            <div className="absolute right-0 top-0 w-10 min-w-[40px] h-10 rounded-xl bg-white border border-border flex items-center justify-center text-base font-black text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all z-10">
                                                {index + 1}
                                            </div>
                                            <h4 className="text-lg font-black text-foreground mb-1">{step.title}</h4>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Modern Form Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="lg:col-span-7 bg-white rounded-[40px] p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.06)] border border-muted relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[80px] pointer-events-none opacity-40"></div>

                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-12"
                                        >
                                            <div className="w-16 h-16 bg-primary-100 rounded-[22px] flex items-center justify-center mb-6 mx-auto text-primary shadow-inner">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">تم إنشاء حسابك بنجاح!</h3>
                                            <p className="text-base text-muted-foreground font-medium mb-8 max-w-xs mx-auto">سيقوم فريقنا بمراجعة الترخيص الطبي وتفعيل حسابك خلال 48 ساعة. ستصلك رسالة تأكيد فور التفعيل.</p>
                                            <Link to="/" className="inline-flex px-8 py-3.5 rounded-xl bg-foreground text-white font-black text-base shadow-xl hover:bg-primary transition-all items-center gap-3 mx-auto">
                                                العودة للرئيسية
                                                <ArrowLeft className="w-4 h-4" />
                                            </Link>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="form">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center text-white shadow-lg">
                                                    <Stethoscope className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-foreground tracking-tight">سجل/ي كطبيب/ة</h2>
                                                    <p className="text-sm text-muted-foreground font-medium">ابدئي رحلتك المهنية الرقمية معنا اليوم.</p>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold mb-6 border border-red-100 text-xs">
                                                    {error}
                                                </div>
                                            )}

                                            <form onSubmit={handleSubmit} className="space-y-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <Users className="w-3 h-3" /> الاسم الكامل
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleChange}
                                                            placeholder="د. سارة المنصور"
                                                            className={cn("w-full px-5 py-3 rounded-2xl bg-muted border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-sm", formErrors.name && "border-red-100 bg-red-50/30")}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> البريد الإلكتروني
                                                        </label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            placeholder="sara@example.com"
                                                            className={cn("w-full px-5 py-3 rounded-2xl bg-muted border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-sm", formErrors.email && "border-red-100 bg-red-50/30")}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> رقم الهاتف
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleChange}
                                                            placeholder="01xxxxxxxxx"
                                                            className={cn("w-full px-5 py-3 rounded-2xl bg-muted border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-sm", formErrors.phone && "border-red-100 bg-red-50/30")}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <FileText className="w-3 h-3" /> رقم ترخيص المزاولة
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="license_number"
                                                            value={formData.license_number}
                                                            onChange={handleChange}
                                                            placeholder="LICENSE-12345"
                                                            className={cn("w-full px-5 py-3 rounded-2xl bg-muted border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-sm", formErrors.license_number && "border-red-100 bg-red-50/30")}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <CreditCard className="w-3 h-3" /> سعر الاستشارة (EGP)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="consultation_price"
                                                            value={formData.consultation_price}
                                                            onChange={handleChange}
                                                            placeholder="300"
                                                            className={cn("w-full px-5 py-3 rounded-2xl bg-muted border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-sm", formErrors.consultation_price && "border-red-100 bg-red-50/30")}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <Stethoscope className="w-3 h-3" /> التخصص الطبي
                                                        </label>
                                                        <select
                                                            name="specialty"
                                                            value={formData.specialty}
                                                            onChange={handleChange}
                                                            className={cn("w-full px-5 py-3 rounded-2xl bg-muted border border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-sm appearance-none cursor-pointer", formErrors.specialty && "border-red-100 bg-red-50/30")}
                                                        >
                                                            <option value="">اختر التخصص...</option>
                                                            {SPECIALTIES.map(spec => (
                                                                <option key={spec.value} value={spec.value}>{spec.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="w-full py-4 rounded-2xl bg-foreground text-white font-black text-lg shadow-xl transition-all hover:bg-primary hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-3 group"
                                                >
                                                    {submitting ? 'جاري إنشاء الحساب...' : (
                                                        <>
                                                            إنشاء حساب طبيبة
                                                            <ArrowRight className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-[9px] text-muted-foreground text-center px-4">
                                                    بالنقر على إنشاء حساب، فإنكِ توافقين على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة وداد.
                                                </p>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Testimonial Quote */}
                <section className="py-16 px-4 bg-white border-t border-muted">
                    <div className="container mx-auto text-center max-w-2xl">
                        <div className="flex justify-center gap-1.5 mb-6">
                            {[1, 2, 3, 4, 5].map(i => <Sparkles key={i} className="w-4 h-4 text-amber-400" />)}
                        </div>
                        <blockquote className="text-xl md:text-2xl font-black text-foreground italic leading-tight mb-8">
                            "منذ انضمامي لوداد، تمكنت من الوصول لمريضات في مناطق لم أكن أحلم بالوصول إليها، مع مرونة تامة في وقتي."
                        </blockquote>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted/50 border-2 border-white shadow-md overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Sara+Mansour&background=random" alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-foreground leading-tight">د. سارة المنصور</p>
                                <p className="text-sm text-primary font-bold">استشارية أمراض النساء</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
};

export default JoinAsDoctor;
