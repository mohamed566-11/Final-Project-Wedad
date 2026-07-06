# خطة Migrations + Seeders الشاملة — مشروع وداد
## الجزء الأول: تدقيق الـ Migrations (Audit)

---

## القسم 1.1 — نتائج الفحص الزمني للـ 81 Migration

### ✅ الترتيب العام: سليم بدون FK Conflicts

بعد فحص كل الـ 81 migration بالترتيب، **لا توجد مشاكل FK ordering**. الهيكل مبني على طبقتين:

- **الطبقة الأولى `0001_01_01_*`**: 38 migration — الجداول الأساسية (بدون تاريخ حقيقي = أولوية تشغيل عالية)
- **الطبقة الثانية `2024_* → 2026_*`**: 43 migration — إضافات وتعديلات لاحقة

---

### 1.2 جدول الـ Dependencies الكامل

| Migration | يحتاج (FK) | موجود قبله؟ | حالة |
|---|---|---|---|
| `000001_create_users_table` | `life_stages` | ✅ (`000000`) | سليم |
| `000014_create_admins_table` | `roles` | ✅ (`000004`) | سليم |
| `000015_create_user_profiles_table` | `users` | ✅ (`000001`) | سليم |
| `000016_create_doctors_table` | — | ✅ | سليم |
| `000017_create_doctor_life_stages_table` | [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85), `life_stages` | ✅ | سليم |
| `000018_create_doctor_patients_table` | [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85), `users` | ✅ | سليم |
| `000019_create_doctor_working_hours_table` | [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85) | ✅ | سليم |
| `000020_create_consultations_table` | [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85), `users` | ✅ | سليم |
| `000021_create_appointment_reminders_table` | [consultations](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#86-90), `users` | ✅ | سليم |
| `000022_create_consultation_reviews_table` | [consultations](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#86-90), `users`, [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85) | ✅ | سليم |
| `000023_create_payments_table` | [consultations](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#86-90), `users` | ✅ | سليم |
| `000029_create_pregnancies_table` | `users` | ✅ | سليم |
| `000030_create_pregnancy_entries_table` | [pregnancies](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#121-125) | ✅ | سليم |
| `000035_create_preeclampsia_predictions_table` | `users`, [pregnancies](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#121-125), [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85) | ✅ | سليم |
| `000036_create_gestational_diabetes_predictions_table` | `users`, [pregnancies](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#121-125), [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85) | ✅ | سليم |
| `000037_create_preterm_birth_predictions_table` | `users`, [pregnancies](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#121-125), [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85) | ✅ | سليم |
| `000038_create_ml_predictions_history_table` | `users` + morphs | ✅ | سليم |
| `2026_02_06_150000_create_prescriptions_table` | [consultations](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#86-90), [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85), `users` | ✅ | سليم |
| `2026_03_01_create_audit_logs_table` | `admins` | ✅ | سليم |
| `2026_06_21_create_consultation_messages_table` | [consultations](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#86-90) | ✅ | سليم |
| `2026_06_21_create_lab_test_results_table` | `users` | ✅ | سليم |
| `2026_06_21_create_patient_chatbot_preferences_table` | `users` | ✅ | سليم |
| `2026_06_27_create_scbu_admission_predictions_table` | `users`, [pregnancies](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#121-125) | ✅ | سليم |
| `2026_06_28_make_pregnancy_id_nullable_in_predictions` | يعدل GDM+PE+PTB | ✅ | سليم |

---

### 1.3 خطة دمج الـ Migrations الجانبية (Consolidation)

بناءً على التوجيه الجديد، سيتم تقليص عدد ملفات الـ migrations من 81 ملف إلى حوالي 50 ملف أساسي شامل. سيتم دمج جميع التعديلات التالية والحقول المضافة داخل ملفات الإنشاء الأساسية `create_table`:

1. **تعديلات الأطباء والاستشارات**: دمج حقول (Google Meet، rejection_reason، والـ Enums الخاصة بالإلغاء، و google_email).
2. **الـ Notification Settings**: سيتم دمجها لجدول `users`, [doctors](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#79-85), `admins` مباشرة في ملفات الإنشاء.
3. **التغييرات المعمارية (Polymorphic & Slots)**: 
   - سيتم وضع الشكل النهائي لـ `push_subscriptions` بأنه Polymorphic من البداية بدون حقل `user_id` اليتيم.
   - سيتم وضع الشكل النهائي لـ `doctor_working_hours` كنظام Slots بمفتاح `unique` من البداية.
4. **الـ Performance Indexes**: سيتم نقل جميع تعريفات الـ indexes المضافة لاحقاً ووضعها داخل ملف إنشاء كل جدول المعني بالأمر.
5. **التقارير والمقالات والـ Settings**: دمج حقول (terms_privacy، bot_type، is_delivered، وغيرها).

#### 🗂️ تفاصيل الدمج والحذف بالتفصيل (Consolidation Mapping)

| الجدول الأساسي (Base Table) | الإضافات المطلوبة داخله (Fields & Indexes) | ملفات سيتم حذفها (Files to Delete) |
|---|---|---|
| **users** | <li>json `notification_settings` nullable</li><li>index `is_active`</li><li>index `life_stage_id`</li> | `..._add_notification_settings...`, `..._add_performance_indexes` |
| **doctors** | <li>json `notification_settings` nullable</li><li>text `rejection_reason` nullable</li><li>string `google_email`, text `google_access...`</li><li>indexes: specialization, is_active, verification_status</li> | `..._add_rejection_reason...`, `..._switch_zoom...`, `..._add_google_email...` |
| **admins** | <li>json `notification_settings` nullable</li> | `..._add_notification_settings_to_admins` |
| **consultations** | <li>`cancelled_by_admin` في `status`</li><li>`google_meet_*` بدلاً من Zoom</li> | `..._add_cancelled_by_admin...`, `..._switch_zoom...` |
| **settings_site** | <li>longText `terms_content` + `privacy_content`</li> | `..._add_terms_privacy...` |
| **join_us** | <li>`license_number`, `consultation_price`</li> | `..._add_doctor_details...`, `..._change_specialty...` |
| **about_us** | <li>`title`, `subtitle`</li> | `..._add_titles...` |
| **user_profiles** | <li>`blood_pressure_systolic/diastolic`</li> | `..._add_blood_pressure...` |
| **notification_history**| <li>`pending` في الـ enum</li> | `..._add_pending_status...` |
| **ai_chat_messages** | <li>`bot_type`, و indexes للأداء</li> | `..._add_bot_type...`, `..._add_chatbot_query_indexes...` |
| **consultation_messages**| <li>boolean `is_delivered`</li> | `..._add_is_delivered_to_consultation_messages` |
| **ml_predictions_history**| <li>enums + `processing_time_ms`</li> | `..._fix_ml_predictions_history_table` |
| **Predictions** (GDM وغيرها)| <li>`pregnancy_id` nullable</li> | `..._make_pregnancy_id_nullable...` |
| **period_cycles** وغيرها | <li>indexes جديدة</li> | `..._add_performance_indexes (2)` |
| **push_subscriptions** | <li>`morphs('subscribable')` من البداية</li> | `..._make_push_subscriptions_polymorphic` |
| **doctor_working_hours** | <li>نظام Slots + `unique`</li> | `..._modify_doctor_working_hours...` |

بمجرد نقل المحتوى، سيتم **حذف كافة الملفات الفرعية المذكورة في الجدول** (حوالي 25 ملف)، ليكون الاعتماد الكامل على أمر `php artisan migrate:fresh` بجداول نظيفة بنسبة 100%.

---

### 1.4 المشاكل المكتشفة (الأخرى)

#### 🟡 مشكلة 1: `push_subscriptions` — تضارب بين طبقتين

```
2024_01_20_000001_create_push_subscriptions_table.php
  → يُنشئ الجدول مع FK على users

2025_01_01_000003_make_push_subscriptions_polymorphic.php
  → يحذف الـ FK ويضيف subscribable_type + subscribable_id
```

**المشكلة**: عند `migrate:fresh`، الـ migration الأول يُنشئ `user_id` كـ FK حقيقي، ثم migration الثاني يحذفه ويضيف `subscribable_*` — لكن **`user_id` لا يُحذف** من الجدول. الجدول النهائي يحتوي على `user_id` (عمود يتيم) + `subscribable_type` + `subscribable_id`.

**التأثير**: [PushSubscription.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PushSubscription.php) يستخدم `morphTo('subscribable')` لكن user_id لا يزال موجوداً وقد يُربك الـ queries.

**الإصلاح المقترح**: إضافة `dropColumn('user_id')` في migration الـ polymorphic:
```php
// في 2025_01_01_000003_make_push_subscriptions_polymorphic.php
// بعد نقل البيانات:
$table->dropColumn('user_id'); // أضف هذا
```

---

#### 🟡 مشكلة 2: `ml_predictions_history` — enum لا يتطابق مع Fix migration

```
0001_01_01_000038_create_ml_predictions_history_table.php
  → enum('disease_type', ['preeclampsia', 'gestational_diabetes', 'preterm_birth'])

2026_06_27_000002_fix_ml_predictions_history_table.php
  → يضيف scbu_admission + risk_level + recommendation_summary + processing_time_ms
```

**الملاحظة**: في `migrate:fresh`، الـ create migration لا يتضمن `scbu_admission` في الـ enum ابتداءً، والـ fix migration يعدله لاحقاً بـ `DB::statement()` مباشرة. **هذا الأسلوب يعمل** لكنه يحتاج MySQL (لا يعمل على SQLite في Testing).

**التحقق**: ✅ الـ fix migration موجود ويعمل — لكن في بيئة Testing يجب الانتباه.

---

#### 🟡 مشكلة 3: `preeclampsia_predictions` — `pregnancy_id` غير nullable أصلاً

```
0001_01_01_000035: pregnancy_id → constrained (NOT NULL)
2026_06_28: make_pregnancy_id_nullable → يجعلها nullable بـ change()
```

**المشكلة**: `change()` في Laravel يحتاج `doctrine/dbal`. إذا لم يكن مثبتاً، سيفشل.

**الإصلاح**: تأكد من وجود:
```bash
composer require doctrine/dbal
```

---

#### 🔴 مشكلة 4: [ConsultationSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/ConsultationSeeder.php#11-104) يستخدم حقول غير موجودة في Migration

الـ ConsultationSeeder يُرسل:
```php
'google_meet_link' => '...',  // ❌
'google_meet_id'   => '...',  // ❌
'google_event_id'  => '...',  // ❌
```

لكن migration الاستشارة (`000020`) يحتوي على:
```php
'zoom_meeting_id'  // ✅ موجود
'zoom_join_url'    // ✅ موجود
'zoom_password'    // ✅ موجود
```

وتم إضافة حقول Google Meet في:
```
2024_02_01_000001_switch_zoom_to_google_meet.php
```

**التأثير**: `php artisan db:seed` يفشل بسبب الإرسال لحقول صحيحة (google_meet_*) التي أُضيفت بـ migration منفصل.

**الحل**: التأكد أن migration الـ google meet يُشغّل **قبل** الـ seeder، وهذا يحدث تلقائياً في `migrate:fresh`.

---

#### 🟡 مشكلة 5: [PatientSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/PatientSeeder.php#11-133) يستخدم `life_stage = 'motherhood'` للحوامل

```php
// PatientSeeder.php
$pregnancyStage = LifeStage::where('name', 'motherhood')->first(); // ← خطأ منطقي!
```

المريضات `sara@example.com` و `mariam@example.com` يُعيَّن لهن `motherhood` وليس [pregnancy](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/GestationalDiabetesPrediction.php#85-89). هذا يُربك الـ PatientDataCollectorService الذي يفحص `life_stage`.

**الإصلاح المطلوب في PatientSeeder**:
```php
$pregnancyStage = LifeStage::where('name', 'pregnancy')->first(); // ✅
$postpartumStage = LifeStage::where('name', 'motherhood')->first(); // للأمومة
$preMarriageStage = LifeStage::where('name', 'pre-marriage')->first();
```

---

#### 🟡 مشكلة 6: [PatientSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/PatientSeeder.php#11-133) يستخدم `User::create()` بدون `updateOrCreate` (ليس Idempotent)

تشغيل `db:seed` مرتين يُنشئ مريضات مكررة بنفس الإيميل → خطأ unique constraint.

**الإصلاح**: استخدام `updateOrCreate(['email' => $email], $data)`.

---

#### 🟡 مشكلة 7: [AdminSeeder](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/AdminSeeder.php#10-41) — كلمة مرور ضعيفة (`password123`)

```php
'password' => Hash::make('password123'), // ضعيف في بيئة demo
```

**الإصلاح المقترح**: `Admin@123456` مع توثيق الـ credentials.

---

### 1.4 Migrations جديدة مطلوبة

بعد مقارنة Models مع Migrations:

| Model | الجدول المتوقع | Migration موجود؟ | ملاحظة |
|---|---|---|---|
| [AppointmentReminder.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/AppointmentReminder.php) | `appointment_reminders` | ✅ `000021` | موجود |
| [PatientNote.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientNote.php) | `patient_notes` | ✅ `2026_02_06_135746` | موجود |
| [HealthSync.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/HealthSync.php) | `health_syncs` | ✅ `000033` | موجود |
| [PatientGoogleFit.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientGoogleFit.php) | `patient_google_fits` | ✅ `2026_06_18_185759` | موجود |
| [PatientHeartRate.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientHeartRate.php) | `patient_heart_rates` | ✅ `2026_06_18_190017` | موجود |
| [PatientOxygen.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientOxygen.php) | `patient_oxygens` | ✅ `2026_06_18_190025` | موجود |
| [PatientSleep.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientSleep.php) | `patient_sleeps` | ✅ `2026_06_18_185759` | موجود |
| [PatientStep.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientStep.php) | `patient_steps` | ✅ `2026_06_18_190149` | موجود |
| [ConsultationMessage.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationMessage.php) | `consultation_messages` | ✅ `2026_06_21_000001` | موجود |
| [LabTestResult.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/LabTestResult.php) | `lab_test_results` | ✅ `2026_06_21_000002` | موجود |
| [ChatbotDocument.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/ChatbotDocument.php) | `chatbot_documents` | ✅ `2026_03_14_130000` | موجود |
| [PatientChatbotPreference.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PatientChatbotPreference.php) | `patient_chatbot_preferences` | ✅ `2026_06_21_000004` | موجود |
| [ScbuAdmissionPrediction.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/ScbuAdmissionPrediction.php) | `scbu_admission_predictions` | ✅ `2026_06_27_000001` | موجود |
| [DoctorJoinRequest.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/DoctorJoinRequest.php) | `doctor_join_requests` | ✅ `2026_06_06_022846` | موجود |
| [PregnancyKickSession.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PregnancyKickSession.php) | `pregnancy_kick_sessions` | ✅ `2026_01_31_152500` | موجود |
| [PregnancyMedication.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PregnancyMedication.php) | `pregnancy_medications` | ✅ `2026_01_31_143445` | موجود |
| [PayoutRequest.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/PayoutRequest.php) | `payout_requests` | ✅ `2026_02_06_143000` | موجود |
| [AuditLog.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/AuditLog.php) | `audit_logs` | ✅ `2026_03_01_210000` | موجود |
| [ConsultationAttachment.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/ConsultationAttachment.php) | `consultation_attachments` | ✅ `2026_06_04_000001` | موجود |
| [Testimonial.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/Testimonial.php) | `testimonials` | ✅ `2026_02_08_183000` | موجود |
| [SuccessStory.php](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/SuccessStory.php) | `success_stories` | ✅ `2026_02_08_190000` | موجود |

**✅ الخلاصة: كل الـ 52 Model لها migrations مقابلة — لا توجد جداول ناقصة.**

---

### 1.5 فحص Column Types & Best Practices

| الجدول | الملاحظة | الحالة |
|---|---|---|
| `consultations.status` | `enum` ✅ | ممتاز |
| `doctors.verification_status` | `enum` ✅ | ممتاز |
| `doctors.specialization` | `enum` ✅ | ممتاز |
| `users.is_active` | `boolean()` ✅ | ممتاز |
| `ai_chat_messages.bot_type` | `enum` في migration منفصل ✅ | ممتاز |
| `gestational_diabetes_predictions` | index مفقود على `user_id` | ⚠️ يوجد في performance migration |
| `chatbot_documents.status` | `string` بدلاً من `enum` | 🟡 مقبول لكن `enum` أفضل |
| `push_subscriptions.user_id` | عمود يتيم لم يُحذف | 🟡 انظر مشكلة 1 |

---

### 1.6 SoftDeletes Consistency

| Model | SoftDeletes في Model؟ | `deleted_at` في Migration؟ |
|---|---|---|
| [User](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#15-217) | ✅ | ✅ `000001` |
| [Doctor](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/DoctorSeeder.php#10-139) | ✅ | ✅ `000016` |
| [Consultation](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/ConsultationSeeder.php#11-104) | ✅ | ✅ `000020` |
| [ScbuAdmissionPrediction](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/database/seeders/ScbuAdmissionPredictionSeeder.php#10-78) | ✅ | ✅ `2026_06_27` |
| `Article` | لا | لا | ✅ متسق |
| [Pregnancy](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/User.php#126-130) | لا | لا | ✅ متسق |

**✅ لا توجد تناقضات في SoftDeletes.**

