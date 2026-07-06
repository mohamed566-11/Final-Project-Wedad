# 🚀 خطة النشر الكاملة — مشروع وداد-تك
## **المنصة: Laravel Cloud (Starter $5/شهر) + Cloudflare Pages (مجاني)**
### مبنية على الكود الفعلي للمشروع — يوليو 2026

---

> **⚠️ مهم جداً:** اقرأ كل المرحلة كاملة قبل تنفيذ أي خطوة. الترتيب إلزامي.

---

## 📋 ملخص الاختيار

| المكوّن | المنصة | التكلفة |
|---|---|---|
| **Backend (Laravel API)** | Laravel Cloud – Starter | $5/شهر + usage |
| **MySQL Database** | Laravel Cloud – MySQL Flex | داخل credits الـ $5 |
| **Redis/Valkey** | Laravel Cloud – Valkey | داخل credits الـ $5 |
| **Queue Workers** | Laravel Cloud – Managed Queues | داخل credits الـ $5 |
| **Scheduler (cron)** | Laravel Cloud – Native | لا إعداد يدوي |
| **Frontend (React/Vite)** | Cloudflare Pages | مجاني بالكامل |
| **ملفات/صور** | Laravel Cloud Storage أو R2 | داخل credits |

**الإجمالي المتوقع: $5–10/شهر (الشهر الأول مجاني بالكامل)**

---

## 🔴 المرحلة الأولى — الإصلاحات الإلزامية (قبل أي رفع)

---

### 1.1 حل مشكلة `PatientDataCollectorService` المكررة

**النتيجة من الفحص:**

- `app/Services/PatientDataCollectorService.php` ← **Namespace: `App\Services`** — يجمع بيانات المريضة لنماذج الـ AI (GDM, Preeclampsia, PretermBirth, SCBU)
- `app/Services/Patient/PatientDataCollectorService.php` ← **Namespace: `App\Services\Patient`** — يُستخدم للـ Chatbot context

**الملف المُستخدم فعلاً لكل وظيفة مختلفة** — مش تعارض بالمعنى الحرفي، لكن يجب توثيق ذلك وتأكيده:

```bash
# في Back-end/ — ابحث عن أي imports مربكة:
grep -r "PatientDataCollectorService" app/ --include="*.php" -l
```

**ستظهر النتائج — تحقق أن:**
- Controllers تستخدم AI predictions → تستورد `App\Services\PatientDataCollectorService`
- Controllers تستخدم Chatbot context → تستورد `App\Services\Patient\PatientDataCollectorService`

**لا حذف مطلوب** — الملفان يؤديان وظائف مختلفة. فقط أضف تعليق توضيحي:

```php
// في البداية app/Services/PatientDataCollectorService.php
// PURPOSE: Pre-fill AI prediction forms (GDM, Preeclampsia, PretermBirth, SCBU)
// USED BY: AI Prediction Controllers

// في البداية app/Services/Patient/PatientDataCollectorService.php
// PURPOSE: Build chatbot context for patient-aware responses
// USED BY: ProcessChatbotMessageJob
```

```bash
# بعد التوثيق:
php artisan optimize:clear
```

---

### 1.2 إنشاء ملف `.env` للإنتاج

**من الفحص الفعلي لـ `.env.example` و config files:**

أنشئ ملف `.env.production` في `Back-end/`:

