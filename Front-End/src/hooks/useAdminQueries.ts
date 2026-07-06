import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminService from "@/services/adminService";

// ==================== Query Keys ====================
export const adminQueryKeys = {
  // Dashboard
  dashboard: ["admin", "dashboard"] as const,
  dashboardStats: ["admin", "dashboard", "stats"] as const,
  dashboardActivity: ["admin", "dashboard", "activity"] as const,

  // Patients
  patients: ["admin", "patients"] as const,
  patientsList: (params: object) =>
    ["admin", "patients", "list", params] as const,
  patient: (id: number) => ["admin", "patients", id] as const,

  // Doctors
  doctors: ["admin", "doctors"] as const,
  doctorsList: (params: object) =>
    ["admin", "doctors", "list", params] as const,
  doctor: (id: number) => ["admin", "doctors", id] as const,

  // Consultations
  consultations: ["admin", "consultations"] as const,
  consultationsList: (params: object) =>
    ["admin", "consultations", "list", params] as const,
  consultation: (id: number) => ["admin", "consultations", id] as const,
  consultationStats: ["admin", "consultations", "stats"] as const,

  // Articles
  articles: ["admin", "articles"] as const,
  articlesList: (params: object) =>
    ["admin", "articles", "list", params] as const,
  article: (id: number) => ["admin", "articles", id] as const,

  // Financial
  financial: ["admin", "financial"] as const,
  financialOverview: ["admin", "financial", "overview"] as const,
  transactions: (params: object) =>
    ["admin", "financial", "transactions", params] as const,
  doctorPayouts: (params: object) =>
    ["admin", "financial", "payouts", params] as const,

  // Join Requests
  joinRequests: ["admin", "join-requests"] as const,
  joinRequestsList: (params: object) =>
    ["admin", "join-requests", "list", params] as const,

  // Contact Messages
  contactMessages: ["admin", "contact-messages"] as const,
  contactMessagesList: (params: object) =>
    ["admin", "contact-messages", "list", params] as const,

  // Settings
  settings: ["admin", "settings"] as const,
  siteSettings: ["admin", "settings", "site"] as const,
  roles: ["admin", "settings", "roles"] as const,
  system: ["admin", "settings", "system"] as const,
  auditLogs: (params: object) =>
    ["admin", "settings", "audit-logs", params] as const,

  // Metadata
  specializations: ["admin", "specializations"] as const,
  lifeStages: ["admin", "life-stages"] as const,

  // Notifications
  notifications: ["admin", "notifications"] as const,
  notificationHistory: (page?: number) =>
    ["admin", "notifications", "history", page] as const,

  // Analytics
  analytics: ["admin", "analytics"] as const,
  analyticsOverview: ["admin", "analytics", "overview"] as const,
  usersAnalytics: (period?: string) =>
    ["admin", "analytics", "users", period] as const,
  consultationsAnalytics: (period?: string) =>
    ["admin", "analytics", "consultations", period] as const,
  financialsAnalytics: (period?: string) =>
    ["admin", "analytics", "financials", period] as const,
  articlesAnalytics: ["admin", "analytics", "articles"] as const,
};

