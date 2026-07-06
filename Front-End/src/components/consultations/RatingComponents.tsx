import { useState } from 'react';
import { Star, MessageSquare, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface RatingStarsProps {
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onChange?: (rating: number) => void;
    showValue?: boolean;
}

export const RatingStars = ({
    rating,
    size = 'md',
    interactive = false,
    onChange,
    showValue = false
}: RatingStarsProps) => {
    const [hoverRating, setHoverRating] = useState<number>(0);

    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-5 h-5',
        lg: 'w-8 h-8',
    };

    const handleClick = (value: number) => {
        if (interactive && onChange) {
            onChange(value);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="flex items-center gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((value) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => handleClick(value)}
                    onMouseEnter={() => interactive && setHoverRating(value)}
                    onMouseLeave={() => interactive && setHoverRating(0)}
                    disabled={!interactive}
                    className={cn(
                        "transition-all duration-200 outline-none focus:outline-none",
                        interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                    )}
                >
                    <Star
                        className={cn(
                            sizeClasses[size],
                            "transition-colors duration-200",
                            value <= displayRating
                                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                : "fill-slate-100 text-slate-200"
                        )}
                    />
                </button>
            ))}
            {showValue && (
                <span className="mr-2 font-black text-slate-700 tabular-nums">{rating.toFixed(1)}</span>
            )}
        </div>
    );
};

interface ReviewCardProps {
    review: {
        id: number;
        patient_name: string;
        patient_image?: string;
        rating: number;
        comment: string;
        is_anonymous?: boolean;
        created_at: string;
        consultation_date?: string;
    };
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
    return (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 border-2 border-white ring-2 ring-slate-100 shadow-sm">
                    {review.patient_image && !review.is_anonymous ? (
                        <AvatarImage src={review.patient_image} alt={review.patient_name} />
                    ) : (
                        <AvatarFallback className="bg-slate-100 text-slate-400">
                            {review.is_anonymous ? <EyeOff className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </AvatarFallback>
                    )}
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 leading-tight">
                            {review.is_anonymous ? 'مستخدم مجهول' : review.patient_name}
                        </div>
                        <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {new Date(review.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <RatingStars rating={review.rating} size="sm" />
                        {review.consultation_date && (
                            <div className="text-[10px] text-slate-400 border-r border-slate-200 pr-2 mr-2">
                                زيارة: {new Date(review.consultation_date).toLocaleDateString('ar-EG')}
                            </div>
                        )}
                    </div>

                    {review.comment && (
                        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-3 rounded-2xl group-hover:bg-teal-50/30 transition-colors">
                            "{review.comment}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ReviewFormProps {
    onSubmit: (data: { rating: number; comment: string; is_anonymous: boolean }) => void;
    loading?: boolean;
}

export const ReviewForm = ({ onSubmit, loading = false }: ReviewFormProps) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('يرجى اختيار التقييم');
            return;
        }
        setError('');
        onSubmit({ rating, comment, is_anonymous: isAnonymous });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
            <div className="text-center">
                <label className="block text-xl font-black text-slate-900 mb-2">
                    كيف كانت تجربتك؟
                </label>
                <div className="flex justify-center my-4 py-4 bg-white rounded-2xl shadow-sm w-fit mx-auto px-6">
                    <RatingStars
                        rating={rating}
                        size="lg"
                        interactive
                        onChange={setRating}
                    />
                </div>
                {rating > 0 && (
                    <Badge variant="secondary" className={cn(
                        "mt-1 px-3 py-1 font-bold text-sm",
                        rating >= 4 ? "bg-green-100 text-green-700" :
                            rating >= 3 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                    )}>
                        {rating === 5 && 'ممتاز!'}
                        {rating === 4 && 'جيد جداً'}
                        {rating === 3 && 'جيد'}
                        {rating === 2 && 'مقبول'}
                        {rating === 1 && 'سيء'}
                    </Badge>
                )}
                {error && <p className="mt-2 text-red-500 text-sm font-bold bg-red-50 py-1 px-3 rounded-lg inline-block">{error}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    رأيك يهمنا (اختياري)
                </label>
                <div className="relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="اكتب تعليقك هنا..."
                        maxLength={500}
                        rows={4}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-0 resize-none transition-all placeholder:text-slate-300 font-medium"
                    />
                    <div className="absolute bottom-3 left-4 text-xs font-bold text-slate-300 bg-white px-1">
                        {comment.length}/500
                    </div>
                </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-200 hover:shadow-md transition-all group">
                <div className="relative">
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
                <div className="flex items-center gap-3 select-none">
                    <div className={cn("p-2 rounded-full transition-colors", isAnonymous ? "bg-teal-50 text-teal-600" : "bg-slate-50 text-slate-400 group-hover:text-slate-500")}>
                        {isAnonymous ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                    <div>
                        <span className="block font-bold text-slate-800 text-sm">نشر كتقييم مجهول</span>
                        <span className="block text-xs text-slate-500 font-medium">لن يتم عرض اسمك مع التقييم</span>
                    </div>
                </div>
            </label>

            <Button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full h-14 text-lg bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20 font-bold rounded-2xl"
            >
                {loading ? (
                    'جاري الإرسال...'
                ) : (
                    'إرسال التقييم'
                )}
            </Button>
        </form>
    );
};

export default { RatingStars, ReviewCard, ReviewForm };
