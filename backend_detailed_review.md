# الخريطة البرمجية التفصيلية لمجلد الباك-إند (Back-End Detailed Architecture)

> هذا التوثيق يقدم **أدق وأعمق تفصيل ممكن** لكل ملف، موديل، كونترولر، وخدمة برمجية داخل مشروع Laravel 12 الجاري. تمت كتابة هذا التقرير خصيصاً لتفصيل "تفاصيل التفاصيل" الخاصة بالباك إند.

---

## 🏗️ 1. الموديلات (Models) — 52 موديل قاعدة بيانات
يستخدم المشروع نمط Eloquent ORM. إليك الشرح التفصيلي لأسماء جميع الـ Models وما تمثله:

### 👤 أ. مستخدمو النظام (User Types / Auth)
* `User.php`: يُمثل المريضة (Patient)، يتضمن `Authenticatable` و `HasApiTokens` (Sanctum) و `SoftDeletes`. تم إضافة حقول لضغط الدم الأساسي به.
* `Doctor.php`: يُمثل الطبيبة المعالجة. لديه مسار تحقق (`google_email`, `verification_status`) وحقول لتسجيل الجلسات والمواعيد.
* `Admin.php`: مديرو النظام مع إمكانيات Role-Based Access Control (RBAC).
* `Role.php`: جدول الصلاحيات الذي يُربط بالـ `Admin` لمنحه وصول لصفحات معينة.
* `UserProfile.php`: الملف الشخصي المفصل الذي يُربط بالمريضة.

### 💖 ب. المتتبعات الحيوية وصحة المرأة (Health Trackers)
* `PeriodCycle.php`: يتتبع موعد بدء الدورة الشهرية، مدتها، وطولها.
* `FertilityEntry.php`: إدخالات الخصوبة اليومية (درجة الحرارة، الأعراض) لبوت ما قبل الزواج.
* `MoodEntry.php`: يقيس تقلبات المزاج للمريضة، خصوصاً لمتتبع الـ Postpartum (ما بعد الولادة).
* `WeightEntry.php`: تتبع مؤشر الكتلة (BMI) ومسار الزيادة أو النقصان.

### 🤰 ج. تتبع الحمل والأمومة (Pregnancy Trackers)
* `Pregnancy.php`: يمثل حالة الحمل الجارية بمعلوماتها (تاريخ الولادة المتوقع).
* `PregnancyEntry.php`: الملاحظات الأسبوعية أو اليومية الخاصة بالحمل.
* `PregnancyKickSession.php`: متتبع لركلات الجنين (Kick Counter).
* `PregnancyMedication.php`: الأدوية والمكملات التي تتناولها الحامل.

### 🤖 د. الذكاء الاصطناعي والتنبؤات (AI Models & Config)
* `PreeclampsiaPrediction.php` & `GestationalDiabetesPrediction.php` & `PretermBirthPrediction.php` & `ScbuAdmissionPrediction.php`: موديلات مخصصة لحفظ تقارير ومُخرجات نماذج التشخيص الطبية من HF.
* `MlPredictionsHistory.php`: أرشيف موحد لأي استدعاء لنموذج Machine Learning.
* `AiChatMessage.php`: يحفظ محادثات الشات بوت مفصولة بعمود `bot_type` لمعرفة نوع البوت المستخدم (ولادة، حمل...).
* `ChatbotDocument.php`: ملفات الـ (RAG) أو المعرفة السياقية التي يقوم الأدمن برفعها لتدريب الشات بوت.
* `PatientChatbotPreference.php`: تفضيلات المريضة لاستجابة الشات بوت (ربما للغة أو أسلوب المحادثة).

### 🩺 هـ. العيادة الإلكترونية والاستشارات (Telehealth)
* `Consultation.php`: الكيان الأساسي للحجز. يتنقل عبر حالات: `pending`, `confirmed`, `in_progress`, إلخ.
* `ConsultationAttachment.php`: صور الروشتات، تقارير آشعة مرافقة قبل أو أثناء الاستشارة.
* `ConsultationMessage.php`: جدول رسائل الشات النصي *الداخلي* بين المريضة والطبيبة (أثناء الجلسة الجارية).
* `ConsultationReview.php`: التقييم بالنجوم والمراجعات النصية للطبيبة بعد الانتهاء.
* `Prescription.php`: الوصفة الطبية التي تكتبها الطبيبة.
* `DoctorWorkingHour.php`: يعتمد على نظام الـ Time-Slots لتحديد أوقات عمل الطبيبة وإتاحتها.
* `AppointmentReminder.php`: إشعارات استباقية للتذكير بالموعد.
* `PatientNote.php`: ملاحظات الطبيبة الخاصة والسرية حول المريضة.

