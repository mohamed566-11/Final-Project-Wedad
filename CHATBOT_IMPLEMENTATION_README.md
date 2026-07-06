# Chatbot Implementation README

## 1) الهدف من هذا الملف

هذا الملف هو مرجع تنفيذي احترافي لحالة نظام الشات بوت في منصة وداد.
يغطي:

- الوضع الحالي المنفذ فعليا في المشروع.
- مقارنة مباشرة مع الخطة الأصلية.
- الفجوات المتبقية.
- كود حالي مقابل كود مقترح لكل نقطة حرجة.

المرجع الأساسي للخطة:

- [CHATBOT_SYSTEM_PLAN.md](CHATBOT_SYSTEM_PLAN.md)

---

## 2) نظرة تنفيذية سريعة

### الحالة العامة

- النواة الأساسية للنظام منفذة بشكل جيد: البوتات، الجلسات، الرسائل، التخزين، الـ Queue، والـ Polling.
- يوجد تحسينات مكتملة على واجهة المحادثة: Sidebar للمحادثات، محادثة جديدة، إعادة التسمية، الحذف، وتحديد الجلسة النشطة.
- توجد فجوات مهمة متبقية: أمان Endpoint الضيوف للحالة، Reverb/WebSocket، Feature Flags، وبعض نقاط A11y وRTL.

### نسبة التغطية التقريبية

- Backend Core APIs: عالي
- Frontend Chat Experience: عالي
- Async Queue + Polling: عالي
- Admin Operations: متوسط إلى عالي
- Realtime WebSocket: غير منفذ
- Governance المتقدمة (Feature Flags, Escalations dashboard): جزئي

---

## 3) ما تم تنفيذه فعليا (Completed)

### 3.1 Backend Chat Core

- Controller أساسي للمحادثة:
  - [Back-end/app/Http/Controllers/Api/Patient/ChatbotController.php](Back-end/app/Http/Controllers/Api/Patient/ChatbotController.php)
- Request validation:
  - [Back-end/app/Http/Requests/Patient/SendChatMessageRequest.php](Back-end/app/Http/Requests/Patient/SendChatMessageRequest.php)
- Resource:
  - [Back-end/app/Http/Resources/Patient/ChatMessageResource.php](Back-end/app/Http/Resources/Patient/ChatMessageResource.php)
- Service:
  - [Back-end/app/Services/ChatbotService.php](Back-end/app/Services/ChatbotService.php)
- Model:
  - [Back-end/app/Models/AiChatMessage.php](Back-end/app/Models/AiChatMessage.php)

### 3.2 Routing

- Routes للمستخدمة المسجلة:
  - [Back-end/routes/patient.php](Back-end/routes/patient.php)
- Routes للزائر:
  - [Back-end/routes/public.php](Back-end/routes/public.php)
- Routes الأدمن:
  - [Back-end/routes/admin.php](Back-end/routes/admin.php)

### 3.3 Queue + Polling

- Job للمعالجة غير المتزامنة:
  - [Back-end/app/Jobs/ProcessChatbotMessageJob.php](Back-end/app/Jobs/ProcessChatbotMessageJob.php)
- Polling endpoints موجودة ومستخدمة فعليا.

### 3.4 DB & Performance

- إضافة bot_type:
  - [Back-end/database/migrations/2026_03_14_120000_add_bot_type_to_ai_chat_messages_table.php](Back-end/database/migrations/2026_03_14_120000_add_bot_type_to_ai_chat_messages_table.php)
- إضافة فهارس أداء:
  - [Back-end/database/migrations/2026_04_04_220500_add_chatbot_query_indexes_to_ai_chat_messages_table.php](Back-end/database/migrations/2026_04_04_220500_add_chatbot_query_indexes_to_ai_chat_messages_table.php)

### 3.5 Frontend Chat

- أنواع البيانات:
  - [Front-End/src/types/chatbot.ts](Front-End/src/types/chatbot.ts)
- خدمات API:
  - [Front-End/src/services/chatbotService.ts](Front-End/src/services/chatbotService.ts)
- Hooks:
  - [Front-End/src/hooks/useChatbot.ts](Front-End/src/hooks/useChatbot.ts)
