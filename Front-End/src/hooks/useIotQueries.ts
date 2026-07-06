import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iotService } from '../services/iotService';
import { toast } from 'sonner';

export const useIotQueries = () => {
    const queryClient = useQueryClient();

    const useAuthUrl = () => {
        return useQuery({
            queryKey: ['iot-auth-url'],
            queryFn: iotService.getAuthUrl,
            staleTime: 5 * 60 * 1000, // 5 mins
        });
    };

    const useMetrics = () => {
        return useQuery({
            queryKey: ['iot-metrics'],
            queryFn: iotService.getMetrics,
        });
    };

    const connectMutation = useMutation({
        mutationFn: (code: string) => iotService.connect(code),
        onSuccess: () => {
            toast.success('تم ربط حساب Google Fit بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['iot-metrics'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'حدث خطأ أثناء الربط بالنظام.');
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: iotService.disconnect,
        onSuccess: () => {
            toast.success('تم قطع الاتصال بالسوار الذكي.');
            queryClient.invalidateQueries({ queryKey: ['iot-metrics'] });
        },
        onError: () => {
            toast.error('حدث خطأ أثناء الإلغاء.');
        },
    });

    const syncMutation = useMutation({
        mutationFn: iotService.sync,
        onSuccess: () => {
            toast.success('تم تحديث القراءات بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['iot-metrics'] });
        },
        onError: () => {
            toast.error('لم نتمكن من التحديث، حاول لاحقاً.');
        },
    });

    return {
        useAuthUrl,
        useMetrics,
        connectMutation,
        disconnectMutation,
        syncMutation,
    };
};