### ⌚ و. الربط بالأجهزة الذكية والتحاليل (IoT & Labs)
* `PatientGoogleFit.php`: تتبع مستويات النشاط المربوطة من Google Fit.
* `PatientHeartRate.php` & `PatientOxygen.php` & `PatientSleep.php` & `PatientStep.php`: موديلات فرعية متخصصة لتسجيل القراءات اللحظية أو اليومية.
* `LabTestResult.php`: نتائج قراءة تقارير الدم والمعامل عبر الـ OCR من Hugging Face.
* `PatientMedicalFile.php`: مكتبة الملفات الطبية العامة للمريضة.
* `HealthSync.php`: سجل مزامنة البيانات عبر الـ APIs.

### 💰 ز. الأموال وأنظمة الدفع (Finance)
* `Payment.php`: حركات بطاقات الائتمان ومدفوعات Paymob.
* `PayoutRequest.php`: طلبات الأطباء لسحب مستحقاتهم من النظام.

### 📰 ح. المحتوى والواجهة العامة (CMS)
* `Article.php` & `Faq.php` & `AboutUs.php` & `SuccessStory.php` & `Testimonial.php` & `ContactUs.php`: إدارة صفحات الفرونت إند العامة.
* `JoinUs.php` & `DoctorJoinRequest.php`: طلبات التوظيف واستمارات الأطباء.
* `LifeStage.php`: المراحل العمرية وصحة المرأة التي يدور حولها النظام.
* `SettingsSite.php`: شروط الاستخدام، السياسات، وبيانات الموقع.

### 🔔 ط. الإدارة والنظام (System Core)
* `Notification.php`: إشعارات القاعدة (Database Notifications).
* `PushSubscription.php`: تسجيل متصفحات المرضى والأطباء لإرسال Web Push عبر VAPID.
* `AuditLog.php`: تسجيل كُل نشاط يقوم به أي بطاقة أدمن.

---

## 🔌 2. متحكمات الـ API (Controllers) — 67 متحكم ضخم!

يتوزع الـ Routing على ثلاث أنواع رئيسية بحسب طبقة الحماية (Guards).

### 👨‍💼 أولاً: لوحة تحكم الإدارة (Admin / 23 Controllers)
*(عناصر التحكم الكامل والمراقبة، تستخدم RBAC Middleware)*
1. `DashboardController.php`: إحصائيات الصفحة الرئيسية والأرقام الحية.
2. `AnalyticsController.php` و `AdminAiAnalyticsController.php`: التحليلات المعمقة وتقارير الذكاء الاصطناعي (مثل دقة نماذج التنبؤ).
3. `AdminChatbotController.php` و `AdminChatbotDocumentController.php`: إدارة محادثات الشات بوت، رؤية الإحصائيات، ورفع ملفات RAG لمعرفة البوت.
4. `AdminManagementController.php`: إنشاء وتعديل مديري النظام ومنح الصلاحيات.
5. `DoctorController.php` و `PatientController.php`: لوحة الـ CRUD الكاملة للمستخدمين مع الموافقة والتجميد.
6. `ConsultationController.php`: مراجعة جميع مواعيد الأطباء.
7. `ChatMonitorController.php`: نظام فريد لمراقبة الامتثال وعدم اختراق الخصوصية داخل شات العيادة.
8. `FinancialController.php` و `PayoutController.php`: كل ما يتعلق بأرباح الأطباء واعتماد السحوبات وحساب الحصة.
9. `ArticleController.php`, `FaqController.php`, `AboutController.php`, `SettingsController.php`, `SuccessStoryController.php`: تحديث كافة المحتوى النصي المعروض للعامة.
10. `JoinRequestController.php`, `ContactMessageController.php`: رصد ومتابعة تواصل الزوار وطلبات الانضمام.
11. `NotificationAdminController.php`: إرسال رسائل جماعية وتنبيهات.

