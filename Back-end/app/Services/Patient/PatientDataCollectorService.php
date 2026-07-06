<?php

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         PatientDataCollectorService (Chatbot Context)           ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║ PURPOSE   : Build personalized context for AI Chatbot responses ║
 * ║             Supports Redis Cache to reduce DB queries           ║
 * ║ NAMESPACE : App\Services\Patient                                ║
 * ║ USED BY   : ProcessChatbotMessageJob                           ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║ ⚠️  لا تخلط بينه وبين:                                          ║
 * ║    App\Services\PatientDataCollectorService                    ║
 * ║    (ده للـ AI Prediction Forms — مختلف الوظيفة كلياً)            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

namespace App\Services\Patient;

use App\Models\User;
use App\Models\Consultation;
use App\Models\PatientChatbotPreference;
use App\Models\PregnancyMedication;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * PatientDataCollectorService
 * يجمع بيانات المريضة ويبني السياق المخصص للشات بوت
 * يدعم Redis Cache لتقليل DB queries
 */
class PatientDataCollectorService
{
    // =========================================================================
    //  MAIN METHOD
    // =========================================================================

    /**
     * جمع سياق المريضة حسب نوع البوت
     * يُرجع array فارغ إذا: البوت عام، الميزة معطلة، أو لا بيانات
     */
    public function collectChatbotContext(User $user, string $botType): array
    {
        // القاعدة: البوت العام لا يستقبل أي بيانات شخصية
        if ($botType === 'public') {
            return [];
        }

        // Feature Flag check
        if (!config('chatbot.patient_context_enabled', false)) {
            return [];
        }

        // Opt-in check
        $preference = $user->chatbotPreference;
        if (!$preference || !$preference->isDataAccessEnabled()) {
            return [];
        }

        // Cache check
        $cached = $this->getCachedContext($user, $botType);
        if ($cached !== null) {
            return $cached;
        }

        try {
            // جمع البيانات من DB
            $context = [
                'context_version' => '1.1',
                'generated_at' => now()->toISOString(),
                'profile' => $this->buildProfileData($user),
            ];

            $upcomingAppt = $this->buildUpcomingAppointmentData($user);
            if ($upcomingAppt) {
                $context['upcoming_appointment'] = $upcomingAppt;
            }

            // بيانات إضافية حسب نوع البوت والـ Preferences
            $sharePredictions = $preference ? $preference->share_predictions : true;
            if ($sharePredictions) {
                $predictions = $this->buildPredictionsData($user, $botType);
                if (!empty($predictions)) {
                    $context['latest_predictions'] = $predictions;
                }
            }

            $shareTrackers = $preference ? $preference->share_trackers : true;
            if ($shareTrackers) {
                $trackers = $this->buildTrackersData($user, $botType);
                if (!empty($trackers)) {
                    $context['trackers'] = $trackers;
                }
            }

            // === الاستشارات الطبية السابقة ===
            $shareConsultations = $preference ? $preference->share_consultations : false;
            if ($shareConsultations) {
                $consultations = $this->buildConsultationsData($user);
                if (!empty($consultations)) {
                    $context['recent_consultations'] = $consultations;
                }
            }

            // بيانات ما قبل الزواج
            if ($botType === 'pre_marriage') {
                $fertility = $this->buildFertilityData($user);
                if (!empty($fertility)) {
                    $context['fertility_data'] = $fertility;
                }
            }

            // المختبرات (للحمل والأمومة)
            if (in_array($botType, ['pregnancy', 'motherhood'])) {
                $labs = $this->buildLabResultsData($user);
                if (!empty($labs)) {
                    $context['lab_results'] = $labs;
                }
            }

            // بيانات خاصة بالحمل
            if ($botType === 'pregnancy') {
                $pregnancy = $this->buildPregnancyData($user);
                if ($pregnancy) {
                    $context['pregnancy'] = $pregnancy;
                }
                $meds = $this->buildMedicationsData($user);
                if (!empty($meds)) {
                    $context['recent_medications'] = $meds;
                }
            }

            // بيانات ما بعد الولادة
            if ($botType === 'motherhood') {
                $pregnancy = $this->buildPostPregnancyData($user);
                if ($pregnancy) {
                    $context['last_pregnancy'] = $pregnancy;
                }

                $baby = $this->buildBabyData($user);
                if ($baby) {
                    $context['baby_data'] = $baby;
                }
            }

            // تطبيق Data Minimization
            $context = $this->filterByBotType($context, $botType);

            // Cache النتيجة
            $this->cacheContext($user, $botType, $context);

            return $context;

        } catch (\Throwable $e) {
            // Graceful Degradation — لا يفشل الطلب
            Log::warning('patient_context_collection_failed', [
                'user_id' => $user->id,
                'bot_type' => $botType,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    // =========================================================================
    //  SYSTEM PROMPT BUILDER
    // =========================================================================

    /**
     * بناء System Prompt مخصص بناءً على بيانات المريضة
     * يُضاف كأول رسالة في chat_history
     */
    public function buildContextualSystemPrompt(array $patientContext): string
    {
        if (empty($patientContext)) {
            return '';
        }

        $lines = [];
        $lines[] = '╔══════════════════════════════════════════╗';
        $lines[] = '║     📋 بيانات المريضة الصحية السرية     ║';
        $lines[] = '╚══════════════════════════════════════════╝';
        $lines[] = '⚠️  هذه البيانات سرية — لا تظهريها كاملةً للمستخدمة. استخدميها فقط لتخصيص إجاباتك.';

        // ─── الملف الشخصي ───────────────────────────────────
        if (!empty($patientContext['profile'])) {
            $p = $patientContext['profile'];
            $lines[] = '';
            $lines[] = '👤 الملف الشخصي:';
            if (isset($p['life_stage_label']))
                $lines[] = "  • المرحلة الصحية الحالية: {$p['life_stage_label']} 🏷️";
            if (isset($p['age']))
                $lines[] = "  • العمر: {$p['age']} سنة";

            $heightWeight = [];
            if (isset($p['height']))
                $heightWeight[] = "{$p['height']} سم";
            if (isset($p['weight']))
                $heightWeight[] = "{$p['weight']} كجم";
            if (!empty($heightWeight)) {
                $lines[] = "  • الطول/الوزن: " . implode(" / ", $heightWeight);
            }

            if (isset($p['bmi']))
                $lines[] = "  • مؤشر كتلة الجسم (BMI): {$p['bmi']}";
            if (isset($p['blood_pressure']))
                $lines[] = "  • ضغط الدم الأساسي: {$p['blood_pressure']}";
            if (isset($p['blood_type']))
                $lines[] = "  • فصيلة الدم: {$p['blood_type']}";
            if (!empty($p['chronic_diseases']))
                $lines[] = '  • أمراض مزمنة: ' . implode('، ', $p['chronic_diseases']);
            if (!empty($p['allergies']))
                $lines[] = '  • حساسية: ' . implode('، ', $p['allergies']);
            if (!empty($p['medical_history']))
                $lines[] = "  • تاريخ طبي عام: {$p['medical_history']}";
        }

        // ─── الحمل الحالي ────────────────────────────────────
        if (!empty($patientContext['pregnancy'])) {
            $preg = $patientContext['pregnancy'];
            $lines[] = '';
            $lines[] = '🤰 الحمل الحالي:';
            if (isset($preg['current_week']))
                $lines[] = "  • الأسبوع: {$preg['current_week']}";
            if (isset($preg['trimester_label']))
                $lines[] = "  • المرحلة: {$preg['trimester_label']}";
            if (isset($preg['due_date']))
                $lines[] = "  • الموعد المتوقع: {$preg['due_date']}";
        }

        // ─── آخر حمل ─────────────────────────────────────────
        if (!empty($patientContext['last_pregnancy'])) {
            $lp = $patientContext['last_pregnancy'];
            $lines[] = '';
            $lines[] = '👶 آخر حمل:';
            if (isset($lp['delivery_date']))
                $lines[] = "  • تاريخ الولادة: {$lp['delivery_date']}";
            if (isset($lp['delivery_type']))
                $lines[] = "  • نوع الولادة: {$lp['delivery_type']}";
            if (isset($lp['weeks_since']))
                $lines[] = "  • مضى على الولادة: {$lp['weeks_since']} أسبوع";
        }

        // ─── تقييمات الذكاء الاصطناعي ───────────────────────
        if (!empty($patientContext['latest_predictions'])) {
            $lines[] = '';
            $lines[] = '🔬 نتائج تقييمات الذكاء الاصطناعي:';
            $lines[] = '  (استخدمي هذه النتائج بالوصف فقط — لا تذكري أرقاماً أو نسباً)';

            $predLabels = [
                'gdm' => 'سكري الحمل (GDM)',
                'preeclampsia' => 'تسمم الحمل (Preeclampsia)',
                'preterm_birth' => 'الولادة المبكرة (Preterm Birth)',
                'scbu_admission' => 'احتمال دخول حضانة المولود (SCBU)',
            ];

            foreach ($patientContext['latest_predictions'] as $key => $pred) {
                $label = $predLabels[$key] ?? $key;
                $risk = $pred['risk_label'] ?? $pred['risk_level'] ?? 'غير محدد';
                $date = $pred['date'] ?? '—';
                $lines[] = "  • {$label}: مستوى الخطورة [{$risk}] — آخر تقييم: {$date}";
            }
        }

        // ─── المتتبعات الصحية ────────────────────────────────
        if (!empty($patientContext['trackers'])) {
            $t = $patientContext['trackers'];
            $lines[] = '';
            $lines[] = '📊 المتتبعات الصحية:';
            if (isset($t['daily_steps'])) {
                $lines[] = "  • خطوات المشي: {$t['daily_steps']} ({$t['steps_label']})";
            }
            if (isset($t['blood_pressure_systolic']) && isset($t['blood_pressure_diastolic'])) {
                $lines[] = "  • ضغط الدم المتتبع: {$t['blood_pressure_systolic']}/{$t['blood_pressure_diastolic']}";
            }
            if (isset($t['weight_current'])) {
                $lines[] = "  • الوزن الحالي: {$t['weight_current']} كجم";
            }
            if (isset($t['weight_trend'])) {
                $trend = $t['weight_trend'] === 'increasing' ? 'متزايد ⬆️' : 'متناقص ⬇️';
                $lines[] = "  • اتجاه الوزن: {$trend}";
            }
            if (isset($t['latest_mood'])) {
                $lines[] = "  • المزاج الأخير: {$t['latest_mood']}";
            }
            if (!empty($t['mood_factors'])) {
                $lines[] = '  • عوامل المزاج: ' . implode('، ', $t['mood_factors']);
            }
        }

        // ─── دورة الخصوبة والحيض ─────────────────────────────
        if (!empty($patientContext['fertility_data'])) {
            $f = $patientContext['fertility_data'];
            $lines[] = '';
            $lines[] = '🌸 دورة الخصوبة والحيض:';
            if (isset($f['last_period_date']))
                $lines[] = "  • آخر دورة حيض: {$f['last_period_date']}";
            if (isset($f['cycle_length']))
                $lines[] = "  • متوسط طول الدورة: {$f['cycle_length']} يوم";
        }

        // ─── الأدوية الحالية ─────────────────────────────────
        if (!empty($patientContext['recent_medications'])) {
            $lines[] = '';
            $lines[] = '💊 الأدوية/المكملات الحالية:';
            $lines[] = '  • ' . implode('، ', $patientContext['recent_medications']);
        }

        // ─── آخر نتائج التحاليل ───────────────────────────────
        if (!empty($patientContext['lab_results'])) {
            $lines[] = '';
            $lines[] = '🔬 آخر نتائج التحاليل (آخر 3 أشهر):';
            foreach ($patientContext['lab_results'] as $test => $result) {
                $lines[] = "  • {$test}: {$result['label']} ({$result['date']})";
            }
            $lines[] = '  (إذا ذكرت المريضة أعراضاً، وجّهيها لمراجعة هذه النتائج مع طبيبتها)';
        }

        // ─── بيانات الرضيع ────────────────────────────────────
        if (!empty($patientContext['baby_data'])) {
            $b = $patientContext['baby_data'];
            $lines[] = '';
            $lines[] = '👶 بيانات المولود:';
            if (isset($b['birth_weight_kg']))
                $lines[] = "  • الوزن عند الولادة: {$b['birth_weight_kg']} كجم ({$b['birth_weight_label']})";
            if (isset($b['age_weeks']))
                $lines[] = "  • عمره الحالي: {$b['age_weeks']} أسابيع";
            if (isset($b['feeding_type']))
                $lines[] = "  • نوع التغذية: {$b['feeding_label']}";
            if (isset($b['was_in_scbu'])) {
                $scbu = $b['was_in_scbu'] ? 'نعم' : 'لا';
                $lines[] = "  • هل دخل الحضّانة (SCBU): {$scbu}";
            }
        }

        // ─── الاستشارات الطبية السابقة ───────────────────────
        if (!empty($patientContext['recent_consultations'])) {
            $lines[] = '';
            $lines[] = '🩺 الاستشارات الطبية الأخيرة (آخر 3):';
            foreach ($patientContext['recent_consultations'] as $idx => $c) {
                $num = $idx + 1;
                $lines[] = "  ─ استشارة #{$num}:";
                if (!empty($c['doctor_name']))
                    $lines[] = "    • الطبيب: {$c['doctor_name']}";
                if (!empty($c['specialty']))
                    $lines[] = "    • التخصص: {$c['specialty']}";
                if (!empty($c['type'])) {
                    $typeLabel = match ($c['type']) {
                        'video' => 'فيديو', 'audio' => 'صوتية', 'chat' => 'نصية', default => $c['type'],
                    };
                    $lines[] = "    • النوع: {$typeLabel}";
                }
                if (!empty($c['date']))
                    $lines[] = "    • التاريخ: {$c['date']}";
                if (!empty($c['patient_notes']))
                    $lines[] = "    • ملاحظات المريضة: {$c['patient_notes']}";
                if (!empty($c['doctor_notes']))
                    $lines[] = "    • ملاحظات الطبيب: {$c['doctor_notes']}";
            }
        }

        // ─── الموعد القادم ────────────────────────────────────
        if (!empty($patientContext['upcoming_appointment'])) {
            $u = $patientContext['upcoming_appointment'];
            $lines[] = '';
            $lines[] = '📅 الموعد القادم:';
            $lines[] = "  • بعد {$u['days_until']} أيام مع {$u['doctor_name']} ({$u['specialty']}) — جلسة {$u['type']}";
            $lines[] = '  (وجّهي المريضة لسؤال طبيبتها عن أي قلق تطرحه في المحادثة)';
        }

        // ─── التوجيه النهائي ─────────────────────────────────
        $lines[] = '';
        $lines[] = '╔══════════════════════════════════════════╗';
        $lines[] = '║           📌 تعليمات الاستخدام           ║';
        $lines[] = '╚══════════════════════════════════════════╝';
        $lines[] = '1. المرحلة الصحية الحالية للمريضة هي المعلومة الأساسية — خصّصي إجاباتك حولها.';
        $lines[] = '2. استخدمي البيانات أعلاه لتخصيص ردودك بناءً على حالة هذه المريضة تحديداً.';
        $lines[] = '3. أشيري للنتائج بصياغة وصفية (مثلاً: "بالنظر لنتيجة تقييمك...") لا بأرقام.';
        $lines[] = '4. إذا كانت البيانات لا علاقة لها بالسؤال، أجيبي بصورة عامة ولا تذكريها.';
        $lines[] = '5. لا تضعي البيانات أمام المستخدمة كلها دفعةً واحدة في الرد.';
        $lines[] = '6. الأولوية دائماً لسلامة المريضة — بروتوكول الطوارئ يُقدَّم على كل شيء.';

        return implode("\n", $lines);
    }

    // =========================================================================
    //  DATA BUILDERS
    // =========================================================================

    /**
     * بيانات الملف الشخصي — متاحة لجميع البوتات المتخصصة
     */
    private function buildProfileData(User $user): array
    {
        $user->load(['profile', 'lifeStage']);
        $profile = $user->profile;

        $data = [
            'age' => $profile?->age_calculated ?? $user->age,
        ];

        // === مرحلة المريضة الصحية ===
        $stageLabels = [
            'pre_marriage' => 'ما قبل الزواج',
            'pregnancy' => 'الحمل',
            'motherhood' => 'الأمومة / ما بعد الولادة',
        ];
        $botType = \App\Services\ChatbotService::getBotTypeFromStage($user->life_stage_id);
        if ($botType !== 'public') {
            $data['life_stage'] = $botType;
            $data['life_stage_label'] = $stageLabels[$botType] ?? $botType;
        }

        if ($profile) {
            if ($profile->height) {
                $data['height'] = $profile->height;
            }
            if ($profile->weight) {
                $data['weight'] = $profile->weight;
            }
            if ($profile->blood_pressure_systolic && $profile->blood_pressure_diastolic) {
                $data['blood_pressure'] = "{$profile->blood_pressure_systolic}/{$profile->blood_pressure_diastolic}";
            }
            if ($profile->bmi) {
                $data['bmi'] = $profile->bmi;
            }
            if ($profile->blood_type) {
                $data['blood_type'] = $profile->blood_type;
            }
            if (!empty($profile->chronic_diseases)) {
                $data['chronic_diseases'] = $profile->chronic_diseases;
            }
            if (!empty($profile->allergies)) {
                $data['allergies'] = $profile->allergies;
            }
            if ($profile->medical_history) {
                $data['medical_history'] = $profile->medical_history;
            }
        }

        return $data;
    }

    /**
     * بيانات الحمل النشط — لبوت pregnancy فقط
     */
    private function buildPregnancyData(User $user): ?array
    {
        $pregnancy = $user->activePregnancy;
        if (!$pregnancy) {
            return null;
        }

        $week = $pregnancy->current_week ?? now()->diffInWeeks($pregnancy->last_menstrual_period);
        $trimester = match (true) {
            $week <= 13 => 1,
            $week <= 27 => 2,
            default => 3,
        };
        $trimesterLabels = [1 => 'الثلث الأول', 2 => 'الثلث الثاني', 3 => 'الثلث الثالث'];

        return [
            'is_active' => true,
            'current_week' => $week,
            'due_date' => $pregnancy->due_date?->format('Y-m-d'),
            'trimester' => $trimester,
            'trimester_label' => $trimesterLabels[$trimester],
        ];
    }

    /**
     * بيانات آخر حمل — لبوت motherhood
     */
    private function buildPostPregnancyData(User $user): ?array
    {
        $pregnancy = $user->pregnancies()
            ->where('is_active', false)
            ->latest('delivery_date')
            ->first();

        if (!$pregnancy || !$pregnancy->delivery_date) {
            return null;
        }

        return [
            'delivery_date' => $pregnancy->delivery_date->format('Y-m-d'),
            'delivery_type' => $pregnancy->delivery_type,
            'weeks_since' => now()->diffInWeeks($pregnancy->delivery_date),
        ];
    }

    /**
     * نتائج تنبؤات ML — لا أرقام خام، وصف فقط
     * يستخدم risk_badge accessor الموجود في كل Model
     */
    private function buildPredictionsData(User $user, string $botType): array
    {
        // فقط بوت الحمل يرى التنبؤات
        if ($botType !== 'pregnancy') {
            return [];
        }

        $predictions = [];

        // GDM — سكري الحمل
        $gdm = $user->gestationalDiabetesPredictions()->latest()->first();
        if ($gdm) {
            $predictions['gdm'] = [
                'risk_level' => strtolower($gdm->risk_level ?? $gdm->risk_category ?? 'unknown'),
                'risk_label' => $gdm->risk_badge, // accessor: خطورة عالية/متوسطة/منخفضة
                'date' => $gdm->created_at->format('Y-m-d'),
                // لا probability خام هنا — القاعدة #2
            ];
        }

        // Preeclampsia — تسمم الحمل
        $pe = $user->preeclampsiaPredictions()->latest()->first();
        if ($pe) {
            $predictions['preeclampsia'] = [
                'risk_level' => strtolower($pe->risk_status ?? $pe->risk_level ?? 'unknown'),
                'risk_label' => $pe->risk_badge,
                'date' => $pe->created_at->format('Y-m-d'),
            ];
        }

        // Preterm Birth — الولادة المبكرة
        $ptb = $user->pretermBirthPredictions()->latest()->first();
        if ($ptb) {
            $predictions['preterm_birth'] = [
                'risk_level' => strtolower($ptb->risk_label ?? $ptb->risk_level ?? 'unknown'),
                'risk_label' => $ptb->risk_badge,
                'date' => $ptb->created_at->format('Y-m-d'),
            ];
        }

        // SCBU Admission — قبول وحدة رعاية المواليد
        $scbu = $user->scbuAdmissionPredictions()->latest()->first();
        if ($scbu) {
            $predictions['scbu_admission'] = [
                'risk_level' => strtolower($scbu->risk_level ?? 'unknown'),
                'risk_label' => $scbu->risk_badge,
                'date' => $scbu->created_at->format('Y-m-d'),
            ];
        }

        return $predictions;
    }

    /**
     * بيانات المتتبعات الصحية
     */
    private function buildTrackersData(User $user, string $botType): array
    {
        $trackers = [];

        // Mood — لبوت motherhood فقط
        if ($botType === 'motherhood') {
            $mood = $user->moodEntries()->latest('entry_date')->first();
            if ($mood) {
                $trackers['latest_mood'] = $mood->mood;
                if (!empty($mood->factors)) {
                    $trackers['mood_factors'] = $mood->factors;
                }
            }
        }

        // Weight — لبوت pregnancy و motherhood
        if (in_array($botType, ['pregnancy', 'motherhood'])) {
            $latestWeight = $user->weightEntries()->latest('entry_date')->first();
            if ($latestWeight) {
                $trackers['weight_current'] = $latestWeight->weight;
            }

            // اتجاه الوزن (آخر 3 إدخالات)
            $recentWeights = $user->weightEntries()
                ->latest('entry_date')
                ->take(3)
                ->pluck('weight')
                ->toArray();

            if (count($recentWeights) >= 2) {
                $trackers['weight_trend'] = $recentWeights[0] > $recentWeights[count($recentWeights) - 1]
                    ? 'increasing' : 'decreasing';
            }
        }

        // Google Fit — فقط إذا كان التكامل مفعّلاً
        if (config('services.google_fit.enabled', false)) {
            try {
                $fitService = app(\App\Services\GoogleFitService::class);

                // Assuming getDailySteps returns an integer or null
                if (method_exists($fitService, 'getDailySteps')) {
                    $steps = $fitService->getDailySteps($user);
                    if ($steps !== null) {
                        $trackers['daily_steps'] = $steps;
                        $trackers['steps_label'] = match (true) {
                            $steps < 3000 => 'نشاط منخفض جداً',
                            $steps < 6000 => 'نشاط منخفض',
                            $steps < 10000 => 'نشاط متوسط',
                            default => 'نشاط ممتاز',
                        };
                    }
                }

                // Assuming getLatestBloodPressure returns an array ['systolic' => 120, 'diastolic' => 80]
                if (method_exists($fitService, 'getLatestBloodPressure')) {
                    $bp = $fitService->getLatestBloodPressure($user);
                    if ($bp) {
                        $trackers['blood_pressure_systolic'] = $bp['systolic'] ?? null;
                        $trackers['blood_pressure_diastolic'] = $bp['diastolic'] ?? null;
                    }
                }
            } catch (\Throwable $e) {
                Log::debug('google_fit_context_failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            }
        }

        return $trackers;
    }

    /**
     * الأدوية/المكملات الحالية — لبوت pregnancy فقط
     */
    private function buildMedicationsData(User $user): array
    {
        $pregnancy = $user->activePregnancy;
        if (!$pregnancy) {
            return [];
        }

        return PregnancyMedication::where('pregnancy_id', $pregnancy->id)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();
    }

    /**
     * أقرب موعد قادم — لجميع البوتات المتخصصة
     */
    private function buildUpcomingAppointmentData(User $user): ?array
    {
        $appointment = Consultation::where('user_id', $user->id)
            ->whereIn('status', ['scheduled', 'confirmed', 'pending'])
            ->where('date', '>', now())
            ->with(['doctor:id,name,specialization'])
            ->orderBy('date')
            ->first();

        if (!$appointment) {
            return null;
        }

        return [
            'date' => $appointment->date?->format('Y-m-d'),
            'time' => $appointment->date?->format('H:i'),
            'doctor_name' => $appointment->doctor?->name,
            'specialty' => $appointment->doctor?->specialization,
            'type' => $appointment->type,
            'days_until' => now()->diffInDays($appointment->date),
        ];
    }

    /**
     * بيانات دورة الخصوبة والحيض — لبوت pre_marriage فقط
     */
    private function buildFertilityData(User $user): array
    {
        $data = [];

        $latestPeriod = $user->periodCycles()
            ->latest('start_date')
            ->first();

        if ($latestPeriod) {
            $data['last_period_date'] = $latestPeriod->start_date?->format('Y-m-d');
            $data['cycle_length'] = $latestPeriod->cycle_length ?? null;
        }

        return $data;
    }

    /**
     * آخر نتائج التحاليل المخبرية — لبوت pregnancy و motherhood
     */
    private function buildLabResultsData(User $user): array
    {
        $labResults = $user->labTestResults()
            ->whereIn('status', ['completed']) // Only consider parsed tests
            ->latest('processed_at')
            ->get();

        // We do not have structured test names currently mapped properly in the basic model structure, 
        // normally we would parse the JSON or filter by a test_name column if it existed.
        // Assuming results_json contains the required detailed structure.
        // Since we are to avoid creating fields, we will extract simply what we can from the results JSON.

        if ($labResults->isEmpty()) {
            return [];
        }

        $results = [];
        // We get the latest completed test as a sample
        $latestTest = $labResults->first();
        if (isset($latestTest->results_json['tests'])) {
            foreach ($latestTest->results_json['tests'] as $test) {
                // $test format [ 'test_name' => '...', 'value' => '...', 'unit' => '...', 'status' => '...' ]
                $testName = $test['test_name'] ?? 'Unknown Test';
                $status = $test['status'] ?? 'normal'; // fallback

                $label = match (strtolower($status)) {
                    'low' => 'منخفض عن الطبيعي',
                    'high' => 'مرتفع عن الطبيعي',
                    'normal' => 'ضمن النطاق الطبيعي',
                    default => 'غير محدد',
                };

                $results[$testName] = [
                    'status' => $status,
                    'label' => $label,
                    'date' => $latestTest->processed_at?->format('Y-m-d'),
                ];
            }
        }

        return $results;
    }

    /**
     * بيانات المولود — لبوت motherhood فقط
     * TODO: The BabyProfile / BabyData model is missing in the database.
     * This acts as a stub to be activated when the model is created.
     */
    private function buildBabyData(User $user): ?array
    {
        // $baby = $user->babyProfile()->latest()->first(); // To be implemented
        return null;
    }

    /**
     * الاستشارات الطبية المكتملة — لجميع البوتات المتخصصة

     * يجلب آخر 3 استشارات مكتملة مع ملاحظات الطبيب والمريضة
     * لا يُرسل: أسعار، روابط Zoom/Meet، بيانات الدفع
     */
    private function buildConsultationsData(User $user): array
    {
        $consultations = Consultation::where('user_id', $user->id)
            ->where('status', 'completed')
            ->with(['doctor:id,name,specialization'])
            ->latest('date')
            ->take(3)
            ->get();

        if ($consultations->isEmpty()) {
            return [];
        }

        return $consultations->map(function (Consultation $c) {
            $data = [
                'date' => $c->date?->format('Y-m-d'),
                'type' => $c->type,
            ];

            // اسم الطبيب والتخصص
            if ($c->doctor) {
                $data['doctor_name'] = $c->doctor->name;
                $specialty = $c->doctor->specialization ?? null;
                if ($specialty) {
                    $data['specialty'] = $specialty;
                }
            }

            // ملاحظات المريضة — مقتطع 200 حرف فقط (Data Minimization)
            if (!empty($c->patient_notes)) {
                $data['patient_notes'] = mb_substr(trim($c->patient_notes), 0, 200);
            }

            // ملاحظات الطبيب — مقتطع 300 حرف فقط (أهم للسياق الطبي)
            if (!empty($c->doctor_notes)) {
                $data['doctor_notes'] = mb_substr(trim($c->doctor_notes), 0, 300);
            }

            return $data;
        })->filter()->values()->toArray();
    }

    // =========================================================================
    //  DATA MINIMIZATION
    // =========================================================================

    /**
     * تصفية البيانات حسب نوع البوت — كل بوت يرى فقط ما يحتاجه
     */
    private function filterByBotType(array $context, string $botType): array
    {
        $allowed = match ($botType) {
            'pre_marriage' => ['context_version', 'generated_at', 'profile', 'recent_consultations', 'upcoming_appointment', 'fertility_data'],
            'pregnancy' => ['context_version', 'generated_at', 'profile', 'pregnancy', 'latest_predictions', 'trackers', 'recent_medications', 'recent_consultations', 'upcoming_appointment', 'lab_results'],
            'motherhood' => ['context_version', 'generated_at', 'profile', 'last_pregnancy', 'trackers', 'recent_consultations', 'upcoming_appointment', 'lab_results', 'baby_data'],
            default => [],
        };

        return array_intersect_key($context, array_flip($allowed));
    }

    // =========================================================================
    //  CACHE STRATEGY
    // =========================================================================

    /**
     * Cache key: patient_chatbot_ctx:{user_id}:{botType}
     * TTL: 30 دقيقة
     */
    private function getCacheKey(User $user, string $botType): string
    {
        $prefix = config('chatbot.patient_context.cache_prefix', 'patient_chatbot_ctx');
        return "{$prefix}:{$user->id}:{$botType}";
    }

    public function getCachedContext(User $user, string $botType): ?array
    {
        return Cache::get($this->getCacheKey($user, $botType));
    }

    public function cacheContext(User $user, string $botType, array $context): void
    {
        $ttl = config('chatbot.patient_context.cache_ttl_minutes', 30);
        Cache::put($this->getCacheKey($user, $botType), $context, now()->addMinutes($ttl));
    }

    /**
     * إلغاء Cache — يُستدعى من controllers الـ Trackers والـ Predictions
     */
    public static function invalidateCache(int $userId): void
    {
        $prefix = config('chatbot.patient_context.cache_prefix', 'patient_chatbot_ctx');
        $botTypes = ['pre_marriage', 'pregnancy', 'motherhood'];

        // Note: Make sure to call this method inside controllers for: LabTest, Consultation, FertilityEntry 
        foreach ($botTypes as $type) {
            Cache::forget("{$prefix}:{$userId}:{$type}");
        }
    }
}
