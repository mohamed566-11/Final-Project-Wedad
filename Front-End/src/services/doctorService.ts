import api from './api';

export const doctorService = {
    // Auth & Registration
    register: async (data: any) => {
        const response = await api.post('/doctor/auth/register', data);
        return response.data;
    },

    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/doctor/dashboard/stats');
        return response.data;
    },
    getChartData: async (period = 'month') => {
        const response = await api.get(`/doctor/dashboard/chart-data?period=${period}`);
        return response.data;
    },

    // Profile
    getProfile: async () => {
        const response = await api.get('/doctor/profile');
        return response.data;
    },
    updateProfile: async (data: FormData) => {
        const response = await api.post('/doctor/profile?_method=PUT', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateAvailability: async (isAvailable: boolean) => {
        const response = await api.put('/doctor/profile/availability', { is_available: isAvailable });
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.put('/doctor/profile/change-password', data);
        return response.data;
    },

    // Working Hours
    getWorkingHours: async () => {
        const response = await api.get('/doctor/working-hours');
        return response.data;
    },
    updateWorkingHours: async (workingHours: any[]) => {
        const response = await api.put('/doctor/working-hours', { working_hours: workingHours });
        return response.data;
    },

    // Consultations
    getConsultations: async (params: any) => {
        const response = await api.get('/doctor/consultations', { params });
        return response.data;
    },
    getConsultationsCalendar: async (month: string) => {
        const response = await api.get(`/doctor/consultations/calendar?month=${month}`);
        return response.data;
    },
    getConsultation: async (id: number) => {
        const response = await api.get(`/doctor/consultations/${id}`);
        return response.data;
    },
    getConsultationPatientHistory: async (id: number) => {
        const response = await api.get(`/doctor/consultations/${id}/patient-history`);
        return response.data;
    },
    updateConsultationNotes: async (id: number, data: any) => {
        const response = await api.put(`/doctor/consultations/${id}/update-notes`, data);
        return response.data;
    },
    confirmConsultation: async (id: number) => {
        const response = await api.put(`/doctor/consultations/${id}/confirm`);
        return response.data;
    },
    startConsultation: async (id: number) => {
        const response = await api.put(`/doctor/consultations/${id}/start`);
        return response.data;
    },
    completeConsultation: async (id: number, data: any) => {
        const response = await api.put(`/doctor/consultations/${id}/complete`, data);
        return response.data;
    },
    // ... start, complete, cancel methods

    // Patients
    getPatients: async (params: any) => {
        const response = await api.get('/doctor/patients', { params });
        return response.data;
    },
    getPatient: async (id: number) => {
        const response = await api.get(`/doctor/patients/${id}`);
        return response.data;
    },
    addPatientNote: async (id: number, note: string) => {
        const response = await api.post(`/doctor/patients/${id}/notes`, { note });
        return response.data;
    },
    getPatientNotes: async (id: number) => {
        const response = await api.get(`/doctor/patients/${id}/notes`);
        return response.data;
    },
    deletePatientNote: async (patientId: number, noteId: number) => {
        const response = await api.delete(`/doctor/patients/${patientId}/notes/${noteId}`);
        return response.data;
    },
    downloadPatientMedicalFile: async (patientId: number, fileId: number) => {
        return await api.get(`/doctor/patients/${patientId}/medical-files/${fileId}/download`, {
            responseType: 'blob'
        });
    },

    // Articles
    getArticles: async (params: any) => {
        const response = await api.get('/doctor/articles', { params });
        return response.data;
    },
    getArticle: async (id: number) => {
        const response = await api.get(`/doctor/articles/${id}`);
        return response.data;
    },
    createArticle: async (data: FormData) => {
        const response = await api.post('/doctor/articles', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateArticle: async (id: number, data: FormData) => {
        const response = await api.post(`/doctor/articles/${id}?_method=PUT`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteArticle: async (id: number) => {
        const response = await api.delete(`/doctor/articles/${id}`);
        return response.data;
    },
    submitArticle: async (id: number) => {
        const response = await api.put(`/doctor/articles/${id}/submit`);
        return response.data;
    },
    // ...
    // Financials
    getFinancialStats: async () => {
        const response = await api.get('/doctor/financials/stats');
        return response.data;
    },
    getTransactions: async (params: any) => {
        const response = await api.get('/doctor/financials/transactions', { params });
        return response.data;
    },
    getPayouts: async (params: any) => {
        const response = await api.get('/doctor/financials/payouts', { params });
        return response.data;
    },
    requestPayout: async (data: any) => {
        const response = await api.post('/doctor/financials/request-payout', data);
        return response.data;
    },

    // Reviews
    getReviews: async (params: any) => {
        const response = await api.get('/doctor/reviews', { params });
        return response.data.data;
    },
    toggleReview: async (id: number) => {
        const response = await api.patch(`/doctor/reviews/${id}/toggle`);
        return response.data.data;
    },
    deleteReview: async (id: number) => {
        const response = await api.delete(`/doctor/reviews/${id}`);
        return response.data;
    },
};
