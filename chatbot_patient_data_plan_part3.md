# خطة دمج بيانات المريضة مع الشات بوت — الجزء الثالث (Frontend + Testing)

> تكملة لـ [الجزء الثاني](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/chatbot_patient_data_plan_part2.md)
> يحتوي على: Frontend Types، Service، Hook، Components، وخطة الاختبار

---

## 14. الفرونت إند — الكود الكامل

### 14.1 إضافة Types في `chatbot.ts`

**إضافة في** [chatbot.ts](file:///D:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/types/chatbot.ts) — بعد سطر 55:

```typescript
// === Patient Data Preferences ===

export interface ChatbotDataPreferences {
    data_access_enabled: boolean;
    share_predictions: boolean;
    share_trackers: boolean;
    share_medical_file: boolean;
    share_consultations: boolean;
    updated_at: string | null;
}

export interface UpdatePreferencesPayload {
    data_access_enabled: boolean;
    share_predictions?: boolean;
    share_trackers?: boolean;
    share_medical_file?: boolean;
    share_consultations?: boolean;
}
```

### 14.2 إضافة في `chatbotService.ts`

**إضافة في** [chatbotService.ts](file:///D:/Final_Project_Implementation/Final_Project_Front_And_Back/Front-End/src/services/chatbotService.ts) — قبل سطر 151:

```typescript
import type {
    // ... existing imports ...
    ChatbotDataPreferences,
    UpdatePreferencesPayload,
} from "@/types/chatbot";

// إضافة داخل chatbotService object — قبل الـ closing brace:

    // ─── DATA PREFERENCES ────────────────────────────────────────────────────

    /**
     * جلب إعدادات خصوصية بيانات المريضة
     * Backend: GET /api/v1/patient/chatbot/data-preferences
     */
    getDataPreferences: async (): Promise<ChatbotDataPreferences> => {
        const response = await api.get("/patient/chatbot/data-preferences");
        return response.data.data || response.data;
    },

    /**
     * تحديث إعدادات خصوصية بيانات المريضة
     * Backend: PUT /api/v1/patient/chatbot/data-preferences
     */
    updateDataPreferences: async (
        payload: UpdatePreferencesPayload
    ): Promise<ChatbotDataPreferences> => {
        const response = await api.put("/patient/chatbot/data-preferences", payload);
        return response.data.data || response.data;
    },
```

### 14.3 Hook: `useChatbotPreferences.ts`

**ملف جديد**: `src/hooks/useChatbotPreferences.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatbotService } from "@/services/chatbotService";
import type { ChatbotDataPreferences, UpdatePreferencesPayload } from "@/types/chatbot";
import { toast } from "sonner";

export const CHATBOT_PREFERENCES_KEY = ["chatbot", "preferences"] as const;

const DEFAULTS: ChatbotDataPreferences = {
    data_access_enabled: false,
    share_predictions: true,
    share_trackers: true,
    share_medical_file: false,
    share_consultations: false,
    updated_at: null,
};

export function useChatbotPreferences() {
    const queryClient = useQueryClient();

    // جلب الإعدادات (Query)
    const { data: preferences = DEFAULTS, isLoading } = useQuery({
        queryKey: CHATBOT_PREFERENCES_KEY,
        queryFn: chatbotService.getDataPreferences,
    });

    // تحديث الإعدادات (Mutation with Optimistic Update)
    const mutation = useMutation({
        mutationFn: (payload: UpdatePreferencesPayload) => 
            chatbotService.updateDataPreferences(payload),
        
        onMutate: async (newPayload) => {
            // Cancel أي جلب حالي لتجنب تضارب البيانات
            await queryClient.cancelQueries({ queryKey: CHATBOT_PREFERENCES_KEY });
            
            // أخذ نسخة من القيم السابقة للـ Rollback
            const previousPrefs = queryClient.getQueryData<ChatbotDataPreferences>(CHATBOT_PREFERENCES_KEY);
            
            // تحديث مؤقت للـ Cache (Optimistic Update)
            queryClient.setQueryData<ChatbotDataPreferences>(CHATBOT_PREFERENCES_KEY, (old) => ({
                ...(old || DEFAULTS),
                ...newPayload,
            }));
            
            return { previousPrefs };
        },

        onError: (_err, _newPayload, context) => {
            // التراجع عن التعديل في حال حدوث خطأ
            if (context?.previousPrefs) {
                queryClient.setQueryData(CHATBOT_PREFERENCES_KEY, context.previousPrefs);
            }
            toast.error("فشل تحديث إعدادات الخصوصية");
        },

        onSuccess: () => {
            toast.success("تم تحديث إعدادات الخصوصية");
        },

        onSettled: () => {
            // تأكيد تماثل البيانات المجلوبة مع الباك إند
            queryClient.invalidateQueries({ queryKey: CHATBOT_PREFERENCES_KEY });
        },
    });

    const updatePreferences = async (payload: UpdatePreferencesPayload) => {
        try {
            await mutation.mutateAsync(payload);
            return true;
        } catch {
            return false;
        }
    };

    const toggleDataAccess = async (enabled: boolean) => {
        return updatePreferences({ data_access_enabled: enabled });
    };

    return {
        preferences,
        isLoading,
        isSaving: mutation.isPending,
        updatePreferences,
        toggleDataAccess,
        isEnabled: preferences.data_access_enabled,
    };
}
```

### 14.4 `PrivacyConsentModal.tsx`

**ملف جديد**: `src/components/chatbot/PrivacyConsentModal.tsx`

```tsx
import React from "react";
import { Shield, Check, X, Brain, Activity, FileText } from "lucide-react";

interface Props {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
    isLoading?: boolean;
}

const PrivacyConsentModal: React.FC<Props> = ({
    isOpen,
    onAccept,
    onDecline,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                dir="rtl"
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="bg-gradient-to-l from-purple-600 to-indigo-600 p-6 text-white text-center">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-7 h-7" />
                    </div>
                    <h2 className="text-lg font-bold">
                        تخصيص المساعدة الذكية
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                        اسمحي للمساعد باستخدام بياناتك الصحية لتقديم نصائح
                        مخصصة
                    </p>
                </div>

                {/* Features */}
                <div className="p-5 space-y-3">
                    {[
                        {
                            icon: Brain,
                            title: "نتائج التقييمات الذكية",
                            desc: "تنبؤات سكري الحمل، تسمم الحمل، الولادة المبكرة",
                        },
                        {
                            icon: Activity,
                            title: "المتتبعات الصحية",
                            desc: "الوزن، المزاج، الأدوية الحالية",
                        },
                        {
                            icon: FileText,
                            title: "بيانات الحمل",
                            desc: "أسبوع الحمل، موعد الولادة المتوقع",
                        },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                        >
                            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Privacy Note */}
                <div className="mx-5 mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        🔒 بياناتك مشفرة ولا تُخزَّن لدى الذكاء الاصطناعي. تُستخدم
                        فقط لتخصيص الرد الحالي. يمكنك إلغاء الموافقة في أي وقت.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-5 pt-0">
                    <button
                        onClick={onDecline}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium"
                    >
                        <X className="w-4 h-4" />
                        لاحقاً
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-l from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition text-sm font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                السماح
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyConsentModal;
```

### 14.5 `DataContextBadge.tsx`

**ملف جديد**: `src/components/chatbot/DataContextBadge.tsx`

```tsx
import React from "react";
import { Sparkles, ShieldOff } from "lucide-react";

interface Props {
    isEnabled: boolean;
    onClick?: () => void;
}

const DataContextBadge: React.FC<Props> = ({ isEnabled, onClick }) => {
    if (!isEnabled) {
        return (
            <button
                onClick={onClick}
                title="تفعيل التخصيص الذكي"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
            >
                <ShieldOff className="w-3.5 h-3.5" />
                <span>الوضع العام</span>
            </button>
        );
    }

    return (
        <div
            title="المساعد يستخدم بياناتك الصحية لتخصيص الردود"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-l from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
        >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>مخصص لبياناتك</span>
        </div>
    );
};

export default DataContextBadge;
```

### 14.6 `ChatbotPrivacySettings.tsx`

**ملف جديد**: `src/components/chatbot/ChatbotPrivacySettings.tsx`

```tsx
import React from "react";
import { Settings2, Brain, Activity, FileText, MessageSquare } from "lucide-react";
import type { ChatbotDataPreferences, UpdatePreferencesPayload } from "@/types/chatbot";

interface Props {
    preferences: ChatbotDataPreferences;
    onUpdate: (payload: UpdatePreferencesPayload) => Promise<boolean>;
    isSaving: boolean;
}

const TOGGLES = [
    { key: "share_predictions"   as const, icon: Brain,         label: "نتائج تقييمات الذكاء الاصطناعي", desc: "سكري الحمل، تسمم الحمل، الولادة المبكرة" },
    { key: "share_trackers"      as const, icon: Activity,      label: "المتتبعات الصحية",                desc: "الوزن، المزاج، الأدوية" },
    { key: "share_medical_file"  as const, icon: FileText,      label: "الملف الطبي",                    desc: "فئات الملفات الطبية المرفوعة" },
    { key: "share_consultations" as const, icon: MessageSquare,  label: "تاريخ الاستشارات",               desc: "ملخص الاستشارات السابقة" },
];

const ChatbotPrivacySettings: React.FC<Props> = ({ preferences, onUpdate, isSaving }) => {
    const handleToggle = (key: keyof Omit<UpdatePreferencesPayload, "data_access_enabled">, value: boolean) => {
        onUpdate({
            data_access_enabled: preferences.data_access_enabled,
            [key]: value,
        });
    };

    return (
        <div dir="rtl" className="space-y-4 p-4">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-l from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <Settings2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">التخصيص الذكي</p>
                        <p className="text-xs text-gray-500">السماح للمساعد باستخدام بياناتك</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={preferences.data_access_enabled}
                        onChange={(e) => onUpdate({ data_access_enabled: e.target.checked })}
                        disabled={isSaving}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-300 transition after:content-[''] after:absolute after:top-[2px] after:start-[2px] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:bg-white after:rounded-full after:h-5 after:w-5 after:transition" />
                </label>
            </div>

            {/* Sub-toggles */}
            {preferences.data_access_enabled && (
                <div className="space-y-2">
                    {TOGGLES.map(({ key, icon: Icon, label, desc }) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                                    <p className="text-xs text-gray-400">{desc}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences[key]}
                                    onChange={(e) => handleToggle(key, e.target.checked)}
                                    disabled={isSaving}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-300 peer-checked:bg-purple-500 rounded-full transition after:content-[''] after:absolute after:top-[2px] after:start-[2px] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:bg-white after:rounded-full after:h-4 after:w-4 after:transition" />
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatbotPrivacySettings;
```

---

## 15. خطة الاختبار (Verification Plan)

### 15.1 Unit Tests — Pest PHP

**ملف جديد**: `tests/Unit/PatientDataCollectorTest.php`

```php
<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Pregnancy;
use App\Models\GestationalDiabetesPrediction;
use App\Models\PatientChatbotPreference;
use App\Services\Patient\PatientDataCollectorService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

describe('PatientDataCollectorService', function () {

    it('returns empty array for public bot type', function () {
        $user = User::factory()->create();
        $service = new PatientDataCollectorService();

        config(['chatbot.patient_context_enabled' => true]);
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);

        $result = $service->collectChatbotContext($user, 'public');

        expect($result)->toBe([]);
    });

    it('returns empty array when feature flag is disabled', function () {
        $user = User::factory()->create();
        $service = new PatientDataCollectorService();

        config(['chatbot.patient_context_enabled' => false]);

        $result = $service->collectChatbotContext($user, 'pregnancy');

        expect($result)->toBe([]);
    });

    it('returns empty array when data_access_enabled is false', function () {
        $user = User::factory()->create();
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => false,
        ]);
        $service = new PatientDataCollectorService();

        config(['chatbot.patient_context_enabled' => true]);

        $result = $service->collectChatbotContext($user, 'pregnancy');

        expect($result)->toBe([]);
    });

    it('collects profile data correctly', function () {
        $user = User::factory()->create(['age' => 28]);
        UserProfile::create([
            'user_id' => $user->id,
            'height' => 165,
            'weight' => 70,
            'blood_type' => 'O+',
            'chronic_diseases' => ['أنيميا'],
        ]);
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);
        $service = new PatientDataCollectorService();
        config(['chatbot.patient_context_enabled' => true]);

        $result = $service->collectChatbotContext($user->fresh(), 'pre_marriage');

        expect($result)->toHaveKey('profile');
        expect($result['profile']['blood_type'])->toBe('O+');
        expect($result['profile']['chronic_diseases'])->toContain('أنيميا');
    });

    it('caches context after first collection', function () {
        $user = User::factory()->create();
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);
        $service = new PatientDataCollectorService();
        config(['chatbot.patient_context_enabled' => true]);

        // First call — cache miss
        $service->collectChatbotContext($user, 'pre_marriage');

        // Verify cached
        $cached = $service->getCachedContext($user, 'pre_marriage');
        expect($cached)->not->toBeNull();
        expect($cached)->toHaveKey('context_version');
    });

    it('invalidateCache clears all bot type caches', function () {
        $user = User::factory()->create();
        $prefix = config('chatbot.patient_context.cache_prefix', 'patient_chatbot_ctx');

        Cache::put("{$prefix}:{$user->id}:pre_marriage", ['test'], 60);
        Cache::put("{$prefix}:{$user->id}:pregnancy", ['test'], 60);

        PatientDataCollectorService::invalidateCache($user->id);

        expect(Cache::get("{$prefix}:{$user->id}:pre_marriage"))->toBeNull();
        expect(Cache::get("{$prefix}:{$user->id}:pregnancy"))->toBeNull();
    });

    it('predictions never include raw probabilities', function () {
        $user = User::factory()->create();
        $pregnancy = Pregnancy::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);
        GestationalDiabetesPrediction::create([
            'user_id' => $user->id,
            'pregnancy_id' => $pregnancy->id,
            'risk_level' => 'High Risk',
            'risk_probability' => 0.87,  // هذا الرقم يجب ألا يظهر
        ]);
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);
        $service = new PatientDataCollectorService();
        config(['chatbot.patient_context_enabled' => true]);

        $result = $service->collectChatbotContext($user->fresh(), 'pregnancy');

        // التأكد من عدم وجود probability خام
        $json = json_encode($result);
        expect($json)->not->toContain('0.87');
        expect($json)->not->toContain('probability');
    });
});
```

### 15.2 Feature Tests

**ملف جديد**: `tests/Feature/ChatbotContextTest.php`

```php
<?php

use App\Models\User;
use App\Models\PatientChatbotPreference;
use Tests\TestCase;

uses(TestCase::class);

describe('Chatbot Data Preferences API', function () {

    it('GET /data-preferences returns defaults for new user', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'patient')
            ->getJson('/api/v1/patient/chatbot/data-preferences');

        $response->assertOk()
            ->assertJsonFragment(['data_access_enabled' => false]);
    });

    it('PUT /data-preferences enables data access', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'patient')
            ->putJson('/api/v1/patient/chatbot/data-preferences', [
                'data_access_enabled' => true,
            ]);

        $response->assertOk()
            ->assertJsonFragment(['data_access_enabled' => true]);

        $this->assertDatabaseHas('patient_chatbot_preferences', [
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);
    });

    it('PUT /data-preferences validates required field', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'patient')
            ->putJson('/api/v1/patient/chatbot/data-preferences', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('data_access_enabled');
    });
});
```

### 15.3 أوامر التشغيل

```bash
# تشغيل Migration
cd D:\Final_Project_Implementation\Final_Project_Front_And_Back\Back-end
php artisan migrate

# تشغيل الاختبارات
php artisan test --filter=PatientDataCollector
php artisan test --filter=ChatbotContext

# تشغيل كل اختبارات الشات بوت
php artisan test --filter=Chatbot
```

---

## 16. خطة التنفيذ المرحلية — ملخص

| المرحلة | المدة | الملفات | الوصف |
|---|---|---|---|
| **A** | ~1 ساعة | Migration + Model + Config + User relationship | قاعدة البيانات والأساسيات |
| **B** | ~2 ساعة | `PatientDataCollectorService.php` | الـ Service الرئيسي (7 builders + cache) |
| **C** | ~1.5 ساعة | `ChatbotService.php` + `ProcessChatbotMessageJob.php` | بناء System Prompt + تعديل sendMessage |
| **D** | ~1.5 ساعة | Controller + Routes + Request + Resource | REST API endpoints |
| **E** | ~0.5 ساعة | System Prompts ملفات | إضافة section للسياق |
| **F** | ~3 ساعات | 6 ملفات React/TypeScript | Frontend components + hook |
| **G** | ~1 ساعة | 2 ملفات اختبار | Unit + Feature tests |

**المجموع**: ~10.5 ساعات عمل

---

## 17. قواعد مهمة أثناء التنفيذ

> [!CAUTION]
> **قاعدة #1**: البوت العام (`public`) لا يستقبل أي بيانات شخصية — أبداً.

> [!WARNING]
> **قاعدة #2**: لا نرسل raw probabilities (0.87) — فقط وصف نصي (خطورة عالية).

> [!IMPORTANT]
> **قاعدة #3**: كل بيانات تمر عبر `sanitizeForExternalAi()` قبل إرسالها.

> [!TIP]
> **قاعدة #4**: Feature Flag → `.env` → تراجع فوري بدون deploy.

---

*نهاية الخطة الشاملة — 3 أجزاء:*
1. [الجزء الأول](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/chatbot_patient_data_plan_part1.md) — Backend Foundation (Migration, Model, Service, Config)
2. [الجزء الثاني](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/chatbot_patient_data_plan_part2.md) — Backend Integration (ChatbotService, Controller, Routes)
3. **الجزء الثالث** (هذا الملف) — Frontend + Testing
