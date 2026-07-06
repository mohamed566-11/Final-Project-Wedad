<?php

namespace App\Http\Resources\Doctor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Utils\TranslationHelper;
use Carbon\Carbon;

class ConsultationResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        $consultationDateTime = Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->time);
        $now = Carbon::now();
        $minutesUntil = $now->diffInMinutes($consultationDateTime, false);

        return [
            'id' => $this->id,
            'patient' => $this->patient ? [
                'id' => $this->patient->id,
                'name' => $this->patient->name,
                'age' => $this->patient->age,
                'image_url' => $this->patient->image 
                    ? app('App\Utils\ImageManager')->getImageUrl($this->patient->image, 'profiles', 'uploads', 'profiles/default-avatar.png')
                    : url('profiles/default-avatar.png'),
                'life_stage' => $this->patient->lifeStage?->name,
                'phone' => $this->when($this->status !== 'pending', $this->patient->phone),
            ] : null,
            'date' => $this->date->format('Y-m-d'),
            'time' => Carbon::parse($this->time)->format('H:i'),
            'type' => $this->type,
            'type_ar' => TranslationHelper::consultationType($this->type),
            'status' => $this->status,
            'status_ar' => TranslationHelper::consultationStatus($this->status),
            'price' => (float) $this->price,
            'platform_commission' => (float) $this->platform_commission,
            'doctor_earnings' => (float) ($this->price - $this->platform_commission),
            'patient_notes' => $this->patient_notes,
            'doctor_notes' => $this->doctor_notes,
            'duration_minutes' => $this->duration_minutes,
            'started_at' => $this->started_at?->format('Y-m-d H:i:s'),
            'ended_at' => $this->ended_at?->format('Y-m-d H:i:s'),
            'cancellation_reason' => $this->cancellation_reason,
            'google_meet_link' => $this->google_meet_link,
            'zoom_start_url' => $this->when(
                $this->type === 'video' && 
                in_array($this->status, ['confirmed', 'in_progress']) && 
                $minutesUntil <= 15 && $minutesUntil >= -60,
                function () {
                    // For doctor, we need to get the start URL from Zoom
                    // This would require storing the start_url or regenerating it
                    return $this->zoom_join_url; // Fallback to join URL
                }
            ),
            'zoom_join_url' => $this->when(
                $this->type === 'video' && 
                in_array($this->status, ['confirmed', 'in_progress']),
                $this->zoom_join_url
            ),
            'zoom_password' => $this->when(
                $this->type === 'video' && 
                in_array($this->status, ['confirmed', 'in_progress']),
                $this->zoom_password
            ),
            'can_confirm' => $this->status === 'pending',
            'can_start' => $this->canStart($minutesUntil),
            'can_complete' => $this->status === 'in_progress',
            'can_cancel' => in_array($this->status, ['pending', 'confirmed']),
            'time_until' => TranslationHelper::timeUntil($consultationDateTime),
            'review' => $this->when($this->review, function () {
                return [
                    'rating' => $this->review->rating,
                    'comment' => $this->review->comment,
                    'created_at' => $this->review->created_at->format('Y-m-d'),
                ];
            }),
            'prescription' => $this->when($this->prescription, function () {
                return [
                    'id' => $this->prescription->id,
                    'medications' => $this->prescription->medications,
                    'diagnosis' => $this->prescription->diagnosis,
                    'notes' => $this->prescription->notes,
                    'created_at' => $this->prescription->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }

    protected function canStart(int $minutesUntil): bool
    {
        return $this->status === 'confirmed' &&
               $minutesUntil <= 15 && $minutesUntil >= -30;
    }
}
