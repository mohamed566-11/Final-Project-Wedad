<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pregnancy_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pregnancy_id')->constrained('pregnancies')->onDelete('cascade');
            $table->integer('week_number');
            $table->decimal('weight', 5, 2)->nullable();
            $table->integer('blood_pressure_systolic')->nullable();
            $table->integer('blood_pressure_diastolic')->nullable();
            $table->json('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->date('entry_date');
            $table->timestamps();
            
            $table->index(['pregnancy_id', 'week_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pregnancy_entries');
    }
};
