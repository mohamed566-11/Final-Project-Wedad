import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    currentImage?: string | null;
    onUpload: (file: File) => void;
    onDelete?: () => void;
    isLoading?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    currentImage,
    onUpload,
    onDelete,
    isLoading
}) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.[0]) {
            onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.png', '.jpg', '.gif']
        },
        maxFiles: 1,
        multiple: false
    });

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[240px] mx-auto group/container">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer w-48 h-48 rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 shadow-2xl shadow-slate-200/50",
                    isDragActive
                        ? "border-teal-500 bg-teal-50/50 scale-105 rotate-2"
                        : "border-white bg-slate-50 hover:border-teal-200 hover:rotate-1",
                    isLoading && "opacity-80 pointer-events-none grayscale",
                    "ring-4 ring-slate-100" // Outer glow effect
                )}
            >
                <input {...getInputProps()} />

                {currentImage ? (
                    <div className="w-full h-full relative">
                        <img
                            src={currentImage}
                            alt="Profile"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                            <Upload className="w-8 h-8 text-white mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="text-white text-xs font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">تغيير الصورة</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 group-hover:text-teal-600 transition-colors duration-500">
                        <div className="p-4 bg-white rounded-2xl mb-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-500 border border-slate-100 group-hover:border-teal-100">
                            <ImageIcon className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm font-bold">رفع صورة</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md">JPG, PNG</span>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <div className="w-12 h-12 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {currentImage && onDelete && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-all duration-300 border border-rose-100 hover:border-rose-200 shadow-sm hover:shadow-rose-100/50 active:scale-95"
                    disabled={isLoading}
                >
                    <X className="w-3.5 h-3.5" />
                    حذف الصورة
                </button>
            )}
        </div>
    );
};
