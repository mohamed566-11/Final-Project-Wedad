<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gestational_diabetes_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('pregnancy_id')->nullable()->constrained('pregnancies')->onDelete('cascade'); // ← nullable مدموج
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');

            // Risk Assessment
            $table->string('risk_level')->nullable();
            $table->decimal('risk_score', 5, 4)->nullable()->default(0);
            $table->integer('pregnancy_week')->nullable()->default(0);

            // === API Input Fields (11 user fields → 10 model features) ===
            $table->decimal('height_cm', 5, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('bmi_computed', 5, 2)->nullable();
            $table->integer('no_of_pregnancy')->nullable();
            $table->integer('maternal_age')->nullable();
            $table->boolean('family_history_diabetes')->default(false);
            $table->boolean('pcos')->default(false);
            $table->boolean('sedentary_lifestyle')->default(false);
            $table->boolean('prediabetes')->default(false);
            $table->boolean('unexplained_prenatal_loss')->default(false);
            $table->boolean('large_child_or_birth_default')->default(false);
            $table->boolean('gestation_in_previous_pregnancy')->default(false);

            // === API Output Fields ===
            $table->decimal('risk_probability', 6, 4)->nullable();
            $table->string('risk_category')->nullable();
            $table->string('final_risk')->nullable();
            $table->boolean('guardrail_applied')->default(false);
            $table->text('recommendation_en')->nullable();
            $table->text('recommendation_ar')->nullable();
            $table->json('top_factors')->nullable();

            // Legacy lab fields (nullable, kept for backward compat)
            $table->decimal('fasting_glucose', 5, 2)->nullable();
            $table->decimal('random_glucose', 5, 2)->nullable();
            $table->decimal('hba1c', 4, 2)->nullable();
            $table->decimal('pre_pregnancy_bmi', 5, 2)->nullable();
            $table->decimal('current_bmi', 5, 2)->nullable();
            $table->decimal('weight_gain', 5, 2)->nullable();
            $table->string('ethnicity')->nullable();
            $table->boolean('previous_gdm')->default(false);
            $table->boolean('previous_macrosomia')->default(false);

            // Model Information
            $table->string('model_version')->nullable();
            $table->string('algorithm_used')->nullable();
            $table->json('feature_importance')->nullable();
            $table->text('ai_analysis')->nullable();
            $table->json('recommendations')->nullable();

            // Notification & Follow-up
            $table->boolean('doctor_notified')->default(false);
            $table->timestamp('doctor_notified_at')->nullable();
            $table->timestamp('prediction_date')->nullable();
            $table->text('doctor_comments')->nullable();
            $table->boolean('ogtt_recommended')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gestational_diabetes_predictions');
    }
};
