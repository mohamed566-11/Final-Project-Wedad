# 🤖 برومبت الإيجنت — خطة نظام شات الدكتور والمريضة (Widad-Tech)

---

## 📌 السياق الكامل للمشروع

أنت خبير تقني متخصص في بناء أنظمة الشات الطبية وتطوير تطبيقات الرعاية الصحية. مهمتك هي تحليل الكود بالكامل ثم بناء خطة تفصيلية شاملة لنظام شات مباشر (Real-time) بين الدكتور والمريضة في منصة **وداد-تك (Widad-Tech)**.

---

## 📂 ملف مراجعة الكود (Codebase Review)

اقرأ الملف التالي بعناية كاملة قبل أي خطوة:

```
[أدرج هنا محتوى ملف: 1781965712835_codebase_review__2_.md بالكامل]
```

---

## 🎯 المهمة

بعد قراءة كود المشروع، أنشئ خطة تفصيلية شاملة لنظام شات مباشر بين **الدكتور** و**المريضة** في نفس أسلوب ملف خطة الشات بوت `CHATBOT_SYSTEM_PLAN.md` تماماً من حيث:
- مستوى التفصيل
- الكود الكامل (Backend + Frontend)
- تدفق البيانات
- خطة التنفيذ المرحلية

---

## ⚙️ المواصفات التقنية الثابتة

### القرارات المحددة مسبقاً:
| القرار | الاختيار | السبب |
|---|---|---|
| **نوع الشات** | Real-time مباشر (مثل WhatsApp) | تجربة مستخدم سلسة |
| **المحتوى المدعوم** | نصوص + صور فقط | لا PDF ولا ملفات معقدة |
| **تقنية Real-time** | Polling بسيط (كل 3 ثوانٍ) | أسهل في التطبيق وأقل تعقيداً من WebSocket |
| **قاعدة البيانات** | MySQL (نفس `widad_project`) | متسق مع البنية الموجودة |
| **الباك إند** | Laravel 12 (PHP 8.2+) | نفس إطار العمل الموجود |
| **الفرونت إند** | React 19 + TypeScript | نفس إطار العمل الموجود |
| **Auth** | Laravel Sanctum (3 guards: patient, doctor, admin) | نفس نظام المصادقة الموجود |
| **HTTP Client** | Axios | موجود بالفعل |
| **State Management** | TanStack React Query v5 | موجود بالفعل |

---

## 🚫 القيود والمحاذير

### ما يجب **الالتزام به**:
1. **لا تنشئ جداول DB جديدة إلا عند الضرورة القصوى** — استخدم الموديلات الموجودة قدر الإمكان.
2. **الشات محدود فقط على الاستشارات المؤكدة** (`consultation.status = confirmed` أو `in_progress`) — لا يمكن للدكتور أو المريضة بدء محادثة إلا بعد تأكيد الاستشارة.
3. **لا تستخدم WebSocket أو Laravel Reverb** — فقط HTTP Polling.
4. **ارفع الصور عبر `storage/app/public`** بنفس آلية الصور الموجودة في المشروع.
5. **التزم بـ ApiResponse Trait** الموجود في جميع ردود الـ API.
6. **استخدم نفس نمط Form Requests** للـ Validation.
7. **التزم بـ RTL والنصوص العربية** في كل واجهات المستخدم.
8. **الأدمن يرى كل المحادثات** لأغراض الإشراف الطبي.
9. **حذف رسائل الشات عند حذف الاستشارة** (Cascade Delete).
10. **الشات يغلق تلقائياً** بعد اكتمال أو إلغاء الاستشارة.

---

## 📋 هيكل الخطة المطلوبة

اكتب الخطة بنفس تنسيق `CHATBOT_SYSTEM_PLAN.md` مع الأقسام التالية:

---

### 1. نظرة عامة على النظام

