<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes all fields from:
     *   - 2024_02_01_000001_switch_zoom_to_google_meet (consultations portion)
     *   - 2026_02_04_210000_add_cancelled_by_admin_to_consultations
     *   - 2026_02_04_220000_add_performance_indexes (consultations portion)
     */
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->time('time');
            // ← شامل cancelled_by_admin مدموج من 2026_02_04_210000
            $table->enum('status', [
                'pending',
                'confirmed',
                'in_progress',
                'completed',
                'cancelled_by_patient',
                'cancelled_by_doctor',
                'cancelled_by_admin',
                'no_show',
            ])->default('pending');
            $table->enum('type', ['video', 'offline'])->default('video');
            $table->decimal('price', 8, 2);
            $table->decimal('platform_commission', 8, 2)->nullable();
            // ← حقول Google Meet مدموجة من 2024_02_01 (بدلاً من Zoom)
            $table->string('google_event_id')->nullable();
            $table->string('google_meet_link')->nullable();
            $table->string('google_meet_id')->nullable();
            $table->text('patient_notes')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->integer('duration_minutes')->default(30);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes أساسية
            $table->index(['doctor_id', 'date', 'status']);
            $table->index(['user_id', 'date', 'status']);
            // ← Performance indexes مدموجة من 2026_02_04_220000
            $table->index(['doctor_id', 'status'], 'idx_consultations_doctor_status');
            $table->index(['user_id', 'status'], 'idx_consultations_user_status');
            $table->index(['date', 'status'], 'idx_consultations_date_status');
            $table->index('created_at', 'idx_consultations_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
