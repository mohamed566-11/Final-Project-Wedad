import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Calendar,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plus,
    Stethoscope,
    Sparkles,
    ChevronLeft,
    Search,
    Filter,
    Clock,
    User,
    ChevronDown,
    LayoutGrid,
    LayoutList,
    Download,
    Loader2,
    Pill
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsultationCard } from '@/components/consultations/ConsultationCard';
import { usePatientConsultations, useCancelConsultation } from '@/hooks/usePatientQueries';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import BackButton from '@/components/common/BackButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabType = 'upcoming' | 'past' | 'cancelled';

export const MyConsultations = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    // React Query Hooks
    const { data: consultationsData, isLoading: loading } = usePatientConsultations({
        upcoming: activeTab === 'upcoming' ? true : undefined,
        past: activeTab === 'past' ? true : undefined,
        status: activeTab === 'cancelled' ? 'cancelled_by_patient,cancelled_by_doctor' : undefined,
    });

    const cancelMutation = useCancelConsultation();

    // Enhanced Mapping
    const consultationsRaw = consultationsData?.consultations;
    const consultations = Array.isArray(consultationsRaw)
        ? consultationsRaw
        : (consultationsRaw as any)?.data || [];

    const stats = consultationsData?.stats || {
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
    };

    const handleAction = (action: string, consultationId: number) => {
        setSelectedConsultation(consultationId);
        if (action === 'cancel') {
            setShowCancelModal(true);
        } else if (action === 'reschedule') {
            navigate(`/patient/consultations/book/${consultationId}?reschedule=true`);
        }
    };

    const handleCancelConfirm = async () => {
        if (!selectedConsultation || !cancelReason.trim()) {
            toast.error('يرجى إدخال سبب الإلغاء');
            return;
        }

        cancelMutation.mutate({ id: selectedConsultation, reason: cancelReason }, {
            onSuccess: () => {
                toast.success('تم إلغاء الاستشارة بنجاح');
                setShowCancelModal(false);
                setCancelReason('');
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || 'حدث خطأ أثناء الإلغاء';
                toast.error(message);
            }
        });
    };

    const tabs = [
        {
            key: 'upcoming' as TabType,
            label: 'القادمة',
            icon: CalendarDays,
            count: stats.upcoming,
            color: 'text-primary',
            bg: 'bg-primary/10',
            border: 'border-primary/20'
        },
        {
            key: 'past' as TabType,
            label: 'السابقة',
            icon: CheckCircle2,
            count: stats.completed,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            key: 'cancelled' as TabType,
            label: 'الملغاة',
            icon: XCircle,
            count: stats.cancelled,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-muted/50" dir="rtl">
            <PublicHeader darkHero={true} />

            <main className="flex-1 pb-24">
                {/* Hero section with a modern glassmorphism touch */}
                <section className="bg-foreground pt-28 pb-32 relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 relative z-10">
                        <div className="mb-6">
                            <BackButton label="رجوع" className="text-white/60 hover:text-white hover:bg-white/10" />
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-primary/20 text-primary-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30">
                                        مركز الاستشارات
                                    </span>
                                    <div className="h-px w-12 bg-white/10" />
                                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Widad Health</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                                    استشاراتكِ <span className="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">الطبية</span>
                                </h1>
                                <p className="text-muted-foreground font-medium text-lg max-w-xl leading-relaxed">
                                    نافذتكِ لإدارة جميع مواعيدكِ الطبية، التقارير والوصفات في مكان واحد آمن وذكي.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex gap-3 w-full md:w-auto"
                            >
                                <Link to="/patient/consultations/doctors" className="flex-1 md:flex-none">
                                    <Button className="w-full bg-primary hover:bg-primary-700 h-14 px-8 rounded-[20px] font-black shadow-2xl shadow-primary-500/20 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <Plus className="w-5 h-5 ml-2 group-hover:rotate-90 transition-transform relative z-10" />
                                        <span className="relative z-10">حجز موعد جديد</span>
                                    </Button>
                                </Link>
                                <Link to="/patient/dashboard" className="hidden md:block">
                                    <Button variant="outline" className="h-14 px-8 rounded-[20px] border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold backdrop-blur-md transition-all">
                                        لوحة التحكم
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Sidebar */}
                        <aside className="lg:col-span-3 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[32px] p-6 shadow-xl shadow-border/50 border border-border"
                            >
                                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 px-1">تصنيف المواعيد</h3>
                                <div className="space-y-2">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={cn(
                                                "w-full group flex items-center justify-between p-4 rounded-2xl transition-all duration-500",
                                                activeTab === tab.key
                                                    ? "bg-foreground text-white shadow-xl translate-x-1"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                                                    activeTab === tab.key ? "bg-white/10" : tab.bg,
                                                    activeTab === tab.key ? "text-white" : tab.color
                                                )}>
                                                    <tab.icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-black text-sm">{tab.label}</span>
                                            </div>
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all",
                                                activeTab === tab.key
                                                    ? "bg-primary text-white"
                                                    : "bg-white text-muted-foreground border border-border"
                                            )}>
                                                {tab.count}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-border">
                                    <Link
                                        to="/patient/consultations/prescriptions"
                                        className="w-full group flex items-center justify-between p-4 rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all duration-300 border border-purple-100/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-200/50 flex items-center justify-center shadow-inner">
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            <span className="font-black text-sm">وصفاتي الطبية</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 rotate-180 opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Help Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-8 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                                <h4 className="text-lg font-black mb-2 flex items-center gap-2 relative z-10">
                                    <Sparkles className="w-5 h-5 text-primary-300" />
                                    تحتاجين مساعدة؟
                                </h4>
                                <p className="text-white/60 text-xs font-bold leading-relaxed mb-6 relative z-10">
                                    فريق الدعم الفني متواجد لمساعدتكِ في كل ما يخص مواعيدكِ الطبية والتقارير.
                                </p>
                                <Button className="w-full bg-white text-foreground hover:bg-muted/50 rounded-xl h-11 font-black text-xs relative z-10">
                                    تحدثي مع الدعم
                                </Button>
                            </motion.div>
                        </aside>

                        {/* Content Area */}
                        <div className="lg:col-span-9 space-y-6">
                            {/* Toolbar */}
                            <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white shadow-sm flex items-center justify-between sticky top-24 z-30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-foreground text-white flex items-center justify-center shadow-lg">
                                        <LayoutGrid className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-foreground leading-none">
                                            {activeTab === 'upcoming' ? 'المواعيد القادمة' : activeTab === 'past' ? 'السجلات السابقة' : 'الطلبات الملغاة'}
                                        </h2>
                                        <p className="text-[10px] text-muted-foreground font-bold mt-1">عرض {consultations.length} استشارة</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex bg-muted/50 p-1 rounded-xl gap-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-muted-foreground")}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-muted-foreground")}
                                        >
                                            <LayoutList className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                    >
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="bg-white rounded-[32px] h-[320px] animate-pulse border border-border shadow-sm" />
                                        ))}
                                    </motion.div>
                                ) : consultations.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white rounded-[40px] p-20 text-center border border-border shadow-xl shadow-border/50"
                                    >
                                        <div className="relative w-32 h-32 mx-auto mb-8">
                                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                                            <div className="relative z-10 w-full h-full bg-muted rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                                <Stethoscope className="w-12 h-12 text-border" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-foreground mb-4">
                                            {activeTab === 'upcoming' && 'لا توجد مواعيد قادمة'}
                                            {activeTab === 'past' && 'سجلك الطبي فارغ حالياً'}
                                            {activeTab === 'cancelled' && 'لا توجد طلبات ملغاة'}
                                        </h3>
                                        <p className="text-muted-foreground font-bold mb-10 max-w-sm mx-auto leading-relaxed">
                                            {activeTab === 'upcoming' && 'ابدئي رحلة العناية بصحتكِ الآن عبر حجز استشارة مع أفضل الأطباء المتخصصين في وداد.'}
                                            {activeTab === 'past' && 'بعد إتمام استشاراتكِ القادمة، ستظهر هنا جميع التقارير والوصفات الطبية.'}
                                        </p>
                                        {activeTab === 'upcoming' && (
                                            <Link to="/patient/consultations/doctors">
                                                <Button className="bg-primary hover:bg-primary-700 h-14 px-10 rounded-2xl font-black text-base shadow-xl shadow-primary-500/20">
                                                    ابحثي عن طبيب الآن
                                                </Button>
                                            </Link>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial="hidden"
                                        animate="show"
                                        variants={{
                                            hidden: { opacity: 0 },
                                            show: {
                                                opacity: 1,
                                                transition: { staggerChildren: 0.1 }
                                            }
                                        }}
                                        className={cn(
                                            "grid gap-6",
                                            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                                        )}
                                    >
                                        {consultations.map((consultation: any) => (
                                            <motion.div
                                                key={consultation.id}
                                                variants={{
                                                    hidden: { opacity: 0, y: 30 },
                                                    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
                                                }}
                                            >
                                                <ConsultationCard
                                                    consultation={consultation}
                                                    type="patient"
                                                    onAction={handleAction}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            {/* Cancel Modal Premium */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[1001]">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCancelModal(false)}
                            className="absolute inset-0 bg-foreground/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="bg-white rounded-[40px] max-w-lg w-full p-10 relative z-10 shadow-3xl text-right overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)]"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16" />

                            <div className="flex items-center gap-6 mb-10 relative z-10">
                                <div className="w-20 h-20 rounded-[30px] bg-rose-50 flex items-center justify-center shrink-0 shadow-inner">
                                    <AlertCircle className="w-10 h-10 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-foreground">إلغاء الاستشارة</h3>
                                    <p className="text-muted-foreground font-bold mt-1 uppercase text-xs tracking-widest">Confirmation Required</p>
                                </div>
                            </div>

                            <p className="text-muted-foreground font-bold mb-8 leading-relaxed">
                                نحن نأسف لسماع ذلك، هل أنتِ متأكدة من رغبتكِ في إلغاء هذا الموعد؟ سيتم إعلام الطبيب فوراً.
                            </p>

                            <div className="space-y-4 mb-10 relative z-10">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                        سبب الإلغاء <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[10px] font-bold text-border">اختياري لمساعدتنا</span>
                                </div>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="لماذا ترغبين في إلغاء الموعد؟"
                                    rows={4}
                                    className="w-full px-8 py-6 bg-muted border border-border rounded-[30px] focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all outline-none font-bold text-foreground/80 resize-none shadow-inner"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                <Button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                    }}
                                    variant="outline"
                                    className="flex-1 rounded-2xl h-16 border-border font-black text-muted-foreground"
                                >
                                    الرجوع
                                </Button>
                                <Button
                                    onClick={handleCancelConfirm}
                                    disabled={cancelMutation.isPending || !cancelReason.trim()}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-16 font-black shadow-2xl shadow-rose-500/30 disabled:opacity-50"
                                >
                                    {cancelMutation.isPending ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        "تأكيد الإلغاء النهائي"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PublicFooter />
        </div>
    );
};

export default MyConsultations;
