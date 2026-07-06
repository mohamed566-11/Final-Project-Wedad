# خطة دمج بيانات المريضة مع الشات بوت — الجزء الثاني (Backend Integration + Routes)

> تكملة لـ [الجزء الأول](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/chatbot_patient_data_plan_part1.md)
> يحتوي على: تعديلات ChatbotService، Controller، Routes، Form Request، API Resource

---

## 7. تعديلات `ChatbotService`

### 7.1 الدالة `buildContextualSystemPrompt()`

تم نقل هذه الدالة إلى `PatientDataCollectorService` لتجميع مهام إنشاء السياق في مكان واحد.

### 7.2 تعديل `sendMessage()`

الدالة `sendMessage()` تبقى كما هي لعدم حدوث تكرار (حقن مزدوج). سيتم عمل الحقن للسياق في الـ Queue Job للرسائل، أما المكونات الأخرى إن احتاجت سياقاً ستقوم بتجهيزه قبل رفع الطلب.
```

---

## 8. تعديلات `ProcessChatbotMessageJob`

**تعديل** [ProcessChatbotMessageJob.php](file:///D:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Jobs/ProcessChatbotMessageJob.php):

```diff
  public function __construct(
      private readonly AiChatMessage $userMessage,
      private readonly string $botType,
      private readonly array $history,
+     private readonly ?string $contextPrompt = null,
  ) {}

  public function handle(ChatbotService $chatbotService): void
  {
      // Update status to processing
      $metadata = $this->userMessage->metadata ?? [];
      $metadata['status'] = 'processing';
      $this->userMessage->update(['metadata' => $metadata]);

      try {
+         // Build history with context prompt injected
+         $historyWithContext = $this->history;
+         if ($this->contextPrompt && !empty(trim($this->contextPrompt))) {
+             array_unshift($historyWithContext, [
+                 'role'    => 'user',
+                 'content' => $this->contextPrompt,
+             ]);
+             array_unshift($historyWithContext, [
+                 'role'    => 'assistant',
+                 'content' => 'فهمت بيانات المريضة. سأستخدمها لتخصيص ردودي.',
+             ]);
+         }

          $reply = $chatbotService->callHuggingFace(
              botType: $this->botType,
              message: $this->userMessage->message,
-             chatHistory: $this->history,
+             chatHistory: $historyWithContext,
          );
          // ... rest unchanged ...
```

---

## 9. Form Request و API Resource

### 9.1 `UpdateChatbotPreferencesRequest`

**الملف**: `app/Http/Requests/Patient/UpdateChatbotPreferencesRequest.php`

```php
<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatbotPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        return [
            'data_access_enabled' => 'required|boolean',
            'share_predictions'   => 'sometimes|boolean',
            'share_trackers'      => 'sometimes|boolean',
            'share_medical_file'  => 'sometimes|boolean',
            'share_consultations' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'data_access_enabled.required' => 'يجب تحديد حالة تفعيل مشاركة البيانات',
            'data_access_enabled.boolean'  => 'القيمة يجب أن تكون true أو false',
        ];
    }
}
```

### 9.2 `ChatbotPreferenceResource`

**الملف**: `app/Http/Resources/Patient/ChatbotPreferenceResource.php`

```php
<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatbotPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'data_access_enabled' => $this->data_access_enabled,
            'share_predictions'   => $this->share_predictions,
            'share_trackers'      => $this->share_trackers,
            'share_medical_file'  => $this->share_medical_file,
            'share_consultations' => $this->share_consultations,
            'updated_at'          => $this->updated_at?->toISOString(),
        ];
    }
}
```

---

## 10. تعديلات `ChatbotController`

**تعديل** في [ChatbotController.php](file:///D:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Http/Controllers/Api/Patient/ChatbotController.php):

### 10.1 إضافة imports و constructor

```diff
  use App\Http\Controllers\Controller;
