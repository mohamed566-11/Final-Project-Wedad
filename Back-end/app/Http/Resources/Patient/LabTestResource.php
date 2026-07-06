<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Resources\Json\JsonResource;

class LabTestResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'status'        => $this->status,
            'image_url'     => $this->image_url,
            'results'       => $this->when(
                                    $this->status === 'completed',
                                    $this->results_json
                                ),
            'tests_count'   => $this->tests_count,
            'error_message' => $this->when($this->status === 'failed', $this->error_message),
            'processed_at'  => $this->processed_at?->toISOString(),
            'created_at'    => $this->created_at->toISOString(),
        ];
    }
}
