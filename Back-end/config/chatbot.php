<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Bot Endpoints (Gradio Spaces on Hugging Face)
    |--------------------------------------------------------------------------
    | كل بوت له Space خاص على Hugging Face - Public Spaces
    */
    'bots' => [
        'public' => [
            'url' => env('CHATBOT_PUBLIC_URL', 'https://widad-health-widad-public-health-chatbot.hf.space'),
            'name' => 'وداد - المساعد العام',
            'authenticated_name' => 'وداد',
            'welcome_message' => 'أهلاً بك في منصة وداد! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟',
            'suggested_questions' => [
                'ما هي منصة وداد؟',
                'ما هي الخدمات المتاحة؟',
                'كيف أسجل في المنصة؟',
                'ما هي باقات الاشتراك؟',
            ],
        ],
        'pre_marriage' => [
            'url' => env('CHATBOT_PREMARRIAGE_URL', 'https://widad-health-widad-premarital-chatbot.hf.space'),
            'name' => 'وداد - مرحلة ما قبل الزواج',
            'welcome_message' => 'أهلاً بكِ! أنا مساعدتكِ في مرحلة ما قبل الزواج. يمكنني مساعدتكِ بالنصائح الصحية والنفسية.',
            'suggested_questions' => [
                'ما هي الفحوصات المطلوبة قبل الزواج؟',
                'نصائح للتغذية السليمة',
                'كيف أهتم بصحتي النفسية؟',
            ],
        ],
        'pregnancy' => [
            'url' => env('CHATBOT_PREGNANCY_URL', 'https://widad-health-wedad-pregnancy-chatbot.hf.space'),
            'name' => 'وداد - مرحلة الحمل',
            'welcome_message' => 'أهلاً بكِ! أنا مساعدتكِ في مرحلة الحمل. اسأليني عن أي شيء يتعلق بصحتكِ وصحة جنينكِ.',
            'suggested_questions' => [
                'ما هي أعراض الحمل الطبيعية؟',
                'جدول متابعة الحمل',
                'نصائح التغذية أثناء الحمل',
                'متى يجب أن أذهب للطبيب؟',
            ],
        ],
        'motherhood' => [
            'url' => env('CHATBOT_MOTHERHOOD_URL', 'https://widad-health-widad-postpartum-chatbot.hf.space'),
            'name' => 'وداد - مرحلة الأمومة',
            'welcome_message' => 'أهلاً بكِ أيتها الأم! أنا هنا لمساعدتكِ في رحلة الأمومة. اسأليني عن أي شيء.',
            'suggested_questions' => [
                'نصائح الرضاعة الطبيعية',
                'جدول تطعيمات الطفل',
                'كيف أتعامل مع اكتئاب ما بعد الولادة؟',
                'متى يبدأ الطفل بالأكل؟',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Gradio API Settings
    |--------------------------------------------------------------------------
    */
    'gradio' => [
        'api_path' => '/gradio_api/call',
        'chat_endpoint' => '/chatbot_fn',
        'reset_endpoint' => '/reset_chat',
        'admin_endpoint' => '/get_admin_data',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting & Constraints
    |--------------------------------------------------------------------------
    */
    'limits' => [
        'public_rate_per_minute' => (int) env('CHATBOT_PUBLIC_RATE_LIMIT', 10),
        'auth_rate_per_minute' => (int) env('CHATBOT_AUTH_RATE_LIMIT', 30),
        'max_message_length' => (int) env('CHATBOT_MAX_MESSAGE_LENGTH', 1000),
        'max_history_messages' => (int) env('CHATBOT_MAX_HISTORY_MESSAGES', 20),
        // Hugging Face Spaces may need longer warm-up time.
        'request_timeout' => (int) env('CHATBOT_REQUEST_TIMEOUT', 60),
        'request_max_attempts' => (int) env('CHATBOT_REQUEST_MAX_ATTEMPTS', 5),
        'request_retry_delay_seconds' => (int) env('CHATBOT_REQUEST_RETRY_DELAY_SECONDS', 4),
    ],

    /*
    |--------------------------------------------------------------------------
    | Local Dev Processing Mode
    |--------------------------------------------------------------------------
    | When enabled in local env, patient chatbot messages are processed
    | synchronously to avoid relying on queue workers during development.
    */
    'process_sync_in_local' => env('CHATBOT_PROCESS_SYNC_IN_LOCAL', true),

    /*
    |--------------------------------------------------------------------------
    | Life Stage → Bot Type Mapping
    |--------------------------------------------------------------------------
    | ربط life_stage_id (من جدول life_stages) بنوع البوت
    */
    'stage_mapping' => [
        1 => 'pre_marriage',   // ما قبل الزواج
        2 => 'pregnancy',      // الحمل
        3 => 'motherhood',     // الأمومة
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Settings (Redis)
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'enabled' => env('CHATBOT_CACHE_ENABLED', true),
        'ttl_hours' => (int) env('CHATBOT_CACHE_TTL_HOURS', 24),
        'max_message_length' => 150,
        'exclude_with_history' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin Key for HF Bot Admin Data
    |--------------------------------------------------------------------------
    */
    'admin_api_key' => env('CHATBOT_ADMIN_API_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Patient Context Feature Flag
    |--------------------------------------------------------------------------
    | تفعيل/إيقاف ميزة دمج بيانات المريضة مع الشات بوت
    | يمكن تغييرها في .env للتراجع الفوري
    */
    'patient_context_enabled' => env('CHATBOT_PATIENT_CONTEXT_ENABLED', false),

    'patient_context' => [
        'cache_ttl_minutes' => (int) env('CHATBOT_CONTEXT_CACHE_TTL', 30),
        'cache_prefix' => 'patient_chatbot_ctx',
    ],

];
