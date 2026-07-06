import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Star,
    Calendar,
    Award,
    CreditCard,
    ArrowLeft,
    CheckCircle2,
    Clock,
    User
} from 'lucide-react';
import { FeaturedDoctor } from '../../services/landingService';
import { cn } from '@/lib/utils';
import './Landing.css';

interface DoctorsSectionProps {
    data: FeaturedDoctor[];
}

const DoctorsSection: React.FC<DoctorsSectionProps> = ({ data }) => {
    return (
        <section className="py-32 bg-background relative overflow-hidden" dir="rtl">
            {/* Advanced Background Pattern */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-50/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-100/20 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="max-w-3xl mx-auto text-center mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="w-12 h-[2px] bg-primary/20"></span>
                        <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary font-black text-[10px] uppercase tracking-widest border border-primary-100/50 shadow-sm">
                            نخبة الأطباء
                        </span>
                        <span className="w-12 h-[2px] bg-primary/20"></span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tighter leading-tight">
                        رعاية طبية تليق بكِ من <br />
                        <span className="text-primary relative inline-block">
                            أفضل المتخصصين
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary-100 -z-10" viewBox="0 0 100 12" preserveAspectRatio="none">
                                <path d="M0,10 Q50,0 100,10" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span>
                    </h2>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                        نختار لكِ بعناية فائقة أفضل الكوادر الطبية المتخصصة لضمان حصولك على استشارات آمنة وموثوقة.
                    </p>
                </motion.div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.slice(0, 3).map((doctor, index) => (
                        <motion.div
                            key={doctor.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="group relative"
                        >
                            <div className="premium-card rounded-[40px] p-5 bg-card flex flex-col h-full border-none shadow-soft hover:shadow-glow transition-all duration-700">
                                {/* Image Container */}
                                <div className="relative mb-6 rounded-[32px] overflow-hidden aspect-square bg-muted group-hover:shadow-xl transition-all duration-700">
                                    {doctor.image_url && !doctor.image_url.includes('default-doctor.png') ? (
                                        <img
                                            src={doctor.image_url}
                                            alt={doctor.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                                            <span className="text-5xl font-black text-primary/30 mb-2">{doctor.name.charAt(0)}</span>
                                            <User className="w-12 h-12 text-primary/10" />
                                        </div>
                                    )}

                                    {/* Action Badges */}
                                    <div className="absolute top-4 inset-x-4 flex justify-between items-start">
                                        {doctor.is_available ? (
                                            <div className="px-3 py-1.5 rounded-xl bg-primary/90 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                متاح
                                            </div>
                                        ) : (
                                            <div></div>
                                        )}
                                        <div className="p-2 rounded-xl bg-white/90 backdrop-blur-md text-amber-500 shadow-xl border border-white/20">
                                            <Star className="w-4 h-4 fill-amber-500" />
                                        </div>
                                    </div>

                                    {/* Experience Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                <Award className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-primary/80 uppercase tracking-widest leading-none mb-1">الخبرة</p>
                                                <p className="text-xs font-black text-white">{doctor.years_of_experience} سنة</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-1 flex flex-col flex-grow">
                                    <div className="mb-5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors tracking-tighter leading-none">
                                                {doctor.name}
                                            </h3>
                                            <span className="text-lg font-black text-primary">{doctor.rating.toFixed(1)}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-3 h-[1px] bg-border"></span>
                                            {doctor.specialization_ar}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-4 rounded-[24px] bg-muted/50 border border-border group-hover:bg-card transition-colors duration-500">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <CreditCard className="w-3 h-3" /> السعر
                                            </p>
                                            <p className="text-base font-black text-foreground">{doctor.consultation_price} <span className="text-[10px] font-bold text-muted-foreground">ج.م</span></p>
                                        </div>
                                        <div className="p-4 rounded-[24px] bg-primary-50/30 border border-primary-100/30 group-hover:bg-primary-50 transition-colors duration-500">
                                            <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> استشارة
                                            </p>
                                            <p className="text-base font-black text-primary-700">{doctor.total_consultations}+</p>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/doctors/${doctor.id}`}
                                        className="mt-auto w-full py-4 rounded-[24px] bg-primary text-white font-black text-base flex items-center justify-center gap-2.5 hover:bg-primary-700 transition-all shadow-card hover:shadow-glow active:scale-[0.98] group/btn overflow-hidden relative"
                                    >
                                        <span className="relative z-10 flex items-center gap-2.5">
                                            الملف الشخصي
                                            <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1.5 transition-transform duration-500" />
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="mt-24 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <Link
                        to="/doctors"
                        className="group inline-flex items-center gap-4 px-12 py-5 rounded-full bg-muted border border-border text-foreground font-black text-sm uppercase tracking-widest hover:bg-card hover:border-primary-200 hover:text-primary hover:shadow-glow transition-all duration-500"
                    >
                        استكشفي جميع الأطباء المتاحين
                        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default DoctorsSection;
