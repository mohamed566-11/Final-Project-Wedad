import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiCenterService } from '../services/aiCenterService';
import { GdmInput, PreeclampsiaInput, PretermInput } from '../types/aiCenter';

// ========================
// PATIENT HOOKS
// ========================
export const useAiCenterHub = () => {
    return useQuery({
        queryKey: ['aiCenter', 'hub'],
        queryFn: aiCenterService.getHubData,
    });
};

export const useAiCenterPrefill = (model: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['aiCenter', 'prefill', model],
        queryFn: () => aiCenterService.getPrefillData(model),
        enabled: enabled && !!model,
        staleTime: 0,
        gcTime: 0,
    });
};

// ── OCR Auto-fill Hook: يجلب آخر نتيجة تحليل مفلترة لكل موديل ──────────────
export const useOcrPrefillForModel = (model: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['ocr', 'prefill', model],
        queryFn: () => aiCenterService.getLatestOcrForModel(model),
        enabled: enabled && !!model,
        staleTime: 5 * 60 * 1000, // 5 دقائق
        gcTime: 10 * 60 * 1000,
    });
};

export const useAiCenterHistory = (diseaseType?: string, page = 1) => {
    return useQuery({
        queryKey: ['aiCenter', 'history', diseaseType, page],
        queryFn: () => aiCenterService.getHistory(diseaseType, page),
    });
};

export const useAiCenterPredictionDetail = (id: number) => {
    return useQuery({
        queryKey: ['aiCenter', 'prediction', id],
        queryFn: () => aiCenterService.getPredictionDetail(id),
        enabled: !!id,
    });
};

export const usePredictGdm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: GdmInput) => aiCenterService.predictGdm(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiCenter'] });
        },
    });
};

export const usePredictPreeclampsia = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PreeclampsiaInput) => aiCenterService.predictPreeclampsia(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiCenter'] });
        },
    });
};

export const usePredictPreterm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PretermInput) => aiCenterService.predictPreterm(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiCenter'] });
        },
    });
};

export const usePredictScbu = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => aiCenterService.predictScbu(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiCenter'] });
        },
    });
};

// ========================
// DOCTOR HOOKS
// ========================
export const useDoctorAiStats = () => {
    return useQuery({
        queryKey: ['doctor', 'aiCenter', 'stats'],
        queryFn: aiCenterService.getDoctorStats,
    });
};

export const useDoctorPatientPredictions = (patientId: number, page: number = 1) => {
    return useQuery({
        queryKey: ['doctor', 'aiCenter', 'patient', patientId, page],
        queryFn: () => aiCenterService.getPatientPredictions(patientId, page),
        enabled: !!patientId,
    });
};

export const useDoctorAddComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ predictionId, comment }: { predictionId: number; comment: string }) =>
            aiCenterService.addDoctorComment(predictionId, comment),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['doctor', 'aiCenter'] });
        },
    });
};

// ========================
// ADMIN HOOKS
// ========================
export const useAdminAiDashboard = () => {
    return useQuery({
        queryKey: ['admin', 'aiCenter', 'dashboard'],
        queryFn: aiCenterService.getAdminDashboard,
    });
};

export const useAdminAiModelStats = (model: string) => {
    return useQuery({
        queryKey: ['admin', 'aiCenter', 'modelStats', model],
        queryFn: () => aiCenterService.getAdminModelStats(model),
        enabled: !!model,
    });
};

export const useAdminAiRiskDistribution = () => {
    return useQuery({
        queryKey: ['admin', 'aiCenter', 'riskDistribution'],
        queryFn: aiCenterService.getAdminRiskDistribution,
    });
};
