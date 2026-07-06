<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Utils\TranslationHelper;
use Carbon\Carbon;

class ConsultationResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        $dateString = $this->date instanceof \Carbon\Carbon ? $this->date->format('Y-m-d') : $this->date;
        $consultationDateTime = Carbon::parse($dateString . ' ' . $this->time);
        $now = Carbon::now();
        $minutesUntil = $now->diffInMinutes($consultationDateTime, false);

        return [
            'id' => $this->id,
            'doctor' => [
                'id' => $this->doctor->id,
                'name' => $this->doctor->name,
                'specialization' => $this->doctor->specialization,
                'specialization_ar' => TranslationHelper::specialization($this->doctor->specialization),
                'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                'rating' => (float) $this->doctor->rating,
            ],
            'date' => $this->date instanceof \Carbon\Carbon ? $this->date->format('Y-m-d') : $this->date,
            'time' => Carbon::parse($this->time)->format('H:i'),
            'type' => $this->type,
            'type_ar' => TranslationHelper::consultationType($this->type),
            'status' => $this->status,
            'status_ar' => TranslationHelper::consultationStatus($this->status),
            'price' => (float) $this->price,
            'patient_notes' => $this->patient_notes,
            'doctor_notes' => $this->doctor_notes,
            'duration_minutes' => $this->duration_minutes,
            'started_at' => $this->started_at?->format('Y-m-d H:i:s'),
            'ended_at' => $this->ended_at?->format('Y-m-d H:i:s'),
            'cancellation_reason' => $this->cancellation_reason,
            'google_meet_link' => $this->when(
                $this->type === 'video' &&
                in_array($this->status, ['confirmed', 'in_progress']) &&
                $this->google_meet_link,
                $this->google_meet_link
            ),
            'can_join' => $this->canJoin($minutesUntil),
            'can_cancel' => $this->canCancel($consultationDateTime),
            'can_reschedule' => $this->canReschedule($consultationDateTime),
            'can_review' => $this->canReview(),
            'has_review' => $this->review !== null,
            'time_until' => TranslationHelper::timeUntil($consultationDateTime),
            'payment' => $this->when($this->payment, function () {
                return [
                    'id' => $this->payment->id,
                    'amount' => (float) $this->payment->amount,
                    'status' => $this->payment->status,
                    'payment_method' => $this->payment->payment_method,
                    'paid_at' => $this->payment->paid_at?->format('Y-m-d H:i:s'),
                ];
            }),
            'prescription' => $this->when($this->prescription, function () {
                return [
                    'id' => $this->prescription->id,
                    'medications' => $this->prescription->medications,
                    'diagnosis' => $this->prescription->diagnosis,
                    'notes' => $this->prescription->notes,
                    'file_path' => $this->prescription->file_path ? asset('storage/' . $this->prescription->file_path) : null,
                    'created_at' => $this->prescription->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }

    protected function getSpecializationAr(string $specialization): string
    {
        return TranslationHelper::specialization($specialization);
    }

    protected function canJoin(int $minutesUntil): bool
    {
        return $this->type === 'video' &&
            in_array($this->status, ['confirmed', 'in_progress']) &&
            $minutesUntil <= 15 && $minutesUntil >= -60;
    }

    protected function canCancel(Carbon $consultationDateTime): bool
    {
        if (!in_array($this->status, ['pending', 'confirmed'])) {
            return false;
        }

        $hoursUntil = Carbon::now()->diffInHours($consultationDateTime, false);
        return $hoursUntil >= 24;
    }

    protected function canReschedule(Carbon $consultationDateTime): bool
    {
        return $this->canCancel($consultationDateTime);
    }

    protected function canReview(): bool
    {
        return $this->status === 'completed' && $this->review === null;
    }
}
