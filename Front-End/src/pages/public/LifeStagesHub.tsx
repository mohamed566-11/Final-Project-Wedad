import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import landingService, { LifeStage } from '@/services/landingService';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Sparkles,
    Heart,
    Activity,
    Zap,
    ArrowRight
} from 'lucide-react';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import BackButton from '@/components/common/BackButton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const LifeStagesHub = () => {
    const { user, userType } = useAuth();
    const [stages, setStages] = useState<LifeStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [landingData, setLandingData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await landingService.getLandingPageData();
                setStages(data.life_stages);
                setLandingData(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const stageDetails: Record<string, { features: string[], cta: string, color: string, bg: string, border: string, icon: any }> = {
        'pre-marriage': {
            features: ['فحوصات طبية شاملة', 'استشارات نفسية', 'تخطيط صحي', 'دليل شامل للمقبلين'],
            cta: 'استعدي للبداية',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            icon: <Heart className="w-8 h-8" />
        },
        'married-life': {
            features: ['دعم الخصوبة', 'متابعة الصحة الإنجابية', 'استشارات زوجية', 'نصائح لحياة صحية'],
            cta: 'استكشفي خدماتنا',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            icon: <Zap className="w-8 h-8" />
        },
        'motherhood': {
            features: ['متابعة الحمل أسبوعياً', 'رعاية ما بعد الولادة', 'دليل العناية بالطفل'],
            cta: 'انضمي للرحلة',
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            icon: <Activity className="w-8 h-8" />
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <PublicHeader />
                <div className="flex-grow flex flex-col justify-center items-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin opacity-20" />
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-foreground flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden" dir="rtl">
            <PublicHeader />

            <main className="flex-grow">
                {/* Hero Section - Compact & Impactful */}
                <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-primary-50/30 via-white to-white">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-100/30 rounded-full blur-[100px]"></div>
                        <div className="absolute top-1/2 -left-24 w-56 h-56 bg-blue-100/20 rounded-full blur-[80px]"></div>
                    </div>

                    <div className="container mx-auto relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="mb-4 text-right">
                                <BackButton />
                            </div>
                            <Breadcrumbs items={[{ label: 'المراحل الحياتية' }]} />

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl md:text-5xl lg:text-7xl font-black text-foreground mb-6 leading-tight tracking-tight"
                            >
                                رفيقكِ الصحي الموثوق في <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-700">كل مراحل حياتكِ</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-base md:text-lg lg:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed"
                            >
                                وداد تقدم لكِ عالماً من الرعاية الطبية والأدوات الذكية المصممة خصيصاً لتناسب خصوصية وتحديات كل مرحلة من مراحل حياتكِ.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* Stages Explorer - Compact Grid */}
                <section className="py-16 px-4 bg-white">
                    <div className="container mx-auto">
                        <div className={cn("grid gap-8",
                            user && userType === 'patient' && (user as any).life_stage_id
                                ? "grid-cols-1 max-w-lg mx-auto"
                                : "grid-cols-1 md:grid-cols-3"
                        )}>
                            {stages
                                // Filter stages if user is logged in
                                .filter(stage => {
                                    if (user && userType === 'patient' && (user as any).life_stage_id) {
                                        return stage.id === (user as any).life_stage_id;
                                    }
                                    return true;
                                })
                                .map((stage, index) => {
                                    const details = stageDetails[stage.slug] || stageDetails['pre-marriage'];
                                    return (
                                        <motion.div
                                            key={stage.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="group relative h-full flex flex-col"
                                        >
                                            <div className={cn("absolute inset-x-2 inset-y-2 rounded-[40px] bg-muted transition-all duration-500 group-hover:bg-white group-hover:shadow-xl group-hover:scale-[1.02] border border-transparent group-hover:border-border")}></div>
                                            <div className="relative p-8 flex flex-col h-full z-10 text-center items-center">
                                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner", details.bg)}>
                                                    <div className={details.color}>
                                                        {React.cloneElement(details.icon, { className: "w-8 h-8" })}
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-black text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
                                                    {stage.name}
                                                </h3>

                                                <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium mb-8 flex-grow group-hover:text-muted-foreground transition-colors px-2">
                                                    {stage.description}
                                                </p>

                                                <div className="space-y-3 mb-8 w-full">
                                                    {details.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-muted-foreground font-bold py-2.5 px-4 bg-white rounded-xl border border-muted shadow-sm group-hover:border-primary-50 transition-all">
                                                            <CheckCircle2 className={cn("w-4 h-4 shrink-0", details.color)} />
                                                            <span className="text-xs">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Link
                                                    to={`/life-stages/${stage.slug}`}
                                                    className={cn("w-full py-4 rounded-2xl text-white font-black text-base transition-all shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group/btn",
                                                        stage.slug === 'pre-marriage' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                                                            stage.slug === 'married-life' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
                                                                'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                                    )}
                                                >
                                                    {details.cta}
                                                    <ArrowLeft className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    </div>
                </section>

                {/* Experience Banner - Hidden for logged-in patients */}
                {!(user && userType === 'patient') && (
                    <section className="py-16 px-4">
                        <div className="container mx-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative rounded-[40px] bg-foreground p-8 md:p-16 overflow-hidden text-center"
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary-500/10 to-blue-500/10 blur-[80px] pointer-events-none"></div>

                                <div className="relative z-10 max-w-2xl mx-auto">
                                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">احصلي على تجربة مخصصة الآن</h2>
                                    <p className="text-lg text-muted-foreground font-medium mb-10 leading-relaxed">انضمي إلينا اليوم للوصول إلى أدوات ذكية، مقالات حصرية، واستشارات طبية تناسب مرحلتك الحالية بدقة.</p>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            to="/register"
                                            className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-xl hover:bg-primary transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                                        >
                                            ابدأي رحلتك مجاناً
                                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        </Link>
                                        <Link
                                            to="/about"
                                            className="px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-xl text-white font-black text-lg border border-white/10 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            تعرفي علينا أكثر
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                )}

                {/* Additional Sections - Compact Padded */}
                {landingData?.testimonials && (
                    <div className="bg-white py-20 border-t border-muted">
                        <TestimonialsSection data={landingData.testimonials} />
                    </div>
                )}

                <div className="py-20 bg-muted/50 border-t border-border">
                    {landingData?.how_it_works && <HowItWorksSection data={landingData.how_it_works} />}
                </div>


            </main>

            <PublicFooter />
        </div>
    );
};

export default LifeStagesHub;
