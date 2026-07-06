import api from './api';

export interface FertilityEntry {
    id: number;
    user_id: number;
    entry_date: string;
    bbt?: number;
    cervical_mucus?: string;
    ovulation_test_positive?: boolean;
    intercourse?: boolean;
    notes?: string;
}

export const fertilityService = {
    getEntries: async (params?: any) => {
        const response = await api.get('/patient/fertility', { params });
        return response.data.data;
    },

    addEntry: async (data: any) => {
        const response = await api.post('/patient/fertility', data);
        return response.data;
    },

    getFertileWindow: async () => {
        const response = await api.get('/patient/fertility/fertile-window');
        return response.data.data;
    },

    deleteEntry: async (id: number) => {
        const response = await api.delete(`/patient/fertility/${id}`);
        return response.data;
    }
};
