import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, LogIn, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthRequiredOverlayProps {
    feature: string;
    description?: string;
}

/**
 * Shows a beautiful overlay prompting users to login/register
 * to access tracker data and features
 */
export const AuthRequiredOverlay: React.FC<AuthRequiredOverlayProps> = ({
    feature,
    description = 'سجلي دخولك للوصول إلى بياناتك واستخدام جميع المميزات'
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)' }}
        >
            <div className="absolute inset-0 backdrop-blur-sm" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
                className="relative bg-white rounded-[3rem] shadow-2xl shadow-slate-200 p-8 md:p-12 max-w-xl w-full text-center border border-slate-100"
            >
                {/* Decorative elements */}
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full blur-3xl opacity-50" />
                <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-50" />

                <div className="relative z-10">
                    {/* Lock Icon */}
                    <motion.div
                        animate={{
                            rotate: [0, -10, 10, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200"
                    >
                        <Lock className="w-10 h-10 text-slate-400" />
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">
                        {feature}
                    </h2>

                    {/* Description */}
                    <p className="text-slate-500 text-lg mb-8 font-medium leading-relaxed max-w-md mx-auto">
                        {description}
                    </p>

                    {/* Features list */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {[
                            { icon: Sparkles, text: 'بيانات مخصصة' },
                            { icon: ShieldCheck, text: 'حماية خصوصيتك' },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100"
                            >
                                <item.icon className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-600">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/login" state={{ from: window.location.pathname }}>
                            <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all hover:scale-105">
                                <LogIn className="ml-2 w-5 h-5" />
                                تسجيل الدخول
                            </Button>
                        </Link>
                        <Link to="/register" state={{ from: window.location.pathname }}>
                            <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-lg font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all hover:scale-105">
                                <UserPlus className="ml-2 w-5 h-5" />
                                إنشاء حساب جديد
                            </Button>
                        </Link>
                    </div>

                    {/* Back link */}
                    <Link
                        to="/trackers"
                        className="inline-block mt-8 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                    >
                        العودة لمركز المتابعة ←
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AuthRequiredOverlay;
