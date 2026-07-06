<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mood_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('mood', ['very_bad', 'bad', 'neutral', 'good', 'very_good']);
            $table->text('notes')->nullable();
            $table->json('factors')->nullable();
            $table->date('entry_date');
            $table->time('entry_time');
            $table->timestamps();
            
            $table->unique(['user_id', 'entry_date']);
            $table->index(['user_id', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mood_entries');
    }
};
