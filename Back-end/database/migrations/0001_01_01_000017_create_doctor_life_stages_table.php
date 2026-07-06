<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_life_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('life_stage_id')->constrained('life_stages')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['doctor_id', 'life_stage_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_life_stages');
    }
};
