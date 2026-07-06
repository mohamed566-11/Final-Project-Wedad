import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useProfile } from '@/hooks/useProfile';
import { Save, Loader2, AlertCircle, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Schema Validation
const schema = yup.object().shape({
    emergency_contact_name: yup.string().required('اسم جهة الاتصال مطلوب'),
    emergency_contact_phone: yup.string().matches(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صحيح').required('رقم الهاتف مطلوب'),
});

export const EditEmergencyContact: React.FC = () => {
    const { profile, updateEmergencyContact, isUpdatingEmergency } = useProfile();

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            emergency_contact_name: '',
            emergency_contact_phone: ''
        }
    });

    useEffect(() => {
        if (profile?.profile) {
            setValue('emergency_contact_name', profile.profile.emergency_contact_name || '');
            setValue('emergency_contact_phone', profile.profile.emergency_contact_phone || '');
        }
    }, [profile, setValue]);

    const onSubmit = (data: any) => {
        // Add _method PUT for Laravel compatibility if needed, though usually not for JSON
        updateEmergencyContact({
            ...data,
            _method: 'PUT'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group relative bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-500"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 group-hover:scale-110 transition-transform duration-700 opacity-50"></div>

            <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100/80 relative z-10">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">معلومات الطوارئ</h2>
                    <p className="text-slate-600 text-sm md:text-base mt-1 font-medium leading-relaxed">شخص يمكننا التواصل معه في الحالات الطارئة لضمان سلامتك</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            اسم جهة الاتصال
                            <span className="text-teal-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                {...register('emergency_contact_name')}
                                className={cn(
                                    "w-full pl-4 pr-10 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-medium text-sm",
                                    errors.emergency_contact_name
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 group-hover:border-slate-300"
                                )}
                                placeholder="مثال: زوجي، والدي، أختي"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                        {errors.emergency_contact_name && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.emergency_contact_name.message}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            رقم الهاتف
                            <span className="text-teal-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                {...register('emergency_contact_phone')}
                                className={cn(
                                    "w-full pl-4 pr-10 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-mono text-right font-medium text-sm",
                                    errors.emergency_contact_phone
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 group-hover:border-slate-300"
                                )}
                                placeholder="01xxxxxxxxx"
                                dir="ltr"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Phone className="w-4 h-4" />
                            </div>
                        </div>
                        {errors.emergency_contact_phone && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1 text-right"><AlertCircle className="w-3 h-3" /> {errors.emergency_contact_phone.message}</p>}
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isUpdatingEmergency}
                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 active:scale-95 transform text-sm"
                    >
                        {isUpdatingEmergency ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                حفظ التغييرات
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};
