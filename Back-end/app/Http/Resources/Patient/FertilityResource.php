<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FertilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Fertile day: egg_white mucus OR positive ovulation test OR significant BBT rise (>= 36.7)
        $isFertile = $this->cervical_mucus === 'egg_white'
            || $this->ovulation_test_positive
            || ($this->bbt && (float)$this->bbt >= 36.7);

        // Ovulation likelihood based on multiple indicators
        $indicators = 0;
        if ($this->ovulation_test_positive) $indicators += 2;
        if ($this->cervical_mucus === 'egg_white') $indicators++;
        if ($this->bbt && (float)$this->bbt >= 36.7) $indicators++;
        $likelihood = $indicators >= 3 ? 'very_high' : ($indicators === 2 ? 'high' : ($indicators === 1 ? 'medium' : 'low'));

        return [
            'id' => $this->id,
            'entry_date' => $this->entry_date->format('Y-m-d'),
            'bbt' => $this->bbt !== null ? (float)$this->bbt : null,
            'cervical_mucus' => $this->cervical_mucus,
            'ovulation_test_positive' => (bool)$this->ovulation_test_positive,
            'intercourse' => (bool)$this->intercourse,
            'notes' => $this->notes,
            'is_fertile_day' => $isFertile,
            'ovulation_likelihood' => $likelihood,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
