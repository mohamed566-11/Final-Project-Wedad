<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes changes from:
     *   - 2026_06_02_210548_modify_doctor_working_hours_to_slots
     *     (drops end_time, is_available — adds unique constraint)
     */
    public function up(): void
    {
        Schema::create('doctor_working_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->enum('day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->time('start_time');
            // ← end_time و is_available حُذفا بسبب 2026_06_02_210548 (تحويل للـ slots)
            $table->timestamps();

            $table->index(['doctor_id', 'day']);
            // ← unique constraint مدموج من 2026_06_02_210548
            $table->unique(['doctor_id', 'day', 'start_time'], 'unique_doctor_slot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_working_hours');
    }
};
