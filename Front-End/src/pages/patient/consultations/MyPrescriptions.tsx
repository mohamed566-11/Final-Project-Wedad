import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, FileText, Calendar, ChevronLeft, User, Loader2,
  AlertCircle, Search, Stethoscope, Clock, ArrowUpRight,
  Sparkles, ShieldCheck, Filter, RefreshCw
} from 'lucide-react';
import { consultationService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/common/BackButton';

interface Prescription {
  id: number;
  consultation_id: number;
  diagnosis: string | null;
  notes: string | null;
  medications: Array<{
    name: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    notes?: string;
  }>;
  medications_count: number;
  consultation: {
    id: number;
    date: string;
    type: string;
  } | null;
  doctor: {
    id: number;
    name: string;
    specialization: string;
    image_url: string | null;
  } | null;
  created_at: string;
  created_at_human: string;
}

const MyPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrescriptions = async (p = 1, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await consultationService.getMyPrescriptions({ page: p, per_page: 12 });
      if (res.status) {
        setPrescriptions(res.data.prescriptions.data || []);
        setPagination(res.data.pagination);
      }
    } catch (e: any) {
      setError('لم نتمكن من جلب الوصفات الطبية');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const filtered = prescriptions.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.doctor?.name?.toLowerCase().includes(q) ||
      p.diagnosis?.toLowerCase().includes(q) ||
      p.medications?.some(m => m.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-32 font-sans" dir="rtl">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Pill className="w-4 h-4 text-purple-600" />
              </div>
              <h1 className="text-base font-black text-slate-900">وصفاتي الطبية</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchPrescriptions(page, true)}
            disabled={refreshing}
            className="rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-l from-purple-700 via-purple-600 to-indigo-600 rounded-[32px] p-8 overflow-hidden shadow-2xl shadow-purple-600/25"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
          <div className="absolute top-4 left-4 w-3 h-3 bg-white/30 rounded-full" />
          <div className="absolute top-12 left-16 w-2 h-2 bg-white/20 rounded-full" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-6 bg-white/50 rounded-full" />
                <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">Electronic Prescriptions</p>
              </div>
              <h2 className="text-white text-2xl font-black mb-2 leading-tight">
                الوصفات الطبية
                <br />
                <span className="text-purple-200">الإلكترونية</span>
              </h2>
              <p className="text-white/60 text-sm font-bold leading-relaxed">
                جميع وصفاتك الطبية الصادرة من أطبائك<br />في مكان واحد آمن ومنظم
              </p>
            </div>
            <div className="w-24 h-24 bg-white/10 rounded-[28px] flex items-center justify-center border border-white/10 backdrop-blur-sm shrink-0">
              <Pill className="w-12 h-12 text-white/80" />
            </div>
          </div>

          {/* Stats bar */}
          {pagination && (
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-white text-2xl font-black">{pagination.total}</p>
                <p className="text-white/60 text-xs font-bold mt-0.5">
                  {pagination.total === 0
                    ? 'لا توجد وصفات بعد'
                    : pagination.total === 1
                    ? 'وصفة طبية صادرة'
                    : 'وصفة طبية مكتملة'}
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-white text-2xl font-black">
                  {prescriptions.reduce((sum, p) => sum + (p.medications_count || 0), 0)}
                </p>
                <p className="text-white/60 text-xs font-bold mt-0.5">دواء موصوف في وصفاتك</p>
              </div>
              {prescriptions.some(p => p.diagnosis) && (
                <>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-white/70 text-xs font-bold">تشخيص طبي مكتمل</p>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحثي باسم الطبيب أو الدواء أو التشخيص..."
            className="w-full h-14 bg-white border border-slate-200 rounded-2xl pr-12 pl-4 text-slate-800 font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          )}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-purple-50 flex items-center justify-center animate-pulse">
              <Pill className="w-8 h-8 text-purple-400" />
            </div>
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <p className="text-slate-400 font-bold text-sm">جاري تحميل الوصفات...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 bg-red-50 rounded-[32px] border border-red-100"
          >
            <div className="w-16 h-16 bg-red-100 rounded-[20px] flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-bold">{error}</p>
            <Button
              onClick={() => fetchPrescriptions()}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6"
            >
              إعادة المحاولة
            </Button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 gap-5 bg-white rounded-[32px] border border-slate-100 shadow-sm"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[28px] flex items-center justify-center shadow-inner">
              <Pill className="w-12 h-12 text-purple-300" />
            </div>
            <div className="text-center">
              <h3 className="text-slate-900 font-black text-xl mb-3">
                {search ? 'لا توجد نتائج' : 'لا توجد وصفات طبية بعد'}
              </h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-xs mx-auto">
                {search
                  ? 'جربي كلمة بحث مختلفة'
                  : 'ستظهر هنا وصفاتك الطبية بعد اكتمال استشاراتك مع الأطباء'}
              </p>
            </div>
            {!search && (
              <Button
                onClick={() => navigate('/patient/consultations/doctors')}
                className="mt-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-8 font-black gap-2 shadow-lg shadow-purple-600/20"
              >
                <Stethoscope className="w-4 h-4" />
                احجزي استشارة الآن
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {search && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                {filtered.length} نتيجة بحث
              </p>
            )}
            <AnimatePresence>
              {filtered.map((prescription, index) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  index={index}
                  onClick={() => navigate(`/patient/consultations/${prescription.consultation_id}/prescription`)}
                />
              ))}
            </AnimatePresence>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { setPage(p => p - 1); fetchPrescriptions(page - 1); }}
                  disabled={page === 1}
                  className="rounded-xl px-6 font-bold border-slate-200"
                >
                  السابق
                </Button>
                <span className="text-sm font-black text-slate-600 bg-slate-100 px-4 py-2 rounded-xl">
                  {page} / {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  onClick={() => { setPage(p => p + 1); fetchPrescriptions(page + 1); }}
                  disabled={page === pagination.last_page}
                  className="rounded-xl px-6 font-bold border-slate-200"
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PrescriptionCard = ({
  prescription,
  index,
  onClick
}: {
  prescription: Prescription;
  index: number;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Colored top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-indigo-500" />

      <div className="p-6">
        <div className="flex items-start gap-5">
          {/* Doctor avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-[18px] overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-white shadow-md">
              {prescription.doctor?.image_url ? (
                <img
                  src={prescription.doctor.image_url}
                  alt={prescription.doctor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-7 h-7 text-purple-300" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center border-2 border-white">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-slate-900 font-black text-base leading-tight mb-1 group-hover:text-purple-700 transition-colors">
                  {prescription.doctor ? `د. ${prescription.doctor.name}` : 'طبيب غير محدد'}
                </h3>
                {prescription.doctor?.specialization && (
                  <p className="text-purple-600 font-bold text-xs">{prescription.doctor.specialization}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl border border-purple-100 shrink-0">
                <Pill className="w-3.5 h-3.5" />
                <span className="text-xs font-black">{prescription.medications_count} دواء</span>
              </div>
            </div>

            {/* Diagnosis */}
            {prescription.diagnosis && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 border border-slate-100">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">التشخيص</p>
                <p className="text-slate-700 font-bold text-sm leading-relaxed line-clamp-2">
                  {prescription.diagnosis}
                </p>
              </div>
            )}

            {/* Medications preview */}
            {prescription.medications && prescription.medications.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {prescription.medications.slice(0, 3).map((med, i) => (
                  <span
                    key={i}
                    className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-xs font-black border border-purple-100"
                  >
                    {med.name}
                    {med.dosage && <span className="text-purple-400 ml-1 font-medium">({med.dosage})</span>}
                  </span>
                ))}
                {prescription.medications.length > 3 && (
                  <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-black border border-slate-200">
                    +{prescription.medications.length - 3} أخرى
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">
                    {prescription.consultation?.date
                      ? new Date(prescription.consultation.date).toLocaleDateString('ar-EG', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                      : prescription.created_at}
                  </span>
                </div>
                {prescription.consultation?.type && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">
                      {prescription.consultation.type === 'video' ? '🎥 استشارة رقمية' : '🏥 كشف عيادة'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-black">عرض الوصفة</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MyPrescriptions;
