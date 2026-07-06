<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preeclampsia_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('pregnancy_id')->nullable()->constrained('pregnancies')->onDelete('cascade'); // ← nullable مدموج
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');

            // Risk Assessment
            $table->string('risk_level')->nullable();
            $table->decimal('risk_score', 5, 4)->nullable()->default(0);
            $table->integer('pregnancy_week')->nullable()->default(0);

            // === API Input Fields (11 clinical features) ===
            $table->integer('gravida')->nullable();
            $table->integer('parity')->nullable();
            $table->decimal('gest_age', 4, 1)->nullable();
            $table->integer('maternal_age')->nullable();
            $table->decimal('bmi', 5, 2)->nullable();
            $table->boolean('diabetes')->default(false);
            $table->boolean('htn')->default(false);
            $table->integer('systolic_bp')->nullable();
            $table->integer('diastolic_bp')->nullable();
            $table->decimal('hb', 4, 1)->nullable();
            $table->boolean('proteinuria')->default(false);

            // === API Output Fields ===
            $table->integer('prediction_class')->nullable();
            $table->decimal('probability', 6, 4)->nullable();
            $table->string('risk_status')->nullable();
            $table->json('input_echo')->nullable();

            // Legacy / extra
            $table->decimal('proteinuria_level', 5, 2)->nullable();
            $table->boolean('previous_preeclampsia')->default(false);
            $table->boolean('chronic_hypertension')->default(false);
            $table->boolean('kidney_disease')->default(false);
            $table->boolean('first_pregnancy')->default(false);

            // Model Information
            $table->string('model_version')->default('v1.0')->nullable();
            $table->string('algorithm_used')->default('XGBoost')->nullable();
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
        Schema::dropIfExists('preeclampsia_predictions');
    }
};
