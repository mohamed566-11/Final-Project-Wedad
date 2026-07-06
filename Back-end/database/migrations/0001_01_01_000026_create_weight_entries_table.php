<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weight_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('weight', 5, 2);
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('bmi', 4, 2)->nullable();
            $table->date('entry_date');
            $table->time('entry_time');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weight_entries');
    }
};
