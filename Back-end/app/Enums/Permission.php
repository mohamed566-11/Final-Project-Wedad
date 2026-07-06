<?php

namespace App\Enums;

/**
 * Permission constants for the admin role-based access control system.
 *
 * These constants are used in:
 * - RoleSeeder (assigning permissions to roles)
 * - CheckPermission middleware (verifying access)
 * - SettingsController (available permissions list)
 * - Admin routes (middleware parameters)
 */
class Permission
{
    // ============================================
    // ADMIN MANAGEMENT
    // ============================================
    const MANAGE_ADMINS = 'manage_admins';
    const MANAGE_ROLES = 'manage_roles';

    // ============================================
    // USER MANAGEMENT
    // ============================================
    const MANAGE_USERS = 'manage_users';
    const VIEW_USERS = 'view_users';

    // ============================================
    // DOCTOR MANAGEMENT
    // ============================================
    const MANAGE_DOCTORS = 'manage_doctors';
    const VERIFY_DOCTORS = 'verify_doctors';
    const VIEW_DOCTORS = 'view_doctors';

    // ============================================
    // CONTENT MANAGEMENT
    // ============================================
    const MANAGE_ARTICLES = 'manage_articles';
    const REVIEW_ARTICLES = 'review_articles';
    const MANAGE_FAQS = 'manage_faqs';
    const MANAGE_PAGES = 'manage_pages';

    // ============================================
    // CONSULTATIONS
    // ============================================
    const MANAGE_CONSULTATIONS = 'manage_consultations';
    const VIEW_CONSULTATIONS = 'view_consultations';

    // ============================================
    // FINANCIALS
    // ============================================
    const MANAGE_FINANCIALS = 'manage_financials';
    const PROCESS_PAYOUTS = 'process_payouts';

    // ============================================
    // SETTINGS
    // ============================================
    const MANAGE_SETTINGS = 'manage_settings';

    // ============================================
    // ANALYTICS & REPORTS
    // ============================================
    const VIEW_ANALYTICS = 'view_analytics';
    const VIEW_REPORTS = 'view_reports';

    // ============================================
    // NOTIFICATIONS
    // ============================================
    const SEND_NOTIFICATIONS = 'send_notifications';

    // ============================================
    // CHATBOT
    // ============================================
    const MANAGE_CHATBOT = 'manage_chatbot';

    // ============================================
    // MESSAGES
    // ============================================
    const MANAGE_MESSAGES = 'manage_messages';

    /**
     * Get all available permissions with Arabic descriptions.
     * Used in SettingsController for the roles management UI.
     */
    public static function allWithDescriptions(): array
    {
        return [
            self::MANAGE_ADMINS => 'إدارة المسؤولين',
            self::MANAGE_ROLES => 'إدارة الأدوار',
            self::MANAGE_USERS => 'إدارة المستخدمين',
            self::VIEW_USERS => 'عرض المستخدمين',
            self::MANAGE_DOCTORS => 'إدارة الأطباء',
            self::VERIFY_DOCTORS => 'التحقق من الأطباء',
            self::VIEW_DOCTORS => 'عرض الأطباء',
            self::MANAGE_ARTICLES => 'إدارة المقالات',
            self::REVIEW_ARTICLES => 'مراجعة المقالات',
            self::MANAGE_FAQS => 'إدارة الأسئلة الشائعة',
            self::MANAGE_PAGES => 'إدارة الصفحات (من نحن، قصص النجاح)',
            self::MANAGE_CONSULTATIONS => 'إدارة الاستشارات',
            self::VIEW_CONSULTATIONS => 'عرض الاستشارات',
            self::MANAGE_FINANCIALS => 'إدارة الماليات',
            self::PROCESS_PAYOUTS => 'معالجة المدفوعات',
            self::MANAGE_SETTINGS => 'إدارة الإعدادات',
            self::VIEW_ANALYTICS => 'عرض التحليلات',
            self::VIEW_REPORTS => 'عرض التقارير',
            self::SEND_NOTIFICATIONS => 'إرسال الإشعارات',
            self::MANAGE_MESSAGES => 'إدارة رسائل التواصل',
            self::MANAGE_CHATBOT => 'إدارة الشات بوت',
        ];
    }

    /**
     * Get all permission keys.
     */
    public static function all(): array
    {
        return array_keys(self::allWithDescriptions());
    }
}
