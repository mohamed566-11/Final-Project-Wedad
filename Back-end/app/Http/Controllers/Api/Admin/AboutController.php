<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AboutUs;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AboutController extends Controller
{
    use ApiResponse;

    /**
     * Get About Us content for admin
     * GET /api/v1/admin/about-us
     */
    public function show()
    {
        $about = AboutUs::first();

        if (!$about) {
            // Create default about record
            $about = AboutUs::create([
                'title' => 'منصة وداد الصحية',
                'description' => 'منصة رقمية متكاملة للصحة النسائية',
            ]);
        }

        return $this->successResponse([
            'about' => [
                'id' => $about->id,
                'title' => $about->title,
                'description' => $about->description,
                'image' => $about->image,
                'image_url' => $about->image ? url('storage/about/' . $about->image) : null,
                'mission_title' => $about->mission_title,
                'mission_desc' => $about->mission_desc,
                'vision_title' => $about->vision_title,
                'vision_desc' => $about->vision_desc,
                'created_at' => $about->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $about->updated_at?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Update About Us content
     * PUT /api/v1/admin/about-us
     */
    public function update(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'mission_title' => 'nullable|string|max:255',
            'mission_desc' => 'nullable|string',
            'vision_title' => 'nullable|string|max:255',
            'vision_desc' => 'nullable|string',
        ], [
            'title.required' => 'العنوان مطلوب',
            'description.required' => 'الوصف مطلوب',
            'image.image' => 'يجب أن يكون الملف صورة',
            'image.max' => 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت',
        ]);

        $about = AboutUs::first();

        if (!$about) {
            $about = new AboutUs();
        }

        // Update text fields
        $about->title = $request->title;
        $about->description = $request->description;
        $about->mission_title = $request->mission_title;
        $about->mission_desc = $request->mission_desc;
        $about->vision_title = $request->vision_title;
        $about->vision_desc = $request->vision_desc;

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($about->image) {
                Storage::disk('public')->delete('about/' . $about->image);
            }
            
            $imagePath = $request->file('image')->store('about', 'public');
            $about->image = basename($imagePath);
        }

        $about->save();

        return $this->successResponse([
            'about' => [
                'id' => $about->id,
                'title' => $about->title,
                'description' => $about->description,
                'image' => $about->image,
                'image_url' => $about->image ? url('storage/about/' . $about->image) : null,
                'mission_title' => $about->mission_title,
                'mission_desc' => $about->mission_desc,
                'vision_title' => $about->vision_title,
                'vision_desc' => $about->vision_desc,
                'updated_at' => $about->updated_at->format('Y-m-d H:i:s'),
            ],
        ], 'تم تحديث صفحة من نحن بنجاح');
    }
}
