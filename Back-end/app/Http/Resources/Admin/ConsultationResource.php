<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Utils\TranslationHelper;

class ConsultationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            
            // Doctor
            'doctor' => $this->whenLoaded('doctor', function () {
                return [
                    'id' => $this->doctor->id,
                    'name' => $this->doctor->name,
                    'specialization' => $this->doctor->specialization,
                    'image_url' => $this->doctor->image 
                        ? app('App\Utils\ImageManager')->getImageUrl($this->doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png') 
                        : url('profiles/default-doctor.png'),
                ];
            }),
            
            // Patient
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'name' => $this->patient->name,
                    'phone' => $this->patient->phone,
                    'image_url' => $this->patient->image 
                        ? app('App\Utils\ImageManager')->getImageUrl($this->patient->image, 'profiles', 'uploads', 'profiles/default-avatar.png')
                        : url('profiles/default-avatar.png'),
                ];
            }),
            
            // Schedule
            'date' => $this->date->format('Y-m-d'),
            'time' => $this->time,
            'duration_minutes' => $this->duration_minutes,
            
            // Type
            'type' => $this->type,
            'type_ar' => $this->type === 'video' ? 'فيديو' : 'عيادة',
            
            // Status
            'status' => $this->status,
            'status_ar' => $this->getStatusDisplayName($this->status),
            
            // Pricing
            'price' => $this->price,
            'platform_commission' => $this->platform_commission,
            
            // Notes
            'patient_notes' => $this->patient_notes,
            'doctor_notes' => $this->doctor_notes,
            'cancellation_reason' => $this->cancellation_reason,
            
            // Meeting
            'meeting_info' => [
                'meeting_id' => $this->zoom_meeting_id,
                'join_url' => $this->zoom_join_url,
            ],
            
            // Timestamps
            'started_at' => $this->started_at?->format('Y-m-d H:i:s'),
            'ended_at' => $this->ended_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            
            // Payment
            'payment' => $this->whenLoaded('payment', function () {
                return [
                    'id' => $this->payment->id,
                    'transaction_id' => $this->payment->transaction_id,
                    'amount' => $this->payment->amount,
                    'platform_fee' => $this->payment->platform_fee,
                    'doctor_amount' => $this->payment->doctor_amount,
                    'status' => $this->payment->status,
                    'payment_method' => $this->payment->payment_method,
                    'paid_at' => $this->payment->paid_at?->format('Y-m-d H:i:s'),
                ];
            }),
            
            // Review
            'review' => $this->whenLoaded('review', function () {
                return $this->review ? [
                    'id' => $this->review->id,
                    'rating' => $this->review->rating,
                    'comment' => $this->review->comment,
                    'created_at' => $this->review->created_at->format('Y-m-d'),
                ] : null;
            }),
        ];
    }

    private function getStatusDisplayName(string $status): string
    {
        return TranslationHelper::consultationStatus($status, admin: true);
    }
}
