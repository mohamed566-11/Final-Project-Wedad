import api from "./api";

// Types
export interface DashboardStats {
  users_overview: {
    patients: {
      total: number;
      growth: number;
      active_today: number;
      new_this_month: number;
    };
    doctors: {
      total: number;
      pending_verification: number;
      verified: number;
      average_rating: number;
      active_today?: number;
      new_this_month?: number;
    };
    admins: { total: number };
  };
  consultations: {
    total: number;
    this_month: number;
    today: number;
    pending: number;
    completed: number;
    cancelled: number;
    average_rating: number;
    revenue_this_month: number;
  };
  articles: {
    total: number;
    pending_review: number;
    approved: number;
    rejected: number;
    total_views: number;
  };
  doctors_verification: {
    pending_verification: number;
    verified: number;
    rejected: number;
    average_rating: number;
  };
  financials: {
    total_revenue: number;
    revenue_this_month: number;
    platform_earnings: number;
    doctors_earnings: number;
    pending_payouts: number;
    revenue_growth: number;
  };
  system_health: {
    database_size: string;
    storage_used: string;
    api_uptime: string;
    average_response_time: string;
  };
}

export interface RecentActivity {
  activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    image_url?: string;
    link?: string;
    data?: any;
  }>;
  alerts: {
    pending_articles: number;
    pending_doctor_verifications: number;
    unread_contact_messages: number;
    pending_join_requests: number;
  };
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  life_stage?: { id: number; name: string; display_name: string };
  is_active: boolean;
  is_verified: boolean;
  image_url: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  joined_at: string;
  total_consultations?: number;
  profile?: {
    height?: number;
    weight?: number;
    blood_type?: string;
    chronic_diseases?: string[];
    allergies?: string[];
    emergency_contact?: string;
    emergency_phone?: string;
  };
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  specialization: string;
  specialization_ar: string;
  license_number: string;
  bio: string;
  years_of_experience: number;
  consultation_price: number;
  session_type: string;
  languages: string[];
  clinic_address?: string;
  verification_status: string;
  verification_status_ar: string;
  is_active: boolean;
  is_available: boolean;
  rating: number;
  total_consultations: number;
  documents: {
    license_document?: string;
    id_document?: string;
    certificate?: string;
  };
  documents_submitted: boolean;
  image_url: string;
  verified_at?: string;
  last_login_at?: string;
  joined_at: string;
}

export interface Consultation {
  id: number;
  doctor: { id: number; name: string };
  patient: { id: number; name: string };
  date: string;
  time: string;
  type: string;
  type_ar: string;
  status: string;
  status_ar: string;
  price: number;
  platform_commission: number;
  payment_status: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  consultation_id: number;
  patient: { id: number; name: string };
  doctor: { id: number; name: string };
  amount: number;
  platform_fee: number;
  doctor_amount: number;
  payment_method: string;
  payment_method_ar: string;
  status: string;
  status_ar: string;
  paid_at: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  ip_address?: string;
  submitted_at: string;
}

export interface JoinRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  specialty_ar: string;
  license_number?: string;
  consultation_price?: string | number;
  status: string;
  status_ar: string;
  notes?: string;
  ip_address?: string;
  submitted_at: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: { id: number; role: string; description?: string };
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at?: string;
  created_at: string;
  image_url: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// Dashboard API
export const getDashboardStats = () =>
  api.get<{ data: DashboardStats }>("/admin/dashboard/stats");
export const getRecentActivity = () =>
  api.get<{ data: RecentActivity }>("/admin/dashboard/recent-activity");

// Patients API
export const getPatients = (params?: {
  page?: number;
  search?: string;
  life_stage_id?: number;
  is_active?: boolean;
  is_verified?: boolean;
  sort_by?: string;
  sort_order?: string;
}) => api.get("/admin/patients", { params });

