import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle, Activity } from 'lucide-react';

interface BMICardProps {
  bmi?: number | null;
  category?: string | null;
  height?: number | null;
  weight?: number | null;
  className?: string;
}

export const BMICard: React.FC<BMICardProps> = ({
  bmi,
  category,
  height,
  weight,
  className
}) => {
  if (!bmi) {
    return (
      <div className={cn("bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-full", className)}>
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">مؤشر كتلة الجسم (BMI)</h3>
        <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
          أدخل الطول والوزن وسيتم حساب مؤشر كتلة الجسم وحالتك الصحية تلقائياً.
        </p>
      </div>
    );
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Normal':
      case 'Normal weight':
        return 'text-teal-700 bg-teal-50 border-teal-100 ring-teal-500/10';
      case 'Underweight':
        return 'text-blue-700 bg-blue-50 border-blue-100 ring-blue-500/10';
      case 'Overweight':
        return 'text-amber-700 bg-amber-50 border-amber-100 ring-amber-500/10';
      case 'Obese':
      case 'Obesity':
        return 'text-rose-700 bg-rose-50 border-rose-100 ring-rose-500/10';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-100 ring-slate-500/10';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Normal':
      case 'Normal weight':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Underweight':
        return <AlertCircle className="w-4 h-4" />;
      case 'Overweight':
        return <AlertTriangle className="w-4 h-4" />;
      case 'Obese':
      case 'Obesity':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPercentage = (value: number) => {
    // Clamp BMI between 15 and 40 for visualization
    const min = 15;
    const max = 40;
    const clamped = Math.min(Math.max(value, min), max);
    return ((clamped - min) / (max - min)) * 100;
  };

  const categoryAr = {
    'Underweight': 'نحافة',
    'Normal': 'وزن طبيعي',
    'Normal weight': 'وزن طبيعي',
    'Overweight': 'وزن زائد',
    'Obese': 'سمنة',
    'Obesity': 'سمنة'
  }[category || ''] || category;


  return (
    <div className={cn("bg-white p-5 rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100 h-full flex flex-col justify-between", className)}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 flex-wrap">
            مؤشر كتلة الجسم
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100/50 px-1.5 py-0.5 rounded-md">BMI</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            تحليل صحي للوزن والطول
          </p>
        </div>
        <div className={cn("px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ring-2 self-start sm:self-auto", getCategoryColor(category || ''))}>
          {getCategoryIcon(category || '')}
          {categoryAr}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative mb-3 px-1">
          {/* Main Gauge Bar */}
          <div className="h-6 w-full rounded-xl overflow-hidden flex relative shadow-inner ring-1 ring-slate-100">
            <div className="h-full w-[14%] bg-blue-50 border-r border-white/50 relative group"></div>
            <div className="h-full w-[26%] bg-teal-50 border-r border-white/50 relative group"></div>
            <div className="h-full w-[20%] bg-amber-50 border-r border-white/50 relative group"></div>
            <div className="h-full w-[40%] bg-rose-50 relative group"></div>
          </div>

          {/* Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-8 bg-slate-800 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-1000 ease-out z-10 ring-2 ring-white"
            style={{ left: `${getPercentage(bmi)}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[9px] font-bold text-slate-300 font-mono px-0.5 mt-1">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>

        <div className="flex flex-col items-center mt-6">
          <div className="text-5xl font-black text-slate-800 tracking-tighter leading-none mb-1 shadow-teal-100 drop-shadow-sm">
            {bmi}
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 mt-1">kg/m²</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-50">
        <div className="text-center p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">الوزن</p>
          <p className="text-xl font-black text-slate-700">{weight} <span className="text-[10px] font-medium text-slate-400">كغم</span></p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">الطول</p>
          <p className="text-xl font-black text-slate-700">{height} <span className="text-[10px] font-medium text-slate-400">سم</span></p>
        </div>
      </div>
    </div>
  );
};