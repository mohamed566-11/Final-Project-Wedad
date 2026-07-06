<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$patients = \Illuminate\Support\Facades\DB::table('doctor_patients')->get();
foreach ($patients as $p) {
    $count = \App\Models\Consultation::where('doctor_id', $p->doctor_id)
        ->where('user_id', $p->user_id)
        ->where('status', 'completed')
        ->count();
    \Illuminate\Support\Facades\DB::table('doctor_patients')
        ->where('id', $p->id)
        ->update(['total_appointments' => $count]);
}
echo "Recalculated successfully!\n";
