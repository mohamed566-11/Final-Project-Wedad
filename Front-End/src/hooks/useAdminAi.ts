import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useAdminAiDashboard = () => {
    return useQuery({
        queryKey: ['adminAiDashboard'],
        queryFn: async () => {
            const { data } = await api.get('/admin/ai-center/analytics');
            return data.data;
        }
    });
};

export const useAdminAiModelsStats = () => {
    return useQuery({
        queryKey: ['adminAiModelsStats'],
        queryFn: async () => {
            const { data } = await api.get('/admin/ai-center/models-stats');
            return data.data;
        }
    });
};

export const useAdminAiRiskDistribution = () => {
    return useQuery({
        queryKey: ['adminAiRiskDistribution'],
        queryFn: async () => {
            const { data } = await api.get('/admin/ai-center/risk-distribution');
            return data.data;
        }
    });
};
