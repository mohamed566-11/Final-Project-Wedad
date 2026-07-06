<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preterm_birth_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('pregnancy_id')->nullable()->constrained('pregnancies')->onDelete('cascade'); // ← nullable مدموج
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');

            // Risk Assessment
            $table->string('risk_level')->nullable();
            $table->decimal('risk_score', 5, 4)->nullable()->default(0);
            $table->integer('pregnancy_week')->nullable()->default(0);
            $table->enum('prediction_stage', ['screening', 'diagnostic'])->default('screening');

            // === API Input Fields (10 clinical features) ===
            $table->integer('maternal_age')->nullable();
            $table->integer('systolic_bp')->nullable();
            $table->integer('diastolic_bp')->nullable();
            $table->decimal('bs', 5, 2)->nullable();           // blood sugar
            $table->decimal('bmi', 5, 2)->nullable();
            $table->boolean('previous_complications')->default(false);
            $table->boolean('preexisting_diabetes')->default(false);
            $table->boolean('gestational_diabetes_input')->default(false);
            $table->boolean('mental_health')->default(false);
            $table->decimal('heart_rate', 5, 1)->nullable();

            // === API Output Fields ===
            $table->integer('prediction_class')->nullable();
            $table->string('risk_label')->nullable();
            $table->decimal('probability_high', 6, 4)->nullable();
            $table->text('api_note')->nullable();

            // Legacy / stage-2 diagnostic fields (all nullable)
            $table->decimal('cervical_length', 4, 2)->nullable();
            $table->boolean('cervical_insufficiency')->default(false);
            $table->boolean('uterine_abnormalities')->default(false);
            $table->boolean('placental_issues')->default(false);
            $table->boolean('infection')->default(false);
            $table->boolean('multiple_pregnancy')->default(false);
            $table->boolean('preeclampsia_present')->default(false);
            $table->boolean('gestational_diabetes_present')->default(false);
            $table->boolean('previous_preterm_birth')->default(false);
            $table->boolean('smoking')->default(false);
            $table->integer('number_of_previous_pregnancies')->nullable();
            $table->boolean('cervical_length_scan_recommended')->default(false);

            // Model Information
            $table->string('model_version')->default('v1.0.0')->nullable();
            $table->string('algorithm_used')->nullable();
            $table->json('feature_importance')->nullable();
            $table->text('ai_analysis')->nullable();
            $table->json('recommendations')->nullable();

            // Notification & Follow-up
            $table->boolean('doctor_notified')->default(false);
            $table->timestamp('doctor_notified_at')->nullable();
            $table->timestamp('prediction_date')->nullable();
            $table->text('doctor_comments')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'risk_level']);
            $table->index(['pregnancy_id', 'prediction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preterm_birth_predictions');
    }
};
