import api from './api';

export interface PeriodCycle {
    id: number;
    start_date: string;
    end_date?: string;
    cycle_length?: number;
    period_length?: number;
    flow?: string;
    symptoms?: string[];
    notes?: string;
    is_predicted: boolean;
}

export interface PeriodAnalytics {
    summary: {
        average_cycle_length: number;
        weighted_cycle_length: number;
        average_period_length: number;
        std_dev: number;
        cycle_count: number;
        regularity: string;
    };
    scores: {
        health_score: number;
        fertility_score: number;
        confidence: { level: string; score: number; label: string };
        regularity_score: number;
    };
    most_common_symptoms: string[];
    monthly_data: Array<{
        month: string;
        cycle_length: number | null;
        period_length: number | null;
        flow: string | null;
    }>;
}

export const periodService = {
    getCycles: async (params?: any) => {
        const response = await api.get('/patient/period', { params });
        return response.data.data;
    },

    startCycle: async (data: any) => {
        const response = await api.post('/patient/period/start', data);
        return response.data;
    },

    endCycle: async (id: number, end_date: string) => {
        const response = await api.put(`/patient/period/${id}/end`, { end_date });
        return response.data;
    },

    getPredictions: async () => {
        const response = await api.get('/patient/period/predictions');
        return response.data.data;
    },

    getAnalytics: async (): Promise<PeriodAnalytics> => {
        const response = await api.get('/patient/period/analytics');
        return response.data.data;
    },

    deleteEntry: async (id: number) => {
        const response = await api.delete(`/patient/period/${id}`);
        return response.data;
    },
};
