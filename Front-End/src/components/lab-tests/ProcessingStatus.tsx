import type { LabTestStatus } from '../../types/labTest';

export function ProcessingStatus({ 
  status, 
  onRetry 
}: { 
  status: LabTestStatus; 
  onRetry?: () => void 
}) {
  const states = {
    pending:    { text: 'جاري رفع الصورة...', color: 'text-blue-600', spinner: true },
    processing: { text: 'جاري قراءة التحليل عبر الذكاء الاصطناعي...', color: 'text-purple-600', spinner: true },
    completed:  { text: 'تم استخراج النتائج بنجاح ✓', color: 'text-green-600', spinner: false },
    failed:     { text: 'فشل في قراءة الصورة', color: 'text-red-600', spinner: false },
  };

  const { text, color, spinner } = states[status];

  return (
    <div className={`flex items-center gap-3 ${color} my-4 bg-white p-4 rounded-xl border shadow-sm`}>
      {spinner && (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"/>
      )}
      <span className="font-medium flex-1">{text}</span>
      {status === 'failed' && onRetry && (
        <button onClick={onRetry} className="text-sm underline ml-2 hover:text-red-800">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