- واجهات الشات:
  - [Front-End/src/components/chatbot/ChatWindow.tsx](Front-End/src/components/chatbot/ChatWindow.tsx)
  - [Front-End/src/components/chatbot/ChatWidget.tsx](Front-End/src/components/chatbot/ChatWidget.tsx)
  - [Front-End/src/pages/patient/ChatbotPage.tsx](Front-End/src/pages/patient/ChatbotPage.tsx)

### 3.6 Admin Chatbot

- Controller:
  - [Back-end/app/Http/Controllers/Api/Admin/AdminChatbotController.php](Back-end/app/Http/Controllers/Api/Admin/AdminChatbotController.php)
  - [Back-end/app/Http/Controllers/Api/Admin/AdminChatbotDocumentController.php](Back-end/app/Http/Controllers/Api/Admin/AdminChatbotDocumentController.php)
- Service Frontend:
  - [Front-End/src/services/adminChatbotService.ts](Front-End/src/services/adminChatbotService.ts)
- صفحة إحصاءات:
  - [Front-End/src/pages/admin/ChatbotStatsPage.tsx](Front-End/src/pages/admin/ChatbotStatsPage.tsx)

---

## 4) الفجوات الحرجة (Gaps) مع الكود الحالي والكود المطلوب

## Gap A: أمان guestMessageStatus

### لماذا هذه النقطة مهمة

الـ Endpoint الحالي يسمح بالوصول إلى حالة أي رسالة عبر messageId فقط، وهذا قد يسمح بالاطلاع على رسائل لا تخص نفس الزائر.

### الكود الحالي

المكان:

