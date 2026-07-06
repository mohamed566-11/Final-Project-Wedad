<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\LandingPageController;

// prefix => api/v1

//********************* Landing Page Routes ********************************
Route::controller(LandingPageController::class)->prefix('landing-page')->group(function () {
    Route::get('/', 'index');
    Route::get('/stats', 'stats');
    Route::get('/faqs', 'faqs');
    Route::get('/life-stages/{slug}', 'lifeStageDetails');
    Route::get('/doctors', 'allDoctors');
    Route::get('/doctors/{id}', 'doctorProfile');
    Route::get('/success-stories', 'successStories');
});

//********************* Public Static Pages Routes ********************************
Route::controller(PublicController::class)->group(function () {
    // About Us
    Route::get('about-us', 'getAboutUs');

    // Contact
    Route::post('contact-us', 'submitContact')->middleware('throttle:3,1');
    Route::get('contact-info', 'getContactInfo');

    // Join as Doctor
    Route::post('join-us', 'submitJoinRequest')->middleware('throttle:3,1');

    // Site Settings
    Route::get('settings', 'getSiteSettings');

    // Terms & Privacy
    Route::get('terms', 'getTerms');
    Route::get('privacy', 'getPrivacy');

    // Life Stages
    Route::get('life-stages', 'getLifeStages');
    Route::get('life-stages/{slug}', 'getLifeStage');
});

//********************* Global Search Route ********************************
Route::get('search', [\App\Http\Controllers\Api\SearchController::class, 'globalSearch']);

//********************* Chatbot Public Routes ********************************
Route::prefix('chatbot')->controller(\App\Http\Controllers\Api\Patient\ChatbotController::class)->group(function () {
    Route::post('public/message', 'sendPublicMessage')->middleware('throttle:chatbot_public');
    Route::middleware('throttle:guest-chatbot-status')
        ->get('guest/message/{messageId}/status', 'guestMessageStatus');
});

//********************* Public Doctor Reviews (no auth required) **********************
// Allows visitors on the public doctor profile page to see reviews without logging in
Route::get(
    'doctors/{id}/reviews',
    [\App\Http\Controllers\Api\Patient\DoctorController::class, 'reviews']
);
