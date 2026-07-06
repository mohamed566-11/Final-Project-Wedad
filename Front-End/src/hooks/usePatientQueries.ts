import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPublicArticles, Article } from '@/services/articleService';
import { publicService } from '@/services/publicService';
import { consultationService } from '@/services/consultationService';
import { patientService } from '@/services/patientService'; // Assuming this exists or I'll create/use specific services

export const patientQueryKeys = {
    dashboard: ['patient', 'dashboard'] as const,
    articles: ['public', 'articles'] as const,
    article: (id: number) => ['public', 'articles', id] as const,
    consultations: ['patient', 'consultations'] as const,
    consultation: (id: number) => ['patient', 'consultations', id] as const,
    lifeStages: ['public', 'lifeStages'] as const,
};

// --- Life Stage Hooks ---
export function useLifeStages() {
    return useQuery({
        queryKey: patientQueryKeys.lifeStages,
        queryFn: async () => {
            const response = await publicService.getLifeStages();
            return response.data.data;
        },
        staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours as they rarely change
    });
}

// --- Dashboard Hooks ---
export function usePatientDashboardStats() {
    return useQuery({
        queryKey: patientQueryKeys.dashboard,
        queryFn: async () => {
            const response = await patientService.getDashboardStats();
            return response.data; // Services return response.data (Laravel response), so .data here gets the payload
        },
    });
}

// --- Article Hooks ---
export function usePublicArticles(params: {
    page?: number;
    life_stage_id?: number;
    sort_by?: string;
    search?: string;
    tag?: string;
}) {
    return useQuery({
        queryKey: [...patientQueryKeys.articles, params],
        queryFn: async () => {
            const response = await getPublicArticles(params as any);
            return response.data;
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    });
}

// --- Consultation Hooks ---
export function usePatientConsultations(params: {
    upcoming?: boolean;
    past?: boolean;
    status?: string;
    page?: number;
}) {
    return useQuery({
        queryKey: [...patientQueryKeys.consultations, params],
        queryFn: async () => {
            const response = await consultationService.getMyConsultations(params);
            return response.data; // Services return response.data (Laravel response), so .data here gets the payload
        },
    });
}

export function useCancelConsultation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            consultationService.cancelConsultation(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientQueryKeys.consultations });
            queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
        },
    });
}
