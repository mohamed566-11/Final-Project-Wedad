<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('period_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('cycle_length')->nullable();
            $table->integer('period_length')->nullable();
            $table->enum('flow', ['light', 'medium', 'heavy'])->nullable();
            $table->json('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_predicted')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('period_cycles');
    }
};
