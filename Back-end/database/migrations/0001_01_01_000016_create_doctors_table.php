<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes all fields from:
     *   - 2025_01_01_000001_add_rejection_reason_to_doctors_table
     *   - 2025_01_01_000002_add_notification_settings_to_users_and_doctors (doctors portion)
     *   - 2024_02_01_000001_switch_zoom_to_google_meet (doctors portion)
     *   - 2026_06_04_192804_add_google_email_to_doctors_table
     *   - 2026_02_04_220000_add_performance_indexes (doctors portion)
     */
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone');
            $table->boolean('is_active')->default(true);
            $table->integer('age')->nullable();
            $table->string('image')->nullable();
            $table->enum('specialization', [
                'gynecology',
                'obstetrics',
                'fertility',
                'endocrinology',
                'general_practitioner',
                'pediatrics',
                'nutrition',
                'other',
            ]);
            $table->string('license_number')->unique();
            $table->text('bio')->nullable();
            $table->decimal('consultation_price', 8, 2);
            $table->enum('verification_status', ['pending', 'approved', 'rejected', 'verified'])->default('pending');
            // ← مدموج من 2025_01_01_000001
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_available')->default(true);
            // ← مدموج من 2024_02_01 (Google OAuth)
            $table->text('google_access_token')->nullable();
            $table->text('google_refresh_token')->nullable();
            $table->timestamp('google_token_expires_at')->nullable();
            // ← مدموج من 2026_06_04 (google_email)
            $table->string('google_email')->nullable();
            // ← مدموج من 2025_01_01_000002 (notification_settings)
            $table->json('notification_settings')->nullable();
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('total_consultations')->default(0);
            $table->enum('session_type', ['video', 'offline', 'both'])->default('both');
            $table->string('license_document')->nullable();
            $table->string('id_document')->nullable();
            $table->string('certificate')->nullable();
            $table->integer('years_of_experience')->nullable();
            $table->json('languages')->nullable();
            $table->string('clinic_address')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            // ← Indexes مدموجة من 2026_02_04_220000
            $table->index('verification_status', 'idx_doctors_verification');
            $table->index('is_active', 'idx_doctors_is_active');
            $table->index('specialization', 'idx_doctors_specialization');
            $table->index('is_available', 'idx_doctors_available');
            $table->index(['verification_status', 'is_active', 'is_available'], 'idx_doctors_search');
            $table->index('rating', 'idx_doctors_rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
