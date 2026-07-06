import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Calendar, Clock, CheckCircle2,
    CalendarDays, Loader2, Search, X,
    Filter, CalendarRange, ArrowLeft,
    ChevronLeft
} from 'lucide-react';
import { doctorService } from '@/services/doctorService';
import { ConsultationCard } from '@/components/consultations/ConsultationCard';
import ConsultationCalendar from './ConsultationCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TabType = 'today' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'calendar';

export const DoctorConsultations = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('today');
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const fetchConsultations = async () => {
        if (activeTab === 'calendar') return;

        setLoading(true);
        try {
            const params: any = {
                search: search || undefined,
                per_page: 50 // Fetch more records since there's no pagination UI yet
            };

            if (activeTab === 'today') {
                // Use local date (not UTC) to respect Cairo timezone (+3)
                const now = new Date();
                const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                params.date = localDate;
            } else if (activeTab === 'upcoming') {
                params.upcoming = true;
            } else {
                params.status = activeTab;
            }

            const response = await doctorService.getConsultations(params);
            if (response.status) {
                setConsultations(response.data.consultations || response.data);
            }
        } catch (err) {
            toast.error('حدث خطأ في جلب الاستشارات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchConsultations();
        }, 500);
        return () => clearTimeout(timer);
    }, [activeTab, search]);

    const handleAction = async (action: string, consultationId: number) => {
        setActionLoading(consultationId);
        try {
            switch (action) {
                case 'confirm':
                    await doctorService.confirmConsultation(consultationId);
                    toast.success('تم تأكيد الاستشارة');
                    break;
                case 'start':
                    navigate(`/doctor/consultations/${consultationId}/video`);
                    return;
                case 'complete':
                    navigate(`/doctor/consultations/${consultationId}/complete`);
                    return;
                case 'cancel':
                    navigate(`/doctor/consultations/${consultationId}`);
                    return;
            }
            fetchConsultations();
        } catch (err: any) {
            const message = err.response?.data?.message || 'حدث خطأ';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    const tabs = [
        { key: 'today' as TabType, label: 'مواعيد اليوم', icon: CalendarDays },
        { key: 'upcoming' as TabType, label: 'القادمة', icon: Clock },
        { key: 'pending' as TabType, label: 'بانتظار التأكيد', icon: Loader2 },
        { key: 'confirmed' as TabType, label: 'المؤكدة', icon: CheckCircle2 },
        { key: 'completed' as TabType, label: 'المكتملة', icon: CheckCircle2 },
        { key: 'calendar' as TabType, label: 'التقويم', icon: CalendarRange },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground leading-tight">إدارة الاستشارات</h1>
                    <p className="text-muted-foreground font-medium text-sm mt-1">تابع مواعيدك مع المرضى وقم بإدارة جدولك اليومي</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSearch(!showSearch)}
                        className={cn(
                            "bg-white hover:bg-muted border-border rounded-xl h-11 px-6 font-bold flex-1 md:flex-none transition-all",
                            showSearch && "border-primary text-primary bg-primary/5"
                        )}
                    >
                        <Filter className="w-4 h-4 ml-2" />
                        تصفية متقدمة
                    </Button>
                    <Button
                        onClick={() => setShowSearch(!showSearch)}
                        className="bg-primary hover:bg-primary-600 text-white rounded-xl h-11 px-6 font-black shadow-lg shadow-primary/20 flex-1 md:flex-none"
                    >
                        <Search className="w-4 h-4 ml-2" />
                        بحث سريع
                    </Button>
                </div>
            </div>

            {/* Quick Search Bar */}
            <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                showSearch ? "max-h-24 opacity-100 mb-8" : "max-h-0 opacity-0 mb-0"
            )}>
                <div className="card-elevated bg-white p-3 rounded-[24px] flex items-center gap-4 border border-primary/5 shadow-2xl shadow-primary/5 group">
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-border group-focus-within:text-primary transition-colors w-5 h-5" />
                        <Input
                            placeholder="ابحث باسم المريض، رقم الهاتف، أو ملاحظات الاستشارة..."
                            className="h-14 pr-12 pl-12 bg-muted/50 border-transparent focus:bg-white focus:ring-primary/5 rounded-[18px] transition-all font-bold text-muted-foreground placeholder:text-border placeholder:font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus={showSearch}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-muted/50 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-full transition-all animate-in fade-in zoom-in"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Tabs Layout */}
            <div className="bg-muted/50/50 p-1.5 rounded-2xl flex flex-wrap gap-1 sticky top-0 z-30 backdrop-blur-md border border-border/50">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-300",
                            activeTab === tab.key
                                ? "bg-white text-primary shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground/80 hover:bg-white/50"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", activeTab === tab.key ? "text-primary" : "text-muted-foreground")} />
                        {tab.label}
                        {activeTab === tab.key && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'calendar' ? (
                    <div className="card-elevated bg-white p-6">
                        <ConsultationCalendar />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-48 bg-muted/50 animate-pulse rounded-3xl" />
                                ))}
                            </div>
                        ) : consultations.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-border space-y-4">
                                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-12 h-12 text-border" />
                                </div>
                                <h3 className="text-xl font-black text-foreground">لا توجد استشارات حالياً</h3>
                                <p className="text-muted-foreground font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                    تظهر هنا جميع الاستشارات الخاصة بك. بمجرد قيام مريض بحجز موعد، ستتمكن من رؤيته هنا.
                                </p>
                                <Button variant="ghost" className="mt-4 text-primary font-bold hover:bg-primary/5 rounded-xl">
                                    تحديث القائمة
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {consultations.map((consultation, index) => (
                                    <div
                                        key={consultation.id}
                                        className="relative animate-fade-in"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {actionLoading === consultation.id && (
                                            <div className="absolute inset-0 bg-white/60 rounded-[32px] flex items-center justify-center z-10 backdrop-blur-sm">
                                                <Loader2 className="animate-spin text-primary w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="transform transition-all duration-300 hover:-translate-y-2">
                                            <ConsultationCard
                                                consultation={consultation}
                                                type="doctor"
                                                onAction={handleAction}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorConsultations;
