<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_medical_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('pregnancy_id')->nullable()->constrained('pregnancies')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type');
            $table->integer('file_size');
            $table->enum('category', [
                'lab_result',
                'ultrasound',
                'x_ray',
                'prescription',
                'medical_report',
                'other'
            ]);
            $table->text('description')->nullable();
            $table->date('file_date')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('doctors')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['user_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_medical_files');
    }
};
