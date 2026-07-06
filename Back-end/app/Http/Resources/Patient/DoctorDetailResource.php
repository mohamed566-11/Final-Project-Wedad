<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Utils\TranslationHelper;
use Carbon\Carbon;

class DoctorDetailResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialization' => $this->specialization,
            'specialization_ar' => TranslationHelper::specialization($this->specialization),
            'bio' => $this->bio,
            'years_of_experience' => $this->years_of_experience,
            'consultation_price' => (float) $this->consultation_price,
            'rating' => (float) $this->rating,
            'total_consultations' => $this->total_consultations,
            'total_reviews' => $this->reviews()->where('is_published', true)->count(),
            'session_type' => $this->session_type,
            'languages' => $this->languages ?? [],
            'clinic_address' => $this->clinic_address,
            'is_available' => $this->is_available,
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            'life_stages' => $this->whenLoaded('lifeStages', function () {
                return $this->lifeStages->map(function ($stage) {
                    return [
                        'id' => $stage->id,
                        'name' => $stage->name,
                        'slug' => $stage->slug,
                        'description' => $stage->description,
                    ];
                });
            }),
            'working_hours' => $this->getWorkingHours(),
            'next_available_slots' => $this->getNextAvailableSlots(),
            'reviews' => $this->getRecentReviews(),
            'reviews_summary' => $this->getReviewsSummary(),
            'verification_status' => $this->verification_status,
            'verified_badge' => in_array($this->verification_status, ['approved', 'verified']),
        ];
    }

    protected function getWorkingHours(): array
    {
        return $this->workingHours->groupBy('day')->map(function ($daySlots, $day) {
            return [
                'day' => $day,
                'day_ar' => TranslationHelper::day($day),
                'start_times' => $daySlots->sortBy('start_time')->pluck('start_time')
                    ->map(fn($t) => Carbon::parse($t)->format('H:i'))
                    ->values()->all(),
            ];
        })->values()->toArray();
    }

    protected function getNextAvailableSlots(int $limit = 10): array
    {
        $slots = [];
        $slotCount = 0;

        for ($i = 0; $i < 14 && $slotCount < $limit; $i++) {
            $date = Carbon::today()->addDays($i);
            $dayOfWeek = strtolower($date->format('l'));

            $workingSlots = $this->workingHours()->where('day', $dayOfWeek)->orderBy('start_time')->get();

            if ($workingSlots->isEmpty()) {
                continue;
            }

            // Get booked slots for this date
            $bookedSlots = $this->consultations()
                ->where('date', $date->format('Y-m-d'))
                ->whereIn('status', ['pending', 'confirmed', 'in_progress'])
                ->pluck('time')
                ->map(fn($t) => Carbon::parse($t)->format('H:i'))
                ->toArray();

            foreach ($workingSlots as $workingSlot) {
                $slotTime = Carbon::parse($workingSlot->start_time)->format('H:i');

                // Skip past slots for today
                if ($i === 0) {
                    $slotDateTime = Carbon::parse($date->format('Y-m-d') . ' ' . $slotTime);
                    if ($slotDateTime->lessThan(Carbon::now()->addMinutes(30))) {
                        continue;
                    }
                }

                $isBooked = in_array($slotTime, $bookedSlots);

                if (!$isBooked) {
                    $slots[] = [
                        'date' => $date->format('Y-m-d'),
                        'time' => $slotTime,
                        'available' => true,
                    ];
                    $slotCount++;
                    if ($slotCount >= $limit)
                        break;
                }
            }
        }

        return $slots;
    }

    protected function getRecentReviews(int $limit = 5): array
    {
        return $this->reviews()
            ->where('is_published', true)
            ->with('patient')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'patient_name' => $review->is_anonymous ? 'مستخدم مجهول' : $review->patient->name,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->format('Y-m-d'),
                ];
            })
            ->toArray();
    }

    protected function getReviewsSummary(): array
    {
        $reviews = $this->reviews()->where('is_published', true)->get();

        return [
            'average_rating' => round($reviews->avg('rating'), 1) ?: 0,
            'total_reviews' => $reviews->count(),
            '5_star' => $reviews->where('rating', 5)->count(),
            '4_star' => $reviews->where('rating', 4)->count(),
            '3_star' => $reviews->where('rating', 3)->count(),
            '2_star' => $reviews->where('rating', 2)->count(),
            '1_star' => $reviews->where('rating', 1)->count(),
        ];
    }
}
