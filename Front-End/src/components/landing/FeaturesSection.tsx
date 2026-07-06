import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Heart,
    Stethoscope,
    Activity,
    BookOpen,
    Brain,
    Users,
    ArrowRight,
    Sparkles,
    Zap
} from 'lucide-react';
import { Feature } from '../../services/landingService';
import { cn } from '@/lib/utils';
import './Landing.css';

interface FeaturesSectionProps {
    data: Feature[];
}

const getFeatureIcon = (icon: string) => {
    switch (icon) {
        case '🤰': return <Heart className="w-6 h-6" />;
        case '👨‍⚕️': return <Stethoscope className="w-6 h-6" />;
        case '📊': return <Activity className="w-6 h-6" />;
        case '📚': return <BookOpen className="w-6 h-6" />;
        case '🤖': return <Brain className="w-6 h-6" />;
        case '💬': return <Users className="w-6 h-6" />;
        default: return <Sparkles className="w-6 h-6" />;
    }
};

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ data }) => {
    return (
        <section className="py-32 bg-background relative overflow-hidden" dir="rtl">
            {/* Background Medical Mesh Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="max-w-3xl mx-auto text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary font-bold text-[10px] uppercase tracking-widest mb-6 border border-primary-100/50"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        الابتكار في الرعاية الصحية
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 tracking-tighter leading-tight italic">
                        كل ما تحتاجينه <br />
                        <span className="text-primary underline decoration-primary-100/50 underline-offset-8">في مكان واحد</span>
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                        منصة وداد ليست مجرد موقع، بل هي نظام بيئي متكامل تم تصميمه بعناية ليرافقك في كل خطوة من رحلتك الصحية.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.7 }}
                        >
                            <Link
                                to={feature.link}
                                className="group block relative p-10 bg-card rounded-[40px] border border-border hover:border-primary-200 transition-all duration-500 hover:shadow-glow overflow-hidden"
                            >
                                {/* Decorative Glow */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm",
                                    feature.color === 'pink' ? 'bg-rose-50 text-rose-600' :
                                        feature.color === 'blue' ? 'bg-info/10 text-info' :
                                            feature.color === 'purple' ? 'bg-accent/10 text-accent' :
                                                feature.color === 'green' ? 'bg-success/10 text-success' :
                                                    feature.color === 'teal' ? 'bg-primary-50 text-primary' : 'bg-amber-50 text-amber-600'
                                )}>
                                    {getFeatureIcon(feature.icon)}
                                </div>

                                <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-base text-muted-foreground font-medium leading-relaxed mb-10 group-hover:text-foreground/70 transition-colors">
                                    {feature.description}
                                </p>

                                <div className="flex items-center gap-2 text-sm font-black text-muted-foreground group-hover:text-primary transition-all">
                                    <span className="uppercase tracking-widest italic">اكتشفي الآن</span>
                                    <ArrowRight className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                                </div>

                                {/* Background Overlay on Hover */}
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
