import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    Heart,
    Calendar,
    Star,
    Rocket,
    Eye,
    ArrowLeft,
    ShieldCheck,
    Zap,
    Award,
    Users,
    Sparkles,
    CheckCircle2,
    Stethoscope,
    Activity,
    Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import publicService, { AboutUs as AboutUsType } from '../../services/publicService';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import BackButton from '@/components/common/BackButton';
import { useAuth } from '@/contexts/AuthContext';
import './PublicPages.css';

const AboutUs = () => {
    const [about, setAbout] = useState<AboutUsType | null>(null);
    const { user, userType } = useAuth();
    const isLoggedIn = !!user && userType === 'patient';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAboutUs = async () => {
            try {
                setLoading(true);
                const response = await publicService.getAboutUs();
                setAbout(response.data.data.about);

            } catch (err) {
                setError('حدث خطأ في تحميل البيانات');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAboutUs();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <PublicHeader />
                <div className="flex-grow flex flex-col justify-center items-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-foreground selection:bg-primary-100 selection:text-primary-900" dir="rtl">
            <Helmet>
                <title>من نحن | منصة وداد الصحية</title>
                <meta name="description" content={about?.description?.substring(0, 160)} />
            </Helmet>

            <PublicHeader />

            <main>
                {/* Hero Section - REIMAGINED */}
                <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-50 rounded-full blur-[100px] opacity-40"></div>
                        <div className="absolute top-1/2 -left-24 w-60 h-60 bg-blue-50 rounded-full blur-[80px] opacity-30"></div>
                    </div>

                    <div className="container mx-auto relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="mb-4 text-right">
                                <BackButton />
                            </div>
                            <Breadcrumbs items={[{ label: 'من نحن' }]} />

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-6xl font-black text-foreground mb-8 leading-[1.15] tracking-tighter"
                            >
                                {about?.title ? (
                                    <>
                                        {/* If user inputs a comma, let's optionally split it nicely for the design, or just render it */}
                                        {about.title.includes('،') ? (
                                            <>
                                                {about.title.split('،')[0]}، <br />
                                                <span className="text-primary">{about.title.split('،').slice(1).join('،')}</span>
                                            </>
                                        ) : (
                                            <span className="text-primary">{about.title}</span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        تمكين المرأة، <br />
                                        <span className="text-primary">بصحة ووعي</span>
                                    </>
                                )}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed"
                            >
                                {about?.description || 'وداد هي أول منصة رقمية متكاملة في الشرق الأوسط مصممة خصيصاً لدعم النساء في كافة مراحل حياتهن الحيوية.'}
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="py-20 px-4 bg-muted/50 relative overflow-hidden">
                    <div className="container mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Vision Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 border border-white hover:border-primary-100 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <Target className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors">{about?.vision?.title || 'رؤيتنا'}</h3>
                                <p className="text-base text-muted-foreground leading-relaxed font-medium">{about?.vision?.description || 'نسعى لأن نكون المرجع الصحي الرقمي الأول والأكثر موثوقية للمرأة العربية، مدمجين التقنية الحديثة بالخبرة الطبية العريقة.'}</p>
                            </motion.div>

                            {/* Mission Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 border border-white hover:border-primary-100 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <Rocket className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors">{about?.mission?.title || 'رسالتنا'}</h3>
                                <p className="text-base text-muted-foreground leading-relaxed font-medium">{about?.mission?.description || 'توفير خدمات صحية متكاملة وسهلة الوصول، تضمن السرية التامة والجودة العالية، وتساهم في تحسين جودة حياة المرأة والأسرة.'}</p>
                            </motion.div>

                            {/* Values Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 border border-white hover:border-primary-100 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <Award className="w-7 h-7 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors">قيمنا الجوهرية</h3>
                                <ul className="space-y-3">
                                    {['الابتكار الطبي', 'السرية التامة', 'التمكين المعرفي', 'الرعاية المستمرة'].map((val, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-base text-muted-foreground font-medium">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            {val}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Story Section - NEW DESIGN */}
                <section className="py-24 px-4 bg-white overflow-hidden">
                    <div className="container mx-auto">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="lg:w-1/2 relative"
                            >
                                <div className="relative z-10 rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] aspect-square lg:aspect-auto lg:h-[500px]">
                                    {about?.image_url ? (
                                        <img src={about.image_url} alt="قصة وداد" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary-500/10 to-blue-500/10 flex items-center justify-center">
                                            <Sparkles className="w-20 h-20 text-primary/20" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary-50 rounded-full blur-3xl opacity-50"></div>

                                <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/50 z-20 max-w-[240px]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <span className="text-base font-black text-foreground">أمان موثوق</span>
                                    </div>
                                    <p className="text-muted-foreground font-medium text-xs leading-relaxed">نحن نضمن سرية بياناتك الطبية والشخصية بأعلى معايير التشفير العالمية.</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="lg:w-1/2"
                            >
                                <span className="inline-block px-5 py-1.5 rounded-full bg-primary-50 text-primary font-black text-[10px] uppercase tracking-widest mb-4 border border-primary-100">قصة البداية</span>
                                <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight tracking-tight">
                                    {about?.title ? (
                                        <>
                                            {/* Splitting the title logically if it's long, or just showing it entirely */}
                                            {about.title}
                                        </>
                                    ) : (
                                        <>نحن لا نقدم مجرد استشارة، نحن نبني <span className="text-primary">مجتمعاً صحياً</span></>
                                    )}
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-10 whitespace-pre-line">
                                    {about?.description || 'بدأت منصة وداد كحلم لتمكين المرأة المصرية والعربية من خلال المعرفة والرعاية. نحن نجمع بين التكنولوجيا الحديثة ونخبة من الاستشاريين المتخصصين لتوفير رحلة صحية فريدة لكل امرأة.'}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-muted border border-border">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                            <Stethoscope className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-foreground mb-1 text-base">خبرة طبية</h4>
                                            <p className="text-muted-foreground text-xs text-nowrap">أكثر من 200 طبيب معتمد.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-muted border border-border">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                            <Activity className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-foreground mb-1 text-base">تكنولوجيا</h4>
                                            <p className="text-muted-foreground text-xs text-nowrap">أدوات تتبع تعمل بالذكاء الاصطناعي.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>



                {/* CTA Section - Hidden for logged-in patients */}
                {!isLoggedIn && (
                    <section className="py-24 px-4 bg-white">
                        <div className="container mx-auto">
                            <div className="relative rounded-[40px] bg-primary p-12 md:p-20 overflow-hidden text-center shadow-[0_40px_80px_-20px_rgba(20,184,166,0.25)]">
                                <div className="absolute inset-0 pointer-events-none opacity-20">
                                    <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-white rounded-full blur-[120px]"></div>
                                    <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-white rounded-full blur-[120px]"></div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    className="relative z-10"
                                >
                                    <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-[1.2]">كوني جزءاً من رحلة <br /> مفعمة بالثقة والأمان</h2>
                                    <p className="text-lg md:text-xl text-primary-50 font-medium mb-12 max-w-2xl mx-auto leading-relaxed opacity-90">سجلي الآن مجاناً وابدأي رحلتك الصحية مع أفضل الخبراء في الوطن العربي.</p>

                                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                        <Link to="/register" className="px-10 py-5 rounded-[24px] bg-white text-primary font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                                            سجلي الآن
                                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                        </Link>
                                        <Link to="/contact" className="px-10 py-5 rounded-[24px] bg-primary-700 text-white font-black text-lg border-2 border-primary/50 hover:bg-primary-800 active:scale-95 transition-all">
                                            تواصلي معنا
                                        </Link>
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

export default AboutUs;
