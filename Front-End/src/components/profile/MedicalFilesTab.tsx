import React, { useRef, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, Download, X, Eye, Trash2, ExternalLink, Loader2, AlertCircle, ScanSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { profileService } from '@/services/profileService';

export const MedicalFilesTab: React.FC = () => {
    const {
        medicalFiles,
        isMedicalFilesLoading,
        uploadMedicalFile,
        isUploadingMedicalFile,
        deleteMedicalFile,
        isDeletingMedicalFile
    } = useProfile();

    const [previewFile, setPreviewFile] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState<string>('lab_result');

    const categoryMap: Record<string, string> = {
        'lab_result': 'تحاليل طبية',
        'ultrasound': 'موجات صوتية',
        'x_ray': 'صورة أشعة',
        'prescription': 'روشتة علاجية',
        'medical_report': 'تقرير طبي',
        'other': 'أخرى'
    };

    // File Handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        uploadMedicalFile(formData);
    };

    const handleDownload = async (e: React.MouseEvent, file: any) => {
        e.stopPropagation();
        try {
            toast.loading('جاري تجهيز الملف للتنزيل...', { id: 'download' });

            // Call our new secure endpoint which passes auth headers and returns Blob directly
            const response = await profileService.downloadMedicalFile(file.id);

            // Axios responseType: 'blob' will handle the data as a Blob
            const blob = new Blob([response.data || response]);
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.file_name || 'medical_file';
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            toast.success('بدأ تنزيل الملف ✓', { id: 'download' });
        } catch (error) {
            toast.error('فشل في تنزيل الملف، يحاول فتح الملف...', { id: 'download' });
            window.open(file.file_url, '_blank');
        }
    };

    if (isMedicalFilesLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const files = medicalFiles || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group relative bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 group-hover:scale-110 transition-transform duration-700 opacity-50"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100/80 relative z-10 gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-teal-100/50 shrink-0">
                        <FileText className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">ملفاتي الطبية</h2>
                        <p className="text-slate-600 text-sm md:text-base mt-1 font-medium leading-relaxed">
                            احتفظ بكل تحاليلك وصور الأشعة الطبية في مكان واحد آمن
                        </p>
                    </div>
                </div>

                <Link 
                    to="/patient/medical-files/lab-tests" 
                    className="relative overflow-hidden flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3.5 rounded-[1.25rem] shadow-xl shadow-slate-900/10 transition-all active:scale-95 font-bold shrink-0 group border border-slate-700/50"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[length:200%_auto] animate-gradient"></div>
                    <div className="absolute -right-4 -top-8 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-teal-400/20 transition-colors duration-500"></div>
                    
                    <ScanSearch className="w-5 h-5 text-teal-400 group-hover:text-teal-300 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    <span className="relative z-10">التحليل بواسطة الـ (OCR)</span>
                </Link>
            </div>

            {/* Upload Area */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">رفع ملف جديد</h3>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block p-2.5 outline-none"
                    >
                        <option value="lab_result">تحاليل طبية</option>
                        <option value="ultrasound">موجات صوتية</option>
                        <option value="x_ray">صورة أشعة</option>
                        <option value="prescription">روشتة علاجية</option>
                        <option value="medical_report">تقرير طبي</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>

                <div
                    className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all overflow-hidden ${dragActive ? 'border-teal-500 bg-teal-50/50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                    />

                    {isUploadingMedicalFile ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
                            <h3 className="font-bold text-slate-700 text-lg">جاري الرفع...</h3>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <UploadCloud className="w-10 h-10 text-teal-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg mb-2">اسحب وأفلت الملفات هنا</h3>
                            <p className="text-slate-500 text-sm mb-6">أو قم بالنقر لاختيار ملف من جهازك (بحد أقصى 10MB)</p>
                            <p className="text-slate-400 text-xs font-medium mb-6">الصيغ المدعومة: PDF, PNG, JPG</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                تصفح الملفات
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Files List */}
            <div>
                <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">الملفات المرفوعة سابقاً ({files.length})</h3>

                {files.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300 mb-4 shadow-sm">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-slate-700 mb-1">لم تقم برفع أي ملفات طبية بعد</h4>
                        <p className="text-slate-500 text-sm">سيتم عرض جميع تحاليلك وصور الأشعة هنا</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {files.map((file: any) => (
                            <div key={file.id}
                                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                    <h4 className="font-bold text-slate-800 mb-1 truncate text-sm">{file.file_name}</h4>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{categoryMap[file.category] || file.category || 'ملف طبي'}</span>
                                        <span>•</span>
                                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                        className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg transition-colors border border-teal-100/50"
                                        title="معاينة الملف"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDownload(e, file)}
                                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200/50"
                                        title="تنزيل الملف"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('هل أنت متأكد من حذف هذا الملف الطبي؟')) {
                                                deleteMedicalFile(file.id);
                                            }
                                        }}
                                        disabled={isDeletingMedicalFile}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-100"
                                        title="حذف الملف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[32px] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg sm:text-xl truncate max-w-xs sm:max-w-md">
                                            {previewFile.file_name}
                                        </h3>
                                        <p className="text-slate-500 font-bold text-xs sm:text-sm mt-0.5 uppercase tracking-widest">
                                            {categoryMap[previewFile.category] || previewFile.category || 'ملف طبي'} • {new Date(previewFile.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <button
                                        onClick={(e) => handleDownload(e, previewFile)}
                                        className="h-10 px-4 sm:px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">تحميل الملف</span>
                                    </button>
                                    <button
                                        onClick={() => setPreviewFile(null)}
                                        className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors border border-red-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 bg-slate-50 p-4 sm:p-8 overflow-hidden flex items-center justify-center relative">
                                {previewFile.file_url?.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={`${previewFile.file_url}#toolbar=0`}
                                        className="w-full h-full rounded-2xl shadow-sm border border-slate-200 bg-white"
                                        title="معاينة PDF"
                                    />
                                ) : previewFile.file_url?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                    <img
                                        src={previewFile.file_url}
                                        alt={previewFile.file_name}
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-sm border border-slate-200 bg-white"
                                    />
                                ) : (
                                    <div className="text-center bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm max-w-sm w-full mx-auto">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ExternalLink className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="font-black text-slate-800 text-xl mb-3">ملف غير مدعوم للمعاينة</h3>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                            لا يمكننا عرض هذا النوع من الملفات داخل المتصفح مباشرة.
                                        </p>
                                        <button
                                            onClick={(e) => handleDownload(e, previewFile)}
                                            className="w-full h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-black text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-teal-500/25"
                                        >
                                            <Download className="w-5 h-5" />
                                            تنزيل الملف للكشف عنه
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
