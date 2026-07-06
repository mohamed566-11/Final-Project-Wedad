import { useRef, useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';

interface Props {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function LabTestUploader({ onUpload, isUploading }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_MB = 10;

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'عذراً.. يجب أن يكون الملف صورة (JPG, PNG, WebP)';
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `يجب ألا يتجاوز حجم الصورة ${MAX_MB} ميجابايت`;
    }
    return null;
  };

  const handleFileSelection = (file: File) => {
    const err = validate(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      setPreview(null);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { 
        e.preventDefault(); 
        setDragging(false); 
        if (e.dataTransfer.files[0]) handleFileSelection(e.dataTransfer.files[0]); 
      }}
      onClick={() => { if (!preview) inputRef.current?.click(); }}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300
        ${dragging ? 'border-purple-500 bg-purple-50 scale-[1.02]' : ''}
        ${!preview ? 'cursor-pointer border-gray-300 hover:border-purple-400 bg-gray-50' : 'border-purple-200 bg-white'}
      `}
    >
      <input 
        ref={inputRef} 
        type="file" 
        accept=".jpg,.jpeg,.png,.webp" 
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFileSelection(e.target.files[0])} 
      />

      {error && (
        <div className="absolute top-4 left-0 right-0 mx-4 bg-red-100 text-red-700 p-2 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {preview ? (
        <div className="flex flex-col items-center">
          <button 
            onClick={clearSelection}
            disabled={isUploading}
            className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
          
          <img 
            src={preview} 
            alt="معاينة التحليل" 
            className="max-h-64 object-contain rounded-xl border border-gray-200 shadow-sm mb-6" 
          />
          
          <button 
            disabled={isUploading}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition transform active:scale-95 flex justify-center items-center gap-2"
            onClick={submit}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                <span>جاري الرفع...</span>
              </>
            ) : (
              <>
                <FileImage size={20} />
                <span>تحليل النتيجة باستخدام الذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">اسحب صورة التحليل هنا</h3>
          <p className="text-gray-500 mb-6">أو <span className="text-purple-600 font-semibold underline decoration-2 underline-offset-4">اضغطي هنا</span> لاختيار الصورة من جهازك</p>
          
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-400">
            <span className="bg-white px-3 py-1 border rounded-lg">JPG, PNG, WebP</span>
            <span className="bg-white px-3 py-1 border rounded-lg">الحد الأقصى {MAX_MB}MB</span>
          </div>
        </>
      )}
    </div>
  );
}