- [Back-end/app/Http/Controllers/Api/Patient/ChatbotController.php#L212](Back-end/app/Http/Controllers/Api/Patient/ChatbotController.php#L212)

  public function guestMessageStatus(int $messageId): JsonResponse
    {
        $userMessage = AiChatMessage::findOrFail($messageId);
  $status = $userMessage->metadata['status'] ?? 'processing';
  ...
  }

### الكود الذي يجب أن يكون

الحل المقترح: ربط الحالة بـ guest_session_token في metadata والتحقق منه من Header أو Query.

    public function guestMessageStatus(Request $request, int $messageId): JsonResponse
    {
        $guestToken = $request->header('X-Guest-Session-Token')
            ?? $request->query('guest_token');

        if (!$guestToken) {
            return $this->errorResponse('Guest token is required', 422);
        }

        $userMessage = AiChatMessage::query()
            ->where('id', $messageId)
            ->where('bot_type', 'public')
            ->where('metadata->guest_session_token', $guestToken)
            ->firstOrFail();

        $status = data_get($userMessage->metadata, 'status', 'processing');

        if ($status === 'replied') {
            $replyId = data_get($userMessage->metadata, 'reply_id');
            $reply = $replyId
                ? AiChatMessage::query()
                    ->where('id', $replyId)
                    ->where('metadata->guest_session_token', $guestToken)
                    ->first()
                : null;

            return $this->successResponse([
                'status' => $reply ? 'ready' : 'processing',
                'reply' => $reply ? new ChatMessageResource($reply) : null,
            ]);
        }

        if ($status === 'failed') {
            return $this->successResponse(['status' => 'failed']);
        }

        return $this->successResponse(['status' => 'processing']);
    }

---

## Gap B: Realtime عبر Reverb غير منفذ

### لماذا هذه النقطة مهمة

الـ Polling يزيد الحمل على السيرفر ويضيف تأخير في وصول الرد.

### الكود الحالي

المكان:

- [Front-End/src/hooks/useChatbot.ts#L211](Front-End/src/hooks/useChatbot.ts#L211)

  const pollForReply = (messageId: number) => {
  ...
  pollTimerRef.current = setTimeout(tick, 2000);
  };

### الكود الذي يجب أن يكون

1.  Event للبث:

    class ChatbotResponseReady implements ShouldBroadcast
    {
    public function \_\_construct(public AiChatMessage $replyMessage, public int $userId) {}

         public function broadcastOn(): array
         {
             return [new PrivateChannel("chatbot.user.{$this->userId}")];
         }

         public function broadcastAs(): string
         {
             return 'response.ready';
         }

    }

2.  Hook للاستماع + fallback polling:

    const listenForReply = (messageId: number, userId: number) => {
    const channel = echo.private(`chatbot.user.${userId}`);

    const fallback = setTimeout(() => {
    channel.stopListening('.response.ready');
    pollForReply(messageId);
    }, 35000);

    channel.listen('.response.ready', (event) => {
    if (event.parent_id !== messageId) return;
    clearTimeout(fallback);
    stopPolling();
    setMessages((prev) => [...prev, event.reply]);
    setIsTyping(false);
    });
    };

3.  ملفات مطلوبة إضافية:

- Back-end/routes/channels.php
- Front-End/src/lib/echo.ts

---

## Gap C: stage mapping يعتمد على IDs ثابتة

### لماذا هذه النقطة مهمة

الاعتماد على ID ثابت قد ينكسر عند إعادة ترتيب البيانات أو seed جديد.

### الكود الحالي

المكان:

- [Back-end/config/chatbot.php#L101](Back-end/config/chatbot.php#L101)

  'stage_mapping' => [
  1 => 'pre_marriage',
  2 => 'pregnancy',
  3 => 'motherhood',
  ],

### الكود الذي يجب أن يكون

1.  إضافة mapping بالـ code:

    'stage_mapping_by_code' => [
    'pre_marriage' => 'pre_marriage',
    'pregnancy' => 'pregnancy',
    'motherhood' => 'motherhood',
    ],

2.  دالة جديدة في الخدمة:

    public static function getBotTypeFromStageCode(?string $stageCode): string
    {
        if (!$stageCode) {
    return 'public';
    }

         return config("chatbot.stage_mapping_by_code.{$stageCode}", 'public');

    }

---

## Gap D: Feature Flags غير موجودة

### لماذا هذه النقطة مهمة

تفعيل تدريجي آمن، إيقاف سريع، وإدارة Rollout حسب البيئة.

### الكود الحالي

لا يوجد مفاتيح chatbot_enabled أو chatbot_public_enabled أو chatbot_stage_enabled أو chatbot_emergency_escalation_enabled مستخدمة فعليا.

### الكود الذي يجب أن يكون

1. إعدادات:

   'features' => [
   'chatbot_enabled' => env('CHATBOT_ENABLED', true),
   'chatbot_public_enabled' => env('CHATBOT_PUBLIC_ENABLED', true),
   'chatbot_stage_enabled' => env('CHATBOT_STAGE_ENABLED', true),
   'chatbot_emergency_escalation_enabled' => env('CHATBOT_EMERGENCY_ESCALATION_ENABLED', true),
   ],

2. مثال استخدام داخل controller:

   if (!config('chatbot.features.chatbot_enabled')) {
   return $this->errorResponse('الخدمة غير متاحة حالياً', 503);
   }

---

## Gap E: دعم RTL عبر plugin ناقص

### لماذا هذه النقطة مهمة

تحكم أدق في اتجاهات المسافات والمحاذاة في كل الشاشات.

### الكود الحالي

المكان:

- [Front-End/tailwind.config.ts#L178](Front-End/tailwind.config.ts#L178)

  plugins: [require("tailwindcss-animate")],

### الكود الذي يجب أن يكون

    plugins: [
      require("tailwindcss-animate"),
      require("tailwindcss-rtl"),
    ],

---

## Gap F: اختصارات A11y غير مكتملة (Alt + C)

### لماذا هذه النقطة مهمة

الوصول السريع للشات من الكيبورد ضمن متطلبات الوصول.

### الكود الحالي

المكان:

- [Front-End/src/components/chatbot/ChatWidget.tsx#L25](Front-End/src/components/chatbot/ChatWidget.tsx#L25)

  if (e.key === "Escape" && isOpen) {
  handleClose();
  }

### الكود الذي يجب أن يكون

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          handleClose();
          document.getElementById('chat-toggle-btn')?.focus();
        }

        if (e.altKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      };

      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, handleClose]);

---

## Gap G: تكامل services.php مع HuggingFace

### لماذا هذه النقطة مهمة

توحيد أماكن أسرار الخدمات الخارجية واستخدام نمط Laravel القياسي.

### الكود الحالي

المكان:

- [Back-end/config/services.php](Back-end/config/services.php)
  لا يحتوي huggingface.

### الكود الذي يجب أن يكون

    'huggingface' => [
      'token' => env('HUGGINGFACE_API_TOKEN'),
    ],

---

## Gap H: تغطية الاختبارات للبنود الجديدة غير كافية

### لماذا هذه النقطة مهمة

ضمان عدم تكرار الأعطال بعد الإصدارات.

### الكود الحالي

المكان:

- [Back-end/tests/Feature/ChatbotTest.php](Back-end/tests/Feature/ChatbotTest.php)
  يغطي نقاط أساسية، لكنه لا يغطي كل الميزات المضافة مؤخرا.

### الكود الذي يجب أن يكون

إضافة اختبارات Feature إضافية مثل:

    it('renames a session successfully', function () {
      $user = User::factory()->create(['is_active' => 1]);
      $sessionId = 'public_abc';

      AiChatMessage::factory()->create([
        'user_id' => $user->id,
        'session_id' => $sessionId,
        'bot_type' => 'public',
        'metadata' => [],
      ]);

      $response = actingAs($user)->patchJson("/api/v1/patient/chatbot/sessions/{$sessionId}/rename", [
        'title' => 'عنوان جديد',
      ]);

      $response->assertStatus(200)
        ->assertJsonPath('data.title', 'عنوان جديد');
    });

    it('deletes a session successfully', function () {
      ...
    });

    it('creates new session when force_new_session is true', function () {
      ...
    });

---

## 5) نقاط مطابقة مباشرة مع الخطة (Evidence Mapping)

### 5.1 Queue

- منفذ في:
  - [Back-end/app/Jobs/ProcessChatbotMessageJob.php](Back-end/app/Jobs/ProcessChatbotMessageJob.php)

### 5.2 Polling Status

- منفذ في:
  - [Back-end/routes/patient.php#L242](Back-end/routes/patient.php#L242)
  - [Back-end/routes/public.php#L50](Back-end/routes/public.php#L50)

### 5.3 Cache

- منفذ في:
  - [Back-end/app/Services/ChatbotService.php](Back-end/app/Services/ChatbotService.php)
  - [Back-end/app/Console/Commands/ClearChatbotCacheCommand.php](Back-end/app/Console/Commands/ClearChatbotCacheCommand.php)

### 5.4 Sessions Sidebar + New Conversation + Rename/Delete

- منفذ في:
  - [Front-End/src/components/chatbot/ChatWindow.tsx](Front-End/src/components/chatbot/ChatWindow.tsx)
  - [Front-End/src/hooks/useChatbot.ts](Front-End/src/hooks/useChatbot.ts)

### 5.5 Rate Limits

- منفذ في:
  - [Back-end/app/Providers/AppServiceProvider.php](Back-end/app/Providers/AppServiceProvider.php)

---

## 6) خطة إغلاق الفجوات (Professional Action Plan)

### Priority 1 (أمني)

1. تأمين guestMessageStatus عبر guest token binding.
2. إضافة اختبارات لهذا السيناريو.

### Priority 2 (أداء وتجربة)

1. تنفيذ Reverb + Echo + events.
2. الإبقاء على Polling كـ fallback تلقائي.

### Priority 3 (جودة بنيوية)

1. تحويل stage mapping إلى code/slug.
2. إضافة Feature Flags واستخدامها في controllers.

### Priority 4 (Accessibility وRTL)

1. إضافة tailwindcss-rtl.
2. إضافة Alt + C.
3. مراجعة keyboard flow النهائي.

### Priority 5 (اختبارات)

1. توسيع Feature tests للبنود الجديدة.
2. إضافة Frontend tests لحالات الجلسات والمودال.

---

## 7) تعريف جاهزية الإنتاج (Go-Live Checklist)

- أمان endpoint الزوار مكتمل.
- Reverb يعمل مع fallback polling.
- Feature flags مفعلة عبر .env.
- اختبارات backend والواجهة محدثة وناجحة.
- A11y keyboard checks مكتملة.
- مراقبة logs + timeout + queue failures فعالة.

---

## 8) ملاحظات هندسية

- النظام الحالي جيد جدا كأساس عملي.
- أكبر مخاطرة حاليا أمنية في endpoint الزوار.
- أفضل ترقية استراتيجية بعد الأمان هي Reverb لأنه يقلل latency ويحسن تجربة المستخدم.
- يوصى بتنفيذ الفجوات حسب الأولوية أعلاه وليس دفعة واحدة لتقليل مخاطر regressions.
