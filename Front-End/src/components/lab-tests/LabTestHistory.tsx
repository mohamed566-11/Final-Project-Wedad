import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash2, ExternalLink } from 'lucide-react';
import type { LabTest } from '../../types/labTest';

const statusMap: Record<string, { label: string; color: string }> = {
  completed:  { label: 'مكتمل', color: 'text-green-600 bg-green-50 border-green-100' },
  pending:    { label: 'في الانتظار', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  processing: { label: 'جاري القراءة', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  failed:     { label: 'فشل', color: 'text-red-600 bg-red-50 border-red-100' },
};

interface Props {
  tests: LabTest[];
  onDelete: (id: number) => void;
  onView: (test: LabTest) => void;
}

export function LabTestHistory({ tests, onDelete, onView }: Props) {
  if (!tests.length) {
    return (
      <div className="text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-12">
        <p className="text-gray-500 font-medium">لا توجد تحاليل سابقة مسجلة مقروءة</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tests.map(test => {
        const statusDetails = statusMap[test.status] || statusMap.pending;

        return (
          <div key={test.id} className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
            <div className="flex gap-4 items-center">
              
              {/* Image Thumbnail */}
              <div 
                className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden cursor-pointer bg-gray-50 flex-shrink-0"
                onClick={() => test.status === 'completed' && onView(test)}
              >
                <img src={test.image_url} alt="تحليل" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusDetails.color}`}>
                    {statusDetails.label}
                  </span>
                  
                  <span className="text-xs text-gray-400" dir="ltr">
                    {formatDistanceToNow(new Date(test.created_at), { locale: ar, addSuffix: true })}
                  </span>
                </div>
                
                <h4 className="font-bold text-gray-800 text-sm">
                  {test.tests_count > 0 ? `${test.tests_count} قيم مستخرجة` : 'صورة تحليل'}
                </h4>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
              <button 
                onClick={() => {
                  if (confirm('هل أنتِ متأكدة من حذف هذا التحليل والنتائج نهائياً؟')) {
                    onDelete(test.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                title="حذف التحليل"
              >
                <Trash2 size={16} />
              </button>

              {test.status === 'completed' && (
                <button 
                  onClick={() => onView(test)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
                >
                  <span>عرض النتيجة</span>
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
