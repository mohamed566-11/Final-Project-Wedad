import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Quote,
    Star,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    User
} from 'lucide-react';
import { Testimonial } from '../../services/landingService';
import { cn } from '@/lib/utils';
import './Landing.css';

interface TestimonialsSectionProps {
    data: Testimonial[];
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ data }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const testimonialsPerView = 3;
    const totalSlides = Math.ceil(data.length / testimonialsPerView);

    useEffect(() => {
        if (isAutoPlaying && data.length > testimonialsPerView) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % totalSlides);
            }, 6000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isAutoPlaying, totalSlides, data.length]);

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
        setIsAutoPlaying(false);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
        setIsAutoPlaying(false);
    };

    const getLifeStageName = (stage: string) => {
        const names: Record<string, string> = {
            'pre_marriage': 'ما قبل الزواج',
            'pre-marriage': 'ما قبل الزواج',
            'married': 'الحياة الزوجية',
            'pregnancy': 'الحمل',
            'postpartum': 'ما بعد الولادة',
            'motherhood': 'الأمومة',
        };
        return names[stage] || stage;
    };

    const visibleTestimonials = data.slice(
        currentIndex * testimonialsPerView,
        (currentIndex + 1) * testimonialsPerView
    );

    return (
        <section className="py-32 bg-muted relative overflow-hidden" dir="rtl">
            {/* Soft Background Accents */}
            <div className="absolute top-0 left-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-1/3 h-full bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="max-w-3xl mx-auto text-center mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-block px-5 py-2 rounded-full bg-card text-primary font-bold text-[10px] uppercase tracking-widest mb-4 shadow-sm border border-primary-100">قصص نجاح واقعية</span>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 tracking-tighter italic">ماذا تقول <span className="text-primary underline decoration-primary-100 underline-offset-8">مستخدماتنا</span></h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                        نفخر بكوننا جزءاً من رحلة آلاف النساء نحو حياة صحية أفضل. إليكِ بعض الانطباعات الحقيقية.
                    </p>
                </motion.div>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {visibleTestimonials.map((testimonial) => (
                                <div
                                    key={testimonial.id}
                                    className="group p-10 bg-card rounded-[40px] border border-border shadow-soft transition-all duration-500 hover:shadow-glow hover:border-primary-100 relative"
                                >
                                    <div className="absolute top-8 right-8 text-primary-50 group-hover:text-primary-100 transition-colors">
                                        <Quote className="w-16 h-16 fill-current" />
                                    </div>

                                    <div className="flex gap-1 mb-8 relative z-10">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "w-4 h-4",
                                                    i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-border"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-lg text-foreground/70 font-medium leading-relaxed mb-10 italic relative z-10">
                                        "{testimonial.comment}"
                                    </p>

                                    <div className="flex items-center gap-5 pt-8 border-t border-border">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border-2 border-white shadow-sm">
                                            {testimonial.patient_image ? (
                                                <img src={testimonial.patient_image} alt={testimonial.patient_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-foreground leading-tight uppercase tracking-tight">{testimonial.patient_name}</h4>
                                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{getLifeStageName(testimonial.life_stage)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Desktop Navigation Buttons */}
                    {totalSlides > 1 && (
                        <div className="absolute top-1/2 -left-6 -right-6 -translate-y-1/2 flex justify-between pointer-events-none hidden xl:flex">
                            <button
                                onClick={handleNext}
                                className="w-14 h-14 rounded-2xl bg-card shadow-deep border border-border text-foreground flex items-center justify-center hover:bg-primary hover:text-white transition-all pointer-events-auto active:scale-90"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handlePrev}
                                className="w-14 h-14 rounded-2xl bg-card shadow-deep border border-border text-foreground flex items-center justify-center hover:bg-primary hover:text-white transition-all pointer-events-auto active:scale-90"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagination Dots */}
                {totalSlides > 1 && (
                    <div className="flex justify-center gap-3 mt-16">
                        {Array.from({ length: totalSlides }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => handleDotClick(i)}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-500",
                                    i === currentIndex ? "w-10 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;
