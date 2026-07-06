import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { CtaBanner } from '../../services/landingService';
import './Landing.css';

interface CtaSectionProps {
    data: CtaBanner;
}

const CtaSection: React.FC<CtaSectionProps> = ({ data }) => {
    return (
        <section className="py-24 px-4 bg-background" dir="rtl">
            <div className="container mx-auto">
                <div className="relative rounded-[60px] bg-foreground p-12 md:p-24 overflow-hidden text-center shadow-deep">
                    {/* Animated Background Mesh */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-info/20 blur-[120px] pointer-events-none"></div>
                        <div className="absolute inset-0 opacity-[0.05] bg-[url('/patterns/topographic.svg')] bg-repeat"></div>
                    </div>

                    <motion.div
                        className="relative z-10"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 text-primary font-bold text-[10px] uppercase tracking-widest mb-8 border border-white/10"
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <Sparkles className="w-4 h-4" />
                            جاهزة للبداية؟
                        </motion.div>

                        <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[1.1] italic">
                            {data.title.split(' ').map((word, i) => (
                                <span key={i} className={i === 2 || i === 3 ? "text-primary" : ""}>
                                    {word}{' '}
                                </span>
                            ))}
                        </h2>

                        <p className="text-xl md:text-2xl text-muted-foreground/70 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                            {data.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <Link
                                to={data.button_link}
                                className="px-12 py-6 rounded-[32px] bg-primary text-white font-black text-2xl shadow-glow hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group"
                            >
                                {data.button_text}
                                <ArrowRight className="w-8 h-8 group-hover:-translate-x-3 transition-transform" />
                            </Link>

                            <div className="flex items-center gap-6 text-white/50">
                                <span className="flex items-center gap-2 text-sm font-bold">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    تشفير كامل للبيانات
                                </span>
                                <span className="flex items-center gap-2 text-sm font-bold">
                                    <Heart className="w-5 h-5 text-rose-400" />
                                    رعاية مجانية تماماً
                                </span>
                            </div>
                        </div>

                        <motion.p
                            className="mt-12 text-sm font-black text-muted-foreground/70 uppercase tracking-widest italic"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                        >
                            {data.secondary_text}
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default CtaSection;
