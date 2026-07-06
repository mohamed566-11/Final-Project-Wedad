<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\UploadLabTestRequest;
use App\Http\Resources\Patient\LabTestResource;
use App\Jobs\ProcessLabTestJob;
use App\Models\LabTestResult;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LabTestController extends Controller
{
    use ApiResponse;

    // ─────────────────────────────────────────────────────────────────────────
    // POST /patient/lab-tests
    // رفع صورة تحليل جديدة وإطلاق الـ Job للمعالجة
    // ─────────────────────────────────────────────────────────────────────────

    public function upload(UploadLabTestRequest $request, \App\Services\LabTestOcrService $ocrService): JsonResponse
    {
        $patient = auth('patient')->user();
        $image   = $request->file('image');

        // حساب MD5 hash من محتوى الصورة قبل النقل (للـ Cache)
        $imageHash = md5_file($image->getRealPath());

        // حفظ الصورة باسم UUID عشوائي
        $extension = $image->getClientOriginalExtension();
        $filename  = Str::uuid() . '.' . $extension;
        $directory = 'lab-tests/' . $patient->id;

        Storage::disk('public')->putFileAs($directory, $image, $filename);

        $imagePath = $directory . '/' . $filename;

        // إنشاء سجل بحالة pending
        $labTest = LabTestResult::create([
            'user_id'    => $patient->id,
            'image_path' => $imagePath,
            'image_hash' => $imageHash,
            'status'     => 'pending',
        ]);

        // المعالجة المباشرة الفورية (بدون Queue بناءً على طلبك)
        try {
            $ocrService->processImage($labTest);
        } catch (\Exception $e) {
            $labTest->markAsFailed($e->getMessage());
        }

        $labTest->refresh();

        return $this->successResponse([
            'lab_test_id' => $labTest->id,
            'status'      => $labTest->status,
        ], 'تمت المعالجة بنجاح', 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /patient/lab-tests/{id}/status
    // Polling endpoint — يرجع الحالة الحالية
    // ─────────────────────────────────────────────────────────────────────────

    public function checkStatus(int $id): JsonResponse
    {
        $labTest = LabTestResult::forUser(auth('patient')->id())->find($id);

        if (!$labTest) {
            return $this->errorResponse('التحليل غير موجود', 404);
        }

        return $this->successResponse(new LabTestResource($labTest));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /patient/lab-tests
    // كل تحاليل المريضة مرتبة بالأحدث أولاً
    // ─────────────────────────────────────────────────────────────────────────

    public function index(): JsonResponse
    {
        $labTests = LabTestResult::forUser(auth('patient')->id())
            ->latest()
            ->paginate(15);

        return $this->successResponse(LabTestResource::collection($labTests));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /patient/lab-tests/{id}
    // تفاصيل تحليل واحد
    // ─────────────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $labTest = LabTestResult::forUser(auth('patient')->id())->find($id);

        if (!$labTest) {
            return $this->errorResponse('التحليل غير موجود', 404);
        }

        return $this->successResponse(new LabTestResource($labTest));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /patient/lab-tests/{id}
    // حذف التحليل + الصورة من Storage تلقائياً (boot method)
    // ─────────────────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $labTest = LabTestResult::forUser(auth('patient')->id())->find($id);

        if (!$labTest) {
            return $this->errorResponse('التحليل غير موجود', 404);
        }

        $labTest->delete(); // Boot method يحذف الصورة من Storage

        return $this->successResponse(null, 'تم حذف التحليل بنجاح');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /patient/lab-tests/latest-for-model/{model}
    // يرجع آخر OCR ناجح مفلتراً بالحقول المطلوبة للموديل المحدد
    // ─────────────────────────────────────────────────────────────────────────

    public function latestForModel(string $model): JsonResponse
    {
        // خريطة الكلمات المفتاحية لكل موديل
        $modelFieldsMap = [
            'preeclampsia' => [
                'hb' => ['hemoglobin', 'haemoglobin', 'hb', 'هيموجلوبين'],
            ],
            'preterm' => [
                'bs' => ['blood sugar', 'glucose', 'random glucose', 'bsl', 'سكر', 'جلوكوز', 'rbs'],
            ],
            'scbu' => [
                'hpg_2h'         => ['2-hour glucose', '2h glucose', 'ogtt 2h', 'glucose 2h', 'بعد ساعتين'],
                'fasting_glucose' => ['fasting glucose', 'fbs', 'fasting blood sugar', 'سكر صايم', 'صيام'],
                'vitamin_d'       => ['vitamin d', 'vit d', '25-oh', '25(oh)d', 'فيتامين د', 'cholecalciferol'],
            ],
        ];

        if (!isset($modelFieldsMap[$model])) {
            return $this->errorResponse('نوع الموديل غير صالح', 422);
        }

        // جلب آخر OCR ناجح
        $latestLabTest = LabTestResult::forUser(auth('patient')->id())
            ->where('status', 'completed')
            ->whereNotNull('result_data')
            ->latest()
            ->first();

        if (!$latestLabTest) {
            return $this->successResponse([
                'has_data'    => false,
                'lab_test_id' => null,
                'fields'      => [],
                'message'     => 'لا يوجد تحاليل مقروءة سابقة',
            ]);
        }

        $allTests  = $latestLabTest->result_data['tests'] ?? [];
        $keywords  = $modelFieldsMap[$model];
        $extracted = [];

        foreach ($keywords as $fieldName => $searchTerms) {
            foreach ($allTests as $test) {
                $testNameLower = strtolower($test['test_name'] ?? '');
                foreach ($searchTerms as $term) {
                    if (str_contains($testNameLower, strtolower($term))) {
                        $value = is_numeric($test['value']) ? (float) $test['value'] : null;
                        if ($value !== null) {
                            $extracted[$fieldName] = [
                                'value'           => $value,
                                'unit'            => $test['unit'] ?? '',
                                'test_name'       => $test['test_name'],
                                'status'          => $test['status'] ?? 'unknown',
                                'reference_range' => $test['reference_range'] ?? '',
                            ];
                        }
                        break 2;
                    }
                }
            }
        }

        return $this->successResponse([
            'has_data'      => !empty($extracted),
            'lab_test_id'   => $latestLabTest->id,
            'lab_test_date' => $latestLabTest->created_at->format('Y-m-d'),
            'fields'        => $extracted,
            'message'       => !empty($extracted)
                ? 'تم العثور على ' . count($extracted) . ' قيم من تحليلك الأخير'
                : 'لم يتم العثور على قيم مناسبة في تحليلك الأخير',
        ]);
    }

}
