<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes performance indexes from:
     *   - 2026_02_04_220000_add_performance_indexes (articles portion)
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('image')->nullable();
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'archived'])->default('draft');
            $table->foreignId('life_stage_id')->nullable()->constrained('life_stages')->onDelete('set null');
            $table->text('admin_notes')->nullable();
            $table->integer('views_count')->default(0);
            $table->integer('reading_time')->nullable();
            $table->json('tags')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index('life_stage_id');
            // ← Performance indexes مدموجة من 2026_02_04_220000
            $table->index('status', 'idx_articles_status');
            $table->index('published_at', 'idx_articles_published');
            $table->index(['status', 'life_stage_id'], 'idx_articles_status_stage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