+ use App\Services\Patient\PatientDataCollectorService;
+ use App\Models\PatientChatbotPreference;
+ use App\Http\Requests\Patient\UpdateChatbotPreferencesRequest;
+ use App\Http\Resources\Patient\ChatbotPreferenceResource;
  use App\Traits\ApiResponse;

  class ChatbotController extends Controller
  {
      use ApiResponse;

+     public function __construct(
+         private PatientDataCollectorService $dataCollector,
+         private ChatbotService $chatbotService,
+     ) {}
```

### 10.2 تعديل `sendMessage()` لحقن السياق

**تعديل الدالة الموجودة** — إضافة context injection قبل dispatch الـ Job:

```php
public function sendMessage(Request $request): JsonResponse
{
    $user = auth('patient')->user();
    $botType = $this->resolveBotType($user);
    // ... existing validation & session logic ...

    // === NEW: جمع سياق المريضة ===
    $contextPrompt = null;
    if ($botType !== 'public' && config('chatbot.patient_context_enabled', false)) {
        $patientContext = $this->dataCollector->collectChatbotContext($user, $botType);

        if (!empty($patientContext)) {
            $rawPrompt    = $this->dataCollector->buildContextualSystemPrompt($patientContext);
            $contextPrompt = $this->chatbotService->sanitizeForExternalAi($rawPrompt);

            // Audit Trail
            Log::info('chatbot_patient_context_sent', [
                'user_id'  => $user->id,
                'bot_type' => $botType,
                'context_keys' => array_keys($patientContext),
            ]);
        }
    }

    // ... existing message creation logic ...

    // تعديل dispatch الـ Job ليتضمن contextPrompt
    if (app()->isLocal() && config('chatbot.process_sync_in_local', true)) {
        // Sync processing in local dev
        $historyWithContext = $history;
        if ($contextPrompt) {
            array_unshift($historyWithContext, [
                'role'    => 'user',
                'content' => $contextPrompt,
            ]);
            array_unshift($historyWithContext, [
                'role'    => 'assistant',
                'content' => 'فهمت بيانات المريضة. سأستخدمها لتخصيص ردودي.',
            ]);
        }
        $reply = $this->chatbotService->sendMessage($botType, $message, $historyWithContext);
        // ... handle reply ...
    } else {
        // Queue processing
        ProcessChatbotMessageJob::dispatch(
            $userMessage,
            $botType,
            $history,
            $contextPrompt, // ← parameter جديد
        );
    }

    // ... existing response logic ...
}
```

### 10.3 تعديل `sendWidgetMessage()` — نفس المنطق

```php
public function sendWidgetMessage(Request $request): JsonResponse
{
    $user = auth('patient')->user();
    $botType = ChatbotService::getBotTypeFromStage($user->life_stage_id);

    // === NEW: جمع سياق المريضة ===
    $contextPrompt = null;
    if ($botType !== 'public' && config('chatbot.patient_context_enabled', false)) {
        $patientContext = $this->dataCollector->collectChatbotContext($user, $botType);
        if (!empty($patientContext)) {
            $rawPrompt    = $this->dataCollector->buildContextualSystemPrompt($patientContext);
            $contextPrompt = $this->chatbotService->sanitizeForExternalAi($rawPrompt);
        }
    }

    // حقن السياق يدوياً في حالة الـ Widget Sync
    $historyWithContext = [];
    if ($contextPrompt) {
        $historyWithContext[] = [
            'role'    => 'user',
            'content' => $contextPrompt,
        ];
        $historyWithContext[] = [
            'role'    => 'assistant',
            'content' => 'فهمت بيانات المريضة. سأستخدمها لتخصيص ردودي.',
        ];
    }

    $result = $this->chatbotService->sendMessage(
        $botType,
        $request->input('message'),
        $historyWithContext
    );

    // ... existing response logic unchanged ...
}
```

### 10.4 إضافة Preferences endpoints — methods جديدة

```php
/**
 * GET /patient/chatbot/data-preferences
 * جلب إعدادات خصوصية بيانات المريضة
 */
public function getDataPreferences(): JsonResponse
{
    $user = auth('patient')->user();

    $preference = $user->chatbotPreference
        ?? new PatientChatbotPreference(
            PatientChatbotPreference::getDefaultsFor($user)
        );

    return $this->successResponse(
        new ChatbotPreferenceResource($preference),
        'إعدادات خصوصية البيانات'
    );
}

/**
 * PUT /patient/chatbot/data-preferences
 * تحديث إعدادات خصوصية بيانات المريضة
 */
public function updateDataPreferences(UpdateChatbotPreferencesRequest $request): JsonResponse
{
    $user = auth('patient')->user();

    $preference = PatientChatbotPreference::updateOrCreate(
        ['user_id' => $user->id],
        $request->validated(),
    );

    // إلغاء الـ Cache عند تغيير الإعدادات
    PatientDataCollectorService::invalidateCache($user->id);

    Log::info('chatbot_preferences_updated', [
        'user_id' => $user->id,
        'data_access_enabled' => $preference->data_access_enabled,
    ]);

    return $this->successResponse(
        new ChatbotPreferenceResource($preference),
        'تم تحديث إعدادات الخصوصية'
    );
}
```

---

## 11. تعديلات Routes

### إضافة في [patient.php](file:///D:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/routes/patient.php) — داخل chatbot group (سطر 319)

```diff
  Route::middleware(['auth:patient', 'PatientStatus'])->group(function () {
      Route::prefix('chatbot')->controller(\App\Http\Controllers\Api\Patient\ChatbotController::class)->group(function () {
          Route::post('/widget-message', 'sendWidgetMessage')->middleware('throttle:chatbot_auth');
          Route::post('/message', 'sendMessage')->middleware('throttle:chatbot_auth');
          Route::get('/config', 'getConfig');
          Route::get('/sessions', 'getSessions');
          Route::patch('/sessions/{sessionId}/rename', 'renameSession');
          Route::delete('/sessions/{sessionId}', 'deleteSession');
          Route::get('/sessions/{sessionId}/messages', 'getMessages');
          Route::post('/sessions/{sessionId}/reset', 'resetSession');
          Route::get('/messages/{messageId}/status', 'messageStatus');
          Route::delete('/messages', 'deleteAllMessages');
+
+         // === Patient Data Preferences ===
+         Route::get('/data-preferences', 'getDataPreferences');
+         Route::put('/data-preferences', 'updateDataPreferences');
      });
  });
```

> [!IMPORTANT]
> لا تعارض مع Routes موجودة — `/data-preferences` path فريد ولا يتعارض مع `/sessions/{sessionId}` أو `/messages/{messageId}`

---

## 12. Cache Invalidation في Controllers الموجودة

### إضافة في controllers الـ Trackers لإلغاء الـ Cache عند تحديث البيانات

**في كل Controller من:** `WeightController`, `MoodController`, `PregnancyController`, `AiPredictionController`

```php
// إضافة في أي method يحفظ/يحدث بيانات (store, update, destroy)
use App\Services\Patient\PatientDataCollectorService;

// بعد حفظ البيانات بنجاح:
PatientDataCollectorService::invalidateCache(auth('patient')->id());
```

**مثال عملي** — في `WeightController::store()`:

```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([...]);

    $entry = WeightEntry::create([
        'user_id' => auth('patient')->id(),
        ...$validated,
    ]);

    // === NEW: إلغاء Cache السياق ===
    PatientDataCollectorService::invalidateCache(auth('patient')->id());

    return $this->successResponse($entry, 'تم حفظ الوزن');
}
```

---

## 13. الأمان والخصوصية — ملخص تفصيلي

| # | الحماية | الآلية | الملف |
|--|---|---|---|
| 1 | **Opt-in صريح** | `data_access_enabled` = false افتراضياً | `PatientChatbotPreference` |
| 2 | **Feature Flag** | `chatbot.patient_context_enabled` في `.env` | `config/chatbot.php` |
| 3 | **PII Sanitization** | `sanitizeForExternalAi()` تُطبّق **دائماً** | `ChatbotService` |
| 4 | **No Raw Probabilities** | `risk_badge` accessor (خطورة عالية/متوسطة/منخفضة) | `GDM/PE/PTB models` |
| 5 | **Data Minimization** | `filterByBotType()` — كل بوت يرى فقط ما يحتاجه | `PatientDataCollectorService` |
| 6 | **Public Bot Isolation** | `if ($botType === 'public') return []` | `PatientDataCollectorService` |
| 7 | **Audit Trail** | `Log::info('chatbot_patient_context_sent')` | `ChatbotController` |
| 8 | **Graceful Degradation** | `try/catch` — لا يفشل الطلب إذا فشل جمع البيانات | `PatientDataCollectorService` |
| 9 | **Cache Isolation** | Key: `patient_chatbot_ctx:{userId}:{botType}` → كل مريضة/بوت منفصل | `PatientDataCollectorService` |
| 10 | **Instant Rollback** | تغيير `CHATBOT_PATIENT_CONTEXT_ENABLED=false` في `.env` | `config/chatbot.php` |

---

*تابع في [الجزء الثالث](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/chatbot_patient_data_plan_part3.md) — Frontend (Types, Service, Hook, Components) + Testing*
