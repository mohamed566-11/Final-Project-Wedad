import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { BMICard } from './BMICard';
import { ProgressCircle } from './ProgressCircle';
import { CheckCircle2, XCircle, LayoutDashboard, Calendar, Clock, Hash, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const ProfileStats: React.FC = () => {
  const { stats, profile, isLoading } = useProfile();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (!stats) return null;

  const missingFieldsTrans = {
    'name': 'الاسم',
    'age': 'العمر',
    'phone': 'رقم الهاتف',
    'image': 'الصورة الشخصية',
    'height': 'الطول',
    'weight': 'الوزن',
    'blood_type': 'فصيلة الدم',
    'date_of_birth': 'تاريخ الميلاد',
    'emergency_contact_name': 'اسم الطوارئ',
    'emergency_contact_phone': 'هاتف الطوارئ'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Score */}
        <div className="group bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-primary-900/20 transition-transform duration-500 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:opacity-10 transition-opacity duration-700"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary-900 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1 opacity-95">نقاط الصحة</h3>
                <p className="text-xs opacity-80 font-medium bg-black/10 px-2.5 py-1 rounded-full inline-block backdrop-blur-md border border-white/10">مؤشر حيوي شامل</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                <PartyPopper className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-6">
              <span className="text-6xl font-black tracking-tighter drop-shadow-sm">{stats.health_score}</span>
              <span className="text-xl opacity-70 font-medium">/ 100</span>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex justify-between text-sm font-medium opacity-90 mb-2">
                <span>مستوى التقدم</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs select-none">
                  {stats.health_score >= 80 ? 'ممتاز 🌟' : stats.health_score >= 50 ? 'جيد 👍' : 'يحتاج تحسين ⚠️'}
                </span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-blue-300 to-primary-200 rounded-full shadow-lg transition-all duration-1000 ease-out relative"
                  style={{ width: `${stats.health_score}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-40 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Status */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800">اكتمال الملف</h3>
              <p className="text-slate-500 text-[10px] font-medium mt-1">تتبع البيانات المفقودة</p>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-full border border-slate-100">
              <ProgressCircle percentage={stats.profile_completion_percentage} size={50} strokeWidth={5} showText={true} color="text-primary-500" />
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[180px] custom-scrollbar pr-2 relative z-10">
            {stats.missing_fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-4 bg-primary-50/50 rounded-xl border border-primary-100">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-2 animate-bounce shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-primary-800 text-sm">ملفك مكتمل بالكامل!</h4>
                <p className="text-primary-600 text-[10px] mt-0.5 font-medium">أنت جاهز للحصول على أفضل رعاية</p>
              </div>
            ) : (
              stats.missing_fields.map((field: string) => (
                <div key={field} className="group flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl transition-all duration-300 border border-slate-100 hover:border-slate-200">
                  <span className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                    {missingFieldsTrans[field as keyof typeof missingFieldsTrans] || field}
                  </span>
                  <button
                    onClick={() => {
                      if (['name', 'age', 'phone', 'image'].includes(field)) navigate('/patient/profile/basic');
                      else if (['emergency_contact_name', 'emergency_contact_phone'].includes(field)) navigate('/patient/profile/emergency');
                      else navigate('/patient/profile/medical');
                    }}
                    className="text-white bg-slate-900 border-slate-900 hover:bg-primary-600 hover:border-primary-600 text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-200 shadow-sm font-bold"
                  >
                    إكمال
                  </button>
                </div>
              ))
            )}
          </div>
          {/* Decorative background element behind listing */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50 rounded-tl-[80px] opacity-50 pointer-events-none"></div>
        </div>
      </div>

      <BMICard
        bmi={stats.bmi}
        category={stats.bmi_category}
        height={profile.profile?.height}
        weight={profile.profile?.weight}
        className="bg-white min-h-[250px] rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100"
      />

      <div className="bg-white p-6 rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <LayoutDashboard className="w-32 h-32" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5 relative z-10">
          <span className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
            <LayoutDashboard className="w-4.5 h-4.5" />
          </span>
          معلومات إضافية
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative z-10 block">
          <InfoCard
            label="العمر المحسوب"
            value={profile.profile?.age_calculated ? `${profile.profile.age_calculated} سنة` : '--'}
            icon={<PartyPopper className="w-4.5 h-4.5 text-amber-500" />}
            bg="bg-amber-50"
            border="border-amber-100"
          />
          <InfoCard
            label="تاريخ الانضمام"
            value={profile.joined_at}
            icon={<Calendar className="w-4.5 h-4.5 text-blue-500" />}
            bg="bg-blue-50"
            border="border-blue-100"
          />
          <InfoCard
            label="آخر تحديث"
            value={stats.last_updated || 'لم يتم التحديث'}
            icon={<Clock className="w-4.5 h-4.5 text-emerald-500" />}
            bg="bg-emerald-50"
            border="border-emerald-100"
          />
          <InfoCard
            label="رقم الملف التعريفي"
            value={`#${profile.id.toString().padStart(6, '0')}`}
            icon={<Hash className="w-4.5 h-4.5 text-violet-500" />}
            bg="bg-violet-50"
            border="border-violet-100"
          />
        </div>
      </div>
    </motion.div>
  );
};

// Helper Component for Info Cards
const InfoCard = ({ label, value, icon, bg, border }: { label: string, value: string, icon: React.ReactNode, bg: string, border: string }) => (
  <div className={cn("p-4 rounded-xl transition-all duration-300 hover:shadow-md border flex flex-col items-center text-center group bg-white hover:-translate-y-1", border)}>
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-2.5 transition-colors", bg)}>
      {icon}
    </div>
    <p className="text-[10px] text-slate-500 mb-0.5 font-bold">{label}</p>
    <p className="text-base font-black text-slate-800">{value}</p>
  </div>
);