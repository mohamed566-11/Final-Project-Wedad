import React, { useState, useEffect, useRef } from 'react';
import {
    Info, Save, UploadCloud, Loader2, Image as ImageIcon, X, Target, Rocket, LayoutTemplate, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import adminSettingsService, { AboutUs, AboutFormData } from '@/services/adminSettingsService';

const AboutUsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [about, setAbout] = useState<AboutUs | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<AboutFormData>({
        title: '',
        description: '',
        mission_title: '',
        mission_description: '',
        vision_title: '',
        vision_description: ''
    });

    // Fetch About Us
    useEffect(() => {
        const fetchAbout = async () => {
            try {
                setLoading(true);
                const response = await adminSettingsService.getAboutUs();
                const data = response.data.data.about;
                setAbout(data);
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    mission_title: data.mission_title || 'رسالتنا',
                    mission_description: (data as any).mission_desc || data.mission_description || '',
                    vision_title: data.vision_title || 'رؤيتنا',
                    vision_description: (data as any).vision_desc || data.vision_description || ''
                });
                if (data.image_url) {
                    setImagePreview(data.image_url);
                }
            } catch (error) {
                toast.error('فشل في تحميل بيانات صفحة من نحن');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAbout();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('يرجى اختيار ملف صورة صالح');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return toast.error('العنوان مطلوب');
        if (!formData.description.trim()) return toast.error('الوصف مطلوب');

        try {
            setSaving(true);
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('mission_title', formData.mission_title);
            submitData.append('mission_desc', formData.mission_description);
            submitData.append('vision_title', formData.vision_title);
            submitData.append('vision_desc', formData.vision_description);
            submitData.append('_method', 'PUT');

            if (selectedFile) submitData.append('image', selectedFile);

            await adminSettingsService.updateAboutUs(submitData);
            toast.success('تم حفظ التغييرات بنجاح');
            setSelectedFile(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Info className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <LayoutTemplate size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">إدارة صفحة "من نحن"</h1>
                        <p className="text-slate-500 text-sm mt-1">تعديل المحتوى الظاهر في الصفحة التعريفية للمنصة</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 transition-all font-medium shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Content Info */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="text-amber-500" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">المعلومات الأساسية</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    العنوان الرئيسي <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="مثال: تمكين المرأة، بصحة ووعي"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    الوصف التفصيلي <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="اكتب وصفاً تفصيلياً عن المنصة..."
                                    rows={5}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 resize-none"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">صورة العرض الرئيسية</label>
                                <div className="mt-2">
                                    {imagePreview ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img src={imagePreview} alt="Preview" className="w-full h-[300px] object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    type="button"
                                                    className="px-4 py-2 bg-white text-slate-800 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                                >
                                                    تغيير
                                                </button>
                                                <button
                                                    onClick={removeImage}
                                                    type="button"
                                                    className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    إزالة
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-[200px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-primary transition-all"
                                        >
                                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <UploadCloud size={28} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-700 font-medium font-body mb-1">اضغط هنا لرفع صورة</p>
                                                <p className="text-slate-400 text-sm">PNG, JPG (الحد الأقصى 2MB)</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Rocket className="text-blue-500" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">الرسالة</h2>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">عنوان القسم</label>
                                <input
                                    type="text"
                                    name="mission_title"
                                    value={formData.mission_title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">نص الرسالة</label>
                                <textarea
                                    name="mission_description"
                                    value={formData.mission_description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="text-emerald-500" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">الرؤية</h2>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">عنوان القسم</label>
                                <input
                                    type="text"
                                    name="vision_title"
                                    value={formData.vision_title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">نص الرؤية</label>
                                <textarea
                                    name="vision_description"
                                    value={formData.vision_description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;
