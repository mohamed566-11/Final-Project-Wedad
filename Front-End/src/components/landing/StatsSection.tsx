import React from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, MessageCircle, Star, BookOpen } from 'lucide-react';
import { Stats } from '../../services/landingService';
import AnimatedCounter from './AnimatedCounter';
import { cn } from '@/lib/utils';
import './Landing.css';

interface StatsSectionProps {
    data: Stats;
}

const StatsSection: React.FC<StatsSectionProps> = ({ data }) => {
    const statsItems = [
        {
            icon: <Users className="w-6 h-6" />,
            value: data.total_users,
            label: 'مستخدمة نشطة',
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            icon: <Stethoscope className="w-6 h-6" />,
            value: data.total_doctors,
            label: 'طبيب واستشاري',
            color: 'text-info',
            bg: 'bg-info/10'
        },
        {
            icon: <MessageCircle className="w-6 h-6" />,
            value: data.total_consultations,
            label: 'استشارة مكتملة',
            color: 'text-accent',
            bg: 'bg-accent/10'
        },
        {
            icon: <Star className="w-6 h-6" />,
            value: data.satisfaction_rate,
            label: 'نسبة الرضا',
            suffix: '%',
            decimals: 1,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        },
        {
            icon: <BookOpen className="w-6 h-6" />,
            value: data.total_articles,
            label: 'مقال طبي موثق',
            color: 'text-success',
            bg: 'bg-success/10'
        },
    ];

    return (
        <section className="py-16 bg-foreground overflow-hidden relative" dir="rtl">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-info/5 blur-[120px]"></div>

            <div className="container mx-auto px-4">
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    {statsItems.map((stat, index) => (
                        <motion.div
                            key={index}
                            className="flex flex-col items-center text-center group"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-2xl",
                                stat.bg, stat.color
                            )}>
                                {stat.icon}
                            </div>
                            <div className="text-3xl font-black text-white mb-2 tracking-tighter">
                                <AnimatedCounter
                                    end={stat.value}
                                    suffix={stat.suffix || '+'}
                                    decimals={stat.decimals || 0}
                                />
                            </div>
                            <div className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest leading-relaxed">
                                {stat.label}
                            </div>

                            {/* Decorative Line */}
                            <div className="w-10 h-0.5 bg-white/5 rounded-full mt-5 group-hover:w-20 group-hover:bg-primary transition-all duration-500"></div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default StatsSection;
