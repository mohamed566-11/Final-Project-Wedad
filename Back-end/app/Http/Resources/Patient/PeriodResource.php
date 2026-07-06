<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date ? $this->end_date->format('Y-m-d') : null,
            'cycle_length' => $this->cycle_length,
            'period_length' => $this->period_length,
            'flow' => $this->flow,
            'symptoms' => $this->symptoms, // Casted to array
            'notes' => $this->notes,
            'is_predicted' => (bool)$this->is_predicted,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
