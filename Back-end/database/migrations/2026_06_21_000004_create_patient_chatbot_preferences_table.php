<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_chatbot_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->unique()
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->boolean('data_access_enabled')->default(false);
            $table->boolean('share_predictions')->default(true);
            $table->boolean('share_trackers')->default(true);
            $table->boolean('share_medical_file')->default(false);
            $table->boolean('share_consultations')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_chatbot_preferences');
    }
};
