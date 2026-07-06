<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;

class DefaultImageSeeder extends Seeder
{
    public function run(): void
    {
        // تأكد من وجود مجلد profiles/
        if (!file_exists(public_path('profiles'))) {
            mkdir(public_path('profiles'), 0755, true);
        }

        // For Doctors — يحفظ في public/profiles/
        $doctors = Doctor::all();
        foreach ($doctors as $doctor) {
            // إذا كانت الصورة موجودة وتبدأ بـ profiles/ فلا نعيد التنزيل
            if ($doctor->image && str_starts_with($doctor->image, 'profiles/') && file_exists(public_path($doctor->image))) {
                continue;
            }

            $firstName = explode(' ', $doctor->name)[1] ?? $doctor->name;
            $url = "https://ui-avatars.com/api/?name=" . urlencode($firstName) . "&background=E91E8C&color=fff&size=200";
            try {
                $content = Http::timeout(10)->get($url)->body();
                $filename = "doctor_{$doctor->id}.png";
                $path = "profiles/{$filename}";
                // احفظ في public/ مباشرةً (disk: uploads)
                file_put_contents(public_path($path), $content);
                $doctor->update(['image' => $path]);
            } catch (\Exception $e) {
                $this->command->warn("Failed to download image for Doctor: {$doctor->name}");
            }
        }

        // For Patients — يحفظ في public/profiles/
        $patients = User::all();
        foreach ($patients as $patient) {
            if ($patient->image && str_starts_with($patient->image, 'profiles/') && file_exists(public_path($patient->image))) {
                continue;
            }

            $firstName = explode(' ', $patient->name)[0] ?? $patient->name;
            $url = "https://ui-avatars.com/api/?name=" . urlencode($firstName) . "&background=9C27B0&color=fff&size=200";
            try {
                $content = Http::timeout(10)->get($url)->body();
                $filename = "patient_{$patient->id}.png";
                $path = "profiles/{$filename}";
                file_put_contents(public_path($path), $content);
                $patient->update(['image' => $path]);
            } catch (\Exception $e) {
                $this->command->warn("Failed to download image for Patient: {$patient->name}");
            }
        }

        // For Admins — يحفظ في public/profiles/
        $admins = Admin::all();
        foreach ($admins as $admin) {
            if ($admin->image && str_starts_with($admin->image, 'profiles/') && file_exists(public_path($admin->image))) {
                continue;
            }

            $firstName = explode(' ', $admin->name)[0] ?? $admin->name;
            $url = "https://ui-avatars.com/api/?name=" . urlencode($firstName) . "&background=3F51B5&color=fff&size=200";
            try {
                $content = Http::timeout(10)->get($url)->body();
                $filename = "admin_{$admin->id}.png";
                $path = "profiles/{$filename}";
                file_put_contents(public_path($path), $content);
                $admin->update(['image' => $path]);
            } catch (\Exception $e) {
                $this->command->warn("Failed to download image for Admin: {$admin->name}");
            }
        }
    }
}
