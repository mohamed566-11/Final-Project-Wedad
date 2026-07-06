<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\WeightEntry;
use App\Models\MoodEntry;
use App\Models\PeriodCycle;
use Tests\Traits\ActingAsPatient;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class, ActingAsPatient::class);

// ─── Weight Tracker ────────────────────────────────────────────────────────────

it('stores a weight entry', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/weight', [
                         'weight' => 65.5,
                         'unit'   => 'kg',
                         'entry_date'   => now()->toDateString(),
                     ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('weight_entries', ['user_id' => $user->id]);
});

it('returns weight history', function () {
    $user = $this->createVerifiedPatient();
    WeightEntry::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/weight');

    $response->assertOk()
             ->assertJsonStructure(['data']);
});

it('deletes a weight entry', function () {
    $user  = $this->createVerifiedPatient();
    $entry = WeightEntry::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->deleteJson("/api/v1/patient/weight/{$entry->id}");

    $response->assertOk();
    $this->assertDatabaseMissing('weight_entries', ['id' => $entry->id]);
});

// ─── Mood Tracker ─────────────────────────────────────────────────────────────

it('stores a mood entry', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/mood', [
                         'mood'  => 'neutral',
                         'notes' => 'Feeling okay',
                         'entry_date'  => now()->toDateString(),
                     ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('mood_entries', ['user_id' => $user->id, 'mood' => 'neutral']);
});

it('returns mood analytics', function () {
    $user = $this->createVerifiedPatient();
    MoodEntry::factory()->count(5)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/mood/analytics');

    $response->assertOk();
});

it('validates mood value range', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/mood', [
                         'mood' => 6,
                         'entry_date' => now()->toDateString(),
                     ]);

    $response->assertStatus(422)
             ->assertJsonValidationErrors(['mood']);
});

// ─── Period Tracker ────────────────────────────────────────────────────────────

it('starts a new period cycle', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/period', [
                         'start_date' => now()->toDateString(),
                     ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('period_cycles', ['user_id' => $user->id]);
});

it('returns period predictions', function () {
    $user = $this->createVerifiedPatient();
    PeriodCycle::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/period/predictions');

    $response->assertOk();
});

it('returns period analytics', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/period/analytics');

    $response->assertOk();
});

// ─── Fertility Tracker ────────────────────────────────────────────────────────

it('stores a fertility entry', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/fertility', [
                         'entry_date'   => now()->toDateString(),
                         'cervical_mucus' => 'egg_white',
                     ]);

    $response->assertStatus(201);
});

it('returns fertile window calculation', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/fertility/fertile-window');

    $response->assertOk();
});

// ─── Trackers Summary ─────────────────────────────────────────────────────────

it('returns comprehensive trackers summary', function () {
    $user = $this->createVerifiedPatient();

    $response = $this->actingAs($user, 'patient')
                     ->getJson('/api/v1/patient/trackers/summary');

    $response->assertOk();
});
