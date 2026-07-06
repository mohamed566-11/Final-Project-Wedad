<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('consultation_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained('consultations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // who uploaded
            $table->string('file_name');
            $table->string('file_path');
            $table->string('original_name');
            $table->string('file_type'); // pdf, jpg, jpeg, png
            $table->unsignedBigInteger('file_size'); // in bytes
            $table->enum('category', ['lab_result', 'ultrasound', 'x_ray', 'prescription', 'medical_report', 'other'])->default('other');
            $table->string('description')->nullable();
            $table->enum('uploaded_by', ['patient', 'doctor'])->default('patient');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_attachments');
    }
};
