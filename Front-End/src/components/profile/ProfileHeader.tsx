import React from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Camera, Edit2, User, Mail, Calendar, Sparkles, ShieldCheck, LayoutDashboard, ChevronLeft, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileHeaderProps {
  onEditClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditClick }) => {
  const { profile } = useProfile();

  if (!profile) return null;

  return (
    <div className="relative mb-6 group rounded-[2.5rem] bg-white border border-slate-100/50 shadow-sm overflow-hidden mt-6">
      {/* Return to Dashboard */}
      <Link
        to="/patient/dashboard"
        className="absolute top-6 right-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/50 backdrop-blur-md border border-white/40 text-slate-800 rounded-2xl transition-all duration-300 active:scale-95 group/btn"
        title="العودة إلى لوحة التحكم"
      >
        <LayoutDashboard className="w-4 h-4 group-hover/btn:scale-110 transition-transform text-slate-700" />
        <span className="font-bold text-sm hidden md:inline text-slate-700">لوحة التحكم</span>
      </Link>

      {/* Elegant Cover Gradient */}
      <div className="h-44 md:h-52 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-indigo-500"></div>
        {/* Soft elegant glows */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/20 mix-blend-overlay rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/20 mix-blend-overlay rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        {/* Fine grid pattern for premium tech feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Profile Content Container */}
      <div className="px-6 md:px-12 pb-8 pt-0 relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16 md:-mt-20">

        {/* Left Side: Avatar and Info */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="relative shrink-0"
          >
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-[2rem] border-4 md:border-[6px] border-white shadow-xl shadow-slate-200/50 overflow-hidden bg-white relative z-10 group/avatar">
              {profile.image_url ? (
                <img
                  src={profile.image_url}
                  alt={profile.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                  <User className="w-12 h-12 md:w-16 md:h-16 opacity-50" />
                </div>
              )}
              <div onClick={onEditClick} className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm gap-2">
                <Camera className="w-7 h-7 text-white drop-shadow-md" />
                <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">تغيير الصورة</span>
              </div>
            </div>
          </motion.div>

          {/* Info */}
          <div className="text-center md:text-right space-y-3 md:pb-2">
            <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                {profile.name}
                {profile.is_verified && (
                  <div className="bg-blue-50 text-blue-600 p-1 rounded-full border border-blue-100 shadow-sm" title="تم التحقق">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-slate-600 font-medium text-sm">
              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {profile.email}
              </span>

              {profile.life_stage && (
                <span className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl border border-primary-100 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  {profile.life_stage.name}
                </span>
              )}

              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-500 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>عضو منذ {profile.joined_at}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex-shrink-0 md:pb-2 flex flex-col sm:flex-row gap-3 w-full md:w-auto px-4 md:px-0">
          <Link
            to="/trackers/smart-band"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 active:scale-95 text-sm"
          >
            <Activity className="w-4 h-4" />
            <span>السوار الذكي</span>
          </Link>
          <button
            onClick={onEditClick}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300 active:scale-95 text-sm"
          >
            <Edit2 className="w-4 h-4" />
            <span>إدارة الملف الشخصي</span>
          </button>
        </div>

      </div>
    </div>
  );
};