<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes fields from:
     *   - 2026_02_08_175000_add_terms_privacy_to_settings_site
     */
    public function up(): void
    {
        Schema::create('settings_site', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('favicon')->nullable();
            $table->string('logo')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('twitter_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('phone');
            $table->string('country')->default('Egypt');
            $table->string('city')->nullable();
            $table->string('street')->nullable();
            $table->text('small_description')->nullable();
            // ← مدموج من 2026_02_08_175000
            $table->longText('terms_content')->nullable();
            $table->longText('privacy_content')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings_site');
    }
};
