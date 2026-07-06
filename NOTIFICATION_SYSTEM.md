# نظام الإشعارات - Notification System Documentation

## فهرس المحتويات

1. [نظرة عامة على المعمارية](#1-نظرة-عامة-على-المعمارية)
2. [قاعدة البيانات](#2-قاعدة-البيانات)
3. [قنوات الإرسال](#3-قنوات-الإرسال)
4. [أنواع الإشعارات](#4-أنواع-الإشعارات)
5. [واجهات API - المريض والطبيب](#5-واجهات-api---المريض-والطبيب)
6. [واجهات API - الأدمن](#6-واجهات-api---الأدمن)
7. [إشعارات الدفع (Push Notifications)](#7-إشعارات-الدفع-push-notifications)
8. [الواجهة الأمامية (Frontend)](#8-الواجهة-الأمامية-frontend)
9. [المهام المجدولة](#9-المهام-المجدولة)
10. [تحويل الأنواع (Type Normalization)](#10-تحويل-الأنواع-type-normalization)
11. [إعدادات المستخدم](#11-إعدادات-المستخدم)
12. [مخطط تدفق البيانات](#12-مخطط-تدفق-البيانات)

---

## 1. نظرة عامة على المعمارية

يعمل نظام الإشعارات بنظام **ثنائي القنوات** (Dual-Channel Architecture):

### القناة الأولى: `NotificationService` (إدراج مباشر)

- تُستخدم لإشعارات الأعمال (consultations, articles, payments...)
- تُنشئ إشعارات مباشرة في جدول `notifications` باستخدام UUID
- تخزن البيانات بتنسيق `{ title, message, ...extra_data }`
- الأنواع تُحفظ بتنسيق **dot notation** (مثل: `consultation.booked`)

### القناة الثانية: Laravel Notification Classes (متعدد القنوات)

- تُستخدم لإشعارات الاستشارات التلقائية (تأكيد، تذكير، إلغاء...)
- ترسل عبر قنوات متعددة: `database` + `mail` + `broadcast`
- تخزن البيانات بتنسيق `{ title, body, type, ...extra_data }`
- عمود `type` في قاعدة البيانات يحفظ **اسم الكلاس الكامل** (`App\Notifications\...`)

### لا يوجد WebSocket/Pusher

- يعتمد على **Polling** كل 60 ثانية من الواجهة الأمامية
- يعتمد على **Web Push API** للإشعارات الفورية خارج المتصفح

### ملفات النظام الأساسية

| الملف                             | الموقع                            | الوظيفة                                                            |
| --------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `NotificationService.php`         | `app/Services/`                   | خدمة إنشاء الإشعارات المركزية (14 طريقة) + إرسال إيميل HTML تلقائي |
| `NotificationController.php`      | `app/Http/Controllers/Api/`       | واجهة API للمريض والطبيب والأدمن (10 endpoints لكل نوع)            |
| `NotificationAdminController.php` | `app/Http/Controllers/Api/Admin/` | واجهة API للأدمن - الإرسال الجماعي (4 endpoints)                   |
| `SendScheduledNotification.php`   | `app/Jobs/`                       | وظيفة إرسال الإشعارات المجدولة                                     |
| `CleanupOldNotifications.php`     | `app/Console/Commands/`           | أمر حذف الإشعارات القديمة                                          |
| 9 Notification Classes            | `app/Notifications/`              | كلاسات Laravel Notifications                                       |
| `notificationService.ts`          | `src/services/`                   | خدمة الإشعارات في الواجهة الأمامية (role-aware API paths)          |
| `NotificationBell.tsx`            | `src/components/notifications/`   | مكون جرس الإشعارات (يظهر في الـ 3 layouts)                         |
| `NotificationsListPage.tsx`       | `src/pages/notifications/`        | صفحة عرض كاملة لجميع الإشعارات                                     |
| `NotificationSettings.tsx`        | `src/pages/settings/`             | صفحة إعدادات الإشعارات                                             |
| `sw.js`                           | `public/`                         | Service Worker للإشعارات الفورية                                   |

---

## 2. قاعدة البيانات

### 2.1 جدول `notifications`

> Migration: `0001_01_01_000034_create_notifications_table.php`

| العمود            | النوع                  | الوصف                                                 |
| ----------------- | ---------------------- | ----------------------------------------------------- |
| `id`              | `uuid` (PRIMARY KEY)   | معرف فريد UUID                                        |
| `notifiable_type` | `string`               | نوع الكيان (`App\Models\User` أو `App\Models\Doctor`) |
| `notifiable_id`   | `unsignedBigInteger`   | معرف الكيان                                           |
| `type`            | `string`               | نوع الإشعار (dot notation أو full class name)         |
| `data`            | `text`                 | بيانات الإشعار بتنسيق JSON                            |
| `read_at`         | `timestamp` (nullable) | وقت القراءة (`null` = غير مقروء)                      |
| `created_at`      | `timestamp`            | وقت الإنشاء                                           |
| `updated_at`      | `timestamp`            | وقت التحديث                                           |

**الفهارس:** `[notifiable_type, notifiable_id]`

### 2.2 جدول `notification_history`

> Migration: `2026_02_04_200000_create_notification_history_table.php`

| العمود                      | النوع                  | الوصف                                                  |
| --------------------------- | ---------------------- | ------------------------------------------------------ |
| `id`                        | `bigInteger` (AUTO)    | معرف تلقائي                                            |
| `admin_id`                  | `foreignId` → `admins` | الأدمن المُرسِل                                        |
| `title`                     | `string`               | عنوان الإشعار                                          |
| `message`                   | `text`                 | محتوى الإشعار                                          |
| `type`                      | `enum`                 | `announcement`, `update`, `maintenance`, `promotional` |
| `target`                    | `enum`                 | `all`, `patients`, `doctors`                           |
| `recipients_count`          | `integer`              | عدد المستلمين                                          |
| `sent_at`                   | `timestamp` (nullable) | وقت الإرسال (فوري)                                     |
| `scheduled_at`              | `timestamp` (nullable) | وقت الجدولة                                            |
| `status`                    | `enum`                 | `sent`, `scheduled`, `cancelled`                       |
| `created_at` / `updated_at` | `timestamps`           | —                                                      |

### 2.3 جدول `push_subscriptions`

> Migration: `2024_01_20_000001_create_push_subscriptions_table.php` + `2025_01_01_000003_make_push_subscriptions_polymorphic.php`

| العمود                      | النوع                  | الوصف                                                  |
| --------------------------- | ---------------------- | ------------------------------------------------------ |
| `id`                        | `bigInteger` (AUTO)    | معرف تلقائي                                            |
| `user_id`                   | `foreignId` → `users`  | (قديم - للتوافق)                                       |
| `subscribable_type`         | `string`               | نوع المشترك (`App\Models\User` أو `App\Models\Doctor`) |
| `subscribable_id`           | `unsignedBigInteger`   | معرف المشترك                                           |
| `endpoint`                  | `string(500)` (UNIQUE) | رابط Web Push endpoint                                 |
| `p256dh_key`                | `string`               | مفتاح التشفير P-256                                    |
| `auth_key`                  | `string`               | مفتاح المصادقة                                         |
| `user_agent`                | `string` (nullable)    | متصفح المستخدم                                         |
| `last_used_at`              | `timestamp` (nullable) | آخر استخدام                                            |
| `created_at` / `updated_at` | `timestamps`           | —                                                      |

**الفهارس:** `[subscribable_type, subscribable_id]`

### 2.4 عمود `notification_settings` (على جداول `users` و `doctors` و `admins`)

> Migrations:
>
> - `2025_01_01_000002_add_notification_settings_to_users_and_doctors.php`
> - `2025_01_01_000003_add_notification_settings_to_admins.php`

- **النوع:** `json` (nullable)
- **القيمة الافتراضية:**

```json
{
  "email_notifications": true,
  "push_notifications": true,
  "sms_notifications": false,
  "consultation_reminders": true,
  "marketing_emails": false
}
```

---

## 3. قنوات الإرسال

### 3.1 Database Channel

كل الإشعارات تُحفظ في جدول `notifications`. هذه هي القناة الأساسية.

### 3.2 Mail Channel

يُرسل إيميل مفصل عبر `MailMessage`. يُستخدم في:

- تأكيد الاستشارة
- إلغاء الاستشارة
- استشارة جديدة
- تذكير الاستشارة (24 ساعة و 1 ساعة فقط)
- عدم الحضور
- اكتمال الاستشارة
- حالة السحب المالي
- كود OTP

### 3.3 Broadcast Channel

يُرسل عبر `BroadcastMessage` للإشعارات الفورية (real-time). يُستخدم في:

- تأكيد الاستشارة
- إلغاء الاستشارة
- استشارة جديدة
- تذكير الاستشارة
- عدم الحضور

### 3.4 Web Push (عبر Service Worker)

- يُسجل المتصفح اشتراكاً عبر VAPID keys
- الإشعارات تظهر حتى لو المتصفح مغلق
- يدعم الأفعال (actions) حسب نوع الإشعار

---

## 4. أنواع الإشعارات

### 4.1 إشعارات NotificationService (إدراج مباشر)

| النوع (type)                      | العنوان                  | المستلم          | يُستدعى من            |
| --------------------------------- | ------------------------ | ---------------- | --------------------- |
| `consultation.booked`             | استشارة جديدة            | Doctor           | عند حجز استشارة       |
| `consultation.accepted`           | تم قبول الاستشارة        | Patient          | عند قبول الطبيب       |
| `consultation.new_booking`        | حجز جديد مدفوع           | Doctor           | عند نجاح الدفع        |
| `consultation.cancelled_by_admin` | تم إلغاء استشارة         | Doctor + Patient | عند إلغاء الأدمن      |
| `article.approved`                | تم نشر مقالك             | Doctor           | عند الموافقة على مقال |
| `article.submitted`               | تم تقديم المقال للمراجعة | Doctor           | عند تقديم مقال        |
| `article.rejected`                | تم رفض مقالك             | Doctor           | عند رفض مقال          |
| `doctor.verified`                 | تم تفعيل حسابك           | Doctor           | عند تفعيل حساب طبيب   |
| `doctor.verification_rejected`    | تم رفض التحقق            | Doctor           | عند رفض التحقق        |
| `doctor.deactivated`              | تم إيقاف حسابك           | Doctor           | عند إيقاف حساب طبيب   |
| `patient.deactivated`             | تم إيقاف حسابك           | Patient          | عند إيقاف حساب مريض   |
| `payment.success`                 | تم الدفع بنجاح           | Patient          | عند نجاح الدفع        |
| `join_request.contacted`          | تحديث طلب الانضمام       | Doctor           | عند التواصل           |
| `join_request.approved`           | تحديث طلب الانضمام       | Doctor           | عند القبول            |
| `join_request.rejected`           | تحديث طلب الانضمام       | Doctor           | عند الرفض             |
| `payout.processed`                | تم معالجة دفعتك          | Doctor           | عند معالجة سحب        |

**تنسيق البيانات المخزنة:**

```json
{
  "title": "عنوان الإشعار",
  "message": "محتوى الإشعار",
  "consultation_id": 123,
  "...": "بيانات إضافية حسب النوع"
}
```

### 4.2 إشعارات Laravel Notification Classes

| الكلاس                              | القنوات                       | `data.type`              | `data.body`             | Queue         |
| ----------------------------------- | ----------------------------- | ------------------------ | ----------------------- | ------------- |
| `ConsultationConfirmedNotification` | database, mail, broadcast     | `consultation_confirmed` | تأكيد الموعد مع الطبيب  | `ShouldQueue` |
| `ConsultationCancelledNotification` | database, mail, broadcast     | `consultation_cancelled` | إلغاء الاستشارة         | `ShouldQueue` |
| `ConsultationReminderNotification`  | database, broadcast, (mail\*) | `consultation_reminder`  | تذكير بالموعد           | `ShouldQueue` |
| `ConsultationNoShowNotification`    | database, mail, broadcast     | `consultation_no_show`   | عدم الحضور              | `ShouldQueue` |
| `ConsultationCompletedNotification` | mail, database                | `consultation`           | اكتمال الاستشارة        | `ShouldQueue` |
| `NewConsultationNotification`       | database, mail, broadcast     | `new_consultation`       | استشارة جديدة للطبيب    | `ShouldQueue` |
| `PayoutStatusNotification`          | mail, database                | `financial`              | تحديث حالة السحب        | `ShouldQueue` |
| `SendOtpVerifyUserEmail`            | mail فقط                      | —                        | كود تفعيل الإيميل       | **متزامن**    |
| `SendOtpForgetPassword`             | mail فقط                      | —                        | كود استعادة كلمة المرور | **متزامن**    |

> \*`ConsultationReminderNotification` يُرسل إيميل فقط للتذكيرات: `24_hours` و `1_hour`

**تنسيق البيانات المخزنة (toArray):**

```json
{
  "type": "consultation_confirmed",
  "consultation_id": 123,
  "title": "تم تأكيد موعدك! ✅",
  "body": "تم تأكيد موعدك مع د. أحمد يوم 15/03 الساعة 10:00",
  "doctor_name": "أحمد",
  "date": "2025-03-15",
  "time": "10:00",
  "url": "/patient/consultations/123"
}
```

### 4.3 إشعارات الأدمن (Bulk Admin Notifications)

| النوع المخزن         | النوع الأصلي   | الوصف بالعربية |
| -------------------- | -------------- | -------------- |
| `admin_announcement` | `announcement` | إعلان          |
| `admin_update`       | `update`       | تحديث          |
| `admin_maintenance`  | `maintenance`  | صيانة          |
| `admin_promotional`  | `promotional`  | ترويجي         |

**تنسيق البيانات المخزنة:**

```json
{
  "title": "عنوان الإعلان",
  "message": "محتوى الإعلان"
}
```

---

## 5. واجهات API - المريض والطبيب والأدمن (استقبال)

> **Base URL:** `api/v1/patient/notifications` أو `api/v1/doctor/notifications` أو `api/v1/admin/notifications`
>
> **Auth:** Sanctum (guard: `patient` أو `doctor` أو `admin`)
>
> **Controller:** `NotificationController`
>
> **ملاحظة:** الأدمن لديه نفس الـ 10 endpoints لاستقبال الإشعارات، بالإضافة لـ 4 endpoints إضافية للإرسال الجماعي (انظر [القسم 6](#6-واجهات-api---الأدمن))

### 5.1 جلب الإشعارات

```
GET /notifications
```

**Query Parameters:**

| المتغير       | النوع   | افتراضي | الوصف                  |
| ------------- | ------- | ------- | ---------------------- |
| `page`        | integer | 1       | رقم الصفحة             |
| `per_page`    | integer | 20      | عدد الإشعارات لكل صفحة |
| `unread_only` | boolean | false   | فقط غير المقروءة       |

**Response:**

```json
{
  "status": true,
  "data": {
    "notifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "consultation_confirmed",
        "title": "تم تأكيد موعدك! ✅",
        "body": "تم تأكيد موعدك مع د. أحمد يوم 15/03 الساعة 10:00",
        "data": { "consultation_id": 123, "doctor_name": "أحمد", "...": "..." },
        "read_at": null,
        "created_at": "2025-03-14T10:00:00.000Z"
      }
    ],
    "total": 50,
    "unread_count": 5,
    "current_page": 1,
    "last_page": 3
  }
}
```

> **ملاحظة:** الـ `type` يتم تحويله تلقائياً (انظر [القسم 10](#10-تحويل-الأنواع-type-normalization))

### 5.2 تحديد إشعار كمقروء

```
POST /notifications/{id}/read
```

**Response:**

```json
{
  "status": true,
  "message": "تم تحديد الإشعار كمقروء"
}
```

### 5.3 تحديد كل الإشعارات كمقروءة

```
POST /notifications/read-all
```

**Response:**

```json
{
  "status": true,
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}
```

### 5.4 حذف إشعار

```
DELETE /notifications/{id}
```

**Response:**

```json
{
  "status": true,
  "message": "تم حذف الإشعار"
}
```

### 5.5 عدد الإشعارات غير المقروءة

```
GET /notifications/unread-count
```

**Response:**

```json
{
  "status": true,
  "data": {
    "unread_count": 5
  }
}
```

### 5.6 جلب مفتاح VAPID

```
GET /notifications/vapid-key
```

**Response:**

```json
{
  "status": true,
  "data": {
    "vapid_key": "BNhJhkQ3..."
  }
}
```

### 5.7 الاشتراك في إشعارات Push

```
POST /notifications/subscribe
```

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRd...",
    "auth": "tBHI..."
  }
}
```

**Response:**

```json
{
  "status": true,
  "message": "تم تفعيل الإشعارات الفورية بنجاح"
}
```

### 5.8 إلغاء اشتراك Push

```
POST /notifications/unsubscribe
```

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**

```json
{
  "status": true,
  "message": "تم إلغاء الإشعارات الفورية"
}
```

### 5.9 جلب إعدادات الإشعارات

```
GET /notifications/settings
```

**Response:**

```json
{
  "status": true,
  "data": {
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false,
    "consultation_reminders": true,
    "marketing_emails": false
  }
}
```

### 5.10 تحديث إعدادات الإشعارات

```
PUT /notifications/settings
```

**Request Body:** (كل حقل اختياري)

```json
{
  "email_notifications": true,
  "push_notifications": false,
  "sms_notifications": false,
  "consultation_reminders": true,
  "marketing_emails": false
}
```

**Response:**

```json
{
  "status": true,
  "message": "تم حفظ الإعدادات بنجاح",
  "data": {
    "email_notifications": true,
    "push_notifications": false,
    "sms_notifications": false,
    "consultation_reminders": true,
    "marketing_emails": false
  }
}
```

---

## 6. واجهات API - الأدمن (إرسال جماعي)

> **Base URL:** `api/v1/admin/notifications`
>
> **Auth:** Sanctum (guard: `admin`)
>
> **Controller:** `NotificationAdminController`
>
> **ملاحظة:** هذه الـ endpoints خاصة بالإرسال الجماعي فقط. الأدمن يستخدم أيضاً نفس endpoints المريض والطبيب (القسم 5) لاستقبال إشعاراته الشخصية.

### 6.1 إرسال إشعار (فوري أو مجدول)

```
POST /notifications/send
```

**Request Body:**

| المتغير        | النوع    | مطلوب | القيم                                                  | الوصف                         |
| -------------- | -------- | ----- | ------------------------------------------------------ | ----------------------------- |
| `title`        | string   | ✅    | max: 255                                               | عنوان الإشعار                 |
| `message`      | string   | ✅    | max: 1000                                              | محتوى الإشعار                 |
| `type`         | string   | ✅    | `announcement`, `update`, `maintenance`, `promotional` | نوع الإشعار                   |
| `target`       | string   | ✅    | `all`, `patients`, `doctors`                           | الفئة المستهدفة               |
| `scheduled_at` | datetime | ❌    | بعد الوقت الحالي                                       | وقت الجدولة (إذا فارغ = فوري) |

**Response (فوري):**

```json
{
  "status": true,
  "message": "تم إرسال الإشعار بنجاح",
  "data": {
    "sent": true,
    "recipients_count": 150,
    "channels": ["database"]
  }
}
```

**Response (مجدول):**

```json
{
  "status": true,
  "message": "تم جدولة الإشعار بنجاح",
  "data": {
    "scheduled": true,
    "scheduled_at": "2025-03-20T14:00:00",
    "recipients_count": 150,
    "channels": ["database"]
  }
}
```

**آلية الإرسال:**

- يتم إرسال الإشعارات على **دفعات** (chunks) بواقع 100 مستلم لكل دفعة
- لكل مستلم يتم إنشاء صف جديد في جدول `notifications` بنوع `admin_{type}`
- يتم حفظ سجل في `notification_history`
- الإشعارات المجدولة تُنفذ عبر `SendScheduledNotification` Job مع `->delay()`

### 6.2 سجل الإشعارات المرسلة

```
GET /notifications/history
```

**Response:**

```json
{
  "status": true,
  "data": {
    "history": [
      {
        "id": 1,
        "title": "تحديث جديد",
        "message": "تم إضافة ميزات جديدة",
        "type": "update",
        "type_ar": "تحديث",
        "target": "all",
        "target_ar": "الجميع",
        "recipients_count": 200,
        "admin": {
          "id": 1,
          "name": "محمد"
        },
        "sent_at": "2025-03-14T10:00:00"
      }
    ],
    "pagination": {
      "total": 25,
      "per_page": 20,
      "current_page": 1,
      "last_page": 2
    }
  }
}
```

### 6.3 الإشعارات المجدولة

```
GET /notifications/scheduled
```

**Response:**

```json
{
  "status": true,
  "data": {
    "scheduled": [
      {
        "id": 5,
        "title": "صيانة مجدولة",
        "message": "سيتم إجراء صيانة...",
        "type": "maintenance",
        "type_ar": "صيانة",
        "target": "all",
        "target_ar": "الجميع",
        "recipients_count": 200,
        "scheduled_at": "2025-03-20T02:00:00",
        "admin": {
          "id": 1,
          "name": "محمد"
        }
      }
    ]
  }
}
```

### 6.4 إلغاء إشعار مجدول

```
DELETE /notifications/scheduled/{id}
```

**Response:**

```json
{
  "status": true,
  "message": "تم إلغاء الإشعار المجدول"
}
```

---

## 7. إشعارات الدفع (Push Notifications)

### 7.1 المعمارية

```
┌─────────────┐     VAPID Keys     ┌──────────────┐
│   Backend    │ ◄─────────────────►│ config/      │
│   (Laravel)  │                    │ webpush.php   │
└─────┬───────┘                    └──────────────┘
      │
      │ Push Message
      ▼
┌─────────────┐                    ┌──────────────┐
│  Push       │ ──── Delivers ────►│  Browser     │
│  Service    │                    │  (sw.js)     │
│  (FCM/etc)  │                    └──────┬───────┘
└─────────────┘                           │
                                          │ Shows Notification
                                          ▼
                                   ┌──────────────┐
                                   │  OS-level    │
                                   │  Notification │
                                   └──────────────┘
```

### 7.2 تدفق الاشتراك

1. **Frontend** يسجل Service Worker (`/sw.js`)
2. **Frontend** يطلب مفتاح VAPID من `GET /notifications/vapid-key`
3. **Frontend** يطلب إذن الإشعارات من المستخدم (`Notification.requestPermission()`)
4. **Frontend** ينشئ اشتراك Push (`pushManager.subscribe()`) مع `applicationServerKey`
5. **Frontend** يرسل بيانات الاشتراك إلى `POST /notifications/subscribe`
6. **Backend** يحفظ الاشتراك في `push_subscriptions` (polymorphic)

### 7.3 Service Worker (`sw.js`)

**الوظائف:**

- **Cache**: يخزن الصفحات الأساسية للعمل offline
- **Push Handler**: يستقبل ويعرض إشعارات Push
- **Click Handler**: يوجه المستخدم للصفحة المناسبة عند الضغط
- **Actions**: يعرض أزرار تفاعلية حسب نوع الإشعار
- **Background Sync**: يزامن الإشعارات المقروءة عند عودة الاتصال

**أفعال الإشعارات حسب النوع:**

| النوع                    | الأفعال                      |
| ------------------------ | ---------------------------- |
| `consultation_reminder`  | "انضم الآن" + "عرض التفاصيل" |
| `consultation_confirmed` | "عرض التفاصيل"               |
| `new_consultation`       | "عرض" + "تجاهل"              |
| default                  | "عرض"                        |

**توجيه الضغطات:**

| النوع                    | الوجهة                        |
| ------------------------ | ----------------------------- |
| `consultation_reminder`  | `/patient/consultations/{id}` |
| `consultation_confirmed` | `/patient/consultations/{id}` |
| `consultation_cancelled` | `/patient/consultations`      |
| `new_consultation`       | `/doctor/consultations`       |
| `review_received`        | `/doctor/reviews`             |
| default                  | `data.url` أو `/`             |

---

## 8. الواجهة الأمامية (Frontend)

### 8.1 `notificationService.ts` - خدمة الإشعارات

**Singleton** class يُصدَّر كـ `notificationService`.

**الواجهات (Interfaces):**

```typescript
interface Notification {
  id: string; // UUID
  type: string; // snake_case (e.g. "consultation_confirmed")
  title: string;
  body: string;
  data?: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  consultation_reminders: boolean;
  marketing_emails: boolean;
}
```

**Role-aware API:** يستخدم `getApiPrefix()` لتحديد prefix الـ API حسب `localStorage.getItem('userType')`:

- `patient` → `/patient/notifications/...`
- `doctor` → `/doctor/notifications/...`
- `admin` → `/admin/notifications/...`

**الطرق المتاحة:**

| الطريقة                                  | النوع                                           | الوصف                    |
| ---------------------------------------- | ----------------------------------------------- | ------------------------ |
| `init()`                                 | `Promise<boolean>`                              | تسجيل SW + جلب VAPID key |
| `subscribe()`                            | `Promise<boolean>`                              | طلب إذن + اشتراك Push    |
| `unsubscribe()`                          | `Promise<boolean>`                              | إلغاء اشتراك Push        |
| `isEnabled()`                            | `Promise<boolean>`                              | هل الإشعارات مفعلة؟      |
| `getNotifications(params?)`              | `Promise<{notifications, total, unread_count}>` | جلب الإشعارات            |
| `markAsRead(id)`                         | `Promise<boolean>`                              | تحديد كمقروء             |
| `markAllAsRead()`                        | `Promise<boolean>`                              | تحديد الكل كمقروء        |
| `deleteNotification(id)`                 | `Promise<boolean>`                              | حذف إشعار                |
| `getSettings()`                          | `Promise<NotificationSettings \| null>`         | جلب الإعدادات            |
| `updateSettings(settings)`               | `Promise<boolean>`                              | تحديث الإعدادات          |
| `showLocalNotification(title, options?)` | `void`                                          | عرض إشعار محلي           |

### 8.2 `NotificationBell.tsx` - مكون الجرس

- يظهر في **كل الـ layouts الثلاثة**: `DoctorLayout` + `AdminLayout` + `PublicHeader` (للمريض المسجل)
- يعرض **badge** بعدد الإشعارات غير المقروءة
- يعمل بنظام **Polling** كل 60 ثانية
- عند الفتح يعرض dropdown بآخر الإشعارات
- يدعم: تحديد كمقروء، تحديد الكل كمقروء، حذف
- **Role-aware navigation**: يوجه حسب نوع المستخدم (patient/doctor/admin)
  - زر "عرض الكل" → `/patient/notifications` أو `/doctor/notifications` أو `/admin/my-notifications`
  - زر "الإعدادات" → `/{role}/notifications/settings`
  - الضغط على إشعار استشارة → `/{role}/consultations/{id}`

**خريطة الأيقونات (iconMap):** تحتوي على 40+ نوع مع أيقونة ولون مناسب:

| الفئة    | الأنواع                                                                        | الأيقونة                |
| -------- | ------------------------------------------------------------------------------ | ----------------------- |
| استشارات | `consultation_confirmed`, `consultation_booked`, `consultation_accepted`, ...  | Calendar / Video        |
| مالية    | `payment_success`, `payout_processed`, `financial`                             | CreditCard              |
| مقالات   | `article_approved`, `article_submitted`, `article_rejected`                    | FileText                |
| حسابات   | `doctor_verified`, `doctor_deactivated`, `patient_deactivated`                 | UserCheck / UserX       |
| أدمن     | `admin_announcement`, `admin_update`, `admin_maintenance`, `admin_promotional` | Megaphone / AlertCircle |
| طلبات    | `join_request_approved`, `join_request_rejected`                               | UserCheck / UserX       |

### 8.3 `NotificationSettings.tsx` - إعدادات الإشعارات

**مسار الصفحة:** `/settings/notifications`

يعرض 5 toggles:

1. **إشعارات البريد الإلكتروني** (`email_notifications`)
2. **إشعارات الدفع** (`push_notifications`) — يطلب/يلغي اشتراك Push تلقائياً
3. **إشعارات الرسائل النصية** (`sms_notifications`)
4. **تذكيرات المواعيد** (`consultation_reminders`)
5. **رسائل تسويقية** (`marketing_emails`)

### 8.4 `NotificationsListPage.tsx` - صفحة عرض جميع الإشعارات

- **صفحة كاملة** لعرض جميع الإشعارات مع تصفية وتخطيط
- تعمل لجميع أنواع المستخدمين (patient/doctor/admin)
- **تبويبات تصفية**: الكل / غير المقروءة
- **Pagination** مع أزرار التنقل
- **أيقونات ملونة** لكل نوع إشعار مع خلفيات مختلفة
- **Role-aware navigation**: توجيه حسب نوع المستخدم
- **إجراءات**: حذف فردي، تحديد الكل كمقروء
- **واجهة عربية احترافية** RTL

### 8.5 صفحة إشعارات الأدمن (`admin/NotificationsPage.tsx`)

يحتوي على:

- **نموذج إرسال**: عنوان + محتوى + نوع + فئة مستهدفة + وقت جدولة (اختياري)
- **سجل المرسل**: جدول بالإشعارات السابقة من `response.data.history`
- **Pagination**: من `response.data.pagination`

### 8.6 المسارات (Routes)

```
# المريض
/patient/notifications           → NotificationsListPage
/patient/notifications/settings  → NotificationSettingsPage

# الطبيب
/doctor/notifications            → NotificationsListPage
/doctor/notifications/settings   → NotificationSettingsPage

# الأدمن
/admin/notifications             → NotificationsPage (إرسال جماعي)
/admin/my-notifications          → NotificationsListPage (إشعارات شخصية)
/admin/notifications/settings    → NotificationSettingsPage

# توجيهات قديمة (Legacy redirects)
/settings/notifications          → /patient/notifications/settings
/notifications                   → /patient/notifications
```

---

## 9. المهام المجدولة

### 9.1 حذف الإشعارات القديمة

```
notifications:cleanup --days=30
```

- **الجدول:** يومياً الساعة 03:00
- **السلوك:**
  - حذف الإشعارات **المقروءة** الأقدم من 30 يوم
  - حذف الإشعارات **غير المقروءة** الأقدم من 60 يوم (ضعف المدة)

### 9.2 تذكيرات المواعيد

```
SendAppointmentReminders (Job)
```

- **الجدول:** كل 5 دقائق
- يُرسل `ConsultationReminderNotification` مع أنواع التذكير:
  - `24_hours` — قبل الموعد بـ 24 ساعة
  - `1_hour` — قبل الموعد بساعة
  - `15_minutes` — قبل الموعد بـ 15 دقيقة

### 9.3 إلغاء الاستشارات المنتهية

```
CancelExpiredConsultations (Job)
```

- **الجدول:** كل 15 دقيقة

### 9.4 الإشعارات المجدولة من الأدمن

```
SendScheduledNotification (Job)
```

- يعمل عبر Queue مع `->delay()`
- **محاولات:** 3 مرات (`$tries = 3`)
- يتحقق أن الحالة لا تزال `scheduled` قبل الإرسال
- يُحدث الحالة إلى `sent` بعد الإرسال

---

## 10. تحويل الأنواع (Type Normalization)

عند جلب الإشعارات عبر `GET /notifications`، يتم تحويل الأنواع تلقائياً لتتوافق مع الواجهة الأمامية:

### المنطق (في `NotificationController::index`):

```
1. أخذ type من data.type (أولويّة) أو notification.type (بديل)
2. إذا كان class name كامل (يحتوي \):
   → استخراج الاسم القصير بـ class_basename()
   → إزالة كلمة "Notification"
   → تحويل لـ snake_case
3. تحويل أي نقاط (.) إلى شرطات سفلية (_)
```

### أمثلة التحويل:

| المصدر                           | القيمة الأصلية                                        | القيمة النهائية          |
| -------------------------------- | ----------------------------------------------------- | ------------------------ |
| NotificationService              | `consultation.booked`                                 | `consultation_booked`    |
| NotificationService              | `article.approved`                                    | `article_approved`       |
| NotificationService              | `payment.success`                                     | `payment_success`        |
| Laravel Notification (data.type) | `consultation_confirmed`                              | `consultation_confirmed` |
| Laravel Notification (DB type)   | `App\Notifications\ConsultationConfirmedNotification` | `consultation_confirmed` |
| Admin Notification               | `admin_announcement`                                  | `admin_announcement`     |

### حل مشكلة `body`:

الـ `NotificationService` يخزن النص في `data.message` بينما Laravel Notifications تخزنه في `data.body`.
التحويل يحل هذا بـ:

```php
'body' => $data['message'] ?? $data['body'] ?? ''
```

---

## 11. إعدادات المستخدم

### التخزين

- عمود `notification_settings` (JSON) على جداول `users` و `doctors` و `admins`
- يُحفظ كـ JSON object مع 5 مفاتيح boolean

### الإعدادات المتاحة

| الإعداد                  | الافتراضي | الوصف                     |
| ------------------------ | --------- | ------------------------- |
| `email_notifications`    | `true`    | إشعارات البريد الإلكتروني |
| `push_notifications`     | `true`    | إشعارات الدفع الفوري      |
| `sms_notifications`      | `false`   | إشعارات الرسائل النصية    |
| `consultation_reminders` | `true`    | تذكيرات المواعيد          |
| `marketing_emails`       | `false`   | رسائل تسويقية             |

### سلوك التحديث

- يتم دمج الإعدادات الجديدة مع الإعدادات الحالية (`array_merge`)
- كل حقل اختياري (`sometimes|boolean`)
- عند تفعيل `push_notifications` من الواجهة الأمامية، يتم طلب اشتراك Push تلقائياً
- عند إلغاء `push_notifications`، يتم إلغاء اشتراك Push تلقائياً

---

## 12. مخطط تدفق البيانات

### 12.1 تدفق إنشاء إشعار (NotificationService)

```
Business Logic (e.g. ConsultationController)
    │
    ▼
NotificationService::notifyConsultationBooked()
    │
    ▼
NotificationService::create()
    │
    ├── UUID generation
    ├── type: "consultation.booked"
    ├── data: { title, message, ...extra }
    │
    ▼
DB: notifications table
    │
    ▼
Frontend polls GET /notifications (every 60s)
    │
    ▼
NotificationController::index() transforms:
    ├── type: "consultation.booked" → "consultation_booked"
    ├── body: data.message ?? data.body ?? ""
    │
    ▼
Frontend NotificationBell displays notification
```

### 12.2 تدفق إنشاء إشعار (Laravel Notification)

```
Business Logic (e.g. PaymentController)
    │
    ▼
$user->notify(new ConsultationConfirmedNotification($consultation))
    │
    ├── database channel → DB: notifications table
    │     type = "App\Notifications\ConsultationConfirmedNotification"
    │     data = toArray() = { type, title, body, ... }
    │
    ├── mail channel → Email sent via MailMessage
    │
    └── broadcast channel → BroadcastMessage (real-time)
    │
    ▼
Frontend polls GET /notifications (every 60s)
    │
    ▼
NotificationController::index() transforms:
    ├── type: uses data.type = "consultation_confirmed" (priority)
    ├── body: data.body (from toArray)
    │
    ▼
Frontend NotificationBell displays notification
```

### 12.3 تدفق إشعار الأدمن

```
Admin Dashboard → POST /notifications/send
    │
    ├── If scheduled_at provided:
    │     ├── Insert into notification_history (status: scheduled)
    │     └── Dispatch SendScheduledNotification::delay(scheduled_at)
    │           │
    │           ▼ (at scheduled time)
    │     sendToTarget() → chunk(100) → Insert into notifications
    │     Update notification_history (status: sent)
    │
    └── If immediate:
          ├── sendNotificationToTarget() → chunk(100) → Insert into notifications
          │     type: "admin_{original_type}"
          │     data: json_encode({ title, message })
          └── Insert into notification_history (status: sent)
```

### 12.4 تدفق Push Notification

```
User enables Push in Settings
    │
    ▼
notificationService.subscribe()
    │
    ├── Register SW (/sw.js)
    ├── Get VAPID key from backend
    ├── Request browser permission
    ├── pushManager.subscribe()
    │
    ▼
POST /notifications/subscribe
    │
    ├── Validate endpoint + keys
    ├── Check polymorphic duplicate
    └── Save to push_subscriptions
          (subscribable_type + subscribable_id)

--- Later, when push is sent ---

Backend sends push via Web Push protocol
    │
    ▼
sw.js push event handler
    │
    ├── Parse JSON payload
    ├── Determine actions (getActionsForType)
    ├── Show OS notification (showNotification)
    │
    ▼ (user clicks)

sw.js notificationclick handler
    │
    ├── Determine URL based on type
    ├── Focus existing window or open new
    └── Navigate to appropriate page
```

---

## ملاحظات هامة

1. **Polymorphic Design**: كل من `notifications` و `push_subscriptions` يدعم الأنواع الثلاثة (`User`, `Doctor`, `Admin`) عبر morphTo
2. **UUID Primary Key**: جدول `notifications` يستخدم UUID وليس auto-increment
3. **Chunked Delivery**: إشعارات الأدمن تُرسل على دفعات (100 مستلم/دفعة) لتجنب مشاكل الذاكرة
4. **Queue Support**: كلاسات الاستشارات تستخدم `ShouldQueue` (تحتاج `queue:work` أو `QUEUE_CONNECTION=sync`). كلاسات OTP تعمل **بشكل متزامن** لضمان وصول الكود فوراً
5. **Auto Email**: `NotificationService::create()` يرسل إيميل HTML احترافي عربي تلقائياً مع كل إشعار
6. **Role-aware Frontend**: `notificationService.ts` يكتشف نوع المستخدم من `localStorage` ويستخدم API prefix المناسب (`/patient/`, `/doctor/`, `/admin/`)
7. **34 Backend Routes**: 10 routes لكل نوع مستخدم (patient/doctor/admin) للاستقبال + 4 routes إضافية للأدمن للإرسال الجماعي
8. **RTL Support**: Service Worker يعرض الإشعارات بـ `dir: 'rtl'` و `lang: 'ar'`
9. **Offline Support**: Service Worker يدعم Background Sync لمزامنة الإشعارات المقروءة offline
10. **Retry Logic**: `SendScheduledNotification` يُعيد المحاولة 3 مرات ويسجل الأخطاء
