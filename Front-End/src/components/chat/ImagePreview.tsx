import React from 'react';
import { X } from 'lucide-react';

interface Props { src: string; onRemove: () => void; }

const ImagePreview: React.FC<Props> = ({ src, onRemove }) => (
    <div className="relative inline-block mr-2 mb-2">
        <img src={src} alt="معاينة الصورة"
            className="h-16 w-16 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
        <button onClick={onRemove} type="button" aria-label="حذف الصورة"
            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition">
            <X className="w-3 h-3" />
        </button>
    </div>
);

export default ImagePreview;