اشرح:
- الفكرة الكاملة للشات بين الدكتور والمريضة
- مخطط معماري (Mermaid diagram) يوضح تدفق البيانات
- العلاقة بين الشات ونظام الاستشارات الموجود (`Consultation` model)
- حالات الشات: `active` (استشارة مؤكدة) → `closed` (استشارة مكتملة/ملغاة)
- قواعد الوصول لكل نوع مستخدم (Patient / Doctor / Admin)

---

### 2. تحليل الكود الموجود والتكامل

افحص الكود الحالي وحدد بدقة:

**الموديلات ذات الصلة الموجودة:**
- `Consultation` model — الحالات، العلاقات، الـ statuses
- `User` (patient) و `Doctor` models — العلاقات
- `ConsultationAttachment` model — هل يمكن إعادة استخدامه للصور؟
- `Notification` و `NotificationService` — لإشعارات الشات
- `PushSubscription` (polymorphic) — للإشعارات الفورية

**الـ Services ذات الصلة:**
- `NotificationService` — كيف سيُستدعى عند وصول رسالة جديدة
- `WebPushService` — للإشعارات الفورية عند وصول رسالة

**الـ Controllers الموجودة:**
- `ConsultationController` (Patient) — ما الـ endpoints الموجودة
- `ConsultationController` (Doctor) — ما الـ endpoints الموجودة
- `ConsultationAttachmentController` — كيف يعمل رفع الملفات حالياً

**ملاحظات التكامل:**
- وضح أين يُضاف الـ ChatController بالضبط في هيكل الـ Controllers
- وضح الـ Routes الجديدة وكيف تتناسب مع `patient.php` و `doctor.php` الموجودتين

---

### 3. هيكل قاعدة البيانات

#### الجدول الجديد: `consultation_messages`

```sql
consultation_messages
├── id              (BigInt, PK, Auto Increment)
├── consultation_id (FK → consultations.id, CASCADE DELETE)
├── sender_type     (Enum: 'patient', 'doctor')
├── sender_id       (BigInt) ← user_id أو doctor_id حسب sender_type
├── message         (Text, Nullable) ← nullable إذا كانت الرسالة صورة فقط
├── image_path      (String, Nullable) ← مسار الصورة إن وجدت
├── message_type    (Enum: 'text', 'image', 'text_image') ← Default: 'text'
├── is_read         (Boolean, Default: false)
├── read_at         (Timestamp, Nullable)
├── created_at      (Timestamp)
└── updated_at      (Timestamp)
Indexes: (consultation_id), (sender_type, sender_id), (is_read)
```

اكتب:
- Migration الكامل
- الموديل `ConsultationMessage` كامل مع:
  - الـ fillable
  - الـ casts
  - الـ relationships (belongsTo Consultation, polymorphic للـ sender)
  - الـ Scopes (`scopeForConsultation`, `scopeUnread`, `scopeByPatient`, `scopeByDoctor`)
  - helper method `markAsRead()`

---

### 4. ملفات الإعداد (Config)

#### ملف `config/chat.php` جديد:

```php
return [
    'limits' => [
        'max_message_length' => 1000,
        'max_image_size_kb'  => 5120,  // 5MB
        'allowed_image_types' => ['jpg', 'jpeg', 'png', 'webp'],
        'polling_interval_ms' => 3000,
        'messages_per_page'  => 50,
    ],
    'storage' => [
        'disk'   => 'public',
        'path'   => 'chat-images',
    ],
    'notifications' => [
        'new_message_push' => true,
        'new_message_email' => false,
    ],
];
```

---

### 5. الباك إند — الكود الكامل

#### 5.1 الـ Form Requests

اكتب الكود الكامل لـ:

**`Requests/Shared/SendChatMessageRequest.php`:**
- Validation: `message` (string, max:1000, required_without:image)
- Validation: `image` (file, image, mimes:jpg,jpeg,png,webp, max:5120, required_without:message)
- رسائل خطأ عربية

#### 5.2 الـ Resource

اكتب الكود الكامل لـ:

