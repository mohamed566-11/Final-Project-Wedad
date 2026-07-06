# 🚀 برومبت الإيجنت — خطة الرفع على الاستضافة (Pre-Deployment Plan) — مشروع وداد

---

## 📌 السياق والهدف

أنت خبير DevOps + Laravel متخصص في رفع تطبيقات الويب على الـ Cloud. مهمتك:

1. **مراجعة الكود الفعلي** للمشروع وتحديد كل ما يحتاج تعديلاً قبل الرفع
2. **بناء خطة تنفيذية كاملة** بالأوامر المخصصة لمشروع وداد تحديداً
3. **الخطة تنفع لـ GCP وAWS** مع تحديد الفروقات الواضحة في كل نقطة

**المرجع الأساسي:** الـ Checklist المرفق (22 بند) — راجعه كنقطة بداية ثم **أضف تفاصيل التنفيذ المخصصة للمشروع** بناءً على فحص الكود الفعلي.

---

## 📂 الملفات المطلوب قراءتها قبل البدء

```
[1]  Back-end/.env.example                         ← كل الـ variables المطلوبة
[2]  Back-end/config/cors.php                      ← CORS الحالي (localhost فقط؟)
[3]  Back-end/config/queue.php                     ← driver الحالي (sync/database/redis؟)
[4]  Back-end/config/cache.php                     ← driver الحالي
[5]  Back-end/config/session.php                   ← driver الحالي
[6]  Back-end/config/filesystems.php               ← disks الحالية
[7]  Back-end/config/chatbot.php                   ← CHATBOT_PATIENT_CONTEXT_ENABLED
[8]  Back-end/config/services.php                  ← كل الـ external services
[9]  Back-end/app/Console/Kernel.php               ← الـ Scheduled Jobs
[10] Back-end/app/Jobs/                            ← كل الـ Jobs (9 jobs)
[11] Back-end/app/Services/                        ← PatientDataCollectorService المكررة
[12] Back-end/routes/patient.php                   ← للتأكد من الـ throttle rates
[13] Back-end/routes/doctor.php                    ← نفس الشيء
[14] Back-end/routes/admin.php                     ← نفس الشيء
[15] Back-end/database/migrations/                 ← 81 migration (ترتيبها + enum issues)
[16] Front-End/.env.example أو .env               ← VITE_API_URL + أي variables
[17] Front-End/vite.config.ts                      ← build config
[18] Front-End/package.json                        ← dependencies + scripts
[19] Back-end/composer.json                        ← dependencies + scripts
[20] Back-end/bootstrap/app.php                    ← middleware + providers
[21] Back-end/app/Http/Middleware/                 ← كل الـ middleware
[22] .gitignore (root, backend, frontend)          ← تأكد .env مستثنى
```

> **إلزامي:** اقرأ كل الملفات قبل كتابة أي خطوة. الأوامر يجب أن تعكس الكود الفعلي.

---

## 🎯 هيكل الخطة المطلوبة

اكتب الخطة في ملف `DEPLOYMENT_PLAN.md` مقسماً على 4 مراحل + قسم الفروقات:

---

## المرحلة الأولى — الإلزامي (يوم 1) ⛔

---

### 1.1 فحص وإصلاح مشكلة `PatientDataCollectorService` المكررة

```
المشكلة: موجود في مكانين:
  app/Services/PatientDataCollectorService.php
  app/Services/Patient/PatientDataCollectorService.php

الخطوات:
  1. افحص الملفين وحدد أيهما الأحدث والمستخدم فعلاً
  2. افحص كل الـ Controllers التي تستدعيه (grep -r "PatientDataCollectorService")
  3. اكتب أوامر إعادة التسمية وتحديث الـ imports

الأوامر (بعد تحديدك للنسخة الصحيحة):
  mv app/Services/PatientDataCollectorService.php app/Services/PatientDataCollectorService.php.bak
  # أو:
  # تحديث namespace + import في كل الـ controllers المتأثرة
  # ثم:
  php artisan optimize:clear
```

### 1.2 إعداد ملف `.env` الإنتاج

