import api from './api';

// Types
export interface AboutUs {
    id: number;
    title: string;
    description: string;
    image_url: string | null;
    mission: {
        title: string;
        description: string;
    };
    vision: {
        title: string;
        description: string;
    };
}

export interface AboutUsStats {
    total_users: number;
    total_doctors: number;
    total_consultations: number;
    satisfaction_rate: number;
}

export interface FAQ {
    id: number;
    question: string;
    answer: string;
    life_stage: {
        id: number;
        name: string;
        name_ar: string;
    } | null;
    order: number;
}

export interface LifeStage {
    id: number;
    name: string;
    name_ar: string;
    slug: string;
    description: string;
    icon: string;
    stats?: {
        total_users: number;
        total_articles: number;
        total_doctors: number;
    };
    features?: string[];
    tools?: Array<{
        title: string;
        url: string;
        icon: string;
        description: string;
    }>;
    related_articles?: Array<{
        id: number;
        slug: string;
        title: string;
        excerpt: string;
        image_url: string | null;
        reading_time: number;
    }>;
    available_doctors?: Array<{
        id: number;
        name: string;
        specialization_ar: string;
        rating: number;
        image_url: string | null;
        consultation_price: number;
        years_of_experience: number;
        total_consultations: number;
        is_available: boolean;
    }>;
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
}

export interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export interface JoinFormData {
    name: string;
    email: string;
    phone: string;
    specialty: string;
    license_number: string;
    consultation_price: string;
    password?: string;
}

export interface SiteSettings {
    site_name: string;
    email: string;
    phone: string;
    address: {
        country: string;
        city: string;
        street: string;
    };
    description: string;
    logo_url: string | null;
    favicon_url: string | null;
    social_media: {
        facebook: string | null;
        twitter: string | null;
        instagram: string | null;
        youtube: string | null;
    };
}

export interface ContactInfo {
    email: string;
    phone: string;
    address: {
        country: string;
        city: string;
        street: string;
    };
    working_hours: string;
    social_media: {
        facebook: string | null;
        twitter: string | null;
        instagram: string | null;
        youtube: string | null;
    };
}

export interface TermsPrivacy {
    title: string;
    content: string;
    last_updated: string;
}

// API Functions
export const publicService = {
    // About Us
    getAboutUs: () =>
        api.get<{ data: { about: AboutUs; stats: AboutUsStats } }>('/about-us'),

    // FAQs
    getFAQs: (params?: { life_stage_id?: number; search?: string }) =>
        api.get<{ data: { faqs: FAQ[]; grouped_by_life_stage: Record<string, FAQ[]> } }>('/faqs', { params }),

    // Contact
    submitContactForm: (data: ContactFormData) =>
        api.post<{ data: { message_id: number; estimated_response_time: string }; message: string }>('/contact-us', data),

    getContactInfo: () =>
        api.get<{ data: ContactInfo }>('/contact-info'),

    // Join as Doctor
    submitJoinRequest: (data: JoinFormData) =>
        api.post<{ data: { application_id: number; next_steps: string[] }; message: string }>('/join-us', data),

    // Site Settings
    getSiteSettings: () =>
        api.get<{ data: SiteSettings }>('/settings'),

    // Terms & Privacy
    getTerms: () =>
        api.get<{ data: { terms: TermsPrivacy } }>('/terms'),

    getPrivacy: () =>
        api.get<{ data: { privacy: TermsPrivacy } }>('/privacy'),

    // Life Stages
    getLifeStages: () =>
        api.get<{ data: { life_stages: LifeStage[] } }>('/life-stages'),

    getLifeStage: (slug: string) =>
        api.get<{ data: { life_stage: LifeStage } }>(`/life-stages/${slug}`),
};

export default publicService;
