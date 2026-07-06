import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Video, CheckCircle2, Clock, Briefcase, Plus } from 'lucide-react';
import { Doctor } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
    doctor: Doctor;
    onViewDetails?: (doctor: Doctor) => void;
    onBook?: (doctor: Doctor) => void;
    isPublic?: boolean;
    className?: string;
}

const specializationStyles: Record<string, string> = {
    gynecology: 'bg-pink-50 text-pink-700 border-pink-100',
    obstetrics: 'bg-purple-50 text-purple-700 border-purple-100',
    fertility: 'bg-rose-50 text-rose-700 border-rose-100',
    endocrinology: 'bg-amber-50 text-amber-700 border-amber-100',
    general_practitioner: 'bg-blue-50 text-blue-700 border-blue-100',
    pediatrics: 'bg-teal-50 text-teal-700 border-teal-100',
    nutrition: 'bg-green-50 text-green-700 border-green-100',
    other: 'bg-slate-50 text-slate-700 border-slate-100',
};

export const DoctorCard = ({ doctor, onViewDetails, onBook, isPublic = false, className }: DoctorCardProps) => {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(doctor);
            return;
        }

        if (isPublic) {
            navigate(`/doctors/${doctor.id}`);
        } else {
            navigate(`/patient/consultations/doctors/${doctor.id}`);
        }
    };

    const handleBook = () => {
        if (onBook) {
            onBook(doctor);
            return;
        }
        navigate(`/patient/consultations/book/${doctor.id}`);
    };

    return (
        <Card className={cn("group relative overflow-hidden bg-white hover:shadow-2xl hover:shadow-primary/5 border-slate-100 transition-all duration-500 h-full flex flex-col rounded-[32px]", className)}>
            {/* Top Pattern Header - More Subtle */}
            <div className="h-20 bg-slate-50 relative overflow-hidden border-b border-slate-50">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-40"></div>
                <div className="absolute top-3 inset-x-4 flex justify-between items-center z-10">
                    {doctor.verified_badge && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100/50 shadow-sm">
                            <CheckCircle2 size={12} className="fill-emerald-600 text-white" />
                            <span>موثق</span>
                        </div>
                    )}
                    <div className="flex gap-1.5">
                        {doctor.session_type && doctor.session_type !== 'offline' && (
                            <div className="p-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-slate-100" title="استشارة فيديو">
                                <Video size={14} className="text-blue-500" />
                            </div>
                        )}
                        {doctor.session_type && (doctor.session_type === 'offline' || doctor.session_type === 'both') && (
                            <div className="p-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-slate-100" title="استشارة عيادة">
                                <MapPin size={14} className="text-rose-500" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Section */}
            <div className="px-5 pb-5 flex-grow flex flex-col pt-0">
                {/* Avatar Positioning */}
                <div className="relative -mt-10 mb-4 inline-block self-center lg:self-start">
                    <div className="w-24 h-24 rounded-[28px] p-1.5 bg-white ring-8 ring-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500 ease-out">
                        {doctor.image_url ? (
                            <img
                                src={doctor.image_url}
                                alt={doctor.name}
                                className="w-full h-full object-cover rounded-[20px]"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`;
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-[20px] text-slate-300">
                                <span className="text-3xl">👨‍⚕️</span>
                            </div>
                        )}
                    </div>
                    {doctor.is_available && (
                        <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm animate-pulse-slow" />
                    )}
                </div>

                {/* Identity & Badge Row */}
                <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                            <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                {doctor.name}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-tight",
                                    specializationStyles[doctor.specialization] || specializationStyles.other
                                )}>
                                    {doctor.specialization_ar}
                                </span>
                                {doctor.life_stages && doctor.life_stages.length > 0 && (
                                    <span className="bg-slate-50 text-slate-500 px-2.5 py-0.5 rounded-lg text-[10px] font-black border border-slate-100">
                                        {doctor.life_stages[0].name_ar}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Rating Component */}
                        <div className="flex flex-col items-center bg-slate-900 text-white px-3 py-1.5 rounded-2xl shadow-lg shadow-slate-900/10">
                            <div className="flex items-center gap-1">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                <span className="font-black text-sm">{doctor.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">({doctor.total_reviews || 0})</span>
                        </div>
                    </div>

                    {/* Stats Grid - more subtle icons */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-[24px] bg-slate-50/70 border border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                <Briefcase size={12} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{doctor.years_of_experience} سنة خبرة</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-rose-500 shadow-sm">
                                <Clock size={12} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold line-clamp-1",
                                doctor.is_available ? "text-emerald-600" : "text-slate-600"
                            )}>
                                {doctor.is_available ? 'متاح للحجز' : doctor.next_available_slot ? 'متاح قريباً' : 'غير متاح'}
                            </span>
                        </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">سعر الكشف</span>
                            <div className="flex items-baseline gap-1 text-slate-900">
                                <span className="text-xl font-black">{doctor.consultation_price}</span>
                                <span className="text-[10px] font-bold text-slate-400">ج.م</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleViewDetails}
                                className="w-10 h-10 rounded-xl p-0 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
                            >
                                <Plus size={18} />
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleBook}
                                className="rounded-xl px-4 py-5 font-black text-xs bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                احجز الآن
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DoctorCard;

