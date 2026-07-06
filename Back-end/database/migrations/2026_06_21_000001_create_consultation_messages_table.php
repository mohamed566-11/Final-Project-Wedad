<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes fields from:
     *   - 2026_06_21_000003_add_is_delivered_to_consultation_messages_table
     */
    public function up(): void
    {
        Schema::create('consultation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')
                  ->constrained('consultations')
                  ->cascadeOnDelete();
            $table->enum('sender_type', ['patient', 'doctor']);
            $table->unsignedBigInteger('sender_id');
            $table->text('message')->nullable();
            $table->string('image_path')->nullable();
            $table->enum('message_type', ['text', 'image', 'text_image'])->default('text');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            // ← مدموج من 2026_06_21_000003
            $table->boolean('is_delivered')->default(false);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('consultation_id');
            $table->index(['sender_type', 'sender_id']);
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_messages');
    }
};
