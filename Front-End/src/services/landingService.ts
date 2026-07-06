import api from "./api";

// ==================== TypeScript Interfaces ====================

export interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  cta_primary: {
    text: string;
    link: string;
  };
  cta_secondary: {
    text: string;
    link: string;
  };
  image_url: string | null;
  video_url: string | null;
  trust_indicators: Array<{
    icon: string;
    value: string | number;
    label: string;
  }>;
}

/** Dynamic hero data returned from the API */
export interface HeroDynamicData {
  image_url: string | null;
  video_url: string | null;
  description: string | null;
  trust_indicators: Array<{
    key: string;
    value: string | number;
    label: string;
  }>;
}

export interface Stats {
  total_users: number;
  total_doctors: number;
  total_consultations: number;
  satisfaction_rate: number;
  total_articles: number;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  link: string;
  color: string;
}

export interface LifeStage {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  description: string;
  users_count: number;
  image_url: string | null;
  color: string;
}

export interface HowItWorksStep {
  step: number;
  icon: string;
  title: string;
  description: string;
}

export interface WhyChooseUs {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturedDoctor {
  id: number;
  name: string;
  specialization: string;
  specialization_ar: string;
  image_url: string | null;
  rating: number;
  total_consultations: number;
  years_of_experience: number;
  consultation_price: number;
  next_available: string | null;
  is_available: boolean;
}

export interface Testimonial {
  id: number;
  patient_name: string;
  patient_image: string | null;
  rating: number;
  comment: string;
  life_stage: string;
  date: string;
}

export interface RecentArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string | null;
  doctor: {
    name: string;
    image_url: string | null;
  } | null;
  life_stage: {
    name: string;
    name_ar: string;
  } | null;
  views_count: number;
  reading_time: number;
  published_at: string;
}

export interface AppDownload {
  title: string;
  description: string;
  features: string[];
  app_store_url: string;
  play_store_url: string;
  qr_code_url: string | null;
}

export interface CtaBanner {
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  secondary_text: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

/** Full landing page data (static + dynamic merged) */
export interface LandingPageData {
  hero: HeroData;
  stats: Stats;
  features: Feature[];
  life_stages: LifeStage[];
  how_it_works: HowItWorksStep[];
  why_choose_us: WhyChooseUs[];
  featured_doctors: FeaturedDoctor[];
  testimonials: Testimonial[];
  recent_articles: RecentArticle[];
  app_download: AppDownload;
  cta_banner: CtaBanner;
}

/** Dynamic data returned from the API (no static content) */
export interface LandingPageDynamicData {
  hero: HeroDynamicData;
  stats: Stats;
  life_stages: LifeStage[];
  featured_doctors: FeaturedDoctor[];
  testimonials: Testimonial[];
  recent_articles: RecentArticle[];
}

export interface LandingPageStats {
  users: {
    total: number;
    today: number;
    this_week: number;
  };
  doctors: {
    total: number;
    verified: number;
    available_now: number;
  };
  consultations: {
    total: number;
    this_month: number;
    completed_today: number;
  };
  articles: {
    total: number;
    total_views: number;
  };
}

// ==================== API Service ====================

const landingService = {
  /**
   * Get dynamic landing page data from API
   * GET /api/v1/landing-page
   */
  getLandingPageData: async (): Promise<LandingPageDynamicData> => {
    const response = await api.get("/landing-page");
    return response.data.data;
  },

  /**
   * Get live statistics
   * GET /api/v1/landing-page/stats
   */
  getStats: async (): Promise<LandingPageStats> => {
    const response = await api.get("/landing-page/stats");
    return response.data.data;
  },

  /**
   * Get FAQs for landing page
   * GET /api/v1/landing-page/faqs
   */
  getFaqs: async (): Promise<FAQ[]> => {
    const response = await api.get("/landing-page/faqs");
    return response.data.data.faqs;
  },

  /**
   * Get life stage details
   * GET /api/v1/landing-page/life-stages/{slug}
   */
  getLifeStageDetails: async (slug: string) => {
    const response = await api.get(`/landing-page/life-stages/${slug}`);
    return response.data.data;
  },

  /**
   * Get all doctors (public)
   * GET /api/v1/landing-page/doctors
   */
  getAllDoctors: async (params?: {
    specialization?: string;
    life_stage_id?: string | number;
    sort?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get("/landing-page/doctors", { params });
    return response.data.data;
  },

  /**
   * Get doctor profile (public)
   * GET /api/v1/landing-page/doctors/{id}
   */
  getDoctorProfile: async (id: string | number) => {
    const response = await api.get(`/landing-page/doctors/${id}`);
    return response.data.data;
  },

  /**
   * Get success stories (public)
   * GET /api/v1/landing-page/success-stories
   */
  getSuccessStories: async (params?: {
    life_stage?: string;
    featured_only?: boolean;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get("/landing-page/success-stories", { params });
    return response.data.data;
  },
};

export default landingService;
