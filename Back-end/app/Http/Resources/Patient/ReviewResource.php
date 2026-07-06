<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    /**
     * Map a numeric rating to its Arabic label.
     */
    private function ratingText(int $rating): string
    {
        return match ($rating) {
            5 => 'ممتاز',
            4 => 'جيد جداً',
            3 => 'جيد',
            2 => 'مقبول',
            default => 'ضعيف',
        };
    }

    public function toArray(Request $request): array
    {
        $isAnonymous = (bool) $this->is_anonymous;

        // Build patient image URL safely
        $patientImage = null;
        if (!$isAnonymous && $this->patient?->image) {
            $patientImage = app('App\Utils\ImageManager')->getImageUrl($this->patient->image, 'profiles', 'uploads', 'profiles/default-avatar.png');
        }

        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'rating_text' => $this->ratingText((int) $this->rating),
            'comment' => $this->comment,
            'is_anonymous' => $isAnonymous,
            // is_verified: true because reviews are only allowed on completed consultations
            'is_verified' => true,
            'is_published' => (bool) $this->is_published,
            'entry_date' => $this->consultation?->date
                ? (is_string($this->consultation->date)
                    ? $this->consultation->date
                    : $this->consultation->date->format('Y-m-d'))
                : null,
            'created_at' => $this->created_at->format('Y-m-d'),
            // Nested patient object — front-end reads review.patient.name
            'patient' => [
                'name' => $isAnonymous ? 'مستخدم مجهول' : ($this->patient?->name ?? ''),
                'image_url' => $patientImage,
            ],
        ];
    }
}
