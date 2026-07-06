<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pregnancy;
use App\Models\PatientMedicalFile;
use App\Models\WeightEntry;
use App\Models\LifeStage;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Utils\ImageManager;
use App\Models\PregnancyMedication;
use App\Models\PregnancyKickSession;
use App\Services\Patient\PatientDataCollectorService;

class PregnancyController extends Controller
{
    use ApiResponse;

    // Start a new pregnancy
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'last_menstrual_period' => 'required|date|before_or_equal:today',
            'conception_date' => 'nullable|date|after:last_menstrual_period',
            'due_date' => 'nullable|date|after:last_menstrual_period',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation Error', 422, $validator->errors());
        }

        $user = $request->user();

        // Logic
        $lmp = Carbon::parse($request->last_menstrual_period);
        $conceptionDate = $request->conception_date
            ? Carbon::parse($request->conception_date)
            : $lmp->copy()->addDays(14);

        $dueDate = $request->due_date
            ? Carbon::parse($request->due_date)
            : $lmp->copy()->addDays(280);

        // Calculate current week
        $currentWeek = floor($lmp->diffInDays(Carbon::today()) / 7);
        if ($currentWeek < 0)
            $currentWeek = 0; // Should not happen with validation but safe check
        if ($currentWeek > 42)
            $currentWeek = 42;

        // Deactivate active pregnancies
        Pregnancy::where('user_id', $user->id)->where('is_active', true)->update(['is_active' => false]);

        // Update Life Stage to "motherhood" (id=3)
        $motherhoodStage = LifeStage::where('slug', 'motherhood')->first();
        if ($motherhoodStage) {
            $user->update(['life_stage_id' => $motherhoodStage->id]);
        }

        $pregnancy = Pregnancy::create([
            'user_id' => $user->id,
            'last_menstrual_period' => $lmp,
            'conception_date' => $conceptionDate,
            'due_date' => $dueDate,
            'current_week' => $currentWeek,
            'is_active' => true,
            'pregnancy_status' => 'ongoing',
            'notes' => $request->notes,
        ]);

        // Calculate extra fields for response
        $daysPregnant = $lmp->diffInDays(Carbon::today());
        $weeksRemaining = 40 - $currentWeek;
        $daysRemaining = Carbon::today()->diffInDays($dueDate);
        $trimester = $this->calculateTrimester($currentWeek);

        $data = $pregnancy->toArray();
        $data['days_pregnant'] = $daysPregnant;
        $data['weeks_remaining'] = $weeksRemaining;
        $data['days_remaining'] = $daysRemaining;
        $data['trimester'] = $trimester;

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache($user->id);

        return $this->successResponse($data, 'Pregnancy started successfully', 201);
    }

    // Get current pregnancy details
    public function current(Request $request)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$pregnancy) {
            return $this->errorResponse('No active pregnancy found', 404);
        }

        // Recalculate weeks dynamically
        $lmp = Carbon::parse($pregnancy->last_menstrual_period);
        $daysPregnant = $lmp->diffInDays(Carbon::today());
        $currentWeek = (int) floor($daysPregnant / 7);
        $currentDay = $daysPregnant % 7;

        // Update stored week dynamically
        if ($pregnancy->current_week !== $currentWeek) {
            $pregnancy->update(['current_week' => $currentWeek]);
        }

        $dueDate = Carbon::parse($pregnancy->due_date);
        $daysRemaining = Carbon::today()->diffInDays($dueDate, false); // false to allow negative if overdue
        $weeksRemaining = 40 - $currentWeek;
        $trimester = $this->calculateTrimester($currentWeek);

        // Calculate progress in trimester
        $trimesterStartWeek = [1 => 0, 2 => 14, 3 => 28];
        $trimesterEndWeek = [1 => 13, 2 => 27, 3 => 40];
        $start = $trimesterStartWeek[$trimester];
        $end = $trimesterEndWeek[$trimester];
        $totalTrimesterWeeks = $end - $start;
        $weeksIntoTrimester = $currentWeek - $start;
        $trimesterProgress = 0;
        if ($totalTrimesterWeeks > 0) {
            $trimesterProgress = min(100, max(0, ($weeksIntoTrimester / $totalTrimesterWeeks) * 100));
        }

        // Stats
        $totalEntries = $pregnancy->entries()->count();
        $lastEntry = $pregnancy->entries()->latest('entry_date')->first();

        // --- Smart Weight Logic ---

        // 1. Current Weight
        // Priority: Latest Pregnancy Entry -> Latest Weight Entry -> Profile Weight
        $lastPregnancyWeight = $pregnancy->entries()->whereNotNull('weight')->latest('entry_date')->value('weight');
        $lastGeneralWeight = WeightEntry::where('user_id', $pregnancy->user_id)->latest('entry_date')->value('weight');
        $profileWeight = $pregnancy->patient->profile->weight ?? null;

        $currentWeight = $lastPregnancyWeight ?? $lastGeneralWeight ?? $profileWeight;

        // 2. Starting Weight
        // Priority: First Pregnancy Entry -> Weight record near LMP -> Profile Weight (if no change detected)
        $firstPregnancyWeight = $pregnancy->entries()->whereNotNull('weight')->oldest('entry_date')->value('weight');

        // Find general weight around Start of Pregnancy (LMP +/- 4 weeks)
        $startGeneralWeight = WeightEntry::where('user_id', $pregnancy->user_id)
            ->whereBetween('entry_date', [
                $pregnancy->last_menstrual_period->copy()->subWeeks(4)->format('Y-m-d'),
                $pregnancy->last_menstrual_period->copy()->addWeeks(12)->format('Y-m-d')
            ])
            ->get()
            ->sortBy(function($entry) use ($pregnancy) {
                return abs(Carbon::parse($entry->entry_date)->diffInDays($pregnancy->last_menstrual_period));
            })
            ->first()?->weight;

        $startingWeight = $firstPregnancyWeight ?? $startGeneralWeight ?? $profileWeight; // Use profile as last resort

        // Calculate Gain
        $weightGained = ($startingWeight && $currentWeight) ? $currentWeight - $startingWeight : 0;

        $response = [
            'id' => $pregnancy->id,
            'last_menstrual_period' => $pregnancy->last_menstrual_period->format('Y-m-d'),
            'due_date' => $pregnancy->due_date->format('Y-m-d'),
            'current_week' => $currentWeek,
            'current_day' => $currentDay,
            'days_pregnant' => $daysPregnant,
            'weeks_remaining' => $weeksRemaining,
            'days_remaining' => $daysRemaining,
            'trimester' => $trimester,
            'trimester_progress' => round($trimesterProgress),
            'pregnancy_status' => $pregnancy->pregnancy_status,
            'baby_development' => $this->getBabyInfo($currentWeek),
            'stats' => [
                'total_entries' => $totalEntries,
                'last_entry_date' => $lastEntry ? $lastEntry->entry_date->format('Y-m-d') : null,
                'current_weight' => $currentWeight,
                'total_gain' => $weightGained
            ]
        ];

        return $this->successResponse($response, 'Current pregnancy retrieved successfully');
    }

    // Add entry
    public function storeEntry(Request $request)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$pregnancy) {
            return $this->errorResponse('No active pregnancy found', 404);
        }

        $validator = Validator::make($request->all(), [
            'week_number' => 'nullable|integer|min:1|max:42',
            'weight' => 'nullable|numeric|min:30|max:200',
            'blood_pressure_systolic' => 'nullable|integer|min:60|max:250',
            'blood_pressure_diastolic' => 'nullable|integer|min:40|max:160',
            'symptoms' => 'nullable|array',
            'notes' => 'nullable|string|max:2000',
            'entry_date' => 'nullable|date|before_or_equal:today',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation Error', 422, $validator->errors());
        }

        // Calculate week number if not provided
        $weekNumber = $request->week_number;
        if (!$weekNumber) {
            $lmp = Carbon::parse($pregnancy->last_menstrual_period);
            $entryDate = $request->entry_date ? Carbon::parse($request->entry_date) : Carbon::today();
            $weekNumber = floor($lmp->diffInDays($entryDate) / 7);
        }

        $entry = $pregnancy->entries()->create([
            'week_number' => $weekNumber,
            'weight' => $request->weight,
            'blood_pressure_systolic' => $request->blood_pressure_systolic,
            'blood_pressure_diastolic' => $request->blood_pressure_diastolic,
            'symptoms' => $request->symptoms,
            'notes' => $request->notes,
            'entry_date' => $request->entry_date ?? Carbon::today(),
        ]);

        // Sync with General Weight Tracker and Profile
        if ($request->weight || $request->blood_pressure_systolic || $request->blood_pressure_diastolic) {
            if ($request->weight) {
                WeightEntry::create([
                    'user_id' => $request->user()->id,
                    'weight' => $request->weight,
                    'height' => $request->user()->profile->height ?? null,
                    'entry_date' => $request->entry_date ?? Carbon::today(),
                    'entry_time' => now(),
                    'notes' => 'سجل حمل - أسبوع ' . $weekNumber,
                ]);
            }

            // Update Profile
            if ($request->user()->profile) {
                $updateData = [];
                if ($request->weight)
                    $updateData['weight'] = $request->weight;
                if ($request->blood_pressure_systolic)
                    $updateData['blood_pressure_systolic'] = $request->blood_pressure_systolic;
                if ($request->blood_pressure_diastolic)
                    $updateData['blood_pressure_diastolic'] = $request->blood_pressure_diastolic;

                if (!empty($updateData)) {
                    $request->user()->profile->update($updateData);
                }
            }
        }

        // Alerts logic (Basic)
        $alerts = [];
        if ($request->blood_pressure_systolic >= 140 || $request->blood_pressure_diastolic >= 90) {
            $alerts[] = 'ارتفاع ضغط الدم - استشيري طبيبك';
        }

        $data = $entry->toArray();
        $data['alerts'] = $alerts;

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache($request->user()->id);

        return $this->successResponse($data, 'Pregnancy entry added successfully', 201);
    }

    // Get weeks list (entries)
    public function entries(Request $request)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$pregnancy) {
            // Check if asking for a specific pregnancy or just return empty
            return $this->successResponse(['entries' => [], 'summary' => null]);
        }

        $query = $pregnancy->entries()->orderBy('week_number', 'desc');

        if ($request->has('start_week'))
            $query->where('week_number', '>=', $request->start_week);
        if ($request->has('end_week'))
            $query->where('week_number', '<=', $request->end_week);

        $entries = $query->get();

        // Summary
        $weights = $entries->whereNotNull('weight')->pluck('weight');
        $avgWeight = $weights->avg();
        $totalGain = $weights->count() > 1 ? $weights->first() - $weights->last() : 0; // Desc order, so first is latest

        $summary = [
            'total_entries' => $entries->count(),
            'weeks_tracked' => $entries->pluck('week_number')->unique()->values(),
            'average_weight' => $avgWeight,
            'total_weight_gain' => $totalGain, // simplified
        ];

        return $this->successResponse(['entries' => $entries, 'summary' => $summary]);
    }

    // Delete a single entry
    public function deleteEntry(Request $request, $id)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$pregnancy) {
            return $this->errorResponse('لا يوجد حمل نشط', 404);
        }

        $entry = $pregnancy->entries()->find($id);

        if (!$entry) {
            return $this->errorResponse('التسجيل غير موجود', 404);
        }

        $entry->delete();

        return $this->successResponse(null, 'تم حذف التسجيل بنجاح');
    }

    protected $imageManager;

    public function __construct(ImageManager $imageManager)
    {
        $this->imageManager = $imageManager;
    }

    // Upload file
    public function uploadFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'category' => 'required|in:lab_result,ultrasound,x_ray,prescription,medical_report,other',
            'description' => 'nullable|string',
            'file_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation Error', 422, $validator->errors());
        }

        $user = $request->user();

        $pregnancy = Pregnancy::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        // Create user specific folder path: medical-files/{user_id}
        $folderPath = 'medical-files/' . $user->id;

        $file = $request->file('file');
        $fileName = '';
        $filePath = '';
        $fileExtension = $file->getClientOriginalExtension();

        // Handle Images using ImageManager (for validation and naming consistency)
        if (in_array(strtolower($fileExtension), ['jpg', 'jpeg', 'png', 'webp'])) {
            try {
                $fileName = $this->imageManager->uploadSingleImage($file, $folderPath, 'public');
                $filePath = Storage::url($folderPath . '/' . $fileName);
            } catch (\Exception $e) {
                Log::error('Image upload error: ' . $e->getMessage());
                return $this->errorResponse('فشل في رفع الصورة، يرجى المحاولة لاحقاً', 500);
            }
        } else {
            // Handle Non-Image files (PDFs)
            // Use similar naming convention for consistency using ImageManager helper if public, or just unique ID
            $fileName = $this->imageManager->generateImageName($file);
            $file->storeAs($folderPath, $fileName, 'public');
            $filePath = Storage::url($folderPath . '/' . $fileName);
        }

        $medicalFile = PatientMedicalFile::create([
            'user_id' => $user->id,
            'pregnancy_id' => $pregnancy ? $pregnancy->id : null,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $fileExtension,
            'file_size' => $file->getSize(),
            'category' => $request->category,
            'description' => $request->description,
            'file_date' => $request->file_date ?? Carbon::today(),
        ]);

        return $this->successResponse($medicalFile, 'File uploaded successfully', 201);
    }

    // Get Files
    public function getFiles(Request $request)
    {
        $query = PatientMedicalFile::where('user_id', $request->user()->id);

        if ($request->category) {
            $query->where('category', $request->category);
        }
        // Filter by pregnancy if needed, or return all history

        $files = $query->latest('file_date')->get();
        $grouped = $files->groupBy('category')->map->count();

        return $this->successResponse(['files' => $files, 'grouped_by_category' => $grouped]);
    }

    public function deleteFile($id, Request $request)
    {
        $file = PatientMedicalFile::where('user_id', $request->user()->id)->find($id);
        if (!$file)
            return $this->errorResponse('File not found', 404);

        // Delete from storage (need to parse path back to relative)
        // Assuming simple storage for now
        $file->delete();
        return $this->successResponse(null, 'File deleted successfully');
    }

    public function complete(Request $request, $id)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)->find($id);
        if (!$pregnancy)
            return $this->errorResponse('Pregnancy not found', 404);

        $validator = Validator::make($request->all(), [
            'delivery_date' => 'required|date',
            'delivery_type' => 'required|in:normal,cesarean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation Error', 422, $validator->errors());
        }

        $pregnancy->update([
            'is_active' => false,
            'pregnancy_status' => 'completed',
            'delivery_date' => $request->delivery_date,
            'delivery_type' => $request->delivery_type,
            'notes' => $request->notes,
        ]);

        // Update Life Stage back to "married-life" (id=2) after completing pregnancy
        $marriedStage = LifeStage::where('slug', 'married-life')->first();
        if ($marriedStage) {
            $request->user()->update(['life_stage_id' => $marriedStage->id]);
        }

        // إلغاء Cache سياق الشات بوت
        PatientDataCollectorService::invalidateCache($request->user()->id);

        return $this->successResponse($pregnancy, 'Pregnancy completed successfully');
    }

    public function history(Request $request)
    {
        $pregnancies = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', false)
            ->withCount('entries')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($pregnancies);
    }

    // Helper for Trimester
    private function calculateTrimester($week)
    {
        if ($week <= 13)
            return 1;
        if ($week <= 27)
            return 2;
        return 3;
    }

    // Helper for Content (Dummy data for now)
    private function getBabyInfo($week)
    {
        // Simple mapping, normally from DB or JSON
        $sizes = [
            1 => ['size_comparison' => 'بذرة صغيرة', 'length_cm' => 0, 'weight_grams' => 0],
            17 => ['size_comparison' => 'الرمانة', 'length_cm' => 13, 'weight_grams' => 150],
            20 => ['size_comparison' => 'الموز', 'length_cm' => 25, 'weight_grams' => 300],
            // ... add specific ones or default
        ];

        return $sizes[$week] ?? [
            'size_comparison' => 'تنمو',
            'length_cm' => $week * 0.8, // Rough estimate
            'weight_grams' => $week * 10 // Rough estimate
        ];
    }



    public function weekInfo(Request $request, $number)
    {
        $weekData = $this->getDetailedWeekData($number);
        return $this->successResponse($weekData);
    }

    private function getDetailedWeekData($week)
    {
        // This simulates a database lookup. In a real app, this should be in a DB table 'pregnancy_weeks_content'

        // Base structure
        $data = [
            'week_number' => (int) $week,
            'trimester' => $this->calculateTrimester($week),
            'baby_development' => $this->getBabyInfo($week),
            'mother_changes' => [],
            'symptoms_to_expect' => [],
            'medical_tips' => [],
            'nutrition_tips' => [],
            'warning_signs' => [],
            'checklist' => []
        ];

        // Custom content based on trimester/week
        if ($week <= 13) {
            // First Trimester
            $data['mother_changes'] = [
                'تغيرات هرمونية سريعة',
                'الشعور بالتعب والإرهاق',
                'زيادة طفيفة في الوزن أو نقصانه'
            ];
            $data['symptoms_to_expect'] = ['غثيان الصباح', 'كثرة التبول', 'تقلب المزاج'];
            $data['medical_tips'] = ['تناول حمض الفوليك يومياً', 'تجنب الأدوية دون استشارة', 'شرب كميات كافية من الماء'];
            $data['nutrition_tips'] = ['التركيز على الخضروات الورقية', 'تناول وجبات صغيرة ومتعددة', 'تجنب الكافيين الزائد'];
            $data['warning_signs'] = ['نزيف شديد', 'آلام حادة في البطن'];

            if ($week == 12) {
                $data['checklist'][] = ['item' => 'إجراء فحص الشفافة القفوية (Nuchal Translucency)', 'is_due' => true];
            }
        } elseif ($week <= 27) {
            // Second Trimester
            $data['mother_changes'] = [
                'بدء ظهور بطن الحمل بوضوح',
                'الشعور بأول حركات الجنين (بين الأسبوع 16-25)',
                'ازدياد الشهية للطعام'
            ];
            $data['symptoms_to_expect'] = ['آلام الظهر', 'حرقة المعدة', 'تصبغات الجلد (الكلف)'];
            $data['medical_tips'] = ['مراقبة ضغط الدم بانتظام', 'الذهاب لمواعيد المتابعة الشهرية', 'عمل فحص السونار التفصيلي'];
            $data['nutrition_tips'] = ['زيادة تناول الكالسيوم (حليب، أجبان)', 'تناول الأطعمة الغنية بالحديد', 'أخذ أوميغا 3 لتطور مخ الجنين'];
            $data['warning_signs'] = ['توقف حركة الجنين', 'نزول سوائل مائية'];

            if ($week >= 24 && $week <= 28) {
                $data['checklist'][] = ['item' => 'فحص تحمل الجلوكوز (سكر الحمل)', 'is_due' => true];
            }
        } else {
            // Third Trimester
            $data['mother_changes'] = [
                'ضيق التنفس بسبب ضغط الرحم',
                'صعوبة في النوم',
                'انقباضات براكستون هيكس (تجهيزية)'
            ];
            $data['symptoms_to_expect'] = ['تورم القدمين', 'كثرة التبول مرة أخرى', 'آلام الحوض'];
            $data['medical_tips'] = ['متابعة ركلات الجنين يومياً', 'تجهيز حقيبة الولادة', 'معرفة علامات المخاض الحقيقي'];
            $data['nutrition_tips'] = ['تناول التمر (في الأسابيع الأخيرة)', 'وجبات خفيفة غنية بالطاقة', 'تجنب الأطعمة المالحة لتقليل التورم'];
            $data['warning_signs'] = ['نزيف', 'صداع شديد وزغللة (تسمم حمل)', 'انقباضات منتظمة ومؤلمة'];

            if ($week == 36) {
                $data['checklist'][] = ['item' => 'فحص بكتيريا المجموعة ب (GBS)', 'is_due' => true];
            }
        }

        // Add general checklist item
        $data['checklist'][] = ['item' => 'تناول فيتامينات الحمل', 'is_due' => false];

        return $data;
    }
    public function stats(Request $request)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$pregnancy)
            return $this->errorResponse('No active pregnancy', 404);

        $entries = $pregnancy->entries;

        // Smart Weight Logic (Unified with current())
        $lastPregnancyWeight = $pregnancy->entries()->whereNotNull('weight')->latest('entry_date')->value('weight');
        $lastGeneralWeight = \App\Models\WeightEntry::where('user_id', $pregnancy->user_id)->latest('entry_date')->value('weight');
        $profileWeight = $pregnancy->patient->profile->weight ?? null;
        $currentWeight = $lastPregnancyWeight ?? $lastGeneralWeight ?? $profileWeight ?? 0;

        $firstPregnancyWeight = $pregnancy->entries()->whereNotNull('weight')->oldest('entry_date')->value('weight');
        $startGeneralWeight = \App\Models\WeightEntry::where('user_id', $pregnancy->user_id)
            ->whereBetween('entry_date', [
                $pregnancy->last_menstrual_period->copy()->subWeeks(4)->format('Y-m-d'),
                $pregnancy->last_menstrual_period->copy()->addWeeks(12)->format('Y-m-d')
            ])
            ->get()
            ->sortBy(function($entry) use ($pregnancy) {
                return abs(Carbon::parse($entry->entry_date)->diffInDays($pregnancy->last_menstrual_period));
            })
            ->first()?->weight;

        $firstWeight = $firstPregnancyWeight ?? $startGeneralWeight ?? $profileWeight ?? 0;

        $weightStats = [
            'starting_weight' => $firstWeight,
            'current_weight' => $currentWeight,
            'total_gain' => ($currentWeight && $firstWeight && $firstWeight > 0) ? $currentWeight - $firstWeight : 0,
            'average_weekly_gain' => 0.5, // Calc properly if needed
            'recommended_total_gain' => '11-16',
            'is_on_track' => true
        ];

        // BP Stats
        $avgSystolic = $entries->avg('blood_pressure_systolic');
        $avgDiastolic = $entries->avg('blood_pressure_diastolic');

        // Symptoms Stats
        $allSymptoms = [];
        foreach ($entries as $entry) {
            if ($entry->symptoms) {
                // Ensure array
                $syms = is_string($entry->symptoms) ? json_decode($entry->symptoms, true) : $entry->symptoms;
                if (is_array($syms))
                    $allSymptoms = array_merge($allSymptoms, $syms);
            }
        }
        $symptomCounts = array_count_values($allSymptoms);
        $mostFrequent = [];
        foreach ($symptomCounts as $sym => $count) {
            $mostFrequent[] = ['symptom' => $sym, 'count' => $count];
        }

        return $this->successResponse([
            'weight_stats' => $weightStats,
            'blood_pressure_stats' => [
                'average_systolic' => round($avgSystolic),
                'average_diastolic' => round($avgDiastolic),
                'concern_level' => 'normal'
            ],
            'symptoms_stats' => [
                'total_unique_symptoms' => count($symptomCounts),
                'most_frequent' => $mostFrequent
            ],
            'milestones_completed' => [],
            'upcoming_milestones' => []
        ]);
    }

    public function weeksInfo(Request $request)
    {
        $weeks = [];
        for ($i = 1; $i <= 40; $i++) {
            $weeks[] = [
                'week_number' => $i,
                'trimester' => $this->calculateTrimester($i),
                'size_baby' => $this->getBabyInfo($i)['size_comparison'],
                'summary' => 'معلومات مختصرة عن الأسبوع ' . $i,
                'image_url' => ''
            ];
        }
        return $this->successResponse(['weeks' => $weeks]);
    }


    public function weightChart(Request $request)
    {
        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$pregnancy)
            return $this->errorResponse('No active pregnancy', 404);

        // Get all weight entries for this pregnancy, ordered by date
        $entries = $pregnancy->entries()
            ->whereNotNull('weight')
            ->orderBy('week_number')
            ->get(['week_number', 'weight', 'entry_date']);

        $chartData = $entries->map(function ($entry) {
            return [
                'week' => $entry->week_number,
                'weight' => (float) $entry->weight,
                'date' => $entry->entry_date
            ];
        });

        // Determine starting weight (Week 0-1 or just index 0)
        // If no entry for early weeks, use the first available one as start base
        $startingWeight = $chartData->first()['weight'] ?? 60; // Default fallback

        // Generate recommended range (using standard Guidelines: +0.3-0.5kg per week after week 12)
        // This is a simplified calculation. Real medical apps use BMI-based curves.
        $recommendedRange = [];
        $maxWeeks = 40;

        for ($i = 1; $i <= $maxWeeks; $i++) {
            // First trimester little to no gain
            if ($i <= 12) {
                $min = $startingWeight;
                $max = $startingWeight + 2;
            } else {
                // 0.3 - 0.5 per week
                $weeksPassed = $i - 12;
                $min = $startingWeight + ($weeksPassed * 0.3);
                $max = $startingWeight + 2 + ($weeksPassed * 0.5);
            }

            $recommendedRange[] = [
                'week' => $i,
                'min' => round($min, 1),
                'max' => round($max, 1)
            ];
        }

        return $this->successResponse([
            'chart_data' => $chartData,
            'recommended_range_data' => $recommendedRange,
            'current_status' => 'within_range' // Logic can be added to check last weight against range
        ]);
    }

    // --- Medications ---

    public function getMedications(Request $request)
    {
        $meds = PregnancyMedication::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->get();
        return $this->successResponse($meds);
    }

    public function addMedication(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'dosage' => 'nullable|string',
            'frequency' => 'required|string', // daily, etc
            'time_of_day' => 'nullable',
        ]);

        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $med = PregnancyMedication::create([
            'user_id' => $request->user()->id,
            'pregnancy_id' => $pregnancy ? $pregnancy->id : null,
            'name' => $request->name,
            'dosage' => $request->dosage,
            'frequency' => $request->frequency,
            'time_of_day' => $request->time_of_day,
            'notes' => $request->notes,
        ]);

        return $this->successResponse($med, 'تم إضافة الدواء بنجاح');
    }

    public function toggleMedicationTaken(Request $request, $id)
    {
        $med = PregnancyMedication::where('user_id', $request->user()->id)->findOrFail($id);

        // If taken today, untake. If not, take.
        $isTakenToday = $med->last_taken_at && Carbon::parse($med->last_taken_at)->isToday();

        if ($isTakenToday) {
            $med->update(['last_taken_at' => null]);
            $message = 'تم إلغاء تسجيل الجرعة';
        } else {
            $med->update(['last_taken_at' => now()]);
            $message = 'تم تسجيل أخذ الجرعة';
        }

        return $this->successResponse($med, $message);
    }

    public function deleteMedication(Request $request, $id)
    {
        $med = PregnancyMedication::where('user_id', $request->user()->id)->findOrFail($id);
        $med->delete();
        return $this->successResponse(null, 'تم حذف الدواء');
    }

    // --- Kick Counter ---

    public function getKickSessions(Request $request)
    {
        $sessions = PregnancyKickSession::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return $this->successResponse($sessions);
    }

    public function storeKickSession(Request $request)
    {
        $request->validate([
            'kick_count' => 'required|integer',
            'duration_seconds' => 'required|integer',
            'started_at' => 'required|date',
            'ended_at' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        $pregnancy = Pregnancy::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $session = PregnancyKickSession::create([
            'user_id' => $request->user()->id,
            'pregnancy_id' => $pregnancy ? $pregnancy->id : null,
            'kick_count' => $request->kick_count,
            'duration_seconds' => $request->duration_seconds,
            'started_at' => $request->started_at,
            'ended_at' => $request->ended_at,
            'notes' => $request->notes
        ]);

        return $this->successResponse($session, 'تم حفظ جلسة الركلات بنجاح');
    }

    public function deleteKickSession(Request $request, $id)
    {
        $session = PregnancyKickSession::where('user_id', $request->user()->id)->findOrFail($id);
        $session->delete();
        return $this->successResponse(null, 'تم حذف الجلسة');
    }
}
