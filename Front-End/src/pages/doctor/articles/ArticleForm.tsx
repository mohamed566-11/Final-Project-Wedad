import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorArticle, useCreateArticle, useUpdateArticle } from '@/hooks/useDoctorArticles';
import { useLifeStages } from '@/hooks/usePatientQueries';
import {
    Loader2, Save, ArrowRight, Image as ImageIcon,
    Bold, Italic, List, ListOrdered, Heading2,
    Link as LinkIcon, AlertCircle, X, Check,
    Layout, Type, FileText, Settings, UploadCloud, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="flex items-center flex-wrap gap-1 p-2 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-20">
            <Button
                size="sm"
                variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                className={`h-9 w-9 p-0 rounded-lg ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
                title="عريض"
            >
                <Bold className="w-4 h-4" />
            </Button>
            <Button
                size="sm"
                variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                className={`h-9 w-9 p-0 rounded-lg ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
                title="مائل"
            >
                <Italic className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <Button
                size="sm"
                variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
                className={`h-9 px-3 rounded-lg gap-1.5 ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
                title="عنوان رئيسي"
            >
                <Heading2 className="w-4 h-4" />
                <span className="text-xs font-bold">العنوان</span>
            </Button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <Button
                size="sm"
                variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
                className={`h-9 w-9 p-0 rounded-lg ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
                title="قائمة نقطية"
            >
                <List className="w-4 h-4" />
            </Button>
            <Button
                size="sm"
                variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
                className={`h-9 w-9 p-0 rounded-lg ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
                title="قائمة رقمية"
            >
                <ListOrdered className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <Button
                size="sm"
                variant={editor.isActive('link') ? 'secondary' : 'ghost'}
                onClick={(e) => {
                    e.preventDefault();
                    const url = window.prompt('URL');
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                }}
                className={`h-9 w-9 p-0 rounded-lg ${editor.isActive('link') ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
                title="رابط"
            >
                <LinkIcon className="w-4 h-4" />
            </Button>
        </div>
    );
};

const ArticleForm = ({ mode }: { mode: 'create' | 'edit' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = mode === 'edit';

    const { data: response, isLoading: isLoadingArticle } = useDoctorArticle(Number(id));
    const { data: lifeStagesResponse, isLoading: lifeStagesLoading } = useLifeStages();
    const lifeStages = lifeStagesResponse?.life_stages || [];

    const createMutation = useCreateArticle();
    const updateMutation = useUpdateArticle();

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            excerpt: '',
            content: '',
            life_stage_id: '',
            image: null as File | null
        }
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            setValue('content', editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm md:prose-base focus:outline-none min-h-[500px] p-6 lg:p-8',
                dir: 'rtl'
            }
        }
    });

    // Load data for edit
    useEffect(() => {
        if (isEdit && response?.data?.article) {
            const article = response.data.article;
            setValue('title', article.title);
            setValue('excerpt', article.excerpt);
            setValue('content', article.content);
            setValue('life_stage_id', article.life_stage_id?.toString() || '');

            if (article.image) setImagePreview(article.image);
            if (editor && !editor.isDestroyed) {
                editor.commands.setContent(article.content);
            }
        }
    }, [isEdit, response, setValue, editor]);

    const onSubmit = (data: any) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('excerpt', data.excerpt);
        formData.append('content', data.content);
        if (data.life_stage_id) {
            formData.append('life_stage_id', data.life_stage_id);
        }

        if (data.image instanceof File) {
            formData.append('image', data.image);
        }

        if (isEdit && id) {
            updateMutation.mutate({ id: Number(id), data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (isEdit && isLoadingArticle) return <div className="p-32 flex justify-center"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div>;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-[1200px] mx-auto pb-20 animate-fade-in" dir="rtl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-l from-[#0F172A] to-[#1E1B4B] p-8 md:p-10 rounded-[32px] text-white shadow-2xl relative overflow-hidden isolate">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-500/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <Button variant="ghost" type="button" onClick={() => navigate('/doctor/articles')} className="h-12 w-12 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/20 mb-2">
                            <Sparkles className="w-3 h-3 text-indigo-300" />
                            <span className="text-[10px] font-bold text-indigo-200 tracking-wider">محرر المقالات الطبي</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 leading-tight">
                            {isEdit ? 'تعديل المقال' : 'إنشاء مقال جديد'}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto relative z-10">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/doctor/articles')}
                        className="flex-1 md:flex-none h-14 px-8 font-bold border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-2xl backdrop-blur-md transition-colors"
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 md:flex-none h-14 px-10 font-black bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-xl shadow-indigo-900/40 rounded-2xl transition-all hover:-translate-y-1 gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEdit ? 'تحديث ونشر' : 'نشر المقال'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-rose-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="space-y-8 relative z-10">
                            <div className="space-y-3">
                                <Label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Type className="w-4 h-4 text-indigo-500" />
                                    عنوان المقال
                                </Label>
                                <Input
                                    {...register('title', { required: 'العنوان مطلوب' })}
                                    placeholder="مثال: دليلك الشامل للتغذية السليمة خلال الأشهر الثلاثة الأولى..."
                                    className="h-16 text-xl font-bold bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-[20px] px-6"
                                />
                                {errors.title && <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.title.message as string}</p>}
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-rose-500" />
                                    محتوى المقال التفصيلي
                                </Label>
                                <div className="border border-slate-200 rounded-[24px] overflow-hidden bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-sm">
                                    <MenuBar editor={editor} />
                                    <div className="bg-slate-50/10 text-slate-800">
                                        <EditorContent editor={editor} />
                                    </div>
                                </div>
                                <input type="hidden" {...register('content', { required: 'المحتوى مطلوب' })} />
                                {errors.content && <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.content.message as string}</p>}
                            </div>

                            <div className="space-y-3 pt-6">
                                <Label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Layout className="w-4 h-4 text-emerald-500" />
                                    مقتطف قصير (يظهر كمعاينة للمقال)
                                </Label>
                                <Textarea
                                    {...register('excerpt', { required: 'المقتطف مطلوب' })}
                                    placeholder="وصف موجز للمقال يشجع القراء على الضغط لقراءته..."
                                    className="min-h-[120px] py-4 bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-[20px] resize-none text-sm leading-relaxed px-6 font-medium"
                                    maxLength={500}
                                />
                                <div className="flex justify-between items-center px-1 mt-2">
                                    <p className="text-[11px] text-slate-400 font-bold">سيبدو هذا النص في الصفحة الرئيسية للمقالات</p>
                                    <div className={`text-[12px] font-black px-3 py-1 rounded-xl transition-colors ${watch('excerpt')?.length > 450 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {watch('excerpt')?.length || 0}/500
                                    </div>
                                </div>
                                {errors.excerpt && <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.excerpt.message as string}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Cover Image Upload */}
                    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                        <Label className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-indigo-500" />
                            صورة الغلاف (Cover)
                        </Label>
                        <div
                            onClick={() => document.getElementById('cover-image')?.click()}
                            className={`group relative border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all aspect-[4/3] overflow-hidden 
                                ${imagePreview ? 'border-indigo-200' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300'}`}
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                        <div className="bg-white/90 p-4 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                            <UploadCloud className="w-8 h-8 text-indigo-600" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); setValue('image', null); }}
                                        className="absolute top-4 right-4 p-2 bg-rose-500/90 hover:bg-rose-600 text-white rounded-xl shadow-xl transition-colors backdrop-blur-md"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                                        <UploadCloud className="w-10 h-10 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <span className="text-sm font-black text-slate-700 block mb-1">اضغط لرفع صورة</span>
                                    <span className="text-[11px] text-slate-400 font-bold block">يفضل قياس 800x600 بكسل</span>
                                </div>
                            )}
                            <input
                                type="file"
                                id="cover-image"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-emerald-500" />
                                    المرحلة العمرية المستهدفة
                                </Label>
                                <Controller
                                    control={control}
                                    name="life_stage_id"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-[16px] font-bold">
                                                <SelectValue placeholder="اختر الفئة الأنسب للإفادة (اختياري)" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[16px] border-slate-100 shadow-xl">
                                                {lifeStagesLoading ? (
                                                    <div className="p-4 flex justify-center">
                                                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                                    </div>
                                                ) : (
                                                    lifeStages?.map((stage: any) => (
                                                        <SelectItem key={stage.id} value={stage.id.toString()} className="font-bold py-3 rounded-xl focus:bg-indigo-50">
                                                            {stage.name_ar}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.life_stage_id && <p className="text-rose-500 text-xs font-bold mt-2"><AlertCircle className="w-3 h-3 inline" /> {errors.life_stage_id.message as string}</p>}
                            </div>
                        </div>

                        {/* Summary Checklist */}
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">قائمة التدقيق</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <div className={`p-1.5 rounded-xl transition-colors ${watch('title') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    عنوان المقال
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <div className={`p-1.5 rounded-xl transition-colors ${(watch('content')?.length || 0) > 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    محتوى شامل وملائم
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <div className={`p-1.5 rounded-xl transition-colors ${imagePreview ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    صورة غلاف جذابة
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Feedback (If any) */}
                    {isEdit && response?.data?.article?.admin_notes && (
                        <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-6 lg:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>
                            <h4 className="font-black text-rose-800 text-sm mb-3 flex items-center gap-2 relative z-10">
                                <AlertCircle className="w-5 h-5 animate-pulse" />
                                ملاحظات المراجع الفني
                            </h4>
                            <div className="text-xs text-rose-700 leading-relaxed font-bold p-4 bg-white/60 rounded-2xl relative z-10 shadow-sm border border-rose-100/50">
                                {response.data.article.admin_notes}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default ArticleForm;
