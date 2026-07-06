import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Users,
    ArrowRight,
    Heart,
    Baby,
    Sparkles,
    ChevronLeft,
    Calendar,
    Stethoscope
} from 'lucide-react';
import { LifeStage } from '../../services/landingService';
import { cn } from '@/lib/utils';
import './Landing.css';

interface LifeStagesSectionProps {
    data: LifeStage[];
}

const getStageIcon = (slug: string) => {
    switch (slug) {
        case 'pre-marriage': return <Heart className="w-6 h-6" />;
        case 'married-life': return <Sparkles className="w-6 h-6" />;
        case 'motherhood': return <Baby className="w-6 h-6" />;
        default: return <Sparkles className="w-6 h-6" />;
    }
};

const getStageTheme = (slug: string) => {
    switch (slug) {
        case 'pre-marriage': return 'from-primary to-primary-700';
        case 'married-life': return 'from-info to-accent';
        case 'motherhood': return 'from-rose-400 to-pink-600';
        default: return 'from-muted-foreground to-foreground';
    }
};

const LifeStagesSection: React.FC<LifeStagesSectionProps> = ({ data }) => {
    return (
        <section className="py-24 bg-muted relative overflow-hidden" dir="rtl">
            {/* Background Texture for Depth */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/patterns/noise.png')]"></div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-block px-5 py-1.5 rounded-full bg-primary-50 text-primary font-black text-[10px] uppercase tracking-widest mb-4 border border-primary-100">رحلتك الصحية</span>
                    <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 tracking-tighter italic">محتوى مخصص <br /> <span className="text-primary underline decoration-primary-100">لكل مرحلة في حياتك</span></h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                        نحن معكِ في كل خطوة، من التخطيط والمستقبل إلى الأمومة والرعاية، بأسلوب علمي وحديث.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {data.slice(0, 3).map((stage, index) => (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                to={`/life-stages/${stage.slug}`}
                                className="group block h-full bg-card rounded-[40px] p-10 border border-border hover:border-primary-200 hover:shadow-glow transition-all duration-700 relative overflow-hidden"
                            >
                                {/* Active State Background Gradient */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 bg-gradient-to-br",
                                    getStageTheme(stage.slug)
                                )}></div>

                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 shadow-inner",
                                    stage.slug === 'pre-marriage' ? 'bg-primary-50 text-primary' :
                                        stage.slug === 'married-life' ? 'bg-info/10 text-info' :
                                            'bg-rose-50 text-rose-600'
                                )}>
                                    {getStageIcon(stage.slug)}
                                </div>

                                <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors leading-tight italic tracking-tight">{stage.name_ar}</h3>
                                <p className="text-base text-muted-foreground font-medium mb-12 line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{stage.description}</p>

                                <div className="mt-auto flex items-center justify-between pt-8 border-t border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-3 space-x-reverse">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                                                    <img src={`https://ui-avatars.com/api/?name=U${i}&background=random`} alt="user" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-muted-foreground">+{stage.users_count.toLocaleString('ar-EG')} مستخدمة</span>
                                    </div>

                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        <ArrowRight className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
                                    </div>
                                </div>

                                {/* Floating Background ID */}
                                <span className="absolute -top-4 -left-4 text-8xl font-black text-muted/50 group-hover:text-primary-50/50 pointer-events-none transition-colors duration-700 select-none">0{index + 1}</span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </section>
    );
};

export default LifeStagesSection;
