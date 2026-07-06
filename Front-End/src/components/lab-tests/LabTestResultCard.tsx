import type { TestResult } from '../../types/labTest';
import { TestValueBadge } from './TestValueBadge';

export function LabTestResultCard({ test }: { test: TestResult }) {
  const colorMap = { 
    low: 'text-red-600', 
    high: 'text-orange-600', 
    normal: 'text-green-600' 
  };
  
  const normalizedStatus = test.status ? (test.status.toLowerCase() as keyof typeof colorMap) : null;
  const valueColor = normalizedStatus && colorMap[normalizedStatus] ? colorMap[normalizedStatus] : 'text-gray-800';

  return (
    <div className="relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-3 left-3">
        <TestValueBadge status={test.status} />
      </div>
      
      <h3 className="font-bold text-gray-800 text-sm mb-2 pr-1" title={test.test_name}>
        {test.test_name}
      </h3>
      
      <p className={`${test.value.length > 15 ? 'text-sm font-medium' : 'text-2xl sm:text-3xl font-extrabold'} ${valueColor} flex items-baseline gap-1`}>
        {test.value}
        {test.unit && <span className="text-xs sm:text-sm font-normal text-gray-500">{test.unit}</span>}
      </p>
      
      {test.reference_range && test.reference_range.trim() !== '' && (
        <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg inline-block">
          النطاق: <span dir="ltr">{test.reference_range}</span>
        </p>
      )}
    </div>
  );
}
