import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import { toast } from 'sonner';

export const useDoctorDashboardStats = () => {
    return useQuery({
        queryKey: ['doctor-dashboard-stats'],
        queryFn: doctorService.getDashboardStats,
        staleTime: 60 * 1000,
    });
};

export const useDoctorChartData = (period: string) => {
    return useQuery({
        queryKey: ['doctor-chart-data', period],
        queryFn: () => doctorService.getChartData(period),
        staleTime: 60 * 1000,
    });
};

export const useDoctorProfile = () => {
    return useQuery({
        queryKey: ['doctor-profile'],
        queryFn: doctorService.getProfile,
    });
};

export const useUpdateDoctorProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: doctorService.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
            toast.success('تم تحديث الملف الشخصي بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء التحديث');
        }
    });
};

export const useUpdateAvailability = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: doctorService.updateAvailability,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
            const status = data.data.is_available ? 'متاح الآن' : 'غير متاح';
            toast.success(`تم تغيير الحالة إلى ${status}`);
        },
        onError: () => toast.error('فشل تحديث الحالة')
    });
};

export const useDoctorConsultationsCalendar = (month: string) => {
    return useQuery({
        queryKey: ['doctor-calendar', month],
        queryFn: () => doctorService.getConsultationsCalendar(month),
    });
};

export const useDoctorConsultation = (id: number) => {
    return useQuery({
        queryKey: ['doctor-consultation', id],
        queryFn: () => doctorService.getConsultation(id),
        enabled: !!id,
    });
};

export const useDoctorPatientHistory = (id: number) => {
    return useQuery({
        queryKey: ['doctor-consultation-history', id],
        queryFn: () => doctorService.getConsultationPatientHistory(id),
        enabled: !!id,
    });
};

export const useDoctorFinancialStats = () => {
    return useQuery({
        queryKey: ['doctor-financial-stats'],
        queryFn: doctorService.getFinancialStats,
    });
};

export const useDoctorTransactions = (params: any) => {
    return useQuery({
        queryKey: ['doctor-transactions', params],
        queryFn: () => doctorService.getTransactions(params),
        placeholderData: (previousData: any) => previousData,
    });
};

export const useDoctorPayouts = (params: any) => {
    return useQuery({
        queryKey: ['doctor-payouts', params],
        queryFn: () => doctorService.getPayouts(params),
        placeholderData: (previousData: any) => previousData,
    });
};

export const useRequestPayout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: doctorService.requestPayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-financial-stats'] });
            queryClient.invalidateQueries({ queryKey: ['doctor-payouts'] });
            toast.success('تم إرسال طلب السحب بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل إرسال طلب السحب');
        }
    });
};
