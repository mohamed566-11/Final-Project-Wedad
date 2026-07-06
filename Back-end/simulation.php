<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "\n\n==================================================\n";
    echo "       STARTING CONSULTATION SYSTEM TEST          \n";
    echo "==================================================\n";

    // 1. Identify Actors
    $doctor = \App\Models\Doctor::first();
    if (!$doctor) {
        throw new Exception("No doctors found in database.");
    }
    echo "[1] Doctor: {$doctor->name} (ID: {$doctor->id})\n";
    // Ensure doctor is active/verified for the check
    $doctor->update([
        'is_active' => true, 
        'verification_status' => 'approved', 
        'is_available' => true,
        'session_type' => 'both' // Ensure doctor accepts video
    ]);

    $patient = \App\Models\User::first();
    if (!$patient) {
        // Create a dummy patient if none exists
        $patient = \App\Models\User::create([
            'name' => 'Test Patient',
            'email' => 'patient@test.com',
            'password' => bcrypt('password'),
        ]);
        echo "[1] Created Test Patient: {$patient->name} (ID: {$patient->id})\n";
    }
    echo "[1] Patient: {$patient->name} (ID: {$patient->id})\n";

    // 2. Setup Availability
    $service = app(\App\Services\ConsultationService::class);
    $today = \Carbon\Carbon::now()->format('l'); 
    $dayLower = strtolower($today);
    
    \App\Models\DoctorWorkingHour::updateOrCreate(
        ['doctor_id' => $doctor->id, 'day' => $dayLower],
        ['start_time' => '00:00', 'end_time' => '23:59', 'is_available' => true]
    );
    echo "[2] Availability: Set working hours for {$today} (All Day)\n";

    // 3. Book Consultation
    $date = \Carbon\Carbon::now()->format('Y-m-d');
    // Use +60 minutes to be safely within the >30 minutes validation window
    $time = \Carbon\Carbon::now()->addMinutes(60)->format('H:i'); 
    
    // Clear collisions
    \App\Models\Consultation::where('doctor_id', $doctor->id)
        ->where('date', $date)
        ->where('time', $time)
        ->delete();

    $bookingData = [
        'doctor_id' => $doctor->id,
        'date' => $date, // Today
        'time' => $time, // +30 mins
        'type' => 'video',
        'payment_method' => 'cash',
        'patient_notes' => 'Automated Verification Test'
    ];

    echo "[3] Booking... Date: {$date}, Time: {$time}\n";
    $result = $service->bookConsultation($bookingData, $patient);

    if (!$result['success']) {
        throw new Exception("Booking failed: " . $result['message']);
    }

    $consultation = $result['consultation'];
    echo "    ✅ Booking Successful (ID: {$consultation->id})\n";
    echo "    - Status: {$consultation->status}\n";
    echo "    - Meet Link: " . ($consultation->google_meet_link ?? 'None (Expected)') . "\n";

    // 4. Doctor Confirms
    $consultation->update(['status' => 'confirmed']);
    echo "[4] Doctor confirmed appointment.\n";

    // 5. Start Consultation (Generate Link)
    echo "[5] Attempting to START consultation (Generate Link)...\n";
    
    // Adjust time to NOW to bypass "too early" restriction
    $consultation->update(['time' => \Carbon\Carbon::now()->format('H:i')]);
    echo "    - Updated time to NOW to validation check.\n";

    $startResult = $service->startConsultation($consultation);

    if ($startResult['success']) {
        $consultation->refresh();
        echo "    ✅ START SUCCESSFUL!\n";
        echo "    ======================================\n";
        echo "    STATUS        : {$consultation->status}\n";
        echo "    MEET LINK     : {$consultation->google_meet_link}\n";
        echo "    GOOGLE EVENT  : {$consultation->google_event_id}\n";
        echo "    MEET ID       : {$consultation->google_meet_id}\n";
        echo "    ======================================\n";
        
        if (str_contains($consultation->google_meet_link, 'jit.si')) {
             echo "    ℹ️  NOTE: System using Jitsi Mock (Debug Mode Active)\n";
        } elseif (str_contains($consultation->google_meet_link, 'meet.google.com')) {
             echo "    ℹ️  NOTE: System using Real Google Meet\n";
        }
    } else {
        echo "    ❌ START FAILED: " . $startResult['message'] . "\n";
        if (isset($startResult['needs_auth']) && $startResult['needs_auth']) {
            echo "    ⚠️  REASON: Doctor needs to connect Google Account first.\n";
            echo "    -> Please visit Doctor Dashboard > Settings > Connect Google\n";
        }
    }

    echo "\nTest Complete.\n";
} catch (\Exception $e) {
    echo "\n❌ TEST FAILED: " . $e->getMessage() . "\n";
}