**`Resources/Shared/ChatMessageResource.php`:**
```php
return [
    'id'            => $this->id,
    'sender_type'   => $this->sender_type,
    'sender_id'     => $this->sender_id,
    'sender_name'   => $this->sender->name,
    'sender_avatar' => ..., // URL أو null
    'message'       => $this->message,
    'image_url'     => $this->image_path ? Storage::url($this->image_path) : null,
    'message_type'  => $this->message_type,
    'is_read'       => $this->is_read,
    'read_at'       => $this->read_at?->toISOString(),
    'created_at'    => $this->created_at->toISOString(),
    'is_mine'       => ..., // true إذا كان المُرسِل هو المستخدم الحالي
];
```

#### 5.3 الـ Controllers

اكتب الكود الكامل لـ:

**`Controllers/Api/Patient/ConsultationChatController.php`:**
- `sendMessage(Request $request, int $consultationId)` — إرسال رسالة (نص أو صورة)
- `getMessages(Request $request, int $consultationId)` — جلب رسائل مع Pagination
- `getNewMessages(Request $request, int $consultationId)` — Polling: جلب الرسائل الجديدة فقط منذ آخر `last_message_id`
- `markAsRead(Request $request, int $consultationId)` — تحديد كل الرسائل كمقروءة
- `getUnreadCount(Request $request)` — عدد الرسائل غير المقروءة في كل استشاراتها

**`Controllers/Api/Doctor/ConsultationChatController.php`:**
- نفس الـ methods مع اختلافات:
  - الـ Auth guard: `doctor`
  - `sender_type = 'doctor'`، `sender_id = $doctor->id`
  - التحقق أن الاستشارة تخص هذا الدكتور تحديداً

**`Controllers/Api/Admin/ChatMonitorController.php`:**
- `getConversation(Request $request, int $consultationId)` — عرض محادثة استشارة كاملة
- `getAllActiveChats(Request $request)` — كل المحادثات النشطة مع فلترة
- `getChatStats(Request $request)` — إحصاءات: عدد الرسائل، متوسط وقت الرد، إلخ

لكل controller التحقق من:
1. أن الاستشارة موجودة وتخص هذا المستخدم
2. أن status الاستشارة = `confirmed` أو `in_progress` (وإلا رجع 403)
3. Rate limiting

#### 5.4 الـ Routes

**في `routes/patient.php`:**
```php
Route::prefix('consultations/{consultation}/chat')
     ->controller(ConsultationChatController::class)
     ->group(function () {
         Route::get('/messages',           'getMessages');
         Route::get('/messages/new',       'getNewMessages');   // Polling endpoint
         Route::post('/messages',          'sendMessage');
         Route::put('/messages/read',      'markAsRead');
         Route::get('/unread-count',       'getUnreadCount');
     });
```

**في `routes/doctor.php`:** نفس البنية

**في `routes/admin.php`:**
```php
Route::prefix('chat')->controller(ChatMonitorController::class)->group(function () {
    Route::get('/active',                       'getAllActiveChats');
    Route::get('/consultations/{id}',           'getConversation');
    Route::get('/stats',                        'getChatStats');
});
```

#### 5.5 رفع الصور

اكتب `ChatImageService` أو اندمج مع الـ Controller مباشرة مع:
- `storeImage(UploadedFile $file, int $consultationId): string`
- استخدام `storage/app/public/chat-images/{consultation_id}/`
- إرجاع الـ `image_path` المحفوظ
- حذف الصورة تلقائياً عند حذف الرسالة (`deleting` observer)

#### 5.6 الإشعارات

اكتب:
- `NewChatMessageNotification.php` في `app/Notifications/`
  - Database channel: يحفظ في جدول `notifications`
  - Push channel: يستدعي `WebPushService`
  - يُرسل للطرف الآخر فقط (إذا أرسلت المريضة → يُشعر الدكتور والعكس)
- كيف يُستدعى من داخل `sendMessage()` في الـ Controller

