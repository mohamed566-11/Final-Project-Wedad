<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Resources\Patient\PatientResource;
use App\Http\Controllers\Api\Patient\Auth\LoginController;
use App\Http\Controllers\Api\Patient\Auth\RegisterController;
use App\Http\Controllers\Api\Patient\Auth\VerifyEmailController;
use App\Http\Controllers\Api\Patient\Auth\Password\ResetPasswordController;
use App\Http\Controllers\Api\Patient\Auth\Password\ForgetPasswordController;
use App\Http\Controllers\Api\Patient\ProfileController;
use App\Http\Controllers\Api\Patient\MoodController;
use App\Http\Controllers\Api\Patient\WeightController;
use App\Http\Controllers\Api\Patient\PeriodController;
use App\Http\Controllers\Api\Patient\FertilityController;
use App\Http\Controllers\Api\Patient\TrackersSummaryController;
use App\Http\Controllers\Api\Patient\PregnancyController;
use App\Http\Controllers\Api\Patient\DoctorController;
use App\Http\Controllers\Api\Patient\ConsultationController;
use App\Http\Controllers\Api\Patient\PatientDashboardController;
use App\Http\Controllers\Api\ConsultationAttachmentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\Patient\PatientMedicalFileController;
use App\Http\Controllers\Api\Patient\PrescriptionController;
use App\Http\Controllers\Api\Patient\LabTestController;



//********************* IOT DEBUG ROUTES (Public) ********************************
Route::get('iot/debug', [\App\Http\Controllers\Api\Patient\IotController::class, 'debug']);

//********************* Auth Register Routes ********************************
Route::post('auth/register', [RegisterController::class, 'register'])->middleware('throttle:register');

//********************* Auth Login  & Logout  Routes ********************************
Route::controller(LoginController::class)->group(function () {
    Route::post('auth/login', 'login')->middleware('throttle:5,1');
    Route::post('auth/logout', 'logout')->middleware('auth:patient');
    // logout for all devices
    Route::post('auth/logout/all', 'logoutAllDevices')->middleware('auth:patient');
});


//********************* Auth VerivyEmail Routes ********************************
Route::controller(VerifyEmailController::class)->middleware('auth:patient')->group(function () {
    Route::post('auth/email/verify', 'verifyEmail');
    Route::get('auth/email/send-again', 'sendOtpAgain');
});


//********************* Auth ForgetPassword Routes ********************************
Route::controller(ForgetPasswordController::class)->middleware('throttle:3,1')->group(function () {
    Route::post('password/email', 'sendOtp');
});

//********************* Auth ResetPassword Routes ********************************
Route::controller(ResetPasswordController::class)->middleware('throttle:5,1')->group(function () {
    Route::post('password/reset', 'resetPassword');
});


////  public routes

// // System Settings
//     Route::get('settings', [SettingsController::class,'index']);
//     Route::post('contact-us', [ContactUsController::class,'store']);
//     Route::get('about-us', [AboutUsController::class,'index']);
//     Route::post('join-us', [JoinUsController::class,'store']);
//     Route::get('faqs', [FaqController::class,'index']);
Route::get('life-stages', [ProfileController::class, 'getLifeStages']);

// ============================================
// PUBLIC ARTICLES (No auth required)
// ============================================
Route::prefix('articles')->controller(\App\Http\Controllers\Api\ArticleController::class)->group(function () {
    Route::get('/', 'index');
    Route::get('/{slug}', 'show')->name('articles.show');
});

// Get doctor's published articles (public)
Route::get('doctors/{doctorId}/articles', [\App\Http\Controllers\Api\ArticleController::class, 'byDoctor']);

Route::middleware(['auth:patient', 'PatientStatus'])->get('/data', function (Request $request) {
    $user = $request->user();
    $user->load(['lifeStage', 'profile']);
    return new PatientResource($user);
});

