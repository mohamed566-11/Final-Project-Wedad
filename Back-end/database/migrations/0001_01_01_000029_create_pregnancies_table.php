<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pregnancies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('conception_date')->nullable();
            $table->date('last_menstrual_period');
            $table->date('due_date');
            $table->integer('current_week')->nullable();
            $table->boolean('is_active')->default(true);
            $table->enum('pregnancy_status', ['ongoing', 'completed', 'miscarriage', 'terminated'])->default('ongoing');
            $table->date('delivery_date')->nullable();
            $table->enum('delivery_type', ['normal', 'cesarean'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pregnancies');
    }
};
