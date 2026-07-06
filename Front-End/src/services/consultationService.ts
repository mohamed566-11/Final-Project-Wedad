import api from './api';

// Types
export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  specialization_ar: string;
  bio: string;
  years_of_experience: number;
  consultation_price: number;
  rating: number;
  total_consultations: number;
  total_reviews: number;
  session_type: 'video' | 'offline' | 'both';
  languages: string[];
  is_available: boolean;
  image_url: string | null;
  clinic_address?: string;
  life_stages: { id: number; name: string; name_ar: string; slug: string }[];
  verification_status: string;
  verified_badge: boolean;
  next_available_slot?: string;
}

export interface DoctorDetails extends Doctor {
  working_hours: WorkingHour[];
  next_available_slots: TimeSlot[];
  reviews: Review[];
  reviews_summary: ReviewsSummary;
}

export interface WorkingHour {
  day: string;
  day_ar: string;
  start_times: string[];
}

export interface TimeSlot {
  time: string;
  end_time?: string;
  available: boolean;
  date?: string;
  reason?: string;
}

export interface Review {
  id: number;
  patient_name: string;
  patient_image?: string;
  rating: number;
  comment: string;
  is_anonymous?: boolean;
  created_at: string;
  consultation_date?: string;
}

export interface ReviewsSummary {
  average_rating: number;
  total_reviews: number;
  '5_star': number;
  '4_star': number;
  '3_star': number;
  '2_star': number;
  '1_star': number;
}

export interface Consultation {
  id: number;
  doctor: {
    id: number;
    name: string;
    specialization: string;
    specialization_ar: string;
    rating: number;
    image_url: string | null;
  };
  patient?: {
    id: number;
    name: string;
    image_url?: string;
  };
  date: string;
  time: string;
  type: 'video' | 'offline';
  type_ar: string;
  status: string;
  status_ar: string;
  price: number;
  patient_notes?: string;
  doctor_notes?: string;
  duration_minutes?: number;
  started_at?: string;
  ended_at?: string;
  cancellation_reason?: string;
  google_meet_link?: string;
  google_meet_id?: string;
  google_event_id?: string;
  can_join: boolean;
  can_cancel: boolean;
  can_reschedule: boolean;
  can_review: boolean;
  has_review: boolean;
  time_until?: string;
  payment?: {
    id: number;
    amount: number;
    status: string;
    payment_method: string;
    paid_at?: string;
  };
  prescription?: {
    id: number;
    medications: Array<{
      id: string; // From UI generation
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      notes: string;
    }>;
    diagnosis?: string;
    notes?: string;
    file_path?: string;
    created_at: string;
  };
  created_at: string;
}

export interface SearchFilters {
  search?: string;
  specialization?: string;
  life_stage_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  languages?: string[];
  session_type?: string;
  availability?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}

export interface BookingData {
  doctor_id: number;
  date: string;
  time: string;
  type: 'video' | 'offline';
  patient_notes?: string;
  payment_method?: string;
  wallet_number?: string;
}

