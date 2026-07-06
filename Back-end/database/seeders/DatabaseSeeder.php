<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * الترتيب مهم جداً — كل مجموعة تعتمد على السابقة
     */
    public function run(): void
    {
        // ── 1. Core (لا FK dependencies) ─────────────────────────────
        $this->call([
            RoleSeeder::class,
            LifeStageSeeder::class,
            SettingsSiteSeeder::class,
            AboutUsSeeder::class,
        ]);

        // ── 2. Users & Accounts (يعتمد على Roles/LifeStages) ────────
        $this->call([
            AdminSeeder::class,
            DoctorSeeder::class,
            PatientSeeder::class,        // 6 User Patients with realistic data
            DefaultImageSeeder::class,   // Fetch images for seeded users/doctors
        ]);

        // ── 3. Health & AI Predictions (يعتمد على Patients, Pregnancies)
        // (Pregnancies generated automatically in PatientSeeder for pregnant stages)
        $this->call([
            GestationalDiabetesPredictionSeeder::class,
            ScbuAdmissionPredictionSeeder::class,
            AiPredictionSeeder::class,   // Preeclampsia / Preterm
        ]);

        // ── 4. Booking & Appointments (يعتمد على Doctors, Patients) ──
        $this->call([
            DoctorWorkingHourSeeder::class,
            ConsultationSeeder::class,   // Bookings mapped to slots
        ]);

        // ── 5. Medical Records (يعتمد على Consultations) ──────────────
        $this->call([
            PrescriptionSeeder::class,  // Medical reports + meds
            LabTestSeeder::class,       // Demo images / OCR mock
            PatientNoteSeeder::class,   // Private doctor notes
        ]);

        // ── 6. Health Tracking (يعتمد على Patients) ───────────────────
        $this->call([
            TrackerSeeder::class,       // Weight, Mood, Period cycles
        ]);

        // ── 7. AI Resources (يعتمد على لا شيء (أو Patients)) ─────────
        $this->call([
            ChatbotDocumentSeeder::class, // vector DB references
            ChatbotSeeder::class,         // Demo chat sessions
        ]);

        // ── 8. Financials (يعتمد على Consultations/Doctors) ──────────
        $this->call([
            PaymentSeeder::class, // (If PaymentSeeder exists, else comment it out. I'll add PayoutSeeder below)
            PayoutSeeder::class,
        ]);

        // ── 9. CMS & Testimonials (يعتمد على Patients, Consultations) 
        $this->call([
            ArticleSeeder::class,
            SuccessStorySeeder::class,
            TestimonialSeeder::class,
        ]);
        
        $this->command->info('Database seeding completed successfully! Widad-Tech Initial Data Loaded.');
    }
}