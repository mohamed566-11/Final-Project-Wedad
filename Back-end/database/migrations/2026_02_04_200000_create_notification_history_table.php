<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes status enum from:
     *   - 2026_06_03_200957_add_pending_status_to_notification_history
     *   status = ['pending','sent','scheduled','cancelled','failed']
     */
    public function up(): void
    {
        Schema::create('notification_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('admins')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->enum('type', ['announcement', 'update', 'maintenance', 'promotional']);
            $table->enum('target', ['all', 'patients', 'doctors']);
            $table->integer('recipients_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            // ← Enum موسّع مدموج من 2026_06_03_200957
            $table->enum('status', ['pending', 'sent', 'scheduled', 'cancelled', 'failed'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_history');
    }
};