// ==================== Dashboard Hooks ====================
export function useDashboardStats() {
  return useQuery({
    queryKey: adminQueryKeys.dashboardStats,
    queryFn: async () => {
      const response = await adminService.getDashboardStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: adminQueryKeys.dashboardActivity,
    queryFn: async () => {
      const response = await adminService.getRecentActivity();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== Patients Hooks ====================
export function usePatients(params: {
  page?: number;
  search?: string;
  life_stage_id?: number;
  is_active?: boolean;
  is_verified?: boolean;
  sort_by?: string;
  sort_order?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.patientsList(params),
    queryFn: async () => {
      const response = await adminService.getPatients(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: adminQueryKeys.patient(id),
    queryFn: async () => {
      const response = await adminService.getPatient(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useTogglePatientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      is_active,
      reason,
    }: {
      id: number;
      is_active: boolean;
      reason?: string;
    }) => adminService.togglePatientStatus(id, is_active, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.patients });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.patients });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useLifeStages() {
  return useQuery({
    queryKey: adminQueryKeys.lifeStages,
    queryFn: async () => {
      const response = await adminService.getLifeStages();
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ==================== Doctors Hooks ====================
export function useDoctors(params: {
  page?: number;
  search?: string;
  specialization?: string;
  verification_status?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.doctorsList(params),
    queryFn: async () => {
      const response = await adminService.getDoctors(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useDoctor(id: number) {
  return useQuery({
    queryKey: adminQueryKeys.doctor(id),
    queryFn: async () => {
      const response = await adminService.getDoctor(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useVerifyDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.verifyDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.doctors });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useRejectDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rejection_reason,
    }: {
      id: number;
      rejection_reason: string;
    }) => adminService.rejectDoctor(id, rejection_reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.doctors });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useToggleDoctorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      is_active,
      reason,
    }: {
      id: number;
      is_active: boolean;
      reason?: string;
    }) => adminService.toggleDoctorStatus(id, is_active, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.doctors });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.doctors });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useSpecializations() {
  return useQuery({
    queryKey: adminQueryKeys.specializations,
    queryFn: async () => {
      const response = await adminService.getSpecializations();
      return response.data;
    },
    staleTime: 0,
  });
}

// ==================== Consultations Hooks ====================
export function useConsultations(params: {
  page?: number;
  status?: string;
  doctor_id?: number;
  patient_id?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.consultationsList(params),
    queryFn: async () => {
      const response = await adminService.getConsultations(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useConsultation(id: number) {
  return useQuery({
    queryKey: adminQueryKeys.consultation(id),
    queryFn: async () => {
      const response = await adminService.getConsultation(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useConsultationStats() {
  return useQuery({
    queryKey: adminQueryKeys.consultationStats,
    queryFn: async () => {
      const response = await adminService.getConsultationStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCancelConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      cancellation_reason,
      refund,
    }: {
      id: number;
      cancellation_reason: string;
      refund?: boolean;
    }) => adminService.cancelConsultation(id, cancellation_reason, refund),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.consultations });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.consultationStats,
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

// ==================== Articles Hooks ====================
export function useArticles(params: {
  page?: number;
  search?: string;
  status?: string;
  life_stage_id?: number;
  doctor_id?: number;
}) {
  return useQuery({
    queryKey: adminQueryKeys.articlesList(params),
    queryFn: async () => {
      const response = await adminService.getAdminArticles(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: adminQueryKeys.article(id),
    queryFn: async () => {
      const response = await adminService.getAdminArticle(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useApproveArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      console.log("Sending approve request for:", id);
      return adminService.approveArticle(id);
    },
    onSuccess: (data) => {
      console.log("Approve success:", data);
      queryClient.invalidateQueries({
        queryKey: ["admin", "articles"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
    onError: (error) => {
      console.error("Approve mutation error:", error);
    },
  });
}

export function useRejectArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rejection_reason,
    }: {
      id: number;
      rejection_reason: string;
    }) => adminService.rejectArticle(id, rejection_reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useArchiveArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.archiveArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useRestoreArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.restoreArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

// ==================== Financial Hooks ====================
export function useFinancialOverview(period?: string) {
  return useQuery({
    queryKey: [...adminQueryKeys.financialOverview, period],
    queryFn: async () => {
      const response = await adminService.getFinancialOverview(period);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTransactions(params: {
  page?: number;
  status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.transactions(params),
    queryFn: async () => {
      const response = await adminService.getTransactions(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useDoctorsPayouts(params: {
  page?: number;
  search?: string;
  doctor_id?: number;
}) {
  return useQuery({
    queryKey: adminQueryKeys.doctorPayouts(params),
    queryFn: async () => {
      const response = await adminService.getDoctorsPayouts(params.doctor_id);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProcessPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      doctorId,
      amount,
      payoutMethod,
      notes,
    }: {
      doctorId: number;
      amount: number;
      payoutMethod: string;
      notes?: string;
    }) => adminService.processPayout(doctorId, amount, payoutMethod, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.financial });
    },
  });
}

export function usePayoutRequests(params: {
  page?: number;
  status?: string;
  doctor_id?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin", "financial", "payout-requests", params],
    queryFn: async () => {
      const response = await adminService.getPayoutRequests(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProcessPayoutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      admin_note,
      transaction_reference,
    }: {
      id: number;
      status: "processed" | "rejected";
      admin_note?: string;
      transaction_reference?: string;
    }) =>
      adminService.processPayoutRequest(
        id,
        status,
        admin_note,
        transaction_reference,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "financial", "payout-requests"],
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.financial });
    },
  });
}

// ==================== Join Requests Hooks ====================
export function useJoinRequests(params: {
  page?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.joinRequestsList(params),
    queryFn: async () => {
      const response = await adminService.getJoinRequests(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateJoinRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: number;
      status: string;
      notes?: string;
    }) => adminService.updateJoinRequestStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.joinRequests });
    },
  });
}

// ==================== Contact Messages Hooks ====================
export function useContactMessages(params: {
  page?: number;
  search?: string;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.contactMessagesList(params),
    queryFn: async () => {
      const response = await adminService.getContactMessages(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useContactMessage(id: number) {
  return useQuery({
    queryKey: ["admin", "contact-messages", id],
    queryFn: async () => {
      const response = await adminService.getContactMessage(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.contactMessages,
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useMarkMessageAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.markMessageAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.contactMessages,
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useMarkAllMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminService.markAllMessagesAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.contactMessages,
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

export function useDeleteContactMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.contactMessages,
      });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.dashboardStats,
      });
    },
  });
}

// ==================== Settings Hooks ====================
export function useSiteSettings() {
  return useQuery({
    queryKey: adminQueryKeys.siteSettings,
    queryFn: async () => {
      const response = await adminService.getSiteSettings();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - settings rarely change
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => adminService.updateSiteSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.siteSettings });
      queryClient.invalidateQueries({ queryKey: ["publicSiteSettings"] });
    },
  });
}

export function useSettingsRoles() {
  return useQuery({
    queryKey: adminQueryKeys.roles,
    queryFn: async () => {
      const response = await adminService.getSettingsRoles();
      return response.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      role: string;
      description?: string;
      permissions: string[];
    }) => adminService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { description?: string; permissions: string[] };
    }) => adminService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles });
    },
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: adminQueryKeys.system,
    queryFn: async () => {
      const response = await adminService.getSystemSettings();
      return response.data;
    },
  });
}

export function useAuditLogs(params: {
  page?: number;
  per_page?: number;
  search?: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  status_code?: number;
  from_date?: string;
  to_date?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.auditLogs(params),
    queryFn: async () => {
      const response = await adminService.getAuditLogs(params);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// ==================== Notification Hooks ====================
export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminService.sendNotification>[0]) =>
      adminService.sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications });
    },
  });
}

export function useNotificationHistory(page?: number) {
  return useQuery({
    queryKey: adminQueryKeys.notificationHistory(page),
    queryFn: async () => {
      const response = await adminService.getNotificationHistory(page);
      return response.data;
    },
  });
}

// ==================== Analytics Hooks ====================
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: adminQueryKeys.analyticsOverview,
    queryFn: async () => {
      const response = await adminService.getAnalyticsOverview();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsersAnalytics(period?: string) {
  return useQuery({
    queryKey: adminQueryKeys.usersAnalytics(period),
    queryFn: async () => {
      const response = await adminService.getUsersAnalytics(period);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useConsultationsAnalytics(period?: string) {
  return useQuery({
    queryKey: adminQueryKeys.consultationsAnalytics(period),
    queryFn: async () => {
      const response = await adminService.getConsultationsAnalytics(period);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFinancialsAnalytics(period?: string) {
  return useQuery({
    queryKey: adminQueryKeys.financialsAnalytics(period),
    queryFn: async () => {
      const response = await adminService.getFinancialsAnalytics(period);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticlesAnalytics() {
  return useQuery({
    queryKey: adminQueryKeys.articlesAnalytics,
    queryFn: async () => {
      const response = await adminService.getArticlesAnalytics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
