import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useProfile } from '@/hooks/useProfile';
import { ImageUpload } from '@/components/profile/ImageUpload';
import { Save, Loader2, Phone, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Schema Validation
const schema = yup.object().shape({
    name: yup.string().required('الاسم مطلوب'),
    age: yup.number().typeError('العمر يجب أن يكون رقماً').min(12, 'العمر يجب أن يكون 12 سنة على الأقل').max(100, 'العمر غير صحيح').required('العمر مطلوب'),
    phone: yup.string().matches(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صحيح').required('رقم الهاتف مطلوب'),
    life_stage_id: yup.string().required('يرجى اختيار المرحلة الحياتية'),
});

export const EditBasicInfo: React.FC = () => {
    const { profile, lifeStages, updateBasicInfo, isUpdatingBasic, deleteImage, isDeletingImage } = useProfile();
    const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            age: undefined,
            phone: '',
            life_stage_id: ''
        }
    });

    useEffect(() => {
        if (profile) {
            setValue('name', profile.name);
            setValue('age', profile.age);
            setValue('phone', profile.phone || '');
            setValue('life_stage_id', profile.life_stage_id?.toString() || '');
            setPreviewImage(profile.image_url);
        }
    }, [profile, setValue]);

    const handleImageUpload = (file: File) => {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleImageDelete = () => {
        if (selectedImage) {
            setSelectedImage(null);
            setPreviewImage(profile?.image_url || null);
        } else if (profile?.image_url) {
            deleteImage(undefined, {
                onSuccess: () => setPreviewImage(null)
            });
        }
    };

    const onSubmit = (data: any) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('age', data.age);
        formData.append('phone', data.phone);
        formData.append('life_stage_id', data.life_stage_id);

        // Only append image if a new one is selected
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        // Using _method PUT for Laravel to handle multipart/form-data correctly
        formData.append('_method', 'PUT');

        updateBasicInfo(formData);
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
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <UserIcon className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">المعلومات الأساسية</h2>
                    <p className="text-slate-600 text-sm md:text-base mt-1 font-medium leading-relaxed">تحديث بياناتك الشخصية وصورتك للتعرف عليك بشكل أفضل</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload Section */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200 hover:border-teal-200 transition-colors">
                    <ImageUpload
                        currentImage={previewImage}
                        onUpload={handleImageUpload}
                        onDelete={previewImage ? handleImageDelete : undefined}
                        isLoading={isDeletingImage}
                    />
                    <p className="text-[10px] text-slate-400 mt-2 text-center max-w-[200px] font-medium">
                        يُفضل استخدام صورة مربعة بأبعاد 500x500 بكسل وبحجم أقل من 2 ميجابايت
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {/* Name */}
                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            الاسم الكامل
                            <span className="text-teal-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                {...register('name')}
                                className={cn(
                                    "w-full pl-3 pr-10 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-medium text-sm",
                                    errors.name
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 group-hover:border-slate-300"
                                )}
                                placeholder="أدخل اسمك الكامل كما يظهر في الهوية"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <UserIcon width={16} height={16} />
                            </div>
                        </div>
                        {errors.name && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle width={10} /> {errors.name.message}</p>}
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
                                {...register('phone')}
                                className={cn(
                                    "w-full pl-3 pr-10 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-mono text-right font-medium text-sm",
                                    errors.phone
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 group-hover:border-slate-300"
                                )}
                                placeholder="01xxxxxxxxx"
                                dir="ltr"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Phone width={16} height={16} />
                            </div>
                        </div>
                        {errors.phone && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1 text-right"><AlertCircle width={10} /> {errors.phone.message}</p>}
                    </div>

                    {/* Age */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            العمر
                            <span className="text-teal-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type="number"
                                {...register('age')}
                                className={cn(
                                    "w-full pl-3 pr-10 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none placeholder:text-slate-400 font-medium text-sm",
                                    errors.age
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 group-hover:border-slate-300"
                                )}
                                placeholder="مثال: 25"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Calendar width={16} height={16} />
                            </div>
                        </div>
                        {errors.age && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle width={10} /> {errors.age.message}</p>}
                    </div>

                    {/* Life Stage */}
                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            المرحلة الحياتية
                            <span className="text-teal-500">*</span>
                        </label>
                        <div className="relative group">
                            <select
                                {...register('life_stage_id')}
                                className={cn(
                                    "w-full pl-3 pr-10 py-3 rounded-xl border bg-white/60 backdrop-blur-md shadow-sm focus:bg-white transition-all duration-300 outline-none appearance-none cursor-pointer font-medium text-sm",
                                    errors.life_stage_id
                                        ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5"
                                        : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 group-hover:border-slate-300"
                                )}
                            >
                                <option value="">اختر المرحلة الحياتية الحالية...</option>
                                {lifeStages?.map((stage: any) => (
                                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Sparkles width={16} height={16} />
                            </div>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                        {errors.life_stage_id && <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mt-1"><AlertCircle width={10} /> {errors.life_stage_id.message}</p>}
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isUpdatingBasic}
                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 active:scale-95 transform text-sm"
                    >
                        {isUpdatingBasic ? (
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

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
