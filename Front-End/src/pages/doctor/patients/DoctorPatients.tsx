import React, { useState } from 'react';
import { useDoctorPatients } from '@/hooks/useDoctorPatients';
import { useNavigate } from 'react-router-dom';
import {
    Search, Loader2, User, ChevronLeft, ChevronRight,
    Activity, CalendarClock, Filter, Users, UserPlus,
    ActivitySquare, MoreHorizontal, ArrowUpLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('newest');

    const { data: response, isLoading } = useDoctorPatients({
        search,
        page,
        sort_by: sortBy,
        per_page: 9
    });

    const patients = response?.data?.patients?.data || [];
    const stats = response?.data?.stats;
    const pagination = response?.data?.pagination;

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground leading-tight">سجل المرضى</h1>
                    <p className="text-muted-foreground font-medium text-sm mt-1">إدارة ومتابعة الحالة الصحية للمرضى المسجلين لديك</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {(stats?.total || 0) > 0 && (
                        <>
                            <div className="flex -space-x-3 space-x-reverse">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-border shadow-sm" />
                                ))}
                            </div>
                            <div className="text-xs font-bold text-muted-foreground">{stats?.total} مرضى مسجلين</div>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Summary - Premium Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PatientStatCard
                    title="إجمالي المرضى"
                    value={stats?.total || 0}
                    icon={Users}
                    color="text-blue-600 bg-blue-50"
                    trend="+12%"
                />
                <PatientStatCard
                    title="مرضى جدد (هذا الشهر)"
                    value={stats?.new_this_month || 0}
                    icon={UserPlus}
                    color="text-emerald-600 bg-emerald-50"
                    trend="+5%"
                />
                <PatientStatCard
                    title="مرضى نشطون"
                    value={stats?.active || 0}
                    icon={ActivitySquare}
                    color="text-amber-600 bg-amber-50"
                />
            </div>

            {/* Filters Bar */}
            <div className="card-elevated bg-white p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                        placeholder="ابحث باسم المريض أو رقم الملف..."
                        className="h-12 pr-12 bg-muted border-transparent focus:bg-white focus:ring-primary/10 rounded-2xl transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[240px]">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-12 bg-muted border-transparent rounded-2xl font-bold text-foreground/80">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-muted-foreground" />
                                <SelectValue placeholder="ترتيب حسب" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border">
                            <SelectItem value="newest">الأحدث انضماماً</SelectItem>
                            <SelectItem value="most_consultations">الأكثر زيارة</SelectItem>
                            <SelectItem value="name">الاسم (أ-ي)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Patients Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[340px] bg-muted/50 animate-pulse rounded-[40px]" />
                    ))}
                </div>
            ) : patients.length === 0 ? (
                <div className="text-center py-24 bg-muted rounded-[40px] border border-dashed border-border">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <User size={48} className="text-border" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">لا يوجد مرضى</h3>
                    <p className="text-muted-foreground font-medium">لم يتم العثور على مرضى مطابقين لبحثك حالياً.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {patients.map((patient: any, index: number) => (
                        <div
                            key={patient.id}
                            className="animate-fade-in group cursor-pointer"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        >
                            <div className="card-elevated bg-white p-8 rounded-[40px] relative overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/5">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2.5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />

                                <div className="flex items-center justify-between mb-8">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-[28px] bg-muted p-1 border border-border overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            {patient.image_url ? (
                                                <img src={patient.image_url} alt={patient.name} className="w-full h-full object-cover rounded-[24px]" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                                    <User className="w-10 h-10 text-border" />
                                                </div>
                                            )}
                                        </div>
                                        {patient.has_pregnancy && (
                                            <div className="absolute -bottom-2 -left-2 bg-pink-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white animate-bounce-slow">
                                                <Activity className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-2.5 bg-muted text-muted-foreground rounded-2xl hover:bg-primary/10 hover:text-primary transition-all">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black text-foreground mb-1 tracking-tight group-hover:text-primary transition-colors">{patient.name}</h3>
                                <p className="text-sm font-bold text-muted-foreground mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                    {patient.life_stage?.name_ar || 'غير محدد'}
                                </p>

                                <div className="space-y-4 pt-6 border-t border-muted">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                                                <CalendarClock size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground">آخر زيارة</span>
                                        </div>
                                        <span className="text-xs font-black text-foreground bg-muted px-3 py-1.5 rounded-lg">{patient.last_visit ? patient.last_visit.split(' ')[0] : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                                                <ActivitySquare size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground">الاستشارات</span>
                                        </div>
                                        <span className="text-xs font-black text-foreground bg-primary/10 text-primary px-3 py-1.5 rounded-lg" dir="rtl">
                                            {patient.total_consultations === 1 ? 'استشارة واحدة' :
                                                patient.total_consultations === 2 ? 'استشارتان' :
                                                    patient.total_consultations >= 3 && patient.total_consultations <= 10 ? `${patient.total_consultations} استشارات` :
                                                        `${patient.total_consultations} استشارة`}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Button
                                        className="w-full bg-foreground group-hover:bg-primary text-white h-12 rounded-2xl font-black transition-all gap-2"
                                    >
                                        فتح الملف الطبي
                                        <ArrowUpLeft className="w-4 h-4 mr-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 bg-white rounded-3xl p-3 shadow-sm border border-border w-fit mx-auto">
                    <Button
                        variant="ghost"
                        disabled={page === 1}
                        onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                        className="h-10 w-10 p-0 rounded-2xl hover:bg-muted"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 px-4 border-x border-border">
                        <span className="text-sm font-black text-foreground">{page}</span>
                        <span className="text-xs font-bold text-muted-foreground">من {pagination.last_page}</span>
                    </div>
                    <Button
                        variant="ghost"
                        disabled={page === pagination.last_page}
                        onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                        className="h-10 w-10 p-0 rounded-2xl hover:bg-muted"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>
    );
};

const PatientStatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="card-elevated bg-white p-6 rounded-[32px] flex items-center gap-5 transition-all duration-300 hover:shadow-xl">
        <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shadow-sm", color)}>
            <Icon size={32} />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{title}</span>
                {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{trend}</span>}
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">{value}</h2>
        </div>
    </div>
);

export default DoctorPatients;
