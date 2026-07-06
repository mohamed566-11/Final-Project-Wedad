<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * ✅ Consolidated: includes notification_settings + indexes from:
     *   - 2025_01_01_000002_add_notification_settings_to_users_and_doctors
     *   - 2026_02_04_220000_add_performance_indexes (users portion)
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('email_verified_at')->nullable();
            $table->foreignId('life_stage_id')->nullable()->constrained('life_stages')->nullOnDelete();
            $table->integer('age')->nullable();
            $table->string('image')->nullable();
            $table->string('google_id')->nullable();
            $table->timestamp('last_login_at')->nullable();
            // ← مدموج من 2025_01_01_000002
            $table->json('notification_settings')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            // ← Indexes مدموجة من 2026_02_04_220000
            $table->index('is_active', 'idx_users_is_active');
            $table->index('created_at', 'idx_users_created_at');
            $table->index(['life_stage_id', 'is_active'], 'idx_users_stage_active');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