```bash
# ============================================
# APP CONFIG
# ============================================
APP_NAME="منصة وداد"
APP_ENV=production
APP_KEY=                           # ← php artisan key:generate بعد الرفع
APP_DEBUG=false                    # ← إلزامي في الإنتاج
APP_URL=https://api.widad.com      # ← domain الباك إند على Laravel Cloud

APP_LOCALE=ar
APP_FALLBACK_LOCALE=ar

# ============================================
# LOG CONFIG
# ← في الإنتاج: warning بدل debug
# ============================================
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=warning                  # ← غيّر من debug

# ============================================
# DATABASE — Laravel Cloud MySQL Flex
# القيم دي هتتملى تلقائياً من داشبورد Laravel Cloud
# ============================================
DB_CONNECTION=mysql
DB_HOST=                           # ← من Laravel Cloud Dashboard
DB_PORT=3306
DB_DATABASE=                       # ← من Laravel Cloud Dashboard
DB_USERNAME=                       # ← من Laravel Cloud Dashboard
DB_PASSWORD=                       # ← من Laravel Cloud Dashboard

# ============================================
# QUEUE — Managed Queues في Laravel Cloud
# مفيش Worker يدوي — Laravel Cloud بيديره تلقائياً
# ============================================
QUEUE_CONNECTION=database          # Laravel Cloud Managed Queues بتستخدم database driver
DB_QUEUE_TABLE=jobs

# ============================================
# CACHE — Valkey (Redis-compatible) في Laravel Cloud
# ============================================
CACHE_STORE=redis
CACHE_PREFIX=widad_

REDIS_CLIENT=phpredis
REDIS_HOST=                        # ← من Laravel Cloud Dashboard (Valkey endpoint)
REDIS_PASSWORD=                    # ← من Laravel Cloud Dashboard
REDIS_PORT=6379
REDIS_DB=0
REDIS_CACHE_DB=1

# ============================================
# SESSION — redis في الإنتاج أسرع وأأمن
# ============================================
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_SECURE_COOKIE=true         # ← إلزامي مع HTTPS

# ============================================
# FILESYSTEM
# للإنتاج: إما local (على نفس السيرفر) أو s3 (Cloudflare R2)
# ============================================
FILESYSTEM_DISK=local              # أو: s3 إذا استخدمت R2

# إذا استخدمت Cloudflare R2 (S3-compatible):
# AWS_ACCESS_KEY_ID=               # R2 API Token
# AWS_SECRET_ACCESS_KEY=           # R2 API Secret
# AWS_DEFAULT_REGION=auto
# AWS_BUCKET=                      # اسم الـ R2 Bucket
# AWS_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
# AWS_USE_PATH_STYLE_ENDPOINT=true

# ============================================
# CORS — الفرونت على Cloudflare Pages
# ============================================
CORS_ALLOWED_ORIGINS=https://widad.pages.dev,https://widad.com
# ← غيّر widad.pages.dev لـ domain الفعلي على Cloudflare Pages

# ============================================
# FRONTEND URL (للـ redirects والـ CORS)
# ============================================
FRONTEND_URL=https://widad.pages.dev   # أو domain الفعلي للفرونت

# ============================================
# MAIL — استخدم Resend (الأبسط والأوثق) أو SendGrid
# ============================================
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com          # أو smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=resend               # أو apikey
MAIL_PASSWORD=                     # ← Resend API Key أو SendGrid API Key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@widad.com
MAIL_FROM_NAME="منصة وداد"

# ============================================
# GOOGLE OAUTH & MEET
# ============================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.widad.com/api/v1/doctor/google/callback

# ============================================
# GOOGLE FIT (IoT)
# ============================================
GOOGLE_CLIENT_IOT_ID=
GOOGLE_CLIENT_IOT_SECRET=
GOOGLE_FIT_REDIRECT_URI=https://widad.pages.dev/trackers/smart-band

# ============================================
# VAPID — Push Notifications (نفس القيم، تغيير VAPID_SUBJECT فقط)
# ============================================
VAPID_SUBJECT=mailto:admin@widad.com   # ← غيّر للبريد الحقيقي
VAPID_PUBLIC_KEY=BHCuEpIlsTcdGQ3p1EkE232UDlS2o-MRnb4hQjplaBv2tci79q-ZaVNFcO6J7PuchD44KBpmgay0vmncZ8KQvYA
VAPID_PRIVATE_KEY=WGm0KB0C0a2z4LbzLwG6js2NpLTKnlpWzonPb5rbnkU

# ============================================
# PAYMOB — غيّر للـ Live Keys بعد اختبار Sandbox
# ============================================
PAYMOB_API_KEY=                    # ← Live API Key من Paymob Dashboard
PAYMOB_INTEGRATION_ID=             # ← Live Integration ID
PAYMOB_IFRAME_ID=                  # ← Live Iframe ID
PAYMOB_HMAC_SECRET=                # ← Live HMAC Secret
PAYMOB_COMMISSION_RATE=0.15
PAYMOB_WALLET_INTEGRATION_ID=

# ============================================
# CHATBOT — Hugging Face Spaces
# ============================================
CHATBOT_PUBLIC_URL=https://widad-health-widad-public-health-chatbot.hf.space
CHATBOT_PREMARRIAGE_URL=https://widad-health-widad-premarital-chatbot.hf.space
CHATBOT_PREGNANCY_URL=https://widad-health-wedad-pregnancy-chatbot.hf.space
CHATBOT_MOTHERHOOD_URL=https://widad-health-widad-postpartum-chatbot.hf.space
CHATBOT_ADMIN_API_KEY=             # ← ضع المفتاح الحقيقي
CHATBOT_PUBLIC_RATE_LIMIT=10
CHATBOT_AUTH_RATE_LIMIT=30
CHATBOT_MAX_MESSAGE_LENGTH=1000
CHATBOT_REQUEST_TIMEOUT=60
CHATBOT_REQUEST_MAX_ATTEMPTS=5
CHATBOT_REQUEST_RETRY_DELAY_SECONDS=4
CHATBOT_CACHE_ENABLED=true
CHATBOT_CACHE_TTL_HOURS=24
CHATBOT_PROCESS_SYNC_IN_LOCAL=false  # ← false في الإنتاج (Async via Queue)
CHATBOT_PATIENT_CONTEXT_ENABLED=true # ← تفعيل في الإنتاج

# ============================================
# BCRYPT
# ============================================
BCRYPT_ROUNDS=12
```

