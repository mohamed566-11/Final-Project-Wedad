
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pregnancyService } from '@/services/pregnancyService';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, Trash2, Calendar, File, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FileUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'الكل', icon: FileText },
    { id: 'ultrasound', label: 'صور سونار', icon: ImageIcon },
    { id: 'lab_result', label: 'تحاليل', icon: Activity },
    { id: 'prescription', label: 'روشتات', icon: FileText },
    { id: 'medical_report', label: 'تقارير', icon: File },
    { id: 'other', label: 'أخرى', icon: File },
];

export const PregnancyMedicalFilesDialog = ({ open, onOpenChange }: FileUploadDialogProps) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Files
    const { data, isLoading } = useQuery({
        queryKey: ['pregnancyFiles', selectedCategory],
        queryFn: () => pregnancyService.getFiles(selectedCategory === 'all' ? undefined : selectedCategory),
    });

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: pregnancyService.uploadFile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pregnancyFiles'] });
            toast.success('تم رفع الملف بنجاح');
            setIsUploading(false);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء رفع الملف');
            setIsUploading(false);
        }
    });

    // Handle Upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory === 'all' ? 'other' : selectedCategory);
        formData.append('file_date', new Date().toISOString().split('T')[0]); // Default to today

        uploadMutation.mutate(formData);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle Delete
    const deleteMutation = useMutation({
        mutationFn: pregnancyService.deleteFile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pregnancyFiles'] });
            toast.success('تم حذف الملف');
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col bg-muted font-primary rounded-[2rem]">

                {/* Header */}
                <div className="bg-white p-6 border-b flex justify-between items-center shadow-sm z-10">
                    <div>
                        <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                            الملفات الطبية
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                                {data?.files?.length || 0} ملف
                            </span>
                        </DialogTitle>
                        <p className="text-muted-foreground text-sm mt-1">احتفظي بكل صور السونار والتحاليل في مكان آمن</p>
                    </div>

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 shadow-lg shadow-blue-200"
                    >
                        {isUploading ? <Loader2 className="animate-spin" /> : <Upload className="ml-2" size={18} />}
                        رفع ملف جديد
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar Categories */}
                    <div className="w-64 bg-white border-l border-border p-4 space-y-2 hidden md:block overflow-y-auto">
                        <label className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider mb-2 block">التصنيفات</label>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl transition-all text-sm font-bold",
                                    selectedCategory === cat.id
                                        ? "bg-blue-50 text-blue-600 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <cat.icon size={18} />
                                    {cat.label}
                                </div>
                                {data?.grouped_by_category?.[cat.id] > 0 && (
                                    <span className="bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md text-xs">
                                        {data.grouped_by_category[cat.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Files Grid */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-border rounded-2xl animate-pulse" />)}
                            </div>
                        ) : data?.files?.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                    <Upload size={40} className="opacity-20" />
                                </div>
                                <p className="font-bold text-lg">لا توجد ملفات بعد</p>
                                <p className="text-sm opacity-70">ابدئي برفع صور السونار أو نتائج التحاليل</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {data?.files?.map((file: any) => (
                                        <FileCard key={file.id} file={file} onDelete={() => deleteMutation.mutate(file.id)} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};

import { API_BASE_URL } from '@/utils/constants';

const FileCard = ({ file, onDelete }: { file: any, onDelete: () => void }) => {
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(file.file_type?.toLowerCase());

    // Construct full URL if path is relative
    // Assuming API_BASE_URL is 'http://localhost:8000/api/v1', we get 'http://localhost:8000'
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    const fileUrl = file.file_path?.startsWith('http') ? file.file_path : `${baseUrl}${file.file_path}`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
        >
            {/* Preview */}
            <div className="h-40 bg-muted flex items-center justify-center overflow-hidden relative">
                {isImage ? (
                    <img src={fileUrl} alt={file.file_name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                    <FileText size={48} className="text-border" />
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    <Button size="icon" variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white hover:text-red-500" onClick={onDelete}>
                        <Trash2 size={18} />
                    </Button>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white hover:text-blue-600">
                            <Upload className="rotate-180" size={18} />
                        </Button>
                    </a>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                        file.category === 'ultrasound' ? "bg-pink-50 text-pink-600" :
                            file.category === 'lab_result' ? "bg-blue-50 text-blue-600" :
                                "bg-muted/50 text-muted-foreground"
                    )}>
                        {CATEGORIES.find(c => c.id === file.category)?.label || file.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar size={12} />
                        {file.file_date ? format(new Date(file.file_date), 'MMM d', { locale: arEG }) : '--'}
                    </span>
                </div>
                <h4 className="font-bold text-foreground/80 truncate text-sm" title={file.file_name}>
                    {file.description || file.file_name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{file.file_size_formatted || 'Unknown size'}</p>
            </div>
        </motion.div>
    );
};

// Assuming Activity comes from 'lucide-react', need to make sure import is correct at top.
// Added Activity to imports above.

