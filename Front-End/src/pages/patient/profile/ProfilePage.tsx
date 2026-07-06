import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import BackButton from '@/components/common/BackButton';
import { User, Activity, FileText, Phone, PieChart, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfilePage: React.FC = () => {
    const { profile, isLoading } = useProfile();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];

        if (lastSegment === 'profile') {
            setActiveTab('overview');
        } else {
            setActiveTab(lastSegment);
        }
    }, [location]);

    if (isLoading && !profile) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-primary-800 font-medium animate-pulse">جاري تحميل ملفك الشخصي...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: User, path: '/patient/profile' },
        { id: 'basic', label: 'المعلومات الأساسية', icon: FileText, path: 'basic' },
        { id: 'medical', label: 'المعلومات الطبية', icon: Activity, path: 'medical' },
        { id: 'medical-files', label: 'الملفات الطبية', icon: FileText, path: 'medical-files' },
        { id: 'emergency', label: 'الطوارئ', icon: Phone, path: 'emergency' },
        { id: 'stats', label: 'الإحصائيات', icon: PieChart, path: 'stats' },
        { id: 'password', label: 'كلمة المرور', icon: Lock, path: 'password' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-x-hidden font-cairo">
            {/* Elegant Background Decor */}
            <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-primary-50/60 to-transparent pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
                {/* Header */}
                <ProfileHeader onEditClick={() => navigate('basic')} />

                {/* Horizontal Navigation */}
                <div className="mt-8 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-x-auto no-scrollbar">
                        <nav className="flex items-center gap-2 min-w-max">
                            {tabs.map((tab) => {
                                const isOverview = tab.id === 'overview';
                                const isActive = isOverview ? activeTab === 'overview' : activeTab === tab.id;

                                return (
                                    <Link
                                        key={tab.id}
                                        to={tab.path}
                                        className={cn(
                                            "relative flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-300 group font-bold text-sm",
                                            isActive
                                                ? "text-primary-700"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeHorizontalTab"
                                                className="absolute inset-0 bg-primary-50 rounded-xl"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}

                                        <div className="relative z-10 flex items-center gap-2.5">
                                            <tab.icon className={cn(
                                                "w-4 h-4 transition-colors duration-300",
                                                isActive ? "text-primary-600" : "text-slate-400 group-hover:text-primary-500"
                                            )} />
                                            <span>{tab.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
