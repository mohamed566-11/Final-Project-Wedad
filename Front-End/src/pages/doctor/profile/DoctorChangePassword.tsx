import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { doctorService } from '@/services/doctorService';
import { Save, Loader2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Schema Validation
const schema = yup.object().shape({
    current_password: yup.string().required('كلمة المرور الحالية مطلوبة'),
    new_password: yup.string()
        .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
        .max(20, 'كلمة المرور الجديدة يجب ألا تزيد عن 20 حرف')
        .required('كلمة المرور الجديدة مطلوبة'),
    new_password_confirmation: yup.string()
        .oneOf([yup.ref('new_password')], 'تأكيد كلمة المرور غير متطابق')
        .required('تأكيد كلمة المرور مطلوب'),
});

const DoctorChangePassword = () => {
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: any) => {
        setIsUpdatingPassword(true);
        try {
            await doctorService.changePassword(data);
            toast.success('تم تغيير كلمة المرور بنجاح');
            reset();
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.errors?.current_password?.[0] ||
                'حدث خطأ أثناء تغيير كلمة المرور';
            toast.error(message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const togglePasswordVisibility = (
        fieldSetter: React.Dispatch<React.SetStateAction<boolean>>,
        currentState: boolean
    ) => {
        fieldSetter(!currentState);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">تغيير كلمة المرور</h1>
                    <p className="text-slate-500 mt-1">قم بتحديث كلمة المرور الخاصة بك لتأمين حسابك</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="group relative bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-500"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 transition-transform duration-700 opacity-50"></div>

                <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100/80 relative z-10">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm border border-slate-200/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <Lock className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">كلمة المرور</h2>
                        <p className="text-slate-600 text-sm md:text-base mt-1 font-medium leading-relaxed">تأكد من اختيار كلمة مرور قوية</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-1.5 md:w-1/2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            كلمة المرور الحالية
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                {...register('current_password')}
                                className={cn(
                                    "w-full pl-10 pr-4 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-medium text-sm",
                                    errors.current_password
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10 group-hover:border-slate-300"
                                )}
                                placeholder="أدخل كلمة المرور الحالية"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility(setShowCurrentPassword, showCurrentPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                            </button>
                        </div>
                        {errors.current_password && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle width={10} /> {errors.current_password.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                كلمة المرور الجديدة
                                <span className="text-cyan-600">*</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    {...register('new_password')}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-medium text-sm",
                                        errors.new_password
                                            ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                            : "border-slate-200 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10 group-hover:border-slate-300"
                                    )}
                                    placeholder="أدخل كلمة المرور الجديدة"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(setShowNewPassword, showNewPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                                </button>
                            </div>
                            {errors.new_password && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle width={10} /> {errors.new_password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                تأكيد كلمة المرور
                                <span className="text-cyan-600">*</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    {...register('new_password_confirmation')}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-medium text-sm",
                                        errors.new_password_confirmation
                                            ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                            : "border-slate-200 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10 group-hover:border-slate-300"
                                    )}
                                    placeholder="أعد إدخال كلمة المرور"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(setShowConfirmPassword, showConfirmPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                                </button>
                            </div>
                            {errors.new_password_confirmation && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle width={10} /> {errors.new_password_confirmation.message}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transform text-sm"
                        >
                            {isUpdatingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري التغيير...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    تغيير كلمة المرور
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default DoctorChangePassword;