#### 5.7 Rate Limiting

في `AppServiceProvider`:
```php
RateLimiter::for('chat_message', fn($r) =>
    Limit::perMinute(30)->by($r->user()?->id ?: $r->ip())
);
RateLimiter::for('chat_polling', fn($r) =>
    Limit::perMinute(60)->by($r->user()?->id ?: $r->ip())
);
```

---

### 6. الفرونت إند — الكود الكامل

#### 6.1 الـ TypeScript Types: `src/types/chat.ts`

```typescript
export interface ChatMessage {
    id: number;
    sender_type: 'patient' | 'doctor';
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    message: string | null;
    image_url: string | null;
    message_type: 'text' | 'image' | 'text_image';
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    is_mine: boolean;
}

export interface SendMessagePayload {
    message?: string;
    image?: File;
}

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    isSending: boolean;
    unreadCount: number;
    lastMessageId: number | null;
    consultationStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | string;
}
```

#### 6.2 الـ Service: `src/services/chatService.ts`

اكتب:
- `getMessages(consultationId, page?)` — جلب كل الرسائل
- `getNewMessages(consultationId, lastMessageId)` — Polling: جلب الرسائل الأحدث من `lastMessageId`
- `sendMessage(consultationId, payload: SendMessagePayload)` — إرسال (FormData للصور)
- `markAsRead(consultationId)` — تحديد كل الرسائل كمقروءة
- `getUnreadCount()` — عدد غير المقروءة

#### 6.3 الـ Hook: `src/hooks/useConsultationChat.ts`

اكتب Hook كامل يشمل:
- `messages` state
- Polling آلية: `useEffect` + `setInterval` كل 3 ثوانٍ يستدعي `getNewMessages`
  - يتوقف الـ Polling تلقائياً إذا كان `consultationStatus` = `completed` أو `cancelled`
  - يتوقف عند إغلاق المكوّن (Cleanup function)
- `sendMessage(payload)` — مع Optimistic Update للـ UI
- `isConsultationActive` — boolean مشتق من الـ status
- تحديد الرسائل كمقروءة عند فتح الشات (`markAsRead` on mount)
- معالجة أخطاء الشبكة (Retry بعد 5 ثوانٍ عند الفشل)

#### 6.4 المكونات (Components)

اكتب الكود الكامل لـ:

**`src/components/chat/ConsultationChat.tsx`** — المكوّن الرئيسي:
- يستقبل `consultationId` و `consultationStatus` كـ props
- يعرض `ChatHeader` + `MessageList` + `MessageInput`
- يُظهر Banner "المحادثة مغلقة" إذا كانت الاستشارة مكتملة/ملغاة
- يدعم Dark Mode

**`src/components/chat/ChatHeader.tsx`:**
- اسم الطرف الآخر (الدكتور أو المريضة) + صورته
- حالة الاتصال: "متصل الآن" / "آخر ظهور..."
- زر لعرض تفاصيل الاستشارة

**`src/components/chat/MessageList.tsx`:**
- يعرض الرسائل مجمعة حسب التاريخ (فواصل تاريخ: "اليوم", "أمس", "الاثنين 15 يونيو")
- Auto-scroll لآخر رسالة عند وصول رسائل جديدة
- Scroll to bottom button إذا كان المستخدم يقرأ رسائل قديمة
- Virtualization بسيطة إذا تجاوز عدد الرسائل 200

**`src/components/chat/MessageBubble.tsx`:**
- رسائل المستخدم: يمين + لون مميز
- رسائل الطرف الآخر: يسار + لون محايد
- عرض الصور مع إمكانية التكبير (Lightbox)
- وقت الرسالة + علامة القراءة ✓✓ (مثل WhatsApp)
- RTL كامل

