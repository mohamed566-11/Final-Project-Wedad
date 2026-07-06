import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatbotService } from "@/services/chatbotService";
import type { ChatbotPreferences } from "@/types/chatbot";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

const QUERY_KEY = ["chatbot", "data-preferences"] as const;

/**
 * Hook لإدارة إعدادات خصوصية بيانات المريضة في الشات بوت
 * - جلب الإعدادات الحالية
 * - تحديث إعدادات فردية
 * - تبديل master switch
 */
export function useChatbotPreferences() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // ─── Fetch preferences ────────────────────────────────
    const preferencesQuery = useQuery({
        queryKey: QUERY_KEY,
        queryFn: chatbotService.getDataPreferences,
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    // ─── Update mutation ──────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: (data: Partial<ChatbotPreferences>) =>
            chatbotService.updateDataPreferences(data),
        onMutate: async (newData) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: QUERY_KEY });
            const previousData = queryClient.getQueryData<ChatbotPreferences>(QUERY_KEY);

            queryClient.setQueryData<ChatbotPreferences>(QUERY_KEY, (old) => ({
                data_access_enabled: false,
                share_predictions: true,
                share_trackers: true,
                share_medical_file: false,
                share_consultations: false,
                ...old,
                ...newData,
            }));

            return { previousData };
        },
        onError: (_err, _newData, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(QUERY_KEY, context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    // ─── Helpers ──────────────────────────────────────────
    const preferences = preferencesQuery.data;
    const isEnabled = preferences?.data_access_enabled ?? false;

    const toggleMasterSwitch = useCallback(() => {
        updateMutation.mutate({
            data_access_enabled: !isEnabled,
        });
    }, [isEnabled, updateMutation]);

    const updatePreference = useCallback(
        (key: keyof ChatbotPreferences, value: boolean) => {
            updateMutation.mutate({ [key]: value });
        },
        [updateMutation],
    );

    return {
        preferences,
        isEnabled,
        isLoading: preferencesQuery.isLoading,
        isSaving: updateMutation.isPending,
        toggleMasterSwitch,
        updatePreference,
        updatePreferences: updateMutation.mutate,
    };
}
