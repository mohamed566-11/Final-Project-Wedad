<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculate category if BMI exists
        $bmiCategory = 'Unknown';
        if ($this->bmi) {
            if ($this->bmi < 18.5) $bmiCategory = 'Underweight';
            elseif ($this->bmi < 25) $bmiCategory = 'Normal';
            elseif ($this->bmi < 30) $bmiCategory = 'Overweight';
            else $bmiCategory = 'Obese';
        }

        return [
            'id' => $this->id,
            'weight' => (float)$this->weight,
            'height' => (float)$this->height,
            'bmi' => (float)$this->bmi,
            'bmi_category' => $bmiCategory,
            'notes' => $this->notes,
            'entry_date' => $this->entry_date->format('Y-m-d'),
            'entry_time' => $this->entry_time ? $this->entry_time->format('H:i') : null,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
