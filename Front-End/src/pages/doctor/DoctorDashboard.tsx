import React from 'react';
import { useDoctorDashboardStats } from '@/hooks/useDoctorQueries';
import {
  Users, Calendar, DollarSign, Star,
  Clock, Video, Loader2, Layout, ArrowRight,
  CalendarDays, Activity, AlertCircle, CalendarClock,
  TrendingUp, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: statsResponse, isLoading, isError, error } = useDoctorDashboardStats();
  const stats = statsResponse?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <p className="mb-2 font-bold text-lg text-foreground">عذراً، حدث خطأ أثناء تحميل البيانات</p>
        <p className="text-sm text-red-400 font-mono mb-6" dir="ltr">{(error as any)?.response?.data?.message || error?.message || 'يرجى المحاولة مرة أخرى لاحقاً'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary text-white rounded-2xl font-black hover:bg-primary-600 transition shadow-lg shadow-primary/20"
        >
          تحديث الصفحة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Layout className="w-72 h-72 -rotate-12" />
        </div>
        <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-black border border-white/15">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              لوحة التحكم الذكية
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">مرحباً بك مجدداً دكتور 👋</h1>
            <p className="text-slate-350 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              نحن سعداء برؤيتك! إليك ملخص سريع لأداء عيادتك الرقمية وتقويم مواعيدك لليوم.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/doctor/consultations')}
              className="bg-white text-[#1E1B4B] hover:bg-indigo-50 px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              جدول المواعيد
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الاستشارات"
          value={stats?.overview?.total_consultations}
          subtitle="هذا الشهر"
          subValue={stats?.overview?.this_month}
          icon={Calendar}
          color="text-blue-600 bg-blue-50 border-blue-100 ring-blue-500/10"
          gradient="from-blue-500/5 to-transparent"
        />
        <StatCard
          title="المرضى"
          value={stats?.patients?.total}
          subtitle="جدد هذا الشهر"
          subValue={stats?.patients?.new_this_month}
          icon={Users}
          color="text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-500/10"
          gradient="from-emerald-500/5 to-transparent"
        />
        <StatCard
          title="التقييم العام"
          value={stats?.rating?.average ? Number(stats?.rating?.average).toFixed(2) : '4.00'}
          subtitle="من إجمالي"
          subValue={`${stats?.rating?.total_reviews || 0} تقييم`}
          icon={Star}
          color="text-amber-600 bg-amber-50 border-amber-100 ring-amber-500/10"
          gradient="from-amber-500/5 to-transparent"
        />
        <StatCard
          title="الأرباح الكلية"
          value={<span dir="ltr" className="inline-block font-sans">{Number(stats?.earnings?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
          subtitle="هذا الشهر"
          subValue={<span dir="ltr" className="inline-block font-sans">{Number(stats?.earnings?.this_month || 0).toLocaleString('en-US')} ج.م</span>}
          currency="ج.م"
          icon={DollarSign}
          color="text-indigo-600 bg-indigo-50 border-indigo-150 ring-indigo-500/10"
          gradient="from-indigo-500/5 to-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {stats?.schedule?.next_consultation && (
            <div className="bg-white p-6 md:p-8 relative overflow-hidden group rounded-[32px] border border-slate-100/85 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
              <div className="absolute right-0 top-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pr-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[24px] bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500 relative">
                      <Users className="w-10 h-10 text-slate-300 absolute animate-pulse-slow" />
                      {stats.schedule.next_consultation.patient.image_url && (
                        <img
                          src={stats.schedule.next_consultation.patient.image_url}
                          alt={stats.schedule.next_consultation.patient.name || "مريض"}
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-indigo-100/50 uppercase tracking-wider">الاستشارة القادمة</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{stats.schedule.next_consultation.patient.name}</h3>
                    <p className="text-slate-400 font-bold flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span dir="ltr" className="text-xs">{stats.schedule.next_consultation.date} | {stats.schedule.next_consultation.time}</span>
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-left space-y-3">
                  <div className={cn(
                    "px-5 py-2.5 rounded-2xl font-black text-xs shadow-sm inline-block border",
                    stats.schedule.next_consultation.in_minutes <= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100/80"
                      : "bg-indigo-50 text-indigo-750 border-indigo-100/80"
                  )}>
                    {stats.schedule.next_consultation.in_minutes > 0
                      ? (() => {
                        const m = Math.round(stats.schedule.next_consultation.in_minutes);
                        if (m < 60) return `تبدأ خلال ${m} دقيقة`;
                        if (m < 1440) return `تبدأ خلال ${Math.round(m / 60)} ساعة`;
                        return `تبدأ خلال ${Math.round(m / 1440)} يوم`;
                      })()
                      : 'جارية الآن'}
                  </div>
                  <div>
                    <button
                      onClick={() => navigate(`/doctor/consultations/${stats.schedule.next_consultation.id}`)}
                      className="text-xs font-black text-indigo-650 hover:text-indigo-800 transition-colors flex items-center gap-1 mx-auto md:mx-0 md:mr-auto"
                    >
                      عرض تفاصيل الحالة
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100/80 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-indigo-600" />
                جدول مواعيد اليوم
              </h3>
              <button
                onClick={() => navigate('/doctor/consultations')}
                className="text-xs font-black text-indigo-700 bg-indigo-50/80 px-4 py-2.5 rounded-xl border border-indigo-100/40 hover:bg-indigo-100 transition-all active:scale-95"
              >
                عرض الجدول الكامل
              </button>
            </div>

            {stats?.schedule?.today_schedule?.length > 0 ? (
              <div className="space-y-4">
                {stats.schedule.today_schedule.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100/80 border border-transparent hover:border-slate-150 rounded-2xl transition-all group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center font-black border border-slate-100">
                        <span className="text-[9px] text-slate-400 leading-none">في تمام</span>
                        <span className="text-sm text-slate-700 leading-tight font-sans mt-0.5">{item.time}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-slate-800">{item.patient}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full",
                            item.status === 'confirmed' ? 'bg-emerald-500' :
                              item.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                          )} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{translateStatus(item.status)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/doctor/consultations/${item.id}`)}
                      className="opacity-0 group-hover:opacity-100 p-2.5 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50/40 rounded-3xl border border-dashed border-slate-150">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-slate-100/80">
                  <Calendar className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-lg font-black text-slate-700 mb-1">لا توجد مواعيد متبقية</h4>
                <p className="text-slate-400 text-sm font-bold italic">تمتع بوقت استراحة هادئ</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100/80 shadow-xl shadow-slate-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full -mr-16 -mt-16 pointer-events-none" />
            <h3 className="text-lg font-black text-slate-805 mb-6 flex items-center justify-between">
              مركز التنبيهات
              <Activity className="w-5 h-5 text-slate-300" />
            </h3>
            <div className="space-y-4">
              <div
                onClick={() => navigate('/doctor/consultations')}
                className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 group hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-slate-700 font-extrabold text-sm">إشعارات لم تقرأ</span>
                </div>
                <span className="bg-rose-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-black shadow-lg shadow-rose-500/20">{stats?.notifications?.unread || 0}</span>
              </div>
              <div
                onClick={() => navigate('/doctor/consultations?status=pending')}
                className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 group hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <span className="text-slate-700 font-extrabold text-sm">طلبات جديدة</span>
                </div>
                <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">{stats?.notifications?.new_consultations || 0}</span>
              </div>
              <div
                onClick={() => navigate('/doctor/consultations/prescriptions')}
                className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50 group hover:bg-purple-50 hover:border-purple-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-slate-700 font-extrabold text-sm">أرشيف الوصفات الطبية</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-purple-300 group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100/80 shadow-xl shadow-slate-100/50">
            <h3 className="text-lg font-black text-slate-805 mb-6 flex items-center justify-between">
              المحتوى الطبي
              <TrendingUp className="w-5 h-5 text-slate-300" />
            </h3>
            <div className="space-y-6 text-right">
              <div>
                <div className="flex justify-between text-xs font-black text-slate-450 mb-3">
                  <span>المقالات المنشورة</span>
                  <span className="text-emerald-600 font-sans">{stats?.articles?.approved}/{stats?.articles?.total}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(stats?.articles?.approved / (stats?.articles?.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">إجمالي التفاعل</span>
                  <span className="text-2xl font-black text-slate-800">{stats?.articles?.total_views} <span className="text-xs font-bold text-slate-400">مشاهدة</span></span>
                </div>
                <button
                  onClick={() => navigate('/doctor/articles')}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-transparent hover:border-indigo-100/50 transition-all active:scale-95 shadow-sm"
                >
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  subValue?: React.ReactNode;
  currency?: string;
  icon: any;
  color: string;
  gradient: string;
}

const StatCard = ({ title, value, subtitle, subValue, currency, icon: Icon, color, gradient }: StatCardProps) => (
  <div className="bg-white p-6 relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-500 rounded-[32px] border border-slate-100/80 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-500/5">
    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />
    <div className="relative z-10 flex flex-col gap-4">
      <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 border", color)}>
        <Icon size={26} />
      </div>
      <div className="space-y-1">
        <p className="text-slate-400 text-[10px] font-black tracking-wider uppercase">{title}</p>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1 text-slate-800">
            <h2 className="text-3xl font-black tracking-tight font-sans">{value}</h2>
            {currency && <span className="text-xs font-bold text-slate-450">{currency}</span>}
          </div>
          {subtitle && (
            <div className="flex items-center gap-1 py-1 px-2.5 bg-slate-50 text-[9px] font-extrabold text-slate-450 rounded-lg border border-slate-100/60">
              <span>{subtitle}</span>
              <span className="text-slate-650 font-black">{subValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    'confirmed': 'مؤكد',
    'pending': 'الانتظار',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'in_progress': 'جاري',
  };
  return map[status] || status;
}

export default DoctorDashboard;