### 👩‍⚕️ ثانياً: شاشات وعيادة الطبيبة (Doctor / 15 Controllers)
1. `DoctorDashboardController.php`: إحصائيات المواعيد، الإيرادات المستقبلية، التقييمات.
2. `ConsultationController.php`: الدخول للجلسة الكاميرا وتغيير حالتها لـ Completed.
3. `ConsultationChatController.php`: استقبال وإرسال في الرسائل النصية داخل عيادة الطبيبة الافتراضية.
4. `DoctorPatientController.php`: يتيح للطبيبة فتح السجل الطبي وفحص تحاليل المريضة *فقط إذا كانت تملك موعداً معها*.
5. `DoctorAiPredictionController.php`: أداة للطبيبة لطلب نتيجة الذكاء الاصطناعي للمساعدة في تشخيص المريضة.
6. `DoctorFinancialController.php`: إطلاق الـ PayoutRequest للسحب من الإيرادات.
7. `PrescriptionController.php`: كتابة الـ Medication والروشتات.
8. `DoctorProfileController.php` و `GoogleAuthController.php`: إدارة ملف الطبيبة والربط مع Google Meet Token لفتح الجلسات.
9. `ArticleController.php` و `DoctorReviewController.php`: الرد على مراجعات المرضى وكتابة مقالات توعوية (تخضع لتقييم الـ Admin).

### 🤰 ثالثاً: تطبيق وبوابة المريضة (Patient / 22 Controllers)
- **مجموعة الاستشارات الطبية:** `ConsultationController`, `DoctorController` (للبحث والفلترة)، `ConsultationChatController`، و`PatientMedicalFileController` (لرفع الروشتات والتحاليل).
- **الذكاء الاصطناعي (أهم العناصر):** 
   * `ChatbotController.php`: الاستدعاء الأساسي والتواصل مع موديل HF للشات بوت.
   * `AiPredictionController.php`: استقبال إدخالات المريضة (مثل ضغط الدم والسكر) لإطلاق التنبؤ بخطر التسمم وغيرها.
   * `LabTestController.php`: رفع تحاليل صور PDF لفكها عبر OCR وتخزين النتيجة كبيانات منظمة.
   * `PatientDashboardController.php` & `TrackersSummaryController.php`: الواجهة العلوية وإعطاء ملخص شامل. 
- **تحليلات البيانات الطبية:** `PregnancyController.php`، `PeriodController.php`، `FertilityController.php`، `WeightController.php`، و `MoodController.php`. كل منها ينسق العمليات والإحصائيات الخاصة به.
- **تكامل خارجي (IoT):** `IotController.php` لسحب و إرسال بيانات متتبعات طرف ثالث للمريضة كجوجل فيت بالاعتماد على Google Fit.