export const getPatient = (id: number) => api.get(`/admin/patients/${id}`);
export const togglePatientStatus = (
  id: number,
  is_active: boolean,
  reason?: string,
) => api.put(`/admin/patients/${id}/toggle-status`, { is_active, reason });
export const deletePatient = (id: number) =>
  api.delete(`/admin/patients/${id}`);
export const getLifeStages = () => api.get("/admin/patients/life-stages");

// Doctors API
export const getDoctors = (params?: {
  page?: number;
  search?: string;
  specialization?: string;
  verification_status?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: string;
}) => api.get("/admin/doctors", { params });

export const getDoctor = (id: number) => api.get(`/admin/doctors/${id}`);
export const verifyDoctor = (id: number) =>
  api.put(`/admin/doctors/${id}/verify`, { verification_status: "verified" });
export const rejectDoctor = (id: number, rejection_reason: string) =>
  api.put(`/admin/doctors/${id}/reject`, { rejection_reason });
export const toggleDoctorStatus = (
  id: number,
  is_active: boolean,
  reason?: string,
) => api.put(`/admin/doctors/${id}/toggle-status`, { is_active, reason });
export const deleteDoctor = (id: number) => api.delete(`/admin/doctors/${id}`);
export const getSpecializations = () =>
  api.get("/admin/doctors/specializations");

// Admins API
export const getAdmins = (params?: {
  page?: number;
  search?: string;
  role_id?: number;
  is_active?: boolean;
}) => api.get("/admin/admins", { params });

export const getAdmin = (id: number) => api.get(`/admin/admins/${id}`);
export const updateAdminProfile = (data: { name: string; phone?: string }) =>
  api.put("/admin/profile", data);
export const createAdmin = (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role_id: number;
}) => api.post("/admin/admins", data);

export const updateAdmin = (
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role_id?: number;
  },
) => api.put(`/admin/admins/${id}`, data);

export const toggleAdminStatus = (id: number, is_active: boolean) =>
  api.put(`/admin/admins/${id}/toggle-status`, { is_active });
export const deleteAdmin = (id: number) => api.delete(`/admin/admins/${id}`);
export const getRoles = () => api.get("/admin/admins/roles");

// Join Requests API
export const getJoinRequests = (params?: {
  page?: number;
  status?: string;
  search?: string;
}) => api.get("/admin/join-requests", { params });

export const getJoinRequest = (id: number) =>
  api.get(`/admin/join-requests/${id}`);
export const updateJoinRequestStatus = (
  id: number,
  status: string,
  notes?: string,
) => api.put(`/admin/join-requests/${id}/status`, { status, notes });
export const deleteJoinRequest = (id: number) =>
  api.delete(`/admin/join-requests/${id}`);

