<?php

/**
 * ConsultationServiceTest
 *
 * Covers:
 * - SlotAvailability (defined vs undefined slots)
 * - ConflictCheck (existing bookings)
 * - Past Time check (cannot book slots < 30 mins from now if today)
 * - bookConsultation validation and success flows
 * - cancelConsultation rules (24h policy)
 */

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\DoctorWorkingHour;
use App\Models\User;
use App\Services\ConsultationService;
use App\Services\GoogleMeetService;
use App\Services\PaymobService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Mock the external services
    $this->googleMeetMock = $this->mock(GoogleMeetService::class, function (MockInterface $mock) {
        $mock->shouldReceive('createMeeting')->andReturn([
            'success' => true,
            'meeting_id' => '123456789',
            'join_url' => 'https://meet.google.com/abc-defg-hij',
        ])->byDefault();
    });

    $this->paymobMock = $this->mock(PaymobService::class, function (MockInterface $mock) {
        $mock->shouldReceive('isConfigured')->andReturn(true)->byDefault();
        $mock->shouldReceive('calculateCommission')->andReturn(['platform_fee' => 50, 'doctor_earning' => 250])->byDefault();
        $mock->shouldReceive('initiatePayment')->andReturn([
            'payment_url' => 'https://paymob.com/pay/1234'
        ])->byDefault();
        $mock->shouldReceive('initiateWalletPayment')->andReturn([
            'iframe_url' => 'https://paymob.com/wallet/1234'
        ])->byDefault();
    });

    $this->service = new ConsultationService($this->googleMeetMock, $this->paymobMock);

    // Setup base models
    $this->patient = User::factory()->create([
        'is_active' => true,
    ]);

    $this->doctor = Doctor::factory()->create([
        'is_active' => true,
        'is_available' => true,
        'verification_status' => 'approved',
        'session_type' => 'both',
        'consultation_price' => 300,
    ]);

    // Freeze time to a known state: 08:00 AM on a Monday
    // So "today" is Monday, and we can test the 30-min past rule easily.
    $this->knownDate = Carbon::create(2023, 10, 2, 8, 0, 0); // Oct 2, 2023 is Monday
    Carbon::setTestNow($this->knownDate);

    // Give doctor 3 slots on Monday: 09:00, 10:00, 11:00
    foreach (['09:00', '10:00', '11:00'] as $time) {
        DoctorWorkingHour::factory()->create([
            'doctor_id' => $this->doctor->id,
            'day' => 'monday',
            'start_time' => $time,
        ]);
    }
});

afterEach(function () {
    Carbon::setTestNow(); // reset
});

// ─── Slot Availability & Conflict Check ──────────────────────────────────────

it('returns correctly defined slots for the doctor', function () {
    $result = $this->service->getAvailableSlots($this->doctor, '2023-10-09'); // Next Monday
    
    expect($result['slots'])->toHaveCount(3);
    expect($result['slots'][0]['time'])->toBe('09:00');
    expect($result['slots'][0]['available'])->toBeTrue();
});

it('excludes past slots on the same day', function () {
    // Fast forward to 09:30 AM today - so the 09:00 slot is past
    Carbon::setTestNow($this->knownDate->copy()->setTime(9, 30));

    $result = $this->service->getAvailableSlots($this->doctor, '2023-10-02'); // Today

    expect($result['slots'][0]['time'])->toBe('09:00');
    expect($result['slots'][0]['available'])->toBeFalse();
    expect($result['slots'][0]['reason'])->toBe('انتهى الوقت');

    expect($result['slots'][1]['time'])->toBe('10:00');
    expect($result['slots'][1]['available'])->toBeTrue(); // 10:00 is > 30 mins from 09:30? Actually 30 mins difference. 
});

it('marks slot as unavailable if already booked', function () {
    // Create a consultation for 10:00
    Consultation::factory()->create([
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-09', // Next Monday
        'time' => '10:00',
        'status' => 'pending',
    ]);

    $result = $this->service->getAvailableSlots($this->doctor, '2023-10-09');
    
    expect($result['slots'][0]['available'])->toBeTrue();  // 09:00
    expect($result['slots'][1]['available'])->toBeFalse(); // 10:00 (booked)
    expect($result['slots'][1]['reason'])->toBe('محجوز');
    expect($result['slots'][2]['available'])->toBeTrue();  // 11:00
});

it('validates slot availability precisely using isSlotAvailable', function () {
    // Valid slot
    expect($this->service->isSlotAvailable($this->doctor, '2023-10-09', '11:00'))->toBeTrue();

    // Invalid slot (undefined time for this doctor)
    expect($this->service->isSlotAvailable($this->doctor, '2023-10-09', '12:00'))->toBeFalse();

    // Invalid slot (past today)
    Carbon::setTestNow($this->knownDate->copy()->setTime(10, 45)); // it's 10:45
    expect($this->service->isSlotAvailable($this->doctor, '2023-10-02', '11:00'))->toBeFalse(); // < 30 mins diff

    // Invalid slot (booked)
    Consultation::factory()->create([
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-09',
        'time' => '09:00',
        'status' => 'confirmed',
    ]);
    expect($this->service->isSlotAvailable($this->doctor, '2023-10-09', '09:00'))->toBeFalse();
});

// ─── Booking Consultations ───────────────────────────────────────────────────

it('successfully books an available slot', function () {
    $data = [
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-09',
        'time' => '10:00',
        'type' => 'video',
        'payment_method' => 'card',
    ];

    $result = $this->service->bookConsultation($data, $this->patient);

    expect($result['success'])->toBeTrue();
    expect($result['consultation']->type)->toBe('video');
    expect($result['consultation']->price)->toEqual(300.0);
    expect($result['payment'])->toHaveKey('payment_url'); // Paymob mock returned this
});

it('prevents booking an unavailable doctor', function () {
    $this->doctor->update(['verification_status' => 'pending']);

    $data = [
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-09',
        'time' => '10:00',
        'type' => 'video',
    ];

    $result = $this->service->bookConsultation($data, $this->patient);

    expect($result['success'])->toBeFalse();
    expect($result['message'])->toContain('غير متاح');
});

it('prevents booking mismatch session type', function () {
    $this->doctor->update(['session_type' => 'offline']);

    $data = [
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-09',
        'time' => '10:00',
        'type' => 'video',
    ];

    $result = $this->service->bookConsultation($data, $this->patient);

    expect($result['success'])->toBeFalse();
    expect($result['message'])->toContain('لا يقبل');
});

// ─── Cancel Consultations ────────────────────────────────────────────────────

it('prevents patient from cancelling less than 24 hours before consultation', function () {
    // Time is 2023-10-02 08:00
    // Setup consultation for 2023-10-02 11:00 (3 hours from now)
    $consultation = Consultation::factory()->create([
        'user_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-02',
        'time' => '11:00',
        'status' => 'confirmed',
    ]);

    $result = $this->service->cancelConsultation($consultation, 'No longer needed', 'patient');

    expect($result['success'])->toBeFalse();
    expect($result['message'])->toContain('أقل من 24 ساعة');
});

it('allows patient to cancel more than 24 hours before consultation', function () {
    // Time is 2023-10-02 08:00
    // Setup consultation for 2023-10-09 (next week)
    $consultation = Consultation::factory()->create([
        'user_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'date' => '2023-10-09',
        'time' => '11:00',
        'status' => 'confirmed',
    ]);

    $result = $this->service->cancelConsultation($consultation, 'Changed my mind', 'patient');

    expect($result['success'])->toBeTrue();
    expect($consultation->fresh()->status)->toBe('cancelled_by_patient');
});
