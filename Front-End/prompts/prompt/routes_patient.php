// ============================================================
// ملف: routes/patient.php (أضف هذه الـ Routes)
// الموقع: widad-backend/routes/patient.php
// الوصف: Routes الإشعارات للـ API
// ============================================================

// أضد هذه الـ Routes داخل middleware('auth') الموجود:

Route::middleware(['auth:sanctum'])->group(function () {

    // ─── الـ VAPID Key ───────────────────────────
    Route::get('notifications/vapid-key', [NotificationController::class, 'getVapidKey']);

    // ─── الـ Push Subscriptions ──────────────────
    Route::post('notifications/subscribe',   [NotificationController::class, 'subscribe']);
    Route::post('notifications/unsubscribe', [NotificationController::class, 'unsubscribe']);

});
