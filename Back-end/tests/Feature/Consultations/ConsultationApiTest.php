<?php

namespace Tests\Feature\Consultations;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ConsultationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $patient;
    protected Doctor $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->patient = User::factory()->create([
            'is_active' => true,
        ]);

        $this->doctor = Doctor::factory()->create([
            'is_active' => true,
            'is_available' => true,
            'verification_status' => 'verified',
            'consultation_price' => 100,
            'session_type' => 'both',
        ]);

        // Add doctor working hours for testing (e.g., today at 14:00)
        $dayOfWeek = strtolower(Carbon::now()->format('l'));
        DB::table('doctor_working_hours')->insert([
            'doctor_id' => $this->doctor->id,
            'day' => $dayOfWeek,
            'start_time' => '14:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_patient_can_list_consultations()
    {
        $response = $this->actingAs($this->patient, 'patient')
            ->getJson('/api/v1/patient/consultations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data'
            ]);
    }

    public function test_patient_can_book_available_consultation()
    {
        $date = Carbon::now()->addDays(1)->format('Y-m-d');
        $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));

        // Add working hour for tomorrow
        DB::table('doctor_working_hours')->insert([
            'doctor_id' => $this->doctor->id,
            'day' => $dayOfWeek,
            'start_time' => '14:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->patient, 'patient')
            ->postJson('/api/v1/patient/consultations/book', [
                'doctor_id' => $this->doctor->id,
                'date' => $date,
                'time' => '14:00',
                'type' => 'video',
                'payment_method' => 'cash',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertDatabaseHas('consultations', [
            'doctor_id' => $this->doctor->id,
            'user_id' => $this->patient->id,
            'status' => 'pending',
            'date' => $date . ' 00:00:00',
            'time' => '14:00',
        ]);
    }

    public function test_patient_cannot_cancel_consultation_within_24_hours()
    {
        // 2 hours from now
        $target = Carbon::now()->addHours(2);
        $date = $target->toDateString();
        $time = $target->format('H:i');

        $consultation = Consultation::create([
            'doctor_id' => $this->doctor->id,
            'user_id' => $this->patient->id,
            'date' => $date,
            'time' => $time,
            'type' => 'video',
            'status' => 'pending',
            'price' => 100,
            'duration_minutes' => 60,
        ]);

        $response = $this->actingAs($this->patient, 'patient')
            ->putJson("/api/v1/patient/consultations/{$consultation->id}/cancel", [
                'cancellation_reason' => 'No longer needed'
            ]);

        $response->assertStatus(400) // or logic failure (success => false)
            ->assertJsonFragment([
                'status' => false,
                'message' => 'لا يمكن الإلغاء قبل أقل من 24 ساعة من الموعد'
            ]);
    }

    public function test_doctor_can_complete_consultation()
    {
        $consultation = Consultation::create([
            'doctor_id' => $this->doctor->id,
            'user_id' => $this->patient->id,
            'date' => Carbon::today()->toDateString(),
            'time' => '14:00:00',
            'type' => 'video',
            'status' => 'in_progress',
            'price' => 100,
            'duration_minutes' => 60,
            'started_at' => Carbon::now()->subMinutes(30),
        ]);

        $response = $this->actingAs($this->doctor, 'doctor')
            ->putJson("/api/v1/doctor/consultations/{$consultation->id}/complete", [
                'doctor_notes' => 'Patient looks healthy.',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('consultations', [
            'id' => $consultation->id,
            'status' => 'completed',
        ]);
    }
}
