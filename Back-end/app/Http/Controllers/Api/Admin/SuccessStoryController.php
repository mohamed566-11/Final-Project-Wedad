<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SuccessStory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SuccessStoryController extends Controller
{
    /**
     * Display a listing of success stories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SuccessStory::query();

        // Filter by life stage
        if ($request->has('life_stage') && $request->life_stage) {
            $query->where('life_stage', $request->life_stage);
        }

        // Filter by featured
        if ($request->has('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }

        // Filter by active
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('patient_name', 'like', "%{$search}%")
                  ->orWhere('story', 'like', "%{$search}%");
            });
        }

        $stories = $query->orderBy('order')
                         ->orderByDesc('is_featured')
                         ->orderByDesc('created_at')
                         ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $stories,
        ]);
    }

    /**
     * Store a newly created success story.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'patient_image' => 'nullable|image|max:2048',
            'story' => 'required|string',
            'short_story' => 'nullable|string|max:500',
            'life_stage' => 'nullable|in:pre-marriage,married-life,motherhood',
            'rating' => 'integer|min:1|max:5',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        // Handle image upload
        if ($request->hasFile('patient_image')) {
            $filename = Str::uuid() . '.' . $request->file('patient_image')->getClientOriginalExtension();
            $path = $request->file('patient_image')->storeAs('success-stories', $filename, 'public');
            $validated['patient_image'] = $path;
        }

        $story = SuccessStory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة قصة النجاح بنجاح',
            'data' => $story,
        ], 201);
    }

    /**
     * Display the specified success story.
     */
    public function show(SuccessStory $successStory): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $successStory,
        ]);
    }

    /**
     * Update the specified success story.
     */
    public function update(Request $request, SuccessStory $successStory): JsonResponse
    {
        $validated = $request->validate([
            'patient_name' => 'sometimes|required|string|max:255',
            'patient_image' => 'nullable|image|max:2048',
            'story' => 'sometimes|required|string',
            'short_story' => 'nullable|string|max:500',
            'life_stage' => 'nullable|in:pre-marriage,married-life,motherhood',
            'rating' => 'integer|min:1|max:5',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        // Handle image upload
        if ($request->hasFile('patient_image')) {
            // Delete old image
            if ($successStory->patient_image) {
                Storage::disk('public')->delete($successStory->patient_image);
            }
            $filename = Str::uuid() . '.' . $request->file('patient_image')->getClientOriginalExtension();
            $path = $request->file('patient_image')->storeAs('success-stories', $filename, 'public');
            $validated['patient_image'] = $path;
        }

        $successStory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث قصة النجاح بنجاح',
            'data' => $successStory->fresh(),
        ]);
    }

    /**
     * Remove the specified success story.
     */
    public function destroy(SuccessStory $successStory): JsonResponse
    {
        // Delete image if exists
        if ($successStory->patient_image) {
            Storage::disk('public')->delete($successStory->patient_image);
        }

        $successStory->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف قصة النجاح بنجاح',
        ]);
    }

    /**
     * Toggle featured status.
     */
    public function toggleFeatured(SuccessStory $successStory): JsonResponse
    {
        $successStory->update(['is_featured' => !$successStory->is_featured]);

        return response()->json([
            'success' => true,
            'message' => $successStory->is_featured ? 'تم تمييز القصة' : 'تم إلغاء التمييز',
            'data' => $successStory,
        ]);
    }

    /**
     * Toggle active status.
     */
    public function toggleActive(SuccessStory $successStory): JsonResponse
    {
        $successStory->update(['is_active' => !$successStory->is_active]);

        return response()->json([
            'success' => true,
            'message' => $successStory->is_active ? 'تم تفعيل القصة' : 'تم إيقاف القصة',
            'data' => $successStory,
        ]);
    }

    /**
     * Reorder stories.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'stories' => 'required|array',
            'stories.*.id' => 'required|exists:success_stories,id',
            'stories.*.order' => 'required|integer',
        ]);

        foreach ($validated['stories'] as $item) {
            SuccessStory::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة ترتيب القصص بنجاح',
        ]);
    }
}
