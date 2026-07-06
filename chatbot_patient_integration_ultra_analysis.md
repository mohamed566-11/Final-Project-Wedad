# 🩺 التحليل التقني الشامل (Ultra Analysis) لنظام ربط الذكاء الاصطناعي ببيانات المريضة

هذا التقرير يستعرض هندسة البرمجيات (Software Architecture) خلف نظام "وداد الذكي" وكيفية دمج بيانات المريضة مع الشات بوت، مع شرح الأكواد خطوة بخطوة للمطورين.

---

## 🏗️ 1. دورة حياة الرسالة (Message Lifecycle Architecture)
عندما تكتب المريضة رسالة في تطبيق React، تمر البيانات بالرحلة التالية:
1. **Frontend (React)**: يُرسل الرسالة عبر API إلى Laravel.
2. **Backend (Laravel Controller)**: يطلب من الـ [PatientDataCollectorService](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Services/Patient/PatientDataCollectorService.php#17-565) جمع بيانات المريضة وبناء "سياق خفي" (Hidden Context).
3. **Queue (Redis & Job)**: يتم تحويل الرسالة مع هذا السياق إلى طابور المعالجة [ProcessChatbotMessageJob](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Jobs/ProcessChatbotMessageJob.php#14-89) لعدم تأخير الواجهة.
4. **Service (ChatbotService)**: يرسل الطلب النهائي (الرسالة + السياق) إلى واجهة البايثون (Gradio API).
5. **AI Engine (Python/Gradio)**:
   - يبحث في **Pinecone** عن المعلومات الطبية لإضافتها لـ `{context}`.
   - يُعالج الـ Prompt المدمج ويُرسل الرد النهائي.

---

## 🗄️ 2. طبقة قاعدة البيانات والصلاحيات (Database & Opt-In)
بسبب حساسية البيانات، تبنينا مبدأ أمان يُسمى **"الاختيار الصريح" (Opt-In)**، حيث تكون الميزة مغلّفة ومطفيّة افتراضياً.

### هيكل البيانات (Migration)
```php
Schema::create('patient_chatbot_preferences', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
    $table->boolean('data_access_enabled')->default(false); // المفتاح الرئيسي
    $table->boolean('share_predictions')->default(true);
    $table->boolean('share_trackers')->default(true);
    $table->boolean('share_consultations')->default(false); // إضافة الاستشارات
    $table->timestamps();
});
```

> 💡 **تحليل تقني:** استخدام `unique` على `user_id` يجعل العلاقة `1:1` دقيقة. و`cascadeOnDelete` تضمن عدم بقاء صلوحيات عند حذف الحساب.

---

## ⚙️ 3. محرك التجميع الديناميكي (PatientDataCollectorService)
هذا المحرك هو "قلب" النظام. وظيفته تجميع التفاصيل من أكثر من جدول (Profile, Pregnancy, Predictions, Consultations) بطريقة ذكية (Minimization) لا تخنق الـ AI.

### جزء من كود جمع البيانات:
```php
public function collectChatbotContext(User $user, string $botType): array
{
    // 1. فحص هل البوت يدعم الخصوصية؟ (البوت العام يطرد فوراً)
    if ($botType === 'public') return [];

    // 2. التحقق من موافقة المريضة من جدول Preferences
    $preference = $user->chatbotPreference;
    if (!$preference || !$preference->isDataAccessEnabled()) return [];

    // 3. محاولة جلب البيانات من الـ Cache بدلاً من ضربات الداتابيز
    if ($cached = $this->getCachedContext($user, $botType)) return $cached;

    // 4. بناء السياق المخصص
    $context = ['profile' => $this->buildProfileData($user)];

    // دمج الاستشارات الأخيرة إذا وافقت المريضة
    if ($preference->share_consultations) {
        $context['recent_consultations'] = $this->buildConsultationsData($user);
    }
    
    // 5. حفظ النتيجة في Redis وتصفية الباقي
    $context = $this->filterByBotType($context, $botType);
    $this->cacheContext($user, $botType, $context);
    
    return $context;
}
```

> 💡 **تحليل تقني (Cache):** نستخدم Redis بـ Cache Key مميز لكل مستخدم وبوت `patient_chatbot_ctx:{userId}:{botType}` لمدة 30 دقيقة. هذا يوفر مئات الـ SQL Queries المعقدة في كل عملية شات.

---

## 🛡️ 4. الضمانات السريرية وتقليص البيانات (Clinical Guardrails)

من أبرز إنجازاتنا تفادي صدمة المريضة بأرقام التنبؤات (Machine Learning Predictions)، فالبوت لا يجب أن يعطيها أرقاماً قد لا تفهمها.
### كود إخفاء الاحتماليات:
```php
private function buildPredictionsData(User $user, string $botType): array {
    $predictions = [];
    $gdm = $user->gestationalDiabetesPredictions()->latest()->first();

    if ($gdm) {
        $predictions['gdm'] = [
            'risk_level' => strtolower($gdm->risk_level),
            'risk_label' => $gdm->risk_badge, // 'خطورة عالية' بدل '0.85'
            'date'       => $gdm->created_at->format('Y-m-d'),
        ];
    }
    // ...
}
```

---

## 💉 5. حقن السياق في الـ Prompt الخلفي (System Prompt Injection)

بعد جمع البيانات (كمصفوفة Array)، نقوم بتحويلها إلى نص مفهوم للـ LLM وتغليفها بإرشادات صارمة الدقة في محتويات الرد:

```php
public function buildContextualSystemPrompt(array $patientContext): string
{
    $lines = [];
    $lines[] = '╔══════════════════════════════════════════╗';
    $lines[] = '║     📋 بيانات المريضة الصحية السرية     ║';
    $lines[] = '╚══════════════════════════════════════════╝';
    
    // طباعة الملفات الشخصية
    if (!empty($patientContext['profile'])) {
        $p = $patientContext['profile'];
        $lines[] = "  • العمر: {$p['age']} سنة";
        if (isset($p['blood_type'])) $lines[] = "  • فصيلة الدم: {$p['blood_type']}";
    }
    
    // شروط صارمة جداً للبوت
    $lines[] = '1. استخدمي البيانات أعلاه لتخصيص ردودك فقط.';
    $lines[] = '2. لا تذكري الأرقام والنسب بل استخدمي وصف الحالة.';
    $lines[] = '3. الأولوية لسلامة المريضة — بروتوكول الطوارئ مُقدم على كل شيء.';
    
    return implode("\n", $lines);
}
```
**كيف يُرسل هذا للذكاء الاصطناعي؟**
تخيل تاريخ الشات [history](file:///d:/Final_Project_Implementation/Final_Project_Front_And_Back/Back-end/app/Models/GestationalDiabetesPrediction.php#94-98) عبارة عن Array. نستخدم `array_unshift` لإجبار هذا السياق على أن يكون **الرسالة الصفرية (المخفية)**:
```php
$historyWithContext = $this->history;
array_unshift($historyWithContext, [
    'role'    => 'user',
    'content' => $this->contextPrompt, // هنا نضع نص البيانات الكبير
]);
array_unshift($historyWithContext, [
    'role'    => 'assistant',
    'content' => 'فهمت بيانات المريضة. سأستخدمها لتخصيص ردودي.',
]);
```
> 💡 **تحليل تقني:** هذه الحيلة تُسمى "Pre-filling" او "Roleplay Injection". نجعل الذكاء الاصطناعي يعتقد أن المريضة أعطته الملف، وهو رد بأنه فهمه، وبذلك تصبح الاستجابة القادمة دقيقة وملتزمة بالسياق بشكل مُدهش!

---

## 🌲 6. تكامل Pinecone و الـ RAG في البايثون (Python AI Integration)

في بيئة الجراديو (Gradio)، النظام يحتاج لمعرفة معلومات علمية ليجيب عليها.

```python
# app.py (Retrieval setup)
docsearch = PineconeVectorStore.from_existing_index(
    index_name="pregnancy-chatbot", namespace="pregnancy"
)
retriever = docsearch.as_retriever(search_kwargs={"k": 3})

# prompt.py (System Prompt)
system_prompt = """
أنتِ "وداد" مساعدة صحية ذكية متخصصة.
استخدمي المعلومات المسترجعة من قاعدة المعرفة ({context}) كمصدر أساسي لردودك.
"""

# app.py (Langchain Setup)
rag_chain = (
    {"context": retriever | format_docs, "input": RunnablePassthrough()}
    | prompt_template | chatModel | StrOutputParser()
)
```
> 💡 **تحليل تقني:** 
> المتغير `{context}` يمتلئ بالوثائق التي رفعها الأدمن إلى Pinecone بطريقة الـ Vector Search، بينما المتغير المتأتي من الـ Backend (بيانات المريضة) يكون محقوناً من خلال تدفق `chatHistory`. هكذا تجمع "وداد" بين الوعي العام (العلم) والوعي الخاص (حالة المريضة).

---

## 🖥️ 7. واجهة المستخدم وتجربة تفاعلية (Frontend Optimistic UI)

استخدمنا نمط الـ Optimistic UI في الـ `React Query` لتعديل إعدادات الخصوصية، لكي تشعر المريضة بسرية وسرعة فائقة.

```typescript
// useChatbotPreferences.ts
const mutation = useMutation({
    mutationFn: (payload) => chatbotService.updateDataPreferences(payload),
    onMutate: async (newPayload) => {
        await queryClient.cancelQueries({ queryKey: CHATBOT_PREFERENCES_KEY });
        const previousPrefs = queryClient.getQueryData(CHATBOT_PREFERENCES_KEY);
        
        // Optimistic Update: تعديل الواجهة قبل رد الباك إند!
        queryClient.setQueryData(CHATBOT_PREFERENCES_KEY, (old) => ({
            ...old, ...newPayload
        }));
        
        return { previousPrefs };
    },
    onError: (err, newPayload, context) => {
        // Rollback إذا حدث فشل
        queryClient.setQueryData(CHATBOT_PREFERENCES_KEY, context?.previousPrefs);
    }
});
```

---

## 🎉 خلاصة النظام النهائي
لقد تم تجهيز نظام يُعد من أقوى أنظمة **الرعاية الصحية بالذكاء الاصطناعي (Healthcare AI):**
- **الدقة:** يفهم حالة المريضة من الاستشارات والأمراض السابقة والتنبؤات.
- **السلامة:** يمنع الإفتاء بالأرقام الخام ويتبع بروتوكول طوارئ مشدد.
- **الخفة والسرعة:** يستخدم ميكانيزمات عالية الأداء مثل Redis Caching لتقليل زمن الاستجابة، و SSE (Server-Sent Events) لتوفير تدفق الكتابة كأنه إنسان، إلى جانب Optimistic UI بالواجهة.
