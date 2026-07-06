<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Doctor;
use App\Models\DoctorWorkingHour;

class DoctorWorkingHourSeeder extends Seeder
{
    public function run()
    {
        $doctors = Doctor::all();

        // Each slot = 1 hour, generate slots from 9am-5pm
        $slots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday'];

        foreach ($doctors as $doctor) {
            foreach ($days as $day) {
                foreach ($slots as $slot) {
                    DoctorWorkingHour::firstOrCreate([
                        'doctor_id' => $doctor->id,
                        'day' => $day,
                        'start_time' => $slot,
                    ]);
                }
            }
        }
    }
}
