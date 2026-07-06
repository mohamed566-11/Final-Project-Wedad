import React, { useRef, useState } from 'react';
import { Send, ImagePlus } from 'lucide-react';
import type { SendMessagePayload } from '@/types/chat';
import ImagePreview from './ImagePreview';
import { toast } from 'sonner';

interface Props { onSend: (p: SendMessagePayload) => void; isSending: boolean; disabled: boolean; }

const MessageInput: React.FC<Props> = ({ onSend, isSending, disabled }) => {
    const [text, setText] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) { toast.error('حجم الصورة يتجاوز 5MB'); return; }
        setImage(f);
        setPreview(URL.createObjectURL(f));
    };

    const clearImage = () => {
        setImage(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const send = () => {
        if (!text.trim() && !image) return;
        onSend({ message: text.trim() || undefined, image: image || undefined });
        setText('');
        clearImage();
    };

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
            {preview && <ImagePreview src={preview} onRemove={clearImage} />}
            <div className="flex items-end gap-2">
                <button disabled={disabled} onClick={() => fileRef.current?.click()}
                    className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-40 transition flex-shrink-0">
                    <ImagePlus className="w-5 h-5" />
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickImage} />
                <textarea rows={1} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
                    disabled={disabled}
                    placeholder={disabled ? 'المحادثة مغلقة' : 'اكتب رسالتك هنا...'}
                    className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 min-h-[40px]" />
                <button disabled={disabled || isSending || (!text.trim() && !image)} onClick={send}
                    className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 transition flex-shrink-0">
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
