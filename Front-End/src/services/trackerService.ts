import api from './api';

export const trackerService = {
    getSummary: async () => {
        const response = await api.get('/patient/trackers/summary');
        return response.data.data;
    }
};
