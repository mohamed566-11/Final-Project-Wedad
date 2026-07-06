<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('first_appointment_date')->nullable();
            $table->timestamp('last_appointment_date')->nullable();
            $table->integer('total_appointments')->default(0);
            $table->timestamps();
            
            $table->unique(['doctor_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_patients');
    }
};
