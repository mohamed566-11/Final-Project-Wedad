<?php

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PatientDataCollectorService (AI Predictions)          ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║ PURPOSE   : Pre-fill AI prediction forms with patient data      ║
 * ║             (GDM, Preeclampsia, Preterm Birth, SCBU)            ║
 * ║ NAMESPACE : App\Services                                        ║
 * ║ USED BY   : AI Prediction Controllers                           ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║ ⚠️  لا تخلط بينه وبين:                                          ║
 * ║    App\Services\Patient\PatientDataCollectorService             ║
 * ║    (ده للـ Chatbot Context — مختلف الوظيفة كلياً)              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

namespace App\Services;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Pregnancy;
use App\Models\WeightEntry;
use App\Models\PatientHeartRate;
use Illuminate\Support\Facades\Log;

class PatientDataCollectorService
{
    /**
     * Collect pre-fill data for GDM prediction form
     * Maps: profile → age, height_cm, weight_kg; pregnancies → no_of_pregnancy;
     *        medical_history → family_history, pcos, prediabetes, etc.
     */
    public function collectForGDM(User $user): array
    {
        $profile = $user->profile;
        $pregnancy = $user->activePregnancy;

        $data = [
            'age' => $this->getAge($user, $profile),
            'height_cm' => $profile?->height,
            'weight_kg' => $this->getLatestWeight($user, $profile),
            'no_of_pregnancy' => $user->pregnancies()->count(),
            'family_history' => $this->hasCondition($profile, 'diabetes', 'family'),
            'pcos' => $this->hasCondition($profile, 'pcos'),
            'sedentary_lifestyle' => 0,
            'prediabetes' => $this->hasCondition($profile, 'prediabetes'),
            'unexplained_prenatal_loss' => 0,
            'large_child_or_birth_default' => 0,
            'gestation_in_previous_pregnancy' => $this->hasPreviousGDM($user),
        ];

        return $this->addMetadata($data, $user, $pregnancy);
    }

    /**
     * Collect pre-fill data for Preeclampsia prediction form
     * Maps: profile → age, bmi, blood_pressure; pregnancy → gest_age, gravida, parity
     */
    public function collectForPreeclampsia(User $user): array
    {
        $profile = $user->profile;
        $pregnancy = $user->activePregnancy;

        $data = [
            'gravida' => $user->pregnancies()->count(),
            'parity' => $user->pregnancies()->where('pregnancy_status', 'completed')->count(),
            'gest_age' => $pregnancy?->current_week,
            'age' => $this->getAge($user, $profile),
            'bmi' => $profile?->calculateBMI(),
            'diabetes' => $this->hasCondition($profile, 'diabetes') ? 1 : 0,
            'htn' => $this->hasCondition($profile, 'hypertension') ? 1 : 0,
            'sysbp' => $profile?->blood_pressure_systolic,
            'diabp' => $profile?->blood_pressure_diastolic,
            'hb' => null, // Requires lab test — user must input
            'proteinuria' => 0,
        ];

        return $this->addMetadata($data, $user, $pregnancy);
    }

    /**
     * Collect pre-fill data for Preterm Birth prediction form
     * Maps: profile → age, bmi, blood_pressure; medical_history → complications, diabetes
     */
    public function collectForPretermBirth(User $user): array
    {
        $profile = $user->profile;
        $pregnancy = $user->activePregnancy;

        $data = [
            'age' => $this->getAge($user, $profile),
            'systolic_bp' => $profile?->blood_pressure_systolic,
            'diastolic' => $profile?->blood_pressure_diastolic,
            'bs' => null, // Requires lab test — user must input
            'bmi' => $profile?->calculateBMI(),
            'previous_complications' => $this->hasPreviousComplications($user) ? 1 : 0,
            'preexisting_diabetes' => $this->hasCondition($profile, 'diabetes') ? 1 : 0,
            'gestational_diabetes' => $this->hasCurrentGDM($user) ? 1 : 0,
            'mental_health' => 0,
            'heart_rate' => $this->getLatestHeartRate($user), // Auto-filled from Google Fit IoT
        ];

        return $this->addMetadata($data, $user, $pregnancy);
    }

