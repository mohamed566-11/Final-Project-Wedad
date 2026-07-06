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
        Schema::create('pregnancy_medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('pregnancy_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('dosage')->nullable();
            $table->string('frequency')->default('daily'); // daily, weekly, as_needed
            $table->time('time_of_day')->nullable();
            $table->timestamp('last_taken_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pregnancy_medications');
    }
};
