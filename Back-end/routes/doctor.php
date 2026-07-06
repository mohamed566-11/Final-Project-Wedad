<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Resources\Doctor\DoctorResource;
use App\Http\Controllers\Api\Doctor\Auth\LoginController;
use App\Http\Controllers\Api\Doctor\Auth\RegisterController;
use App\Http\Controllers\Api\Doctor\Auth\Password\ForgetPasswordController;
use App\Http\Controllers\Api\Doctor\Auth\Password\ResetPasswordController;
use App\Http\Controllers\Api\Doctor\ConsultationController;
use App\Http\Controllers\Api\Doctor\DoctorReviewController;
use App\Http\Controllers\Api\ConsultationAttachmentController;


// preifix => api/v1/doctor
//********************* Auth Register Routes ********************************
Route::post('auth/register', [RegisterController::class, 'register'])->middleware('throttle:register');

//********************* Auth Login  & Logout  Routes ********************************
Route::controller(LoginController::class)->group(function () {
    Route::post('auth/login', 'login')->middleware('throttle:5,1');
    Route::post('auth/logout', 'logout')->middleware('auth:doctor');
    // logout for all devices
    Route::post('auth/logout/all', 'logoutAllDevices')->middleware('auth:doctor');
});


//********************* Auth ForgetPassword Routes ********************************
Route::controller(ForgetPasswordController::class)->middleware('throttle:3,1')->group(function () {
    Route::post('password/email', 'sendOtp');
});

//********************* Auth ResetPassword Routes ********************************
Route::controller(ResetPasswordController::class)->middleware('throttle:5,1')->group(function () {
    Route::post('password/reset', 'resetPassword');
});


