import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Pill, Printer, ArrowRight, User, Calendar, Clock,
  Stethoscope, ShieldCheck, FileText, Loader2, AlertCircle,
  Download, CheckCircle2, Timer, Sparkles, MapPin, Video
} from 'lucide-react';
import { consultationService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';

interface PrescriptionData {
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
  consultation: {
    id: number;
    date: string;
    type: string;
    patient_notes?: string;
  } | null;
  doctor: {
    id: number;
    name: string;
    specialization: string;
    clinic_address?: string;
    image_url: string | null;
  } | null;
  patient: {
    id: number;
    name: string;
    age?: number;
  };
  created_at: string;
  created_at_formatted: string;
}

export const PrescriptionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!id) return;
      try {
        // Try fetching by consultation ID
        const res = await consultationService.getPrescriptionByConsultation(parseInt(id));
        if (res.status && res.data) {
          setPrescription(res.data);
        } else {
          setError('الوصفة الطبية غير متوفرة لهذه الاستشارة');
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('لا توجد وصفة طبية لهذه الاستشارة بعد');
        } else {
          setError('لم نتمكن من جلب الوصفة الطبية');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPrescription();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4" dir="rtl">
        <div className="w-20 h-20 rounded-[24px] bg-purple-50 flex items-center justify-center animate-pulse">
          <Pill className="w-10 h-10 text-purple-400" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <p className="text-slate-400 font-bold text-sm">جاري تحميل الوصفة الطبية...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-10 rounded-[40px] shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-purple-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Pill className="w-10 h-10 text-purple-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">الوصفة غير متاحة</h2>
          <p className="text-slate-500 font-bold mb-8 leading-relaxed">
            {error || 'لم يتم إصدار وصفة طبية لهذه الاستشارة بعد'}
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="w-full h-14 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للاستشارة
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans print:bg-white print:pb-0" dir="rtl">

      {/* Action Bar – hidden when printing */}
      <div className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            عودة
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-xl">
              <Pill className="w-3.5 h-3.5" />
              <span className="text-xs font-black">وصفة طبية #{prescription.id}</span>
            </div>
            <Button
              onClick={handlePrint}
              className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 font-black text-sm gap-2 shadow"
            >
              <Printer className="w-4 h-4" />
              طباعة الوصفة
            </Button>
          </div>
        </div>
      </div>

      {/* Prescription Card */}
      <div className="max-w-3xl mx-auto px-4 pt-8 print:p-0 print:max-w-none print:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          id="prescription-content"
          className="bg-white shadow-2xl shadow-slate-200/60 rounded-[40px] overflow-hidden print:shadow-none print:rounded-none"
        >
          {/* Top gradient strip */}
          <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 print:bg-purple-600" />

          {/* Header */}
          <div className="p-8 md:p-10 pb-8 border-b border-slate-100">
            <div className="flex items-start justify-between gap-6">
              {/* Clinic / Platform info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center print:w-6 print:h-6">
                    <Pill className="w-4 h-4 text-white print:w-3 print:h-3" />
                  </div>
                  <h1 className="text-2xl font-black text-purple-700 print:text-xl">منصة وداد</h1>
                </div>
                <p className="text-slate-400 font-bold text-sm">للرعاية الصحية المتكاملة</p>
                <div className="flex items-center gap-1.5 mt-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">وصفة طبية إلكترونية معتمدة</span>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="text-left rtl:text-right">
                <div className="flex items-center gap-3 justify-end mb-2 rtl:justify-start">
                  {prescription.doctor?.image_url ? (
                    <img
                      src={prescription.doctor.image_url}
                      alt={prescription.doctor.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-100 print:w-10 print:h-10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-300" />
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-900 text-base">
                      {prescription.doctor ? `د. ${prescription.doctor.name}` : 'الطبيب المعالج'}
                    </p>
                    {prescription.doctor?.specialization && (
                      <p className="text-purple-600 font-bold text-sm">{prescription.doctor.specialization}</p>
                    )}
                  </div>
                </div>
                {prescription.doctor?.clinic_address && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{prescription.doctor.clinic_address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient & Date Info */}
          <div className="px-8 md:px-10 py-6 bg-slate-50/50 border-b border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">المريضة</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400 shrink-0" />
                  <p className="font-black text-slate-900 text-sm">{prescription.patient?.name || '—'}</p>
                </div>
                {prescription.patient?.age && (
                  <p className="text-slate-400 text-xs font-bold mt-1 mr-6">{prescription.patient.age} سنة</p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">تاريخ الإصدار</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                  <p className="font-black text-slate-900 text-sm">
                    {prescription.consultation?.date
                      ? new Date(prescription.consultation.date).toLocaleDateString('ar-EG', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })
                      : prescription.created_at_formatted}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">نوع الاستشارة</p>
                <div className="flex items-center gap-2">
                  {prescription.consultation?.type === 'video'
                    ? <Video className="w-4 h-4 text-blue-400 shrink-0" />
                    : <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  }
                  <p className="font-black text-slate-900 text-sm">
                    {prescription.consultation?.type === 'video' ? 'استشارة فيديو' : 'كشف عيادة'}
                  </p>
                </div>
                <p className="text-slate-400 text-xs font-bold mt-1 mr-6">
                  رقم الاستشارة: #{prescription.consultation_id}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 md:p-10 space-y-8">

            {/* Diagnosis */}
            {prescription.diagnosis && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">التشخيص الطبي</h3>
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Clinical Diagnosis</p>
                  </div>
                </div>
                <div className="bg-blue-50/60 rounded-2xl p-6 border border-blue-100 leading-relaxed text-slate-700 font-medium">
                  {prescription.diagnosis}
                </div>
              </div>
            )}

            {/* Medications — Rx */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Pill className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      الأدوية الموصوفة
                      <span className="text-2xl text-emerald-600 leading-none font-black">Rx</span>
                    </h3>
                    <p className="text-purple-600 text-[10px] font-black uppercase tracking-widest">
                      Prescribed Medications • {prescription.medications?.length || 0} أدوية
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {prescription.medications?.map((med, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-purple-200 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Number badge */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="font-black text-slate-900 text-base">{med.name}</h4>
                          <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-0.5 rounded-lg text-sm font-bold">
                            {med.dosage}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-bold">
                          {med.frequency && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{med.frequency}</span>
                            </div>
                          )}
                          {med.duration && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <Timer className="w-3.5 h-3.5 text-slate-400" />
                              <span>لمدة {med.duration}</span>
                            </div>
                          )}
                        </div>

                        {med.notes && (
                          <p className="text-slate-400 text-xs font-medium mt-3 italic border-r-2 border-slate-200 pr-3">
                            ملاحظة: {med.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            {prescription.notes && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">تعليمات وإرشادات إضافية</h3>
                </div>
                <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-100 text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-line">
                  {prescription.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer / Signature */}
          <div className="px-8 md:px-10 pb-10">
            <div className="border-t-2 border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Signature box */}
              <div className="text-center">
                <div className="h-16 w-40 border-b-2 border-slate-300 mb-2 flex items-end justify-center pb-2">
                  <Sparkles className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">توقيع الطبيب المعالج</p>
                <p className="text-slate-900 font-black text-sm mt-1">
                  {prescription.doctor ? `د. ${prescription.doctor.name}` : ''}
                </p>
              </div>

              {/* Verification stamp */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-purple-200 flex items-center justify-center bg-purple-50">
                  <div className="text-center">
                    <CheckCircle2 className="w-6 h-6 text-purple-500 mx-auto mb-0.5" />
                    <p className="text-purple-600 text-[8px] font-black">معتمد</p>
                  </div>
                </div>
              </div>

              {/* Legal blurb */}
              <div className="text-left rtl:text-right max-w-xs">
                <p className="text-slate-400 text-xs font-bold leading-relaxed">
                  تم إصدار هذه الوصفة إلكترونياً عبر منصة وداد للرعاية الصحية.
                  <br />
                  رقم الوصفة: {prescription.id} • {prescription.created_at_formatted}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          #prescription-content { border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};
