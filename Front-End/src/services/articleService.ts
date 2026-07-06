import api from './api';

// Types
export interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content?: string;
    image_url: string | null;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
    status_badge: string;
    status_color: string;
    life_stage: {
        id: number;
        name: string;
        name_ar: string;
    } | null;
    tags: string[];
    views_count: number;
    reading_time: number | null;
    reading_time_text: string | null;
    doctor: {
        id: number;
        name: string;
        specialization: string;
        specialization_ar: string;
        image_url: string | null;
        bio?: string;
        years_of_experience?: number;
        rating?: number;
        total_articles?: number;
        total_consultations?: number;
    };
    admin_notes?: string | null;
    reviewer?: {
        id: number;
        name: string;
    } | null;
    reviewed_at?: string | null;
    published_at: string | null;
    published_date: string | null;
    published_date_human: string | null;
    created_at: string;
    updated_at: string;
}

export interface ArticleStats {
    total: number;
    draft: number;
    pending_review: number;
    approved: number;
    rejected: number;
    archived: number;
    total_views?: number;
}

export interface Tag {
    name: string;
    count: number;
}

export interface ArticleFilters {
    life_stage_id?: number;
    doctor_id?: number;
    tags?: string;
    search?: string;
    sort_by?: 'latest' | 'popular' | 'reading_time';
    status?: string;
    page?: number;
    per_page?: number;
}

export interface CreateArticleData {
    title: string;
    excerpt?: string;
    content: string;
    image?: File;
    life_stage_id?: number;
    tags?: string[];
    status?: 'draft' | 'pending_review';
}

export interface UpdateArticleData extends Partial<CreateArticleData> { }

// ============================================
// PUBLIC ENDPOINTS (No auth required)
// ============================================

/**
 * Get published articles (public)
 */
export const getPublicArticles = async (filters: ArticleFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });

    const response = await api.get(`/patient/articles?${params.toString()}`);
    return response.data;
};

/**
 * Get single article by slug (public)
 */
export const getArticleBySlug = async (slug: string) => {
    const response = await api.get(`/patient/articles/${slug}`);
    return response.data;
};


/**
 * Get doctor's published articles (public)
 */
export const getDoctorPublicArticles = async (doctorId: number, page = 1) => {
    const response = await api.get(`/patient/doctors/${doctorId}/articles?page=${page}`);
    return response.data;
};

// ============================================
// DOCTOR ENDPOINTS
// ============================================

/**
 * Get doctor's own articles
 */
export const getDoctorArticles = async (filters: ArticleFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });

    const response = await api.get(`/doctor/articles?${params.toString()}`);
    return response.data;
};

/**
 * Get single article (doctor)
 */
export const getDoctorArticle = async (id: number) => {
    const response = await api.get(`/doctor/articles/${id}`);
    return response.data;
};

/**
 * Create new article
 */
export const createArticle = async (data: CreateArticleData) => {
    const formData = new FormData();

    formData.append('title', data.title);
    formData.append('content', data.content);

    if (data.excerpt) formData.append('excerpt', data.excerpt);
    if (data.image) formData.append('image', data.image);
    if (data.life_stage_id) formData.append('life_stage_id', String(data.life_stage_id));
    if (data.status) formData.append('status', data.status);

    if (data.tags && data.tags.length > 0) {
        data.tags.forEach((tag, index) => {
            formData.append(`tags[${index}]`, tag);
        });
    }

    const response = await api.post('/doctor/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Update article
 */
export const updateArticle = async (id: number, data: UpdateArticleData) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');

    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.excerpt !== undefined) formData.append('excerpt', data.excerpt || '');
    if (data.image) formData.append('image', data.image);
    if (data.life_stage_id) formData.append('life_stage_id', String(data.life_stage_id));
    if (data.status) formData.append('status', data.status);

    if (data.tags) {
        data.tags.forEach((tag, index) => {
            formData.append(`tags[${index}]`, tag);
        });
    }

    const response = await api.post(`/doctor/articles/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Submit article for review
 */
export const submitArticleForReview = async (id: number) => {
    const response = await api.put(`/doctor/articles/${id}/submit`);
    return response.data;
};

/**
 * Delete article (doctor)
 */
export const deleteArticle = async (id: number) => {
    const response = await api.delete(`/doctor/articles/${id}`);
    return response.data;
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get all articles (admin)
 */
export const getAdminArticles = async (filters: ArticleFilters & { pending_only?: boolean } = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });

    const response = await api.get(`/admin/articles?${params.toString()}`);
    return response.data;
};

/**
 * Get article for review (admin)
 */
export const getAdminArticle = async (id: number) => {
    const response = await api.get(`/admin/articles/${id}`);
    return response.data;
};

/**
 * Approve article
 */
export const approveArticle = async (id: number, data?: { publish_now?: boolean; published_at?: string }) => {
    const response = await api.put(`/admin/articles/${id}/approve`, data || { publish_now: true });
    return response.data;
};

/**
 * Reject article
 */
export const rejectArticle = async (id: number, adminNotes: string) => {
    const response = await api.put(`/admin/articles/${id}/reject`, { admin_notes: adminNotes });
    return response.data;
};

/**
 * Archive article
 */
export const archiveArticle = async (id: number) => {
    const response = await api.put(`/admin/articles/${id}/archive`);
    return response.data;
};

/**
 * Restore archived article
 */
export const restoreArticle = async (id: number) => {
    const response = await api.put(`/admin/articles/${id}/restore`);
    return response.data;
};

/**
 * Force delete article (admin)
 */
export const forceDeleteArticle = async (id: number) => {
    const response = await api.delete(`/admin/articles/${id}`);
    return response.data;
};

export default {
    // Public
    getPublicArticles,
    getArticleBySlug,
    getDoctorPublicArticles,

    // Doctor
    getDoctorArticles,
    getDoctorArticle,
    createArticle,
    updateArticle,
    submitArticleForReview,
    deleteArticle,

    // Admin
    getAdminArticles,
    getAdminArticle,
    approveArticle,
    rejectArticle,
    archiveArticle,
    restoreArticle,
    forceDeleteArticle,
};
