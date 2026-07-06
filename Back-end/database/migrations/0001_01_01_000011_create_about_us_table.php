<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes fields from:
     *   - 2026_06_06_204850_add_titles_to_about_us_table
     */
    public function up(): void
    {
        Schema::create('about_us', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('image')->nullable();
            $table->text('mission_desc')->nullable();
            // ← مدموج من 2026_06_06_204850
            $table->string('mission_title')->nullable();
            $table->text('vision_desc')->nullable();
            // ← مدموج من 2026_06_06_204850
            $table->string('vision_title')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_us');
    }
};
