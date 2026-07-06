<?php

namespace Tests\Feature\Notifications;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;
use App\Models\Consultation;
use App\Models\Article;
use App\Services\NotificationService;
use App\Mail\NotificationMail;

/**
 * Tests for NotificationService — the core engine that powers all notifications.
 * Covers every public method and verifies both DB persistence & email dispatch.
 */
class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
        $this->service = app(NotificationService::class);
        Mail::fake();
    }

    // ------------------------------------------------------------------
    //  Helpers
    // ------------------------------------------------------------------

    private function makePatient(): User
    {
        return User::factory()->create(['email' => 'patient@test.com', 'is_active' => true]);
    }

    private function makeDoctor(): Doctor
    {
        return Doctor::factory()->create(['email' => 'doctor@test.com', 'is_active' => true]);
    }

    private function makeAdmin(): Admin
    {
        $role = \App\Models\Role::firstOrCreate(
            ['role' => 'admin'],
            ['permissions' => [], 'description' => 'Test admin']
        );

        return Admin::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'is_active' => true,
            'role_id' => $role->id,
        ]);
    }

    private function makeConsultation(User $patient, Doctor $doctor): Consultation
    {
        return Consultation::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'date' => now()->addDays(3)->toDateString(),
            'time' => '10:00',
            'status' => 'confirmed',
            'type' => 'video',
            'price' => 200,
        ]);
    }

    // ------------------------------------------------------------------
    //  Core create() method
    // ------------------------------------------------------------------

    public function test_create_persists_notification_to_database(): void
    {
        $patient = $this->makePatient();

        $this->service->create($patient, 'test.type', 'عنوان تجريبي', 'رسالة تجريبية');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $patient->id,
            'type' => 'test.type',
        ]);
    }

    public function test_create_queues_email_when_email_present(): void
    {
        $patient = $this->makePatient();

        $this->service->create($patient, 'test.type', 'عنوان', 'رسالة', [], true);

        Mail::assertQueued(NotificationMail::class);
    }

    public function test_create_does_not_send_email_when_disabled(): void
    {
        $patient = $this->makePatient();

        $this->service->create($patient, 'test.type', 'عنوان', 'رسالة', [], false);

        Mail::assertNotQueued(NotificationMail::class);
    }

    // ------------------------------------------------------------------
    //  Patient Notification Methods
    // ------------------------------------------------------------------

    public function test_notify_consultation_accepted_creates_patient_notification(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $consultation = $this->makeConsultation($patient, $doctor);

        $this->service->notifyConsultationAccepted($patient, $consultation);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $patient->id,
            'type' => 'consultation.accepted',
        ]);
    }

    public function test_notify_payment_success_notifies_patient_and_doctor_and_admins(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin = $this->makeAdmin();
        $consultation = $this->makeConsultation($patient, $doctor);

        $this->service->notifyPaymentSuccess($patient, $doctor, $consultation);

        // Patient notified
        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $patient->id,
            'type' => 'payment.success',
        ]);

        // Doctor notified
        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'consultation.new_booking',
        ]);

        // Admin notified
        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Admin::class,
            'notifiable_id' => $admin->id,
            'type' => 'admin.new_booking',
        ]);
    }

    public function test_notify_patient_deactivated(): void
    {
        $patient = $this->makePatient();

        $this->service->notifyPatientDeactivated($patient, 'انتهاك شروط الاستخدام');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $patient->id,
            'type' => 'patient.deactivated',
        ]);
    }

    // ------------------------------------------------------------------
    //  Doctor Notification Methods
    // ------------------------------------------------------------------

    public function test_notify_consultation_booked_creates_doctor_notification(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $consultation = $this->makeConsultation($patient, $doctor);

        $this->service->notifyConsultationBooked($doctor, $consultation);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'consultation.booked',
        ]);
    }

    public function test_notify_article_approved(): void
    {
        $doctor = $this->makeDoctor();
        $article = Article::create([
            'doctor_id' => $doctor->id,
            'title' => 'مقال صحي',
            'content' => 'محتوى المقال',
            'status' => 'approved',
            'slug' => 'test-article',
        ]);

        $this->service->notifyArticleApproved($doctor, $article);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'article.approved',
        ]);
    }

    public function test_notify_article_rejected(): void
    {
        $doctor = $this->makeDoctor();
        $article = Article::create([
            'doctor_id' => $doctor->id,
            'title' => 'مقال مرفوض',
            'content' => 'محتوى المقال',
            'status' => 'rejected',
            'slug' => 'rejected-article',
        ]);

        $this->service->notifyArticleRejected($doctor, $article, 'محتوى غير مناسب');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'article.rejected',
        ]);
    }

    public function test_notify_doctor_verified(): void
    {
        $doctor = $this->makeDoctor();

        $this->service->notifyDoctorVerificationApproved($doctor);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'doctor.verified',
        ]);
    }

    public function test_notify_doctor_verification_rejected(): void
    {
        $doctor = $this->makeDoctor();

        $this->service->notifyDoctorVerificationRejected($doctor, 'وثائق غير مكتملة');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'doctor.verification_rejected',
        ]);
    }

    public function test_notify_doctor_deactivated(): void
    {
        $doctor = $this->makeDoctor();

        $this->service->notifyDoctorDeactivated($doctor, 'مخالفة السياسات');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'doctor.deactivated',
        ]);
    }

    public function test_notify_payout_processed(): void
    {
        $doctor = $this->makeDoctor();

        $this->service->notifyPayoutProcessed($doctor, 1500.00, 'bank_transfer');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'payout.processed',
        ]);
    }

    /** @test */
    public function test_notify_join_request_all_statuses(): void
    {
        $doctor = $this->makeDoctor();

        foreach (['contacted', 'approved', 'rejected'] as $status) {
            $this->service->notifyJoinRequestStatusChanged($doctor, $status);
        }

        $this->assertEquals(3, $doctor->notifications()->count());
    }

    // ------------------------------------------------------------------
    //  Shared notification methods
    // ------------------------------------------------------------------

    public function test_notify_consultation_cancelled_by_admin_notifies_both(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $consultation = $this->makeConsultation($patient, $doctor);

        $this->service->notifyConsultationCancelledByAdmin($consultation, 'خطأ في الجدول');

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => Doctor::class,
            'notifiable_id' => $doctor->id,
            'type' => 'consultation.cancelled_by_admin',
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $patient->id,
            'type' => 'consultation.cancelled_by_admin',
        ]);
    }

    // ------------------------------------------------------------------
    //  Admin Notifications
    // ------------------------------------------------------------------

    public function test_admins_receive_new_booking_notification(): void
    {
        $patient = $this->makePatient();
        $doctor = $this->makeDoctor();
        $admin1 = $this->makeAdmin();
        $roleId = $admin1->role_id;
        Admin::create(['name' => 'Admin 2', 'email' => 'admin2@test.com', 'password' => bcrypt('p'), 'is_active' => true, 'role_id' => $roleId]);
        Admin::create(['name' => 'Inactive', 'email' => 'admin3@test.com', 'password' => bcrypt('p'), 'is_active' => false, 'role_id' => $roleId]);

        $consultation = $this->makeConsultation($patient, $doctor);

        $this->service->notifyAdminsNewBooking($consultation, $patient, $doctor);

        // 2 active admins should get notifications, 1 inactive should not
        $adminNotifications = \DB::table('notifications')
            ->where('notifiable_type', Admin::class)
            ->where('type', 'admin.new_booking')
            ->count();

        $this->assertEquals(2, $adminNotifications);
    }

    // ------------------------------------------------------------------
    //  Mark as read / Unread count
    // ------------------------------------------------------------------

    public function test_mark_as_read(): void
    {
        $patient = $this->makePatient();
        $this->service->create($patient, 'test', 'عنوان', 'رسالة');
        $notification = $patient->notifications()->first();

        $this->assertNull($notification->read_at);
        $this->service->markAsRead($notification);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_mark_all_as_read(): void
    {
        $patient = $this->makePatient();
        $this->service->create($patient, 'test.1', 'عنوان 1', 'رسالة 1');
        $this->service->create($patient, 'test.2', 'عنوان 2', 'رسالة 2');
        $this->service->create($patient, 'test.3', 'عنوان 3', 'رسالة 3');

        $this->assertEquals(3, $this->service->getUnreadCount($patient));

        $this->service->markAllAsRead($patient);

        $this->assertEquals(0, $this->service->getUnreadCount($patient));
    }
}
