import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useProfile } from '@/hooks/useProfile';
import { Save, Loader2, HeartPulse, Activity, Baby, AlertTriangle, Plus, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { pregnancyService } from '@/services/pregnancyService';
import { useAuth } from '@/contexts/AuthContext';

// Validation Schema
const schema = yup.object().shape({
    height: yup.number().transform((v, o) => (o === '' || o === null ? null : Number(o))).nullable().min(100, 'الطول 100 سم على الأقل').max(250, 'الطول يجب ألا يتجاوز 250 سم'),
    weight: yup.number().transform((v, o) => (o === '' || o === null ? null : Number(o))).nullable().min(30, 'الوزن 30 كجم على الأقل').max(300, 'الوزن يجب ألا يتجاوز 300 كجم'),
    blood_type: yup.string().transform(v => v === '' ? null : v).nullable(),
    date_of_birth: yup.date().transform((curr, orig) => orig === '' ? null : curr).nullable().max(new Date(), 'يجب أن يكون في الماضي'),
    national_id: yup.string().transform(v => v === '' ? null : v).nullable().matches(/^[0-9]{14}$/, { message: 'يجب أن يتكون من 14 رقمًا', excludeEmptyString: true }),
    medical_history: yup.string().transform(v => v === '' ? null : v).nullable().max(5000, 'النص طويل جداً'),
    blood_pressure_systolic: yup.number().transform((v, o) => (o === '' || o === null ? null : Number(o))).nullable().min(60, 'القيمة غير صحيحة').max(250, 'القيمة غير صحيحة'),
    blood_pressure_diastolic: yup.number().transform((v, o) => (o === '' || o === null ? null : Number(o))).nullable().min(40, 'القيمة غير صحيحة').max(150, 'القيمة غير صحيحة'),
});

// ── Tag Input Component ────────────────────────────────────────
const TagInput = ({
    label, placeholder, tags, onAdd, onRemove, color = 'slate'
}: {
    label: string; placeholder: string;
    tags: string[]; onAdd: (tag: string) => void; onRemove: (i: number) => void;
    color?: 'slate' | 'red' | 'amber';
}) => {
    const [input, setInput] = useState('');
    const colorMap = {
        slate: { badge: 'bg-slate-100 text-slate-700 border-slate-200', remove: 'text-slate-400 hover:text-slate-700', border: 'border-slate-200' },
        red:   { badge: 'bg-red-50 text-red-700 border-red-100',       remove: 'text-red-300 hover:text-red-600',     border: 'border-red-200' },
        amber: { badge: 'bg-amber-50 text-amber-700 border-amber-100', remove: 'text-amber-400 hover:text-amber-700', border: 'border-amber-200' },
    };
    const c = colorMap[color];

    const commit = () => {
        const val = input.trim();
        if (val) { onAdd(val); setInput(''); }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">{label}</label>
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/80 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all', c.border)}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
                    placeholder={placeholder}
                    className="flex-1 outline-none bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400"
                />
                <button type="button" onClick={commit}
                    className="shrink-0 w-6 h-6 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white flex items-center justify-center transition-all">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                        <span key={i} className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border', c.badge)}>
                            {tag}
                            <button type="button" onClick={() => onRemove(i)} className={cn('transition-colors', c.remove)}>
                                <XIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <p className="text-[10px] text-slate-400 font-medium">اضغط Enter أو الفاصلة لإضافة عنصر جديد</p>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────
export const EditMedicalInfo: React.FC = () => {
    const { profile, updateMedicalInfo, isUpdatingMedical } = useProfile();
    const { isAuthenticated } = useAuth();

    // Tag-based arrays (managed outside react-hook-form)
    const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);
    const [currentMedications, setCurrentMedications] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            height: undefined, weight: undefined,
            blood_type: '', date_of_birth: null,
            national_id: '', medical_history: '',
            blood_pressure_systolic: undefined,
            blood_pressure_diastolic: undefined,
        }
    });

    const { data: pregnancyStats } = useQuery({
        queryKey: ['pregnancyStats'],
        queryFn: pregnancyService.getStats,
        enabled: isAuthenticated,
        retry: false,
    });

    const fromPregnancy = !!(pregnancyStats?.blood_pressure_stats?.average_systolic);
    const height = watch('height');
    const weight = watch('weight');
    const [bmi, setBmi] = useState<number | null>(null);
    const [bmiCategory, setBmiCategory] = useState<string | null>(null);

    // Load profile data
    useEffect(() => {
        if (profile?.profile) {
            setValue('height', profile.profile.height);
            setValue('weight', profile.profile.weight);
            setValue('blood_type', profile.profile.blood_type || '');
            
            // Fix: pass the YYYY-MM-DD string directly instead of a Date object, because <input type="date" /> requires a string.
            setValue('date_of_birth', profile.profile.date_of_birth ? profile.profile.date_of_birth.split('T')[0] : null);
            
            setValue('national_id', profile.profile.national_id || '');
            setValue('medical_history', profile.profile.medical_history || '');
            setChronicDiseases(profile.profile.chronic_diseases || []);
            setAllergies(profile.profile.allergies || []);
            setCurrentMedications(profile.profile.current_medications || []);
            const sysBP = pregnancyStats?.blood_pressure_stats?.average_systolic ?? profile.profile.blood_pressure_systolic;
            const diaBP = pregnancyStats?.blood_pressure_stats?.average_diastolic ?? profile.profile.blood_pressure_diastolic;
            if (sysBP) setValue('blood_pressure_systolic', sysBP);
            if (diaBP) setValue('blood_pressure_diastolic', diaBP);
        }
    }, [profile, setValue]);

    // BMI calculation
    useEffect(() => {
        if (height && weight) {
            const h = height / 100;
            const b = weight / (h * h);
            setBmi(parseFloat(b.toFixed(2)));
            if (b < 18.5) setBmiCategory('نحافة');
            else if (b < 25) setBmiCategory('وزن طبيعي');
            else if (b < 30) setBmiCategory('وزن زائد');
            else setBmiCategory('سمنة');
        } else { setBmi(null); setBmiCategory(null); }
    }, [height, weight]);

    const onSubmit = (data: any) => {
        updateMedicalInfo({
            ...data,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : null,
            blood_pressure_systolic: data.blood_pressure_systolic || null,
            blood_pressure_diastolic: data.blood_pressure_diastolic || null,
            chronic_diseases: chronicDiseases,
            allergies,
            current_medications: currentMedications,
            _method: 'PUT',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="group relative bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 opacity-50" />

            {/* Header */}
            <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100/80">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100/50">
                    <HeartPulse className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">المعلومات الطبية</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">سجل بياناتك الصحية بدقة لمساعدتنا في تقديم رعاية أفضل</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* ── Physical Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">الطول (سم)</label>
                        <input type="number" step="0.01" {...register('height')} placeholder="0"
                            className={cn('w-full px-3 py-2.5 rounded-xl border bg-white/60 shadow-sm focus:bg-white outline-none font-medium text-sm transition-all',
                                errors.height ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10')} />
                        {errors.height && <p className="text-[10px] font-medium text-red-500">{errors.height.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">الوزن (كجم)</label>
                        <input type="number" step="0.01" {...register('weight')} placeholder="0"
                            className={cn('w-full px-3 py-2.5 rounded-xl border bg-white/60 shadow-sm focus:bg-white outline-none font-medium text-sm transition-all',
                                errors.weight ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10')} />
                        {errors.weight && <p className="text-[10px] font-medium text-red-500">{errors.weight.message}</p>}
                    </div>
                    {/* BMI */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">مؤشر كتلة الجسم (BMI)</label>
                        <div className={cn('w-full px-3 py-2.5 rounded-xl border flex justify-between items-center transition-all',
                            bmiCategory === 'وزن طبيعي' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                            bmiCategory === 'نحافة'      ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            bmiCategory === 'وزن زائد'  ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            bmiCategory === 'سمنة'       ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            'bg-slate-50 border-slate-100 text-slate-400')}>
                            <span className="font-bold text-base">{bmi || '--'}</span>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/60">{bmiCategory || ''}</span>
                        </div>
                    </div>
                </div>

                {/* ── Identity & Blood ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">فصيلة الدم</label>
                        <div className="relative">
                            <select {...register('blood_type')}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary-500 outline-none appearance-none cursor-pointer font-medium text-sm transition-all">
                                <option value="">غير محدد</option>
                                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">تاريخ الميلاد</label>
                        <input type="date" {...register('date_of_birth')}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary-500 outline-none font-medium text-sm transition-all" />
                        {errors.date_of_birth && <p className="text-[10px] font-medium text-red-500">{errors.date_of_birth.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">الرقم القومي</label>
                        <input type="text" {...register('national_id')} placeholder="14 رقم" maxLength={14}
                            className={cn('w-full px-3 py-2.5 rounded-xl border bg-white/60 shadow-sm focus:bg-white outline-none font-medium text-sm transition-all',
                                errors.national_id ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10')} />
                        {errors.national_id && <p className="text-[10px] font-medium text-red-500">{errors.national_id.message}</p>}
                    </div>
                </div>

                {/* ── Blood Pressure ── */}
                <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-purple-500"><Activity className="w-3 h-3" /></div>
                            ضغط الدم
                        </label>
                        {fromPregnancy && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                <Baby className="w-3 h-3" /> مزامن من متتبع الحمل
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">الانقباضي (SYS)</label>
                            <input type="number" {...register('blood_pressure_systolic')} placeholder="120"
                                className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-medium text-sm transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">الانبساطي (DIA)</label>
                            <input type="number" {...register('blood_pressure_diastolic')} placeholder="80"
                                className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-medium text-sm transition-all" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">المعدل الطبيعي: 120/80 ملم زئبق</p>
                </div>

                {/* ── Medical Alerts (Tags) ── */}
                <div className="p-6 rounded-2xl bg-rose-50/30 border border-rose-100 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900">التنبيهات الطبية</h3>
                            <p className="text-[10px] text-slate-500 font-medium">تظهر هذه المعلومات للطبيب أثناء الاستشارة</p>
                        </div>
                    </div>

                    <TagInput
                        label="الحالات المزمنة"
                        placeholder="مثال: السكري، ضغط الدم..."
                        tags={chronicDiseases}
                        onAdd={tag => setChronicDiseases(p => [...p, tag])}
                        onRemove={i => setChronicDiseases(p => p.filter((_, idx) => idx !== i))}
                        color="amber"
                    />
                    <TagInput
                        label="الحساسية (Allergies)"
                        placeholder="مثال: البنسلين، الفول السوداني..."
                        tags={allergies}
                        onAdd={tag => setAllergies(p => [...p, tag])}
                        onRemove={i => setAllergies(p => p.filter((_, idx) => idx !== i))}
                        color="red"
                    />
                    <TagInput
                        label="الأدوية الحالية"
                        placeholder="مثال: ميتفورمين 500mg..."
                        tags={currentMedications}
                        onAdd={tag => setCurrentMedications(p => [...p, tag])}
                        onRemove={i => setCurrentMedications(p => p.filter((_, idx) => idx !== i))}
                        color="slate"
                    />
                </div>

                {/* ── Medical History Text ── */}
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">التاريخ المرضي <span className="text-slate-400 font-medium text-xs">(ملاحظات إضافية)</span></label>
                    <textarea {...register('medical_history')}
                        className={cn('w-full px-3 py-2.5 rounded-xl border bg-slate-50/50 focus:bg-white outline-none min-h-[100px] resize-none font-medium text-sm transition-all',
                            errors.medical_history
                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/5'
                                : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:border-slate-300')}
                        placeholder="أذكر هنا أي عمليات جراحية سابقة أو تفاصيل أخرى تود إضافتها..."
                    />
                    {errors.medical_history && <p className="text-[10px] font-medium text-red-500">{errors.medical_history.message}</p>}
                </div>

                {/* Save Button */}
                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isUpdatingMedical}
                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20 active:scale-95 text-sm">
                        {isUpdatingMedical
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                            : <><Save className="w-4 h-4" /> حفظ التغييرات</>
                        }
                    </button>
                </div>
            </form>
        </motion.div>
    );
};