    /**
     * Collect pre-fill data for SCBU prediction form
     * Maps: profile → age, bmi, weight, height, BP; pregnancy → weeks, gravida, parity;
     *        history → gestational_diabetes GDM result
     */
    public function collectForSCBU(User $user): array
    {
        $profile = $user->profile;
        $pregnancy = $user->activePregnancy;

        $parity = max(0, $user->pregnancies()->where('pregnancy_status', 'completed')->count());
        $gravida = $user->pregnancies()->count();

        $bmi = $profile?->calculateBMI();

        $data = [
            // Auto-fillable continuous fields
            'maternal_age' => $this->getAge($user, $profile),
            'bmi_at_booking' => $bmi,
            'hpg_2h' => null,  // Lab test — patient must input
            'weeks_of_gestation' => $pregnancy?->current_week,
            'weight_measured' => $this->getLatestWeight($user, $profile),
            'height' => $profile?->height,
            'parity' => $parity,
            'no_of_previous_csections' => null,  // Patient must input
            'contraction_freq' => null,         // Clinical measurement
            'imd_decile' => 5,            // Neutral default
            'gravida' => $gravida,
            'systolic_bp' => $profile?->blood_pressure_systolic,
            'diastolic_bp' => $profile?->blood_pressure_diastolic,
            'fasting_glucose' => null,          // Lab test
            'vitamin_d' => null,          // Lab test
            // Pre-filled binary flags
            'binary_flags' => [
                'gestational_diabetes' => $this->hasCurrentGDM($user),
                'obese' => ($bmi && $bmi >= 30) ? 1 : 0,
                'obesity_bmi_ge_35' => ($bmi && $bmi >= 35) ? 1 : 0,
                'hypertension' => $this->hasCondition($profile, 'hypertension'),
                'multiple_pregnancy' => 0, // Default; patient can update
                'previous_caesarean' => $parity > 0 ? null : 0, // hint patient to fill
                'twins_or_more' => 0,
            ],
        ];

        return $this->addMetadata($data, $user, $pregnancy);
    }

    // === Private Helpers ===

    private function getAge(User $user, ?UserProfile $profile): ?int
    {
        if ($user->age) {
            return $user->age;
        }
        if ($profile?->date_of_birth) {
            return $profile->date_of_birth->age;
        }
        return null;
    }

    private function getLatestWeight(User $user, ?UserProfile $profile): ?float
    {
        // Try latest weight entry from tracker first
        $latestEntry = $user->weightEntries()->latest()->first();
        if ($latestEntry) {
            return $latestEntry->weight;
        }
        // Fallback to profile weight
        return $profile?->weight;
    }

    /**
     * جلب آخر قراءة heart rate من جدول patient_heart_rates (مزامنة Google Fit)
     * يرجع null لو المريضة لم تربط Google Fit أو لا يوجد قراءات بعد
     */
    private function getLatestHeartRate(User $user): ?float
    {
        $latest = PatientHeartRate::where('user_id', $user->id)
            ->latest('timestamp')
            ->first();

        return $latest?->heart_rate_bpm;
    }

    private function hasCondition(?UserProfile $profile, string $keyword, ?string $context = null): int
    {
        if (!$profile)
            return 0;

        // Search in chronic_diseases array
        $chronicDiseases = $profile->chronic_diseases ?? [];
        foreach ($chronicDiseases as $disease) {
            if (str_contains(strtolower($disease), strtolower($keyword))) {
                return 1;
            }
        }

        // Search in medical_history text
        $medicalHistory = strtolower($profile->medical_history ?? '');
        if ($context) {
            // e.g., "family history of diabetes"
            if (
                str_contains($medicalHistory, strtolower($context)) &&
                str_contains($medicalHistory, strtolower($keyword))
            ) {
                return 1;
            }
        } else {
            if (str_contains($medicalHistory, strtolower($keyword))) {
                return 1;
            }
        }

        return 0;
    }

    private function hasPreviousGDM(User $user): int
    {
        return $user->gestationalDiabetesPredictions()
            ->where('risk_level', 'like', '%high%')
            ->exists() ? 1 : 0;
    }

    private function hasCurrentGDM(User $user): int
    {
        $pregnancy = $user->activePregnancy;
        if (!$pregnancy)
            return 0;

        return $pregnancy->gestationalDiabetesPredictions()
            ->where('risk_level', 'like', '%high%')
            ->exists() ? 1 : 0;
    }

    private function hasPreviousComplications(User $user): int
    {
        // Check if any previous pregnancy had high-risk predictions
        $hasHighRiskPE = $user->preeclampsiaPredictions()->highRisk()->exists();
        $hasHighRiskPTB = $user->pretermBirthPredictions()->highRisk()->exists();

        return ($hasHighRiskPE || $hasHighRiskPTB) ? 1 : 0;
    }

    private function addMetadata(array $data, User $user, ?Pregnancy $pregnancy): array
    {
        return [
            'fields' => $data,
            'auto_filled' => array_keys(array_filter($data, fn($v) => $v !== null)),
            'missing' => array_keys(array_filter($data, fn($v) => $v === null)),
            'pregnancy_id' => $pregnancy?->id,
            'pregnancy_week' => $pregnancy?->current_week,
            'patient_name' => $user->name,
        ];
    }
}
