import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 (GA4) Integration
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Initialize Google Analytics
export const initGA = () => {
    if (typeof window === 'undefined') return;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
    });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path,
        page_title: title || document.title,
    });
};

// Track custom events
export const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
    });
};

// Predefined event trackers for common actions
export const analytics = {
    // User actions
    signUp: (method: string) => trackEvent('sign_up', 'engagement', method),
    login: (method: string) => trackEvent('login', 'engagement', method),
    logout: () => trackEvent('logout', 'engagement'),

    // Consultation actions
    bookConsultation: (doctorId: number, price: number) =>
        trackEvent('book_consultation', 'ecommerce', `doctor_${doctorId}`, price),
    startVideoCall: (consultationId: number) =>
        trackEvent('start_video_call', 'consultation', `consultation_${consultationId}`),
    completeConsultation: (consultationId: number) =>
        trackEvent('complete_consultation', 'consultation', `consultation_${consultationId}`),

    // Doctor actions
    viewDoctorProfile: (doctorId: number) =>
        trackEvent('view_doctor', 'engagement', `doctor_${doctorId}`),
    filterDoctors: (filterType: string) =>
        trackEvent('filter_doctors', 'engagement', filterType),

    // Article actions
    viewArticle: (articleSlug: string) =>
        trackEvent('view_article', 'content', articleSlug),
    shareArticle: (articleSlug: string, platform: string) =>
        trackEvent('share_article', 'social', `${articleSlug}_${platform}`),

    // Health tools
    useCalculator: (calculatorType: string) =>
        trackEvent('use_calculator', 'tools', calculatorType),
    checkSymptoms: () => trackEvent('check_symptoms', 'tools', 'symptom_checker'),

    // Life stage navigation
    viewLifeStage: (stageSlug: string) =>
        trackEvent('view_life_stage', 'navigation', stageSlug),

    // Search
    search: (query: string) =>
        trackEvent('search', 'engagement', query),

    // Errors
    error: (errorType: string, errorMessage: string) =>
        trackEvent('error', 'error', `${errorType}: ${errorMessage}`),
};

// React Hook for automatic page tracking
export const useAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        trackPageView(location.pathname + location.search);
    }, [location]);

    return analytics;
};

export default analytics;