Route::middleware(['auth:patient', 'PatientStatus', 'PatientEmailVerify'])->group(function () {

    // Dashboard Stats
    Route::get('dashboard/stats', [PatientDashboardController::class, 'stats']);

    // ============================================
    // PROFILE MANAGEMENT
    // ============================================
    Route::prefix('profile')->controller(ProfileController::class)->group(function () {
        Route::get('/', 'show');
        Route::put('/basic', 'updateBasicInfo');
        Route::put('/medical', 'updateMedicalInfo');
        Route::put('/emergency', 'updateEmergencyContact');
        Route::get('/stats', 'getStats');
        Route::put('/password', 'updatePassword');
        Route::delete('/image', 'deleteImage');
    });

    // Medical Files
    Route::prefix('profile/medical-files')->controller(PatientMedicalFileController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::delete('{id}', 'destroy');
        Route::get('{id}/download', 'download');
    });

    // ============================================
    // HEALTH TRACKERS
    // ============================================

    Route::get('trackers/summary', [TrackersSummaryController::class, 'summary']);

    // Mood Tracker
    Route::prefix('mood')->controller(MoodController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('analytics', 'analytics');
        Route::delete('{id}', 'destroy');
    });

    // Weight Tracker
    Route::prefix('weight')->controller(WeightController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('analytics', 'analytics'); // Optional
        Route::get('chart', 'chart');
        Route::delete('{id}', 'destroy');
    });

    // Period Tracker
    Route::prefix('period')->controller(PeriodController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store'); // Start
        Route::post('start', 'store'); // Alias
        Route::put('{id}/end', 'endCycle');
        Route::get('predictions', 'predictions');
        Route::get('analytics', 'analytics');
        Route::delete('{id}', 'destroy');
    });

    // Fertility Tracker
    Route::prefix('fertility')->controller(FertilityController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('fertile-window', 'fertileWindow');
        Route::delete('{id}', 'destroy');
        // Route::get('ovulation-prediction', 'ovulationPrediction');
    });

    // Pregnancy Tracker
    Route::prefix('pregnancy')->controller(PregnancyController::class)->group(function () {
        Route::post('start', 'start');
        Route::get('current', 'current');
        Route::put('{id}/complete', 'complete');
        Route::get('history', 'history');

        Route::post('entry', 'storeEntry');
        Route::get('entries', 'entries');
        Route::delete('entry/{id}', 'deleteEntry');
        Route::get('week/{number}', 'weekInfo');
        Route::get('weight-chart', 'weightChart');
        Route::get('stats', 'stats');
        Route::get('weeks-info', 'weeksInfo');

        // Files
        Route::post('files/upload', 'uploadFile');
        Route::get('files', 'getFiles');
        Route::delete('files/{id}', 'deleteFile');

        // Medications
        Route::get('medications', 'getMedications');
        Route::post('medications', 'addMedication');
        Route::post('medications/{id}/toggle', 'toggleMedicationTaken');
        Route::delete('medications/{id}', 'deleteMedication');

        // Kick Counter
        Route::get('kicks', 'getKickSessions');
        Route::post('kicks', 'storeKickSession');
        Route::delete('kicks/{id}', 'deleteKickSession');
    });

    // ============================================
    // IOT SMART BAND (Google Fit Wearables)
    // ============================================
    Route::prefix('iot')->controller(\App\Http\Controllers\Api\Patient\IotController::class)->group(function () {
        Route::get('auth-url', 'getAuthUrl');
        Route::post('connect', 'connect');
        Route::post('sync', 'sync');
        Route::delete('disconnect', 'disconnect');
        Route::get('metrics', 'metrics');
    });

    // ============================================
    // DOCTORS SEARCH & DISCOVERY
    // ============================================
    Route::prefix('doctors')->controller(DoctorController::class)->group(function () {
        Route::get('search', 'search');
        Route::get('recommended', 'recommended');
        Route::get('{id}', 'show');
        Route::get('{id}/available-slots', 'availableSlots');
        Route::get('{id}/reviews', 'reviews');
    });

    // ============================================
    // CONSULTATIONS
    // ============================================
    Route::prefix('consultations')->controller(ConsultationController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('book', 'book');
        Route::get('{id}', 'show');
        Route::post('{id}/pay', 'pay');
        Route::put('{id}/cancel', 'cancel');
        Route::put('{id}/reschedule', 'reschedule');
        Route::post('{id}/review', 'review');
        Route::get('{id}/meeting-info', 'getMeetingInfo');
    });

    // Consultation Attachments (Patient)
    Route::prefix('consultations/{id}/attachments')->controller(ConsultationAttachmentController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'upload');
        Route::delete('/{attachmentId}', 'destroy');
        Route::get('/{attachmentId}/download', 'download');
    });

    // ============================================
    // CONSULTATION CHAT (Patient)
    // ============================================
    // ✅ unread-count FIRST — prevents Laravel from treating 'chat' as {consultation}
    Route::get(
        'consultations/chat/unread-count',
        [\App\Http\Controllers\Api\Patient\ConsultationChatController::class, 'getUnreadCount']
    );

    Route::prefix('consultations/{consultation}/chat')
        ->controller(\App\Http\Controllers\Api\Patient\ConsultationChatController::class)->group(function () {
            Route::get('messages', 'getMessages')->middleware('throttle:chat_polling');
            Route::get('messages/new', 'getNewMessages')->middleware('throttle:chat_polling');
            Route::post('messages', 'sendMessage')->middleware('throttle:chat_message');
            Route::put('messages/read', 'markAsRead');
            Route::get('messages/{messageId}/download', 'downloadImage');
        });

    // Prescription by Consultation ID
    Route::get('consultations/{id}/prescription', [PrescriptionController::class, 'byConsultation']);

    // ============================================
    // PRESCRIPTIONS
    // ============================================
    Route::prefix('prescriptions')->controller(PrescriptionController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('{id}', 'show');
    });

    // ============================================
    // PAYMENTS
    // ============================================
    Route::prefix('payments')->controller(PaymentController::class)->group(function () {
        Route::get('/', 'patientPayments');
        Route::post('{id}/request-refund', 'requestRefund');
    });

    // ============================================
    // NOTIFICATIONS
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
    // AI CENTER — مركز الذكاء الاصطناعي
    // ============================================
    Route::prefix('ai-center')->controller(\App\Http\Controllers\Api\Patient\AiPredictionController::class)->group(function () {
        Route::get('/', 'hub');                                    // Hub page data
        Route::get('/{model}/prefill', 'getPreFillData');          // Auto-fill from profile
        Route::post('/gdm/predict', 'predictGDM');                 // GDM prediction
        Route::post('/preeclampsia/predict', 'predictPreeclampsia'); // PE prediction
        Route::post('/preterm/predict', 'predictPretermBirth');    // PTB prediction
        Route::post('/scbu/predict', 'predictSCBU');               // SCBU prediction
        Route::get('/history', 'getHistory');                      // Predictions timeline
        Route::get('/predictions/{id}', 'getPredictionDetail');    // Single prediction detail
    });


    // ============================================
    // LAB TEST OCR — التحاليل الطبية بالصور
    // ============================================
    Route::prefix('lab-tests')
        ->controller(LabTestController::class)
        ->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'upload')->middleware('throttle:10,60');
            // ✅ يجب أن يكون قبل /{id} لمنع التعارض
            Route::get('/latest-for-model/{model}', 'latestForModel');
            Route::get('/{id}', 'show');
            Route::get('/{id}/status', 'checkStatus');
            Route::delete('/{id}', 'destroy');
        });

});

