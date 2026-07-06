import api from './api';

// Types
export interface FAQ {
    id: number;
    question: string;
    answer: string;
    life_stage_id: number | null;
    life_stage?: {
        id: number;
        name: string;
        name_ar: string;
    } | null;
    is_active: boolean;
    order: number;
}

export interface LifeStage {
    id: number;
    name: string;
    name_ar: string;
    slug: string;
}

export interface AboutUs {
    id: number;
    title: string;
    description: string;
    image_url: string | null;
    mission_title: string;
    mission_description: string;
    vision_title: string;
    vision_description: string;
}

export interface FaqFormData {
    question: string;
    answer: string;
    life_stage_id?: number | null;
    is_active?: boolean;
    order?: number;
}

export interface AboutFormData {
    title: string;
    description: string;
    mission_title: string;
    mission_description: string;
    vision_title: string;
    vision_description: string;
    image?: File | null;
}

// Admin Settings Service
export const adminSettingsService = {
    // ============================================
    // FAQS MANAGEMENT
    // ============================================

    getFaqs: (params?: { life_stage_id?: number; search?: string }) =>
        api.get<{ data: { faqs: FAQ[]; life_stages: LifeStage[] } }>('/admin/faqs', { params }),

    getFaq: (id: number) =>
        api.get<{ data: { faq: FAQ } }>(`/admin/faqs/${id}`),

    createFaq: (data: FaqFormData) =>
        api.post<{ data: { faq: FAQ }; message: string }>('/admin/faqs', data),

    updateFaq: (id: number, data: FaqFormData) =>
        api.put<{ data: { faq: FAQ }; message: string }>(`/admin/faqs/${id}`, data),

    deleteFaq: (id: number) =>
        api.delete<{ message: string }>(`/admin/faqs/${id}`),

    toggleFaqStatus: (id: number) =>
        api.put<{ data: { faq: FAQ }; message: string }>(`/admin/faqs/${id}/toggle`),

    reorderFaqs: (faqs: { id: number; order: number }[]) =>
        api.put<{ message: string }>('/admin/faqs/reorder', { faqs }),

    // ============================================
    // ABOUT US MANAGEMENT
    // ============================================

    getAboutUs: () =>
        api.get<{ data: { about: AboutUs } }>('/admin/about-us'),

    updateAboutUs: (data: FormData) =>
        api.post<{ data: { about: AboutUs }; message: string }>('/admin/about-us', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    // ============================================
    // TERMS & PRIVACY
    // ============================================

    getTermsPrivacy: () =>
        api.get<{ data: { terms_content: string; privacy_content: string } }>('/admin/settings'),

    updateTermsPrivacy: (data: { terms_content?: string; privacy_content?: string }) =>
        api.put<{ message: string }>('/admin/settings', data),
};

export default adminSettingsService;
