<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chatbot_documents', function (Blueprint $table) {
            $table->id();
            $table->string('bot_type');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('status')->default('uploaded'); // uploaded, processing, ready, failed
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['bot_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_documents');
    }
};
