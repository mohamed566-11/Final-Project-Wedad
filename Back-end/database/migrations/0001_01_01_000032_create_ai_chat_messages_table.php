<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes fields/indexes from:
     *   - 2026_03_14_120000_add_bot_type_to_ai_chat_messages_table
     *   - 2026_04_04_220500_add_chatbot_query_indexes_to_ai_chat_messages_table
     */
    public function up(): void
    {
        Schema::create('ai_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('session_id');
            // ← مدموج من 2026_03_14_120000
            $table->enum('bot_type', ['public', 'pre_marriage', 'pregnancy', 'motherhood'])->default('public');
            $table->enum('role', ['user', 'assistant']);
            $table->text('message');
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes أساسية
            $table->index(['user_id', 'session_id']);
            // ← مدموج من 2026_03_14
            $table->index('bot_type');
            // ← مدموج من 2026_04_04
            $table->index(['user_id', 'bot_type', 'created_at'], 'ai_chat_user_bot_created_idx');
            $table->index(['user_id', 'session_id', 'created_at'], 'ai_chat_user_session_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_chat_messages');
    }
};
