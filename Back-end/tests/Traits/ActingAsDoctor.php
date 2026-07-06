<?php

namespace Tests\Traits;

use App\Models\Doctor;

trait ActingAsDoctor
{
    protected function createVerifiedDoctor(array $attrs = []): Doctor
    {
        return Doctor::factory()->approved()->create($attrs);
    }

    protected function actingAsDoctor(array $attrs = []): static
    {
        return $this->actingAs($this->createVerifiedDoctor($attrs), 'doctor');
    }

    protected function createPendingDoctor(array $attrs = []): Doctor
    {
        return Doctor::factory()->pending()->create($attrs);
    }
}
