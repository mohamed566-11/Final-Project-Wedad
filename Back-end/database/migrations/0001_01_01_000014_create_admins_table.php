<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes notification_settings from:
     *   - 2025_01_01_000003_add_notification_settings_to_admins
     */
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->string('image')->nullable();
            $table->timestamp('last_login_at')->nullable();
            // ← مدموج من 2025_01_01_000003
            $table->json('notification_settings')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
