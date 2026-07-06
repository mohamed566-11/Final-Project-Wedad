import api from './api';

export interface IotMetricsResponse {
    is_connected: boolean;
    metrics?: {
        latest_heart_rate: number | null;
        steps_24h: number;
    };
    charts?: {
        heart_rates: { timestamp: string; heart_rate_bpm: number }[];
        oxygens: { timestamp: string; oxygen_pct: number }[];
        steps: { timestamp: string; steps: number }[];
        sleeps: { start_time: string; end_time: string; stage: number }[];
    };
}

export const iotService = {
    getAuthUrl: async () => {
        const response = await api.get<{ url: string }>('/patient/iot/auth-url');
        return response.data;
    },

    connect: async (code: string) => {
        const response = await api.post('/patient/iot/connect', { code });
        return response.data;
    },

    disconnect: async () => {
        const response = await api.delete('/patient/iot/disconnect');
        return response.data;
    },

    sync: async () => {
        const response = await api.post('/patient/iot/sync');
        return response.data;
    },

    getMetrics: async () => {
        const response = await api.get<IotMetricsResponse>('/patient/iot/metrics');
        return response.data;
    },
};
