<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scbu_admission_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('pregnancy_id')->nullable()->constrained('pregnancies')->nullOnDelete();
            $table->unsignedBigInteger('doctor_id')->nullable();

            // ── Continuous input features ──────────────────────────
            $table->float('maternal_age')->nullable();
            $table->float('bmi_at_booking')->nullable();
            $table->float('hpg_2h')->nullable();            // 2hPG (2-hour plasma glucose)
            $table->float('weeks_of_gestation')->nullable();
            $table->float('weight_measured')->nullable();
            $table->float('height')->nullable();
            $table->float('parity')->nullable();
            $table->float('no_of_previous_csections')->nullable();
            $table->float('contraction_freq')->nullable();
            $table->float('imd_decile')->nullable();
            $table->float('gravida')->nullable();
            $table->float('systolic_bp')->nullable();
            $table->float('diastolic_bp')->nullable();
            $table->float('fasting_glucose')->nullable();
            $table->float('vitamin_d')->nullable();

            // ── Binary flags (stored as JSON for compactness) ──────
            // Contains all 30 binary flags: gestational_diabetes, obese,
            // severely_premature, previous_caesarean, contractions,
            // fetal_compromise, previous_uterine_surgery, multiple_pregnancy,
            // antepartum_haemorrhage, preeclampsia, pre_eclampsia,
            // chorioamnionitis, abnormal_lie, maternal_medical_disease_sepsis,
            // placenta_praevia, placental_abruption, severe_iugr, fetal_anomalies,
            // previous_traumatic_vaginal_delivery, maternal_medical_disease_other,
            // hypertension, severe_pre_eclampsia, diabetes_endocrine_disorder,
            // twins_or_more, obesity_bmi_ge_35, ethnicity_asian, ethnicity_black,
            // ethnicity_white, ethnicity_mixed, thyroid_abnormal
            $table->json('binary_flags')->nullable();

            // ── Prediction outputs ─────────────────────────────────
            $table->float('risk_probability')->nullable();
            $table->integer('prediction')->nullable();      // 0 = low, 1 = SCBU
            $table->string('label')->nullable();            // "Admit to SCBU (High Risk)" | "Routine Postnatal Care"
            $table->string('risk_level')->nullable();       // Low | Moderate | High
            $table->float('risk_score')->nullable();        // alias for risk_probability
            $table->float('threshold_used')->nullable();
            $table->string('model_name')->nullable();
            $table->text('disclaimer')->nullable();

            // ── SHAP Explanation ───────────────────────────────────
            $table->json('shap_top_features')->nullable();  // top 10 SHAP features from /explain
            $table->boolean('explain_called')->default(false);

            // ── Doctor feedback ────────────────────────────────────
            $table->text('doctor_comments')->nullable();
            $table->boolean('doctor_notified')->default(false);
            $table->timestamp('doctor_notified_at')->nullable();

            // ── Metadata ───────────────────────────────────────────
            $table->string('model_version')->default('3.0.0');
            $table->string('algorithm_used')->nullable();
            $table->timestamp('prediction_date')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'created_at']);
            $table->index('risk_level');
            $table->index('pregnancy_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scbu_admission_predictions');
    }
};
