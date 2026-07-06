import {
    Calendar, Clock, Video, MapPin, Star,
    CheckCircle2, XCircle, AlertCircle, Clock4,
    User, ArrowUpLeft, VideoIcon, Layout
} from 'lucide-react';
import { useState } from 'react';
import { Consultation } from '@/services/consultationService';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ConsultationCardProps {
    consultation: Consultation;
    type: 'patient' | 'doctor';
    onAction?: (action: string, consultationId: number) => void;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        label: 'قيد الانتظار'
    },
    confirmed: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        label: 'موعد مؤكد'
    },
    in_progress: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'جارية الآن'
    },
    completed: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        label: 'زيارة مكتملة'
    },
    cancelled_by_patient: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500',
        label: 'ملغي من المريض'
    },
    cancelled_by_doctor: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500',
        label: 'ملغي من الطبيب'
    },
    no_show: {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        dot: 'bg-slate-400',
        label: 'لم يحضر'
    }
};

export const ConsultationCard = ({ consultation, type, onAction }: ConsultationCardProps) => {
    const navigate = useNavigate();
    const style = statusStyles[consultation.status] || statusStyles.pending;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleViewDetails = () => {
        const path = type === 'patient'
            ? `/patient/consultations/${consultation.id}`
            : `/doctor/consultations/${consultation.id}`;
        navigate(path);
    };

    const [imgError, setImgError] = useState(false);

    const targetName = type === 'patient' ? consultation.doctor?.name : consultation.patient?.name;
    const targetImage = type === 'patient' ? consultation.doctor?.image_url : consultation.patient?.image_url;

    return (
        <div className="card-elevated bg-white rounded-[32px] overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-slate-100 flex flex-col h-full">
            {/* Header Status */}
            <div className={cn("px-6 py-3 flex items-center justify-between border-b border-transparent transition-colors", style.bg)}>
                <div className={cn("flex items-center gap-2 font-black text-[10px] uppercase tracking-wider", style.text)}>
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", style.dot)} />
                    {consultation.status_ar || style.label}
                </div>
                {consultation.time_until && (
                    <span className="text-[10px] font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {consultation.time_until}
                    </span>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex gap-4 mb-6">
                    {/* AVATAR */}
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500 relative flex items-center justify-center">
                            {targetImage && !imgError ? (
                                <img
                                    src={targetImage}
                                    alt={targetName}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                    <User className="w-8 h-8 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <div className={cn(
                            "absolute -bottom-1 -left-1 p-1.5 rounded-xl shadow-lg border-2 border-white",
                            consultation.type === 'video' ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                            {consultation.type === 'video' ? <Video size={10} /> : <MapPin size={10} />}
                        </div>
                    </div>

                    {/* BASIC INFO */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors truncate">
                                {targetName}
                            </h3>
                            <button className="text-slate-300 hover:text-primary transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1">
                                <ArrowUpLeft size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Calendar size={14} className="text-slate-300" />
                                <span>{formatDate(consultation.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Clock size={14} className="text-slate-300" />
                                <span>{consultation.time}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Notes */}
                {consultation.patient_notes && (
                    <div className="bg-slate-50/50 p-4 rounded-2xl mb-6 border border-slate-50 relative group-hover:bg-slate-50 transition-colors">
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            <span className="font-black text-slate-400 mb-1 block uppercase text-[9px]">ملاحظات الحالة</span>
                            {consultation.patient_notes}
                        </p>
                    </div>
                )}

                <div className="mt-auto pt-6 border-t border-slate-50 grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
                                <Star size={14} fill="currentColor" />
                            </div>
                            <span className="text-sm font-black text-slate-900">{consultation.price} <span className="text-[10px] text-slate-400 font-bold uppercase">جنيه</span></span>
                        </div>
                        {consultation.type === 'video' && (
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">Digital Session</span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleViewDetails}
                            className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            فتح الملف
                        </button>

                        {type === 'doctor' && consultation.status === 'confirmed' && (
                            <button
                                onClick={() => onAction?.('start', consultation.id)}
                                className="flex-[2] h-11 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <VideoIcon size={16} />
                                بدء الجلسة
                            </button>
                        )}

                        {type === 'doctor' && consultation.status === 'pending' && (
                            <button
                                onClick={() => onAction?.('confirm', consultation.id)}
                                className="flex-[2] h-11 rounded-xl bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                            >
                                تأكيد الموعد
                            </button>
                        )}

                        {/* Cancel button — respects business rule (>24h before appointment) */}
                        {consultation.can_cancel && (
                            <button
                                onClick={() => onAction?.('cancel', consultation.id)}
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100"
                            >
                                <XCircle size={18} />
                            </button>
                        )}
                    </div>

                    {/* Google Meet Join Button */}
                    {consultation.google_meet_link && ['confirmed', 'in_progress'].includes(consultation.status) && (
                        <button
                            onClick={() => window.open(consultation.google_meet_link, '_blank')}
                            className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                            <VideoIcon size={18} />
                            انضمام للاجتماع (Google Meet)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultationCard;
