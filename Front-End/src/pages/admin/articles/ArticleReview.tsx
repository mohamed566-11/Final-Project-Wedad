import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight, Clock, Eye, Calendar, User, CheckCircle,
  XCircle, Archive, AlertCircle, Loader2, BookOpen, ChevronRight, Share2, Printer, RefreshCw
} from "lucide-react";
import {
  getAdminArticle, approveArticle, rejectArticle, archiveArticle, restoreArticle, Article,
} from "@/services/articleService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/common/BackButton";
import { motion } from "framer-motion";

const ArticleReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await getAdminArticle(parseInt(id!));
      setArticle(response.data.article);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تحميل المقال", variant: "destructive" });
      navigate("/admin/articles");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await approveArticle(parseInt(id!));
      toast({ title: "تمت الموافقة", description: "تم نشر المقال بنجاح" });
      navigate("/admin/articles");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.response?.data?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) return;
    setProcessing(true);
    try {
      await rejectArticle(parseInt(id!), rejectReason);
      toast({ title: "تم الرفض", description: "تم رفض المقال وإبلاغ الطبيب" });
      navigate("/admin/articles");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.response?.data?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setProcessing(false);
      setRejectDialogOpen(false);
    }
  };

  const handleArchive = async () => {
    setProcessing(true);
    try {
      await archiveArticle(parseInt(id!));
      toast({ title: "تمت الأرشفة", description: "تم أرشفة المقال" });
      fetchArticle();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.response?.data?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    setProcessing(true);
    try {
      await restoreArticle(parseInt(id!));
      toast({ title: "تمت الاستعادة", description: "تم استعادة المقال" });
      fetchArticle();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.response?.data?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-10" dir="rtl">
        <div className="container mx-auto px-4 max-w-6xl">
          <Skeleton className="h-10 w-48 mb-10 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
            <div className="space-y-8">
              <Skeleton className="h-48 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">المقال غير موجود</h1>
          <p className="text-slate-500 mb-8">عذراً، لم نتمكن من العثور على المقال المطلوب أو تم حذفه.</p>
          <Button onClick={() => navigate('/admin/articles')} className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 h-12">
            العودة لقائمة المقالات
          </Button>
        </motion.div>
      </div>
    );
  }

  const getStatusBadge = (status: string, text: string) => {
    const styles: Record<string, string> = {
      'approved': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'pending_review': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'rejected': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      'archived': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      'draft': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    };
    const icons: Record<string, any> = {
      'approved': <CheckCircle className="w-4 h-4 mr-1.5" />,
      'pending_review': <Clock className="w-4 h-4 mr-1.5" />,
      'rejected': <XCircle className="w-4 h-4 mr-1.5" />,
      'archived': <Archive className="w-4 h-4 mr-1.5" />,
      'draft': <BookOpen className="w-4 h-4 mr-1.5" />,
    };

    return (
      <div className={`px-4 py-2 ${styles[status] || styles.draft} rounded-xl border flex items-center shadow-sm backdrop-blur-md`}>
        {icons[status]}
        <span className="font-bold text-sm">{text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 lg:py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Navigation Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm rounded-xl" />
            <div className="flex items-center text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <Link to="/admin/articles" className="hover:text-violet-600 transition-colors">إدارة المقالات</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
              <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-md">{article.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(article.status, article.status_badge)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Metadata Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
              {article.image_url && (
                <div className="w-full h-64 sm:h-80 md:h-[400px] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent z-10"></div>
                  <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap gap-2">
                    {article.life_stage && (
                      <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/20 px-3 py-1.5 text-sm font-medium shadow-lg">
                        {article.life_stage.name_ar}
                      </Badge>
                    )}
                    {article.tags?.map((tag) => (
                      <Badge key={tag} className="bg-black/30 hover:bg-black/40 backdrop-blur-md text-white border-white/10 px-3 py-1.5 text-sm font-medium shadow-lg">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <CardContent className={`p-8 ${!article.image_url ? 'pt-10' : 'pt-8'}`}>
                {!article.image_url && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {article.life_stage && (
                      <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-none px-3 py-1.5 text-sm font-medium shadow-sm">
                        {article.life_stage.name_ar}
                      </Badge>
                    )}
                    {article.tags?.map((tag) => (
                      <Badge key={tag} className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-3 py-1.5 text-sm font-medium shadow-sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 leading-[1.3] mb-6">
                  {article.title}
                </h1>

                {/* Meta stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">وقت القراءة</span>
                    <span className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Clock className="w-4 h-4 text-violet-500" />
                      {article.reading_time || 0} دقائق
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">المشاهدات</span>
                    <span className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Eye className="w-4 h-4 text-emerald-500" />
                      {article.views_count}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">تاريخ الإنشاء</span>
                    <span className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {new Date(article.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">رقم المقال</span>
                    <span className="text-slate-700 font-mono font-bold">#{article.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Excerpt */}
            {article.excerpt && (
              <Card className="border-none shadow-md shadow-violet-200/20 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-50 to-white relative">
                <div className="absolute top-0 right-0 w-2 h-full bg-violet-400"></div>
                <CardContent className="p-8">
                  <div className="flex gap-4">
                    <BookOpen className="w-8 h-8 text-violet-300 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-violet-900 mb-3">ملخص المقال</h3>
                      <p className="text-slate-700 leading-relaxed font-medium text-lg">{article.excerpt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Article Content Viewer */}
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">محتوى المقال</CardTitle>
                  <p className="text-slate-500 mt-1">يُرجى مراجعة المحتوى العلمي واللغوي بدقة.</p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose prose-lg prose-slate prose-headings:text-slate-800 prose-a:text-violet-600 prose-img:rounded-2xl max-w-none article-content custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: article.content || "" }} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar & Actions */}
          <div className="space-y-8">
            {/* Primary Actions Card */}
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-white/80 backdrop-blur-xl sticky top-6 z-10 ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-3xl pb-6">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  الإجراءات المتاحة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {article.status === "pending_review" && (
                  <div className="space-y-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 rounded-xl text-white font-bold text-lg"
                        onClick={handleApprove}
                        disabled={processing}
                      >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                          <>
                            <CheckCircle className="w-5 h-5 ml-2" />
                            موافقة ونشر الآن
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full h-14 border-2 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-lg bg-white"
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={processing}
                      >
                        <XCircle className="w-5 h-5 ml-2" />
                        عدم الموافقة (رفض)
                      </Button>
                    </motion.div>
                  </div>
                )}

                {article.status === "approved" && (
                  <div className="space-y-3">
                    <Link to={`/articles/${article.slug}`} target="_blank" className="block">
                      <Button className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md font-bold text-lg">
                        <BookOpen className="w-5 h-5 ml-2" />
                        عرض على المنصة
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full h-12 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl font-semibold"
                      onClick={handleArchive}
                      disabled={processing}
                    >
                      <Archive className="w-4 h-4 ml-2" /> أرشفة بدلاً من النشر
                    </Button>
                  </div>
                )}

                {article.status === "archived" && (
                  <Button
                    className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 shadow-md text-white rounded-xl font-bold text-lg"
                    onClick={handleRestore}
                    disabled={processing}
                  >
                    <RefreshCw className="w-5 h-5 ml-2" /> استعادة وإعادة نشر
                  </Button>
                )}

                {article.status === "rejected" && (
                  <div className="p-5 bg-rose-50/80 rounded-2xl border border-rose-100 relative overflow-hidden">
                    <div className="absolute -left-4 -top-4 w-12 h-12 bg-rose-100 rounded-full blur-xl"></div>
                    <div className="relative z-10">
                      <p className="text-sm font-bold text-rose-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        سبب الرفض المسجل:
                      </p>
                      <p className="text-sm border-r-2 border-rose-300 pr-3 text-rose-700 font-medium leading-relaxed bg-white/50 p-2 rounded-l-lg">
                        {article.admin_notes || "غير مسجل"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Author Information */}
            {article.doctor && (
              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <div className="h-20 bg-gradient-to-l from-violet-500 to-fuchsia-500 opacity-20"></div>
                <CardContent className="p-6 relative pt-0">
                  <div className="flex flex-col items-center justify-center -mt-10 mb-5 relative z-10">
                    {article.doctor.image_url ? (
                      <img
                        src={article.doctor.image_url}
                        alt={article.doctor.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-10 h-10 text-violet-400" />
                      </div>
                    )}
                    <h4 className="font-black text-xl text-slate-800 mt-4">{article.doctor.name}</h4>
                    <p className="text-sm font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mt-2">
                      {article.doctor.specialization_ar}
                    </p>
                  </div>

                  {article.doctor.bio && (
                    <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
                      {article.doctor.bio}
                    </p>
                  )}

                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                    {article.doctor.years_of_experience && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium text-sm">سنوات الخبرة</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{article.doctor.years_of_experience}</span>
                      </div>
                    )}
                    {article.doctor.total_articles !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium text-sm">المقالات المنشورة</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{article.doctor.total_articles}</span>
                      </div>
                    )}
                    {article.doctor.rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium text-sm">متوسط التقييم</span>
                        <span className="font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                          {article.doctor.rating} <span className="text-[10px]">⭐</span>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Track Record */}
            {article.reviewer && article.reviewed_at && (
              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-slate-800">مسار المراجعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">

                    {/* Submitted Event */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm mr-4 text-left">
                        <div className="font-bold text-slate-800 text-sm">تم التقديم</div>
                        <time className="text-xs text-slate-500 font-medium inline-block mt-1">
                          {new Date(article.created_at).toLocaleDateString("ar-EG")}
                        </time>
                      </div>
                    </div>

                    {/* Reviewed Event */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-violet-100 text-violet-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-violet-50 p-3 rounded-xl border border-violet-100 shadow-sm text-left">
                        <div className="font-bold text-violet-900 text-sm">مراجعة: {article.reviewer.name}</div>
                        <time className="text-xs text-violet-600 font-medium inline-block mt-1">
                          {new Date(article.reviewed_at).toLocaleDateString("ar-EG")}
                        </time>
                      </div>
                    </div>

                    {/* Published Event */}
                    {article.published_at && (
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm mr-4 text-left">
                          <div className="font-bold text-emerald-900 text-sm">تم النشر</div>
                          <time className="text-xs text-emerald-600 font-medium inline-block mt-1">
                            {new Date(article.published_at).toLocaleDateString("ar-EG")}
                          </time>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog - Refined */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[500px] p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-rose-400 to-rose-600"></div>
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-2xl font-black text-rose-700 flex items-center gap-2">
                <XCircle className="w-6 h-6" /> إرجاع المقال للطبيب
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                يرجى توضيح سبب عدم الموافقة بشكل دقيق. ستساعد هذه الملاحظات الطبيب على تحسين المقال وإعادة تقديمه بصورة أفضل.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: المعلومات الواردة في الفقرة الثانية تحتاج لمراجعة..."
                rows={5}
                className="w-full p-4 rounded-2xl border-slate-200 bg-slate-50 border shadow-inner text-slate-800 resize-none focus-visible:ring-rose-200"
              />
              <p className={`text-xs font-bold ${rejectReason.length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                {rejectReason.length}/1000 - الحد الأدنى 10 أحرف
              </p>
            </div>
            <DialogFooter className="mt-8 flex gap-3 border-t border-slate-100 pt-5">
              <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setRejectDialogOpen(false)}>
                إلغاء التراجع
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing || rejectReason.length < 10}
                className="flex-1 rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-200"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'تأكيد الرفض'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .article-content h1, .article-content h2, .article-content h3, .article-content h4 {
          color: #1e293b;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .article-content h2 { font-size: 1.5rem; }
        .article-content h3 { font-size: 1.25rem; }
        .article-content p {
          color: #334155;
          line-height: 1.8;
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
        }
        .article-content strong { color: #0f172a; font-weight: 700; }
        .article-content ul, .article-content ol {
          margin: 1.5rem 0;
          padding-right: 1.5rem;
          color: #334155;
          font-size: 1.125rem;
        }
        .article-content li { margin-bottom: 0.5rem; }
        .article-content blockquote {
          background: #f8fafc;
          border-right: 4px solid #8b5cf6;
          padding: 1.5rem;
          margin: 2rem 0;
          border-radius: 0.5rem;
          color: #475569;
          font-style: italic;
          font-size: 1.25rem;
        }
        .article-content img {
          border-radius: 1rem;
          margin: 2rem auto;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
};

export default ArticleReview;