// ============================================
// CHATBOT — auth:patient only (no email-verify required)
// حتى يعمل للمستخدمين قبل تأكيد البريد الإلكتروني
// ============================================
Route::middleware(['auth:patient', 'PatientStatus'])->group(function () {
    Route::prefix('chatbot')->controller(\App\Http\Controllers\Api\Patient\ChatbotController::class)->group(function () {
        Route::post('/widget-message', 'sendWidgetMessage')->middleware('throttle:chatbot_auth');
        Route::post('/message', 'sendMessage')->middleware('throttle:chatbot_auth');
        Route::get('/config', 'getConfig');
        Route::get('/sessions', 'getSessions');
        Route::patch('/sessions/{sessionId}/rename', 'renameSession');
        Route::delete('/sessions/{sessionId}', 'deleteSession');
        Route::get('/sessions/{sessionId}/messages', 'getMessages');
        Route::post('/sessions/{sessionId}/reset', 'resetSession');
        Route::get('/messages/{messageId}/status', 'messageStatus');
        Route::delete('/messages', 'deleteAllMessages');

        // === Patient Data Preferences ===
        Route::get('/data-preferences', 'getDataPreferences');
        Route::put('/data-preferences', 'updateDataPreferences');
    });
});

// ============================================
// PAYMENT WEBHOOKS (No Auth Required)
// ============================================
Route::prefix('payments')->controller(PaymentController::class)->group(function () {
    Route::post('paymob/callback', 'paymobCallback');
    Route::get('paymob/redirect', 'paymobRedirect');
});




