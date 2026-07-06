<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Consultation;
use App\Models\PatientNote;

class PatientNoteSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $consultations = Consultation::where('status', 'completed')->with('doctor', 'patient')->get();

            foreach ($consultations as $consultation) {
                PatientNote::updateOrCreate(
                    [
                        'doctor_id' => $consultation->doctor_id,
                        'user_id' => $consultation->user_id,
                    ],
                    [
                        'note' => 'المريضة تعاني من بعض الإرهاق بسبب الحمل، تمت التوصية بالراحة وتناول الفيتامينات بانتظام.',
                        'is_private' => true, // Only doctor sees this
                    ]
                );
            }
        });
    }
}
