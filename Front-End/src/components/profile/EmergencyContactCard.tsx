import React from 'react';
import { User, Phone, AlertTriangle, Edit3, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmergencyContactCardProps {
  name: string | null;
  phone: string | null;
  onEdit?: () => void;
  editable?: boolean;
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  name,
  phone,
  onEdit,
  editable = false
}) => {
  if (!name || !phone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-[2rem] border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center text-center space-y-4 hover:bg-slate-50 transition-colors duration-300"
      >
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-2">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-700">معلومات الطوارئ مفقودة</h3>
          <p className="text-slate-500 text-sm mt-1">لم يتم إضافة معلومات الاتصال في حالات الطوارئ</p>
        </div>
        {editable && onEdit && (
          <button
            onClick={onEdit}
            className="mt-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            إضافة معلومات الطوارئ
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-[2rem] shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden relative group"
    >
      <div className="absolute top-0 right-0 p-5 opacity-[0.03] pointer-events-none">
        <ShieldAlert className="w-24 h-24" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">معلومات الطوارئ</h3>
            <p className="text-slate-500 text-[10px] font-medium">للاستخدام في الحالات الحرجة فقط</p>
          </div>
        </div>
        {editable && onEdit && (
          <button
            onClick={onEdit}
            className="text-slate-400 hover:text-teal-600 p-1.5 hover:bg-teal-50 rounded-full transition-all duration-300"
            title="تعديل"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-slate-200 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{name}</p>
            <p className="text-[10px] text-slate-500 font-medium">جهة الاتصال</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-slate-200 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dir-ltr text-right">{phone}</p>
            <p className="text-[10px] text-slate-500 font-medium">رقم الهاتف</p>
          </div>
        </div>

        <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg flex items-start gap-2 mt-1">
          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] text-amber-700 font-medium leading-relaxed">
            سيتم استخدام هذه المعلومات للتواصل مع ذويك في حالات الطوارئ الطبية فقط.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyContactCard;