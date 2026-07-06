import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
    Upload, FileText, Image, Trash2, Loader2, Download,
    Plus, X, FilePlus2, FolderOpen, AlertCircle, CheckCircle2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { consultationService } from '@/services/consultationService';

export interface Attachment {
    id: number;
    file_name: string;
    file_type: string;
    file_size_formatted: string;
    category: string;
    category_label: string;
    description?: string;
    uploaded_by: 'patient' | 'doctor';
    is_image: boolean;
    url: string;
    created_at: string;
}

const categoryOptions = [
    { value: 'lab_result', label: 'نتيجة تحليل', emoji: '🧪' },
    { value: 'ultrasound', label: 'صورة سونار', emoji: '📡' },
    { value: 'x_ray', label: 'أشعة سينية', emoji: '☢️' },
    { value: 'prescription', label: 'وصفة طبية', emoji: '💊' },
    { value: 'medical_report', label: 'تقرير طبي', emoji: '📋' },
    { value: 'other', label: 'أخرى', emoji: '📎' },
];

interface Props {
    consultationId: number;
    role: 'patient' | 'doctor';
    canUpload?: boolean; // doctor can always upload; patient only if not completed/cancelled
    viewerLabel?: string; // Who is viewing ("الطبيب" / "المريضة")
}

