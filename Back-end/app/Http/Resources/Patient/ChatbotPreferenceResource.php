<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatbotPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'data_access_enabled' => $this->data_access_enabled,
            'share_predictions' => $this->share_predictions,
            'share_trackers' => $this->share_trackers,
            'share_medical_file' => $this->share_medical_file,
            'share_consultations' => $this->share_consultations,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
