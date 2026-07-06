import api from './api';

export interface MoodEntry {
    id: number;
    mood: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
    mood_emoji: string;
    mood_label: string;
    notes?: string;
    factors?: Record<string, any>;
    entry_date: string;
    entry_time: string;
}

export const moodService = {
    getEntries: async (params?: any) => {
        const response = await api.get('/patient/mood', { params });
        // response.data is { status, message, data: {data: [], ...}, pagination: {} }
        return response.data.data;
    },

    addEntry: async (data: any) => {
        const response = await api.post('/patient/mood', data);
        return response.data.data;
    },

    getAnalytics: async (period: string = 'month') => {
        const response = await api.get('/patient/mood/analytics', { params: { period } });
        return response.data.data;
    },

    deleteEntry: async (id: number) => {
        const response = await api.delete(`/patient/mood/${id}`);
        return response.data;
    }
};
