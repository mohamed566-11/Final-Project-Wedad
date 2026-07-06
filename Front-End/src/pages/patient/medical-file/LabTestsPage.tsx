import { useState } from 'react';
import { useLabTests } from '../../../hooks/useLabTests';
import { LabTestUploader } from '../../../components/lab-tests/LabTestUploader';
import { ProcessingStatus } from '../../../components/lab-tests/ProcessingStatus';
import { LabTestHistory } from '../../../components/lab-tests/LabTestHistory';
import type { LabTest } from '../../../types/labTest';
import { ArrowRight, Beaker, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// الموديلات التي تستفيد من نتائج OCR
const AI_MODELS_USING_OCR = [
  { id: 'preeclampsia', nameAr: 'فحص تسمم الحمل', path: '/patient/ai-center/preeclampsia', fields: 'hb (الهيموجلوبين)' },
  { id: 'preterm', nameAr: 'الولادة المبكرة', path: '/patient/ai-center/preterm', fields: 'bs (سكر الدم)' },
  { id: 'scbu', nameAr: 'وحدة SCBU', path: '/patient/ai-center/scbu', fields: 'سكر الصائم، فيتامين D' },
];

export default function LabTestsPage() {
  const navigate = useNavigate();
  const {
    labTests,
    isLoading,
    upload,
    isUploading,
    isPolling,
    currentPollingId,
    deleteTest
  } = useLabTests();

  const pollingTest = labTests?.find(t => t.id === currentPollingId);
  // أي تحليل مكتمل → يُظهر البانر
  const hasCompletedTest = labTests?.some(t => t.status === 'completed');

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          <button
            onClick={() => navigate('/patient/profile/medical-files')}
            className="w-10 h-10 flex flex-shrink-0 items-center justify-center bg-gray-50 text-gray-500 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition"
          >
            <ArrowRight size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-xl">
              <Beaker size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">قراءة التحاليل الطبية بالذكاء الاصطناعي</h1>
              <p className="text-gray-500 text-sm mt-1">
                ارفعي صورة ورقة التحليل (صورة واضحة) وسيقوم الذكاء الاصطناعي باستخراج القيم وتحديد حالتها
              </p>
            </div>
          </div>
        </div>

        {/* Uploader Section */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <LabTestUploader onUpload={upload} isUploading={isUploading} />

          {isPolling && pollingTest && (
            <div className="mt-6">
              <ProcessingStatus status={pollingTest.status} />
            </div>
          )}
        </div>

        {/* ✅ OCR → AI Models Banner — يظهر فقط لو عندها تحليل مكتمل */}
        {hasCompletedTest && (
          <div className="bg-gradient-to-l from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <FlaskConical size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">نتائجك مستعدة للاستخدام في الفحوصات الذكية 🎯</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  سيتم تعبئة الحقول المناسبة تلقائياً عند فتح أيٍّ من هذه الفحوصات:
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AI_MODELS_USING_OCR.map(model => (
                <button
                  key={model.id}
                  onClick={() => navigate(model.path)}
                  className="flex flex-col items-start p-4 bg-white rounded-xl border border-purple-100 hover:border-purple-400 hover:shadow-md transition-all text-right group"
                >
                  <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 mb-1">{model.nameAr}</span>
                  <span className="text-xs text-slate-400">{model.fields}</span>
                  <span className="text-xs font-bold text-purple-600 mt-2">افتح الفحص ←</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History Section */}
        <div>
          <h2 className="font-bold text-xl text-gray-900 mb-4 px-2">📜 سجل التحاليل المقروءة</h2>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-white border rounded-xl h-24 shadow-sm" />
              ))}
            </div>
          ) : (
            <LabTestHistory
              tests={labTests ?? []}
              onDelete={deleteTest}
              onView={(test) => navigate(`/patient/medical-files/lab-tests/${test.id}`, { state: { test } })}
            />
          )}
        </div>

      </div>
    </div>
  );
}

