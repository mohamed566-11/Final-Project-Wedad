<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_syncs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('source', ['apple_health', 'google_fit']);
            $table->enum('data_type', ['heart_rate', 'steps', 'sleep', 'calories', 'blood_pressure', 'blood_glucose']);
            $table->decimal('value', 10, 2);
            $table->string('unit');
            $table->dateTime('recorded_at');
            $table->json('additional_data')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'data_type', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_syncs');
    }
};
