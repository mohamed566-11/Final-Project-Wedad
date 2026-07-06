import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit2, Trash2, Calendar, Tag as TagIcon, X, MoreHorizontal, ArrowUpRight, Clock, CheckCircle2, AlertCircle, ImageIcon, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface ArticleCardProps {
    article: any;
    onDelete: (id: number) => void;
    onSubmit: (id: number) => void;
    onEdit: (id: number) => void;
}

const statusConfig = {
    published: {
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'منشور وبث مباشر'
    },
    pending: {
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        dot: 'bg-blue-500',
        icon: Clock,
        label: 'قيد المراجعة الفنية'
    },
    rejected: {
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        dot: 'bg-rose-500',
        icon: X,
        label: 'بحاجة لتعديل'
    },
    archived: {
        color: 'text-purple-600',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        dot: 'bg-purple-500',
        icon: Archive,
        label: 'مؤرشف'
    },
    draft: {
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        dot: 'bg-amber-500',
        icon: Edit2,
        label: 'مسودة محلية'
    }
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete, onSubmit, onEdit }) => {
    // Map backend status to our local status config
    // We treat 'approved' as 'published' to match the UI labels
    let statusKey = article.status as keyof typeof statusConfig;
    if (article.status === 'approved') statusKey = 'published' as any;
    if (article.status === 'pending_review') statusKey = 'pending' as any;

    const status = statusConfig[statusKey] || statusConfig.draft;
    const StatusIcon = status.icon;

    return (
        <div className="group relative bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col md:flex-row shadow-sm">

            {/* Image Section */}
            <div className="w-full md:w-[340px] relative overflow-hidden shrink-0 h-56 md:h-auto bg-slate-50 cursor-pointer" onClick={() => onEdit(article.id)}>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />

                {!article.image ? (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-slate-100 transition-colors">
                        <div className="absolute inset-0 bg-indigo-500/5 skew-x-12 scale-150 group-hover:rotate-12 transition-transform duration-700" />
                        <div className="relative z-10 w-20 h-20 rounded-[24px] bg-white shadow-xl shadow-indigo-500/5 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                            <ImageIcon className="w-10 h-10" />
                        </div>
                        <span className="relative z-10 mt-4 text-xs font-black text-slate-400 tracking-wider">لا يوجد غلاف مخصص</span>
                    </div>
                ) : (
                    <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                )}

                <div className="absolute top-4 right-4 z-20">
                    <span className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black backdrop-blur-xl shadow-lg border",
                        "bg-white/90 text-slate-800 border-white/20"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full shadow-sm", status.dot, "animate-pulse")} />
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative bg-gradient-to-l from-transparent to-slate-50/50">

                {/* Header (Meta) */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        {article.life_stage ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {article.life_stage.name_ar || article.life_stage.name}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide bg-slate-50 text-slate-500 border border-slate-100">
                                عام
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-5 text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Eye className="w-4 h-4 text-indigo-400" />
                            <span>{article.views_count?.toLocaleString('ar-EG') || 0}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span>{format(new Date(article.updated_at || article.created_at || new Date()), 'd MMM yyyy', { locale: ar })}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative group/content mb-6">
                    <div className="flex justify-between items-start gap-4">
                        <h3
                            onClick={() => onEdit(article.id)}
                            className="text-2xl md:text-3xl font-black text-slate-900 mb-3 leading-tight cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2 md:line-clamp-1"
                        >
                            {article.title}
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(article.id)}
                            className="shrink-0 rounded-full bg-slate-50 text-indigo-500 opacity-0 group-hover/content:opacity-100 hover:bg-indigo-50 transition-all -mt-1"
                        >
                            <ArrowUpRight className="w-5 h-5" />
                        </Button>
                    </div>
                    <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed line-clamp-2 md:w-11/12">
                        {article.excerpt || 'لا يوجد وصف مختصر لهذا المقال. يمكنك إضافة وصف لجذب انتباه القراء والظهور بشكل أفضل في محركات البحث.'}
                    </p>
                </div>

                {/* Actions Footer */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {article.status !== 'archived' && (
                            <Button
                                onClick={() => onEdit(article.id)}
                                className="h-12 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 hover:-translate-y-0.5 shadow-xl shadow-slate-200 hover:shadow-indigo-500/20 px-8 transition-all duration-300"
                            >
                                تعديل المحتوى
                            </Button>
                        )}

                        {(article.status === 'draft' || article.status === 'rejected') && (
                            <Button
                                variant="outline"
                                onClick={() => onSubmit(article.id)}
                                className="h-12 rounded-2xl border-indigo-200 bg-indigo-50 text-indigo-700 font-black hover:bg-indigo-600 hover:-translate-y-0.5 hover:text-white shadow-lg shadow-transparent hover:shadow-indigo-500/20 px-8 transition-all duration-300 gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {article.status === 'rejected' ? 'إعادة طلب النشر' : 'نشر المقال'}
                            </Button>
                        )}

                        {article.status === 'archived' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold border border-purple-100">
                                <Archive className="w-4 h-4" />
                                المقال مؤرشف بواسطة الإدارة
                            </div>
                        )}

                        {article.admin_notes && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">
                                <AlertCircle className="w-4 h-4" />
                                توجد ملاحظات من الإدارة
                            </div>
                        )}
                    </div>

                    {article.status !== 'archived' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200">
                                    <MoreHorizontal className="w-6 h-6" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-xl">
                                <DropdownMenuItem
                                    className="rounded-xl p-3 text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-black gap-3 cursor-pointer"
                                    onClick={() => onDelete(article.id)}
                                >
                                    <div className="p-2 bg-rose-100/50 rounded-xl">
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                    <span>حذف هذا المقال</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ArticleCard;
