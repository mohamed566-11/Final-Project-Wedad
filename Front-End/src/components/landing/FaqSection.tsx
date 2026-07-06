import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Plus, Minus, MessageCircle, ArrowLeft } from 'lucide-react';
import { FAQ } from '../../services/landingService';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import './Landing.css';

interface FaqSectionProps {
    data: FAQ[];
}

const FaqSection: React.FC<FaqSectionProps> = ({ data }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-32 bg-background relative overflow-hidden" dir="rtl">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    {/* Left Sidebar Info */}
                    <motion.div
                        className="lg:col-span-4 lg:sticky lg:top-32"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block px-5 py-2 rounded-full bg-primary-50 text-primary font-bold text-[10px] uppercase tracking-widest mb-6 border border-primary-100">مركز المساعدة</span>
                        <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8 tracking-tighter italic leading-tight">إجابات على <br /> <span className="text-primary">تساؤلاتك</span></h2>
                        <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10">
                            جمعنا لكِ أكثر الأسئلة المكررة لنساعدك على فهم كيف يمكن لمنصة وداد أن تكون رفيقتك الصحية المثالية.
                        </p>

                        <div className="p-8 rounded-[40px] bg-foreground text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <MessageCircle className="w-10 h-10 text-primary mb-6" />
                            <h3 className="text-xl font-black mb-2 italic">لم تجدي إجابة لسؤالك؟</h3>
                            <p className="text-sm text-white/60 mb-8">فريق الدعم لدينا متاح دائماً لمساعدتك في أي استفسار.</p>
                            <Link to="/contact" className="inline-flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest hover:text-white transition-colors">
                                تواصلي معنا الآن
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right FAQ List */}
                    <div className="lg:col-span-8">
                        <motion.div
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            {data.map((faq, index) => (
                                <motion.div
                                    key={faq.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "rounded-[32px] border transition-all duration-500 overflow-hidden",
                                        openIndex === index
                                            ? "bg-card border-primary-100 shadow-deep scale-[1.01]"
                                            : "bg-muted/50 border-muted hover:bg-card hover:border-primary-50"
                                    )}
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full px-8 py-8 flex items-center justify-between text-right gap-6 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                openIndex === index ? "bg-primary text-white" : "bg-card text-muted-foreground group-hover:text-primary shadow-sm"
                                            )}>
                                                <HelpCircle className="w-5 h-5" />
                                            </div>
                                            <span className={cn(
                                                "text-lg font-black transition-colors italic tracking-tight",
                                                openIndex === index ? "text-primary" : "text-foreground group-hover:text-primary"
                                            )}>
                                                {faq.question}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                                            openIndex === index ? "border-primary text-primary rotate-180" : "border-border text-muted-foreground"
                                        )}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {openIndex === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                                            >
                                                <div className="px-12 pb-10">
                                                    <div className="h-px bg-border mb-8"></div>
                                                    <p className="text-base text-muted-foreground font-medium leading-relaxed">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
