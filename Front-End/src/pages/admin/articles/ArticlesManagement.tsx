import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, FileText, Clock, Eye, CheckCircle,
    XCircle, Archive, AlertCircle, User, Filter, MoreVertical, BookOpen, RefreshCw
} from 'lucide-react';
import { Article } from '@/services/articleService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useArticles, useApproveArticle, useRejectArticle, useArchiveArticle, useRestoreArticle
} from '@/hooks/useAdminQueries';
import { motion, AnimatePresence } from 'framer-motion';

const ArticlesManagement = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // React Query Hooks
    const {
        data: articlesResponse,
        isLoading: loading,
        refetch
    } = useArticles({
        search,
        status: statusFilter,
        page: currentPage,
    });

    const approveMutation = useApproveArticle();
    const rejectMutation = useRejectArticle();
    const archiveMutation = useArchiveArticle();
    const restoreMutation = useRestoreArticle();

    // Dialog State
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [articleToReject, setArticleToReject] = useState<Article | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [articleToApprove, setArticleToApprove] = useState<Article | null>(null);

    const [hiddenArticleIds, setHiddenArticleIds] = useState<number[]>([]);
    const [localArticleStatuses, setLocalArticleStatuses] = useState<Record<number, string>>({});

    const rawArticles = articlesResponse?.data?.articles || [];
    const articles = rawArticles
        .map((a: Article) => ({
            ...a,
            status: localArticleStatuses[a.id] || a.status
        }))
        .filter((a: Article) => !hiddenArticleIds.includes(a.id))
        .filter((a: Article) => {
            if (statusFilter === '') return true;
            return a.status === statusFilter;
        });

    const stats = articlesResponse?.data?.stats;

    const displayedStats = stats ? {
        ...stats,
        pending_review: Math.max(0, stats.pending_review - hiddenArticleIds.length),
        approved: stats.approved + hiddenArticleIds.length
    } : null;

    const pagination = articlesResponse?.data?.pagination;
    const totalPages = pagination?.last_page || 1;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handleApprove = (article: Article) => {
        setArticleToApprove(article);
        setApproveDialogOpen(true);
    };

    const confirmApprove = () => {
        if (!articleToApprove) return;
        approveMutation.mutate(articleToApprove.id, {
            onSuccess: () => {
                toast({ title: 'تمت الموافقة', description: 'تم نشر المقال بنجاح' });
                setHiddenArticleIds(prev => [...prev, articleToApprove.id]);
                setApproveDialogOpen(false);
                setArticleToApprove(null);
                refetch();
            },
            onError: (error: any) => {
                toast({ title: 'خطأ', description: error.response?.data?.message || 'حدث خطأ', variant: 'destructive' });
                setApproveDialogOpen(false);
            }
        });
    };

    const handleReject = () => {
        if (!articleToReject || !rejectReason.trim()) return;
        rejectMutation.mutate({ id: articleToReject.id, rejection_reason: rejectReason }, {
            onSuccess: () => {
                toast({ title: 'تم الرفض', description: 'تم رفض المقال وإبلاغ الطبيب' });
                setRejectDialogOpen(false);
                setRejectReason('');
                setArticleToReject(null);
                refetch();
            },
            onError: (error: any) => {
                toast({ title: 'خطأ', description: error.response?.data?.message || 'حدث خطأ', variant: 'destructive' });
            }
        });
    };

    const handleArchive = (article: Article) => {
        setLocalArticleStatuses(prev => ({ ...prev, [article.id]: 'archived' }));
        archiveMutation.mutate(article.id, {
            onSuccess: () => {
                toast({ title: 'تمت الأرشفة', description: 'تم أرشفة المقال بنجاح' });
                refetch();
            },
            onError: (error: any) => {
                toast({ title: 'خطأ', description: error.response?.data?.message || 'حدث خطأ', variant: 'destructive' });
                setLocalArticleStatuses(prev => {
                    const next = { ...prev };
                    delete next[article.id];
                    return next;
                });
            }
        });
    };

    const handleRestore = (article: Article) => {
        setLocalArticleStatuses(prev => ({ ...prev, [article.id]: 'draft' }));
        restoreMutation.mutate(article.id, {
            onSuccess: () => {
                toast({ title: 'تمت الاستعادة', description: 'تم استعادة المقال للغلق والمسودة بنجاح' });
                refetch();
            },
            onError: (error: any) => {
                toast({ title: 'خطأ', description: error.response?.data?.message || 'حدث خطأ', variant: 'destructive' });
                setLocalArticleStatuses(prev => {
                    const next = { ...prev };
                    delete next[article.id];
                    return next;
                });
            }
        });
    };

    const StatusBadge = ({ status, text }: { status: string, text: string }) => {
        const styles: Record<string, string> = {
            'approved': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            'pending_review': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            'rejected': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
            'archived': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
            'draft': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        };
        const icons: Record<string, any> = {
            'approved': <CheckCircle className="w-3.5 h-3.5 mr-1" />,
            'pending_review': <Clock className="w-3.5 h-3.5 mr-1" />,
            'rejected': <XCircle className="w-3.5 h-3.5 mr-1" />,
            'archived': <Archive className="w-3.5 h-3.5 mr-1" />,
            'draft': <FileText className="w-3.5 h-3.5 mr-1" />,
        };
        const labels: Record<string, string> = {
            'approved': 'منشور',
            'pending_review': 'قيد المراجعة',
            'rejected': 'مرفوض',
            'archived': 'مؤرشف',
            'draft': 'مسودة',
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center w-max ${styles[status] || styles.draft}`}>
                {icons[status]}
                {labels[status] || text}
            </span>
        );
    };

    const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass, statusKey, isActive }: any) => (
        <Card
            onClick={() => { setStatusFilter(statusKey === 'all' ? "" : statusKey); setCurrentPage(1); }}
            className={`overflow-hidden relative shadow-sm cursor-pointer transition-all duration-300 ${gradientClass} ${isActive ? 'ring-2 ring-violet-500 scale-105 shadow-md z-10' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform duration-500 ${isActive ? 'scale-125' : ''}`}>
                <Icon className="w-16 h-16 mr-[-20%] mt-[-20%]" />
            </div>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${colorClass} bg-white/60 backdrop-blur-sm self-start shadow-sm`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
                </div>
                <p className={`text-sm font-bold truncate ${isActive ? 'text-violet-700' : 'text-slate-600'}`}>{title}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 py-8" dir="rtl">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-2">
                            إدارة المقالات
                            <span className="inline-block ml-3 w-2 h-2 rounded-full bg-violet-600 animate-pulse"></span>
                        </h1>
                        <p className="text-slate-500 font-medium">التحكم الشامل ومراجعة مقالات أطباء المنصة</p>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ابحث بعنوان أو طبيب..."
                                className="pl-10 pr-10 py-5 rounded-2xl border-slate-200 bg-white/80 shadow-sm focus-visible:ring-violet-500 transition-all font-medium"
                            />
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </form>

                        <div className="relative min-w-[200px]">
                            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setCurrentPage(1); }}>
                                <SelectTrigger className="w-full py-5 rounded-2xl border-slate-200 bg-white/80 shadow-sm font-medium">
                                    <SelectValue placeholder="جميع المقالات" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200">
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="pending_review">قيد المراجعة</SelectItem>
                                    <SelectItem value="approved">منشور</SelectItem>
                                    <SelectItem value="rejected">مرفوض</SelectItem>
                                    <SelectItem value="draft">مسودات</SelectItem>
                                </SelectContent>
                            </Select>
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Statistics Overview */}
                {displayedStats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10 pb-4">
                        <StatCard statusKey="all" isActive={statusFilter === ''} title="إجمالي المقالات" value={displayedStats.total} icon={BookOpen} colorClass="text-violet-600" gradientClass="bg-gradient-to-br from-violet-50 to-white" />
                        <StatCard statusKey="pending_review" isActive={statusFilter === 'pending_review'} title="قيد المراجعة" value={displayedStats.pending_review} icon={Clock} colorClass="text-amber-500" gradientClass="bg-gradient-to-br from-amber-50 to-white" />
                        <StatCard statusKey="approved" isActive={statusFilter === 'approved'} title="منشور" value={displayedStats.approved} icon={CheckCircle} colorClass="text-emerald-500" gradientClass="bg-gradient-to-br from-emerald-50 to-white" />
                        <StatCard statusKey="rejected" isActive={statusFilter === 'rejected'} title="مرفوض" value={displayedStats.rejected} icon={XCircle} colorClass="text-rose-500" gradientClass="bg-gradient-to-br from-rose-50 to-white" />
                        <StatCard statusKey="draft" isActive={statusFilter === 'draft'} title="في المسودة" value={displayedStats.draft} icon={FileText} colorClass="text-slate-500" gradientClass="bg-gradient-to-br from-slate-50 to-white" />
                        <StatCard statusKey="archived" isActive={statusFilter === 'archived'} title="مؤرشف" value={displayedStats.archived} icon={Archive} colorClass="text-indigo-500" gradientClass="bg-gradient-to-br from-indigo-50 to-white" />
                    </div>
                )}

                {/* Main Content Area */}
                <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-5 rounded-tr-3xl">المقال</th>
                                    <th className="px-6 py-5">الطبيب</th>
                                    <th className="px-6 py-5">الحالة</th>
                                    <th className="px-6 py-5">المدة & المشاهدات</th>
                                    <th className="px-6 py-5 rounded-tl-3xl text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array(5).fill(0).map((_, idx) => (
                                        <tr key={idx} className="bg-white">
                                            <td className="px-6 py-4"><Skeleton className="h-12 w-48 rounded-xl" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-32 rounded-xl" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-24 rounded-full" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                                            <td className="px-6 py-4 text-left"><Skeleton className="h-10 w-24 rounded-xl inline-block" /></td>
                                        </tr>
                                    ))
                                ) : articles.length > 0 ? (
                                    <AnimatePresence>
                                        {articles.map((article: Article) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={article.id}
                                                className="bg-white hover:bg-slate-50/80 transition-colors group"
                                            >
                                                <td className="px-6 py-5 min-w-[280px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-100/50">
                                                            {article.image_url ? (
                                                                <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                    <BookOpen className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3
                                                                onClick={() => navigate(`/admin/articles/${article.id}`)}
                                                                className="font-bold text-slate-800 text-base mb-1 cursor-pointer hover:text-violet-600 transition-colors line-clamp-1"
                                                                title={article.title}
                                                            >
                                                                {article.title}
                                                            </h3>
                                                            <p className="text-xs text-slate-400">
                                                                تاريخ الإنشاء: {new Date(article.created_at).toLocaleDateString('ar-EG')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 min-w-[180px]">
                                                    {article.doctor && (
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={article.doctor.image_url || '/placeholder-avatar.png'}
                                                                alt={article.doctor.name}
                                                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-slate-700 text-sm">{article.doctor.name}</p>
                                                                <p className="text-xs text-violet-500 font-medium">{article.doctor.specialization_ar}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <StatusBadge status={article.status} text={article.status_badge} />
                                                </td>

                                                <td className="px-6 py-5 whitespace-nowrap text-slate-500 font-medium">
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1.5" title="دقائق القراءة">
                                                            <Clock className="w-4 h-4 text-amber-500" />
                                                            {article.reading_time || 0} د
                                                        </span>
                                                        <span className="flex items-center gap-1.5" title="المشاهدات">
                                                            <Eye className="w-4 h-4 text-emerald-500" />
                                                            {article.views_count}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-left whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => navigate(`/admin/articles/${article.id}`)}
                                                            className="h-9 font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl px-3"
                                                        >
                                                            مراجعة والتفاصيل
                                                        </Button>

                                                        {article.status === 'pending_review' && (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => handleApprove(article)}
                                                                    disabled={approveMutation.isPending}
                                                                    className="h-9 w-9 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl shadow-none"
                                                                    title="موافقة"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => { setArticleToReject(article); setRejectDialogOpen(true); }}
                                                                    disabled={rejectMutation.isPending}
                                                                    className="h-9 w-9 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl shadow-none"
                                                                    title="رفض"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {article.status === 'approved' && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleArchive(article)}
                                                                disabled={archiveMutation.isPending}
                                                                className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                                                title="أرشفة"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {article.status === 'archived' && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleRestore(article)}
                                                                disabled={restoreMutation.isPending}
                                                                className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
                                                                title="إعادة النشر (فك الأرشفة)"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                                                    <FileText className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-700 mb-1">لا توجد مقالات لعرضها</h3>
                                                <p className="text-sm">لم نتمكن من العثور على أي مقالات تطابق شروط التصفية الخاصة بك.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-medium">
                                صفحة <span className="font-bold text-slate-800">{currentPage}</span> من <span className="font-bold text-slate-800">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className="rounded-xl border-slate-200 shadow-sm"
                                >
                                    السابق
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="rounded-xl border-slate-200 shadow-sm"
                                >
                                    التالي
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Dialogs */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent dir="rtl" className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-md">
                    <div className="h-2 bg-gradient-to-r from-rose-400 to-rose-600"></div>
                    <div className="p-6">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <XCircle className="w-6 h-6 text-rose-500" />
                                إرجاع المقال للطبيب
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 mt-2">
                                يرجى كتابة سبب الرفض بالتفصيل لمساعدة الطبيب على تعديل المقال بما يتناسب مع معاييرنا الطبية.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="مثال: يرجى مراجعة المصادر الطبية وتصحيح المعلومات الواردة في الفقرة الثانية..."
                                className="resize-none rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-rose-200"
                                rows={5}
                            />
                            <p className={`text-xs font-medium text-left ${rejectReason.length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {rejectReason.length}/1000 - مطلوب 10 أحرف كحد أدنى
                            </p>
                        </div>
                        <DialogFooter className="mt-6 flex sm:justify-start gap-2 border-t pt-4 border-slate-100">
                            <Button variant="outline" className="rounded-xl flex-1 border-slate-200 shadow-sm" onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
                            <Button
                                className="rounded-xl flex-1 bg-rose-600 hover:bg-rose-700 shadow-rose-200 shadow-md text-white font-bold"
                                onClick={handleReject}
                                disabled={rejectMutation.isPending || rejectReason.length < 10}
                            >
                                {rejectMutation.isPending ? 'جاري الإرجاع...' : 'تأكيد الرفض'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent dir="rtl" className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-md">
                    <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                    <div className="p-6">
                        <DialogHeader className="mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-center">أنت على وشك النشر</DialogTitle>
                            <DialogDescription className="text-center text-slate-500 pt-2 text-base">
                                هل تأكدت من صحة المقال علمياً وإملائياً؟
                                <span className="block mt-2 font-bold text-slate-800 bg-slate-100 p-2 rounded-lg truncate text-sm px-4 mx-auto w-max max-w-full">
                                    {articleToApprove?.title}
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6 flex flex-row gap-2 w-full pt-4 border-t border-slate-100">
                            <Button variant="outline" className="rounded-xl flex-1 border-slate-200 shadow-sm" onClick={() => setApproveDialogOpen(false)}>العودة للمراجعة</Button>
                            <Button
                                className="rounded-xl flex-1 bg-gradient-to-r hover:to-emerald-700 from-emerald-500 to-emerald-600 shadow-emerald-200 shadow-md text-white font-bold"
                                onClick={confirmApprove}
                                disabled={approveMutation.isPending}
                            >
                                {approveMutation.isPending ? 'جاري النشر...' : 'موافقة ونشر الآن'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ArticlesManagement;