**`src/components/chat/MessageInput.tsx`:**
- `textarea` قابل للتمدد (auto-resize)
- زر رفع صورة مع Preview قبل الإرسال
- زر إرسال
- إظهار "حجم الصورة كبير" إذا تجاوز 5MB
- معطّل (disabled) إذا كانت الاستشارة مغلقة
- دعم `Enter` للإرسال + `Shift+Enter` لسطر جديد

**`src/components/chat/ImagePreview.tsx`:**
- Preview مصغر للصورة قبل الإرسال
- زر حذف الصورة المختارة
- شريط التحميل أثناء الرفع

**`src/components/chat/UnreadBadge.tsx`:**
- شارة عدد الرسائل غير المقروءة
- تُستخدم في قائمة الاستشارات + شريط التنقل

#### 6.5 دمج الشات في الصفحات الموجودة

وضح بالكود كيف تُدمج `ConsultationChat` في:
- `pages/patient/ConsultationDetails.tsx` — تبويب "المحادثة"
- `pages/doctor/ConsultationDetails.tsx` — تبويب "المحادثة مع المريضة"
- `pages/admin/consultations/ConsultationDetails.tsx` — عرض للقراءة فقط (Read-only)

---

### 7. آلية العمل وتدفق البيانات

ارسم تدفق Mermaid لكل السيناريوهات:

#### 7.1 إرسال رسالة نصية
```
[المريضة تكتب رسالة] → [Optimistic Update في UI] →
[POST /consultations/{id}/chat/messages] →
[التحقق من الـ Auth + Status الاستشارة] →
[حفظ في consultation_messages] →
[إشعار للدكتور (Push + DB)] →
[إرجاع ChatMessageResource] →
[تحديث UI بالرسالة الحقيقية]
```

#### 7.2 Polling — استقبال الرسائل
```
[كل 3 ثوانٍ] →
[GET /messages/new?last_message_id=X] →
[جلب الرسائل الأحدث من X] →
[إذا وُجد رسائل جديدة: إضافة للـ UI + markAsRead] →
[إذا لا: لا يحدث شيء]
```

#### 7.3 رفع صورة
```
[المريضة تختار صورة] →
[Preview فوري في UI] →
[التحقق: حجم ≤ 5MB، نوع مسموح] →
[FormData: {message?, image: File}] →
[POST → رفع الصورة → حفظ الـ path] →
[إرجاع الـ image_url في الـ response]
```

#### 7.4 إغلاق الشات تلقائياً
```
[استشارة تُكمَل أو تُلغى] →
[Consultation status → completed/cancelled] →
[Frontend Polling يكتشف الـ status عبر consultation query] →
[إيقاف Polling Interval] →
[إظهار Banner: "انتهت الاستشارة - المحادثة مغلقة"] →
[تعطيل MessageInput]
```

---

### 8. الأمان وحدود الاستخدام

| الحماية | التفاصيل |
|---|---|
| **Auth Guard** | Patient Sanctum / Doctor Sanctum / Admin Sanctum |
| **Ownership Check** | التحقق أن الاستشارة تخص هذا المستخدم بالضبط |
| **Status Check** | رفض الإرسال إذا status ≠ confirmed/in_progress |
| **File Validation** | مسموح فقط: jpg, jpeg, png, webp — حد أقصى 5MB |
| **Message Length** | حد أقصى 1000 حرف |
| **Rate Limiting** | 30 رسالة/دقيقة لإرسال، 60 طلب/دقيقة للـ Polling |
| **XSS Protection** | عرض النصوص كـ text وليس HTML في الـ Frontend |
| **Admin Read-Only** | الأدمن يرى فقط، لا يرسل |
| **Cascade Delete** | حذف الرسائل والصور عند حذف الاستشارة |

---

### 9. معالجة الأخطاء

#### 9.1 أخطاء الباك إند

