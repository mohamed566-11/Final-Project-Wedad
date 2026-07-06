import React, { useState, useEffect, useRef } from 'react';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/hooks/useDoctorQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Card from '@/components/common/Card';
import { useNavigate } from 'react-router-dom';
import { Loader2, Camera, User, Phone, Briefcase, DollarSign, FileText, ArrowRight, Video, MapPin, Layers } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/common/BackButton';

const SPECIALTIES = [
    { value: 'gynecology', label: 'أمراض نساء وتوليد' },
    { value: 'obstetrics', label: 'توليد' },
    { value: 'fertility', label: 'علاج العقم' },
    { value: 'endocrinology', label: 'غدد صماء' },
    { value: 'general_practitioner', label: 'ممارس عام' },
    { value: 'pediatrics', label: 'أطفال' },
    { value: 'nutrition', label: 'تغذية' },
    { value: 'other', label: 'تخصص آخر' },
];

const EditProfile: React.FC = () => {
    const { data: profileResponse, isLoading } = useDoctorProfile();
    const { mutate: updateProfile, isPending } = useUpdateDoctorProfile();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        consultation_price: '',
        specialization: '',
        session_type: 'both' as 'video' | 'offline' | 'both',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (profileResponse?.data?.doctor) {
            const d = profileResponse.data.doctor;
            setFormData({
                name: d.name || '',
                phone: d.phone || '',
                bio: d.bio || '',
                consultation_price: d.consultation_price || '',
                specialization: d.specialization || '',
                session_type: (d.session_type as 'video' | 'offline' | 'both') || 'both',
            });
            setImagePreview(d.image_url || null);
        }
    }, [profileResponse]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        Object.entries(formData).forEach(([key, val]) => {
            if (val) data.append(key, val.toString());
        });
        // Always include session_type even if it seems falsy
        data.set('session_type', formData.session_type);
        if (imageFile) {
            data.append('image', imageFile);
        }

        updateProfile(data as any, {
            onSuccess: () => {
                toast.success('تم تحديث الملف الشخصي بنجاح');
                navigate('/doctor/profile');
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || 'حدث خطأ أثناء التحديث');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-muted-foreground font-bold">جاري تحميل البيانات...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4" dir="rtl">
            <div className="mb-6">
                <BackButton className="text-muted-foreground hover:text-primary" label="العودة للملف الشخصي" />
            </div>

            <Card variant="elevated" className="p-0 border-0 shadow-2xl overflow-hidden rounded-[32px]">
                <div className="bg-foreground p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                        تعديل الملف الشخصي
                    </h2>
                    <p className="text-muted-foreground text-sm">حدث بياناتك المهنية وصورتك ليراها المرضى</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white">
                    {/* Image Upload Section */}
                    <div className="flex flex-col items-center gap-4 py-4 border-b border-muted">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[32px] overflow-hidden ring-4 ring-muted shadow-xl bg-muted/50 flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                ) : (
                                    <User size={48} className="text-border" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -left-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-600 transition-all hover:scale-110 active:scale-95"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground">انقر على الأيقونة لتغيير الصورة</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 flex items-center gap-2">
                                <User size={16} className="text-primary" />
                                الاسم الكامل
                            </label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="rounded-2xl border-border bg-muted/50 focus:bg-white h-12 font-bold px-4"
                                placeholder="د. أحمد محمد"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 flex items-center gap-2">
                                <Phone size={16} className="text-primary" />
                                رقم الهاتف
                            </label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="rounded-2xl border-border bg-muted/50 focus:bg-white h-12 font-bold px-4 dir-ltr"
                                placeholder="01xxxxxxxxx"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 flex items-center gap-2">
                                <DollarSign size={16} className="text-primary" />
                                سعر الكشف (ج.م)
                            </label>
                            <Input
                                type="number"
                                value={formData.consultation_price}
                                onChange={e => setFormData({ ...formData, consultation_price: e.target.value })}
                                className="rounded-2xl border-border bg-muted/50 focus:bg-white h-12 font-bold px-4"
                                placeholder="100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 flex items-center gap-2">
                                <Briefcase size={16} className="text-primary" />
                                التخصص الدقيق
                            </label>
                            <select
                                value={formData.specialization}
                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                className="w-full px-4 rounded-2xl border border-border bg-muted/50 focus:bg-white focus:border-primary-200 outline-none h-12 font-bold text-sm cursor-pointer transition-all"
                            >
                                <option value="">اختر التخصص...</option>
                                {SPECIALTIES.map(spec => (
                                    <option key={spec.value} value={spec.value}>{spec.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Session Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-black text-foreground/80 flex items-center gap-2">
                            <Layers size={16} className="text-primary" />
                            نوع الاستشارات المتاحة
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { value: 'video', label: 'أونلاين فقط', desc: 'استشارات فيديو عبر الإنترنت', icon: <Video size={22} /> },
                                { value: 'offline', label: 'عيادة فقط', desc: 'زيارات شخصية في العيادة', icon: <MapPin size={22} /> },
                                { value: 'both', label: 'الاثنين معاً', desc: 'فيديو + زيارة عيادة', icon: <Layers size={22} /> },
                            ].map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`relative cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 ${
                                        formData.session_type === opt.value
                                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                            : 'border-border bg-muted/50 hover:border-primary/30 hover:bg-muted'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="session_type"
                                        value={opt.value}
                                        checked={formData.session_type === opt.value}
                                        onChange={() => setFormData({ ...formData, session_type: opt.value as 'video' | 'offline' | 'both' })}
                                        className="hidden"
                                    />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        formData.session_type === opt.value
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {opt.icon}
                                    </div>
                                    <div className="font-black text-sm text-foreground">{opt.label}</div>
                                    <div className="text-xs text-muted-foreground font-medium leading-snug">{opt.desc}</div>
                                    {formData.session_type === opt.value && (
                                        <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 flex items-center gap-2">
                            <FileText size={16} className="text-primary" />
                            نبذة تعريفية شاملة
                        </label>
                        <Textarea
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            rows={5}
                            className="rounded-[24px] border-border bg-muted/50 focus:bg-white font-medium p-4 leading-relaxed"
                            placeholder="اكتب نبذة عن خبراتك وشهاداتك العلمية..."
                        />
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 rounded-2xl h-14 font-black text-lg bg-primary hover:bg-primary-600 shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري الحفظ...
                                </span>
                            ) : (
                                'حفظ التغييرات'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/doctor/profile')}
                            className="px-8 rounded-2xl h-14 font-black transition-all hover:bg-border"
                        >
                            إلغاء
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditProfile;
