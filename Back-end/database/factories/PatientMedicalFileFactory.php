<?php

namespace Database\Factories;

use App\Models\PatientMedicalFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PatientMedicalFileFactory extends Factory
{
    protected $model = PatientMedicalFile::class;

    public function definition(): array
    {
        $uuid = Str::uuid();

        return [
            'user_id'     => User::factory(),
            'file_name'   => $uuid . '.pdf',
            'file_path'   => 'medical_files/' . $uuid . '.pdf',
            'file_type'   => 'application/pdf',     // real MIME type
            'file_size'   => $this->faker->numberBetween(1024, 10240),
            'category'    => $this->faker->randomElement([
                'lab_result', 'ultrasound', 'x_ray',
                'prescription', 'medical_report', 'other',
            ]),
            'description' => $this->faker->optional()->sentence(),
            'file_date'   => $this->faker->date(),
        ];
    }
}
