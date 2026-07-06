import api from './api';

export interface WeightEntry {
    id: number;
    weight: number;
    height: number;
    bmi: number;
    bmi_category: string;
    notes?: string;
    entry_date: string;
    entry_time?: string;
}

export const weightService = {
    getEntries: async (params?: any) => {
        const response = await api.get('/patient/weight', { params });
        return response.data.data;
    },

    addEntry: async (data: any) => {
        const response = await api.post('/patient/weight', data);
        return response.data;
    },

    getChartData: async (period: string = 'month') => {
        const response = await api.get('/patient/weight/chart', { params: { period } });
        return response.data.data;
    },

    deleteEntry: async (id: number) => {
        const response = await api.delete(`/patient/weight/${id}`);
        return response.data;
    }
};