| الحالة | الكود | الرسالة العربية |
|---|---|---|
| استشارة غير موجودة | 404 | "الاستشارة غير موجودة" |
| ليست استشارتك | 403 | "غير مصرح لك بالوصول" |
| الاستشارة مغلقة | 403 | "المحادثة مغلقة — انتهت الاستشارة" |
| رسالة فارغة (بدون نص أو صورة) | 422 | "يجب إرسال نص أو صورة" |
| الصورة كبيرة | 422 | "حجم الصورة يتجاوز 5MB" |
| نوع ملف غير مدعوم | 422 | "نوع الملف غير مدعوم، مسموح فقط: JPG, PNG, WebP" |
| Rate Limit | 429 | "تجاوزت حد الرسائل المسموح به" |
| خطأ في رفع الصورة | 500 | "فشل رفع الصورة، حاول مرة أخرى" |

#### 9.2 أخطاء الفرونت إند

- Polling يفشل: Retry بعد 5 ثوانٍ، بعد 3 فشل متتالي → "تحقق من اتصالك بالإنترنت"
- إرسال يفشل: Rollback الـ Optimistic Update + Toast error
- رفع صورة يفشل: إزالة Preview + Toast error

---

### 10. خطة التنفيذ المرحلية

قسّم التنفيذ لمراحل واضحة مع:
- الملفات المطلوبة لكل مرحلة
- الوقت المقدر (بالساعات)
- Checklist قابل للتتبع
- معايير نجاح كل مرحلة قبل الانتقال للتالية

المراحل المقترحة:
1. **قاعدة البيانات والـ Config** (~1 ساعة)
2. **Eloquent Model + Resource + Form Request** (~1 ساعة)
3. **Backend Controllers + Routes + Notifications** (~2 ساعة)
4. **Frontend Types + Service + Hook** (~2 ساعة)
5. **Frontend Components كاملة** (~3 ساعات)
6. **الدمج في الصفحات الموجودة** (~1 ساعة)
7. **الأمان والـ Rate Limiting والـ Edge Cases** (~1 ساعة)
8. **الاختبارات والـ Admin Panel** (~2 ساعة)

**الإجمالي المتوقع: ~13 ساعة**

---

### 11. إشعارات الشات

#### 11.1 إشعار "رسالة جديدة"

اكتب `NewChatMessageNotification` بـ channels:
- **Database** — تُحفظ في جدول `notifications` بنفس الـ pattern الموجود في المشروع
- **Push** — تستدعي `WebPushService` (polymorphic — يدعم Patient/Doctor)

متى يُرسل الإشعار:
- إذا أرسلت المريضة → يُشعر الدكتور فقط
- إذا أرسل الدكتور → تُشعر المريضة فقط
- لا إشعار لنفس المُرسِل

بيانات الإشعار:
```php
[
    'type'            => 'new_chat_message',
    'consultation_id' => $consultation->id,
    'sender_name'     => $sender->name,
    'message_preview' => Str::limit($message->message ?? '📷 صورة', 50),
    'redirect_url'    => "/consultations/{$consultation->id}",
]
```

---

### 12. الخصوصية والبيانات الطبية

- رسائل الشات تُعتبر **بيانات طبية حساسة** — لا تُرسل لأي طرف ثالث
- الصور الطبية تُحفظ في `storage/app/public/chat-images/` مع:
  - تسمية random (UUID) — لا أسماء ملفات يمكن تخمينها
  - لا links مباشرة — فقط عبر Storage::url()
- عند حذف الاستشارة → حذف الرسائل + الصور من الـ Storage
- الأدمن يرى المحادثات فقط للإشراف الطبي — مع تسجيل الوصول في AuditLog

---

### 13. إدارة الأدمن — لوحة الإشراف

#### 13.1 الإحصاءات (Chat Stats)

```php
[
    'total_messages_today'     => ...,
    'active_consultations'     => ..., // consultations بها رسائل خلال آخر 24 ساعة
    'avg_response_time_doctor' => ..., // متوسط وقت رد الدكتور (بالدقائق)
    'unresponded_chats'        => ..., // استشارات مؤكدة بدون رد دكتور > 24 ساعة
]
```

#### 13.2 Admin View

