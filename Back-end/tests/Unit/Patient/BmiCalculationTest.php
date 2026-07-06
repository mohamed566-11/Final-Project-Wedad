<?php

use App\Models\WeightEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('computes BMI correctly', function () {
    // For a person 180cm (1.8m) weighing 75kg, BMI = 75 / (1.8^2) = 23.15
    $weight = 75.0;
    $height = 180.0;
    
    $bmi = WeightEntry::computeBmi($weight, $height);
    
    expect($bmi)->toEqual(23.15);
});

it('automatically calculates BMI when creating a new weight entry', function () {
    $patient = User::factory()->create();
    
    $entry = WeightEntry::create([
        'user_id' => $patient->id,
        'weight' => 75.0,
        'height' => 180.0,
        'entry_date' => now()->toDateString(),
        'entry_time' => now()->toTimeString(),
    ]);
    
    expect($entry->bmi)->toEqual(23.15);
    
    $this->assertDatabaseHas('weight_entries', [
        'id' => $entry->id,
        'bmi' => 23.15
    ]);
});