**تحقق بعد الإعداد — يجب أن يُرجع 0 نتيجة:**
```bash
grep -E "^(APP_KEY|DB_PASSWORD|GOOGLE_CLIENT_SECRET|PAYMOB_API_KEY|VAPID_PRIVATE_KEY)=$" .env.production
```

---

### 1.3 إصلاح CORS

**من الفحص:** `config/cors.php` يستخدم `CORS_ALLOWED_ORIGINS` بنظام explode comma.

**✅ الكود جاهز ومناسب** — فقط أضف في `.env.production`:

```bash
CORS_ALLOWED_ORIGINS=https://widad.pages.dev,https://widad.com,https://api.widad.com
```

> **تنبيه مهم:** بدون `/` في نهاية أي URL — وإلا ستفشل CORS.

---

### 1.4 تجهيز Git قبل الرفع

```bash
# تأكد .env في .gitignore:
grep "\.env" .gitignore        # يجب أن يُرجع .env

# تأكد .env.production في .gitignore كمان:
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore

# تحقق من تاريخ git — هل .env رُفع قبل كده؟
git log --all --full-history -- .env
# إذا ظهرت نتائج → غيّر كل credentials فوراً

# تأكد Back-end/vendor في .gitignore:
grep "vendor/" .gitignore      # يجب أن يُرجع /vendor

# Commit أي تعديلات معلقة:
git add .
git commit -m "chore: prepare for Laravel Cloud deployment"
git push origin main
```

---

## 🟡 المرحلة الثانية — رفع Backend على Laravel Cloud

---

### 2.1 إنشاء حساب Laravel Cloud