- قائمة كل الاستشارات النشطة مع عدد الرسائل
- فلترة: حسب الدكتور / المريضة / التاريخ
- عرض محادثة كاملة (Read-only)
- تصدير محادثة كـ PDF (مستقبلاً)

---

### 14. الاختبارات

#### 14.1 Backend Tests (Pest PHP)

```php
// Feature Tests المطلوبة:
- test('patient can send message to confirmed consultation')
- test('patient cannot send message to completed consultation')
- test('patient cannot send message to another patient consultation')
- test('doctor can send message to their consultation')
- test('doctor cannot access other doctor consultations chat')
- test('polling returns only new messages after last_message_id')
- test('mark as read updates all unread messages')
- test('image upload validates file type and size')
- test('cascade delete removes messages when consultation deleted')
- test('rate limiting blocks excessive messages')
- test('admin can view any consultation chat')
```

#### 14.2 Frontend Tests (Vitest)

```typescript
// Unit Tests المطلوبة:
- test('useConsultationChat starts polling on mount')
- test('useConsultationChat stops polling when consultation completed')
- test('sendMessage does optimistic update and rollback on error')
- test('MessageBubble shows correct alignment for mine vs others')
- test('MessageInput is disabled when consultation not active')
- test('ImagePreview shows error when file too large')
```

---

### 15. دعم RTL والخطوط العربية في الشات

- `dir="rtl"` على كل Container رئيسي
- رسائل المستخدم: `self-start flex-row-reverse ms-auto` (يمين)
- رسائل الطرف الآخر: `self-start flex-row me-auto` (يسار)
- الوقت يظهر أسفل يسار للرسائل اليمينية والعكس
- Placeholder مربع الإدخال: "اكتب رسالتك هنا..."
- وقت الرسائل يُعرض بالعربية: "منذ 5 دقائق", "10:30 ص"

---

## 🔍 تعليمات إضافية للإيجنت

1. **ابدأ بتحليل الكود** — افحص كل الملفات المذكورة في codebase_review قبل البدء.

2. **لا تخترع** — إذا وُجد نمط في الكود الحالي (مثل ApiResponse Trait، أو طريقة رفع الصور في ConsultationAttachmentController) فاتبعه بنفس الطريقة.

3. **اكتب الكود الكامل** — لا ملخصات، لا pseudocode. كل Controller، كل Hook، كل Component يجب أن يكون كوداً قابلاً للنسخ والتشغيل مباشرةً.

4. **تحقق من التعارضات** — تأكد أن الـ Routes الجديدة لا تتعارض مع الموجودة في `patient.php` و `doctor.php`.

5. **الإشعارات** — استخدم `NotificationService` الموجود بدلاً من بناء آلية جديدة.

6. **Naming Convention** — اتبع نفس أسلوب تسمية الملفات والمتغيرات الموجود في المشروع (snake_case في PHP، camelCase في TypeScript).

7. **اكتب الـ Migration** بتاريخ `2026_06_21` للتوافق مع ترتيب الـ migrations الموجودة.

8. **لا تنسَ الـ Seeder** — أضف `ConsultationMessageSeeder` مع بيانات تجريبية واقعية.

---

## ✅ معيار نجاح الخطة

الخطة ناجحة إذا:
- [ ] يستطيع مطور واحد تطبيقها من البداية للنهاية دون أسئلة إضافية
- [ ] كل ملف مكتوب بالكامل وجاهز للنسخ
- [ ] لا تعارض مع أي كود موجود في المشروع
- [ ] الـ Polling يعمل بدون ضغط زائد على الـ Server
- [ ] الشات يُغلق تلقائياً عند انتهاء الاستشارة
- [ ] الأدمن يرى كل شيء والـ audit trail موجود
- [ ] RTL كامل وتجربة مستخدم سلسة

---

*هذا البرومبت مبني على تحليل كامل لكود مشروع وداد-تك — نسخة يونيو 2026*
