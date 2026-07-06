<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;
use App\Models\Article;
use App\Models\LabTestResult;
use App\Models\PatientMedicalFile;
use App\Models\SettingsSite;

class MigrateStoragePaths extends Command
{
    protected $signature   = 'storage:migrate-paths {--dry-run : عرض التغييرات بدون تطبيقها}';
    protected $description = 'ترحيل مسارات الملفات القديمة إلى المسارات الموحّدة الجديدة';

    public function handle(): void
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? '🔍 وضع المعاينة — لا تغييرات فعلية' : '🚀 بدء الترحيل...');

        // 1. صور المرضى: patients/images/ → profiles/
        $this->migrateUserImages($dryRun);

        // 2. صور الأطباء: doctors/images/ → profiles/
        $this->migrateDoctorImages($dryRun);

        // 3. صور الأدمن: admins/ → profiles/
        $this->migrateAdminImages($dryRun);

        // 4. صور المقالات: articles/images/ → articles/
        $this->migrateArticleImages($dryRun);

        // 5. صور التحاليل: lab-test-images/ → lab-tests/
        $this->migrateLabTestImages($dryRun);

        // 6. الملفات الطبية: patients/medical_files/ → medical-files/
        $this->migrateMedicalFiles($dryRun);

        // 7. إعدادات الموقع: basename فقط → مسار كامل settings/logo.ext
        $this->migrateSettingsFiles($dryRun);

        $this->info('');
        $this->info($dryRun ? '✅ انتهت المعاينة — شغّل بدون --dry-run للتطبيق' : '✅ انتهى الترحيل بنجاح');
    }

    // ─── 1. صور المرضى ────────────────────────────────────────────────────────

    private function migrateUserImages(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [1/7] ترحيل صور المرضى: patients/images/ → profiles/');
        $count = 0;

        User::whereNotNull('image')
            ->where('image', 'like', 'patients/images/%')
            ->chunkById(100, function ($users) use ($dryRun, &$count) {
                foreach ($users as $user) {
                    $oldPath  = $user->image;
                    $filename = basename($oldPath);
                    $newPath  = 'profiles/' . $filename;

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        $this->ensureProfilesDir();
                        if (file_exists(public_path($oldPath))) {
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $user->update(['image' => $newPath]);
                    }
                    $count++;
                }
            });

        $this->info("  → {$count} صورة مرحَّلة");
    }

    // ─── 2. صور الأطباء ───────────────────────────────────────────────────────

    private function migrateDoctorImages(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [2/7] ترحيل صور الأطباء: doctors/images/ → profiles/');
        $count = 0;

        Doctor::whereNotNull('image')
            ->where('image', 'like', 'doctors/images/%')
            ->chunkById(100, function ($doctors) use ($dryRun, &$count) {
                foreach ($doctors as $doctor) {
                    $oldPath  = $doctor->image;
                    $filename = basename($oldPath);
                    $newPath  = 'profiles/' . $filename;

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        $this->ensureProfilesDir();
                        if (file_exists(public_path($oldPath))) {
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $doctor->update(['image' => $newPath]);
                    }
                    $count++;
                }
            });

        $this->info("  → {$count} صورة مرحَّلة");
    }

    // ─── 3. صور الأدمن ────────────────────────────────────────────────────────

    private function migrateAdminImages(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [3/7] ترحيل صور الأدمن: admins/ → profiles/');
        $count = 0;

        Admin::whereNotNull('image')
            ->where('image', 'not like', 'profiles/%')
            ->chunkById(100, function ($admins) use ($dryRun, &$count) {
                foreach ($admins as $admin) {
                    $oldPath = $admin->image;
                    $newPath = 'profiles/' . basename($oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        $this->ensureProfilesDir();
                        if (file_exists(public_path($oldPath))) {
                            copy(public_path($oldPath), public_path($newPath));
                        } elseif (Storage::disk('public')->exists($oldPath)) {
                            // بعض صور الأدمن قد تكون على disk public
                            $content = Storage::disk('public')->get($oldPath);
                            file_put_contents(public_path($newPath), $content);
                        }
                        $admin->update(['image' => $newPath]);
                    }
                    $count++;
                }
            });

        $this->info("  → {$count} صورة مرحَّلة");
    }

    // ─── 4. صور المقالات ──────────────────────────────────────────────────────

    private function migrateArticleImages(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [4/7] ترحيل صور المقالات: articles/images/ → articles/');

        Article::whereNotNull('image')
            ->where('image', 'like', 'articles/images/%')
            ->chunkById(100, function ($articles) use ($dryRun) {
                foreach ($articles as $article) {
                    $oldPath = $article->image;
                    $newPath = 'articles/' . basename($oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (!file_exists(public_path('articles'))) {
                            mkdir(public_path('articles'), 0755, true);
                        }
                        if (file_exists(public_path($oldPath))) {
                            copy(public_path($oldPath), public_path($newPath));
                        }
                        $article->update(['image' => $newPath]);
                    }
                }
            });
    }

    // ─── 5. صور التحاليل ──────────────────────────────────────────────────────

    private function migrateLabTestImages(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [5/7] ترحيل صور التحاليل: lab-test-images/ → lab-tests/');

        LabTestResult::whereNotNull('image_path')
            ->where('image_path', 'like', 'lab-test-images/%')
            ->chunkById(100, function ($tests) use ($dryRun) {
                foreach ($tests as $test) {
                    $oldPath = $test->image_path;
                    // lab-test-images/{user_id}/file.jpg → lab-tests/{user_id}/file.jpg
                    $newPath = str_replace('lab-test-images/', 'lab-tests/', $oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->copy($oldPath, $newPath);
                        }
                        $test->update(['image_path' => $newPath]);
                    }
                }
            });
    }

    // ─── 6. الملفات الطبية ────────────────────────────────────────────────────

    private function migrateMedicalFiles(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [6/7] ترحيل الملفات الطبية: patients/medical_files/ → medical-files/');

        PatientMedicalFile::whereNotNull('file_path')
            ->where('file_path', 'like', 'patients/medical_files/%')
            ->chunkById(100, function ($files) use ($dryRun) {
                foreach ($files as $file) {
                    $oldPath = $file->file_path;
                    // patients/medical_files/{user_id}/{name} → medical-files/{user_id}/{name}
                    $newPath = str_replace('patients/medical_files/', 'medical-files/', $oldPath);

                    $this->line("  {$oldPath} → {$newPath}");

                    if (!$dryRun) {
                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->copy($oldPath, $newPath);
                        }
                        $file->update(['file_path' => $newPath]);
                    }
                }
            });
    }

    // ─── 7. إعدادات الموقع ────────────────────────────────────────────────────

    private function migrateSettingsFiles(bool $dryRun): void
    {
        $this->info('');
        $this->info('📁 [7/7] ترحيل إعدادات الموقع: basename فقط → مسار كامل');

        $settings = SettingsSite::first();
        if (!$settings) {
            $this->line('  لا توجد إعدادات موقع.');
            return;
        }

        // إذا كان محفوظاً كـ basename فقط (بدون مسار)
        if ($settings->logo && !str_contains($settings->logo, '/')) {
            $newLogo = 'settings/' . $settings->logo;
            $this->line("  logo: {$settings->logo} → {$newLogo}");
            if (!$dryRun) {
                $settings->update(['logo' => $newLogo]);
            }
        }

        if ($settings->favicon && !str_contains($settings->favicon, '/')) {
            $newFavicon = 'settings/' . $settings->favicon;
            $this->line("  favicon: {$settings->favicon} → {$newFavicon}");
            if (!$dryRun) {
                $settings->update(['favicon' => $newFavicon]);
            }
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function ensureProfilesDir(): void
    {
        if (!file_exists(public_path('profiles'))) {
            mkdir(public_path('profiles'), 0755, true);
        }
    }
}
