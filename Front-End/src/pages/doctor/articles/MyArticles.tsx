import React, { useState } from 'react';
import { useDoctorArticles, useDeleteArticle, useSubmitArticle } from '@/hooks/useDoctorArticles';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, BookOpen, Layout, Globe, FileEdit, BarChart3, TrendingUp, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ArticleCard from '@/components/doctor/articles/ArticleCard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyArticles = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: response, isLoading } = useDoctorArticles({
        search,
        status: status === 'all' ? undefined : status,
        per_page: 10
    });

    const deleteMutation = useDeleteArticle();
    const submitMutation = useSubmitArticle();

    const articles = response?.data?.articles || [];
    const stats = response?.data?.stats;

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId, {
                onSuccess: () => setDeleteId(null)
            });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
            {/* Premium Header Section */}
            <div className="relative rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] p-8 md:p-12 text-white overflow-hidden shadow-2xl isolate">

                {/* Dynamic Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/20 rounded-full blur-[100px] -ml-20 -mb-32 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
                            <Sparkles className="w-4 h-4 text-rose-400" />
                            <span className="text-xs font-bold text-rose-100 uppercase tracking-widest">منصة صناع المحتوى الطِبي</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-indigo-100 tracking-tight leading-tight mb-4">
                            ارتقِ بمسيرتك المهنية <br className="hidden md:block" /> وشارك معرفتك الطبية
                        </h1>
                        <p className="text-indigo-200/80 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                            انشر مقالات طبية موثوقة، قم بتوعية آلاف المرضى، وابنِ هويتك الرقمية كخبير صحي موثوق.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto shrink-0 flex flex-col gap-4">
                        <Button
                            onClick={() => navigate('/doctor/articles/create')}
                            className="h-16 px-8 w-full md:w-auto bg-gradient-to-l from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-900/40 gap-3 group transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-lg">كتابة مقال جديد</span>
                        </Button>
                        <p className="text-xs text-indigo-200/60 font-bold text-center flex justify-center items-center gap-2">
                            محفوظ تلقائياً <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </p>
                    </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 relative z-10 border-t border-white/10 pt-8">
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex items-center gap-5 hover:bg-white/[0.06] transition-all hover:-translate-y-1 shadow-lg">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                            <Layout className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="block text-blue-200/60 text-xs font-black uppercase tracking-widest mb-1">إجمالي المقالات</span>
                            <span className="text-3xl font-black text-white">{stats?.total || 0}</span>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex items-center gap-5 hover:bg-white/[0.06] transition-all hover:-translate-y-1 shadow-lg">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                            <Globe className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="block text-emerald-200/60 text-xs font-black uppercase tracking-widest mb-1">مقالات منشورة</span>
                            <span className="text-3xl font-black text-white">{stats?.approved || 0}</span>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex items-center gap-5 hover:bg-white/[0.06] transition-all hover:-translate-y-1 shadow-lg">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-inner">
                            <FileEdit className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="block text-amber-200/60 text-xs font-black uppercase tracking-widest mb-1">مسودات معلقة</span>
                            <span className="text-3xl font-black text-white">{(stats?.draft || 0) + (stats?.pending_review || 0) + (stats?.rejected || 0) + (stats?.archived || 0)}</span>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex items-center gap-5 hover:bg-white/[0.06] transition-all hover:-translate-y-1 shadow-lg">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-rose-500/20 to-rose-600/20 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-inner">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="block text-rose-200/60 text-xs font-black uppercase tracking-widest mb-1">إجمالي المشاهدات</span>
                            <span className="text-3xl font-black text-white">{stats?.total_views || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-6 sticky top-4 z-30 mb-8 pt-4">
                <div className="relative flex-1 group">
                    <div className="bg-white p-2.5 rounded-full flex items-center gap-3 border border-slate-200 shadow-xl shadow-slate-200/40 relative z-10 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 hover:shadow-indigo-500/10">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center ml-1 border border-slate-100">
                            <Search className="w-5 h-5 text-indigo-500" />
                        </div>
                        <Input
                            placeholder="ابحث في مقالاتك عبر العنوان أو الكلمات المفتاحية..."
                            className="h-12 border-none bg-transparent focus:ring-0 text-lg font-bold placeholder:font-medium placeholder:text-slate-400 px-2"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors mr-2"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-auto overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                    <Tabs value={status} onValueChange={setStatus} className="w-full h-full min-w-max">
                        <TabsList className="bg-white p-2 rounded-full shadow-xl shadow-slate-200/40 border border-slate-200 flex gap-2 h-auto">
                            <TabsTrigger value="all" className="rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 transition-all duration-300">الكل</TabsTrigger>
                            <TabsTrigger value="approved" className="rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-500 transition-all duration-300">منشورة</TabsTrigger>
                            <TabsTrigger value="draft" className="rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white text-slate-500 transition-all duration-300">مسودة</TabsTrigger>
                            <TabsTrigger value="pending_review" className="rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-500 transition-all duration-300">مراجعة</TabsTrigger>
                            <TabsTrigger value="rejected" className="rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-rose-500 data-[state=active]:text-white text-slate-500 transition-all duration-300">مرفوضة</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-32 bg-white/40 backdrop-blur-xl rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-rose-500/5 opacity-50"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <Loader2 className="animate-spin text-indigo-500 w-14 h-14 mb-6" />
                        <p className="text-slate-500 font-black text-xl animate-pulse">جاري تحميل الإبداع...</p>
                    </div>
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-rose-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
                            <div className="absolute inset-2 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-full opacity-10" />
                            <BookOpen className="w-12 h-12 text-indigo-600 relative z-10" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">لا توجد مقالات {status !== 'all' ? 'في هذه الفئة' : 'بعد'}</h3>
                        <p className="text-slate-500 mb-10 max-w-lg mx-auto font-medium text-lg leading-relaxed">
                            هذه المساحة تنتظر أولى إبداعاتك. ابدأ بكتابة مقالات تبرز خبرتك الطبية لتفيد ملايين المرضى.
                        </p>
                        {status === 'all' && (
                            <Button onClick={() => navigate('/doctor/articles/create')} className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black gap-3 text-lg shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all duration-300">
                                <Plus className="w-6 h-6 bg-white/20 rounded-full p-1" />
                                ابدأ الكتابة الآن
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 animate-slide-up">
                    {articles.map((article: any, index: number) => (
                        <div key={article.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                            <ArticleCard
                                article={article}
                                onDelete={(id) => setDeleteId(id)}
                                onEdit={(id) => navigate(`/doctor/articles/${id}/edit`)}
                                onSubmit={(id) => submitMutation.mutate(id)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف المقال بشكل نهائي ولا يمكن استرجاعه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MyArticles;