### 🔒 رابعاً: البوابات الأساسية والتوثيق (Shared & Auth / 7+ Controllers)
* `Auth\` (تحتوي على `LoginController`, `RegisterController`, إلخ مكررة لكل Guard): نظام توثيق متين بواسطة Sanctum Token.
* `PaymentController.php`: يحتوي على مسارات `callback` الخاصة بـ Paymob لاستقبال تحديثات نجاح أو فشل دفع الحجوزات.
* `LandingPageController.php`, `PublicController.php`: مسارات لعرض البيانات على الواجهة دون الحاجة للتوثيق (`public.php`).
* `SearchController.php`: نظام بحث شامل (Global search) في الموقع.

---

## ⚙️ 3. طبقة الخدمات المتقدمة (Service Layer) — 17 Service Class
لتجنب الـ *Fat Controllers* (متحكمات ضخمة)، تم نقل الذكاء الصناعي ومنطق الأعمال الثقيل (Business Logic) إلى هذه الخدمات:

1. **الذكاء الاصطناعي — `ChatbotService.php`**: 
   - يقوم بالتواصل الحي عبر فتح قنوات اتصال متدفق (SSE / Server-Sent Events) مع Hugging Face.
   - يعالج 4 بوتات (Pregnancy, Motherhood, Premarriage, Public).
   - توجد بداخله آليات (PII Redaction) لتنقية البيانات قبل إرسالها لـ external API.
2. **الذكاء الاصطناعي — `AiPredictionService.php`**:
   - خدمة مجمعة (Facade) لإجراء عمليات الاستدعاء والمصادقة على نماذج (Preeclampsia, GDM, Preterm Birth, SCBU).
3. **الذكاء الاصطناعي — `LabTestOcrService.php`**:
   - إرسال صور التحاليل (PDF/JPEG) لنموذج الـ OCR على Hugging Face، واستقبال JSON تفصيلي عن (الهيموجلوبين، المعادن، حالة النقصان).
4. **الذكاء الاصطناعي — `PatientDataCollectorService.php`**:
   - **الجوهرة المعمارية:** يقوم بتجميع السياق الديناميكي وبناء (System Prompts). 
   - يقرأ جميع (المتتبعات، المواعيد، التحاليل OCR، الخصوبة) ويستخرج ما يصلح منها لتقديمه للشات بوت كي يعطي إجابة مخصصة (%100 Personalized).
5. **الاتصالات — `GoogleMeetService.php`**:
   - يقوم بتوليد وحفظ Token OAuth من حساب الطبيبة وإنشاء رابط مؤقت لجلسة المريض والطبيبة. (يستبدل `ZoomService` القديم).
6. **الدفع — `PaymobService.php`**:
   - دورة الـ (IFrames, Payment Keys, HMAC Verification, Refund Handling).
7. **عيادة البيانات — `ConsultationService.php`**:
   - يدير حجز وتضارب المواعيد (Conflict Check)، الإلغاء፣ وإجراءات فشل الدفع.
8. **نظام الإشعارات — `NotificationService.php` و `WebPushService.php`**:
   - يدمج التنبيهات بقواعد البيانات، وبريد الـ Email (Mailtrap) وتنبيهات المتصفح (WebPush via VAPID keys).
9. **خدمات أخرى هامة:** 
   * `PeriodAnalyticsService.php`: تحسب أيام التبويض (Ovulation windows) بذكاء من سجل مسبق.
   * `GoogleFitService.php`: تجلب الخطوات، الضغط ومعدلات الأكسجين من طرف ثالث.
   * `ChatImageService.php`: معالجة الصور التي تُرفق خلال المحادثات الداخلية العيادية.
   * `ArticleService.php`: تدير حياة المقالة (مسودة -> مراجعة -> تفعيل).
   * `AuditLogService.php` و `CacheService.php`.

---

## ⏰ 4. الجدولة والوظائف المؤجلة (Jobs & Commands) — 9 Jobs
لأفضل أداء وتقليل التأخير على الواجهة (Latency)، تُدار هذه العمليات عبر الخلفية (Queues):

1. `ProcessLabTestJob.php`: (مهم جداً) فحص الـ OCR يستغرق وقتاً طويلاً، لذا يُنفذ كـ Job، وبمجرد عودة النتيجة تتحدث واجهة React.
2. `UploadChatbotDocumentJob.php`: مزامنة نصوص الـ Knowledge Base للأدمن ورفعها لـ HF Vector DB ببطء لعدم تعطيل النظام.
3. `ProcessChatbotMessageJob.php`: يعالج إرسال سياق المريض للـ Chatbot وتخزين الإجابات.
4. `SyncGoogleFitData.php`: جدولة تزامن البيانات الصحية.
5. `CancelExpiredConsultations.php`: يُنادي `Command` يومي للبحث عن الحجوزات المعلقة منذ فترة طويلة والتي لم تُدفع لغلقها وإرجاع الأوقات لمواعيد الطبيبة المتاحة.
6. `SendAppointmentReminders.php` و `SendBulkNotificationJob.php`: مسارات لإرسال إشعارات جماعية ضخمة أو تذكير بالموعد دون توقيف العميل.

---

> **خاتمة الفحص التفصيلي للباك إند (Laravel Ecosystem):**  
تمت كتابة الكود بهيكلة حديثة جداً ومتوافقة بالكامل مع بنية MVC معدلة وموسعة (مع Service/Action layers). وجود حماية (Guards) مستقلة، آليات كاش (Redis)، وطوابير خلفية (Queues) لمعالجة الـ Machine Learning يجعله نظاماً Enterprise-Grade ويصلح للتوسّع بسهولة عبر خوادم متفرقة.