1. اذهب إلى **[cloud.laravel.com](https://cloud.laravel.com)**
2. سجّل بـ GitHub account (نفس account المشروع)
3. اختر خطة **Starter** — أول شهر مجاني

---

### 2.2 إنشاء مشروع جديد

في داشبورد Laravel Cloud:

```
1. New Application → Import from GitHub
2. اختر repo: Final_Project_Implementation/Final_Project_Front_And_Back
3. Root Directory: Back-end/         ← مهم جداً (المشروع مش في root)
4. Branch: main
5. PHP Version: 8.2                   ← من composer.json
6. اضغط Deploy
```

> **Laravel Cloud بيكتشف تلقائياً** إنه مشروع Laravel ويعمل `composer install` تلقائياً.

---

### 2.3 إضافة Database (MySQL Flex)

في داشبورد Laravel Cloud:

```
Application → Resources → Add Resource → MySQL Flex
- Database Name: widad_production
- اضغط Create

بعد الإنشاء: انسخ الـ credentials التلقائية:
DB_HOST=…
DB_PORT=…
DB_DATABASE=widad_production
DB_USERNAME=…
DB_PASSWORD=…
```

---

### 2.4 إضافة Redis/Valkey

```
Application → Resources → Add Resource → Valkey
- بعد الإنشاء: انسخ:
REDIS_HOST=…
REDIS_PASSWORD=…
REDIS_PORT=6379
```

---

### 2.5 ضبط Environment Variables

في داشبورد Laravel Cloud:
```
Application → Environment → Add Variables
```

**الخطوات:**
1. افتح ملف `.env.production` الي أنشأته في 1.2
2. انسخ كل variable واحد واحد في داشبورد Laravel Cloud
3. **بدّل القيم الفارغة** بـ credentials الحقيقية من الخطوات 2.3 و 2.4

**المتغيرات الخاصة بـ Laravel Cloud (بعد إنشاء الموارد):**
```bash
DB_HOST=[من داشبورد MySQL Flex]
DB_DATABASE=widad_production
DB_USERNAME=[من داشبورد MySQL Flex]
DB_PASSWORD=[من داشبورد MySQL Flex]

REDIS_HOST=[من داشبورد Valkey]
REDIS_PASSWORD=[من داشبورد Valkey]
REDIS_PORT=6379
```

---

### 2.6 تشغيل Migrations

بعد إعداد الـ env variables في داشبورد:

```
Application → Deploy → Run Commands (أو عبر Artisan Console في الداشبورد)
```

```bash
# أوامر ما بعد الـ Deploy — في Laravel Cloud Artisan Console:
php artisan migrate --force

# تحقق من عدد الجداول:
php artisan db:table   # يجب أن يُرجع قائمة الجداول
```

---

### 2.7 تشغيل Core Seeders فقط

```bash
# في Laravel Cloud Artisan Console:
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=LifeStageSeeder
php artisan db:seed --class=SettingsSiteSeeder
php artisan db:seed --class=AdminSeeder

# تحقق:
php artisan tinker
>>> App\Models\Admin::first()->email   # يجب أن يُرجع admin email
```

> ⚠️ **لا تشغّل DatabaseSeeder الكاملة** — فقط الـ 4 seeders المذكورين.

---

### 2.8 إعداد Managed Queues

في داشبورد Laravel Cloud:
```
Application → Queues → Enable Managed Queues
```

**الـ Jobs المسجلة في المشروع (من app/Jobs/):**

| Job | الوظيفة | الأولوية |
|---|---|---|
| `ProcessChatbotMessageJob` | معالجة رسائل الشات بوت | عالية |
| `ProcessLabTestJob` | OCR للتحاليل الطبية | عالية |
| `UploadChatbotDocumentJob` | رفع مستندات RAG | متوسطة |
| `SendAppointmentReminders` | تذكيرات المواعيد | متوسطة |
| `CancelExpiredConsultations` | إلغاء الاستشارات المنتهية | منخفضة |
| `SendBulkNotificationJob` | إشعارات جماعية | منخفضة |
| `SendScheduledNotification` | إشعارات مجدولة | منخفضة |
| `SyncGoogleFitData` | مزامنة Google Fit | منخفضة |
| `CleanupOldChatMessagesJob` | تنظيف الرسائل القديمة | منخفضة |

> **ميزة Managed Queues:** بتشتغل تلقائياً وقت وجود Jobs، وترجع صفر وقت عدم الشغل (Scale-to-Zero) — وفر فعلي في التكاليف.

---

### 2.9 إعداد Scheduler (Cron)

في داشبورد Laravel Cloud:
```
Application → Scheduler → Enable
```

**Laravel Cloud بيكتشف تلقائياً** الجداول من `routes/console.php` — لا إعداد يدوي مطلوب.

**الجداول الموجودة في المشروع (من `routes/console.php` الفعلي):**

| المهمة | التكرار | التوقيت |
|---|---|---|
| `SendAppointmentReminders` | كل 5 دقائق | دائم |
| `CancelExpiredConsultations` | كل 15 دقيقة | دائم |
| `payments:process-pending` | كل 30 دقيقة | دائم |
| `notifications:cleanup` | يومياً | 03:00 |
| `reports:generate-daily` | يومياً | 23:55 (Cairo) |
| `auth:clear-resets` | يومياً | 02:00 |
| `cache:prune-stale-tags` | كل ساعة | دائم |
| `emails:send-weekly-doctor-summary` | أسبوعياً | الأحد 10:00 (Cairo) |
| `emails:send-monthly-analytics` | شهرياً | 1 الشهر 09:00 (Cairo) |
| `CleanupOldChatMessagesJob` | يومياً | 04:00 (Cairo) |
| `chatbot:clear-cache` | أسبوعياً | الأحد 05:00 (Cairo) |
| `SyncGoogleFitData` | كل 6 ساعات | دائم |

**اختبار في Artisan Console:**
```bash
php artisan schedule:list
php artisan schedule:run --verbose   # تشغيل يدوي للاختبار
```

---

### 2.10 إعداد Storage Link

```bash
# في Artisan Console:
php artisan storage:link
```

> **ملاحظة:** إذا كنت ترفع ملفات كبيرة (تحاليل OCR، مستندات RAG) — ننصح بالانتقال لـ Cloudflare R2 بعد الإطلاق الأوّلي لحفظ المساحة على السيرفر الرئيسي.

---

### 2.11 Optimize Laravel

```bash
# في Artisan Console (بعد صح كل الإعدادات):
php artisan config:cache       # يُجمع config في ملف واحد
php artisan route:cache        # يُجمع routes (مهم مع 200+ route)
php artisan view:cache         # يُجمع views
php artisan event:cache        # يُجمع events
php artisan optimize           # يُشغّل كل الأوامر السابقة

# تحقق:
php artisan about
```

> **عند أي تعديل مستقبلي:** `php artisan optimize:clear` ثم أعد التشغيل

---

### 2.12 ربط Custom Domain (اختياري)

```
Application → Domains → Add Domain
- أضف: api.widad.com (أو أي subdomain تختاره)
- اتبع تعليمات DNS verification
- Laravel Cloud بيفعّل SSL تلقائياً
```

---

## 🟢 المرحلة الثالثة — رفع Frontend على Cloudflare Pages

---

### 3.1 إنشاء ملف `.env.production` للفرونت

أنشئ `Front-End/.env.production`:

```bash
# ============================================
# API URL — الباك إند على Laravel Cloud
# ============================================
VITE_API_URL=https://api.widad.com/api/v1
# ← غيّر لـ domain الفعلي من Laravel Cloud

VITE_APP_NAME="منصة وداد"

# إذا أضفت Sentry لاحقاً:
# VITE_SENTRY_DSN=https://[your-dsn]@sentry.io/[project-id]
```

> **ملاحظة من vite.config.ts:** الملف معدّ بالفعل لـ production build مع code splitting وتحسينات الأداء — لا تعديل مطلوب.

---

### 3.2 إنشاء حساب Cloudflare Pages

1. اذهب إلى **[pages.cloudflare.com](https://pages.cloudflare.com)**
2. سجّل بـ Cloudflare account (مجاني)
3. اربط GitHub account

---

### 3.3 إنشاء مشروع Cloudflare Pages

```
Pages → Create a project → Connect to Git
1. اختر الـ repo: Final_Project_Implementation
2. Branch: main
3. Root Directory: Front-End/        ← مهم جداً
4. Framework preset: Vite            ← أو None واكتب يدوياً
5. Build command: npm run build
6. Build output directory: dist
7. Node version: 18 أو 20            ← في Environment Variables: NODE_VERSION=20
```

---

### 3.4 إضافة Environment Variables في Cloudflare Pages

```
Settings → Environment Variables → Production
```

```bash
VITE_API_URL=https://api.widad.com/api/v1
VITE_APP_NAME=منصة وداد
NODE_VERSION=20
```

---

### 3.5 إعداد SPA Routing

**مشكلة:** React Router بيستخدم client-side routing — لو المستخدم refresh الصفحة مباشرة على `/patient/dashboard`، ستُرجع 404.

**الحل:** أنشئ ملف `Front-End/public/_redirects`:

```
/*    /index.html    200
```

> **ملاحظة:** Cloudflare Pages بيدعم `_redirects` تلقائياً. بعد الإنشاء، أي `git push` بيعمل deploy تلقائي.

---

### 3.6 ربط Custom Domain (اختياري)

```
Pages → [اسم المشروع] → Custom Domains → Add
- أضف: widad.com أو www.widad.com
- SSL تلقائي من Cloudflare
```

---

## 🔵 المرحلة الرابعة — الأمان وما بعد الرفع

---

### 4.1 تحديث Google OAuth Redirect URIs

في **[Google Cloud Console](https://console.cloud.google.com)**:
```
APIs & Services → Credentials → OAuth 2.0 Client IDs → Edit
```

**أضف هذه الـ URIs:**

```
# Authorized JavaScript origins:
https://widad.pages.dev           (أو domain الفرونت)
https://widad.com

# Authorized redirect URIs:
# Google Meet/OAuth (للأطباء):
https://api.widad.com/api/v1/doctor/google/callback

# Google Fit (للمريضات — من services.php):
https://widad.pages.dev/trackers/smart-band
```

---

### 4.2 تحديث Paymob Webhook URLs

في **[accept.paymob.com](https://accept.paymob.com)**:
```
Settings → Payment Integrations → Edit
```

**غيّر من:**
```
http://localhost:8000/…
```

**إلى:**
```bash
# Transaction Processed Callback:
https://api.widad.com/api/v1/payment/paymob/callback

# Transaction Response Callback:
https://api.widad.com/api/v1/payment/paymob/webhook
```

> ⚠️ **ابدأ بـ Sandbox keys أولاً** — لا تنتقل لـ Live keys قبل اختبار كامل.

---

### 4.3 إعداد HF Spaces Wakeup (منع السبات)

Hugging Face Spaces المجانية تنام بعد 48 ساعة من عدم الاستخدام — هذا يُسبب بطء الأول في الـ Chatbot والـ AI Models.

**أنشئ ملف الـ Wakeup في `Back-end/`:**

```php
<?php
// Back-end/wakeup_hf_spaces.php

$spaces = [
    'Public Chatbot'     => 'https://widad-health-widad-public-health-chatbot.hf.space',
    'PreMarriage Bot'    => 'https://widad-health-widad-premarital-chatbot.hf.space',
    'Pregnancy Bot'      => 'https://widad-health-wedad-pregnancy-chatbot.hf.space',
    'Motherhood Bot'     => 'https://widad-health-widad-postpartum-chatbot.hf.space',
];

foreach ($spaces as $name => $url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo "[" . date('Y-m-d H:i:s') . "] $name: HTTP $httpCode\n";
}
```

**أضف في `routes/console.php`:**

```php
// Wakeup HF Spaces كل 25 دقيقة لمنع السبات
Schedule::command('app:wakeup-hf-spaces')
    ->everyThirtyMinutes()
    ->name('wakeup-hf-spaces')
    ->withoutOverlapping();
```

**أو أنشئ Artisan command:**

```bash
# في Artisan Console:
php artisan make:command WakeupHFSpaces
```

---

### 4.4 إعداد Admin الأول

```bash
# في Laravel Cloud Artisan Console:
# تأكد من تشغيل Seeders من 2.7 أولاً

# تحقق:
php artisan tinker
>>> App\Models\Admin::first()->email

# تسجيل دخول:
# الرابط: https://widad.pages.dev/admin/login  (أو domain الفرونت)
# غيّر الـ password فوراً بعد أول دخول!
```

---

### 4.5 إعداد Error Monitoring (Sentry) — موصى به

```bash
# Backend:
composer require sentry/sentry-laravel

# في .env على Laravel Cloud Dashboard:
SENTRY_LARAVEL_DSN=https://[your-dsn]@sentry.io/[project-id]
SENTRY_TRACES_SAMPLE_RATE=0.1

# اختبار:
php artisan sentry:test
```

```bash
# Frontend:
npm install @sentry/react

# في Front-End/src/main.tsx أضف:
# Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })

# في .env.production:
VITE_SENTRY_DSN=https://[your-dsn]@sentry.io/[project-id]
```

---

### 4.6 اختبار كل الـ User Flows

```
✅ Flow 1 — المريضة:
  ○ تسجيل → OTP Email → تحقق → تسجيل دخول
  ○ بحث عن طبيبة → حجز موعد → دفع (Sandbox) → تأكيد
  ○ دخول جلسة Google Meet
  ○ شات بوت (public + pregnancy + motherhood)
  ○ AI Prediction (GDM → نتيجة تظهر في الصفحة)
  ○ رفع تحليل طبي → OCR → نتيجة
  ○ ربط Google Fit → مزامنة heart rate

✅ Flow 2 — الطبيبة:
  ○ تسجيل → Admin يعتمد الحساب
  ○ تعيين مواعيد عمل
  ○ استقبال حجز → Google Meet
  ○ كتابة روشتة → تظهر للمريضة

✅ Flow 3 — الأدمن:
  ○ تسجيل دخول لوحة التحكم
  ○ اعتماد طبيبة
  ○ رفع مستند Chatbot RAG
  ○ تقرير مالي

✅ Flow 4 — الإشعارات:
  ○ Push notification وصل للمتصفح
  ○ Email OTP وصل Inbox (مش Spam)
  ○ تذكير الموعد وصل
```

---

## 🔧 ملف Build الفرونت محلياً (اختياري للاختبار)

إذا أردت اختبار البناء محلياً قبل الرفع:

```bash
cd Front-End

# نسخ env الإنتاج:
cp .env.production .env.production.local

# Build:
npm ci
npm run build

# المخرجات في: Front-End/dist/
# يمكنك رفعها يدوياً عبر Cloudflare Pages Dashboard
```

---

## 🚫 القواعد التي لا تنكسر

| القاعدة | التفاصيل |
|---|---|
| **`APP_DEBUG=false` دائماً** | في الإنتاج — لا استثناء |
| **لا Seeders كاملة في الإنتاج** | فقط: Role + LifeStage + Settings + Admin |
| **غيّر Admin password فوراً** | أول دخول بعد AdminSeeder |
| **Paymob Sandbox أولاً** | لا تنتقل لـ Live keys قبل اختبار كامل |
| **`CHATBOT_PROCESS_SYNC_IN_LOCAL=false`** | في الإنتاج عشان الـ Chatbot يشتغل async |
| **`CHATBOT_PATIENT_CONTEXT_ENABLED=true`** | فعّله في الإنتاج |
| **`SESSION_SECURE_COOKIE=true`** | إلزامي مع HTTPS |
| **راجع .gitignore** | قبل أي `git push` — تأكد .env مستثنى |

---

## ✅ Checklist النهائي قبل الإعلان عن الإطلاق

```
Backend (Laravel Cloud):
- [ ] git push تم → Deploy ناجح في داشبورد Laravel Cloud
- [ ] php artisan migrate --force ← 0 errors
- [ ] php artisan optimize ← done
- [ ] Managed Queues مفعّل في الداشبورد → Job جديد يُعالج
- [ ] Scheduler مفعّل → php artisan schedule:list يُرجع الجدول
- [ ] HTTPS يعمل: curl -I https://api.widad.com
- [ ] .env لا يُرى: curl https://api.widad.com/.env → 403
- [ ] php artisan about → Environment: production, Debug: false

Frontend (Cloudflare Pages):
- [ ] Deploy ناجح في Cloudflare Pages داشبورد
- [ ] الفرونت يفتح: https://widad.pages.dev
- [ ] الفرونت يتكلم مع الـ Backend بدون CORS errors (F12 Console)
- [ ] Refresh الصفحة على أي route لا يُرجع 404 (بسبب _redirects)
- [ ] VITE_API_URL صح في الـ Network tab (مش localhost)

Services:
- [ ] OTP Email وصل Inbox (مش Spam)
- [ ] Paymob Sandbox flow كامل → استشارة confirmed
- [ ] HF Spaces Chatbot يرد: Public bot + AI Prediction
- [ ] Google Fit sync يعمل (إذا ربطت حساب)
- [ ] Sentry يستقبل events: php artisan sentry:test

Admin:
- [ ] Admin login يعمل
- [ ] أول دخول → غيّر password فوراً
- [ ] اعتمد طبيبة تجريبية → تظهر في الفرونت

PatientDataCollectorService:
- [ ] تأكيد إن الملفين المكررين يؤديان وظائف مختلفة ومعلّق عليهم
- [ ] AI Prediction (GDM) تُرجع نتيجة بيانات مسبقة الملء
```

---

## ⚡ Deploy جديد في المستقبل — أوامر سريعة

كل مرة تعمل تعديل وتريد Deploy:

**Backend:**
```bash
# محلياً:
git add .
git commit -m "feat/fix: [وصف التعديل]"
git push origin main
# → Laravel Cloud بيعمل Deploy تلقائياً

# بعد Deploy (في Artisan Console):
php artisan optimize:clear
php artisan migrate --force    # إذا فيه migrations جديدة
php artisan optimize
```

**Frontend:**
```bash
# محلياً:
git add .
git commit -m "feat/fix: [وصف تعديل الفرونت]"
git push origin main
# → Cloudflare Pages بيعمل Build و Deploy تلقائياً
```

---

## 💰 التكلفة الشهرية المتوقعة

| الشهر | التكلفة |
|---|---|
| **الشهر الأول** | مجاني بالكامل |
| **الشهور التالية** | $5 + استهلاك (متوقع $5–8 في مرحلة الإطلاق) |
| **Cloudflare Pages** | $0 (مجاني دائماً) |
| **الإجمالي** | **$5–10/شهر** |

---

*خطة النشر مبنية على فحص كامل للكود الفعلي — مشروع وداد-تك — يوليو 2026*
*المنصة: Laravel Cloud (Starter) + Cloudflare Pages — بدلاً من GCP/AWS*
