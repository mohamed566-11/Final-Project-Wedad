import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, FileText, Search, Clock, Calendar, CheckCircle2,
  ChevronLeft, Loader2, Hospital, Package
} from 'lucide-react';
import { consultationService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const res = await consultationService.getDoctorPrescriptions();
        if (res.status && res.data) {
          // Adjust based on typical Laravel resource pagination or raw array
          setPrescriptions(res.data.data || res.data || []);
        } else {
          setError('حدث خطأ أثناء جلب الوصفات الطبية');
        }
      } catch (err) {
        setError('تعذر الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!search) return true;
    const nameMatch = p.patient?.name?.toLowerCase().includes(search.toLowerCase());
    const idMatch = p.id.toString().includes(search);
    return nameMatch || idMatch;
  });

  return (
    <div className="flex-1 w-full relative">
      <div className="p-6 md:p-8 space-y-8" dir="rtl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 border border-purple-200">
                <FileText className="w-3.5 h-3.5" />
                أرشيف الوصفات الطبية
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">الوصفات المصدرة</h1>
            <p className="text-slate-500 font-medium">قائمة الوصفات الطبية التي قمت بإصدارها للمرضى</p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 relative z-10"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المريض أو رقم الوصفة..."
              className="pl-4 pr-12 h-14 bg-slate-50/50 border-slate-200 rounded-2xl w-full text-base focus-visible:ring-purple-500/20 focus-visible:border-purple-500 font-bold placeholder:font-medium placeholder:text-slate-400"
            />
          </div>
        </motion.div>

        {/* List Section */}
        {error && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-600 rounded-2xl">
            {error}
          </Alert>
        )}

        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-3xl h-40 animate-pulse border border-slate-100 shadow-sm" />
              ))}
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white rounded-[40px] border border-slate-200 shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">لا توجد وصفات طبية</h3>
              <p className="text-slate-500 font-bold">لم تقم بإصدار أي وصفات طبية بعد، أو لا توجد نتائج للبحث.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AnimatePresence>
                {filteredPrescriptions.map((prescription, idx) => (
                  <motion.div
                    key={prescription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/doctor/consultations/${prescription.consultation_id}/prescription`)}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 mb-3 border border-purple-100">
                          <Pill className="w-3.5 h-3.5" />
                          وصفة رقم #{prescription.id}
                        </span>
                        <h3 className="font-black text-slate-900 text-lg group-hover:text-purple-600 transition-colors">
                          المريض: {prescription.patient?.name || 'غير معروف'}
                        </h3>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {prescription.created_at_formatted || 'حديث'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-slate-400" />
                        {prescription.medications?.length || 0} أدوية
                      </div>
                      <div className="flex items-center gap-1.5 mr-auto text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        معتمدة
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptions;

