<?php

/**
 * ============================================================
 *  Notification Simulation Script
 * ============================================================
 *  يقوم هذا الملف بإنشاء إشعارات تجريبية لأول مريض في قاعدة البيانات
 *  لاختبار عرضها في داشبورد المريض (NotificationBell + NotificationsListPage)
 *
 *  التشغيل:
 *    php simulation_notifications.php
 *
 *  بعد التشغيل:   سجّل دخول كمريض   → ستجد الإشعارات في الجرس 🔔
 * ============================================================
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Services\NotificationService;
use Illuminate\Support\Str;
use Carbon\Carbon;

// ─── Helper: Print colored output ────────────────────────────────
function printHeader(string $text): void
{
    echo "\n\n" . str_repeat('═', 60) . "\n";
    echo "  {$text}\n";
    echo str_repeat('═', 60) . "\n";
}

function printStep(int|string $step, string $text): void
{
    echo "\n[{$step}] {$text}\n";
}

function printSuccess(string $text): void
{
    echo "    ✅ {$text}\n";
}

function printInfo(string $text): void
{
    echo "    ℹ️  {$text}\n";
}

function printError(string $text): void
{
    echo "    ❌ {$text}\n";
}

// ═════════════════════════════════════════════════════════════════
//  START
// ═════════════════════════════════════════════════════════════════
try {
    printHeader('NOTIFICATION SIMULATION - اختبار الإشعارات');

    // ─────────────────────────────────────────
    // 1. Find Patient & Doctor
    // ─────────────────────────────────────────
    printStep(1, 'البحث عن المريض والطبيب...');

    $patient = User::first();
    if (!$patient) {
        throw new Exception('لا يوجد مرضى في قاعدة البيانات. سجّل مريض أولاً.');
    }
    printSuccess("المريض: {$patient->name} (ID: {$patient->id}, Email: {$patient->email})");

    $doctor = Doctor::first();
    if (!$doctor) {
        throw new Exception('لا يوجد أطباء في قاعدة البيانات.');
    }
    printSuccess("الطبيب: د. {$doctor->name} (ID: {$doctor->id})");

    // ─────────────────────────────────────────
    // 2. Find or create a dummy consultation for reference
    // ─────────────────────────────────────────
    printStep(2, 'تجهيز استشارة مرجعية...');

    $consultation = Consultation::where('user_id', $patient->id)->first();

    if (!$consultation) {
        // Create a dummy consultation
        $consultation = Consultation::create([
            'user_id'    => $patient->id,
            'doctor_id'  => $doctor->id,
            'date'       => Carbon::now()->addDays(2)->format('Y-m-d'),
            'time'       => '14:00',
            'type'       => 'video',
            'status'     => 'confirmed',
            'price'      => 150,
            'payment_method' => 'cash',
            'patient_notes'  => 'استشارة تجريبية للاختبار',
        ]);
        printInfo("تم إنشاء استشارة تجريبية (ID: {$consultation->id})");
    } else {
        printSuccess("استشارة موجودة (ID: {$consultation->id})");
    }

    // ─────────────────────────────────────────
    // 3. Clear old test notifications (optional)
    // ─────────────────────────────────────────
    printStep(3, 'مسح الإشعارات التجريبية السابقة...');

    $deletedCount = $patient->notifications()
        ->where('data->title', 'LIKE', '%تجريبي%')
        ->orWhere('data->title', 'LIKE', '%اختبار%')
        ->where('notifiable_id', $patient->id)
        ->where('notifiable_type', get_class($patient))
        ->delete();

    printInfo("تم مسح {$deletedCount} إشعارات سابقة");

    // ─────────────────────────────────────────
    // 4. Create notifications using NotificationService
    //    (same method used by the real system)
    // ─────────────────────────────────────────
    printStep(4, 'إنشاء الإشعارات التجريبية...');

    $notificationService = app(NotificationService::class);
    $created = 0;

    // ──── 4.1: إشعار تأكيد استشارة ────
    $n = $notificationService->create(
        $patient,
        'consultation.accepted',
        'تم تأكيد استشارتك ✅',
        "تم قبول استشارتك مع د. {$doctor->name} يوم " . Carbon::parse($consultation->date)->format('d/m') . " الساعة {$consultation->time}",
        [
            'consultation_id' => $consultation->id,
            'doctor_name'     => $doctor->name,
            'date'            => $consultation->date,
            'time'            => $consultation->time,
            'url'             => "/patient/consultations/{$consultation->id}",
        ],
        false // Don't send email for simulation
    );
    if ($n) { $created++; printSuccess("إشعار تأكيد الاستشارة"); }

    // ──── 4.2: إشعار تذكير بالاستشارة ────
    $n = $notificationService->create(
        $patient,
        'consultation.reminder',
        'تذكير: موعدك بعد ساعة ⏰',
        "تذكير: لديك استشارة مع د. {$doctor->name} بعد ساعة واحدة. جهّزي نفسك!",
        [
            'consultation_id' => $consultation->id,
            'doctor_name'     => $doctor->name,
            'date'            => Carbon::now()->format('Y-m-d'),
            'time'            => Carbon::now()->addHour()->format('H:i'),
            'url'             => "/patient/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار تذكير بالاستشارة"); }

    // ──── 4.3: إشعار دفع ناجح ────
    $n = $notificationService->create(
        $patient,
        'payment.success',
        'تم الدفع بنجاح 💳',
        "تم تأكيد دفع 150 ريال لاستشارتك مع د. {$doctor->name}",
        [
            'consultation_id' => $consultation->id,
            'doctor_name'     => $doctor->name,
            'amount'          => 150,
            'url'             => "/patient/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار دفع ناجح"); }

    // ──── 4.4: إشعار استشارة مكتملة ────
    $n = $notificationService->create(
        $patient,
        'consultation.completed',
        'تمت الاستشارة بنجاح 🎉',
        "تمت استشارتك مع د. {$doctor->name} بنجاح. يمكنك الآن تقييم الطبيب.",
        [
            'consultation_id' => $consultation->id,
            'doctor_name'     => $doctor->name,
            'url'             => "/patient/consultations/{$consultation->id}/review",
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار استشارة مكتملة"); }

    // ──── 4.5: إشعار إلغاء استشارة ────
    $n = $notificationService->create(
        $patient,
        'consultation.cancelled',
        'تم إلغاء الاستشارة ❌',
        "تم إلغاء استشارتك مع د. {$doctor->name}. سيتم استرجاع المبلغ خلال 3-5 أيام عمل.",
        [
            'consultation_id' => $consultation->id,
            'doctor_name'     => $doctor->name,
            'reason'          => 'الطبيب غير متاح في هذا الموعد',
            'refund_amount'   => 150,
            'url'             => "/patient/consultations",
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار إلغاء استشارة"); }

    // ──── 4.6: إشعار مقال جديد ────
    $n = $notificationService->create(
        $patient,
        'article.new',
        'مقال جديد يهمّك 📚',
        "د. {$doctor->name} نشر مقالاً جديداً: \"كيف تعتنين بصحتك خلال فترة الحمل\"",
        [
            'article_id'    => 1,
            'article_title' => 'كيف تعتنين بصحتك خلال فترة الحمل',
            'doctor_name'   => $doctor->name,
            'url'           => '/articles/pregnancy-health-tips',
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار مقال جديد"); }

    // ──── 4.7: إشعار ترحيبي ────
    $n = $notificationService->create(
        $patient,
        'system.welcome',
        'أهلاً بك في وداد! 🌸',
        'مرحباً بك في منصة وداد الصحية. استكشفي خدماتنا واحجزي استشارتك الأولى.',
        [
            'url' => '/patient/dashboard',
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار ترحيبي"); }

    // ──── 4.8: إشعار تحديث النظام ────
    $n = $notificationService->create(
        $patient,
        'system.update',
        'تحديث جديد في المنصة 🚀',
        'تم إضافة ميزة المتابعة الصحية الجديدة! يمكنك الآن تتبع وزنك وحالتك المزاجية.',
        [
            'url' => '/trackers',
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار تحديث النظام"); }

    // ──── 4.9: إشعار عدم حضور ────
    $n = $notificationService->create(
        $patient,
        'consultation.no_show',
        'لم يتم الحضور ⚠️',
        "للأسف لم نتمكن من تأكيد حضورك لاستشارتك مع د. {$doctor->name}. يرجى التواصل مع الدعم.",
        [
            'consultation_id' => $consultation->id,
            'doctor_name'     => $doctor->name,
            'url'             => "/patient/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار عدم حضور"); }

    // ──── 4.10: إشعار عام ────
    $n = $notificationService->create(
        $patient,
        'announcement',
        'إعلان هام 📢',
        'ستكون منصة وداد في صيانة مجدولة يوم الجمعة من الساعة 2-4 صباحاً. نعتذر عن أي إزعاج.',
        [
            'url' => '/patient/dashboard',
        ],
        false
    );
    if ($n) { $created++; printSuccess("إشعار إعلان عام"); }

    // ═════════════════════════════════════════════════════════════
    //  DOCTOR NOTIFICATIONS — إشعارات الطبيب
    // ═════════════════════════════════════════════════════════════
    printStep('4B', 'إنشاء إشعارات تجريبية للطبيب...');
    $doctorCreated = 0;

    // ──── D1: استشارة جديدة (حجز مريض) ────
    $n = $notificationService->create(
        $doctor,
        'consultation.booked',
        'استشارة جديدة 📋',
        "لديك استشارة جديدة مع {$patient->name} يوم " . Carbon::parse($consultation->date)->format('d/m') . " الساعة {$consultation->time}",
        [
            'consultation_id' => $consultation->id,
            'patient_name'    => $patient->name,
            'date'            => $consultation->date,
            'time'            => $consultation->time,
            'url'             => "/doctor/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار استشارة جديدة (للطبيب)"); }

    // ──── D2: حجز مدفوع جديد ────
    $n = $notificationService->create(
        $doctor,
        'consultation.new_booking',
        'حجز جديد مدفوع 💰',
        "تم حجز استشارة جديدة مؤكدة الدفع مع {$patient->name}",
        [
            'consultation_id' => $consultation->id,
            'patient_name'    => $patient->name,
            'date'            => $consultation->date,
            'time'            => $consultation->time,
            'url'             => "/doctor/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار حجز مدفوع (للطبيب)"); }

    // ──── D3: تذكير بالاستشارة ────
    $n = $notificationService->create(
        $doctor,
        'consultation.reminder',
        'تذكير: استشارة بعد ساعة ⏰',
        "لديك استشارة مع {$patient->name} بعد ساعة واحدة. جهّز نفسك!",
        [
            'consultation_id' => $consultation->id,
            'patient_name'    => $patient->name,
            'date'            => Carbon::now()->format('Y-m-d'),
            'time'            => Carbon::now()->addHour()->format('H:i'),
            'url'             => "/doctor/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار تذكير (للطبيب)"); }

    // ──── D4: تم نشر مقالك ────
    $n = $notificationService->create(
        $doctor,
        'article.approved',
        'تم نشر مقالك ✅',
        'تم الموافقة على مقالك: "كيف تعتنين بصحتك خلال فترة الحمل" ويمكن للمرضى قراءته الآن.',
        [
            'article_id'    => 1,
            'article_title' => 'كيف تعتنين بصحتك خلال فترة الحمل',
            'url'           => '/articles/pregnancy-health-tips',
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار نشر مقال (للطبيب)"); }

    // ──── D5: تم رفض مقالك ────
    $n = $notificationService->create(
        $doctor,
        'article.rejected',
        'تم رفض مقالك ❌',
        'تم رفض مقالك "نصائح غذائية". السبب: يرجى إضافة مراجع علمية موثوقة.',
        [
            'article_id'       => 2,
            'article_title'    => 'نصائح غذائية',
            'rejection_reason' => 'يرجى إضافة مراجع علمية موثوقة',
            'url'              => '/doctor/articles',
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار رفض مقال (للطبيب)"); }

    // ──── D6: تم تفعيل حسابك ────
    $n = $notificationService->create(
        $doctor,
        'doctor.verified',
        'تم تفعيل حسابك 🎉',
        'مبروك! تم التحقق من حسابك كطبيب على منصة وداد. يمكنك الآن استقبال الاستشارات.',
        [
            'url' => '/doctor/dashboard',
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار تفعيل الحساب (للطبيب)"); }

    // ──── D7: عدم حضور المريض ────
    $n = $notificationService->create(
        $doctor,
        'consultation.no_show',
        'عدم حضور المريض ⚠️',
        "لم يحضر المريض {$patient->name} للاستشارة المحددة. تم تسجيل ذلك تلقائياً.",
        [
            'consultation_id' => $consultation->id,
            'patient_name'    => $patient->name,
            'url'             => "/doctor/consultations/{$consultation->id}",
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار عدم حضور (للطبيب)"); }

    // ──── D8: إلغاء استشارة من الإدارة ────
    $n = $notificationService->create(
        $doctor,
        'consultation.cancelled_by_admin',
        'تم إلغاء استشارة من الإدارة 🚫',
        "تم إلغاء الاستشارة مع {$patient->name} من قبل الإدارة. السبب: تعارض في المواعيد.",
        [
            'consultation_id' => $consultation->id,
            'patient_name'    => $patient->name,
            'reason'          => 'تعارض في المواعيد',
            'url'             => '/doctor/consultations',
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار إلغاء من الإدارة (للطبيب)"); }

    // ──── D9: تم صرف أرباحك ────
    $n = $notificationService->create(
        $doctor,
        'financial.payout',
        'تم تحويل أرباحك 🏦',
        'تم تحويل مبلغ 500 ريال إلى حسابك البنكي بنجاح.',
        [
            'amount' => 500,
            'method' => 'bank_transfer',
            'url'    => '/doctor/financials',
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار صرف أرباح (للطبيب)"); }

    // ──── D10: إعلان عام ────
    $n = $notificationService->create(
        $doctor,
        'announcement',
        'إعلان هام للأطباء 📢',
        'تم تحديث سياسة الاستشارات. يرجى مراجعة الشروط الجديدة في إعدادات حسابك.',
        [
            'url' => '/doctor/settings',
        ],
        false
    );
    if ($n) { $doctorCreated++; printSuccess("إشعار إعلان عام (للطبيب)"); }

    $created += $doctorCreated;

    // ─────────────────────────────────────────
    // 5. Also create via Laravel's built-in Notification system
    //    (to test the class-based notifications too)
    // ─────────────────────────────────────────
    printStep(5, 'إنشاء إشعارات عبر Laravel Notification Classes...');

    // ── Patient class-based notifications ──
    try {
        $patient->notify(new \App\Notifications\ConsultationConfirmedNotification($consultation));
        $created++;
        printSuccess("ConsultationConfirmedNotification → المريض");
    } catch (\Exception $e) {
        printInfo("تخطّي ConsultationConfirmed (مريض): " . Str::limit($e->getMessage(), 80));
    }

    try {
        $patient->notify(new \App\Notifications\ConsultationReminderNotification($consultation, '1_hour'));
        $created++;
        printSuccess("ConsultationReminderNotification → المريض");
    } catch (\Exception $e) {
        printInfo("تخطّي ConsultationReminder (مريض): " . Str::limit($e->getMessage(), 80));
    }

    try {
        $patient->notify(new \App\Notifications\ConsultationCompletedNotification($consultation));
        $created++;
        printSuccess("ConsultationCompletedNotification → المريض");
    } catch (\Exception $e) {
        printInfo("تخطّي ConsultationCompleted (مريض): " . Str::limit($e->getMessage(), 80));
    }

    // ── Doctor class-based notifications ──
    try {
        $doctor->notify(new \App\Notifications\NewConsultationNotification($consultation));
        $created++;
        printSuccess("NewConsultationNotification → الطبيب");
    } catch (\Exception $e) {
        printInfo("تخطّي NewConsultation (طبيب): " . Str::limit($e->getMessage(), 80));
    }

    try {
        $doctor->notify(new \App\Notifications\ConsultationReminderNotification($consultation, '15_minutes'));
        $created++;
        printSuccess("ConsultationReminderNotification → الطبيب");
    } catch (\Exception $e) {
        printInfo("تخطّي ConsultationReminder (طبيب): " . Str::limit($e->getMessage(), 80));
    }

    // ─────────────────────────────────────────
    // 6. Verify & Summary
    // ─────────────────────────────────────────
    printStep(6, 'التحقق النهائي...');

    // ── Patient Stats ──
    $patient->refresh();
    $patientTotal = $patient->notifications()->count();
    $patientUnread = $patient->unreadNotifications()->count();
    $patientLatest = $patient->notifications()
        ->latest()
        ->take(5)
        ->get(['id', 'type', 'data', 'read_at', 'created_at']);

    // ── Doctor Stats ──
    $doctor->refresh();
    $doctorTotal = $doctor->notifications()->count();
    $doctorUnread = $doctor->unreadNotifications()->count();
    $doctorLatest = $doctor->notifications()
        ->latest()
        ->take(5)
        ->get(['id', 'type', 'data', 'read_at', 'created_at']);

    printHeader('النتائج');
    echo "  إجمالي الإشعارات التي تم إنشاؤها : {$created}\n";
    echo str_repeat('─', 60) . "\n";

    // ── Patient Summary ──
    echo "\n  👩 المريضة: {$patient->name}\n";
    echo "  إجمالي الإشعارات    : {$patientTotal}\n";
    echo "  غير المقروءة        : {$patientUnread}\n";
    echo str_repeat('─', 60) . "\n";
    echo "  آخر 5 إشعارات للمريض:\n";

    foreach ($patientLatest as $i => $notif) {
        $data = $notif->data;
        $title = $data['title'] ?? $data['message'] ?? 'بدون عنوان';
        $type = str_replace('.', '_', $notif->type);
        if (str_contains($type, '\\')) {
            $type = Str::snake(str_replace('Notification', '', class_basename($type)));
        }
        $readStatus = $notif->read_at ? '📖 مقروء' : '🔵 جديد';
        echo "  " . ($i + 1) . ". [{$readStatus}] [{$type}] {$title}\n";
    }

    echo str_repeat('─', 60) . "\n";

    // ── Doctor Summary ──
    echo "\n  🩺 الطبيب: د. {$doctor->name}\n";
    echo "  إجمالي الإشعارات    : {$doctorTotal}\n";
    echo "  غير المقروءة        : {$doctorUnread}\n";
    echo str_repeat('─', 60) . "\n";
    echo "  آخر 5 إشعارات للطبيب:\n";

    foreach ($doctorLatest as $i => $notif) {
        $data = $notif->data;
        $title = $data['title'] ?? $data['message'] ?? 'بدون عنوان';
        $type = str_replace('.', '_', $notif->type);
        if (str_contains($type, '\\')) {
            $type = Str::snake(str_replace('Notification', '', class_basename($type)));
        }
        $readStatus = $notif->read_at ? '📖 مقروء' : '🔵 جديد';
        echo "  " . ($i + 1) . ". [{$readStatus}] [{$type}] {$title}\n";
    }

    echo str_repeat('═', 60) . "\n";
    echo "\n  ✅ تم بنجاح!\n";
    echo "\n  👩 المريضة:\n";
    echo "     البريد: {$patient->email}\n";
    echo "     الرابط: http://localhost:5173/patient/dashboard\n";
    echo "\n  🩺 الطبيب:\n";
    echo "     البريد: {$doctor->email}\n";
    echo "     الرابط: http://localhost:5173/doctor/dashboard\n";
    echo "\n  📌 اضغط على أيقونة الجرس 🔔 في الهيدر لكلا الحسابين\n\n";

    // ─────────────────────────────────────────
    // 7. Test the API endpoint output (optional)
    // ─────────────────────────────────────────
    printStep(7, 'اختبار تنسيق API المتوقع...');

    $sampleNotification = $patient->notifications()->latest()->first();
    if ($sampleNotification) {
        $data = $sampleNotification->data;
        $type = $data['type'] ?? $sampleNotification->type;
        if (str_contains($type, '\\')) {
            $type = Str::snake(str_replace('Notification', '', class_basename($type)));
        }
        $type = str_replace('.', '_', $type);

        $apiFormat = [
            'id'         => $sampleNotification->id,
            'type'       => $type,
            'title'      => $data['title'] ?? '',
            'body'       => $data['message'] ?? $data['body'] ?? '',
            'data'       => $data,
            'read_at'    => $sampleNotification->read_at?->toISOString(),
            'created_at' => $sampleNotification->created_at->toISOString(),
        ];

        echo "  تنسيق الـ API المتوقع (نموذج):\n";
        echo "  " . json_encode($apiFormat, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n\n";
    }

} catch (\Exception $e) {
    echo "\n\n";
    printError("فشل الاختبار: " . $e->getMessage());
    echo "    File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "    Trace:\n" . Str::limit($e->getTraceAsString(), 500) . "\n\n";
}
