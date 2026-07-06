/**
 * Permission constants — mirrors backend app/Enums/Permission.php
 *
 * Keep in sync with the backend Permission enum.
 * These are used for client-side navigation filtering and UI guards.
 * Actual enforcement is always server-side via CheckPermission middleware.
 */

// Admin Management
export const MANAGE_ADMINS = "manage_admins";
export const MANAGE_ROLES = "manage_roles";

// User Management
export const MANAGE_USERS = "manage_users";
export const VIEW_USERS = "view_users";

// Doctor Management
export const MANAGE_DOCTORS = "manage_doctors";
export const VERIFY_DOCTORS = "verify_doctors";
export const VIEW_DOCTORS = "view_doctors";

// Content Management
export const MANAGE_ARTICLES = "manage_articles";
export const REVIEW_ARTICLES = "review_articles";
export const MANAGE_FAQS = "manage_faqs";
export const MANAGE_PAGES = "manage_pages";

// Consultations
export const MANAGE_CONSULTATIONS = "manage_consultations";
export const VIEW_CONSULTATIONS = "view_consultations";

// Financials
export const MANAGE_FINANCIALS = "manage_financials";
export const PROCESS_PAYOUTS = "process_payouts";

// Settings
export const MANAGE_SETTINGS = "manage_settings";

// Analytics & Reports
export const VIEW_ANALYTICS = "view_analytics";
export const VIEW_REPORTS = "view_reports";

// Notifications
export const SEND_NOTIFICATIONS = "send_notifications";

// Messages
export const MANAGE_MESSAGES = "manage_messages";

// Chatbot
export const MANAGE_CHATBOT = "manage_chatbot";

/**
 * Maps admin route paths to required permissions.
 * Used by AdminLayout to filter navigation items and by RequirePermission to guard pages.
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin/dashboard": [VIEW_ANALYTICS],
  "/admin/users": [
    MANAGE_USERS,
    VIEW_USERS,
    MANAGE_DOCTORS,
    VIEW_DOCTORS,
    MANAGE_ADMINS,
  ],
  "/admin/users/patients": [MANAGE_USERS, VIEW_USERS],
  "/admin/users/doctors": [MANAGE_DOCTORS, VIEW_DOCTORS],
  "/admin/users/admins": [MANAGE_ADMINS],
  "/admin/join-requests": [MANAGE_DOCTORS],
  "/admin/consultations": [VIEW_CONSULTATIONS, MANAGE_CONSULTATIONS],
  "/admin/articles": [MANAGE_ARTICLES, REVIEW_ARTICLES],
  "/admin/chatbot": [MANAGE_CHATBOT],
  "/admin/chatbot/stats": [MANAGE_CHATBOT],
  "/admin/knowledge-base": [MANAGE_CHATBOT],
  "/admin/financials": [MANAGE_FINANCIALS],
  "/admin/messages": [MANAGE_MESSAGES],
  "/admin/notifications": [SEND_NOTIFICATIONS],
  "/admin/analytics": [VIEW_ANALYTICS, VIEW_REPORTS],
  "/admin/ai-analytics": [VIEW_ANALYTICS, VIEW_REPORTS],
  "/admin/faqs": [MANAGE_FAQS],
  "/admin/about": [MANAGE_PAGES],
  "/admin/settings": [MANAGE_SETTINGS],
  "/admin/audit-logs": [MANAGE_SETTINGS],
};
