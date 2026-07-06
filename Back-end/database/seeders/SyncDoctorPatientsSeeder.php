<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SyncDoctorPatientsSeeder extends Seeder
{
    public function run()
    {
        $consultations = Consultation::all();
        $count = 0;

        foreach ($consultations as $c) {
            if (!$c->doctor_id || !$c->user_id) continue;

            $existing = DB::table('doctor_patients')
                ->where('doctor_id', $c->doctor_id)
                ->where('user_id', $c->user_id)
                ->first();

            if ($existing) {
                DB::table('doctor_patients')
                    ->where('id', $existing->id)
                    ->update([
                        'last_appointment_date' => $c->date > $existing->last_appointment_date ? $c->date->format('Y-m-d') : $existing->last_appointment_date,
                        'total_appointments' => Consultation::where('doctor_id', $c->doctor_id)->where('user_id', $c->user_id)->count(),
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('doctor_patients')->insert([
                    'doctor_id' => $c->doctor_id,
                    'user_id' => $c->user_id,
                    'first_appointment_date' => $c->date->format('Y-m-d'),
                    'last_appointment_date' => $c->date->format('Y-m-d'),
                    'total_appointments' => Consultation::where('doctor_id', $c->doctor_id)->where('user_id', $c->user_id)->count(),
                    'created_at' => $c->created_at ?? now(),
                    'updated_at' => now(),
                ]);
                $count++;
            }
        }

        echo "Synced $count new doctor-patient relationships.\n";
    }
}
