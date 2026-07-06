<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Utils\TranslationHelper;
use Carbon\Carbon;

class DoctorResource extends JsonResource
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
            'total_reviews' => $this->reviews()->count(),
            'session_type' => $this->session_type,
            'languages' => $this->languages ?? [],
            'is_available' => $this->is_available,
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
            'life_stages' => $this->whenLoaded('lifeStages', function () {
                return $this->lifeStages->map(function ($stage) {
                    return [
                        'id' => $stage->id,
                        'name' => $stage->name,
                        'slug' => $stage->slug,
                    ];
                });
            }),
            'verification_status' => $this->verification_status,
            'verified_badge' => in_array($this->verification_status, ['approved', 'verified']),
            'next_available_slot' => $this->getNextAvailableSlot(),
        ];
    }

    protected function getNextAvailableSlot(): ?string
    {
        // Get next 7 days' available slots
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::today()->addDays($i);
            $dayOfWeek = strtolower($date->format('l'));

            $workingHours = $this->workingHours()
                ->where('day', $dayOfWeek)
                ->orderBy('start_time')
                ->get();

            if ($workingHours->isNotEmpty()) {
                foreach ($workingHours as $slot) {
                    $startTime = Carbon::parse($slot->start_time);

                    // If today, check if start time is in the future
                    if ($i === 0) {
                        $now = Carbon::now();
                        if ($startTime->lessThan($now)) {
                            continue;
                        }
                    }

                    return $date->format('Y-m-d') . ' ' . $startTime->format('H:i');
                }
            }
        }

        return null;
    }
}
