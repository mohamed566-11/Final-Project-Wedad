<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Resources\Admin\AdminResource;
use App\Http\Controllers\Api\Admin\Auth\LoginController;
use App\Http\Controllers\Api\Admin\Auth\Password\ResetPasswordController;
use App\Http\Controllers\Api\Admin\Auth\Password\ForgetPasswordController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\PatientController;
use App\Http\Controllers\Api\Admin\DoctorController;
use App\Http\Controllers\Api\Admin\AdminManagementController;
use App\Http\Controllers\Api\Admin\JoinRequestController;
use App\Http\Controllers\Api\Admin\ConsultationController;
use App\Http\Controllers\Api\Admin\FinancialController;
use App\Http\Controllers\Api\Admin\ContactMessageController;
use App\Http\Controllers\Api\Admin\NotificationAdminController;
use App\Http\Controllers\Api\Admin\AnalyticsController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\ArticleController;
use App\Enums\Permission;

// prefix => api/v1/admin

//********************* Auth Login & Logout Routes ********************************
Route::controller(LoginController::class)->group(function () {
    Route::post('auth/login', 'login')->middleware('throttle:5,1');
    Route::post('auth/logout', 'logout')->middleware('auth:admin');
    Route::post('auth/logout/all', 'logoutAllDevices')->middleware('auth:admin');
});

//********************* Auth ForgetPassword Routes ********************************
Route::controller(ForgetPasswordController::class)->middleware('throttle:3,1')->group(function () {
    Route::post('password/email', 'sendOtp');
});

//********************* Auth ResetPassword Routes ********************************
Route::controller(ResetPasswordController::class)->middleware('throttle:5,1')->group(function () {
    Route::post('password/reset', 'resetPassword');
});


