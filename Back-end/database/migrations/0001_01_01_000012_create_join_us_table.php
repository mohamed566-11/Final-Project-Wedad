<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes fields from:
     *   - 2026_06_06_023154_add_doctor_details_to_join_us_table
     *   - 2026_06_08_014500_change_specialty_type_in_join_us (specialty → VARCHAR now)
     *   - 2026_02_04_220000_add_performance_indexes (join_us portion)
     */
    public function up(): void
    {
        Schema::create('join_us', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            // ← specialty كـ string (VARCHAR) مدموج من 2026_06_08 بدلاً من enum
            $table->string('specialty');
            // ← مدموج من 2026_06_06_023154
            $table->string('license_number')->nullable();
            $table->decimal('consultation_price', 8, 2)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->enum('status', ['pending', 'contacted', 'approved', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            // ← Performance indexes مدموجة من 2026_02_04_220000
            $table->index('status', 'idx_join_status');
            $table->index('specialty', 'idx_join_specialty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('join_us');
    }
};
