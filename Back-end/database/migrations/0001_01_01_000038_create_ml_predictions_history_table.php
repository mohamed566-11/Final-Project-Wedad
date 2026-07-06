<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes scbu_admission from:
     *   - 2026_06_27_000002_fix_ml_predictions_history_table (deleted)
     */
    public function up(): void
    {
        Schema::create('ml_predictions_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->morphs('predictable');
            // ← scbu_admission مدموج من fix migration
            $table->enum('disease_type', [
                'preeclampsia',
                'gestational_diabetes',
                'preterm_birth',
                'scbu_admission',
            ]);
            $table->json('input_features');
            $table->json('model_output');
            $table->string('model_version');
            $table->string('algorithm_used');
            $table->decimal('confidence_score', 5, 4)->nullable()->default(0);
            $table->string('risk_level')->nullable();
            $table->text('recommendation_summary')->nullable();
            $table->integer('processing_time_ms')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'disease_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ml_predictions_history');
    }
};