// ============================================
// PROTECTED ADMIN ROUTES
// ============================================
Route::middleware(['auth:admin', 'AdminStatus', 'admin.audit'])->group(function () {

    // Get authenticated admin data (any authenticated admin)
    Route::get('data', function (Request $request) {
        $admin = $request->user();
        return new AdminResource($admin->load('role'));
    });

    // Update authenticated admin profile
    Route::put('profile', function (Request $request) {
        $admin = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $admin->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => new AdminResource($admin->load('role'))
        ]);
    });

    // ============================================
    // DASHBOARD (requires: view_analytics)
    // ============================================
    Route::prefix('dashboard')->middleware('permission:' . Permission::VIEW_ANALYTICS)
        ->controller(DashboardController::class)->group(function () {
            Route::get('stats', 'stats');
            Route::get('recent-activity', 'recentActivity');
            Route::get('alerts', 'alerts');
        });

    // ============================================
    // PATIENTS MANAGEMENT (requires: manage_users or view_users)
    // ============================================
    Route::prefix('patients')->middleware('permission:' . Permission::MANAGE_USERS . ',' . Permission::VIEW_USERS)
        ->controller(PatientController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('life-stages', 'lifeStages');
            Route::get('{id}', 'show');
            Route::put('{id}/toggle-status', 'toggleStatus')->middleware('permission:' . Permission::MANAGE_USERS);
            Route::delete('{id}', 'destroy')->middleware('permission:' . Permission::MANAGE_USERS);
        });

    // ============================================
    // DOCTORS MANAGEMENT (requires: manage_doctors, view_doctors, or verify_doctors)
    // ============================================
    Route::prefix('doctors')->middleware('permission:' . Permission::MANAGE_DOCTORS . ',' . Permission::VIEW_DOCTORS . ',' . Permission::VERIFY_DOCTORS)
        ->controller(DoctorController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('specializations', 'specializations');
            Route::get('{id}', 'show');
            Route::put('{id}/verify', 'verify')->middleware('permission:' . Permission::MANAGE_DOCTORS . ',' . Permission::VERIFY_DOCTORS);
            Route::put('{id}/reject', 'reject')->middleware('permission:' . Permission::MANAGE_DOCTORS . ',' . Permission::VERIFY_DOCTORS);
            Route::put('{id}/toggle-status', 'toggleStatus')->middleware('permission:' . Permission::MANAGE_DOCTORS);
            Route::delete('{id}', 'destroy')->middleware('permission:' . Permission::MANAGE_DOCTORS);
        });

    // ============================================
    // ADMINS MANAGEMENT (requires: manage_admins or manage_roles)
    // ============================================
    Route::prefix('admins')->middleware('permission:' . Permission::MANAGE_ADMINS . ',' . Permission::MANAGE_ROLES)
        ->controller(AdminManagementController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('roles', 'roles');
            Route::get('{id}', 'show');
            Route::post('/', 'store')->middleware('permission:' . Permission::MANAGE_ADMINS);
            Route::put('{id}', 'update')->middleware('permission:' . Permission::MANAGE_ADMINS);
            Route::put('{id}/toggle-status', 'toggleStatus')->middleware('permission:' . Permission::MANAGE_ADMINS);
            Route::delete('{id}', 'destroy')->middleware('permission:' . Permission::MANAGE_ADMINS);
        });

    // ============================================
    // JOIN REQUESTS — Doctor Applications (requires: manage_doctors or verify_doctors)
    // ============================================
    Route::prefix('join-requests')->middleware('permission:' . Permission::MANAGE_DOCTORS . ',' . Permission::VERIFY_DOCTORS)
        ->controller(JoinRequestController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('{id}', 'show');
            Route::put('{id}/status', 'updateStatus')->middleware('permission:' . Permission::MANAGE_DOCTORS . ',' . Permission::VERIFY_DOCTORS);
            Route::delete('{id}', 'destroy')->middleware('permission:' . Permission::MANAGE_DOCTORS);
        });

    // ============================================
    // CONSULTATIONS MANAGEMENT (requires: manage_consultations or view_consultations)
    // ============================================
    Route::prefix('consultations')->middleware('permission:' . Permission::VIEW_CONSULTATIONS)
        ->controller(ConsultationController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('stats', 'statistics');
            Route::get('{id}', 'show');
            Route::put('{id}/cancel', 'cancel')->middleware('permission:' . Permission::MANAGE_CONSULTATIONS);
        });

    // ============================================
    // CHAT MONITORING (requires: view_consultations)
    // ============================================
    Route::prefix('chat')
        ->middleware(['permission:' . Permission::VIEW_CONSULTATIONS, 'admin.audit'])
        ->controller(\App\Http\Controllers\Api\Admin\ChatMonitorController::class)->group(function () {
            Route::get('active',             'getAllActiveChats');
            Route::get('stats',              'getChatStats');
            Route::get('consultations/{id}', 'getConversation');
        });

    // ============================================
    // FINANCIALS MANAGEMENT (requires: manage_financials)
    // ============================================
    Route::prefix('financials')->middleware('permission:' . Permission::MANAGE_FINANCIALS)
        ->controller(FinancialController::class)->group(function () {
            Route::get('overview', 'overview');
            Route::get('transactions', 'transactions');
            Route::get('transactions/{id}', 'showTransaction');
            Route::post('transactions/{id}/refund', 'refund');

            Route::get('reports', 'reports');

            // Payout Routes (requires: process_payouts)
            Route::middleware('permission:' . Permission::PROCESS_PAYOUTS)->group(function () {
                Route::get('payouts', [App\Http\Controllers\Api\Admin\PayoutController::class, 'index']);
                Route::get('payouts/{id}', [App\Http\Controllers\Api\Admin\PayoutController::class, 'show']);
                Route::put('payouts/{id}/process', [App\Http\Controllers\Api\Admin\PayoutController::class, 'process']);
            });
        });

    // ============================================
    // ARTICLES MANAGEMENT (requires: manage_articles or review_articles)
    // ============================================
    Route::prefix('articles')->middleware('permission:' . Permission::MANAGE_ARTICLES . ',' . Permission::REVIEW_ARTICLES)
        ->controller(ArticleController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('{id}', 'show')->name('admin.articles.show');
            Route::match(['put', 'post'], '{id}/approve', 'approve');
            Route::put('{id}/reject', 'reject');
            Route::put('{id}/archive', 'archive')->middleware('permission:' . Permission::MANAGE_ARTICLES);
            Route::put('{id}/restore', 'restore')->middleware('permission:' . Permission::MANAGE_ARTICLES);
            Route::delete('{id}', 'destroy')->middleware('permission:' . Permission::MANAGE_ARTICLES);
        });

    // ============================================
    // CONTACT MESSAGES (requires: manage_messages)
    // ============================================
    Route::prefix('contact-messages')->middleware('permission:' . Permission::MANAGE_MESSAGES)
        ->controller(ContactMessageController::class)->group(function () {
            Route::get('/', 'index');
            Route::put('mark-all-read', 'markAllAsRead');
            Route::delete('bulk-delete', 'bulkDelete');
            Route::get('{id}', 'show');
            Route::put('{id}/mark-read', 'markAsRead');
            Route::put('{id}/mark-unread', 'markAsUnread');
            Route::delete('{id}', 'destroy');
        });

    // ============================================
    // NOTIFICATIONS — Admin Send/History (requires: send_notifications)
    // ============================================
    Route::prefix('notifications')->middleware('permission:' . Permission::SEND_NOTIFICATIONS)
        ->controller(NotificationAdminController::class)->group(function () {
            Route::post('send', 'send');
            Route::get('history', 'history');
            Route::get('scheduled', 'scheduled');
            Route::delete('scheduled/{id}', 'cancelScheduled');
        });

    // ============================================
    // NOTIFICATIONS — Admin Receiving (any authenticated admin)
    // ============================================
    Route::prefix('notifications')->controller(\App\Http\Controllers\Api\NotificationController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('{id}/read', 'markAsRead');
        Route::post('read-all', 'markAllAsRead');
        Route::delete('{id}', 'destroy');
        Route::get('unread-count', 'unreadCount');
        Route::get('settings', 'getSettings');
        Route::put('settings', 'updateSettings');
        Route::get('vapid-key', 'getVapidPublicKey');
        Route::post('subscribe', 'subscribe');
        Route::post('unsubscribe', 'unsubscribe');
    });

    // ============================================
    // ANALYTICS (requires: view_analytics)
    // ============================================
    Route::prefix('analytics')->middleware('permission:' . Permission::VIEW_ANALYTICS)
        ->controller(AnalyticsController::class)->group(function () {
            Route::get('overview', 'overview');
            Route::get('users', 'users');
            Route::get('consultations', 'consultations');
            Route::get('financials', 'financials');
            Route::get('articles', 'articles');
        });

    // ============================================
    // SETTINGS (requires: manage_settings)
    // ============================================
    Route::prefix('settings')->middleware('permission:' . Permission::MANAGE_SETTINGS)
        ->controller(SettingsController::class)->group(function () {
            Route::get('site', 'getSiteSettings');
            Route::put('site', 'updateSiteSettings');
            Route::get('roles', 'getRoles');
            Route::post('roles', 'createRole');
            Route::put('roles/{id}', 'updateRole');
            Route::delete('roles/{id}', 'deleteRole');
            Route::get('audit-logs', 'getAuditLogs');
            Route::get('system', 'getSystemSettings');
        });

    // ============================================
    // FAQS MANAGEMENT (requires: manage_faqs)
    // ============================================
    Route::prefix('faqs')->middleware('permission:' . Permission::MANAGE_FAQS)
        ->controller(\App\Http\Controllers\Api\Admin\FaqController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('reorder', 'reorder');
            Route::get('{id}', 'show');
            Route::put('{id}/toggle', 'toggle');
            Route::put('{id}', 'update');
            Route::delete('{id}', 'destroy');
        });

    // ============================================
    // ABOUT US MANAGEMENT (requires: manage_pages)
    // ============================================
    Route::prefix('about-us')->middleware('permission:' . Permission::MANAGE_PAGES)
        ->controller(\App\Http\Controllers\Api\Admin\AboutController::class)->group(function () {
            Route::get('/', 'show');
            Route::put('/', 'update');
        });

    // ============================================
    // SUCCESS STORIES MANAGEMENT (requires: manage_pages)
    // ============================================
    Route::prefix('success-stories')->middleware('permission:' . Permission::MANAGE_PAGES)
        ->controller(\App\Http\Controllers\Api\Admin\SuccessStoryController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('reorder', 'reorder');
            Route::get('{successStory}', 'show');
            Route::put('{successStory}/featured', 'toggleFeatured');
            Route::put('{successStory}/active', 'toggleActive');
            Route::put('{successStory}', 'update');
            Route::delete('{successStory}', 'destroy');
        });

    // ============================================
    // CHATBOT MANAGEMENT (requires: manage_chatbot)
    // ============================================
    Route::prefix('chatbot')->middleware('permission:' . Permission::MANAGE_CHATBOT)
        ->controller(\App\Http\Controllers\Api\Admin\AdminChatbotController::class)->group(function () {
            Route::get('stats', 'stats');
            Route::get('conversations', 'conversations');
            Route::get('conversations/{sessionId}', 'showConversation');
            Route::delete('conversations/{sessionId}', 'deleteConversation');
            Route::post('bots/{type}/toggle', 'toggleBot');
            Route::get('bots/{type}/admin-data', 'getBotAdminData');
            Route::post('cache/clear', 'clearCache');
        });

    // CHATBOT KNOWLEDGE BASE (RAG)
    Route::prefix('chatbot/documents')->middleware('permission:' . Permission::MANAGE_CHATBOT)
        ->controller(\App\Http\Controllers\Api\Admin\AdminChatbotDocumentController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::delete('/{id}', 'destroy');
        });

    // ============================================
    // AI CENTER ANALYTICS — تحليلات مركز الذكاء الاصطناعي
    // ============================================
    Route::prefix('ai-center')->middleware('permission:' . Permission::VIEW_ANALYTICS)
        ->controller(\App\Http\Controllers\Api\Admin\AdminAiAnalyticsController::class)->group(function () {
            Route::get('/analytics', 'dashboard');
            Route::get('/models-stats', 'allModelsStats');
            Route::get('/models/{model}/stats', 'modelStats');
            Route::get('/risk-distribution', 'riskDistribution');
        });

});
