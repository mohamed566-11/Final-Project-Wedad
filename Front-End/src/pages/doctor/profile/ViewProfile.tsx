import React from 'react';
import { useDoctorProfile } from '@/hooks/useDoctorQueries';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Phone, Mail, Award, Edit3, User, Star, Quote, DollarSign, Stethoscope, Video, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ViewProfile: React.FC = () => {
    const { data: profileResponse, isLoading } = useDoctorProfile();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">جاري تحميل بيانات الملف الشخصي...</p>
            </div>
        );
    }

    const doctor = profileResponse?.data?.doctor;
    if (!doctor) return <div className="text-center py-20 text-red-500 font-bold">حدث خطأ في تحميل البيانات</div>;

    return (
        <div className="min-h-screen bg-muted/50 pb-16 animate-fade-in" dir="rtl">
            {/* Hero Cover - More Compact */}
            <div className="relative h-48 md:h-56 bg-foreground overflow-hidden shadow-xl rounded-b-[40px]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary/10 to-slate-900 z-0"></div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-white/10"></div>

                <div className="container max-w-5xl mx-auto px-6 h-full flex items-center justify-between relative z-10">
                    <div className="flex flex-col text-white">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1 opacity-90">الملف الشخصي</h1>
                        <p className="text-muted-foreground text-sm font-medium">إدارة معلوماتك الشخصية والمهنية</p>
                    </div>
                </div>
            </div>

            <div className="container max-w-5xl mx-auto px-6 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Essential Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[32px] shadow-xl shadow-border/40 border border-border overflow-hidden">
                            <div className="p-6 text-center">
                                {/* Profile Image */}
                                <div className="relative inline-block mb-4">
                                    <div className="w-32 h-32 rounded-[28px] p-1.5 bg-white ring-4 ring-muted shadow-xl overflow-hidden">
                                        {doctor.image_url ? (
                                            <img src={doctor.image_url} alt={doctor.name} className="w-full h-full object-cover rounded-[22px]" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted rounded-[22px] text-border">
                                                <User size={48} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" title="متاح"></div>
                                </div>

                                <h2 className="text-xl font-black text-foreground mb-1">{doctor.name}</h2>
                                <p className="text-primary text-sm font-bold bg-primary/5 px-4 py-1 rounded-full inline-block border border-primary/10 mb-6">
                                    {{
                                        gynecology: 'أمراض نساء وتوليد',
                                        obstetrics: 'توليد',
                                        fertility: 'علاج العقم',
                                        endocrinology: 'غدد صماء',
                                        general_practitioner: 'ممارس عام',
                                        pediatrics: 'أطفال',
                                        nutrition: 'تغذية',
                                        other: 'تخصص آخر'
                                    }[doctor.specialization] || doctor.specialization || 'لم يحدد'}
                                </p>

                                {/* Session Type Badge */}
                                <div className="flex justify-center mb-4">
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                        doctor.session_type === 'video' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        doctor.session_type === 'offline' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        'bg-primary/5 text-primary border-primary/20'
                                    }`}>
                                        {doctor.session_type === 'video' ? <Video size={12} /> :
                                         doctor.session_type === 'offline' ? <MapPin size={12} /> :
                                         <Layers size={12} />}
                                        {{
                                            video: 'أونلاين فقط',
                                            offline: 'عيادة فقط',
                                            both: 'أونلاين + عيادة',
                                        }[doctor.session_type as string] || 'أونلاين + عيادة'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-muted p-3 rounded-2xl">
                                        <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                                            <Star size={14} className="fill-current" />
                                            <span className="text-sm font-black text-foreground">{doctor.rating || '5.0'}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">التقييم</p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-2xl">
                                        <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
                                            <Stethoscope size={14} />
                                            <span className="text-sm font-black text-foreground">{doctor.total_consultations}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">استشارة</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-white border border-transparent hover:border-border transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-muted-foreground shadow-sm group-hover:text-primary transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-foreground/80 dir-ltr">{doctor.phone}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-white border border-transparent hover:border-border transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-muted-foreground shadow-sm group-hover:text-primary transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-foreground/80 truncate">{doctor.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-white border border-transparent hover:border-border transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-muted-foreground shadow-sm group-hover:text-primary transition-colors">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-foreground/80 line-clamp-1">{doctor.clinic_address || 'لم يحدد'}</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => navigate('/doctor/profile/edit')}
                                    className="w-full mt-6 rounded-2xl py-6 font-black bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 transition-all duration-300"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    تعديل الملف
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Info */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Summary */}
                        <div className="bg-white p-8 rounded-[32px] border border-border shadow-sm min-h-[200px] flex flex-col justify-center">
                            <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                نبذة تعريفية
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-base font-medium italic">
                                "{doctor.bio || 'لم يتم إضافة نبذة تعريفية بعد.'}"
                            </p>
                        </div>

                        {/* Professional Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-[28px] border border-border shadow-sm flex items-center gap-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">سعر الكشف</p>
                                    <p className="text-xl font-black text-foreground">{doctor.consultation_price} <span className="text-sm font-bold text-muted-foreground">ج.م</span></p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[28px] border border-border shadow-sm flex items-center gap-4">
                                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">الترخيص الطبي</p>
                                    <p className="text-xl font-black text-foreground font-mono tracking-tight">{doctor.license_number}</p>
                                </div>
                            </div>
                        </div>

                        {/* Specializations and Life Stages */}
                        <div className="bg-white p-8 rounded-[32px] border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                                    التخصصات والمراحل
                                </h3>
                                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-2xl border border-border">
                                    <span className="text-2xl font-black text-primary">{doctor.years_of_experience}+</span>
                                    <span className="text-[10px] font-black text-muted-foreground leading-tight uppercase">سنة<br />خبرة</span>
                                </div>
                            </div>

                            {doctor.life_stages && doctor.life_stages.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {doctor.life_stages.map((stage: any) => (
                                        <span key={stage.id} className="px-4 py-2 bg-muted text-foreground/80 text-sm font-bold rounded-xl border border-border hover:border-primary/20 hover:bg-primary/5 transition-all cursor-default">
                                            {stage.name_ar || stage.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">لم يتم تحديد مراحل حياتية محددة.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfile;
