import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export const useDoctorAiStats = () => {
    return useQuery({
        queryKey: ['doctorAiStats'],
        queryFn: async () => {
            const { data } = await api.get('/doctor/ai-center/stats');
            return data.data;
        }
    });
};

export const useDoctorAiPredictions = (filters?: { model?: string, risk_level?: string }) => {
    return useQuery({
        queryKey: ['doctorAiPredictions', filters],
        queryFn: async () => {
            const { data } = await api.get('/doctor/ai-center/predictions', { params: filters });
            return data.data;
        }
    });
};

export const useDoctorAiPredictionDetail = (id: number) => {
    return useQuery({
        queryKey: ['doctorAiPredictionDetail', id],
        queryFn: async () => {
            const { data } = await api.get(`/doctor/ai-center/predictions/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
};

export const useDoctorAddAiComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, comment }: { id: number, comment: string }) => {
            const { data } = await api.post(`/doctor/ai-center/predictions/${id}/comment`, { comment });
            return data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['doctorAiPredictionDetail', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['doctorAiPredictions'] });
        }
    });
};