const ConsultationAttachments = ({ consultationId, role, canUpload = true, viewerLabel = 'المريضة' }: Props) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('lab_result');
    const [description, setDescription] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAttachments = async () => {
        setLoading(true);
        try {
            const res = await consultationService.getConsultationAttachments(consultationId, role);
            if (res.status) {
                setAttachments(res.data.attachments || []);
            }
        } catch {
            toast.error('حدث خطأ في جلب الملفات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAttachments(); }, [consultationId]);

    const handleFileSelect = (file: File) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!allowed.includes(ext)) {
            toast.error('نوع الملف غير مدعوم. يُرجى رفع PDF أو صورة (jpg, jpeg, png)');
            return;
        }
        if (file.size > maxSize) {
            toast.error('حجم الملف كبير جداً. الحد الأقصى 10MB');
            return;
        }
        setSelectedFile(file);
        setShowUploadPanel(true);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('category', selectedCategory);
            if (description) formData.append('description', description);

            const res = await consultationService.uploadConsultationAttachment(consultationId, formData, role);
            if (res.status) {
                setAttachments(prev => [res.data.attachment, ...prev]);
                toast.success('تم رفع الملف بنجاح ✓');
                setShowUploadPanel(false);
                setSelectedFile(null);
                setDescription('');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'فشل في رفع الملف');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await consultationService.deleteConsultationAttachment(consultationId, id, role);
            setAttachments(prev => prev.filter(a => a.id !== id));
            toast.success('تم حذف الملف');
        } catch {
            toast.error('فشل في حذف الملف');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = async (attachmentId: number, fileName: string) => {
        try {
            toast.loading('جاري تجهيز الملف للتنزيل...', { id: 'download' });

            // Call our new secure endpoint which passes auth headers and returns Blob directly
            const response = await consultationService.downloadConsultationAttachment(consultationId, attachmentId, role);

            // Axios responseType: 'blob' will handle the data as a Blob
            const blob = new Blob([response.data]);
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            toast.success('بدأ تنزيل الملف ✓', { id: 'download' });
        } catch (error) {
            toast.error('فشل في تنزيل الملف، حاول مرة أخرى', { id: 'download' });
        }
    };

    const categoryInfo = (cat: string) => categoryOptions.find(c => c.value === cat);

    return (
        <div className="space-y-6">
            {/* Upload trigger */}
            {canUpload && !showUploadPanel && (
                <div
                    className={cn(
                        "border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer group",
                        dragOver
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-slate-200 bg-slate-50 hover:border-primary hover:bg-primary/2"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setDragOver(false);
                        const f = e.dataTransfer.files[0];
                        if (f) handleFileSelect(f);
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,image/jpg,image/jpeg,image/png"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                    />
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                        <FilePlus2 className="w-9 h-9 text-primary" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2 text-lg">رفع تحليل أو ملف طبي</h3>
                    <p className="text-slate-500 font-medium text-sm mb-4">اسحب الملف هنا أو انقر للاختيار</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {['PDF', 'JPG', 'PNG'].map(t => (
                            <span key={t} className="text-xs font-bold bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full">{t}</span>
                        ))}
                        <span className="text-xs font-bold text-slate-400">• الحد الأقصى 10MB</span>
                    </div>
                </div>
            )}

            {/* Upload Panel */}
            {showUploadPanel && selectedFile && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">رفع ملف جديد</p>
                                <p className="text-slate-400 text-xs">{selectedFile.name}</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowUploadPanel(false); setSelectedFile(null); }} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-5">
                        {/* Category Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">تصنيف الملف</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categoryOptions.map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setSelectedCategory(cat.value)}
                                        className={cn(
                                            "p-3 rounded-2xl border text-sm font-bold text-right transition-all flex items-center gap-2",
                                            selectedCategory === cat.value
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        <span className="text-lg">{cat.emoji}</span>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">وصف مختصر (اختياري)</label>
                            <input
                                type="text"
                                placeholder="مثال: نتيجة تحليل CBC بتاريخ 1 يناير..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button onClick={() => { setShowUploadPanel(false); setSelectedFile(null); }} variant="outline" className="flex-1 h-12 rounded-xl font-bold border-slate-200">
                                إلغاء
                            </Button>
                            <Button onClick={handleUpload} disabled={uploading} className="flex-2 h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white gap-2 px-8">
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                {uploading ? 'جاري الرفع...' : 'رفع الملف الآن'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachments List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border border-slate-100">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                    <p className="text-slate-400 font-bold text-sm">جاري تحميل الملفات...</p>
                </div>
            ) : attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100">
                        <FolderOpen className="w-9 h-9 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg mb-2">لا توجد ملفات مرفقة</h3>
                    <p className="text-slate-400 font-medium text-sm max-w-xs text-center leading-relaxed">
                        {role === 'patient'
                            ? 'يمكنكِ رفع نتائج التحاليل والأشعة لتسهيل متابعة الطبيب لحالتكِ'
                            : 'لم يتم إرفاق أي ملفات لهذه الاستشارة بعد'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{attachments.length} ملف مرفق</p>
                    {attachments.map(att => {
                        const cat = categoryInfo(att.category);
                        const isDeleting = deletingId === att.id;
                        return (
                            <div
                                key={att.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all group",
                                    isDeleting && "opacity-50 pointer-events-none"
                                )}
                            >
                                {/* File icon / preview */}
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-bold shadow-inner",
                                    att.is_image ? "bg-blue-50" : "bg-red-50"
                                )}>
                                    {att.is_image
                                        ? <Image className="w-7 h-7 text-blue-500" />
                                        : <FileText className="w-7 h-7 text-red-500" />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{att.file_name}</p>
                                        <span className="text-sm">{cat?.emoji}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg">{att.category_label}</span>
                                    </div>
                                    {att.description && (
                                        <p className="text-slate-500 text-xs font-medium mb-1 truncate">{att.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                                        <span>{att.file_size_formatted}</span>
                                        <span>•</span>
                                        <span>{att.uploaded_by === 'patient' ? '👩‍⚕️ ' + viewerLabel : '👨‍⚕️ الطبيب'}</span>
                                        <span>•</span>
                                        <span>{att.created_at}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setPreviewAttachment(att)}
                                        className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                        title="معاينة الملف"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(att.id, att.file_name)}
                                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-500 flex items-center justify-center transition-all"
                                        title="تنزيل الملف"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(att.id)}
                                        disabled={isDeleting}
                                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-500 hover:text-white text-slate-400 flex items-center justify-center transition-all"
                                        title="حذف الملف"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Preview Overlay */}
            {previewAttachment && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col backdrop-blur-md animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setPreviewAttachment(null)}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 transition-all text-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div>
                                <h3 className="text-white font-bold text-sm md:text-base leading-tight">
                                    {previewAttachment.file_name}
                                </h3>
                                <p className="text-white/50 text-xs font-bold font-mono mt-0.5">
                                    {previewAttachment.file_size_formatted} • {previewAttachment.category_label}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDownload(previewAttachment.id, previewAttachment.file_name)}
                            className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-primary/30"
                        >
                            تنزيل <Download className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative group">
                        {previewAttachment.is_image ? (
                            <img
                                src={previewAttachment.url}
                                alt={previewAttachment.file_name}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                            />
                        ) : previewAttachment.file_type === 'pdf' ? (
                            <iframe
                                src={`${previewAttachment.url}#toolbar=0`}
                                className="w-full h-full max-w-5xl bg-white rounded-2xl shadow-2xl"
                                title="معاينة PDF"
                            />
                        ) : (
                            <div className="bg-white/5 backdrop-blur border border-white/10 p-10 rounded-3xl text-center max-w-sm">
                                <FileText className="w-20 h-20 text-white/30 mx-auto mb-6" />
                                <h4 className="text-white font-bold text-lg mb-2">لا يمكن معاينة هذا الملف</h4>
                                <p className="text-white/60 text-sm font-medium leading-relaxed">
                                    هذا النوع من الملفات لا يدعم المعاينة المباشرة. يرجى تنزيله على جهازك لفتحه.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationAttachments;
