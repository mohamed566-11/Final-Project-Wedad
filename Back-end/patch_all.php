<?php
// =========================================================================
// Patch 1: PublicController.php — Life Stages fallback for articles + doctors
// =========================================================================
$file = __DIR__ . '/app/Http/Controllers/Api/PublicController.php';
$content = file_get_contents($file);

$searchStart = '        // Get related articles';
$searchEnd = "            ]);\n\n        // Get FAQs";

$startPos = strpos($content, $searchStart);
$endPos = strpos($content, $searchEnd);

if ($startPos === false || $endPos === false) {
    echo "ERROR Patch1: Could not locate anchors in PublicController.php\n";
    exit(1);
}

$newSection = '        // ── المقالات ──────────────────────────────────────────────────────
        $articles = Article::where(\'life_stage_id\', $stage->id)
            ->where(\'status\', \'approved\')
            ->with([\'doctor\', \'lifeStage\'])
            ->latest()
            ->take(6)
            ->get();

        // Fallback: لو مفيش مقالات مرتبطة بهذه المرحلة جيب أحدث 3 approved
        if ($articles->isEmpty()) {
            $articles = Article::where(\'status\', \'approved\')
                ->with([\'doctor\', \'lifeStage\'])
                ->latest()
                ->take(3)
                ->get();
        }

        $articlesResource = ArticleResource::collection($articles)->resolve();

        // ── الأطباء ───────────────────────────────────────────────────────────
        $doctors = $stage->doctors()
            ->where(\'is_active\', true)
            ->whereIn(\'verification_status\', [\'approved\', \'verified\'])
            ->take(6)
            ->get();

        // Fallback: لو مفيش أطباء مربوطين بالمرحلة جيب 6 أطباء عشوائياً
        if ($doctors->isEmpty()) {
            $doctors = Doctor::where(\'is_active\', true)
                ->whereIn(\'verification_status\', [\'approved\', \'verified\'])
                ->inRandomOrder()
                ->take(6)
                ->get();
        }

        $mappedDoctors = $doctors->map(fn($doctor) => [
            \'id\'                  => $doctor->id,
            \'name\'                => $doctor->name,
            \'specialization_ar\'   => TranslationHelper::specialization($doctor->specialization),
            \'rating\'              => (float) ($doctor->rating ?? 4.5),
            \'image_url\'           => $doctor->image
                ? app(\'App\\Utils\\ImageManager\')->getImageUrl($doctor->image, \'profiles\', \'uploads\', \'profiles/default-doctor.png\')
                : url(\'profiles/default-doctor.png\'),
            \'consultation_price\'  => (float) $doctor->consultation_price,
            \'years_of_experience\' => $doctor->years_of_experience,
            \'total_consultations\' => $doctor->total_consultations ?? 0,
            \'is_available\'        => $doctor->is_available,
        ]);
';

$oldSection = substr($content, $startPos, $endPos - $startPos);
$content = str_replace($oldSection, $newSection, $content);
// Update response key from $doctors → $mappedDoctors
$content = str_replace(
    "'available_doctors' => \$doctors,",
    "'available_doctors' => \$mappedDoctors,",
    $content
);

file_put_contents($file, $content);
echo "OK: PublicController.php - Life Stages fallback applied\n";


// =========================================================================
// Patch 2: PatientDataCollectorService.php — IoT heart_rate auto-fill
// =========================================================================
$file2 = __DIR__ . '/app/Services/PatientDataCollectorService.php';
$content2 = file_get_contents($file2);

// 2a) Replace the hardcoded null heart_rate line
$content2 = str_replace(
    "            'heart_rate' => null, // Requires measurement — user must input",
    "            'heart_rate' => \$this->getLatestHeartRate(\$user), // Auto-filled from Google Fit IoT",
    $content2
);

// 2b) Add the import for PatientHeartRate after the existing imports
if (strpos($content2, 'use App\\Models\\PatientHeartRate;') === false) {
    $content2 = str_replace(
        'use App\\Models\\WeightEntry;',
        "use App\\Models\\WeightEntry;\nuse App\\Models\\PatientHeartRate;",
        $content2
    );
}

// 2c) Add getLatestHeartRate() method after getLatestWeight() method
$insertAfter = '        return $profile?->weight;
    }';

$newMethod = '        return $profile?->weight;
    }

    /**
     * جلب آخر قراءة heart rate من Google Fit (جدول patient_heart_rates)
     * يرجع null لو المريضة لم تربط Google Fit أو لا توجد قراءات
     */
    private function getLatestHeartRate(User $user): ?float
    {
        $latest = PatientHeartRate::where(\'user_id\', $user->id)
            ->latest(\'timestamp\')
            ->first();

        return $latest?->heart_rate_bpm;
    }';

$content2 = str_replace($insertAfter, $newMethod, $content2);

file_put_contents($file2, $content2);
echo "OK: PatientDataCollectorService.php - heart_rate auto-fill applied\n";


// =========================================================================
// Patch 3: LabTestController.php — latestForModel() endpoint
// =========================================================================
$file3 = __DIR__ . '/app/Http/Controllers/Api/Patient/LabTestController.php';
$content3 = file_get_contents($file3);

// Add the new method before the closing brace of the class
$newMethod3 = '
    // ─────────────────────────────────────────────────────────────────────────
    // GET /patient/lab-tests/latest-for-model/{model}
    // يرجع آخر OCR ناجح مفلتراً بالحقول المطلوبة للموديل المحدد
    // ─────────────────────────────────────────────────────────────────────────

    public function latestForModel(string $model): JsonResponse
    {
        // خريطة الكلمات المفتاحية لكل موديل
        $modelFieldsMap = [
            \'preeclampsia\' => [
                \'hb\' => [\'hemoglobin\', \'haemoglobin\', \'hb\', \'هيموجلوبين\'],
            ],
            \'preterm\' => [
                \'bs\' => [\'blood sugar\', \'glucose\', \'random glucose\', \'bsl\', \'سكر\', \'جلوكوز\', \'rbs\'],
            ],
            \'scbu\' => [
                \'hpg_2h\'         => [\'2-hour glucose\', \'2h glucose\', \'ogtt 2h\', \'glucose 2h\', \'بعد ساعتين\'],
                \'fasting_glucose\' => [\'fasting glucose\', \'fbs\', \'fasting blood sugar\', \'سكر صايم\', \'صيام\'],
                \'vitamin_d\'       => [\'vitamin d\', \'vit d\', \'25-oh\', \'25(oh)d\', \'فيتامين د\', \'cholecalciferol\'],
            ],
        ];

        if (!isset($modelFieldsMap[$model])) {
            return $this->errorResponse(\'نوع الموديل غير صالح\', 422);
        }

        // جلب آخر OCR ناجح
        $latestLabTest = LabTestResult::forUser(auth(\'patient\')->id())
            ->where(\'status\', \'completed\')
            ->whereNotNull(\'result_data\')
            ->latest()
            ->first();

        if (!$latestLabTest) {
            return $this->successResponse([
                \'has_data\'    => false,
                \'lab_test_id\' => null,
                \'fields\'      => [],
                \'message\'     => \'لا يوجد تحاليل مقروءة سابقة\',
            ]);
        }

        $allTests  = $latestLabTest->result_data[\'tests\'] ?? [];
        $keywords  = $modelFieldsMap[$model];
        $extracted = [];

        foreach ($keywords as $fieldName => $searchTerms) {
            foreach ($allTests as $test) {
                $testNameLower = strtolower($test[\'test_name\'] ?? \'\');
                foreach ($searchTerms as $term) {
                    if (str_contains($testNameLower, strtolower($term))) {
                        $value = is_numeric($test[\'value\']) ? (float) $test[\'value\'] : null;
                        if ($value !== null) {
                            $extracted[$fieldName] = [
                                \'value\'           => $value,
                                \'unit\'            => $test[\'unit\'] ?? \'\',
                                \'test_name\'       => $test[\'test_name\'],
                                \'status\'          => $test[\'status\'] ?? \'unknown\',
                                \'reference_range\' => $test[\'reference_range\'] ?? \'\',
                            ];
                        }
                        break 2;
                    }
                }
            }
        }

        return $this->successResponse([
            \'has_data\'      => !empty($extracted),
            \'lab_test_id\'   => $latestLabTest->id,
            \'lab_test_date\' => $latestLabTest->created_at->format(\'Y-m-d\'),
            \'fields\'        => $extracted,
            \'message\'       => !empty($extracted)
                ? \'تم العثور على \' . count($extracted) . \' قيم من تحليلك الأخير\'
                : \'لم يتم العثور على قيم مناسبة في تحليلك الأخير\',
        ]);
    }
';

// Insert before the last closing brace of the class
$lastBrace = strrpos($content3, '}');
$content3 = substr_replace($content3, $newMethod3 . "\n", $lastBrace, 0);

file_put_contents($file3, $content3);
echo "OK: LabTestController.php - latestForModel() added\n";

echo "\nAll 3 backend patches applied successfully!\n";