// API Functions
export const consultationService = {
  // Search & Discovery
  searchDoctors: async (filters: SearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    const response = await api.get(`/patient/doctors/search?${params.toString()}`);
    return response.data;
  },

  getDoctorDetails: async (id: number) => {
    const response = await api.get(`/patient/doctors/${id}`);
    return response.data;
  },

  getAvailableSlots: async (doctorId: number, date: string, duration: number = 30) => {
    const response = await api.get(`/patient/doctors/${doctorId}/available-slots`, {
      params: { date, duration }
    });
    return response.data;
  },

  getDoctorReviews: async (doctorId: number, params?: { rating?: number; page?: number }) => {
    const response = await api.get(`/patient/doctors/${doctorId}/reviews`, { params });
    return response.data;
  },

  getRecommendedDoctors: async () => {
    const response = await api.get('/patient/doctors/recommended');
    return response.data;
  },

  // Patient Consultations
  bookConsultation: async (data: BookingData) => {
    const response = await api.post('/patient/consultations/book', data);
    return response.data;
  },

  getMyConsultations: async (params?: { status?: string; upcoming?: boolean; past?: boolean; page?: number }) => {
    const response = await api.get('/patient/consultations', { params });
    return response.data;
  },

  getConsultationDetails: async (id: number) => {
    const response = await api.get(`/patient/consultations/${id}`);
    return response.data;
  },

  cancelConsultation: async (id: number, reason: string) => {
    const response = await api.put(`/patient/consultations/${id}/cancel`, {
      cancellation_reason: reason
    });
    return response.data;
  },

  retryPayment: async (id: number, data: { payment_method: string; wallet_number?: string }) => {
    const response = await api.post(`/patient/consultations/${id}/pay`, data);
    return response.data;
  },

  rescheduleConsultation: async (id: number, data: { new_date: string; new_time: string; reason?: string }) => {
    const response = await api.put(`/patient/consultations/${id}/reschedule`, data);
    return response.data;
  },

  reviewConsultation: async (id: number, data: { rating: number; comment?: string; is_anonymous?: boolean }) => {
    const response = await api.post(`/patient/consultations/${id}/review`, data);
    return response.data;
  },


  // NOTE: google_meet_link is returned directly inside the ConsultationResource
  //       (consultation.google_meet_link) — no separate API call needed.
  //       VideoCall.tsx reads it from getConsultationDetails() response.

  // Doctor Consultations
  getDoctorConsultations: async (params?: { status?: string; date?: string; upcoming?: boolean; page?: number }) => {
    const response = await api.get('/doctor/consultations', { params });
    return response.data;
  },

  getDoctorConsultationDetails: async (id: number) => {
    const response = await api.get(`/doctor/consultations/${id}`);
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

  completeConsultation: async (id: number, data: {
    doctor_notes: string;
    diagnosis?: string;
    prescription?: string;
    medications?: any[];
    follow_up?: string;
    duration_minutes?: number;
    follow_up_required?: boolean;
    follow_up_after_days?: number
  }) => {
    const response = await api.put(`/doctor/consultations/${id}/complete`, data);
    return response.data;
  },

  cancelDoctorConsultation: async (id: number, reason: string) => {
    const response = await api.put(`/doctor/consultations/${id}/cancel`, {
      cancellation_reason: reason
    });
    return response.data;
  },

  getPatientHistory: async (consultationId: number) => {
    const response = await api.get(`/doctor/consultations/${consultationId}/patient-history`);
    return response.data;
  },

  // Google Meet
  getGoogleAuthUrl: async () => {
    const response = await api.get('/doctor/google/auth-url');
    return response.data;
  },

  checkGoogleConnection: async () => {
    const response = await api.get('/doctor/google/check');
    return response.data;
  },

  disconnectGoogle: async () => {
    const response = await api.post('/doctor/google/disconnect');
    return response.data;
  },

  getDoctorDashboard: async () => {
    const response = await api.get('/doctor/dashboard');
    return response.data;
  },

  getWorkingHours: async () => {
    const response = await api.get('/doctor/working-hours');
    return response.data;
  },

  updateWorkingHours: async (workingHours: { day: string; start_time: string }[]) => {
    const response = await api.put('/doctor/working-hours', { working_hours: workingHours });
    return response.data;
  },

  // ─── Consultation Attachments ────────────────────────────────────────────────

  // Get attachments for a consultation (works for both patient & doctor)
  getConsultationAttachments: async (consultationId: number, role: 'patient' | 'doctor' = 'patient') => {
    const response = await api.get(`/${role}/consultations/${consultationId}/attachments`);
    return response.data;
  },

  // Upload a file attachment to a consultation
  uploadConsultationAttachment: async (
    consultationId: number,
    formData: FormData,
    role: 'patient' | 'doctor' = 'patient'
  ) => {
    const response = await api.post(`/${role}/consultations/${consultationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete an attachment
  deleteConsultationAttachment: async (consultationId: number, attachmentId: number, role: 'patient' | 'doctor') => {
    const response = await api.delete(`/${role}/consultations/${consultationId}/attachments/${attachmentId}`);
    return response.data;
  },

  downloadConsultationAttachment: async (consultationId: number, attachmentId: number, role: 'patient' | 'doctor') => {
    const response = await api.get(`/${role}/consultations/${consultationId}/attachments/${attachmentId}/download`, {
      responseType: 'blob' // Important to handle Binary file data
    });
    return response;
  },

  // ─── Prescriptions ───────────────────────────────────────────────────────────

  /** Patient: list all their prescriptions */
  getMyPrescriptions: async (params?: { per_page?: number; page?: number }) => {
    const response = await api.get('/patient/prescriptions', { params });
    return response.data;
  },

  /** Patient: get single prescription by ID */
  getPrescriptionById: async (id: number) => {
    const response = await api.get(`/patient/prescriptions/${id}`);
    return response.data;
  },

  /** Patient: get prescription for a specific consultation */
  getPrescriptionByConsultation: async (consultationId: number) => {
    const response = await api.get(`/patient/consultations/${consultationId}/prescription`);
    return response.data;
  },

  /** Doctor: list prescriptions they issued */
  getDoctorPrescriptions: async (params?: { per_page?: number; page?: number; user_id?: number }) => {
    const response = await api.get('/doctor/prescriptions', { params });
    return response.data;
  },

  /** Doctor: get single prescription they issued */
  getDoctorPrescriptionById: async (id: number) => {
    const response = await api.get(`/doctor/prescriptions/${id}`);
    return response.data;
  },
};


export default consultationService;
