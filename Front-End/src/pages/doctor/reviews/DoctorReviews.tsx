import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import {
    Star, MessageCircle, AlertCircle, Loader2,
    Award, User, Quote, Filter,
    ChevronRight, ChevronLeft, Calendar, Trash2, X, Eye, EyeOff
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Types matching ReviewResource ────────────────────────────────────────────
interface Review {
    id: number;
    rating: number;
    rating_text: string;
    comment: string;
    is_anonymous: boolean;
    is_verified: boolean;
    is_published: boolean;
    entry_date?: string;
    created_at: string;
    patient: {
        name: string;
        image_url?: string;
    };
}

interface Stats {
    average_rating: number;
    total_reviews: number;
    rating_breakdown: { '5': number; '4': number; '3': number; '2': number; '1': number };
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ReviewsApiResponse {
    reviews: Review[];
    stats: Stats;
    pagination: Pagination;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single star icon rendered filled or empty */
const StarIcon = ({ filled }: { filled: boolean }) => (
    <Star
        className={cn(
            'w-3.5 h-3.5',
            filled ? 'fill-amber-500 text-amber-500' : 'text-white/20'
        )}
    />
);

/** Star breakdown progress bar for one rating level */
const BreakdownBar = ({
    star,
    count,
    total,
}: {
    star: number;
    count: number;
    total: number;
}) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-3 text-white/70 font-bold text-right">{star}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-6 text-white/60 font-medium">{count}</span>
        </div>
    );
};

/** Individual review card */
const ReviewCard = ({
    review,
    onDelete,
    onToggle,
    isToggling,
}: {
    review: Review;
    onDelete: (id: number) => void;
    onToggle: (id: number) => void;
    isToggling: boolean;
}) => (
    <div className={cn(
        "bg-white p-6 rounded-[24px] border transition-all duration-300 relative group",
        review.is_published
            ? "border-border hover:border-primary/20 hover:shadow-lg hover:shadow-border/30"
            : "border-dashed border-border/60 bg-muted/30 opacity-75 hover:opacity-100"
    )}>
        {/* Hidden badge */}
        {!review.is_published && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg border border-slate-200">
                <EyeOff size={10} />
                مخفي عن العامة
            </div>
        )}

        {/* Action buttons — visible on hover, top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {/* Toggle visibility */}
            <button
                onClick={() => onToggle(review.id)}
                disabled={isToggling}
                title={review.is_published ? 'إخفاء التقييم' : 'إظهار التقييم'}
                className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center border transition-colors disabled:opacity-50",
                    review.is_published
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700"
                        : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 hover:text-emerald-700"
                )}
            >
                {isToggling
                    ? <Loader2 size={13} className="animate-spin" />
                    : review.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            {/* Delete */}
            <button
                onClick={() => onDelete(review.id)}
                title="حذف التقييم"
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors"
            >
                <Trash2 size={13} />
            </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border-2 border-white ring-1 ring-muted overflow-hidden shadow-sm">
                    {review.patient.image_url && !review.is_anonymous ? (
                        <img
                            src={review.patient.image_url}
                            alt={review.patient.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-border text-muted-foreground">
                            <User className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            {review.patient.name}
                            {review.is_verified && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">
                                    <Award size={10} />
                                    مريض مؤكد
                                </span>
                            )}
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
                            <Calendar size={10} />
                            {format(
                                new Date(review.created_at || new Date()),
                                'd MMMM yyyy',
                                { locale: ar }
                            )}
                        </span>
                    </div>

                    {/* Stars + rating badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-0.5" dir="ltr">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={13}
                                    className={s <= review.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'fill-muted text-muted'}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                            <span className="text-xs font-black text-amber-600">{review.rating}</span>
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{review.rating_text}</span>
                    </div>
                </div>

                {/* Comment */}
                {review.comment ? (
                    <div className="relative bg-muted/40 p-4 rounded-2xl border border-border/30 group-hover:bg-primary/3 transition-colors">
                        <Quote className="absolute top-2 right-2 w-4 h-4 text-border/50" />
                        <p className="text-muted-foreground text-sm leading-relaxed relative z-10 pr-1">
                            {review.comment}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground/50 italic bg-muted/30 px-3 py-2 rounded-xl">
                        لم يترك المريض تعليقاً
                    </p>
                )}
            </div>
        </div>
    </div>
);


/** Delete confirmation modal */
const DeleteModal = ({
    open,
    onCancel,
    onConfirm,
    isDeleting,
}: {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl text-right z-10">
                <button
                    onClick={onCancel}
                    className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-border transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="w-16 h-16 rounded-[20px] bg-rose-50 flex items-center justify-center mx-auto mb-5">
                    <Trash2 className="w-7 h-7 text-rose-500" />
                </div>

                <h3 className="text-xl font-black text-foreground mb-2 text-center">
                    حذف التقييم
                </h3>
                <p className="text-muted-foreground font-bold text-sm mb-6 text-center leading-relaxed">
                    هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذه العملية.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 h-12 rounded-2xl border border-border font-black text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {isDeleting ? 'جاري الحذف...' : 'حذف التقييم'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ─── Main Component ───────────────────────────────────────────────────────────

const DoctorReviews = () => {
    const queryClient = useQueryClient();
    const [sortBy, setSortBy] = useState('newest');
    const [filterRating, setFilterRating] = useState('all');
    const [filterVisibility, setFilterVisibility] = useState('all'); // all | published | hidden
    const [page, setPage] = useState(1);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const handleSortChange = (v: string) => { setSortBy(v); setPage(1); };
    const handleFilterChange = (v: string) => { setFilterRating(v); setPage(1); };

    const { data: apiData, isLoading, isError } = useQuery<ReviewsApiResponse>({
        queryKey: ['doctor-reviews', sortBy, filterRating, page],
        queryFn: () =>
            doctorService.getReviews({
                sort: sortBy,
                rating: filterRating === 'all' ? undefined : filterRating,
                page,
                per_page: 15,
            }),
        placeholderData: (prev) => prev,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => doctorService.deleteReview(id),
        onSuccess: () => {
            toast.success('تم حذف التقييم بنجاح');
            setDeleteTargetId(null);
            queryClient.invalidateQueries({ queryKey: ['doctor-reviews'] });
        },
        onError: () => {
            toast.error('حدث خطأ أثناء الحذف، حاول مرة أخرى');
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => doctorService.toggleReview(id),
        onSuccess: (data) => {
            const msg = data?.is_published ? 'تم إظهار التقييم بنجاح ✅' : 'تم إخفاء التقييم بنجاح';
            toast.success(msg);
            setTogglingId(null);
            queryClient.invalidateQueries({ queryKey: ['doctor-reviews'] });
        },
        onError: () => {
            toast.error('حدث خطأ، حاول مرة أخرى');
            setTogglingId(null);
        },
    });

    const handleToggle = (id: number) => {
        setTogglingId(id);
        toggleMutation.mutate(id);
    };

    // Apply client-side visibility filter
    const allReviews: Review[] = apiData?.reviews ?? [];
    const reviews = filterVisibility === 'published'
        ? allReviews.filter(r => r.is_published)
        : filterVisibility === 'hidden'
            ? allReviews.filter(r => !r.is_published)
            : allReviews;

    const stats: Stats | null = apiData?.stats ?? null;
    const pagination = apiData?.pagination ?? null;
    const hiddenCount = allReviews.filter(r => !r.is_published).length;

    // ── Loading state ──────────────────────────────────────────────────────────
    if (isLoading && !apiData) {
        return (
            <div className="flex flex-col items-center justify-center p-24 bg-white/50 rounded-3xl border-2 border-dashed border-border">
                <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
                <p className="text-muted-foreground font-bold animate-pulse">
                    جاري تحميل آراء المرضى...
                </p>
            </div>
        );
    }

    // ── Error state ────────────────────────────────────────────────────────────
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-16 bg-red-50 rounded-3xl border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-black text-red-700 mb-1">
                    تعذّر تحميل التقييمات
                </h3>
                <p className="text-red-500 font-medium text-sm">
                    تحقق من اتصالك وحاول مرة أخرى.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">

            {/* ── Header + Stats ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-16 -mb-32 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-start gap-8">
                    {/* Title */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-500/20 rounded-xl backdrop-blur-md">
                                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">التقييمات والآراء</h1>
                        </div>
                        <p className="text-white/60 font-medium text-base max-w-sm">
                            تابع آراء مرضاك وقم بتحسين خدماتك الطبية بناءً على ملاحظاتهم القيمة.
                        </p>
                    </div>

                    {/* Stats card */}
                    {stats ? (
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 min-w-[260px]">
                            {/* Average + Stars */}
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                <div className="text-center">
                                    <span className="block text-4xl font-black text-amber-400 leading-none">
                                        {stats.average_rating.toFixed(1)}
                                    </span>
                                    <div className="flex gap-0.5 justify-center my-1.5" dir="ltr">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <StarIcon
                                                key={s}
                                                filled={s <= Math.round(stats.average_rating)}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                                        متوسط التقييم
                                    </span>
                                </div>
                                <div className="h-12 w-px bg-white/10" />
                                <div className="text-center">
                                    <span className="block text-4xl font-black text-white leading-none">
                                        {stats.total_reviews}
                                    </span>
                                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1 block">
                                        إجمالي التقييمات
                                    </span>
                                </div>
                            </div>

                            {/* Breakdown bars */}
                            <div className="space-y-1.5">
                                {([5, 4, 3, 2, 1] as const).map((star) => (
                                    <BreakdownBar
                                        key={star}
                                        star={star}
                                        count={stats.rating_breakdown[String(star) as keyof typeof stats.rating_breakdown]}
                                        total={stats.total_reviews}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* No reviews yet — placeholder */
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center min-w-[200px]">
                            <MessageCircle className="w-8 h-8 text-white/30 mx-auto mb-2" />
                            <p className="text-white/50 text-sm font-medium">
                                لا توجد إحصائيات بعد
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between sticky top-4 z-20 backdrop-blur-xl bg-muted/80 p-2 rounded-2xl border border-white/50 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

                    {/* Visibility filter */}
                    <Select value={filterVisibility} onValueChange={(v) => { setFilterVisibility(v); setPage(1); }}>
                        <SelectTrigger className="w-[150px] h-10 border-border bg-white hover:bg-muted rounded-xl font-bold text-sm">
                            <SelectValue placeholder="الظهور" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="published">المنشورة</SelectItem>
                            <SelectItem value="hidden">المخفية {hiddenCount > 0 && `(${hiddenCount})`}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Rating filter */}
                    <div className="relative">
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Select value={filterRating} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[160px] h-10 pr-9 border-border bg-white hover:bg-muted rounded-xl font-bold text-sm">
                                <SelectValue placeholder="تصفية التقييمات" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع التقييمات</SelectItem>
                                <SelectItem value="5">5 نجوم فقط</SelectItem>
                                <SelectItem value="4">4 نجوم وأكثر</SelectItem>
                                <SelectItem value="3">3 نجوم وأكثر</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-[150px] h-10 border-border bg-white hover:bg-muted rounded-xl font-bold text-sm">
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">الأحدث أولاً</SelectItem>
                            <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                            <SelectItem value="highest">الأعلى تقييماً</SelectItem>
                            <SelectItem value="lowest">الأقل تقييماً</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <span className="text-xs font-bold text-muted-foreground bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm hidden sm:inline-block">
                    يتم عرض {reviews.length} من {allReviews.length} تقييم
                </span>
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-16">
                    <Loader2 className="animate-spin text-primary w-10 h-10 mb-3" />
                    <p className="text-muted-foreground font-bold animate-pulse text-sm">
                        جاري التحديث...
                    </p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[32px] border border-border shadow-xl shadow-border/50">
                    <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20" />
                        <MessageCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-2">لا توجد تقييمات بعد</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto font-medium text-lg leading-relaxed">
                        {filterRating !== 'all'
                            ? 'لا توجد تقييمات تطابق هذا الفلتر. جرّب تغيير معايير البحث.'
                            : 'لم يقم أي مريض بتقييم خدماتك حتى الآن. استمر في تقديم رعاية ممتازة وستظهر التقييمات هنا قريباً.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up">
                    {reviews.map((review, idx) => (
                        <div
                            key={review.id ?? idx}
                            style={{ animationDelay: `${idx * 40}ms` }}
                            className="animate-fade-in"
                        >
                            <ReviewCard
                                review={review}
                                onDelete={(id) => setDeleteTargetId(id)}
                                onToggle={handleToggle}
                                isToggling={togglingId === review.id}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Delete Confirmation Modal ─────────────────────────────── */}
            <DeleteModal
                open={deleteTargetId !== null}
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={() => deleteTargetId !== null && deleteMutation.mutate(deleteTargetId)}
                isDeleting={deleteMutation.isPending}
            />

            {/* ── Pagination ───────────────────────────────────────────────── */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                        السابق
                    </button>

                    <span className="text-sm font-bold text-muted-foreground bg-white px-4 py-2 rounded-xl border border-border">
                        {page} / {pagination.last_page}
                    </span>

                    <button
                        onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                        disabled={page === pagination.last_page || isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        التالي
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DoctorReviews;
