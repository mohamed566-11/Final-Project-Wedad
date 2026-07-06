import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    ShieldCheck,
    Layout,
    Brain,
    Coins,
    Clock,
    Sparkles,
    Shield
} from 'lucide-react';
import { WhyChooseUs } from '../../services/landingService';
import { cn } from '@/lib/utils';
import './Landing.css';

interface WhyChooseUsSectionProps {
    data: WhyChooseUs[];
}

const getWhyIcon = (icon: string) => {
    switch (icon) {
        case '✅': return <CheckCircle2 className="w-5 h-5" />;
        case '🔒': return <ShieldCheck className="w-5 h-5" />;
        case '📱': return <Layout className="w-5 h-5" />;
        case '🤖': return <Brain className="w-5 h-5" />;
        case '💰': return <Coins className="w-5 h-5" />;
        case '⏰': return <Clock className="w-5 h-5" />;
        default: return <Sparkles className="w-5 h-5" />;
    }
};

const WhyChooseUsSection: React.FC<WhyChooseUsSectionProps> = ({ data }) => {
    return (
        <section className="py-32 bg-foreground border-y border-foreground/80 relative overflow-hidden" dir="rtl">
            {/* Dark Mode Luxury Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-info/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="text-center mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <motion.div
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest mb-6 border border-primary/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                    >
                        <Shield className="w-4 h-4" />
                        ثقة وأمان بلا حدود
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic">لماذا تختار <span className="text-primary underline decoration-primary/20 underline-offset-8">منصة وداد؟</span></h2>
                    <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
                        نحن لا نقدم مجرد خدمة، بل نقدم تجربة صحية فريدة مدمجة بأحدث التقنيات لضمان راحتك وسلامتك.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl hover:border-primary/50 hover:bg-white/10 transition-all duration-500 group"
                        >
                            <div className="flex items-start gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-lg">
                                    {getWhyIcon(item.icon)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-primary transition-colors italic tracking-tight uppercase">{item.title}</h3>
                                    <p className="text-base text-white/60 font-medium leading-relaxed group-hover:text-white/80 transition-colors">{item.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUsSection;
