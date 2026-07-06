<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $emojis = [
            'very_bad' => '😢',
            'bad' => '😞',
            'neutral' => '😐',
            'good' => '😊',
            'very_good' => '😄',
        ];

        $labels = [
            'very_bad' => 'سيئ جدًا',
            'bad' => 'سيئ',
            'neutral' => 'متوسط',
            'good' => 'جيد',
            'very_good' => 'ممتاز',
        ];

        return [
            'id' => $this->id,
            'mood' => $this->mood,
            'mood_emoji' => $emojis[$this->mood] ?? '😐',
            'mood_label' => $labels[$this->mood] ?? $this->mood,
            'notes' => $this->notes,
            'factors' => $this->factors, // Casted to array in model
            'entry_date' => $this->entry_date->format('Y-m-d'),
            'entry_time' => $this->entry_time ? $this->entry_time->format('H:i') : null,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
