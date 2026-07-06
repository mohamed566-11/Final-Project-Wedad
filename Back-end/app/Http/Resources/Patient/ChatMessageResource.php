<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'role'       => $this->role,
            'message'    => $this->message,
            'bot_type'   => $this->bot_type,
            'metadata'   => $this->metadata,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
