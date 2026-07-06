import api from './api';
import {
    HubData,
    PrefillData,
    PredictionResponse,
    GdmInput,
    PreeclampsiaInput,
    PretermInput
} from '../types/aiCenter';

export const aiCenterService = {
    // Patient endpoints
    getHubData: async (): Promise<HubData> => {
        const response = await api.get('/patient/ai-center');
        return response.data.data;
    },

    getPrefillData: async (model: string): Promise<PrefillData> => {
        const response = await api.get(`/patient/ai-center/${model}/prefill?t=${new Date().getTime()}`);
        return response.data.data;
    },

    predictGdm: async (data: GdmInput): Promise<PredictionResponse> => {
        const response = await api.post('/patient/ai-center/gdm/predict', data);
        return response.data.data;
    },

    predictPreeclampsia: async (data: PreeclampsiaInput): Promise<PredictionResponse> => {
        const response = await api.post('/patient/ai-center/preeclampsia/predict', data);
        return response.data.data;
    },

    predictPreterm: async (data: PretermInput): Promise<PredictionResponse> => {
        const response = await api.post('/patient/ai-center/preterm/predict', data);
        return response.data.data;
    },

    predictScbu: async (data: any): Promise<PredictionResponse> => {
        const response = await api.post('/patient/ai-center/scbu/predict', data);
        return response.data.data;
    },

    // ── OCR Auto-fill: يجلب آخر نتيجة تحليل مفلترة بحقول الموديل المطلوب ──
    getLatestOcrForModel: async (model: string): Promise<{
        has_data: boolean;
        lab_test_id: number | null;
        lab_test_date: string;
        fields: Record<string, {
            value: number;
            unit: string;
            test_name: string;
            status: string;
            reference_range: string;
        }>;
        message: string;
    }> => {
        const response = await api.get(`/patient/lab-tests/latest-for-model/${model}`);
        return response.data.data;
    },

    getHistory: async (diseaseType?: string, page = 1) => {
        const params = new URLSearchParams();
        if (diseaseType) params.append('disease_type', diseaseType);
        params.append('page', page.toString());

        const response = await api.get(`/patient/ai-center/history?${params.toString()}`);
        return response.data.data;
    },

    getPredictionDetail: async (id: number) => {
        const response = await api.get(`/patient/ai-center/predictions/${id}`);
        return response.data.data;
    },

    // Doctor endpoints
    getDoctorStats: async () => {
        const response = await api.get('/doctor/ai-center/stats');
        return response.data.data;
    },

    getPatientPredictions: async (patientId: number, page = 1) => {
        const response = await api.get(`/doctor/ai-center/patients/${patientId}/predictions?page=${page}`);
        return response.data.data;
    },

    addDoctorComment: async (predictionId: number, comment: string) => {
        const response = await api.post(`/doctor/ai-center/predictions/${predictionId}/comment`, { comment });
        return response.data.data;
    },

    // Admin endpoints
    getAdminDashboard: async () => {
        const response = await api.get('/admin/ai-center/analytics');
        return response.data.data;
    },

    getAdminModelStats: async (model: string) => {
        const response = await api.get(`/admin/ai-center/models/${model}/stats`);
        return response.data.data;
    },

    getAdminRiskDistribution: async () => {
        const response = await api.get('/admin/ai-center/risk-distribution');
        return response.data.data;
    }
};
