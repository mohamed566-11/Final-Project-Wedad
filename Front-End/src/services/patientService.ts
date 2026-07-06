import api from './api';

export const patientService = {
    getDashboardStats: async () => {
        const response = await api.get('/patient/dashboard/stats');
        return response.data;
    },
};
