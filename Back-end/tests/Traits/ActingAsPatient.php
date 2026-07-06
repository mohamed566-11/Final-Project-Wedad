<?php

namespace Tests\Traits;

use App\Models\User;
use App\Models\UserProfile;

trait ActingAsPatient
{
    protected function createVerifiedPatient(array $attrs = []): User
    {
        $user = User::factory()->create(array_merge([
            'is_active'          => true,
            'email_verified_at'  => now(),
        ], $attrs));

        UserProfile::factory()->create(['user_id' => $user->id]);

        return $user;
    }

    protected function actingAsPatient(array $attrs = []): static
    {
        return $this->actingAs($this->createVerifiedPatient($attrs), 'patient');
    }
}
