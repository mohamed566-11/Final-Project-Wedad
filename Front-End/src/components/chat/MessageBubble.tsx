import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Check, CheckCheck, X, Download } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface Props { message: ChatMessage; }

// Module-level blob cache: 1 network request per image per session
export const IMAGE_BLOB_CACHE = new Map<number, string>();
/** Clears cache entries (test isolation & beforeunload). Does NOT revoke URLs. */
export function clearImageBlobCache() { IMAGE_BLOB_CACHE.clear(); }
/** Revokes all cached blob URLs and clears the cache. Call on session end. */
export function flushImageBlobCache() {
    IMAGE_BLOB_CACHE.forEach((url) => URL.revokeObjectURL(url));
    IMAGE_BLOB_CACHE.clear();
}
// Register once for production browser tabs
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flushImageBlobCache, { once: true });
}

const MessageBubble: React.FC<Props> = ({ message: m }) => {
    const [lightbox, setLightbox] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [secureImageUrl, setSecureImageUrl] = useState<string | null>(null);
    const [imageLoadFailed, setImageLoadFailed] = useState(false);
    const time = format(parseISO(m.created_at), 'hh:mm a', { locale: ar });

    const fetchSecureImage = useCallback(() => {
        if (!m.image_url || m.image_url.startsWith('blob:')) {
            setSecureImageUrl(m.image_url || null);
            return;
        }

        if (IMAGE_BLOB_CACHE.has(m.id)) {
            setSecureImageUrl(IMAGE_BLOB_CACHE.get(m.id)!);
            return;
        }
        
        setImageLoadFailed(false);
        const role = window.location.pathname.includes('/doctor') ? 'doctor' : 'patient';
        import('@/services/chatService').then(({ chatService }) => {
            chatService.downloadImage(m.consultation_id, role, m.id)
                .then(res => {
                    const objectUrl = URL.createObjectURL(res.data);
                    IMAGE_BLOB_CACHE.set(m.id, objectUrl);
                    setSecureImageUrl(objectUrl);
                })
                .catch(err => {
                    console.error('Failed to load image securely', err);
                    setImageLoadFailed(true);
                });
        });
    }, [m.image_url, m.consultation_id, m.id]);

    // Fetch secure image for display
    useEffect(() => {
        fetchSecureImage();
        return () => {
            // Memory leak prevention:
            // Since we added global caching, we do NOT revoke the URL here on unmount
            // because other components or remounts might still need the same blob.
            // Caching guarantees 1 fetch per image lifetime in current session.
        };
    }, [fetchSecureImage]); 


    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const role = window.location.pathname.includes('/doctor') ? 'doctor' : 'patient';
            const { chatService } = await import('@/services/chatService');
            
            const response = await chatService.downloadImage(m.consultation_id, role, m.id);
            const blobUrl = URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `widad-image-${m.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading image securely', error);
            window.open(m.image_url!, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    // Close lightbox on Escape key
    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox]);

    return (
        <>
            <div className={`flex mb-1 items-end gap-2 ${m.is_mine ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-purple-600">
                    {m.sender_name.charAt(0)}
                </div>
                <div className={`max-w-[68%] rounded-2xl px-3 py-2 shadow-sm ${m.is_mine
                    ? 'bg-purple-600 text-white rounded-tl-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-sm'}`}>
                    {imageLoadFailed && (
                        <div className="flex flex-col items-center justify-center p-3 mb-1 bg-red-100 dark:bg-red-900/30 rounded-xl max-w-[220px]">
                            <X className="w-6 h-6 text-red-500 mb-1" />
                            <span className="text-xs text-red-600 dark:text-red-400 mb-2">تعذر تحميل الصورة</span>
                            <button onClick={(e) => { e.stopPropagation(); fetchSecureImage(); }} className="text-xs bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 px-2 py-1 rounded hover:opacity-80">
                                إعادة المحاولة
                            </button>
                        </div>
                    )}
                    {!imageLoadFailed && secureImageUrl && (
                        <img src={secureImageUrl} alt="صورة"
                            className="rounded-xl mb-1 max-w-[220px] cursor-pointer hover:opacity-90 transition"
                            onClick={() => setLightbox(true)} />
                    )}
                    {m.message && <p className="text-sm break-words whitespace-pre-wrap">{m.message}</p>}
                    <div className={`flex items-center gap-1 mt-0.5 text-xs ${m.is_mine ? 'text-purple-200 justify-end' : 'text-gray-400'}`}>
                        <span>{time}</span>
                        {m.is_mine && (
                            m.is_read ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> :
                            m.is_delivered ? <CheckCheck className="w-3.5 h-3.5 text-purple-300" /> :
                            <Check className="w-3 h-3 text-purple-300" />
                        )}
                    </div>
                </div>
            </div>
            {lightbox && (
                <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
                    onClick={() => setLightbox(false)}>
                    
                    {/* Top Actions */}
                    <div className="fixed top-6 left-6 flex items-center gap-4 z-[10000]">
                        <button onClick={handleDownload} disabled={isDownloading}
                            className={`group bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-xl p-3.5 rounded-full text-white transition-all duration-300 shadow-2xl flex items-center justify-center ${isDownloading ? 'opacity-50 cursor-wait' : 'hover:scale-105 cursor-pointer'}`}
                            title="تنزيل الصورة">
                            <Download className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
                            className="group bg-rose-500/80 hover:bg-rose-600 border border-white/10 backdrop-blur-xl p-3.5 rounded-full text-white transition-all duration-300 shadow-2xl hover:scale-105 flex items-center justify-center cursor-pointer"
                            title="إغلاق">
                            <X className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
                        </button>
                    </div>

                    <img src={secureImageUrl!} alt="معاينة كاملة" onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-2xl object-cover cursor-default ring-1 ring-white/20" />
                </div>
            )}
        </>
    );
};

export default MessageBubble;