افحص `.env.example` واكتب ملف `.env.production` كامل مع:

**أ) القيم الإلزامية التي تحتاج تعديلاً:**
```bash
APP_NAME="منصة وداد"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://[domain-here]          # ← يتغير حسب domain الفعلي
APP_KEY=                               # ← php artisan key:generate

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1                      # GCP: 127.0.0.1 إذا MySQL على نفس VM
                                       # AWS: RDS endpoint
DB_PORT=3306
DB_DATABASE=widad_production
DB_USERNAME=widad_user
DB_PASSWORD=                           # ← قوي وفريد

# Queue — غيّر من sync لـ redis أو database
QUEUE_CONNECTION=redis                 # إذا Redis متاح
                                       # أو: database (إذا لا)

# Cache
CACHE_DRIVER=redis                     # أو: file (إذا لا redis)
SESSION_DRIVER=redis                   # أو: database

# Redis (إذا متاح)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

**ب) مفاتيح الـ External APIs (من .env.example):**
```bash
# Paymob — غيّر من Sandbox لـ Live
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=
PAYMOB_BASE_URL=https://accept.paymob.com/api  # Live URL

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://[domain]/api/auth/google/callback

# VAPID (Push Notifications)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Mail — غيّر من Mailtrap
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net            # أو Mailgun أو Gmail
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=                         # SendGrid API Key
MAIL_FROM_ADDRESS=noreply@[domain]
MAIL_FROM_NAME="منصة وداد"

# Hugging Face
[افحص .env.example وأضف كل HF variables]

# Chatbot
CHATBOT_PATIENT_CONTEXT_ENABLED=true   # فعّله في الإنتاج
```

**ج) التحقق من كل variable:**
```bash
# بعد إنشاء .env — تحقق لا يوجد variable فارغ حرج:
grep -E "^(APP_KEY|DB_PASSWORD|PAYMOB|VAPID|GOOGLE_CLIENT).*=$" .env
# يجب أن يُرجع 0 نتيجة
```

### 1.3 تهيئة CORS

افحص `config/cors.php` الحالي واكتب الإصلاح:

```php
// config/cors.php — قبل الرفع:
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
    env('APP_URL', 'http://localhost:8000'),
    // إضافة في .env:
    // FRONTEND_URL=https://widad.com
    // APP_URL=https://api.widad.com
],
```

```bash
# في .env:
FRONTEND_URL=https://[frontend-domain]
APP_URL=https://[api-domain]
```

### 1.4 Migrations

```bash
# خطوات التنفيذ بالترتيب:
# 1. backup أولاً (دائماً)
mysqldump -u root -p widad_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. تشغيل الـ migrations
php artisan migrate --force

