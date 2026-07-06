import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { BMICard } from './BMICard';
import { ProgressCircle } from './ProgressCircle';
import { Phone, User, Activity, AlertCircle, HeartPulse, Pill, Syringe, ArrowRight, ScanSearch } from 'lucide-react';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

export const ProfileOverview: React.FC = () => {
    const { profile, stats, isLoading } = useProfile();
    const navigate = useNavigate();

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    if (!profile) return null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Row 1: Completion Card */}
            <motion.div variants={item} className="bg-white p-6 rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:shadow-md transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <div className="flex-shrink-0 relative z-10 scale-90">
                    <ProgressCircle percentage={stats?.profile_completion_percentage || 0} size={100} strokeWidth={8} color="text-teal-500" />
                </div>
                <div className="text-center md:text-right flex-1 relative z-10 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">حالة الملف الشخصي</h3>
                    {stats?.profile_completion_percentage === 100 ? (
                        <p className="text-slate-500 text-base leading-relaxed">
                            <span className="text-emerald-600 font-black">ممتاز!</span> ملفك الشخصي مكتمل بالكامل. هذا يساعدنا على تقديم أفضل رعاية صحية لك وتخصيص تجربتك بشكل أدق.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                                لم يكتمل ملفك الشخصي بعد. استكمال البيانات يساعد أطباءنا في تشخيص حالتك بدقة أكبر.
                            </p>
                            <button
                                onClick={() => navigate('basic')}
                                className="inline-flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700 transition-colors text-sm group/btn bg-teal-50 px-4 py-1.5 rounded-full hover:bg-teal-100"
                            >
                                إكمال الملف الآن
                                <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:-translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>



            {/* Row 2: Lab Test OCR Banner Premium Dark Mode */}
            <motion.div variants={item}>
                <div onClick={() => navigate('/patient/medical-files/lab-tests')} className="bg-slate-950 p-7 rounded-[2rem] cursor-pointer hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-white/10">
                    {/* Background decorations */}
                    <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-[3rem] pointer-events-none transition-transform group-hover:scale-150 duration-700"></div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-purple-500/20 rounded-full blur-[3rem] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                    
                    <div className="flex items-start md:items-center gap-5 w-full md:w-auto relative z-10">
                        <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500 shadow-[0_4px_20px_rgb(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
                            <ScanSearch className="w-7 h-7 text-indigo-400 relative z-10" />
                        </div>
                        <div className="text-right">
                            <div className="flex w-full md:items-center flex-col md:flex-row gap-2 md:gap-3 mb-2">
                                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">التحليل الذكي للتقارير (OCR)</h3>
                                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center justify-center w-fit gap-1.5 backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                                    تقنية مدعومة بالذكاء الاصطناعي
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed group-hover:text-slate-300 transition-colors">
                                ارفعي صورة التحاليل الطبية وسيقوم المساعد الذكي بتفسيرها وتبسيطها فوراً مع تقديم نصائح مخصصة.
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex justify-end shrink-0 relative z-10">
                         <div className="bg-white text-slate-950 font-black px-6 py-3.5 md:py-4 rounded-[1.1rem] flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:-translate-x-1 transition-all border border-white/20 text-[13px] md:text-[14px]">
                             جربي الخدمة الآن
                             <ArrowRight className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                         </div>
                    </div>
                </div>
            </motion.div>

            {/* Row 3: BMI and Emergency Contact */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BMI Card */}
                <div className="h-full">
                    <BMICard
                        bmi={stats?.bmi}
                        category={stats?.bmi_category}
                        height={profile.profile?.height}
                        weight={profile.profile?.weight}
                        className="h-full min-h-[280px] shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow"
                    />
                </div>

                {/* Emergency Contact */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-orange-50 rounded-full translate-x-8 -translate-y-8 blur-2xl opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-0.5">جهة اتصال الطوارئ</h3>
                                <p className="text-xs text-slate-500 font-medium">للحالات الطارئة فقط</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>

                        {profile.profile?.emergency_contact_name ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-orange-100 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5 font-medium">الاسم الكامل</p>
                                        <p className="font-bold text-slate-800 text-base">{profile.profile.emergency_contact_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-orange-100 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5 font-medium">رقم الهاتف</p>
                                        <p className="font-bold text-slate-800 text-lg font-mono tracking-wider" dir="ltr">{profile.profile.emergency_contact_phone}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 hover:border-orange-200 transition-colors group cursor-pointer" onClick={() => navigate('emergency')}>
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto text-slate-300 mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <User className="w-6 h-6 group-hover:text-orange-400 transition-colors" />
                                </div>
                                <p className="text-slate-500 mb-4 text-sm font-medium">لم يتم إضافة جهة اتصال للطوارئ</p>
                                <button className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm active:scale-95 text-xs">
                                    + إضافة جهة اتصال
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
