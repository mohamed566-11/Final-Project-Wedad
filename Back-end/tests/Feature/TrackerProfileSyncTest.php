<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Pregnancy;
use App\Models\WeightEntry;

class TrackerProfileSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_pregnancy_entry_syncs_to_profile_and_weight_tracker()
    {
        $user = User::factory()->create();

        $profile = UserProfile::create([
            'user_id' => $user->id,
            'weight' => 60,
            'blood_pressure_systolic' => 110,
            'blood_pressure_diastolic' => 70
        ]);

        $pregnancy = Pregnancy::create([
            'user_id' => $user->id,
            'last_menstrual_period' => now()->subWeeks(10)->format('Y-m-d'),
            'due_date' => now()->addWeeks(30)->format('Y-m-d'),
            'current_week' => 10,
            'is_active' => true,
            'pregnancy_status' => 'ongoing'
        ]);

        $response = $this->actingAs($user, 'patient')->postJson('/api/v1/patient/pregnancy/entry', [
            'weight' => 65.5,
            'blood_pressure_systolic' => 120,
            'blood_pressure_diastolic' => 80,
            'notes' => 'Test pregnancy entry'
        ]);

        $response->assertStatus(201);

        // Assert Profile updated
        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'weight' => 65.5,
            'blood_pressure_systolic' => 120,
            'blood_pressure_diastolic' => 80
        ]);

        // Assert WeightEntry created
        $this->assertDatabaseHas('weight_entries', [
            'user_id' => $user->id,
            'weight' => 65.5
        ]);

        // Assert PregnancyEntry created
        $this->assertDatabaseHas('pregnancy_entries', [
            'pregnancy_id' => $pregnancy->id,
            'weight' => 65.5,
            'blood_pressure_systolic' => 120,
            'blood_pressure_diastolic' => 80,
        ]);
    }

    public function test_updating_profile_medical_info_syncs_to_weight_tracker()
    {
        $user = User::factory()->create();
        $profile = UserProfile::create([
            'user_id' => $user->id,
            'weight' => 60
        ]);

        $response = $this->actingAs($user, 'patient')->putJson('/api/v1/patient/profile/medical', [
            'weight' => 62.0,
            'blood_type' => 'O+'
        ]);

        $response->assertStatus(200);

        // Assert Profile Updated
        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'weight' => 62.0,
            'blood_type' => 'O+'
        ]);

        // Assert WeightEntry created from profile change
        $this->assertDatabaseHas('weight_entries', [
            'user_id' => $user->id,
            'weight' => 62.0,
            'notes' => 'تحديث من الملف الشخصي الطبي'
        ]);
    }
}