Route::middleware(['auth:doctor', 'DoctorStatus'])->group(function () {

    // ============================================
    // ACCESSIBLE WITHOUT VERIFICATION
    // (Doctor can view profile/data & notifications while pending)
    // ============================================

    // Route get auth doctor
    Route::get('data', function (Request $request) {
        $user = $request->user();
        return new DoctorResource($user);
    });

    // Profile viewing (update requires verification below)
    Route::get('profile', [App\Http\Controllers\Api\Doctor\DoctorProfileController::class, 'show']);

    // NOTIFICATIONS (accessible even while pending)
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
    // VERIFIED DOCTOR ROUTES ONLY
    // (Requires doctor to be verified to access professional features)
    // ============================================
    Route::middleware(['DoctorVerified'])->group(function () {

        // ============================================
        // DASHBOARD & ANALYTICS
        // ============================================
        Route::controller(App\Http\Controllers\Api\Doctor\DoctorDashboardController::class)->prefix('dashboard')->group(function () {
            Route::get('stats', 'stats');
            Route::get('chart-data', 'chartData');
        });

        // ============================================
        // PROFILE MANAGEMENT (update/availability)
        // ============================================
        Route::controller(App\Http\Controllers\Api\Doctor\DoctorProfileController::class)->prefix('profile')->group(function () {
            Route::put('/', 'update');
            Route::put('availability', 'updateAvailability');
            Route::put('change-password', 'changePassword');
        });

        // ============================================
        // WORKING HOURS
        // ============================================
        Route::get('working-hours', [ConsultationController::class, 'getWorkingHours']);
        Route::put('working-hours', [ConsultationController::class, 'updateWorkingHours']);

        // ============================================
        // CONSULTATIONS
        // ============================================
        Route::prefix('consultations')->controller(ConsultationController::class)->group(function () {
            Route::get('calendar', 'calendar');
            Route::get('/', 'index');
            Route::get('{id}', 'show');
            Route::put('{id}/confirm', 'confirm');
            Route::put('{id}/start', 'start');
            Route::put('{id}/update-notes', 'updateNotes');
            Route::put('{id}/complete', 'complete');
            Route::put('{id}/cancel', 'cancel');
            Route::get('{id}/patient-history', 'patientHistory');
            Route::get('{id}/meeting-info', 'getMeetingInfo');
        });

        // Consultation Attachments (Doctor)
        Route::prefix('consultations/{id}/attachments')->controller(ConsultationAttachmentController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'upload');
            Route::delete('/{attachmentId}', 'destroy');
            Route::get('/{attachmentId}/download', 'download');
        });

        // ============================================
        // CONSULTATION CHAT (Doctor)
        // ============================================
        // ✅ unread-count FIRST — prevents route conflict with {consultation}
        Route::get('consultations/chat/unread-count',
            [\App\Http\Controllers\Api\Doctor\ConsultationChatController::class, 'getUnreadCount']);

        Route::prefix('consultations/{consultation}/chat')
            ->controller(\App\Http\Controllers\Api\Doctor\ConsultationChatController::class)->group(function () {
                Route::get('messages',      'getMessages')->middleware('throttle:chat_polling');
                Route::get('messages/new',  'getNewMessages')->middleware('throttle:chat_polling');
                Route::post('messages',     'sendMessage')->middleware('throttle:chat_message');
                Route::put('messages/read', 'markAsRead');
                Route::get('messages/{messageId}/download', 'downloadImage');
            });

        // ============================================
        // PATIENTS
        // ============================================
        Route::controller(App\Http\Controllers\Api\Doctor\DoctorPatientController::class)->prefix('patients')->group(function () {
            Route::get('/', 'index');
            Route::get('{id}', 'show');
            Route::get('{id}/notes', 'getNotes');
            Route::post('{id}/notes', 'addNote');
            Route::delete('{id}/notes/{noteId}', 'deleteNote');
            Route::get('{id}/medical-files/{fileId}/download', 'downloadMedicalFile');
        });

        // ============================================
        // GOOGLE OAUTH
        // ============================================
        Route::prefix('google')->controller(\App\Http\Controllers\Api\Doctor\GoogleAuthController::class)->group(function () {
            Route::get('auth-url', 'getAuthUrl');
            Route::post('callback', 'handleCallback');
            Route::get('check', 'checkConnection');
            Route::post('disconnect', 'disconnect');
        });

        // ============================================
        // ARTICLES
        // ============================================
        Route::prefix('articles')->controller(\App\Http\Controllers\Api\Doctor\ArticleController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show')->name('doctor.articles.show');
            Route::put('{id}', 'update');
            Route::put('{id}/submit', 'submit');
            Route::delete('{id}', 'destroy');
        });

        // ============================================
        // FINANCIALS
        // ============================================
        Route::controller(App\Http\Controllers\Api\Doctor\DoctorFinancialController::class)->prefix('financials')->group(function () {
            Route::get('stats', 'index');
            Route::get('transactions', 'transactions');
            Route::get('payouts', 'payouts');
            Route::post('request-payout', 'requestPayout');
        });

        // ============================================
        // SEARCH
        // ============================================
        Route::get('search', [\App\Http\Controllers\Api\SearchController::class, 'doctorSearch']);

        // ============================================
        // REVIEWS
        // ============================================
        Route::get('reviews', [DoctorReviewController::class, 'index']);
        Route::patch('reviews/{id}/toggle', [DoctorReviewController::class, 'toggle']);
        Route::delete('reviews/{id}', [DoctorReviewController::class, 'destroy']);

        // ============================================
        // PRESCRIPTIONS
        // ============================================
        Route::prefix('prescriptions')->controller(\App\Http\Controllers\Api\Doctor\PrescriptionController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('{id}', 'show');
        });

        // ============================================
        // AI CENTER — مركز الذكاء الاصطناعي
        // ============================================
        Route::prefix('ai-center')->controller(\App\Http\Controllers\Api\Doctor\DoctorAiPredictionController::class)->group(function () {
            Route::get('/stats', 'predictionStats');
            Route::get('/predictions', 'index');
            Route::get('/predictions/{id}', 'show');
            Route::get('/patients/{id}/predictions', 'patientPredictions');
            Route::post('/predictions/{id}/comment', 'addComment');
        });

    }); // End DoctorVerified middleware group

});
