<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\LifeStage;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    use ApiResponse;

    /**
     * Get all FAQs for admin
     * GET /api/v1/admin/faqs
     */
    public function index(Request $request)
    {
        $query = Faq::with('lifeStage')->orderBy('order');

        // Filter by life stage
        if ($request->filled('life_stage_id')) {
            if ($request->life_stage_id === 'null' || $request->life_stage_id === 'general') {
                $query->whereNull('life_stage_id');
            } else {
                $query->where('life_stage_id', $request->life_stage_id);
            }
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        $faqs = $query->get();

        // Get life stages for filter dropdown
        $lifeStages = LifeStage::all()->map(fn($stage) => [
            'id' => $stage->id,
            'name' => $stage->name,
            'name_ar' => TranslationHelper::lifeStage($stage->name),
        ]);

        // Stats
        $stats = [
            'total' => Faq::count(),
            'active' => Faq::where('is_active', true)->count(),
            'inactive' => Faq::where('is_active', false)->count(),
            'general' => Faq::whereNull('life_stage_id')->count(),
        ];

        return $this->successResponse([
            'faqs' => $faqs->map(fn($faq) => $this->transformFaq($faq)),
            'life_stages' => $lifeStages,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a new FAQ
     * POST /api/v1/admin/faqs
     */
    public function store(Request $request)
    {
        $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'life_stage_id' => 'nullable|exists:life_stages,id',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ], [
            'question.required' => 'السؤال مطلوب',
            'answer.required' => 'الإجابة مطلوبة',
        ]);

        // Get next order if not provided
        $order = $request->order ?? (Faq::max('order') + 1);

        $faq = Faq::create([
            'question' => $request->question,
            'answer' => $request->answer,
            'life_stage_id' => $request->life_stage_id,
            'order' => $order,
            'is_active' => $request->is_active ?? true,
        ]);

        return $this->successResponse([
            'faq' => $this->transformFaq($faq->load('lifeStage')),
        ], 'تم إنشاء السؤال بنجاح', 201);
    }

    /**
     * Get a specific FAQ
     * GET /api/v1/admin/faqs/{id}
     */
    public function show($id)
    {
        $faq = Faq::with('lifeStage')->find($id);

        if (!$faq) {
            return $this->errorResponse('السؤال غير موجود', 404);
        }

        return $this->successResponse([
            'faq' => $this->transformFaq($faq),
        ]);
    }

    /**
     * Update a FAQ
     * PUT /api/v1/admin/faqs/{id}
     */
    public function update(Request $request, $id)
    {
        $faq = Faq::find($id);

        if (!$faq) {
            return $this->errorResponse('السؤال غير موجود', 404);
        }

        $request->validate([
            'question' => 'sometimes|required|string|max:500',
            'answer' => 'sometimes|required|string',
            'life_stage_id' => 'nullable|exists:life_stages,id',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $faq->update($request->only([
            'question', 'answer', 'life_stage_id', 'order', 'is_active'
        ]));

        return $this->successResponse([
            'faq' => $this->transformFaq($faq->load('lifeStage')),
        ], 'تم تحديث السؤال بنجاح');
    }

    /**
     * Delete a FAQ
     * DELETE /api/v1/admin/faqs/{id}
     */
    public function destroy($id)
    {
        $faq = Faq::find($id);

        if (!$faq) {
            return $this->errorResponse('السؤال غير موجود', 404);
        }

        $faq->delete();

        return $this->successResponse(null, 'تم حذف السؤال بنجاح');
    }

    /**
     * Toggle FAQ active status
     * PUT /api/v1/admin/faqs/{id}/toggle
     */
    public function toggle($id)
    {
        $faq = Faq::find($id);

        if (!$faq) {
            return $this->errorResponse('السؤال غير موجود', 404);
        }

        $faq->update([
            'is_active' => !$faq->is_active,
        ]);

        return $this->successResponse([
            'faq' => $this->transformFaq($faq->load('lifeStage')),
        ], $faq->is_active ? 'تم تفعيل السؤال' : 'تم إلغاء تفعيل السؤال');
    }

    /**
     * Reorder FAQs
     * PUT /api/v1/admin/faqs/reorder
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'faqs' => 'required|array',
            'faqs.*.id' => 'required|exists:faqs,id',
            'faqs.*.order' => 'required|integer',
        ]);

        foreach ($request->faqs as $item) {
            Faq::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return $this->successResponse(null, 'تم إعادة ترتيب الأسئلة بنجاح');
    }

    /**
     * Transform FAQ data
     */
    private function transformFaq(Faq $faq): array
    {
        return [
            'id' => $faq->id,
            'question' => $faq->question,
            'answer' => $faq->answer,
            'life_stage_id' => $faq->life_stage_id,
            'life_stage' => $faq->lifeStage ? [
                'id' => $faq->lifeStage->id,
                'name' => $faq->lifeStage->name,
                'name_ar' => TranslationHelper::lifeStage($faq->lifeStage->name),
            ] : null,
            'order' => $faq->order,
            'is_active' => $faq->is_active,
            'created_at' => $faq->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $faq->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