# 3. تحقق من عدد الجداول
php artisan db:table  # أو:
mysql -u root -p -e "USE widad_db; SHOW TABLES;" | wc -l
# يجب أن يُرجع عدداً يقارب 81+
```

**⚠️ مشكلة SQLite Enum في الاختبارات:**
```bash
# إذا كانت هناك migrations تستخدم DB::statement() لـ enum
# (راجعتها في المرحلة 1 من migrations plan)
# في .env.testing فقط:
SKIP_ENUM_MIGRATION=true
```

### 1.5 Queue Worker

افحص `app/Jobs/` وحدد كل الـ Jobs الموجودة:

```bash
# الـ Jobs في المشروع (تحقق من الأسماء الفعلية):
# ProcessChatbotMessageJob
# ProcessLabTestJob
# UploadChatbotDocumentJob
# SendAppointmentReminders
# SyncGoogleFitData
# [أي jobs إضافية من فحص app/Jobs/]
```

**GCP (systemd):**
```ini
# /etc/systemd/system/widad-worker.service
[Unit]
Description=Widad Queue Worker
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/widad/Back-end
ExecStart=/usr/bin/php artisan queue:work redis \
    --sleep=3 \
    --tries=3 \
    --max-time=3600 \
    --timeout=120
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable widad-worker
sudo systemctl start widad-worker
sudo systemctl status widad-worker
```

**AWS (Supervisor):**
```ini
# /etc/supervisor/conf.d/widad-worker.conf
[program:widad-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/widad/Back-end/artisan queue:work redis --sleep=3 --tries=3 --timeout=120
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/widad-worker.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start widad-worker:*
```

### 1.6 Build الفرونت

افحص `Front-End/.env.example` و `vite.config.ts`:

```bash
# في Front-End/.env.production:
VITE_API_URL=https://[api-domain]/api/v1
VITE_APP_NAME="منصة وداد"
[أي variables إضافية من .env.example]

# Build:
cd Front-End
npm ci --production=false     # install all deps
npm run build                 # يُنشئ dist/

# رفع dist/ على الـ Server:
# GCP:
gsutil -m cp -r dist/ gs://[bucket-name]/
# أو Nginx:
sudo cp -r dist/* /var/www/widad/public/

# AWS:
aws s3 sync dist/ s3://[bucket-name]/ --delete
```

---

## المرحلة الثانية — الأمان والاستقرار (يوم 1-2) ⚠️

---

### 2.1 SSL/HTTPS

**GCP (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d [domain] -d www.[domain]
sudo certbot renew --dry-run  # اختبار التجديد التلقائي
```

**AWS (ACM):**
```bash
# من AWS Console:
# 1. Certificate Manager → Request Certificate → ادخل domain
# 2. بعد validation → ربطه بـ Load Balancer أو CloudFront
# لا أوامر CLI مطلوبة للـ ACM
```

**Nginx Config بعد SSL:**
```nginx
server {
    listen 80;
    server_name [domain];
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name [domain];
    root /var/www/widad/Back-end/public;

    ssl_certificate /etc/letsencrypt/live/[domain]/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[domain]/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.env {
        deny all;           # ← يمنع الوصول لـ .env
    }
}
```

### 2.2 إعداد Mail الحقيقي

افحص `config/mail.php` وحدد الـ mailer الحالي:

```bash
# SendGrid (موصى به):
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=[SENDGRID_API_KEY]
MAIL_ENCRYPTION=tls

# اختبار بعد الإعداد:
php artisan tinker
>>> Mail::raw('Test from Widad', fn($m) => $m->to('test@example.com')->subject('Test'));
```

### 2.3 تأمين الـ .env والـ credentials

```bash
# 1. تأكد .env في .gitignore
grep "\.env" .gitignore  # يجب أن يظهر

# 2. صلاحيات الملف على السيرفر
chmod 600 .env
chown www-data:www-data .env

# 3. احذف أي credentials تجريبية
grep -E "(test|sandbox|demo|fake)" .env
# راجع النتائج وحدّث كل قيمة

# 4. تحقق من GitHub — هل .env رُفع قبل كده؟
git log --all --full-history -- .env
# إذا ظهرت نتائج → غيّر كل الـ credentials فوراً
```

### 2.4 Cron Scheduler

افحص `app/Console/Kernel.php` وأضف كل الـ jobs في الـ crontab:

```bash
# فتح crontab:
sudo crontab -u www-data -e

# إضافة السطر التالي:
* * * * * cd /var/www/widad/Back-end && php artisan schedule:run >> /var/log/widad-scheduler.log 2>&1
```

**الـ Jobs المجدولة في المشروع (من Kernel.php):**
```
[افحص Kernel.php واكتب كل job + تكراره]:
- CancelExpiredConsultations  → [تكرار]
- SendAppointmentReminders    → [تكرار]
- SyncGoogleFitData           → [تكرار]
- CleanupOldChatMessages      → [تكرار]
- [أي jobs إضافية]
```

```bash
# اختبار الـ Scheduler:
php artisan schedule:list
php artisan schedule:run --verbose  # تشغيل يدوي للاختبار
```

### 2.5 Google OAuth Redirect URIs

```bash
# في Google Cloud Console:
# APIs & Services → Credentials → OAuth 2.0 Client IDs → Edit

# أضف هذه الـ URIs:
# Authorized JavaScript origins:
https://[frontend-domain]

# Authorized redirect URIs:
# Google Meet (للأطباء):
https://[api-domain]/api/auth/google/callback
# Google Fit (للمريضات):
https://[api-domain]/api/patient/iot/google-fit/callback

# في .env — تحديث:
GOOGLE_REDIRECT_URI=https://[api-domain]/api/auth/google/callback
```

### 2.6 Paymob Callback URLs

```bash
# في لوحة تحكم Paymob (accept.paymob.com):
# Settings → Payment Integrations → Edit

# غيّر الـ URLs من:
http://localhost:8000/api/payment/callback
# إلى:
https://[api-domain]/api/payment/paymob/callback

# Transaction Processed Callback:
https://[api-domain]/api/payment/paymob/webhook

# في .env:
PAYMOB_CALLBACK_URL=https://[api-domain]/api/payment/paymob/callback
```

### 2.7 Redis في الإنتاج

**GCP (Redis على نفس الـ VM):**
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# تأمين Redis:
sudo nano /etc/redis/redis.conf
# أضف:
# bind 127.0.0.1
# requirepass [strong-password]

# في .env:
REDIS_PASSWORD=[strong-password]

# اختبار:
redis-cli ping  # يجب أن يُرجع PONG
```

**AWS (ElastiCache):**
```bash
# من AWS Console → ElastiCache → Create Redis Cluster
# بعد الإنشاء:
REDIS_HOST=[elasticache-endpoint]
REDIS_PORT=6379
REDIS_PASSWORD=
```

**تحقق بعد الإعداد:**
```bash
php artisan tinker
>>> Cache::put('test', 'widad', 60);
>>> Cache::get('test');  # يجب أن يُرجع 'widad'
```

### 2.8 تفعيل Redis للـ Queue

```bash
# في .env:
QUEUE_CONNECTION=redis

# اختبار:
php artisan queue:work redis --once --verbose
# يجب أن يُشغّل job واحد ويتوقف
```

---

## المرحلة الثالثة — تحسين الأداء (يوم 2-3) ✅

---

### 3.1 Optimize Laravel

```bash
# بالترتيب:
php artisan config:cache      # يُجمع config في ملف واحد
php artisan route:cache       # يُجمع routes (مهم مع 200+ route)
php artisan view:cache        # يُجمع views
php artisan event:cache       # يُجمع events
php artisan optimize          # يُشغّل كل الأوامر السابقة

# تحقق:
php artisan about  # يعرض الوضع الحالي

# عند أي تعديل مستقبلي:
php artisan optimize:clear    # مسح كل الـ cache
```

### 3.2 HF Spaces Wakeup Cron

```bash
# أضف في crontab (كل 25 دقيقة):
*/25 * * * * cd /var/www/widad/Back-end && php wakeup_apis.php >> /var/log/widad-hf-wakeup.log 2>&1

# أو عبر Laravel Scheduler (في Kernel.php):
$schedule->exec('php wakeup_apis.php')->everyThirtyMinutes();

# اختبار يدوي:
php wakeup_apis.php
# يجب أن تُرجع كل الـ 4 APIs + OCR: Status 200
```

### 3.3 اختبار Paymob Sandbox

```bash
# في .env — وضع Sandbox مؤقتاً:
PAYMOB_BASE_URL=https://accept.paymob.com/api  # نفس URL لكن بـ test keys

# بطاقة الاختبار:
# رقم: 4987654321098769
# Expiry: 05/21
# CVV: 112
# OTP: 123456

# Flow كامل:
# 1. أنشئ حجز استشارة → يُرجع payment URL
# 2. ادفع بالبطاقة التجريبية
# 3. تحقق من callback: POST /api/payment/paymob/callback
# 4. تحقق من تغيير حالة الاستشارة → confirmed
# 5. تحقق من وصول إشعار للمريضة والطبيبة
```

### 3.4 حذف الكود Legacy

```bash
# ZoomService (غير مستخدم):
git rm Back-end/app/Services/ZoomService.php
git commit -m "chore: remove unused ZoomService legacy file"

# تحقق قبل الحذف:
grep -r "ZoomService" Back-end/app/  # يجب أن يُرجع 0 نتيجة
```

### 3.5 Error Monitoring (Sentry)

```bash
# Backend:
composer require sentry/sentry-laravel

# في .env:
SENTRY_LARAVEL_DSN=https://[your-dsn]@sentry.io/[project-id]
SENTRY_TRACES_SAMPLE_RATE=0.1

# Frontend:
npm install @sentry/react
# في main.tsx:
# Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })

# في .env.production:
VITE_SENTRY_DSN=https://[your-dsn]@sentry.io/[project-id]

# اختبار:
php artisan sentry:test
```

---

## المرحلة الرابعة — ما بعد الرفع (يوم 3+) 🔵

---

### 4.1 إنشاء Admin الأول

```bash
# تشغيل Core Seeders فقط (لا تشغّل كل Seeders في الإنتاج):
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=LifeStageSeeder
php artisan db:seed --class=SettingsSiteSeeder
php artisan db:seed --class=AdminSeeder

# تحقق:
php artisan tinker
>>> App\Models\Admin::first()->email  # يجب أن يُرجع admin@widad.com

# تسجيل دخول:
# الرابط: https://[domain]/admin/login
# Email: admin@widad.com
# Password: Admin@123456  ← غيّره فوراً بعد أول دخول!
```

### 4.2 اختبار كل الـ User Flows

```
Flow 1 — المريضة:
  ✓ تسجيل → OTP Email → تحقق → تسجيل دخول
  ✓ بحث عن طبيبة → حجز موعد → دفع → تأكيد
  ✓ دخول جلسة Google Meet
  ✓ شات بوت (public + pregnancy + motherhood)
  ✓ AI Prediction (GDM → نتيجة تظهر في الصفحة)
  ✓ رفع تحليل طبي → OCR → نتيجة

Flow 2 — الطبيبة:
  ✓ تسجيل → Admin يعتمد الحساب
  ✓ تعيين مواعيد عمل
  ✓ استقبال حجز → Google Meet
  ✓ كتابة روشتة → تظهر للمريضة

Flow 3 — الأدمن:
  ✓ تسجيل دخول لوحة التحكم
  ✓ اعتماد طبيبة
  ✓ رفع مستند Chatbot RAG
  ✓ تقرير مالي

Flow 4 — الإشعارات:
  ✓ Push notification وصل للمتصفح
  ✓ Email OTP وصل لـ Inbox (مش Spam)
```

### 4.3 DB Backups التلقائية

**GCP:**
```bash
# نص backup يومي:
cat > /usr/local/bin/widad-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/widad_backup_$DATE.sql.gz"
mysqldump -u widad_user -p[password] widad_production | gzip > $BACKUP_FILE
gsutil cp $BACKUP_FILE gs://[backup-bucket]/db-backups/
rm $BACKUP_FILE
echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/widad-backup.sh

# جدولة يومياً الساعة 2 صباحاً:
echo "0 2 * * * /usr/local/bin/widad-backup.sh >> /var/log/widad-backup.log 2>&1" | crontab -
```

**AWS:**
```bash
# RDS Automated Backups:
# RDS Console → [database] → Maintenance & backups
# Backup retention: 7 days
# Backup window: 02:00-03:00 UTC
# (تلقائي — لا script مطلوب)
```

---

## 📋 جدول الفروقات GCP vs AWS

| البند | GCP | AWS | ملاحظة |
|---|---|---|---|
| **VM المجانية** | e2-micro مجانية للأبد (US regions) | t3.micro مجانية سنة فقط | GCP أفضل للمشاريع الصغيرة |
| **Queue Worker** | systemd (built-in) | Supervisor (يحتاج install) | كلاهما يعمل |
| **SSL** | Let's Encrypt على الـ VM | ACM (مجاني) مع Load Balancer | AWS أسهل لكن Load Balancer يكلف |
| **Static Frontend** | Cloud Storage bucket | S3 + CloudFront | متشابهان |
| **Redis** | على نفس الـ VM (مجاني) | ElastiCache ($12+/شهر) | GCP أوفر |
| **DB Backup** | gsutil + Cron script | RDS Automated (تلقائي) | AWS أسهل |
| **MySQL** | على نفس الـ VM (مجاني) | RDS ($12+/شهر) | GCP أوفر |
| **Region قريب** | us-central1 (بعيد نسبياً) | Bahrain / UAE (أقرب) | AWS أقرب لمصر |
| **الـ Domain** | Cloud DNS ($0.20/شهر) | Route 53 ($12/سنة) | متشابهان |
| **التكلفة الشهرية** | ~$0.30 (بعد 90 يوم) | ~$8 (بعد سنة) | GCP أرخص بكثير |
| **سهولة للمبتدئ** | ✅ Console أوضح | ⚠️ IAM معقد | GCP موصى به |

---

## ⚡ أوامر سريعة — يوم الرفع

```bash
# ===== BACKEND =====
cd /var/www/widad/Back-end

# 1. Pull الكود
git pull origin main

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. .env
cp .env.production .env
php artisan key:generate

# 4. Storage
php artisan storage:link
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 5. Database
php artisan migrate --force

# 6. Seeders (Core فقط في الإنتاج)
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=LifeStageSeeder
php artisan db:seed --class=SettingsSiteSeeder
php artisan db:seed --class=AdminSeeder

# 7. Optimize
php artisan optimize

# 8. Queue Worker
sudo systemctl restart widad-worker  # GCP
# أو: sudo supervisorctl restart widad-worker:*  # AWS

# ===== FRONTEND =====
cd /var/www/widad/Front-End

# 1. Build
cp .env.production .env
npm ci
npm run build

# 2. Deploy
# GCP:
gsutil -m cp -r dist/ gs://[bucket]/
# AWS:
aws s3 sync dist/ s3://[bucket]/ --delete
# أو Nginx:
sudo cp -r dist/* /var/www/html/

# ===== VERIFY =====
# تحقق من كل الـ services:
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status redis-server
sudo systemctl status widad-worker
php artisan queue:monitor
php artisan schedule:list
curl -s https://[domain]/api/health | jq  # إذا كان له health endpoint
```

---

## 🚫 قواعد لا تنكسر

| القاعدة | التفاصيل |
|---|---|
| **لا Seeders كاملة في الإنتاج** | فقط: Role + LifeStage + Settings + Admin |
| **لا `--seed` مع `migrate`** | `php artisan migrate --force` فقط |
| **غيّر Admin password فوراً** | أول دخول → غيّر من `Admin@123456` |
| **Paymob Sandbox أولاً** | لا تنتقل لـ Live keys قبل اختبار كامل |
| **Backup قبل أي migrate** | حتى لو DB فارغة — عادة |
| **`APP_DEBUG=false` دائماً** | في الإنتاج — لا استثناء |
| **راجع .gitignore** | قبل أي `git push` للـ production branch |

---

## ✅ Checklist النهائي قبل الإعلان عن الإطلاق

```
- [ ] php artisan migrate --force ← 0 errors
- [ ] php artisan optimize ← done
- [ ] Queue Worker يشتغل: sudo systemctl status widad-worker
- [ ] Cron Scheduler مفعّل: crontab -l
- [ ] HTTPS يعمل: curl -I https://[domain]
- [ ] CORS: Frontend يتكلم مع Backend بدون errors
- [ ] OTP Email وصل Inbox (مش Spam)
- [ ] Paymob Sandbox flow كامل نجح
- [ ] HF Spaces Wakeup يُرجع 200 للـ 5 APIs
- [ ] Admin login يعمل
- [ ] Chatbot يرد (public bot)
- [ ] AI Prediction (GDM) تُرجع نتيجة
- [ ] Sentry يستقبل events
- [ ] DB Backup جدولة تعمل
- [ ] .env لا يُرى من المتصفح: curl https://[domain]/.env → 403
- [ ] PatientDataCollectorService تعارض محلول
```

---

*الخطة مبنية على: 22 بند من الـ Checklist + فحص كامل للكود — مشروع وداد-تك يونيو 2026*
*تنفع لـ GCP و AWS مع توضيح الفروقات في كل نقطة*
