import api from './api';

export interface Pregnancy {
    id: number;
    last_menstrual_period: string;
    conception_date: string;
    due_date: string;
    current_week: number;
    current_day: number;
    days_pregnant: number;
    weeks_remaining: number;
    days_remaining: number;
    trimester: number;
    trimester_progress: number;
    pregnancy_status: 'ongoing' | 'completed' | 'miscarriage' | 'terminated';
    is_active: boolean;
    baby_development?: {
        size_comparison: string;
        length_cm: number;
        weight_grams: number;
    };
    stats?: {
        total_entries: number;
        last_entry_date: string;
        last_weight: number;
        weight_gained: number;
    };
}

export interface PregnancyEntry {
    id: number;
    week_number: number;
    weight: number;
    blood_pressure_systolic: number;
    blood_pressure_diastolic: number;
    symptoms: string[];
    notes: string;
    entry_date: string;
}

export const pregnancyService = {
    startPregnancy: async (data: { last_menstrual_period: string; conception_date?: string; due_date?: string; notes?: string }) => {
        const response = await api.post('/patient/pregnancy/start', data);
        return response.data.data;
    },

    getCurrentPregnancy: async () => {
        const response = await api.get('/patient/pregnancy/current');
        return response.data.data;
    },

    addEntry: async (data: any) => {
        const response = await api.post('/patient/pregnancy/entry', data);
        return response.data.data;
    },

    getEntries: async (params?: any) => {
        const response = await api.get('/patient/pregnancy/entries', { params });
        // Backend returns { entries: [...], summary: {...} }
        return response.data.data?.entries ?? response.data.data ?? [];
    },

    deleteEntry: async (id: number) => {
        const response = await api.delete(`/patient/pregnancy/entry/${id}`);
        return response.data;
    },

    completePregnancy: async (id: number, data: any) => {
        const response = await api.put(`/patient/pregnancy/${id}/complete`, data);
        return response.data.data;
    },

    getHistory: async () => {
        const response = await api.get('/patient/pregnancy/history');
        return response.data.data;
    },

    getStats: async () => {
        const response = await api.get('/patient/pregnancy/stats');
        return response.data.data;
    },

    getWeeksInfo: async () => {
        const response = await api.get('/patient/pregnancy/weeks-info');
        return response.data.data;
    },

    getWeekInfo: async (weekNumber: number) => {
        const response = await api.get(`/patient/pregnancy/week/${weekNumber}`);
        return response.data.data;
    },

    uploadFile: async (formData: FormData) => {
        const response = await api.post('/patient/pregnancy/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    },

    getFiles: async (category?: string) => {
        const params = category ? { category } : {};
        const response = await api.get('/patient/pregnancy/files', { params });
        return response.data.data; // Expecting { files: [], grouped_by_category: {} }
    },

    deleteFile: async (id: number) => {
        await api.delete(`/patient/pregnancy/files/${id}`);
    },

    getWeightChartData: async () => {
        const response = await api.get('/patient/pregnancy/weight-chart');
        return response.data.data;
    },

    // Medications
    getMedications: async () => {
        const response = await api.get('/patient/pregnancy/medications');
        return response.data.data;
    },

    addMedication: async (data: any) => {
        const response = await api.post('/patient/pregnancy/medications', data);
        return response.data.data;
    },

    toggleMedication: async (id: number) => {
        const response = await api.post(`/patient/pregnancy/medications/${id}/toggle`);
        return response.data.data;
    },

    deleteMedication: async (id: number) => {
        await api.delete(`/patient/pregnancy/medications/${id}`);
    },

    // Kick Counter
    getKickSessions: async () => {
        const response = await api.get('/patient/pregnancy/kicks');
        return response.data.data;
    },

    storeKickSession: async (data: any) => {
        const response = await api.post('/patient/pregnancy/kicks', data);
        return response.data.data;
    },

    deleteKickSession: async (id: number) => {
        await api.delete(`/patient/pregnancy/kicks/${id}`);
    }
};