// Consultations API
export const getConsultations = (params?: {
  page?: number;
  status?: string;
  doctor_id?: number;
  patient_id?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) => api.get("/admin/consultations", { params });

export const getConsultation = (id: number) =>
  api.get(`/admin/consultations/${id}`);
export const cancelConsultation = (
  id: number,
  cancellation_reason: string,
  refund?: boolean,
) =>
  api.put(`/admin/consultations/${id}/cancel`, { cancellation_reason, refund });
export const getConsultationStats = (period?: string) =>
  api.get("/admin/consultations/stats", { params: { period } });

// Financials API
export const getFinancialOverview = (period?: string) =>
  api.get("/admin/financials/overview", { params: { period } });

export const getTransactions = (params?: {
  page?: number;
  status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) => api.get("/admin/financials/transactions", { params });

export const getTransaction = (id: number) =>
  api.get(`/admin/financials/transactions/${id}`);
export const refundTransaction = (id: number, reason: string) =>
  api.post(`/admin/financials/transactions/${id}/refund`, { reason });

export const getDoctorsPayouts = (doctor_id?: number) =>
  api.get("/admin/financials/doctors-payouts", { params: { doctor_id } });

export const processPayout = (
  doctor_id: number,
  amount: number,
  payout_method: string,
  notes?: string,
) =>
  api.post("/admin/financials/process-payout", {
    doctor_id,
    amount,
    payout_method,
    notes,
  });

export const getPayoutRequests = (params?: {
  page?: number;
  status?: string;
  doctor_id?: number;
  search?: string;
}) => api.get("/admin/financials/payouts", { params });

export const processPayoutRequest = (
  id: number,
  status: "processed" | "rejected",
  admin_note?: string,
  transaction_reference?: string,
) =>
  api.put(`/admin/financials/payouts/${id}/process`, {
    status,
    admin_note,
    transaction_reference,
  });

export const getFinancialReports = (params?: {
  type?: string;
  date_from?: string;
  date_to?: string;
}) => api.get("/admin/financials/reports", { params });

// Articles API (Admin)
export const getAdminArticles = (params?: {
  page?: number;
  status?: string;
  life_stage_id?: number;
  doctor_id?: number;
  search?: string;
}) => api.get("/admin/articles", { params });

export const getAdminArticle = (id: number) => api.get(`/admin/articles/${id}`);
export const approveArticle = (id: number) =>
  api.post(
    `/admin/articles/${id}/approve`,
    {},
    {
      headers: { "Content-Type": "application/json" },
    },
  );
export const rejectArticle = (id: number, rejection_reason: string) =>
  api.put(`/admin/articles/${id}/reject`, { admin_notes: rejection_reason });
export const archiveArticle = (id: number) =>
  api.put(`/admin/articles/${id}/archive`);
export const restoreArticle = (id: number) =>
  api.put(`/admin/articles/${id}/restore`);
export const deleteArticle = (id: number) =>
  api.delete(`/admin/articles/${id}`);

// Contact Messages API
export const getContactMessages = (params?: {
  page?: number;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}) => api.get("/admin/contact-messages", { params });

export const getContactMessage = (id: number) =>
  api.get(`/admin/contact-messages/${id}`);
export const markMessageAsRead = (id: number) =>
  api.put(`/admin/contact-messages/${id}/mark-read`);
export const markMessageAsUnread = (id: number) =>
  api.put(`/admin/contact-messages/${id}/mark-unread`);
export const markAllMessagesAsRead = () =>
  api.put("/admin/contact-messages/mark-all-read");
export const deleteContactMessage = (id: number) =>
  api.delete(`/admin/contact-messages/${id}`);

// Notifications API
export const sendNotification = (data: {
  title: string;
  message: string;
  type: "announcement" | "update" | "maintenance" | "promotional";
  target: "all" | "patients" | "doctors";
  scheduled_at?: string;
}) => api.post("/admin/notifications/send", data);

export const getNotificationHistory = (page?: number) =>
  api.get("/admin/notifications/history", { params: { page } });

// Analytics API
export const getAnalyticsOverview = () => api.get("/admin/analytics/overview");
export const getUsersAnalytics = (period?: string) =>
  api.get("/admin/analytics/users", { params: { period } });
export const getConsultationsAnalytics = (period?: string) =>
  api.get("/admin/analytics/consultations", { params: { period } });
export const getFinancialsAnalytics = (period?: string) =>
  api.get("/admin/analytics/financials", { params: { period } });
export const getArticlesAnalytics = () => api.get("/admin/analytics/articles");

// Settings API
export const getSiteSettings = () => api.get("/admin/settings/site");
export const updateSiteSettings = (data: FormData) =>
  api.put("/admin/settings/site", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getSettingsRoles = () => api.get("/admin/settings/roles");
export const createRole = (data: {
  role: string;
  description?: string;
  permissions: string[];
}) => api.post("/admin/settings/roles", data);
export const updateRole = (
  id: number,
  data: { description?: string; permissions: string[] },
) => api.put(`/admin/settings/roles/${id}`, data);
export const deleteRole = (id: number) =>
  api.delete(`/admin/settings/roles/${id}`);
export const getSystemSettings = () => api.get("/admin/settings/system");

export const getAuditLogs = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  status_code?: number;
  from_date?: string;
  to_date?: string;
}) => api.get("/admin/settings/audit-logs", { params });
