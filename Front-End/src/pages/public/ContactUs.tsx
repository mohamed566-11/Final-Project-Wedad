import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Facebook,
    Twitter as TwitterIcon,
    Instagram,
    Youtube,
    Send,
    CheckCircle2,
    MessageCircle,
    ArrowLeft,
    Sparkles,
    ShieldCheck,
    Users,
    Headphones,
    HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import publicService, { ContactFormData, ContactInfo } from '../../services/publicService';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import BackButton from '@/components/common/BackButton';
import { cn } from '@/lib/utils';
import './PublicPages.css';

const ContactUs = () => {
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                setLoading(true);
                const response = await publicService.getContactInfo();
                setContactInfo(response.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContactInfo();
    }, []);

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
        if (!formData.email.trim()) {
            errors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'البريد الإلكتروني غير صحيح';
        }
        if (formData.phone && !/^01[0125][0-9]{8}$/.test(formData.phone)) {
            errors.phone = 'رقم الهاتف غير صحيح (مثال: 01012345678)';
        }
        if (!formData.subject.trim()) errors.subject = 'الموضوع مطلوب';
        if (!formData.message.trim()) errors.message = 'الرسالة مطلوبة';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            setError(null);
            await publicService.submitContactForm(formData);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء إرسال الرسالة');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const getSocialIcon = (type: string) => {
        switch (type) {
            case 'facebook': return <Facebook className="w-6 h-6" />;
            case 'twitter': return <TwitterIcon className="w-6 h-6" />;
            case 'instagram': return <Instagram className="w-6 h-6" />;
            case 'youtube': return <Youtube className="w-6 h-6" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-foreground selection:bg-primary-100 selection:text-primary-900" dir="rtl">
            <Helmet>
                <title>تواصلي معنا | منصة وداد الصحية</title>
                <meta name="description" content="تواصلي مع فريق منصة وداد الصحية للاستفسارات والدعم الفني" />
            </Helmet>

            <PublicHeader />

            <main>
                {/* Hero Section - PREMIUM SPLIT */}
                <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-50 rounded-full blur-[120px] opacity-40"></div>
                        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-50 rounded-full blur-[100px] opacity-30"></div>
                    </div>

                    <div className="container mx-auto relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="mb-4 text-right">
                                <BackButton />
                            </div>
                            <Breadcrumbs items={[{ label: 'تواصل/ي معنا' }]} />

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-6xl font-black text-foreground mb-8 leading-tight tracking-tighter"
                            >
                                نحن هنا لخدمتكم <br />
                                <span className="text-primary">على مدار الساعة</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed"
                            >
                                سواء كان لديكِ استفسار طبي، تقني، أو رغبة في الانضمام إلى فريقنا، يسعدنا التواصل معكِ عبر كافة القنوات المتاحة.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* Contact Interface */}
                <section className="pb-24 px-4 relative">
                    <div className="container mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            {/* Left Side: Contact Form Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="lg:col-span-7 bg-white rounded-[40px] p-6 md:p-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] border border-muted relative overflow-hidden group hover:border-primary-100 transition-colors duration-500"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] pointer-events-none opacity-50 group-hover:bg-primary-100 transition-colors"></div>

                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-20"
                                        >
                                            <div className="w-24 h-24 bg-primary-100 rounded-[32px] flex items-center justify-center mb-10 mx-auto text-primary shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-foreground mb-6 tracking-tight">تم الإرسال بنجاح!</h3>
                                            <p className="text-xl text-muted-foreground font-medium mb-12 max-w-sm mx-auto">سيقوم فريقنا بمراجعة رسالتك والتواصل معكِ خلال 24-48 ساعة.</p>
                                            <button
                                                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                                                className="px-12 py-5 rounded-3xl bg-primary text-white font-black text-xl shadow-xl shadow-primary-900/20 hover:bg-primary transition-all hover:scale-105 active:scale-95"
                                            >
                                                إرسال رسالة أخرى
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="form">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                                                    <MessageCircle className="w-5 h-5" />
                                                </div>
                                                <h2 className="text-2xl font-black text-foreground tracking-tight">أرسلي لنا رسالة</h2>
                                            </div>

                                            <form onSubmit={handleSubmit} className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">الاسم بالكامل</label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleChange}
                                                            placeholder="أدخلي اسمك هنا"
                                                            className={cn("w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-base", formErrors.name && "border-red-100 bg-red-50/30")}
                                                        />
                                                        {formErrors.name && <p className="text-red-500 text-xs font-black mr-2">{formErrors.name}</p>}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">البريد الإلكتروني</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            placeholder="example@widad.health"
                                                            className={cn("w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-base", formErrors.email && "border-red-100 bg-red-50/30")}
                                                        />
                                                        {formErrors.email && <p className="text-red-500 text-xs font-black mr-2">{formErrors.email}</p>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">رقم الهاتف (اختياري)</label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleChange}
                                                            placeholder="01xxxxxxxxx"
                                                            className={cn("w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-base", formErrors.phone && "border-red-100 bg-red-50/30")}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">موضوع الرسالة</label>
                                                        <input
                                                            type="text"
                                                            name="subject"
                                                            value={formData.subject}
                                                            onChange={handleChange}
                                                            placeholder="كيف يمكننا مساعدتك؟"
                                                            className={cn("w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-base", formErrors.subject && "border-red-100 bg-red-50/30")}
                                                        />
                                                        {formErrors.subject && <p className="text-red-500 text-xs font-black mr-2">{formErrors.subject}</p>}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">محتوى الرسالة</label>
                                                    <textarea
                                                        name="message"
                                                        value={formData.message}
                                                        onChange={handleChange}
                                                        rows={5}
                                                        placeholder="اكتبي تفاصيل استفسارك هنا..."
                                                        className={cn("w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:bg-white focus:border-primary-200 outline-none transition-all font-bold text-base resize-none", formErrors.message && "border-red-100 bg-red-50/30")}
                                                    />
                                                    {formErrors.message && <p className="text-red-500 text-xs font-black mr-2">{formErrors.message}</p>}
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="w-full py-4 rounded-2xl bg-foreground text-white font-black text-xl shadow-xl transition-all hover:bg-primary hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 group"
                                                >
                                                    {submitting ? 'جاري الإرسال...' : (
                                                        <>
                                                            إرسال الرسالة الآن
                                                            <Send className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Right Side: Contact Info & Support */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="lg:col-span-12 xl:col-span-5 space-y-8"
                            >
                                {/* Core Contact Methods */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                                    {/* Email Card */}
                                    <div className="bg-muted p-6 rounded-[32px] border border-border hover:border-primary-100 hover:bg-white hover:shadow-xl transition-all duration-500 group flex items-start gap-6">
                                        <div className="w-12 h-12 rounded-[16px] bg-primary-100/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shrink-0">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">البريد الإلكتروني</h4>
                                            <a href={`mailto:${contactInfo?.email || 'info@widad.health'}`} className="text-xl font-black text-foreground hover:text-primary transition-colors">
                                                {contactInfo?.email || 'info@widad.health'}
                                            </a>
                                            <p className="mt-1 text-muted-foreground font-medium text-sm">نرد عادة خلال 24 ساعة.</p>
                                        </div>
                                    </div>

                                    {/* Phone Card */}
                                    <div className="bg-muted p-6 rounded-[32px] border border-border hover:border-primary-100 hover:bg-white hover:shadow-xl transition-all duration-500 group flex items-start gap-6">
                                        <div className="w-12 h-12 rounded-[16px] bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">الدعم الهاتفي</h4>
                                            <a href={`tel:${contactInfo?.phone || '+201001234567'}`} className="text-xl font-black text-foreground hover:text-primary transition-colors underline decoration-primary-100">
                                                {contactInfo?.phone || '+20 100 123 4567'}
                                            </a>
                                            <p className="mt-1 text-muted-foreground font-medium text-sm">{contactInfo?.working_hours || 'السبت - الخميس: 9:00 - 18:00'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Address & Socials */}
                                <div className="bg-foreground rounded-[32px] p-8 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none"></div>

                                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                                        تواجُدنا الميداني
                                        <MapPin className="w-6 h-6 text-primary-400" />
                                    </h3>

                                    <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-8">
                                        {contactInfo?.address ?
                                            `${contactInfo.address.street}, ${contactInfo.address.city}, ${contactInfo.address.country}` :
                                            'حي جاردن سيتي، القاهرة، جمهورية مصر العربية'
                                        }
                                    </p>

                                    <div className="pt-6 border-t border-foreground flex flex-wrap items-center gap-4">
                                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest w-full mb-1">وسائل التواصل الاجتماعي</span>
                                        {contactInfo?.social_media && Object.entries(contactInfo.social_media).map(([key, url]) => (
                                            url && (
                                                <a
                                                    key={key}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-11 h-11 rounded-xl bg-foreground flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
                                                >
                                                    {getSocialIcon(key)}
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Support Features */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/contact" className="bg-muted p-6 rounded-[24px] border border-border hover:border-primary-100 transition-all group flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <HelpCircle className="w-6 h-6 text-primary" />
                                        </div>
                                        <h4 className="font-black text-foreground uppercase tracking-tighter text-xs">الدعم الفني</h4>
                                    </Link>
                                    <div className="bg-muted p-6 rounded-[24px] border border-border hover:border-primary-100 transition-all group flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Headphones className="w-6 h-6 text-primary" />
                                        </div>
                                        <h4 className="font-black text-foreground uppercase tracking-tighter text-xs">الدعم المباشر</h4>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div>
    );
};

export default ContactUs;
